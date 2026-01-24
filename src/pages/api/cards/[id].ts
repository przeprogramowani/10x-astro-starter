import type { APIRoute } from "astro";
import { z } from "zod";

import { UpdateCardSchema } from "../../../lib/schemas/card.schema";
import { deleteCard, getCardById, updateCard } from "../../../lib/services/card.service";
import { createCardDeletedEvent, createCardEditedEvent } from "../../../lib/services/event.service";
import type { CardDTO, DeleteCardResponseDTO, ValidationErrorResponseDTO } from "../../../types";

/**
 * Disable prerendering for this API endpoint
 */
export const prerender = false;

/**
 * Validates UUID format
 */
function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

/**
 * GET /api/cards/:id
 * Retrieves a single flashcard by ID
 *
 * URL Parameters:
 * - id: Card UUID
 *
 * Responses:
 * - 200 OK: Returns the card
 * - 400 Bad Request: Invalid card ID format
 * - 401 Unauthorized: Missing or invalid authentication (handled by middleware)
 * - 404 Not Found: Card not found or doesn't belong to user
 * - 500 Internal Server Error: Unexpected error
 */
export const GET: APIRoute = async ({ params, locals }) => {
  try {
    // Step 1: Verify authentication
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

    // Step 2: Validate card ID
    const cardId = params.id;
    if (!cardId || !isValidUUID(cardId)) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          details: [
            {
              field: "id",
              message: "Invalid card ID format",
            },
          ],
        } satisfies ValidationErrorResponseDTO),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 3: Retrieve card from database
    let card: CardDTO | null;
    try {
      card = await getCardById(cardId, userId, supabase);
    } catch (error) {
      console.error("Database error retrieving card:", {
        error: error instanceof Error ? error.message : "Unknown error",
        card_id: cardId,
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

    // Step 4: Check if card exists
    if (!card) {
      return new Response(
        JSON.stringify({
          error: "Not found",
          message: "Card not found",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 5: Return card
    return new Response(JSON.stringify(card), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Global error handler
    console.error("Unexpected error in GET /api/cards/:id:", {
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
 * PATCH /api/cards/:id
 * Updates an existing flashcard
 *
 * URL Parameters:
 * - id: Card UUID
 *
 * Request body (all fields optional, at least one required):
 * - front: string (1-200 characters)
 * - back: string (1-500 characters)
 * - repetitions: integer (>= 0)
 *
 * Responses:
 * - 200 OK: Returns the updated card
 * - 400 Bad Request: Validation error or invalid card ID
 * - 401 Unauthorized: Missing or invalid authentication (handled by middleware)
 * - 404 Not Found: Card not found or doesn't belong to user
 * - 500 Internal Server Error: Unexpected error
 */
export const PATCH: APIRoute = async ({ params, request, locals }) => {
  try {
    // Step 1: Verify authentication
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

    // Step 2: Validate card ID
    const cardId = params.id;
    if (!cardId || !isValidUUID(cardId)) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          details: [
            {
              field: "id",
              message: "Invalid card ID format",
            },
          ],
        } satisfies ValidationErrorResponseDTO),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 3: Parse request body
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

    // Step 4: Validate with Zod schema
    let validated: z.infer<typeof UpdateCardSchema>;
    try {
      validated = UpdateCardSchema.parse(requestBody);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return new Response(
          JSON.stringify({
            error: "Validation failed",
            details: error.errors.map((err) => ({
              field: err.path.join(".") || "body",
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

    // Step 5: Update card in database
    let updatedCard: CardDTO | null;
    try {
      updatedCard = await updateCard(cardId, validated, userId, supabase);
    } catch (error) {
      console.error("Database error updating card:", {
        error: error instanceof Error ? error.message : "Unknown error",
        card_id: cardId,
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

    // Step 6: Check if card exists
    if (!updatedCard) {
      return new Response(
        JSON.stringify({
          error: "Not found",
          message: "Card not found",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 7: Log card_edited event (non-blocking)
    createCardEditedEvent(cardId, userId, supabase).catch((error) => {
      console.error("Failed to create card_edited event:", {
        error: error instanceof Error ? error.message : "Unknown error",
        card_id: cardId,
        user_id: userId,
        timestamp: new Date().toISOString(),
      });
    });

    // Step 8: Return updated card
    return new Response(JSON.stringify(updatedCard), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Global error handler
    console.error("Unexpected error in PATCH /api/cards/:id:", {
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
 * DELETE /api/cards/:id
 * Deletes a flashcard
 *
 * URL Parameters:
 * - id: Card UUID
 *
 * Responses:
 * - 200 OK: Card deleted successfully
 * - 400 Bad Request: Invalid card ID format
 * - 401 Unauthorized: Missing or invalid authentication (handled by middleware)
 * - 404 Not Found: Card not found or doesn't belong to user
 * - 500 Internal Server Error: Unexpected error
 */
export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    // Step 1: Verify authentication
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

    // Step 2: Validate card ID
    const cardId = params.id;
    if (!cardId || !isValidUUID(cardId)) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          details: [
            {
              field: "id",
              message: "Invalid card ID format",
            },
          ],
        } satisfies ValidationErrorResponseDTO),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 3: Delete card from database
    let deletedCard: CardDTO | null;
    try {
      deletedCard = await deleteCard(cardId, userId, supabase);
    } catch (error) {
      console.error("Database error deleting card:", {
        error: error instanceof Error ? error.message : "Unknown error",
        card_id: cardId,
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

    // Step 4: Check if card exists
    if (!deletedCard) {
      return new Response(
        JSON.stringify({
          error: "Not found",
          message: "Card not found",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 5: Log card_deleted event (non-blocking)
    createCardDeletedEvent(cardId, userId, supabase).catch((error) => {
      console.error("Failed to create card_deleted event:", {
        error: error instanceof Error ? error.message : "Unknown error",
        card_id: cardId,
        user_id: userId,
        timestamp: new Date().toISOString(),
      });
    });

    // Step 6: Return success response
    const response: DeleteCardResponseDTO = {
      message: "Card deleted successfully",
      deleted_id: cardId,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Global error handler
    console.error("Unexpected error in DELETE /api/cards/:id:", {
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
