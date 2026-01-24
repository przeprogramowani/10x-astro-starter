import type { AstroCookies } from "astro";
import { createServerClient } from "@supabase/ssr";

import type { Database } from "../db/database.types.ts";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing required Supabase environment variables");
}

// Cookie configuration for server-side Supabase client
// Note: The 'name' field will be dynamically set by Supabase for each cookie
const cookieConfig = {
  path: "/",
  secure: import.meta.env.PROD, // Only secure in production (allow http in development)
  httpOnly: true,
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 24 * 7, // 1 week
};

/**
 * Parse cookie header string into array of cookie objects
 */
function parseCookieHeader(cookieHeader: string): { name: string; value: string }[] {
  if (!cookieHeader) return [];

  return cookieHeader.split(";").map((cookie) => {
    const [name, ...rest] = cookie.trim().split("=");
    return { name, value: rest.join("=") };
  });
}

/**
 * Create Supabase server instance with proper cookie handling
 * This instance should be created per-request in middleware or API routes
 */
export const createSupabaseServerInstance = (context: { headers: Headers; cookies: AstroCookies }) => {
  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return parseCookieHeader(context.headers.get("Cookie") ?? "");
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          // Merge with our default cookie config
          context.cookies.set(name, value, {
            ...cookieConfig,
            ...options,
          });
        });
      },
    },
  });

  return supabase;
};
