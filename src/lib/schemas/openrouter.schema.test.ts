import { describe, it, expect } from "vitest";
import {
  FlashcardItemSchema,
  FlashcardsResponseSchema,
  OpenRouterConfigSchema,
} from "./openrouter.schema";

describe("OpenRouter Schemas", () => {
  describe("FlashcardItemSchema", () => {
    it("should accept valid flashcard with front and back", () => {
      // Arrange
      const validCard = {
        front: "What is TypeScript?",
        back: "TypeScript is a typed superset of JavaScript",
      };

      // Act
      const result = FlashcardItemSchema.safeParse(validCard);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validCard);
      }
    });

    it("should reject missing front field", () => {
      // Arrange
      const invalidCard = {
        back: "Answer without question",
      };

      // Act
      const result = FlashcardItemSchema.safeParse(invalidCard);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("front");
        expect(result.error.issues[0].message).toMatch(/required/i);
      }
    });

    it("should reject missing back field", () => {
      // Arrange
      const invalidCard = {
        front: "Question without answer",
      };

      // Act
      const result = FlashcardItemSchema.safeParse(invalidCard);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("back");
        expect(result.error.issues[0].message).toMatch(/required/i);
      }
    });

    it("should reject front shorter than 1 character", () => {
      // Arrange
      const invalidCard = {
        front: "",
        back: "Valid answer",
      };

      // Act
      const result = FlashcardItemSchema.safeParse(invalidCard);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("front");
        expect(result.error.issues[0].message).toMatch(/at least 1 character/);
      }
    });

    it("should reject front longer than 200 characters", () => {
      // Arrange
      const invalidCard = {
        front: "a".repeat(201),
        back: "Valid answer",
      };

      // Act
      const result = FlashcardItemSchema.safeParse(invalidCard);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("front");
        expect(result.error.issues[0].message).toMatch(/not exceed 200 characters/);
      }
    });

    it("should reject back shorter than 1 character", () => {
      // Arrange
      const invalidCard = {
        front: "Valid question",
        back: "",
      };

      // Act
      const result = FlashcardItemSchema.safeParse(invalidCard);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("back");
        expect(result.error.issues[0].message).toMatch(/at least 1 character/);
      }
    });

    it("should reject back longer than 500 characters", () => {
      // Arrange
      const invalidCard = {
        front: "Valid question",
        back: "a".repeat(501),
      };

      // Act
      const result = FlashcardItemSchema.safeParse(invalidCard);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("back");
        expect(result.error.issues[0].message).toMatch(/not exceed 500 characters/);
      }
    });

    it("should accept front and back at boundary lengths", () => {
      // Arrange
      const validCard = {
        front: "a".repeat(200), // Exactly 200
        back: "b".repeat(500), // Exactly 500
      };

      // Act
      const result = FlashcardItemSchema.safeParse(validCard);

      // Assert
      expect(result.success).toBe(true);
    });
  });

  describe("FlashcardsResponseSchema", () => {
    it("should accept array of 5-10 flashcards", () => {
      // Arrange
      const validResponse = {
        cards: Array.from({ length: 7 }, (_, i) => ({
          front: `Question ${i + 1}`,
          back: `Answer ${i + 1}`,
        })),
      };

      // Act
      const result = FlashcardsResponseSchema.safeParse(validResponse);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.cards).toHaveLength(7);
      }
    });

    it("should reject array with less than 5 cards", () => {
      // Arrange
      const invalidResponse = {
        cards: Array.from({ length: 4 }, (_, i) => ({
          front: `Question ${i + 1}`,
          back: `Answer ${i + 1}`,
        })),
      };

      // Act
      const result = FlashcardsResponseSchema.safeParse(invalidResponse);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("cards");
        expect(result.error.issues[0].message).toMatch(/At least 5 flashcards/);
      }
    });

    it("should reject array with more than 10 cards", () => {
      // Arrange
      const invalidResponse = {
        cards: Array.from({ length: 11 }, (_, i) => ({
          front: `Question ${i + 1}`,
          back: `Answer ${i + 1}`,
        })),
      };

      // Act
      const result = FlashcardsResponseSchema.safeParse(invalidResponse);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("cards");
        expect(result.error.issues[0].message).toMatch(/Maximum 10 flashcards/);
      }
    });

    it("should reject missing cards field", () => {
      // Arrange
      const invalidResponse = {};

      // Act
      const result = FlashcardsResponseSchema.safeParse(invalidResponse);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("cards");
        expect(result.error.issues[0].message).toMatch(/required/i);
      }
    });

    it("should reject non-array cards field", () => {
      // Arrange
      const invalidResponse = {
        cards: "not an array",
      };

      // Act
      const result = FlashcardsResponseSchema.safeParse(invalidResponse);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toMatch(/array/i);
      }
    });

    it("should validate each card in array", () => {
      // Arrange
      const invalidResponse = {
        cards: [
          { front: "Q1", back: "A1" },
          { front: "Q2", back: "A2" },
          { front: "", back: "A3" }, // Invalid: empty front
          { front: "Q4", back: "A4" },
          { front: "Q5", back: "A5" },
        ],
      };

      // Act
      const result = FlashcardsResponseSchema.safeParse(invalidResponse);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain(2); // Index of invalid card
        expect(result.error.issues[0].path).toContain("front");
      }
    });
  });

  describe("OpenRouterConfigSchema", () => {
    it("should accept valid configuration", () => {
      // Arrange
      const validConfig = {
        apiKey: "sk-or-v1-1234567890abcdef",
        defaultModel: "openai/gpt-oss-120b:free",
        timeout: 60000,
        baseUrl: "https://openrouter.ai/api/v1",
      };

      // Act
      const result = OpenRouterConfigSchema.safeParse(validConfig);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validConfig);
      }
    });

    it("should reject missing apiKey", () => {
      // Arrange
      const invalidConfig = {
        defaultModel: "openai/gpt-oss-120b:free",
      };

      // Act
      const result = OpenRouterConfigSchema.safeParse(invalidConfig);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("apiKey");
        expect(result.error.issues[0].message).toMatch(/required/i);
      }
    });

    it("should reject apiKey shorter than 20 characters", () => {
      // Arrange
      const invalidConfig = {
        apiKey: "short-key",
      };

      // Act
      const result = OpenRouterConfigSchema.safeParse(invalidConfig);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("apiKey");
        expect(result.error.issues[0].message).toMatch(/invalid.*too short/i);
      }
    });

    it("should use default model when not provided", () => {
      // Arrange
      const configWithoutModel = {
        apiKey: "sk-or-v1-1234567890abcdef",
      };

      // Act
      const result = OpenRouterConfigSchema.safeParse(configWithoutModel);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.defaultModel).toBe("anthropic/claude-3-haiku");
      }
    });

    it("should use default timeout when not provided", () => {
      // Arrange
      const configWithoutTimeout = {
        apiKey: "sk-or-v1-1234567890abcdef",
      };

      // Act
      const result = OpenRouterConfigSchema.safeParse(configWithoutTimeout);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.timeout).toBe(60000);
      }
    });

    it("should use default baseUrl when not provided", () => {
      // Arrange
      const configWithoutBaseUrl = {
        apiKey: "sk-or-v1-1234567890abcdef",
      };

      // Act
      const result = OpenRouterConfigSchema.safeParse(configWithoutBaseUrl);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.baseUrl).toBe("https://openrouter.ai/api/v1");
      }
    });

    it("should reject negative timeout", () => {
      // Arrange
      const invalidConfig = {
        apiKey: "sk-or-v1-1234567890abcdef",
        timeout: -1000,
      };

      // Act
      const result = OpenRouterConfigSchema.safeParse(invalidConfig);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("timeout");
      }
    });

    it("should reject timeout > 120000ms", () => {
      // Arrange
      const invalidConfig = {
        apiKey: "sk-or-v1-1234567890abcdef",
        timeout: 150000,
      };

      // Act
      const result = OpenRouterConfigSchema.safeParse(invalidConfig);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("timeout");
        expect(result.error.issues[0].message).toMatch(/cannot exceed 120 seconds/);
      }
    });

    it("should reject invalid baseUrl format", () => {
      // Arrange
      const invalidConfig = {
        apiKey: "sk-or-v1-1234567890abcdef",
        baseUrl: "not-a-valid-url",
      };

      // Act
      const result = OpenRouterConfigSchema.safeParse(invalidConfig);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("baseUrl");
        expect(result.error.issues[0].message).toMatch(/valid URL/i);
      }
    });

    it("should accept custom model", () => {
      // Arrange
      const configWithCustomModel = {
        apiKey: "sk-or-v1-1234567890abcdef",
        defaultModel: "meta-llama/llama-3.3-70b-instruct:free",
      };

      // Act
      const result = OpenRouterConfigSchema.safeParse(configWithCustomModel);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.defaultModel).toBe("meta-llama/llama-3.3-70b-instruct:free");
      }
    });

    it("should accept custom timeout within limits", () => {
      // Arrange
      const configWithCustomTimeout = {
        apiKey: "sk-or-v1-1234567890abcdef",
        timeout: 30000,
      };

      // Act
      const result = OpenRouterConfigSchema.safeParse(configWithCustomTimeout);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.timeout).toBe(30000);
      }
    });
  });
});
