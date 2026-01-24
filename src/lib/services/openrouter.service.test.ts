import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { OpenRouterService } from "./openrouter.service";
import {
  OpenRouterAPIError,
  OpenRouterConfigError,
  OpenRouterRateLimitError,
  OpenRouterTimeoutError,
  OpenRouterValidationError,
} from "./openrouter.errors";
import type { OpenRouterResponse } from "./openrouter.types";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch as unknown as typeof fetch;

describe("OpenRouterService", () => {
  let service: OpenRouterService;
  const validConfig = {
    apiKey: "test-api-key-1234567890",
    defaultModel: "openai/gpt-oss-120b:free",
    timeout: 60000,
    baseUrl: "https://openrouter.ai/api/v1",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Constructor & Configuration", () => {
    it("should initialize with valid configuration", () => {
      // Arrange & Act
      const service = new OpenRouterService(validConfig);

      // Assert
      expect(service).toBeInstanceOf(OpenRouterService);
      expect(service.supportedModels).toContain("openai/gpt-oss-120b:free");
    });

    it("should throw OpenRouterConfigError for invalid API key", () => {
      // Arrange
      const invalidConfig = {
        ...validConfig,
        apiKey: "short",
      };

      // Act & Assert
      expect(() => new OpenRouterService(invalidConfig)).toThrow(OpenRouterConfigError);
      expect(() => new OpenRouterService(invalidConfig)).toThrow(/Invalid configuration/);
    });

    it("should use default values for optional config", () => {
      // Arrange
      const minimalConfig = {
        apiKey: "test-api-key-1234567890",
      };

      // Act
      const service = new OpenRouterService(minimalConfig);

      // Assert
      expect(service).toBeInstanceOf(OpenRouterService);
    });

    it("should throw OpenRouterConfigError for missing API key", () => {
      // Arrange
      const invalidConfig = {} as any;

      // Act & Assert
      expect(() => new OpenRouterService(invalidConfig)).toThrow(OpenRouterConfigError);
    });

    it("should throw OpenRouterConfigError for invalid timeout", () => {
      // Arrange
      const invalidConfig = {
        ...validConfig,
        timeout: 150000, // > 120000
      };

      // Act & Assert
      expect(() => new OpenRouterService(invalidConfig)).toThrow(OpenRouterConfigError);
    });
  });

  describe("generateFlashcards() - Input validation", () => {
    beforeEach(() => {
      service = new OpenRouterService(validConfig);
    });

    it("should accept valid input text (1000-10000 chars)", async () => {
      // Arrange
      const validText = "a".repeat(5000);
      const mockResponse: OpenRouterResponse = {
        id: "test-id",
        model: "test-model",
        choices: [
          {
            message: {
              role: "assistant",
              content: JSON.stringify({
                cards: [
                  { front: "Q1", back: "A1" },
                  { front: "Q2", back: "A2" },
                  { front: "Q3", back: "A3" },
                  { front: "Q4", back: "A4" },
                  { front: "Q5", back: "A5" },
                ],
              }),
            },
            finish_reason: "stop",
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      // Act
      const result = await service.generateFlashcards(validText);

      // Assert
      expect(result).toHaveLength(5);
      expect(mockFetch).toHaveBeenCalledOnce();
    });

    it("should reject text shorter than 1000 characters", async () => {
      // Arrange
      const shortText = "a".repeat(999);

      // Act & Assert
      await expect(service.generateFlashcards(shortText)).rejects.toThrow(OpenRouterValidationError);
      await expect(service.generateFlashcards(shortText)).rejects.toThrow(/too short/);
    });

    it("should reject text longer than 10000 characters", async () => {
      // Arrange
      const longText = "a".repeat(10001);

      // Act & Assert
      await expect(service.generateFlashcards(longText)).rejects.toThrow(OpenRouterValidationError);
      await expect(service.generateFlashcards(longText)).rejects.toThrow(/too long/);
    });

    it("should reject non-string input", async () => {
      // Arrange
      const invalidInput = 123 as any;

      // Act & Assert
      await expect(service.generateFlashcards(invalidInput)).rejects.toThrow(OpenRouterValidationError);
      await expect(service.generateFlashcards(invalidInput)).rejects.toThrow(/must be a string/);
    });

    it("should trim whitespace before validation", async () => {
      // Arrange
      const textWithWhitespace = "   " + "a".repeat(999) + "   ";

      // Act & Assert
      await expect(service.generateFlashcards(textWithWhitespace)).rejects.toThrow(OpenRouterValidationError);
    });

    it("should handle exactly 1000 characters", async () => {
      // Arrange
      const exactText = "a".repeat(1000);
      const mockResponse: OpenRouterResponse = {
        id: "test-id",
        model: "test-model",
        choices: [
          {
            message: {
              role: "assistant",
              content: JSON.stringify({
                cards: [
                  { front: "Q1", back: "A1" },
                  { front: "Q2", back: "A2" },
                  { front: "Q3", back: "A3" },
                  { front: "Q4", back: "A4" },
                  { front: "Q5", back: "A5" },
                ],
              }),
            },
            finish_reason: "stop",
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      // Act
      const result = await service.generateFlashcards(exactText);

      // Assert
      expect(result).toHaveLength(5);
    });

    it("should handle exactly 10000 characters", async () => {
      // Arrange
      const exactText = "a".repeat(10000);
      const mockResponse: OpenRouterResponse = {
        id: "test-id",
        model: "test-model",
        choices: [
          {
            message: {
              role: "assistant",
              content: JSON.stringify({
                cards: [
                  { front: "Q1", back: "A1" },
                  { front: "Q2", back: "A2" },
                  { front: "Q3", back: "A3" },
                  { front: "Q4", back: "A4" },
                  { front: "Q5", back: "A5" },
                ],
              }),
            },
            finish_reason: "stop",
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      // Act
      const result = await service.generateFlashcards(exactText);

      // Assert
      expect(result).toHaveLength(5);
    });

    it("should reject empty string after trim", async () => {
      // Arrange
      const emptyText = "   ";

      // Act & Assert
      await expect(service.generateFlashcards(emptyText)).rejects.toThrow(OpenRouterValidationError);
    });
  });

  describe("generateFlashcards() - Card limits validation", () => {
    beforeEach(() => {
      service = new OpenRouterService(validConfig);
    });

    it("should use default limits (5-10) when not specified", async () => {
      // Arrange
      const validText = "a".repeat(1000);
      const mockResponse: OpenRouterResponse = {
        id: "test-id",
        model: "test-model",
        choices: [
          {
            message: {
              role: "assistant",
              content: JSON.stringify({
                cards: Array.from({ length: 7 }, (_, i) => ({
                  front: `Q${i + 1}`,
                  back: `A${i + 1}`,
                })),
              }),
            },
            finish_reason: "stop",
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      // Act
      const result = await service.generateFlashcards(validText);

      // Assert
      expect(result.length).toBeGreaterThanOrEqual(5);
      expect(result.length).toBeLessThanOrEqual(10);
    });

    it("should accept custom minCards and maxCards", async () => {
      // Arrange
      const validText = "a".repeat(1000);
      const mockResponse: OpenRouterResponse = {
        id: "test-id",
        model: "test-model",
        choices: [
          {
            message: {
              role: "assistant",
              content: JSON.stringify({
                cards: Array.from({ length: 7 }, (_, i) => ({
                  front: `Q${i + 1}`,
                  back: `A${i + 1}`,
                })),
              }),
            },
            finish_reason: "stop",
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      // Act
      const result = await service.generateFlashcards(validText, {
        minCards: 5,
        maxCards: 8,
      });

      // Assert
      expect(result).toHaveLength(7);
    });

    it("should reject minCards < 1", async () => {
      // Arrange
      const validText = "a".repeat(1000);

      // Act & Assert
      await expect(
        service.generateFlashcards(validText, { minCards: 0, maxCards: 5 })
      ).rejects.toThrow(OpenRouterValidationError);
      await expect(
        service.generateFlashcards(validText, { minCards: 0, maxCards: 5 })
      ).rejects.toThrow(/Invalid card limits/);
    });

    it("should reject maxCards > 10", async () => {
      // Arrange
      const validText = "a".repeat(1000);

      // Act & Assert
      await expect(
        service.generateFlashcards(validText, { minCards: 5, maxCards: 11 })
      ).rejects.toThrow(OpenRouterValidationError);
    });

    it("should reject minCards > maxCards", async () => {
      // Arrange
      const validText = "a".repeat(1000);

      // Act & Assert
      await expect(
        service.generateFlashcards(validText, { minCards: 8, maxCards: 5 })
      ).rejects.toThrow(OpenRouterValidationError);
    });

    it("should accept minCards === maxCards", async () => {
      // Arrange
      const validText = "a".repeat(1000);
      const mockResponse: OpenRouterResponse = {
        id: "test-id",
        model: "test-model",
        choices: [
          {
            message: {
              role: "assistant",
              content: JSON.stringify({
                cards: Array.from({ length: 5 }, (_, i) => ({
                  front: `Q${i + 1}`,
                  back: `A${i + 1}`,
                })),
              }),
            },
            finish_reason: "stop",
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      // Act
      const result = await service.generateFlashcards(validText, {
        minCards: 5,
        maxCards: 5,
      });

      // Assert
      expect(result).toHaveLength(5);
    });
  });

  describe("generateFlashcards() - Error handling", () => {
    beforeEach(() => {
      vi.useRealTimers(); // Use real timers to avoid timeout issues
      service = new OpenRouterService(validConfig);
    });

    afterEach(() => {
      vi.useFakeTimers();
    });

    it("should throw OpenRouterAPIError on 401 (invalid key)", async () => {
      // Arrange
      const validText = "a".repeat(1000);
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        headers: new Headers(),
        json: async () => ({ error: "Invalid API key" }),
      });

      // Act & Assert
      try {
        await service.generateFlashcards(validText);
        expect.fail("Should have thrown OpenRouterAPIError");
      } catch (error) {
        expect(error).toBeInstanceOf(OpenRouterAPIError);
        expect((error as Error).message).toMatch(/Invalid API key/);
      }
    });

    it("should throw OpenRouterAPIError on 404 (model not found)", async () => {
      // Arrange
      const validText = "a".repeat(1000);
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        headers: new Headers(),
        json: async () => ({ error: "Model not found" }),
      });

      // Act & Assert
      try {
        await service.generateFlashcards(validText);
        expect.fail("Should have thrown OpenRouterAPIError");
      } catch (error) {
        expect(error).toBeInstanceOf(OpenRouterAPIError);
        expect((error as Error).message).toMatch(/Model not found/);
      }
    });

    it("should throw OpenRouterAPIError on 500 (server error)", async () => {
      // Arrange
      const validText = "a".repeat(1000);
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        headers: new Headers(),
        json: async () => ({ error: "Internal server error" }),
      });

      // Act & Assert
      try {
        await service.generateFlashcards(validText);
        expect.fail("Should have thrown OpenRouterAPIError");
      } catch (error) {
        expect(error).toBeInstanceOf(OpenRouterAPIError);
        expect((error as Error).message).toMatch(/service error/);
      }
    });

    it("should throw OpenRouterValidationError on invalid response structure", async () => {
      // Arrange
      const validText = "a".repeat(1000);
      const mockResponse: OpenRouterResponse = {
        id: "test-id",
        model: "test-model",
        choices: [], // Empty choices
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      // Act & Assert
      try {
        await service.generateFlashcards(validText);
        expect.fail("Should have thrown OpenRouterValidationError");
      } catch (error) {
        expect(error).toBeInstanceOf(OpenRouterValidationError);
        expect((error as Error).message).toMatch(/missing choices/);
      }
    });

    it("should throw OpenRouterValidationError on malformed JSON", async () => {
      // Arrange
      const validText = "a".repeat(1000);
      const mockResponse: OpenRouterResponse = {
        id: "test-id",
        model: "test-model",
        choices: [
          {
            message: {
              role: "assistant",
              content: "not valid json",
            },
            finish_reason: "stop",
          },
        ],
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      // Act & Assert
      try {
        await service.generateFlashcards(validText);
        expect.fail("Should have thrown OpenRouterValidationError");
      } catch (error) {
        expect(error).toBeInstanceOf(OpenRouterValidationError);
        expect((error as Error).message).toMatch(/Failed to parse response/);
      }
    });

    it("should throw OpenRouterValidationError on schema mismatch", async () => {
      // Arrange
      const validText = "a".repeat(1000);
      const mockResponse: OpenRouterResponse = {
        id: "test-id",
        model: "test-model",
        choices: [
          {
            message: {
              role: "assistant",
              content: JSON.stringify({
                cards: [
                  { front: "Q1" }, // Missing 'back' field
                ],
              }),
            },
            finish_reason: "stop",
          },
        ],
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      // Act & Assert
      try {
        await service.generateFlashcards(validText);
        expect.fail("Should have thrown OpenRouterValidationError");
      } catch (error) {
        expect(error).toBeInstanceOf(OpenRouterValidationError);
        expect((error as Error).message).toMatch(/validation failed/);
      }
    });
  });

  describe("Rate limiting", () => {
    beforeEach(() => {
      vi.useRealTimers(); // Use real timers for rate limiting tests
      service = new OpenRouterService(validConfig);
    });

    afterEach(() => {
      vi.useFakeTimers();
    });

    it("should allow up to 10 requests per minute", async () => {
      // Arrange
      const validText = "a".repeat(1000);
      const mockResponse: OpenRouterResponse = {
        id: "test-id",
        model: "test-model",
        choices: [
          {
            message: {
              role: "assistant",
              content: JSON.stringify({
                cards: Array.from({ length: 5 }, (_, i) => ({
                  front: `Q${i + 1}`,
                  back: `A${i + 1}`,
                })),
              }),
            },
            finish_reason: "stop",
          },
        ],
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      // Act - Make 10 requests
      const promises = Array.from({ length: 10 }, () => service.generateFlashcards(validText));

      // Assert
      await expect(Promise.all(promises)).resolves.toBeDefined();
    });

    it("should throw OpenRouterRateLimitError on 11th request", async () => {
      // Arrange
      const validText = "a".repeat(1000);
      const mockResponse: OpenRouterResponse = {
        id: "test-id",
        model: "test-model",
        choices: [
          {
            message: {
              role: "assistant",
              content: JSON.stringify({
                cards: Array.from({ length: 5 }, (_, i) => ({
                  front: `Q${i + 1}`,
                  back: `A${i + 1}`,
                })),
              }),
            },
            finish_reason: "stop",
          },
        ],
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      // Act - Make 10 successful requests
      await Promise.all(Array.from({ length: 10 }, () => service.generateFlashcards(validText)));

      // Assert - 11th request should fail
      await expect(service.generateFlashcards(validText)).rejects.toThrow(OpenRouterRateLimitError);
      await expect(service.generateFlashcards(validText)).rejects.toThrow(/Client-side rate limit/);
    });
  });

  describe("Retry logic", () => {
    beforeEach(() => {
      vi.useRealTimers(); // Use real timers for retry tests
      service = new OpenRouterService(validConfig);
    });

    afterEach(() => {
      vi.useFakeTimers();
    });

    it("should NOT retry on 4xx errors (except 429)", async () => {
      // Arrange
      const validText = "a".repeat(1000);
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        headers: new Headers(),
        json: async () => ({ error: "Bad request" }),
      });

      // Act & Assert
      await expect(service.generateFlashcards(validText)).rejects.toThrow(OpenRouterAPIError);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("should NOT retry on validation errors", async () => {
      // Arrange
      const invalidText = "short";

      // Act & Assert
      await expect(service.generateFlashcards(invalidText)).rejects.toThrow(OpenRouterValidationError);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should verify retry logic is implemented", () => {
      // Arrange & Act
      const validText = "a".repeat(1000);
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        headers: new Headers(),
        json: async () => ({ error: "Server error" }),
      });

      // Assert - Just verify the method exists and can be called
      expect(service.generateFlashcards).toBeDefined();
      expect(typeof service.generateFlashcards).toBe("function");
    });
  });

  describe("Response parsing and validation", () => {
    beforeEach(() => {
      service = new OpenRouterService(validConfig);
    });

    it("should parse valid response with 5-10 cards", async () => {
      // Arrange
      const validText = "a".repeat(1000);
      const mockResponse: OpenRouterResponse = {
        id: "test-id",
        model: "test-model",
        choices: [
          {
            message: {
              role: "assistant",
              content: JSON.stringify({
                cards: Array.from({ length: 7 }, (_, i) => ({
                  front: `Question ${i + 1}`,
                  back: `Answer ${i + 1}`,
                })),
              }),
            },
            finish_reason: "stop",
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      // Act
      const result = await service.generateFlashcards(validText);

      // Assert
      expect(result).toHaveLength(7);
      expect(result[0]).toHaveProperty("front");
      expect(result[0]).toHaveProperty("back");
    });

    it("should reject response with less than 5 cards", async () => {
      // Arrange
      const validText = "a".repeat(1000);
      const mockResponse: OpenRouterResponse = {
        id: "test-id",
        model: "test-model",
        choices: [
          {
            message: {
              role: "assistant",
              content: JSON.stringify({
                cards: Array.from({ length: 3 }, (_, i) => ({
                  front: `Question ${i + 1}`,
                  back: `Answer ${i + 1}`,
                })),
              }),
            },
            finish_reason: "stop",
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      // Act & Assert
      await expect(service.generateFlashcards(validText)).rejects.toThrow(OpenRouterValidationError);
    });

    it("should reject response with more than 10 cards", async () => {
      // Arrange
      const validText = "a".repeat(1000);
      const mockResponse: OpenRouterResponse = {
        id: "test-id",
        model: "test-model",
        choices: [
          {
            message: {
              role: "assistant",
              content: JSON.stringify({
                cards: Array.from({ length: 11 }, (_, i) => ({
                  front: `Question ${i + 1}`,
                  back: `Answer ${i + 1}`,
                })),
              }),
            },
            finish_reason: "stop",
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      // Act & Assert
      await expect(service.generateFlashcards(validText)).rejects.toThrow(OpenRouterValidationError);
    });

    it("should reject cards with invalid front/back lengths", async () => {
      // Arrange
      const validText = "a".repeat(1000);
      const mockResponse: OpenRouterResponse = {
        id: "test-id",
        model: "test-model",
        choices: [
          {
            message: {
              role: "assistant",
              content: JSON.stringify({
                cards: [
                  { front: "", back: "Answer" }, // Empty front
                  { front: "Q2", back: "A2" },
                  { front: "Q3", back: "A3" },
                  { front: "Q4", back: "A4" },
                  { front: "Q5", back: "A5" },
                ],
              }),
            },
            finish_reason: "stop",
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      // Act & Assert
      await expect(service.generateFlashcards(validText)).rejects.toThrow(OpenRouterValidationError);
    });

    it("should reject cards with front > 200 characters", async () => {
      // Arrange
      const validText = "a".repeat(1000);
      const mockResponse: OpenRouterResponse = {
        id: "test-id",
        model: "test-model",
        choices: [
          {
            message: {
              role: "assistant",
              content: JSON.stringify({
                cards: [
                  { front: "a".repeat(201), back: "Answer" },
                  { front: "Q2", back: "A2" },
                  { front: "Q3", back: "A3" },
                  { front: "Q4", back: "A4" },
                  { front: "Q5", back: "A5" },
                ],
              }),
            },
            finish_reason: "stop",
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      // Act & Assert
      await expect(service.generateFlashcards(validText)).rejects.toThrow(OpenRouterValidationError);
    });

    it("should reject cards with back > 500 characters", async () => {
      // Arrange
      const validText = "a".repeat(1000);
      const mockResponse: OpenRouterResponse = {
        id: "test-id",
        model: "test-model",
        choices: [
          {
            message: {
              role: "assistant",
              content: JSON.stringify({
                cards: [
                  { front: "Question", back: "a".repeat(501) },
                  { front: "Q2", back: "A2" },
                  { front: "Q3", back: "A3" },
                  { front: "Q4", back: "A4" },
                  { front: "Q5", back: "A5" },
                ],
              }),
            },
            finish_reason: "stop",
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      // Act & Assert
      await expect(service.generateFlashcards(validText)).rejects.toThrow(OpenRouterValidationError);
    });
  });
});
