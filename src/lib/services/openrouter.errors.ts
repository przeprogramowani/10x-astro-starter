import type { z } from "zod";

// ============================================================================
// OpenRouter Error Classes
// ============================================================================

/**
 * Base error class for all OpenRouter-related errors
 * Extends native Error with optional cause tracking
 */
export class OpenRouterError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "OpenRouterError";
    // Maintain proper stack trace for where error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Error for OpenRouter API HTTP errors (4xx, 5xx responses)
 * Includes status code and response body for detailed debugging
 */
export class OpenRouterAPIError extends OpenRouterError {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body?: unknown
  ) {
    super(message);
    this.name = "OpenRouterAPIError";
  }
}

/**
 * Specific error for rate limit exceeded (429 Too Many Requests)
 * Includes retry-after information for client handling
 */
export class OpenRouterRateLimitError extends OpenRouterAPIError {
  constructor(
    message: string,
    public readonly retryAfter: number,
    body?: unknown
  ) {
    super(message, 429, body);
    this.name = "OpenRouterRateLimitError";
  }
}

/**
 * Error for request timeouts
 * Thrown when a request exceeds the configured timeout duration
 */
export class OpenRouterTimeoutError extends OpenRouterError {
  constructor(message: string) {
    super(message);
    this.name = "OpenRouterTimeoutError";
  }
}

/**
 * Error for validation failures
 * Thrown when response doesn't match expected schema or input validation fails
 */
export class OpenRouterValidationError extends OpenRouterError {
  constructor(
    message: string,
    public readonly details?: { zodError?: z.ZodError; cause?: unknown }
  ) {
    super(message, details?.cause);
    this.name = "OpenRouterValidationError";
  }
}

/**
 * Error for configuration issues
 * Thrown in constructor when config is invalid
 */
export class OpenRouterConfigError extends OpenRouterError {
  constructor(message: string) {
    super(message);
    this.name = "OpenRouterConfigError";
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Formats a Zod error into a readable string
 * @param error - Zod validation error
 * @returns Formatted error message with field paths and messages
 */
export function formatZodError(error: z.ZodError): string {
  return error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
}

/**
 * Determines if an error is retriable (network/server issues)
 * @param error - Error to check
 * @returns True if the error should trigger a retry
 */
export function isRetriableError(error: unknown): boolean {
  // Retry on server errors (5xx) or rate limits (429)
  if (error instanceof OpenRouterAPIError) {
    return error.status >= 500 || error.status === 429;
  }

  // Retry on timeouts
  if (error instanceof OpenRouterTimeoutError) {
    return true;
  }

  // Don't retry validation, config, or client errors
  return false;
}
