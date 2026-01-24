import type { z } from "zod";

// ============================================================================
// OpenRouter API Request/Response Types
// ============================================================================

/**
 * Message structure for OpenRouter chat completions
 */
export interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * Response format configuration for structured JSON outputs
 */
export interface OpenRouterResponseFormat {
  type: "json_schema";
  json_schema: {
    name: string;
    strict: true;
    schema: Record<string, unknown>;
  };
}

/**
 * Complete request structure for OpenRouter API
 */
export interface OpenRouterRequest {
  model: string;
  messages: OpenRouterMessage[];
  response_format?: OpenRouterResponseFormat;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

/**
 * Response structure from OpenRouter API
 */
export interface OpenRouterResponse {
  id: string;
  model: string;
  choices: {
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// ============================================================================
// OpenRouter Service Configuration Types
// ============================================================================

/**
 * Configuration for OpenRouterService instance
 */
export interface OpenRouterConfig {
  /** OpenRouter API key (required) */
  apiKey: string;
  /** Default model to use for completions */
  defaultModel?: string;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Base URL for OpenRouter API */
  baseUrl?: string;
}

/**
 * Model parameters for fine-tuning generation behavior
 */
export interface ModelParameters {
  /** Controls randomness (0.0 - 2.0) */
  temperature?: number;
  /** Maximum tokens to generate */
  maxTokens?: number;
  /** Nucleus sampling parameter */
  topP?: number;
  /** Reduces repetition of tokens */
  frequencyPenalty?: number;
  /** Encourages topic diversity */
  presencePenalty?: number;
}

/**
 * Configuration for generic completion requests
 */
export interface CompletionConfig<T> {
  /** System prompt defining AI behavior */
  systemPrompt: string;
  /** User input/query */
  userPrompt: string;
  /** Optional model override */
  model?: string;
  /** Zod schema for response validation */
  responseSchema: z.ZodSchema<T>;
  /** Name identifier for the response schema */
  responseSchemaName: string;
  /** Optional model parameters */
  parameters?: ModelParameters;
}

/**
 * Options for flashcard generation
 */
export interface GenerateFlashcardsOptions {
  /** Model to use for generation */
  model?: string;
  /** Temperature for generation */
  temperature?: number;
  /** Maximum tokens for generation */
  maxTokens?: number;
  /** Custom system prompt override */
  systemPrompt?: string;
  /** Minimum number of flashcards to generate */
  minCards?: number;
  /** Maximum number of flashcards to generate */
  maxCards?: number;
}
