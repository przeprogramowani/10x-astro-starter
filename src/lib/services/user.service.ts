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
 * 1. Deletes the user from Supabase Auth (admin API)
 * 2. Database cascading deletes automatically remove:
 *    - All user's cards (via FK constraint)
 *    - All user's generation_requests (via FK constraint)
 *    - All user's events (via FK constraint)
 *
 * @param userId - ID of the user to delete
 * @throws Error if deletion fails (auth API error or database error)
 */
export async function deleteUserAccount(userId: string): Promise<void> {
  // Create admin client with service role key for elevated privileges
  const adminClient = createSupabaseAdminClient();

  // Delete user from Supabase Auth
  // This will automatically trigger cascading deletes in the database
  const { error } = await adminClient.auth.admin.deleteUser(userId);

  if (error) {
    console.error("Failed to delete user from Supabase Auth:", {
      error: error.message,
      user_id: userId,
      timestamp: new Date().toISOString(),
    });
    throw new Error(`Failed to delete user account: ${error.message}`);
  }

  // Database cascading deletes happen automatically via FK constraints
  // No need to manually delete from cards, generation_requests, or events tables

  // Log successful deletion
  console.info("User account deleted successfully:", {
    user_id: userId,
    timestamp: new Date().toISOString(),
  });
}
