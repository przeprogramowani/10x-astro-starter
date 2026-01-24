import type { APIRoute } from "astro";
import { z } from "zod";

import { CreateGenerationRequestSchema } from "../../lib/schemas/generation-request.schema";
import { generateFlashcards } from "../../lib/services/ai.service";
import {
  OpenRouterError,
  OpenRouterRateLimitError,
  OpenRouterTimeoutError,
  OpenRouterValidationError,
  OpenRouterAPIError,
} from "../../lib/services/openrouter.errors";
import { createAIGenerationEvent } from "../../lib/services/event.service";
import { createGenerationRequest } from "../../lib/services/generation-request.service";
import type { GenerationRequestResponseDTO, ValidationErrorResponseDTO } from "../../types";

/**
 * Disable prerendering for this API endpoint
 */
export const prerender = false;

/**
 * POST /api/generation-requests
 * Creates a new AI generation request and returns suggested flashcards
 *
 * Request body:
 * - input_text: string (1000-10000 characters)
 *
 * Responses:
 * - 200 OK: Returns generation request with suggested cards
 * - 400 Bad Request: Validation error
 * - 401 Unauthorized: Missing or invalid authentication (handled by middleware)
 * - 502 Bad Gateway: AI service error
 * - 500 Internal Server Error: Unexpected error
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Step 1: Verify authentication (user should be set by middleware)
    const { supabase, user } = locals;

    if (!user) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "Missing or invalid authentication token",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const userId = user.id;

    // Step 2: Parse and validate request body
    let requestBody: unknown;
    try {
      requestBody = await request.json();
    } catch {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          details: [
            {
              field: "body",
              message: "Invalid JSON in request body",
            },
          ],
        } satisfies ValidationErrorResponseDTO),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 3: Validate with Zod schema
    let validated: z.infer<typeof CreateGenerationRequestSchema>;
    try {
      validated = CreateGenerationRequestSchema.parse(requestBody);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return new Response(
          JSON.stringify({
            error: "Validation failed",
            details: error.errors.map((err) => ({
              field: err.path.join(".") || "unknown",
              message: err.message,
              value:
                err.path.length > 0 && requestBody && typeof requestBody === "object"
                  ? (requestBody as Record<string, unknown>)[err.path[0] as string]
                  : undefined,
            })),
          } satisfies ValidationErrorResponseDTO),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      throw error;
    }

    // Step 4: Call AI service to generate flashcards
    let suggestedCards;
    try {
      suggestedCards = await generateFlashcards(validated.input_text);

      // Verify we got valid cards
      if (!suggestedCards || suggestedCards.length === 0) {
        throw new Error("No cards generated");
      }
    } catch (error) {
      // Handle OpenRouter rate limit errors (429)
      if (error instanceof OpenRouterRateLimitError) {
        console.warn("Rate limit exceeded:", {
          retryAfter: error.retryAfter,
          user_id: userId,
          timestamp: new Date().toISOString(),
        });

        return new Response(
          JSON.stringify({
            error: "Rate limit exceeded",
            message: "Too many AI generation requests. Please try again later.",
            retry_after: error.retryAfter,
          }),
          {
            status: 429,
            headers: {
              "Content-Type": "application/json",
              "Retry-After": error.retryAfter.toString(),
            },
          }
        );
      }

      // Handle OpenRouter timeout errors (504)
      if (error instanceof OpenRouterTimeoutError) {
        console.error("AI generation timeout:", {
          error: error.message,
          user_id: userId,
          timestamp: new Date().toISOString(),
        });

        return new Response(
          JSON.stringify({
            error: "Request timeout",
            message: "AI generation took too long. Please try again with shorter text or wait a moment.",
          }),
          {
            status: 504,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Handle OpenRouter validation errors (500)
      if (error instanceof OpenRouterValidationError) {
        console.error("OpenRouter validation error:", {
          error: error.message,
          details: error.details,
          user_id: userId,
          timestamp: new Date().toISOString(),
        });

        return new Response(
          JSON.stringify({
            error: "AI generation failed",
            message: "Unable to generate valid flashcards. Please try different text.",
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Handle OpenRouter API errors (401, 404, 500, etc.)
      if (error instanceof OpenRouterAPIError) {
        console.error("OpenRouter API error:", {
          error: error.message,
          status: error.status,
          user_id: userId,
          timestamp: new Date().toISOString(),
        });

        return new Response(
          JSON.stringify({
            error: "AI service error",
            message: "An error occurred with the AI service. Please try again later.",
          }),
          {
            status: 502,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Handle other OpenRouter errors
      if (error instanceof OpenRouterError) {
        console.error("OpenRouter error:", {
          error: error.message,
          user_id: userId,
          timestamp: new Date().toISOString(),
        });

        return new Response(
          JSON.stringify({
            error: "AI service error",
            message: "An error occurred with the AI service. Please try again later.",
          }),
          {
            status: 502,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Handle unexpected errors
      console.error("Unexpected AI service error:", {
        error: error instanceof Error ? error.message : "Unknown error",
        user_id: userId,
        timestamp: new Date().toISOString(),
      });

      return new Response(
        JSON.stringify({
          error: "AI service unavailable",
          message: "Unable to generate flashcards at this time. Please try again later.",
        }),
        {
          status: 502,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 5: Save generation request to database
    let generationRequest;
    try {
      generationRequest = await createGenerationRequest(
        {
          user_id: userId,
          input_text: validated.input_text,
          generated_count: suggestedCards.length,
        },
        supabase
      );
    } catch (error) {
      console.error("Database error creating generation request:", {
        error: error instanceof Error ? error.message : "Unknown error",
        user_id: userId,
        timestamp: new Date().toISOString(),
      });

      return new Response(
        JSON.stringify({
          error: "Internal server error",
          message: "An unexpected error occurred. Please try again later.",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 6: Log AI generation event (non-blocking - don't fail request if this fails)
    try {
      await createAIGenerationEvent(
        generationRequest.id,
        suggestedCards.length,
        validated.input_text.length,
        userId,
        supabase
      );
    } catch (error) {
      // Log error but don't fail the request
      console.error("Failed to create AI generation event:", {
        error: error instanceof Error ? error.message : "Unknown error",
        generation_request_id: generationRequest.id,
        user_id: userId,
        timestamp: new Date().toISOString(),
      });
    }

    // Step 7: Construct and return response
    const response: GenerationRequestResponseDTO = {
      generation_request_id: generationRequest.id,
      generated_count: suggestedCards.length,
      suggested_cards: suggestedCards,
      created_at: generationRequest.created_at,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Global error handler - catch any unexpected errors
    console.error("Unexpected error in POST /api/generation-requests:", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: "An unexpected error occurred. Please try again later.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
