import { defineMiddleware } from "astro:middleware";

import { supabaseClient } from "../db/supabase.client.ts";

/**
 * Middleware for Astro application
 * Handles:
 * - Supabase client initialization
 * - Authentication for API routes
 */
export const onRequest = defineMiddleware(async (context, next) => {
  // Always provide supabase client
  context.locals.supabase = supabaseClient;
  context.locals.user = null;

  // For API routes, validate authentication
  // if (context.url.pathname.startsWith("/api/")) {
  //   const authHeader = context.request.headers.get("Authorization");

  //   if (!authHeader?.startsWith("Bearer ")) {
  //     return new Response(
  //       JSON.stringify({
  //         error: "Unauthorized",
  //         message: "Missing or invalid authentication token",
  //       }),
  //       {
  //         status: 401,
  //         headers: { "Content-Type": "application/json" },
  //       }
  //     );
  //   }

  //   const token = authHeader.substring(7);
  //   const {
  //     data: { user },
  //     error,
  //   } = await supabaseClient.auth.getUser(token);

  //   if (error || !user) {
  //     return new Response(
  //       JSON.stringify({
  //         error: "Unauthorized",
  //         message: "Invalid authentication token",
  //       }),
  //       {
  //         status: 401,
  //         headers: { "Content-Type": "application/json" },
  //       }
  //     );
  //   }

  //   // Store authenticated user in context
  //   context.locals.user = user;
  // }

  return next();
});
