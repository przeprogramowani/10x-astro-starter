import type { APIRoute } from "astro";
import { z } from "zod";

import { CreateCardsSchema, GetCardsQuerySchema } from "../../lib/schemas/card.schema";
import { createCards, getCards } from "../../lib/services/card.service";
import { createCardCreatedManualEvent } from "../../lib/services/event.service";
import type { CardDTO, CardsListResponseDTO, ValidationErrorResponseDTO } from "../../types";

/**
 * Disable prerendering for this API endpoint
 */
export const prerender = false;

/**
 * GET /api/cards
 * Retrieves all flashcards for the authenticated user with pagination and filtering
 *
 * Query parameters:
 * - limit (optional, default: 50, max: 100): Number of cards to return
 * - offset (optional, default: 0): Number of cards to skip
 * - source (optional): Filter by source (manual or ai)
 * - sort (optional, default: created_at): Sort field (created_at, updated_at, repetitions)
 * - order (optional, default: desc): Sort order (asc or desc)
 *
 * Responses:
 * - 200 OK: Returns cards list with pagination metadata
 * - 400 Bad Request: Invalid query parameters
 * - 401 Unauthorized: Missing or invalid authentication (handled by middleware)
 * - 500 Internal Server Error: Unexpected error
 */
export const GET: APIRoute = async ({ url, locals }) => {
  try {
    // Step 1: Verify authentication (user should be set by middleware)
    const { user, supabase } = locals;

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

    // Step 2: Parse and validate query parameters
    const queryParams = {
      limit: url.searchParams.get("limit") || undefined,
      offset: url.searchParams.get("offset") || undefined,
      source: url.searchParams.get("source") || undefined,
      sort: url.searchParams.get("sort") || undefined,
      order: url.searchParams.get("order") || undefined,
    };

    let validated: z.infer<typeof GetCardsQuerySchema>;
    try {
      validated = GetCardsQuerySchema.parse(queryParams);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return new Response(
          JSON.stringify({
            error: "Validation failed",
            details: error.errors.map((err) => ({
              field: err.path.join(".") || "query",
              message: err.message,
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

    // Step 3: Retrieve cards from database
    let response: CardsListResponseDTO;
    try {
      response = await getCards(validated, userId, supabase);
    } catch (error) {
      console.error("Database error retrieving cards:", {
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

    // Step 4: Return response
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Global error handler - catch any unexpected errors
    console.error("Unexpected error in GET /api/cards:", {
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

/**
 * POST /api/cards
 * Creates one or more new flashcards manually or from AI generation
 *
 * Query parameters:
 * - source (optional): 'manual' (default) or 'ai'
 *
 * Request body: Array of card objects
 * - front: string (1-200 characters)
 * - back: string (1-500 characters)
 *
 * Responses:
 * - 201 Created: Returns array of created cards
 * - 400 Bad Request: Validation error
 * - 401 Unauthorized: Missing or invalid authentication (handled by middleware)
 * - 500 Internal Server Error: Unexpected error
 */
export const POST: APIRoute = async ({ request, url, locals }) => {
  try {
    // Step 1: Verify authentication (user should be set by middleware)
    const { user, supabase } = locals;

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

    // Get source from query parameter (default to 'manual')
    const sourceParam = url.searchParams.get("source");
    const source: "manual" | "ai" = sourceParam === "ai" ? "ai" : "manual";

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
    let validated: z.infer<typeof CreateCardsSchema>;
    try {
      validated = CreateCardsSchema.parse(requestBody);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return new Response(
          JSON.stringify({
            error: "Validation failed",
            details: error.errors.map((err) => ({
              field: err.path.join(".") || "cards",
              message: err.message,
              value: err.path.length > 0 ? undefined : requestBody,
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

    // Step 4: Create cards in database
    let createdCards: CardDTO[];
    try {
      createdCards = await createCards(validated, userId, supabase, source);
    } catch (error) {
      console.error("Database error creating cards:", {
        error: error instanceof Error ? error.message : "Unknown error",
        user_id: userId,
        cards_count: validated.length,
        source: source,
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

    // Step 5: Log events for each card (non-blocking)
    // Only log card_created_manual events for manual cards
    if (source === "manual") {
      // Create events in parallel but don't wait for all to complete
      const eventPromises = createdCards.map((card) =>
        createCardCreatedManualEvent(card.id, userId, supabase).catch((error) => {
          // Log error but don't fail the request
          console.error("Failed to create card_created_manual event:", {
            error: error instanceof Error ? error.message : "Unknown error",
            card_id: card.id,
            user_id: userId,
            timestamp: new Date().toISOString(),
          });
        })
      );

      // Fire and forget - don't wait for events to complete
      Promise.all(eventPromises).catch(() => {
        // Silently handle any errors
      });
    }

    // Step 6: Return created cards
    // For single card, return the card object directly
    // For multiple cards, return array
    const response = createdCards.length === 1 ? createdCards[0] : createdCards;

    return new Response(JSON.stringify(response), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Global error handler - catch any unexpected errors
    console.error("Unexpected error in POST /api/cards:", {
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
