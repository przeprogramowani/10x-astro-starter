import { describe, it, expect } from "vitest";
import { z } from "zod";
import {
  OpenRouterError,
  OpenRouterAPIError,
  OpenRouterRateLimitError,
  OpenRouterTimeoutError,
  OpenRouterValidationError,
  OpenRouterConfigError,
  formatZodError,
  isRetriableError,
} from "./openrouter.errors";

describe("OpenRouter Error Classes", () => {
  describe("OpenRouterError", () => {
    it("should extend Error", () => {
      // Arrange & Act
      const error = new OpenRouterError("Test error");

      // Assert
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(OpenRouterError);
    });

    it("should set name to 'OpenRouterError'", () => {
      // Arrange & Act
      const error = new OpenRouterError("Test error");

      // Assert
      expect(error.name).toBe("OpenRouterError");
    });

    it("should capture stack trace", () => {
      // Arrange & Act
      const error = new OpenRouterError("Test error");

      // Assert
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain("OpenRouterError");
    });

    it("should store cause when provided", () => {
      // Arrange
      const cause = new Error("Original error");

      // Act
      const error = new OpenRouterError("Wrapped error", cause);

      // Assert
      expect(error.cause).toBe(cause);
    });
  });

  describe("OpenRouterAPIError", () => {
    it("should include status code", () => {
      // Arrange & Act
      const error = new OpenRouterAPIError("API error", 500);

      // Assert
      expect(error.status).toBe(500);
    });

    it("should include response body", () => {
      // Arrange
      const body = { error: "Internal server error" };

      // Act
      const error = new OpenRouterAPIError("API error", 500, body);

      // Assert
      expect(error.body).toEqual(body);
    });

    it("should set name to 'OpenRouterAPIError'", () => {
      // Arrange & Act
      const error = new OpenRouterAPIError("API error", 500);

      // Assert
      expect(error.name).toBe("OpenRouterAPIError");
    });

    it("should extend OpenRouterError", () => {
      // Arrange & Act
      const error = new OpenRouterAPIError("API error", 500);

      // Assert
      expect(error).toBeInstanceOf(OpenRouterError);
      expect(error).toBeInstanceOf(OpenRouterAPIError);
    });
  });

  describe("OpenRouterRateLimitError", () => {
    it("should include retryAfter value", () => {
      // Arrange & Act
      const error = new OpenRouterRateLimitError("Rate limit exceeded", 60);

      // Assert
      expect(error.retryAfter).toBe(60);
    });

    it("should set status to 429", () => {
      // Arrange & Act
      const error = new OpenRouterRateLimitError("Rate limit exceeded", 60);

      // Assert
      expect(error.status).toBe(429);
    });

    it("should set name to 'OpenRouterRateLimitError'", () => {
      // Arrange & Act
      const error = new OpenRouterRateLimitError("Rate limit exceeded", 60);

      // Assert
      expect(error.name).toBe("OpenRouterRateLimitError");
    });

    it("should extend OpenRouterAPIError", () => {
      // Arrange & Act
      const error = new OpenRouterRateLimitError("Rate limit exceeded", 60);

      // Assert
      expect(error).toBeInstanceOf(OpenRouterAPIError);
      expect(error).toBeInstanceOf(OpenRouterRateLimitError);
    });

    it("should include body when provided", () => {
      // Arrange
      const body = { error: "Too many requests" };

      // Act
      const error = new OpenRouterRateLimitError("Rate limit exceeded", 60, body);

      // Assert
      expect(error.body).toEqual(body);
    });
  });

  describe("OpenRouterTimeoutError", () => {
    it("should set name to 'OpenRouterTimeoutError'", () => {
      // Arrange & Act
      const error = new OpenRouterTimeoutError("Request timed out");

      // Assert
      expect(error.name).toBe("OpenRouterTimeoutError");
    });

    it("should include timeout message", () => {
      // Arrange & Act
      const error = new OpenRouterTimeoutError("Request timed out after 60000ms");

      // Assert
      expect(error.message).toContain("60000ms");
    });

    it("should extend OpenRouterError", () => {
      // Arrange & Act
      const error = new OpenRouterTimeoutError("Request timed out");

      // Assert
      expect(error).toBeInstanceOf(OpenRouterError);
      expect(error).toBeInstanceOf(OpenRouterTimeoutError);
    });
  });

  describe("OpenRouterValidationError", () => {
    it("should include zodError in details", () => {
      // Arrange
      const schema = z.object({ name: z.string() });
      const result = schema.safeParse({ name: 123 });
      const zodError = !result.success ? result.error : undefined;

      // Act
      const error = new OpenRouterValidationError("Validation failed", { zodError });

      // Assert
      expect(error.details?.zodError).toBe(zodError);
    });

    it("should set name to 'OpenRouterValidationError'", () => {
      // Arrange & Act
      const error = new OpenRouterValidationError("Validation failed");

      // Assert
      expect(error.name).toBe("OpenRouterValidationError");
    });

    it("should extend OpenRouterError", () => {
      // Arrange & Act
      const error = new OpenRouterValidationError("Validation failed");

      // Assert
      expect(error).toBeInstanceOf(OpenRouterError);
      expect(error).toBeInstanceOf(OpenRouterValidationError);
    });

    it("should include cause in details", () => {
      // Arrange
      const cause = new Error("Original error");

      // Act
      const error = new OpenRouterValidationError("Validation failed", { cause });

      // Assert
      expect(error.details?.cause).toBe(cause);
      expect(error.cause).toBe(cause);
    });
  });

  describe("OpenRouterConfigError", () => {
    it("should set name to 'OpenRouterConfigError'", () => {
      // Arrange & Act
      const error = new OpenRouterConfigError("Invalid configuration");

      // Assert
      expect(error.name).toBe("OpenRouterConfigError");
    });

    it("should extend OpenRouterError", () => {
      // Arrange & Act
      const error = new OpenRouterConfigError("Invalid configuration");

      // Assert
      expect(error).toBeInstanceOf(OpenRouterError);
      expect(error).toBeInstanceOf(OpenRouterConfigError);
    });
  });

  describe("Helper: formatZodError()", () => {
    it("should format single error correctly", () => {
      // Arrange
      const schema = z.object({ name: z.string() });
      const result = schema.safeParse({ name: 123 });
      const zodError = !result.success ? result.error : undefined;

      // Act
      const formatted = formatZodError(zodError!);

      // Assert
      expect(formatted).toContain("name");
      expect(formatted).toContain("string");
    });

    it("should format multiple errors correctly", () => {
      // Arrange
      const schema = z.object({
        name: z.string(),
        age: z.number(),
      });
      const result = schema.safeParse({ name: 123, age: "invalid" });
      const zodError = !result.success ? result.error : undefined;

      // Act
      const formatted = formatZodError(zodError!);

      // Assert
      expect(formatted).toContain("name");
      expect(formatted).toContain("age");
    });

    it("should include field paths", () => {
      // Arrange
      const schema = z.object({
        user: z.object({
          email: z.string().email(),
        }),
      });
      const result = schema.safeParse({ user: { email: "invalid" } });
      const zodError = !result.success ? result.error : undefined;

      // Act
      const formatted = formatZodError(zodError!);

      // Assert
      expect(formatted).toContain("user.email");
    });
  });

  describe("Helper: isRetriableError()", () => {
    it("should return true for 5xx errors", () => {
      // Arrange
      const error500 = new OpenRouterAPIError("Server error", 500);
      const error502 = new OpenRouterAPIError("Bad gateway", 502);
      const error503 = new OpenRouterAPIError("Service unavailable", 503);

      // Act & Assert
      expect(isRetriableError(error500)).toBe(true);
      expect(isRetriableError(error502)).toBe(true);
      expect(isRetriableError(error503)).toBe(true);
    });

    it("should return true for 429 errors", () => {
      // Arrange
      const error = new OpenRouterRateLimitError("Rate limit exceeded", 60);

      // Act & Assert
      expect(isRetriableError(error)).toBe(true);
    });

    it("should return true for timeout errors", () => {
      // Arrange
      const error = new OpenRouterTimeoutError("Request timed out");

      // Act & Assert
      expect(isRetriableError(error)).toBe(true);
    });

    it("should return false for 4xx errors (except 429)", () => {
      // Arrange
      const error400 = new OpenRouterAPIError("Bad request", 400);
      const error401 = new OpenRouterAPIError("Unauthorized", 401);
      const error404 = new OpenRouterAPIError("Not found", 404);

      // Act & Assert
      expect(isRetriableError(error400)).toBe(false);
      expect(isRetriableError(error401)).toBe(false);
      expect(isRetriableError(error404)).toBe(false);
    });

    it("should return false for validation errors", () => {
      // Arrange
      const error = new OpenRouterValidationError("Validation failed");

      // Act & Assert
      expect(isRetriableError(error)).toBe(false);
    });

    it("should return false for config errors", () => {
      // Arrange
      const error = new OpenRouterConfigError("Invalid configuration");

      // Act & Assert
      expect(isRetriableError(error)).toBe(false);
    });

    it("should return false for generic errors", () => {
      // Arrange
      const error = new Error("Generic error");

      // Act & Assert
      expect(isRetriableError(error)).toBe(false);
    });

    it("should return false for non-error values", () => {
      // Act & Assert
      expect(isRetriableError("string error")).toBe(false);
      expect(isRetriableError(null)).toBe(false);
      expect(isRetriableError(undefined)).toBe(false);
      expect(isRetriableError(123)).toBe(false);
    });
  });
});
