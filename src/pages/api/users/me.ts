import type { APIRoute } from "astro";
import { deleteUserAccount } from "../../../lib/services/user.service";
import type { DeleteUserResponseDTO, ErrorResponseDTO } from "../../../types";

/**
 * Disable prerendering for this API endpoint
 */
export const prerender = false;

/**
 * DELETE /api/users/me
 * Deletes the authenticated user's account and all associated data
 *
 * This is a destructive operation that cannot be undone. It will:
 * - Delete the user from Supabase Auth
 * - Delete all user's cards (automatic cascade)
 * - Delete all user's generation requests (automatic cascade)
 * - Delete all user's events (automatic cascade)
 *
 * Authentication: Required (Bearer token)
 *
 * Responses:
 * - 200 OK: Account deleted successfully
 * - 401 Unauthorized: Missing or invalid authentication (handled by middleware)
 * - 500 Internal Server Error: Database or Auth API error
 */
export const DELETE: APIRoute = async ({ locals }) => {
  try {
    // Step 1: Verify authentication (user should be set by middleware)
    const { user, supabase } = locals;

    if (!user) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "Missing or invalid authentication token",
        } satisfies ErrorResponseDTO),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const userId = user.id;

    // Step 2: Delete user account and all associated data
    try {
      await deleteUserAccount(userId, supabase);
    } catch (error) {
      console.error("Failed to delete user account:", {
        error: error instanceof Error ? error.message : "Unknown error",
        user_id: userId,
        timestamp: new Date().toISOString(),
        stack: error instanceof Error ? error.stack : undefined,
      });

      return new Response(
        JSON.stringify({
          error: "Internal server error",
          message:
            "An unexpected error occurred while deleting your account. Please try again later.",
        } satisfies ErrorResponseDTO),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 3: Return success response
    return new Response(
      JSON.stringify({
        message: "Account and all associated data deleted successfully",
      } satisfies DeleteUserResponseDTO),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    // Global error handler - catch any unexpected errors
    console.error("Unexpected error in DELETE /api/users/me:", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: "An unexpected error occurred. Please try again later.",
      } satisfies ErrorResponseDTO),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
