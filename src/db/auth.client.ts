import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * Supabase client for client-side authentication
 *
 * This client is configured to work in the browser with:
 * - Anonymous key (safe for client-side use)
 * - Session persistence enabled
 * - Auto token refresh enabled
 *
 * Use this client for:
 * - User authentication (sign up, sign in, sign out)
 * - Client-side data access with RLS policies
 *
 * Note: Uses PUBLIC_ prefixed env vars that are exposed to the browser
 */

// For client-side, we need PUBLIC_ prefixed variables
// If they're not available, fall back to the server-side ones
const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

export const authClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
