import { defineMiddleware } from "astro:middleware";

import { createSupabaseServerInstance } from "../db/supabase.client.ts";

/**
 * Middleware for Astro application
 * Handles:
 * - Supabase client initialization per-request
 * - Session verification and user authentication
 * - Cookie-based session management
 * - Protection of API routes
 */
export const onRequest = defineMiddleware(async (context, next) => {
  // Create Supabase instance with proper cookie handling
  const supabase = createSupabaseServerInstance({
    cookies: context.cookies,
    headers: context.request.headers,
  });

  // Always provide supabase client to context
  context.locals.supabase = supabase;

  // Get user session from cookies
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (!error && user) {
      // User is authenticated
      context.locals.user = user;
    } else {
      // No valid session
      context.locals.user = null;
    }
  } catch (err) {
    // Graceful degradation on auth errors
    console.error("Auth middleware error:", err);
    context.locals.user = null;
  }

  // Protect API routes - require authentication
  if (context.url.pathname.startsWith("/api/")) {
    // Public API endpoints (none currently, but can be added)
    const publicEndpoints: string[] = [];
    const isPublicEndpoint = publicEndpoints.some((endpoint) => context.url.pathname.startsWith(endpoint));

    if (!isPublicEndpoint && !context.locals.user) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "Authentication required",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }

  return next();
});
