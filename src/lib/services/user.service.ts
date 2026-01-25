import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";
import { createSupabaseAdminClient } from "../../db/supabase.client";

/**
 * Type for Supabase client with proper database types
 */
export type SupabaseClientType = SupabaseClient<Database>;

/**
 * Deletes a user account and all associated data
 *
 * This function performs the following operations:
 * 1. Verifies the user is authenticated and deleting their own account
 * 2. Deletes the user from Supabase Auth (requires admin API)
 * 3. Database cascading deletes automatically remove:
 *    - All user's cards (via FK constraint)
 *    - All user's generation_requests (via FK constraint)
 *    - All user's events (via FK constraint)
 *
 * Security: Uses the authenticated user's client to verify identity,
 * then uses admin client only for the Auth deletion operation.
 *
 * @param userId - ID of the user to delete
 * @param supabase - Authenticated Supabase client from request context
 * @throws Error if deletion fails (auth API error or database error)
 */
export async function deleteUserAccount(
  userId: string,
  supabase: SupabaseClient<Database>
): Promise<void> {
  // Step 1: Verify the authenticated user matches the userId being deleted
  // This ensures users can only delete their own accounts
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error("Failed to verify user authentication:", {
      error: authError?.message,
      user_id: userId,
      timestamp: new Date().toISOString(),
    });
    throw new Error("Authentication verification failed");
  }

  if (user.id !== userId) {
    console.error("User attempting to delete different account:", {
      authenticated_user_id: user.id,
      target_user_id: userId,
      timestamp: new Date().toISOString(),
    });
    throw new Error("Cannot delete another user's account");
  }

  // Step 2: Use admin client to delete user from Supabase Auth
  // Note: Regular users cannot delete themselves from Auth, so we need admin privileges
  // However, we've verified above that they're deleting their own account
  const adminClient = createSupabaseAdminClient();

  const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);

  if (deleteError) {
    console.error("Failed to delete user from Supabase Auth:", {
      error: deleteError.message,
      user_id: userId,
      timestamp: new Date().toISOString(),
    });
    throw new Error(`Failed to delete user account: ${deleteError.message}`);
  }

  // Step 3: Database cascading deletes happen automatically via FK constraints
  // No need to manually delete from cards, generation_requests, or events tables

  // Log successful deletion
  console.info("User account deleted successfully:", {
    user_id: userId,
    timestamp: new Date().toISOString(),
  });
}
