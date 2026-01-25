import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/db/database.types";
import dotenv from "dotenv";
import path from "path";

/**
 * Global teardown for E2E tests
 * Cleans up test data from Supabase database after all tests complete
 */

// Load test environment variables
dotenv.config({ path: path.resolve(process.cwd(), ".env.test") });

async function globalTeardown() {
  const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error("❌ Missing required Supabase environment variables for teardown");
    console.error("Required: PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
    return;
  }

  console.log("🧹 Starting database cleanup...");

  // Create admin client with service role key to bypass RLS
  const supabase = createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  try {
    // Delete in order respecting foreign key constraints
    // 1. Delete events first (references cards)
    const { error: eventsError, count: eventsCount } = await supabase
      .from("events")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000") // Delete all records
      .select("id", { count: "exact", head: true });

    if (eventsError) {
      console.error("❌ Error deleting events:", eventsError.message);
    } else {
      console.log(`✅ Cleaned up events`);
    }

    // 2. Delete cards
    const { error: cardsError, count: cardsCount } = await supabase
      .from("cards")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000") // Delete all records
      .select("id", { count: "exact", head: true });

    if (cardsError) {
      console.error("❌ Error deleting cards:", cardsError.message);
    } else {
      console.log(`✅ Cleaned up cards`);
    }

    // 3. Delete generation_requests
    const { error: requestsError, count: requestsCount } = await supabase
      .from("generation_requests")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000") // Delete all records
      .select("id", { count: "exact", head: true });

    if (requestsError) {
      console.error("❌ Error deleting generation_requests:", requestsError.message);
    } else {
      console.log(`✅ Cleaned up generation requests`);
    }

    console.log("✨ Database cleanup completed successfully");
  } catch (error) {
    console.error("❌ Unexpected error during database cleanup:", error);
    throw error;
  }
}

export default globalTeardown;
