import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";

/**
 * Supabase client for client-side authentication
 *
 * This client is configured to work in the browser with:
 * - Cookie-based session storage (compatible with SSR)
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

// Create browser client with default cookie handling
// This will automatically handle cookies in a format compatible with the server
export const authClient = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
