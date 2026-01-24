import { zodToJsonSchema } from "zod-to-json-schema";
import type { z } from "zod";
import type {
  OpenRouterConfig,
  OpenRouterRequest,
  OpenRouterResponse,
  ModelParameters,
  CompletionConfig,
  GenerateFlashcardsOptions,
  OpenRouterMessage,
} from "./openrouter.types";
import {
  OpenRouterAPIError,
  OpenRouterRateLimitError,
  OpenRouterTimeoutError,
  OpenRouterValidationError,
  OpenRouterConfigError,
} from "./openrouter.errors";
import { FlashcardsResponseSchema, OpenRouterConfigSchema } from "../schemas/openrouter.schema";
import type { SuggestedCardDTO } from "../../types";

/**
 * Service for communicating with OpenRouter.ai API
 * Provides type-safe, validated LLM completions with structured outputs
 */
export class OpenRouterService {
  private readonly config: Required<OpenRouterConfig>;
  private requestTimestamps: number[] = [];
  private readonly maxRequestsPerMinute = 10;

  /**
   * List of supported LLM models
   */
  public readonly supportedModels = ["openai/gpt-oss-120b:free"] as const;

  /**
   * Initialize OpenRouter service with configuration
   * @param config - Service configuration including API key
   * @throws OpenRouterConfigError if configuration is invalid
   */
  constructor(config: OpenRouterConfig) {
    // Validate configuration using Zod schema
    const validationResult = OpenRouterConfigSchema.safeParse(config);
    if (!validationResult.success) {
      throw new OpenRouterConfigError(`Invalid configuration: ${validationResult.error.message}`);
    }

    this.config = validationResult.data as Required<OpenRouterConfig>;

    this.log("info", `OpenRouterService initialized with model: ${this.config.defaultModel}`);
  }

  /**
   * Generate flashcards from input text using LLM
   * @param inputText - Source text (1000-10000 characters)
   * @param options - Optional generation parameters
   * @returns Array of 5-10 suggested flashcards
   * @throws OpenRouterValidationError if input is invalid
   * @throws OpenRouterRateLimitError if rate limit exceeded
   * @throws OpenRouterTimeoutError if request times out
   * @throws OpenRouterAPIError if API returns an error
   */
  async generateFlashcards(inputText: string, options: GenerateFlashcardsOptions = {}): Promise<SuggestedCardDTO[]> {
    // Validate input text
    this.validateInputText(inputText);

    // Validate card limits
    const minCards = options.minCards ?? 5;
    const maxCards = options.maxCards ?? 10;

    if (minCards < 1 || minCards > maxCards || maxCards > 10) {
      throw new OpenRouterValidationError("Invalid card limits: minCards must be 1-10 and <= maxCards");
    }

    // Prepare prompts
    const systemPrompt = options.systemPrompt ?? this.getFlashcardSystemPrompt(minCards, maxCards);

    this.log("info", "Generating flashcards", {
      inputLength: inputText.length,
      model: options.model ?? this.config.defaultModel,
      minCards,
      maxCards,
    });

    // Execute completion
    const result = await this.generateCompletion({
      systemPrompt,
      userPrompt: inputText,
      model: options.model,
      responseSchema: FlashcardsResponseSchema,
      responseSchemaName: "flashcard_generation",
      parameters: {
        temperature: options.temperature ?? 0.7,
        maxTokens: options.maxTokens ?? 2000,
      },
    });

    return result.cards;
  }

