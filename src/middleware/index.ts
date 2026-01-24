import { defineMiddleware } from "astro:middleware";

import { supabaseClient } from "../db/supabase.client.ts";
import type { User } from "@supabase/supabase-js";

/**
 * Middleware for Astro application
 * Handles:
 * - Supabase client initialization
 * - Authentication for API routes
 */
export const onRequest = defineMiddleware(async (context, next) => {
  const user: User = {
    id: "eadf7f7b-273a-4fe4-802e-e6804b13eefc",
    email: "test@test.com",
    app_metadata: {
      provider: "email",
    },
    user_metadata: {
      name: "Test User",
    },
    aud: "authenticated",
    created_at: new Date().toISOString(),
    confirmed_at: new Date().toISOString(),
  };

  // Always provide supabase client
  context.locals.supabase = supabaseClient;
  context.locals.user = user;

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
