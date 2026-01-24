import { describe, it, expect } from "vitest";
import { CreateGenerationRequestSchema } from "./generation-request.schema";

describe("Generation Request Schema", () => {
  describe("CreateGenerationRequestSchema", () => {
    it("should accept valid input_text (1000-10000 chars)", () => {
      // Arrange
      const validInput = {
        input_text: "a".repeat(5000),
      };

      // Act
      const result = CreateGenerationRequestSchema.safeParse(validInput);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.input_text).toHaveLength(5000);
      }
    });

    it("should reject missing input_text", () => {
      // Arrange
      const invalidInput = {};

      // Act
      const result = CreateGenerationRequestSchema.safeParse(invalidInput);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("input_text");
        expect(result.error.issues[0].message).toBe("Input text is required");
      }
    });

    it("should reject non-string input_text", () => {
      // Arrange
      const invalidInput = {
        input_text: 12345,
      };

      // Act
      const result = CreateGenerationRequestSchema.safeParse(invalidInput);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("input_text");
        expect(result.error.issues[0].message).toBe("Input text must be a string");
      }
    });

    it("should reject input_text < 1000 characters", () => {
      // Arrange
      const invalidInput = {
        input_text: "a".repeat(999),
      };

      // Act
      const result = CreateGenerationRequestSchema.safeParse(invalidInput);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("input_text");
        expect(result.error.issues[0].message).toBe("Input text must be between 1000 and 10000 characters");
      }
    });

    it("should reject input_text > 10000 characters", () => {
      // Arrange
      const invalidInput = {
        input_text: "a".repeat(10001),
      };

      // Act
      const result = CreateGenerationRequestSchema.safeParse(invalidInput);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("input_text");
        expect(result.error.issues[0].message).toBe("Input text must be between 1000 and 10000 characters");
      }
    });

    it("should accept exactly 1000 characters", () => {
      // Arrange
      const validInput = {
        input_text: "a".repeat(1000),
      };

      // Act
      const result = CreateGenerationRequestSchema.safeParse(validInput);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.input_text).toHaveLength(1000);
      }
    });

    it("should accept exactly 10000 characters", () => {
      // Arrange
      const validInput = {
        input_text: "a".repeat(10000),
      };

      // Act
      const result = CreateGenerationRequestSchema.safeParse(validInput);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.input_text).toHaveLength(10000);
      }
    });

    it("should provide clear error messages", () => {
      // Arrange
      const invalidInput = {
        input_text: "short",
      };

      // Act
      const result = CreateGenerationRequestSchema.safeParse(invalidInput);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("1000");
        expect(result.error.issues[0].message).toContain("10000");
      }
    });

    it("should include field name in error", () => {
      // Arrange
      const invalidInput = {
        input_text: "too short",
      };

      // Act
      const result = CreateGenerationRequestSchema.safeParse(invalidInput);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(["input_text"]);
      }
    });

    it("should validate input_text type", () => {
      // Arrange
      const invalidInputs = [
        { input_text: null },
        { input_text: undefined },
        { input_text: [] },
        { input_text: {} },
        { input_text: true },
      ];

      // Act & Assert
      invalidInputs.forEach((invalidInput) => {
        const result = CreateGenerationRequestSchema.safeParse(invalidInput);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain("input_text");
        }
      });
    });
  });
});