  /**
   * Generic completion method for custom schemas
   * @param config - Completion configuration with schema
   * @returns Validated response matching the schema
   * @throws OpenRouterError variants on failure
   */
  async generateCompletion<T>(config: CompletionConfig<T>): Promise<T> {
    // Check client-side rate limit
    this.checkRateLimit();

    const model = config.model ?? this.config.defaultModel;

    // Build request
    const request = this.buildRequest(
      config.systemPrompt,
      config.userPrompt,
      config.responseSchema,
      config.responseSchemaName,
      model,
      config.parameters ?? {}
    );

    // Execute with retry logic
    const response = await this.executeRequestWithRetry(request);

    // Parse and validate response
    return this.parseResponse(response, config.responseSchema);
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Build OpenRouter API request with structured output
   */
  private buildRequest<T>(
    systemPrompt: string,
    userPrompt: string,
    responseSchema: z.ZodSchema<T>,
    schemaName: string,
    model: string,
    parameters: ModelParameters
  ): OpenRouterRequest {
    const messages: OpenRouterMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ];

    const jsonSchema = zodToJsonSchema(responseSchema, {
      name: schemaName,
      $refStrategy: "none",
    });

    return {
      model,
      messages,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: schemaName,
          strict: true,
          schema: jsonSchema as Record<string, unknown>,
        },
      },
      temperature: parameters.temperature ?? 0.7,
      max_tokens: parameters.maxTokens ?? 2000,
      top_p: parameters.topP ?? 1.0,
      frequency_penalty: parameters.frequencyPenalty ?? 0,
      presence_penalty: parameters.presencePenalty ?? 0,
    };
  }

  /**
   * Execute HTTP request to OpenRouter API with timeout
   */
  private async executeRequest(request: OpenRouterRequest): Promise<OpenRouterResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      this.log("info", "Sending request to OpenRouter", {
        model: request.model,
        messageCount: request.messages.length,
      });

      const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://10x-cards.app",
          "X-Title": "10x Cards",
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === "AbortError") {
        throw new OpenRouterTimeoutError(`Request timed out after ${this.config.timeout}ms`);
      }

      throw error;
    }
  }

  /**
   * Execute request with retry logic for transient failures
   */
  private async executeRequestWithRetry(request: OpenRouterRequest, maxRetries = 3): Promise<OpenRouterResponse> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await this.executeRequest(request);
      } catch (error) {
        lastError = error as Error;

        // Don't retry client errors (4xx except 429)
        if (error instanceof OpenRouterAPIError) {
          if (error.status >= 400 && error.status < 500 && error.status !== 429) {
            throw error;
          }
        }

        // Don't retry validation errors
        if (error instanceof OpenRouterValidationError) {
          throw error;
        }

        // Wait before retry (exponential backoff)
        if (attempt < maxRetries - 1) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
          this.log("warn", `Retrying after ${delay}ms`, { attempt, error: lastError.message });
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    // If we've exhausted all retries, throw the last error
    if (lastError) {
      throw lastError;
    }

    // This should never happen, but TypeScript needs this for exhaustiveness
    throw new Error("Request failed without error");
  }

  /**
   * Parse and validate API response
   */
  private parseResponse<T>(response: OpenRouterResponse, schema: z.ZodSchema<T>): T {
    // Check response structure
    if (!response.choices || response.choices.length === 0) {
      throw new OpenRouterValidationError("Invalid response structure: missing choices");
    }

    // Extract content
    const content = response.choices[0].message?.content;
    if (!content) {
      throw new OpenRouterValidationError("Invalid response structure: missing content");
    }

    // Parse JSON
    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch (error) {
      throw new OpenRouterValidationError("Failed to parse response as JSON", {
        cause: error,
      });
    }

    // Validate against schema
    const result = schema.safeParse(parsed);
    if (!result.success) {
      throw new OpenRouterValidationError("Response validation failed", {
        zodError: result.error,
      });
    }

    return result.data;
  }

  /**
   * Handle HTTP error responses from API
   */
  private async handleErrorResponse(response: Response): Promise<never> {
    const status = response.status;
    let errorBody: unknown;

    try {
      errorBody = await response.json();
    } catch {
      errorBody = { error: await response.text() };
    }

    this.log("error", "API error", { status, error: errorBody });

    switch (status) {
      case 401:
        throw new OpenRouterAPIError("Invalid API key", status, errorBody);

      case 404:
        throw new OpenRouterAPIError("Model not found or not available", status, errorBody);

      case 429: {
        const retryAfter = response.headers.get("Retry-After");
        throw new OpenRouterRateLimitError("Rate limit exceeded", parseInt(retryAfter || "60", 10), errorBody);
      }

      case 500:
      case 502:
      case 503:
        throw new OpenRouterAPIError("OpenRouter service error", status, errorBody);

      default:
        throw new OpenRouterAPIError(`API request failed with status ${status}`, status, errorBody);
    }
  }

  /**
   * Check client-side rate limit
   */
  private checkRateLimit(): void {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    // Remove old timestamps
    this.requestTimestamps = this.requestTimestamps.filter((ts) => ts > oneMinuteAgo);

    if (this.requestTimestamps.length >= this.maxRequestsPerMinute) {
      throw new OpenRouterRateLimitError("Client-side rate limit exceeded", 60);
    }

    this.requestTimestamps.push(now);
  }

  /**
   * Validate input text length
   */
  private validateInputText(text: string): void {
    if (typeof text !== "string") {
      throw new OpenRouterValidationError("Input text must be a string");
    }

    const length = text.trim().length;

    if (length < 1000) {
      throw new OpenRouterValidationError(`Input text too short (${length}/1000 characters minimum)`);
    }

    if (length > 10000) {
      throw new OpenRouterValidationError(`Input text too long (${length}/10000 characters maximum)`);
    }
  }

  /**
   * Generate system prompt for flashcard generation
   */
  private getFlashcardSystemPrompt(minCards: number, maxCards: number): string {
    return `You are an expert educational content creator specializing in flashcard generation.

Your task is to analyze the provided text and create ${minCards}-${maxCards} high-quality flashcards.

Requirements:
- Each flashcard must have a "front" (question/prompt) and "back" (answer)
- Front: 1-200 characters - should be clear, specific questions or prompts
- Back: 1-500 characters - should be concise but complete answers
- Focus on key concepts, definitions, processes, and important facts
- Questions should test understanding, not just memorization
- Avoid ambiguous or trick questions
- Prioritize quality over quantity

Format your response as a JSON object with a "cards" array containing the flashcards.`;
  }

  /**
   * Structured logging helper
   */
  private log(level: "info" | "warn" | "error", message: string, meta?: Record<string, unknown>): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      service: "OpenRouterService",
      level,
      message,
      ...(meta && { meta }),
    };

    if (level === "error") {
      console.error(JSON.stringify(logEntry));
    } else if (level === "warn") {
      console.warn(JSON.stringify(logEntry));
    } else {
      console.log(JSON.stringify(logEntry));
    }
  }
}
