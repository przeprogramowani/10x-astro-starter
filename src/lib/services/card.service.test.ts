import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createCard,
  createCards,
  getCards,
  getCardById,
  updateCard,
  deleteCard,
} from "./card.service";
import type { SupabaseClientType } from "./card.service";
import type { CreateCardCommand, GetCardsQueryParams, CardEntity } from "../../types";

// Mock console.error to avoid noise in test output
const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

describe("Card Service", () => {
  let mockSupabase: SupabaseClientType;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create mock Supabase client
    mockSupabase = {
      from: vi.fn(),
    } as unknown as SupabaseClientType;
  });

  describe("createCard()", () => {
    describe("Successful creation", () => {
      it("should insert single card to database", async () => {
        // Arrange
        const cardData: CreateCardCommand = {
          front: "What is TypeScript?",
          back: "A typed superset of JavaScript",
        };
        const userId = "user-123";

        const mockResponse: CardEntity = {
          id: "card-123",
          user_id: userId,
          front: cardData.front,
          back: cardData.back,
          source: "manual",
          repetitions: 0,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        };

        const mockSingle = vi.fn().mockResolvedValue({
          data: mockResponse,
          error: null,
        });

        const mockSelect = vi.fn().mockReturnValue({
          single: mockSingle,
        });

        const mockInsert = vi.fn().mockReturnValue({
          select: mockSelect,
        });

        (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
          insert: mockInsert,
        });

        // Act
        const result = await createCard(cardData, userId, mockSupabase);

        // Assert
        expect(result).toEqual(mockResponse);
        expect(mockSupabase.from).toHaveBeenCalledWith("cards");
        expect(mockInsert).toHaveBeenCalledWith({
          user_id: userId,
          front: cardData.front,
          back: cardData.back,
          source: "manual",
          repetitions: 0,
        });
      });

      it("should return created entity with all fields", async () => {
        // Arrange
        const cardData: CreateCardCommand = {
          front: "Front text",
          back: "Back text",
        };
        const userId = "user-456";

        const mockResponse: CardEntity = {
          id: "card-456",
          user_id: userId,
          front: cardData.front,
          back: cardData.back,
          source: "manual",
          repetitions: 0,
          created_at: "2024-01-02T12:00:00Z",
          updated_at: "2024-01-02T12:00:00Z",
        };

        const mockSingle = vi.fn().mockResolvedValue({
          data: mockResponse,
          error: null,
        });

        const mockSelect = vi.fn().mockReturnValue({
          single: mockSingle,
        });

        const mockInsert = vi.fn().mockReturnValue({
          select: mockSelect,
        });

        (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
          insert: mockInsert,
        });

        // Act
        const result = await createCard(cardData, userId, mockSupabase);

        // Assert
        expect(result).toHaveProperty("id");
        expect(result).toHaveProperty("created_at");
        expect(result).toHaveProperty("updated_at");
        expect(result.source).toBe("manual");
        expect(result.repetitions).toBe(0);
      });

      it("should set source to 'manual' by default", async () => {
        // Arrange
        const cardData: CreateCardCommand = {
          front: "Question",
          back: "Answer",
        };
        const userId = "user-789";

        const mockResponse: CardEntity = {
          id: "card-789",
          user_id: userId,
          front: cardData.front,
          back: cardData.back,
          source: "manual",
          repetitions: 0,
          created_at: "2024-01-03T08:00:00Z",
          updated_at: "2024-01-03T08:00:00Z",
        };

        const mockSingle = vi.fn().mockResolvedValue({
          data: mockResponse,
          error: null,
        });

        const mockSelect = vi.fn().mockReturnValue({
          single: mockSingle,
        });

        const mockInsert = vi.fn().mockReturnValue({
          select: mockSelect,
        });

        (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
          insert: mockInsert,
        });

        // Act
        const result = await createCard(cardData, userId, mockSupabase);

        // Assert
        expect(mockInsert).toHaveBeenCalledWith(
          expect.objectContaining({
            source: "manual",
          })
        );
        expect(result.source).toBe("manual");
      });

      it("should set repetitions to 0 by default", async () => {
        // Arrange
        const cardData: CreateCardCommand = {
          front: "Front",
          back: "Back",
        };
        const userId = "user-abc";

        const mockResponse: CardEntity = {
          id: "card-abc",
          user_id: userId,
          front: cardData.front,
          back: cardData.back,
          source: "manual",
          repetitions: 0,
          created_at: "2024-01-04T14:30:00Z",
          updated_at: "2024-01-04T14:30:00Z",
        };

        const mockSingle = vi.fn().mockResolvedValue({
          data: mockResponse,
          error: null,
        });

        const mockSelect = vi.fn().mockReturnValue({
          single: mockSingle,
        });

        const mockInsert = vi.fn().mockReturnValue({
          select: mockSelect,
        });

        (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
          insert: mockInsert,
        });

        // Act
        const result = await createCard(cardData, userId, mockSupabase);

        // Assert
        expect(mockInsert).toHaveBeenCalledWith(
          expect.objectContaining({
            repetitions: 0,
          })
        );
        expect(result.repetitions).toBe(0);
      });
    });

    describe("Database errors", () => {
      it("should throw Error when insert fails", async () => {
        // Arrange
        const cardData: CreateCardCommand = {
          front: "Front",
          back: "Back",
        };
        const userId = "user-error";

        const mockError = {
          message: "Database connection failed",
          code: "PGRST301",
        };

        const mockSingle = vi.fn().mockResolvedValue({
          data: null,
          error: mockError,
        });

        const mockSelect = vi.fn().mockReturnValue({
          single: mockSingle,
        });

        const mockInsert = vi.fn().mockReturnValue({
          select: mockSelect,
        });

        (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
          insert: mockInsert,
        });

        // Act & Assert
        await expect(createCard(cardData, userId, mockSupabase)).rejects.toThrow(
          /Failed to create card/
        );
      });

      it("should log error to console.error", async () => {
        // Arrange
        const cardData: CreateCardCommand = {
          front: "Front",
          back: "Back",
        };
        const userId = "user-log";

        const mockError = {
          message: "Constraint violation",
          code: "23505",
        };

        const mockSingle = vi.fn().mockResolvedValue({
          data: null,
          error: mockError,
        });

        const mockSelect = vi.fn().mockReturnValue({
          single: mockSingle,
        });

        const mockInsert = vi.fn().mockReturnValue({
          select: mockSelect,
        });

        (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
          insert: mockInsert,
        });

        // Act
        try {
          await createCard(cardData, userId, mockSupabase);
        } catch {
          // Expected to throw
        }

        // Assert
        expect(consoleErrorSpy).toHaveBeenCalledWith("Failed to create card:", mockError);
      });

      it("should include error message in thrown error", async () => {
        // Arrange
        const cardData: CreateCardCommand = {
          front: "Front",
          back: "Back",
        };
        const userId = "user-msg";

        const mockError = {
          message: "Foreign key constraint failed",
          code: "23503",
        };

        const mockSingle = vi.fn().mockResolvedValue({
          data: null,
          error: mockError,
        });

        const mockSelect = vi.fn().mockReturnValue({
          single: mockSingle,
        });

        const mockInsert = vi.fn().mockReturnValue({
          select: mockSelect,
        });

        (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
          insert: mockInsert,
        });

        // Act & Assert
        await expect(createCard(cardData, userId, mockSupabase)).rejects.toThrow(
          "Failed to create card: Foreign key constraint failed"
        );
      });

      it("should handle missing data in response", async () => {
        // Arrange
        const cardData: CreateCardCommand = {
          front: "Front",
          back: "Back",
        };
        const userId = "user-null";

        const mockSingle = vi.fn().mockResolvedValue({
          data: null,
          error: null,
        });

        const mockSelect = vi.fn().mockReturnValue({
          single: mockSingle,
        });

        const mockInsert = vi.fn().mockReturnValue({
          select: mockSelect,
        });

        (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
          insert: mockInsert,
        });

        // Act & Assert
        await expect(createCard(cardData, userId, mockSupabase)).rejects.toThrow(
          "Card created but no data returned"
        );
      });
    });

    describe("Data validation", () => {
      it("should pass through front and back text correctly", async () => {
        // Arrange
        const cardData: CreateCardCommand = {
          front: "Custom front text",
          back: "Custom back text",
        };
        const userId = "user-valid";

        const mockResponse: CardEntity = {
          id: "card-valid",
          user_id: userId,
          front: cardData.front,
          back: cardData.back,
          source: "manual",
          repetitions: 0,
          created_at: "2024-01-05T10:00:00Z",
          updated_at: "2024-01-05T10:00:00Z",
        };

        const mockSingle = vi.fn().mockResolvedValue({
          data: mockResponse,
          error: null,
        });

        const mockSelect = vi.fn().mockReturnValue({
          single: mockSingle,
        });

        const mockInsert = vi.fn().mockReturnValue({
          select: mockSelect,
        });

        (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
          insert: mockInsert,
        });

        // Act
        const result = await createCard(cardData, userId, mockSupabase);

        // Assert
        expect(result.front).toBe(cardData.front);
        expect(result.back).toBe(cardData.back);
        expect(mockInsert).toHaveBeenCalledWith(
          expect.objectContaining({
            front: cardData.front,
            back: cardData.back,
          })
        );
      });

      it("should handle long text content", async () => {
        // Arrange
        const longText = "a".repeat(5000);
        const cardData: CreateCardCommand = {
          front: longText,
          back: longText,
        };
        const userId = "user-long";

        const mockResponse: CardEntity = {
          id: "card-long",
          user_id: userId,
          front: longText,
          back: longText,
          source: "manual",
          repetitions: 0,
          created_at: "2024-01-06T16:00:00Z",
          updated_at: "2024-01-06T16:00:00Z",
        };

        const mockSingle = vi.fn().mockResolvedValue({
          data: mockResponse,
          error: null,
        });

        const mockSelect = vi.fn().mockReturnValue({
          single: mockSingle,
        });

        const mockInsert = vi.fn().mockReturnValue({
          select: mockSelect,
        });

        (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
          insert: mockInsert,
        });

        // Act
        const result = await createCard(cardData, userId, mockSupabase);

        // Assert
        expect(result.front).toBe(longText);
        expect(result.back).toBe(longText);
      });

      it("should handle special characters in text", async () => {
        // Arrange
        const specialText = "Test with 'quotes', \"double quotes\", and <html> & symbols";
        const cardData: CreateCardCommand = {
          front: specialText,
          back: specialText,
        };
        const userId = "user-special";

        const mockResponse: CardEntity = {
          id: "card-special",
          user_id: userId,
          front: specialText,
          back: specialText,
          source: "manual",
          repetitions: 0,
          created_at: "2024-01-07T18:00:00Z",
          updated_at: "2024-01-07T18:00:00Z",
        };

        const mockSingle = vi.fn().mockResolvedValue({
          data: mockResponse,
          error: null,
        });

        const mockSelect = vi.fn().mockReturnValue({
          single: mockSingle,
        });

        const mockInsert = vi.fn().mockReturnValue({
          select: mockSelect,
        });

        (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
          insert: mockInsert,
        });

        // Act
        const result = await createCard(cardData, userId, mockSupabase);

        // Assert
        expect(result.front).toBe(specialText);
        expect(result.back).toBe(specialText);
      });
    });
  });

  describe("createCards()", () => {
    describe("Successful bulk creation", () => {
      it("should insert multiple cards to database", async () => {
        // Arrange
        const cardsData: CreateCardCommand[] = [
          { front: "Question 1", back: "Answer 1" },
          { front: "Question 2", back: "Answer 2" },
          { front: "Question 3", back: "Answer 3" },
        ];
        const userId = "user-123";

        const mockResponse: CardEntity[] = cardsData.map((card, index) => ({
          id: `card-${index}`,
          user_id: userId,
          front: card.front,
          back: card.back,
          source: "manual",
          repetitions: 0,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        }));

        const mockSelect = vi.fn().mockResolvedValue({
          data: mockResponse,
          error: null,
        });

        const mockInsert = vi.fn().mockReturnValue({
          select: mockSelect,
        });

        (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
          insert: mockInsert,
        });

        // Act
        const result = await createCards(cardsData, userId, mockSupabase);

        // Assert
        expect(result).toEqual(mockResponse);
        expect(result).toHaveLength(3);
        expect(mockSupabase.from).toHaveBeenCalledWith("cards");
      });

      it("should set source to 'manual' by default", async () => {
        // Arrange
        const cardsData: CreateCardCommand[] = [
          { front: "Q1", back: "A1" },
          { front: "Q2", back: "A2" },
        ];
        const userId = "user-456";

        const mockResponse: CardEntity[] = cardsData.map((card, index) => ({
          id: `card-${index}`,
          user_id: userId,
          front: card.front,
          back: card.back,
          source: "manual",
          repetitions: 0,
          created_at: "2024-01-02T12:00:00Z",
          updated_at: "2024-01-02T12:00:00Z",
        }));

        const mockSelect = vi.fn().mockResolvedValue({
          data: mockResponse,
          error: null,
        });

        const mockInsert = vi.fn().mockReturnValue({
          select: mockSelect,
        });

        (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
          insert: mockInsert,
        });

        // Act
        const result = await createCards(cardsData, userId, mockSupabase);

        // Assert
        expect(mockInsert).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({ source: "manual" }),
            expect.objectContaining({ source: "manual" }),
          ])
        );
        expect(result.every((card) => card.source === "manual")).toBe(true);
      });

      it("should set source to 'ai' when specified", async () => {
        // Arrange
        const cardsData: CreateCardCommand[] = [
          { front: "AI Q1", back: "AI A1" },
          { front: "AI Q2", back: "AI A2" },
        ];
        const userId = "user-789";

        const mockResponse: CardEntity[] = cardsData.map((card, index) => ({
          id: `card-${index}`,
          user_id: userId,
          front: card.front,
          back: card.back,
          source: "ai",
          repetitions: 0,
          created_at: "2024-01-03T08:00:00Z",
          updated_at: "2024-01-03T08:00:00Z",
        }));

        const mockSelect = vi.fn().mockResolvedValue({
          data: mockResponse,
          error: null,
        });

        const mockInsert = vi.fn().mockReturnValue({
          select: mockSelect,
        });

        (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
          insert: mockInsert,
        });

        // Act
        const result = await createCards(cardsData, userId, mockSupabase, "ai");

        // Assert
        expect(mockInsert).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({ source: "ai" }),
            expect.objectContaining({ source: "ai" }),
          ])
        );
        expect(result.every((card) => card.source === "ai")).toBe(true);
      });

      it("should set repetitions to 0 for all cards", async () => {
        // Arrange
        const cardsData: CreateCardCommand[] = [
          { front: "Q1", back: "A1" },
          { front: "Q2", back: "A2" },
        ];
        const userId = "user-abc";

        const mockResponse: CardEntity[] = cardsData.map((card, index) => ({
          id: `card-${index}`,
          user_id: userId,
          front: card.front,
          back: card.back,
          source: "manual",
          repetitions: 0,
          created_at: "2024-01-04T14:30:00Z",
          updated_at: "2024-01-04T14:30:00Z",
        }));

        const mockSelect = vi.fn().mockResolvedValue({
          data: mockResponse,
          error: null,
        });

        const mockInsert = vi.fn().mockReturnValue({
          select: mockSelect,
        });

        (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
          insert: mockInsert,
        });

        // Act
        const result = await createCards(cardsData, userId, mockSupabase);

        // Assert
        expect(mockInsert).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({ repetitions: 0 }),
            expect.objectContaining({ repetitions: 0 }),
          ])
        );
        expect(result.every((card) => card.repetitions === 0)).toBe(true);
      });

      it("should handle single card in array", async () => {
        // Arrange
        const cardsData: CreateCardCommand[] = [{ front: "Single Q", back: "Single A" }];
        const userId = "user-single";

        const mockResponse: CardEntity[] = [
          {
            id: "card-single",
            user_id: userId,
            front: cardsData[0].front,
            back: cardsData[0].back,
            source: "manual",
            repetitions: 0,
            created_at: "2024-01-05T10:00:00Z",
            updated_at: "2024-01-05T10:00:00Z",
          },
        ];

        const mockSelect = vi.fn().mockResolvedValue({
          data: mockResponse,
          error: null,
        });

        const mockInsert = vi.fn().mockReturnValue({
          select: mockSelect,
        });

        (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
          insert: mockInsert,
        });

        // Act
        const result = await createCards(cardsData, userId, mockSupabase);

        // Assert
        expect(result).toHaveLength(1);
        expect(result[0].front).toBe(cardsData[0].front);
      });

      it("should handle large batch of cards", async () => {
        // Arrange
        const cardsData: CreateCardCommand[] = Array.from({ length: 50 }, (_, i) => ({
          front: `Question ${i}`,
          back: `Answer ${i}`,
        }));
        const userId = "user-batch";

        const mockResponse: CardEntity[] = cardsData.map((card, index) => ({
          id: `card-${index}`,
          user_id: userId,
          front: card.front,
          back: card.back,
          source: "manual",
          repetitions: 0,
          created_at: "2024-01-06T16:00:00Z",
          updated_at: "2024-01-06T16:00:00Z",
        }));

        const mockSelect = vi.fn().mockResolvedValue({
          data: mockResponse,
          error: null,
        });

        const mockInsert = vi.fn().mockReturnValue({
          select: mockSelect,
        });

        (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
          insert: mockInsert,
        });

        // Act
        const result = await createCards(cardsData, userId, mockSupabase);

        // Assert
        expect(result).toHaveLength(50);
        expect(mockInsert).toHaveBeenCalledWith(expect.any(Array));
        expect(mockInsert).toHaveBeenCalledTimes(1);
      });
    });

    describe("Database errors", () => {
      it("should throw Error when insert fails", async () => {
        // Arrange
        const cardsData: CreateCardCommand[] = [
          { front: "Q1", back: "A1" },
          { front: "Q2", back: "A2" },
        ];
        const userId = "user-error";

        const mockError = {
          message: "Database connection failed",
          code: "PGRST301",
        };

        const mockSelect = vi.fn().mockResolvedValue({
          data: null,
          error: mockError,
        });

        const mockInsert = vi.fn().mockReturnValue({
          select: mockSelect,
        });

        (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
          insert: mockInsert,
        });

        // Act & Assert
        await expect(createCards(cardsData, userId, mockSupabase)).rejects.toThrow(
          /Failed to create cards/
        );
      });

      it("should log error to console.error", async () => {
        // Arrange
        const cardsData: CreateCardCommand[] = [{ front: "Q", back: "A" }];
        const userId = "user-log";

        const mockError = {
          message: "Constraint violation",
          code: "23505",
        };

        const mockSelect = vi.fn().mockResolvedValue({
          data: null,
          error: mockError,
        });

        const mockInsert = vi.fn().mockReturnValue({
          select: mockSelect,
        });

        (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
          insert: mockInsert,
        });

        // Act
        try {
          await createCards(cardsData, userId, mockSupabase);
        } catch {
          // Expected to throw
        }

        // Assert
        expect(consoleErrorSpy).toHaveBeenCalledWith("Failed to create cards:", mockError);
      });

      it("should include error message in thrown error", async () => {
        // Arrange
        const cardsData: CreateCardCommand[] = [{ front: "Q", back: "A" }];
        const userId = "user-msg";

        const mockError = {
          message: "Foreign key constraint failed",
          code: "23503",
        };

        const mockSelect = vi.fn().mockResolvedValue({
          data: null,
          error: mockError,
        });

        const mockInsert = vi.fn().mockReturnValue({
          select: mockSelect,
        });

        (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
          insert: mockInsert,
        });

        // Act & Assert
        await expect(createCards(cardsData, userId, mockSupabase)).rejects.toThrow(
          "Failed to create cards: Foreign key constraint failed"
        );
      });

      it("should handle empty data array in response", async () => {
        // Arrange
        const cardsData: CreateCardCommand[] = [{ front: "Q", back: "A" }];
        const userId = "user-empty";

        const mockSelect = vi.fn().mockResolvedValue({
          data: [],
          error: null,
        });

        const mockInsert = vi.fn().mockReturnValue({
          select: mockSelect,
        });

        (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
          insert: mockInsert,
        });

        // Act & Assert
        await expect(createCards(cardsData, userId, mockSupabase)).rejects.toThrow(
          "Cards created but no data returned"
        );
      });

      it("should handle null data in response", async () => {
        // Arrange
        const cardsData: CreateCardCommand[] = [{ front: "Q", back: "A" }];
        const userId = "user-null";

        const mockSelect = vi.fn().mockResolvedValue({
          data: null,
          error: null,
        });

        const mockInsert = vi.fn().mockReturnValue({
          select: mockSelect,
        });

        (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
          insert: mockInsert,
        });

        // Act & Assert
        await expect(createCards(cardsData, userId, mockSupabase)).rejects.toThrow(
          "Cards created but no data returned"
        );
      });
    });
  });

  describe("getCards()", () => {
    describe("Successful retrieval", () => {
      it("should retrieve cards with default pagination", async () => {
        // Arrange
        const params: GetCardsQueryParams = {};
        const userId = "user-123";

        const mockCards: CardEntity[] = [
          {
            id: "card-1",
            user_id: userId,
            front: "Q1",
            back: "A1",
            source: "manual",
            repetitions: 0,
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-01T00:00:00Z",
          },
          {
            id: "card-2",
            user_id: userId,
            front: "Q2",
            back: "A2",
            source: "ai",
            repetitions: 5,
            created_at: "2024-01-02T00:00:00Z",
            updated_at: "2024-01-02T00:00:00Z",
          },
        ];

        const mockRange = vi.fn().mockResolvedValue({
          data: mockCards,
          error: null,
          count: 2,
        });

        const mockOrder = vi.fn().mockReturnValue({
          range: mockRange,
        });

        const mockEq = vi.fn().mockReturnValue({
          order: mockOrder,
        });

        const mockSelect = vi.fn().mockReturnValue({
          eq: mockEq,
        });

        (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
          select: mockSelect,
        });

        // Act
        const result = await getCards(params, userId, mockSupabase);

        // Assert
        expect(result.data).toEqual(mockCards);
        expect(result.pagination).toEqual({
          total: 2,
          limit: 50,
          offset: 0,
          has_more: false,
        });
        expect(mockSupabase.from).toHaveBeenCalledWith("cards");
        expect(mockSelect).toHaveBeenCalledWith("*", { count: "exact" });
        expect(mockEq).toHaveBeenCalledWith("user_id", userId);
      });

      it("should apply custom limit and offset", async () => {
        // Arrange
        const params: GetCardsQueryParams = {
          limit: 10,
          offset: 20,
        };
        const userId = "user-456";

        const mockCards: CardEntity[] = [];

        const mockRange = vi.fn().mockResolvedValue({
          data: mockCards,
          error: null,
          count: 100,
        });

        const mockOrder = vi.fn().mockReturnValue({
          range: mockRange,
        });

        const mockEq = vi.fn().mockReturnValue({
          order: mockOrder,
        });

        const mockSelect = vi.fn().mockReturnValue({
          eq: mockEq,
        });

        (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
          select: mockSelect,
        });

        // Act
        const result = await getCards(params, userId, mockSupabase);

        // Assert
        expect(mockRange).toHaveBeenCalledWith(20, 29); // offset to offset + limit - 1
        expect(result.pagination.limit).toBe(10);
        expect(result.pagination.offset).toBe(20);
        expect(result.pagination.has_more).toBe(true);
      });

      it("should filter by source when provided", async () => {
        // Arrange
        const params: GetCardsQueryParams = {
          source: "ai",
        };
        const userId = "user-789";

        const mockCards: CardEntity[] = [];

        const mockRange = vi.fn().mockResolvedValue({
          data: mockCards,
          error: null,
          count: 0,
        });

        const mockOrder = vi.fn().mockReturnValue({
          range: mockRange,
        });

        const mockEqSource = vi.fn().mockReturnValue({
          order: mockOrder,
        });

        const mockEqUser = vi.fn().mockReturnValue({
          eq: mockEqSource,
        });

        const mockSelect = vi.fn().mockReturnValue({
          eq: mockEqUser,
        });

        (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
          select: mockSelect,
        });

        // Act
        await getCards(params, userId, mockSupabase);

        // Assert
        expect(mockEqSource).toHaveBeenCalledWith("source", "ai");
      });

      it("should apply custom sort field", async () => {
        // Arrange
        const params: GetCardsQueryParams = {
          sort: "repetitions",
        };
        const userId = "user-abc";

        const mockCards: CardEntity[] = [];

        const mockRange = vi.fn().mockResolvedValue({
          data: mockCards,
          error: null,
          count: 0,
        });

        const mockOrder = vi.fn().mockReturnValue({
          range: mockRange,
        });

        const mockEq = vi.fn().mockReturnValue({
          order: mockOrder,
        });

        const mockSelect = vi.fn().mockReturnValue({
          eq: mockEq,
        });

        (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
          select: mockSelect,
        });

        // Act
        await getCards(params, userId, mockSupabase);

        // Assert
        expect(mockOrder).toHaveBeenCalledWith("repetitions", { ascending: false });
      });

      it("should apply ascending order when specified", async () => {
        // Arrange
        const params: GetCardsQueryParams = {
          order: "asc",
        };
        const userId = "user-def";

        const mockCards: CardEntity[] = [];

        const mockRange = vi.fn().mockResolvedValue({
          data: mockCards,
          error: null,
          count: 0,
        });

        const mockOrder = vi.fn().mockReturnValue({
          range: mockRange,
        });

        const mockEq = vi.fn().mockReturnValue({
          order: mockOrder,
        });

        const mockSelect = vi.fn().mockReturnValue({
          eq: mockEq,
        });

        (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
          select: mockSelect,
        });

        // Act
        await getCards(params, userId, mockSupabase);

        // Assert
        expect(mockOrder).toHaveBeenCalledWith("created_at", { ascending: true });
      });

      it("should calculate has_more correctly when more pages exist", async () => {
        // Arrange
        const params: GetCardsQueryParams = {
          limit: 10,
          offset: 0,
        };
        const userId = "user-more";

        const mockCards: CardEntity[] = Array.from({ length: 10 }, (_, i) => ({
          id: `card-${i}`,
          user_id: userId,
          front: `Q${i}`,
          back: `A${i}`,
          source: "manual",
          repetitions: 0,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        }));

        const mockRange = vi.fn().mockResolvedValue({
          data: mockCards,
          error: null,
          count: 25,
        });

        const mockOrder = vi.fn().mockReturnValue({
          range: mockRange,
        });

        const mockEq = vi.fn().mockReturnValue({
          order: mockOrder,
        });

        const mockSelect = vi.fn().mockReturnValue({
          eq: mockEq,
        });

        (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
          select: mockSelect,
        });

        // Act
        const result = await getCards(params, userId, mockSupabase);

        // Assert
        expect(result.pagination.has_more).toBe(true);
        expect(result.pagination.total).toBe(25);
      });

      it("should calculate has_more as false when on last page", async () => {
        // Arrange
        const params: GetCardsQueryParams = {
          limit: 10,
          offset: 20,
        };
        const userId = "user-last";

        const mockCards: CardEntity[] = Array.from({ length: 5 }, (_, i) => ({
          id: `card-${i}`,
          user_id: userId,
          front: `Q${i}`,
          back: `A${i}`,
          source: "manual",
          repetitions: 0,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        }));

        const mockRange = vi.fn().mockResolvedValue({
          data: mockCards,
          error: null,
          count: 25,
        });

        const mockOrder = vi.fn().mockReturnValue({
          range: mockRange,
        });

        const mockEq = vi.fn().mockReturnValue({
          order: mockOrder,
        });

        const mockSelect = vi.fn().mockReturnValue({
          eq: mockEq,
        });

        (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
          select: mockSelect,
        });

        // Act
        const result = await getCards(params, userId, mockSupabase);

        // Assert
        expect(result.pagination.has_more).toBe(false);
      });

      it("should return empty array when no cards found", async () => {
        // Arrange
        const params: GetCardsQueryParams = {};
        const userId = "user-empty";

        const mockRange = vi.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0,
        });

        const mockOrder = vi.fn().mockReturnValue({
          range: mockRange,
        });

        const mockEq = vi.fn().mockReturnValue({
          order: mockOrder,
        });

        const mockSelect = vi.fn().mockReturnValue({
          eq: mockEq,
        });

        (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
          select: mockSelect,
        });

        // Act
        const result = await getCards(params, userId, mockSupabase);

        // Assert
        expect(result.data).toEqual([]);
        expect(result.pagination.total).toBe(0);
        expect(result.pagination.has_more).toBe(false);
      });

      it("should handle null count as 0", async () => {
        // Arrange
        const params: GetCardsQueryParams = {};
        const userId = "user-null-count";

        const mockRange = vi.fn().mockResolvedValue({
          data: [],
          error: null,
          count: null,
        });

        const mockOrder = vi.fn().mockReturnValue({
          range: mockRange,
        });

        const mockEq = vi.fn().mockReturnValue({
          order: mockOrder,
        });

        const mockSelect = vi.fn().mockReturnValue({
          eq: mockEq,
        });

        (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
          select: mockSelect,
        });

        // Act
        const result = await getCards(params, userId, mockSupabase);

        // Assert
        expect(result.pagination.total).toBe(0);
      });

      it("should handle null data as empty array", async () => {
        // Arrange
        const params: GetCardsQueryParams = {};
        const userId = "user-null-data";

        const mockRange = vi.fn().mockResolvedValue({
          data: null,
          error: null,
          count: 0,
        });

        const mockOrder = vi.fn().mockReturnValue({
          range: mockRange,
        });

        const mockEq = vi.fn().mockReturnValue({
          order: mockOrder,
        });

        const mockSelect = vi.fn().mockReturnValue({
          eq: mockEq,
        });

        (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
          select: mockSelect,
        });

        // Act
        const result = await getCards(params, userId, mockSupabase);

        // Assert
        expect(result.data).toEqual([]);
      });
    });

    describe("Database errors", () => {
      it("should throw Error when query fails", async () => {
        // Arrange
        const params: GetCardsQueryParams = {};
        const userId = "user-error";

        const mockError = {
          message: "Database connection failed",
          code: "PGRST301",
        };

        const mockRange = vi.fn().mockResolvedValue({
          data: null,
          error: mockError,
          count: null,
        });

        const mockOrder = vi.fn().mockReturnValue({
          range: mockRange,
        });

        const mockEq = vi.fn().mockReturnValue({
          order: mockOrder,
        });

        const mockSelect = vi.fn().mockReturnValue({
          eq: mockEq,
        });

        (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
          select: mockSelect,
        });

        // Act & Assert
        await expect(getCards(params, userId, mockSupabase)).rejects.toThrow(/Failed to get cards/);
      });

      it("should log error to console.error", async () => {
        // Arrange
        const params: GetCardsQueryParams = {};
        const userId = "user-log";

        const mockError = {
          message: "Query timeout",
          code: "PGRST504",
        };

        const mockRange = vi.fn().mockResolvedValue({
          data: null,
          error: mockError,
          count: null,
        });

        const mockOrder = vi.fn().mockReturnValue({
          range: mockRange,
        });

        const mockEq = vi.fn().mockReturnValue({
          order: mockOrder,
        });

        const mockSelect = vi.fn().mockReturnValue({
          eq: mockEq,
        });

        (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
          select: mockSelect,
        });

        // Act
        try {
          await getCards(params, userId, mockSupabase);
        } catch {
          // Expected to throw
        }

        // Assert
        expect(consoleErrorSpy).toHaveBeenCalledWith("Failed to get cards:", mockError);
      });

      it("should include error message in thrown error", async () => {
        // Arrange
        const params: GetCardsQueryParams = {};
        const userId = "user-msg";

        const mockError = {
          message: "Permission denied",
          code: "PGRST403",
        };

        const mockRange = vi.fn().mockResolvedValue({
          data: null,
          error: mockError,
          count: null,
        });

        const mockOrder = vi.fn().mockReturnValue({
          range: mockRange,
        });

        const mockEq = vi.fn().mockReturnValue({
          order: mockOrder,
        });

        const mockSelect = vi.fn().mockReturnValue({
          eq: mockEq,
        });

        (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
          select: mockSelect,
        });

        // Act & Assert
        await expect(getCards(params, userId, mockSupabase)).rejects.toThrow(
          "Failed to get cards: Permission denied"
        );
      });
    });
  });

  describe("getCardById()", () => {
    describe("Successful retrieval", () => {
      it("should retrieve card by id", async () => {
        // Arrange
        const cardId = "card-123";
        const userId = "user-123";

        const mockCard: CardEntity = {
          id: cardId,
          user_id: userId,
          front: "Question",
          back: "Answer",
          source: "manual",
          repetitions: 5,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        };

        const mockSingle = vi.fn().mockResolvedValue({
          data: mockCard,
          error: null,
        });

        const mockEqUser = vi.fn().mockReturnValue({
          single: mockSingle,
        });

        const mockEqCard = vi.fn().mockReturnValue({
          eq: mockEqUser,
        });

        const mockSelect = vi.fn().mockReturnValue({
          eq: mockEqCard,
        });

        (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
          select: mockSelect,
        });

        // Act
        const result = await getCardById(cardId, userId, mockSupabase);

        // Assert
        expect(result).toEqual(mockCard);
        expect(mockSupabase.from).toHaveBeenCalledWith("cards");
        expect(mockEqCard).toHaveBeenCalledWith("id", cardId);
        expect(mockEqUser).toHaveBeenCalledWith("user_id", userId);
      });

      it("should verify card ownership", async () => {
        // Arrange
        const cardId = "card-456";
        const userId = "user-456";

        const mockCard: CardEntity = {
          id: cardId,
          user_id: userId,
          front: "Q",
          back: "A",
          source: "ai",
          repetitions: 0,
          created_at: "2024-01-02T12:00:00Z",
          updated_at: "2024-01-02T12:00:00Z",
        };

        const mockSingle = vi.fn().mockResolvedValue({
          data: mockCard,
          error: null,
        });

        const mockEqUser = vi.fn().mockReturnValue({
          single: mockSingle,
        });

        const mockEqCard = vi.fn().mockReturnValue({
          eq: mockEqUser,
        });

        const mockSelect = vi.fn().mockReturnValue({
          eq: mockEqCard,
        });

        (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
          select: mockSelect,
        });

        // Act
        const result = await getCardById(cardId, userId, mockSupabase);

        // Assert
        expect(result?.user_id).toBe(userId);
        expect(mockEqUser).toHaveBeenCalledWith("user_id", userId);
      });
    });

    describe("Not found scenarios", () => {
      it("should return null when card not found", async () => {
        // Arrange
        const cardId = "non-existent";
        const userId = "user-789";

        const mockError = {
          message: "No rows found",
          code: "PGRST116",
        };

        const mockSingle = vi.fn().mockResolvedValue({
          data: null,
          error: mockError,
        });

        const mockEqUser = vi.fn().mockReturnValue({
          single: mockSingle,
        });

        const mockEqCard = vi.fn().mockReturnValue({
          eq: mockEqUser,
        });

        const mockSelect = vi.fn().mockReturnValue({
          eq: mockEqCard,
        });

        (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
          select: mockSelect,
        });

        // Act
        const result = await getCardById(cardId, userId, mockSupabase);

        // Assert
        expect(result).toBeNull();
      });

      it("should return null when card belongs to different user", async () => {
        // Arrange
        const cardId = "card-abc";
        const userId = "wrong-user";

        const mockError = {
          message: "No rows found",
          code: "PGRST116",
        };

        const mockSingle = vi.fn().mockResolvedValue({
          data: null,
          error: mockError,
        });

        const mockEqUser = vi.fn().mockReturnValue({
          single: mockSingle,
        });

        const mockEqCard = vi.fn().mockReturnValue({
          eq: mockEqUser,
        });

        const mockSelect = vi.fn().mockReturnValue({
          eq: mockEqCard,
        });

        (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
          select: mockSelect,
        });

        // Act
        const result = await getCardById(cardId, userId, mockSupabase);

        // Assert
        expect(result).toBeNull();
      });
    });

    describe("Database errors", () => {
      it("should throw Error for non-PGRST116 errors", async () => {
        // Arrange
        const cardId = "card-error";
        const userId = "user-error";

        const mockError = {
          message: "Database connection failed",
          code: "PGRST301",
        };

        const mockSingle = vi.fn().mockResolvedValue({
          data: null,
          error: mockError,
        });

        const mockEqUser = vi.fn().mockReturnValue({
          single: mockSingle,
        });

        const mockEqCard = vi.fn().mockReturnValue({
          eq: mockEqUser,
        });

        const mockSelect = vi.fn().mockReturnValue({
          eq: mockEqCard,
        });

        (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
          select: mockSelect,
        });

        // Act & Assert
        await expect(getCardById(cardId, userId, mockSupabase)).rejects.toThrow(
          /Failed to get card/
        );
      });

      it("should log error to console.error for non-PGRST116 errors", async () => {
        // Arrange
        const cardId = "card-log";
        const userId = "user-log";

        const mockError = {
          message: "Query timeout",
          code: "PGRST504",
        };

        const mockSingle = vi.fn().mockResolvedValue({
          data: null,
          error: mockError,
        });

        const mockEqUser = vi.fn().mockReturnValue({
          single: mockSingle,
        });

        const mockEqCard = vi.fn().mockReturnValue({
          eq: mockEqUser,
        });

        const mockSelect = vi.fn().mockReturnValue({
          eq: mockEqCard,
        });

        (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
          select: mockSelect,
        });

        // Act
        try {
          await getCardById(cardId, userId, mockSupabase);
        } catch {
          // Expected to throw
        }

        // Assert
        expect(consoleErrorSpy).toHaveBeenCalledWith("Failed to get card:", mockError);
      });

      it("should not log error for PGRST116 (not found)", async () => {
        // Arrange
        const cardId = "card-not-found";
        const userId = "user-not-found";

        const mockError = {
          message: "No rows found",
          code: "PGRST116",
        };

        const mockSingle = vi.fn().mockResolvedValue({
          data: null,
          error: mockError,
        });

        const mockEqUser = vi.fn().mockReturnValue({
          single: mockSingle,
        });

        const mockEqCard = vi.fn().mockReturnValue({
          eq: mockEqUser,
        });

        const mockSelect = vi.fn().mockReturnValue({
          eq: mockEqCard,
        });

        (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
          select: mockSelect,
        });

        consoleErrorSpy.mockClear();

        // Act
        await getCardById(cardId, userId, mockSupabase);

        // Assert
        expect(consoleErrorSpy).not.toHaveBeenCalled();
      });
    });
  });

  describe("updateCard()", () => {
    describe("Successful update", () => {
      it("should update card fields", async () => {
        // Arrange
        const cardId = "card-123";
        const userId = "user-123";
        const updateData = {
          front: "Updated question",
          back: "Updated answer",
        };

        const mockCard: CardEntity = {
          id: cardId,
          user_id: userId,
          front: updateData.front,
          back: updateData.back,
          source: "manual",
          repetitions: 0,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T12:00:00Z",
        };

        const mockSingle = vi.fn().mockResolvedValue({
          data: mockCard,
          error: null,
        });

        const mockSelect = vi.fn().mockReturnValue({
          single: mockSingle,
        });

        const mockEqUser = vi.fn().mockReturnValue({
          select: mockSelect,
        });

        const mockEqCard = vi.fn().mockReturnValue({
          eq: mockEqUser,
        });

        const mockUpdate = vi.fn().mockReturnValue({
          eq: mockEqCard,
        });

        (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
          update: mockUpdate,
        });

        // Act
        const result = await updateCard(cardId, updateData, userId, mockSupabase);

        // Assert
        expect(result).toEqual(mockCard);
        expect(mockSupabase.from).toHaveBeenCalledWith("cards");
        expect(mockUpdate).toHaveBeenCalledWith(updateData);
        expect(mockEqCard).toHaveBeenCalledWith("id", cardId);
        expect(mockEqUser).toHaveBeenCalledWith("user_id", userId);
      });

      it("should update only front field", async () => {
        // Arrange
        const cardId = "card-456";
        const userId = "user-456";
        const updateData = {
          front: "New front text",
        };

        const mockCard: CardEntity = {
          id: cardId,
          user_id: userId,
          front: updateData.front,
          back: "Original back",
          source: "manual",
          repetitions: 0,
          created_at: "2024-01-02T00:00:00Z",
          updated_at: "2024-01-02T12:00:00Z",
        };

        const mockSingle = vi.fn().mockResolvedValue({
          data: mockCard,
          error: null,
        });

        const mockSelect = vi.fn().mockReturnValue({
          single: mockSingle,
        });

        const mockEqUser = vi.fn().mockReturnValue({
          select: mockSelect,
        });

        const mockEqCard = vi.fn().mockReturnValue({
          eq: mockEqUser,
        });

        const mockUpdate = vi.fn().mockReturnValue({
          eq: mockEqCard,
        });

        (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
          update: mockUpdate,
        });

        // Act
        const result = await updateCard(cardId, updateData, userId, mockSupabase);

        // Assert
        expect(result?.front).toBe(updateData.front);
        expect(mockUpdate).toHaveBeenCalledWith(updateData);
      });

      it("should update only back field", async () => {
        // Arrange
        const cardId = "card-789";
        const userId = "user-789";
        const updateData = {
          back: "New back text",
        };

        const mockCard: CardEntity = {
          id: cardId,
          user_id: userId,
          front: "Original front",
          back: updateData.back,
          source: "manual",
          repetitions: 0,
          created_at: "2024-01-03T00:00:00Z",
          updated_at: "2024-01-03T12:00:00Z",
        };

        const mockSingle = vi.fn().mockResolvedValue({
          data: mockCard,
          error: null,
        });

        const mockSelect = vi.fn().mockReturnValue({
          single: mockSingle,
        });

        const mockEqUser = vi.fn().mockReturnValue({
          select: mockSelect,
        });

        const mockEqCard = vi.fn().mockReturnValue({
          eq: mockEqUser,
        });

        const mockUpdate = vi.fn().mockReturnValue({
          eq: mockEqCard,
        });

        (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
          update: mockUpdate,
        });

        // Act
        const result = await updateCard(cardId, updateData, userId, mockSupabase);

        // Assert
        expect(result?.back).toBe(updateData.back);
        expect(mockUpdate).toHaveBeenCalledWith(updateData);
      });

      it("should update repetitions field", async () => {
        // Arrange
        const cardId = "card-abc";
        const userId = "user-abc";
        const updateData = {
          repetitions: 10,
        };

        const mockCard: CardEntity = {
          id: cardId,
          user_id: userId,
          front: "Front",
          back: "Back",
          source: "manual",
          repetitions: 10,
          created_at: "2024-01-04T00:00:00Z",
          updated_at: "2024-01-04T12:00:00Z",
        };

        const mockSingle = vi.fn().mockResolvedValue({
          data: mockCard,
          error: null,
        });

        const mockSelect = vi.fn().mockReturnValue({
          single: mockSingle,
        });

        const mockEqUser = vi.fn().mockReturnValue({
          select: mockSelect,
        });

        const mockEqCard = vi.fn().mockReturnValue({
          eq: mockEqUser,
        });

        const mockUpdate = vi.fn().mockReturnValue({
          eq: mockEqCard,
        });

        (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
          update: mockUpdate,
        });

        // Act
        const result = await updateCard(cardId, updateData, userId, mockSupabase);

        // Assert
        expect(result?.repetitions).toBe(10);
        expect(mockUpdate).toHaveBeenCalledWith(updateData);
      });

      it("should verify card ownership before update", async () => {
        // Arrange
        const cardId = "card-def";
        const userId = "user-def";
        const updateData = {
          front: "Updated",
        };

        const mockCard: CardEntity = {
          id: cardId,
          user_id: userId,
          front: updateData.front,
          back: "Back",
          source: "manual",
          repetitions: 0,
          created_at: "2024-01-05T00:00:00Z",
          updated_at: "2024-01-05T12:00:00Z",
        };

        const mockSingle = vi.fn().mockResolvedValue({
          data: mockCard,
          error: null,
        });

        const mockSelect = vi.fn().mockReturnValue({
          single: mockSingle,
        });

        const mockEqUser = vi.fn().mockReturnValue({
          select: mockSelect,
        });

        const mockEqCard = vi.fn().mockReturnValue({
          eq: mockEqUser,
        });

        const mockUpdate = vi.fn().mockReturnValue({
          eq: mockEqCard,
        });

        (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
          update: mockUpdate,
        });

        // Act
        await updateCard(cardId, updateData, userId, mockSupabase);

        // Assert
        expect(mockEqUser).toHaveBeenCalledWith("user_id", userId);
      });
    });

    describe("Not found scenarios", () => {
      it("should return null when card not found", async () => {
        // Arrange
        const cardId = "non-existent";
        const userId = "user-123";
        const updateData = {
          front: "Updated",
        };

        const mockError = {
          message: "No rows found",
          code: "PGRST116",
        };

        const mockSingle = vi.fn().mockResolvedValue({
          data: null,
          error: mockError,
        });

        const mockSelect = vi.fn().mockReturnValue({
          single: mockSingle,
        });

        const mockEqUser = vi.fn().mockReturnValue({
          select: mockSelect,
        });

        const mockEqCard = vi.fn().mockReturnValue({
          eq: mockEqUser,
        });

        const mockUpdate = vi.fn().mockReturnValue({
          eq: mockEqCard,
        });

        (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
          update: mockUpdate,
        });

        // Act
        const result = await updateCard(cardId, updateData, userId, mockSupabase);

        // Assert
        expect(result).toBeNull();
      });

      it("should return null when card belongs to different user", async () => {
        // Arrange
        const cardId = "card-456";
        const userId = "wrong-user";
        const updateData = {
          front: "Updated",
        };

        const mockError = {
          message: "No rows found",
          code: "PGRST116",
        };

        const mockSingle = vi.fn().mockResolvedValue({
          data: null,
          error: mockError,
        });

        const mockSelect = vi.fn().mockReturnValue({
          single: mockSingle,
        });

        const mockEqUser = vi.fn().mockReturnValue({
          select: mockSelect,
        });

        const mockEqCard = vi.fn().mockReturnValue({
          eq: mockEqUser,
        });

        const mockUpdate = vi.fn().mockReturnValue({
          eq: mockEqCard,
        });

        (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
          update: mockUpdate,
        });

        // Act
        const result = await updateCard(cardId, updateData, userId, mockSupabase);

        // Assert
        expect(result).toBeNull();
      });
    });

    describe("Database errors", () => {
      it("should throw Error for non-PGRST116 errors", async () => {
        // Arrange
        const cardId = "card-error";
        const userId = "user-error";
        const updateData = {
          front: "Updated",
        };

        const mockError = {
          message: "Database connection failed",
          code: "PGRST301",
        };

        const mockSingle = vi.fn().mockResolvedValue({
          data: null,
          error: mockError,
        });

        const mockSelect = vi.fn().mockReturnValue({
          single: mockSingle,
        });

        const mockEqUser = vi.fn().mockReturnValue({
          select: mockSelect,
        });

        const mockEqCard = vi.fn().mockReturnValue({
          eq: mockEqUser,
        });

        const mockUpdate = vi.fn().mockReturnValue({
          eq: mockEqCard,
        });

        (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
          update: mockUpdate,
        });

        // Act & Assert
        await expect(updateCard(cardId, updateData, userId, mockSupabase)).rejects.toThrow(
          /Failed to update card/
        );
      });

      it("should log error to console.error for non-PGRST116 errors", async () => {
        // Arrange
        const cardId = "card-log";
        const userId = "user-log";
        const updateData = {
          front: "Updated",
        };

        const mockError = {
          message: "Query timeout",
          code: "PGRST504",
        };

        const mockSingle = vi.fn().mockResolvedValue({
          data: null,
          error: mockError,
        });

        const mockSelect = vi.fn().mockReturnValue({
          single: mockSingle,
        });

        const mockEqUser = vi.fn().mockReturnValue({
          select: mockSelect,
        });

        const mockEqCard = vi.fn().mockReturnValue({
          eq: mockEqUser,
        });

        const mockUpdate = vi.fn().mockReturnValue({
          eq: mockEqCard,
        });

        (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
          update: mockUpdate,
        });

        // Act
        try {
          await updateCard(cardId, updateData, userId, mockSupabase);
        } catch {
          // Expected to throw
        }

        // Assert
        expect(consoleErrorSpy).toHaveBeenCalledWith("Failed to update card:", mockError);
      });

      it("should not log error for PGRST116 (not found)", async () => {
        // Arrange
        const cardId = "card-not-found";
        const userId = "user-not-found";
        const updateData = {
          front: "Updated",
        };

        const mockError = {
          message: "No rows found",
          code: "PGRST116",
        };

        const mockSingle = vi.fn().mockResolvedValue({
          data: null,
          error: mockError,
        });

        const mockSelect = vi.fn().mockReturnValue({
          single: mockSingle,
        });

        const mockEqUser = vi.fn().mockReturnValue({
          select: mockSelect,
        });

        const mockEqCard = vi.fn().mockReturnValue({
          eq: mockEqUser,
        });

        const mockUpdate = vi.fn().mockReturnValue({
          eq: mockEqCard,
        });

        (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
          update: mockUpdate,
        });

        consoleErrorSpy.mockClear();

        // Act
        await updateCard(cardId, updateData, userId, mockSupabase);

        // Assert
        expect(consoleErrorSpy).not.toHaveBeenCalled();
      });
    });
  });

  describe("deleteCard()", () => {
    describe("Successful deletion", () => {
      it("should delete card from database", async () => {
        // Arrange
        const cardId = "card-123";
        const userId = "user-123";

        const mockCard: CardEntity = {
          id: cardId,
          user_id: userId,
          front: "Question",
          back: "Answer",
          source: "manual",
          repetitions: 5,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        };

        const mockSingle = vi.fn().mockResolvedValue({
          data: mockCard,
          error: null,
        });

        const mockSelect = vi.fn().mockReturnValue({
          single: mockSingle,
        });

        const mockEqUser = vi.fn().mockReturnValue({
          select: mockSelect,
        });

        const mockEqCard = vi.fn().mockReturnValue({
          eq: mockEqUser,
        });

        const mockDelete = vi.fn().mockReturnValue({
          eq: mockEqCard,
        });

        (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
          delete: mockDelete,
        });

        // Act
        const result = await deleteCard(cardId, userId, mockSupabase);

        // Assert
        expect(result).toEqual(mockCard);
        expect(mockSupabase.from).toHaveBeenCalledWith("cards");
        expect(mockEqCard).toHaveBeenCalledWith("id", cardId);
        expect(mockEqUser).toHaveBeenCalledWith("user_id", userId);
      });

      it("should return deleted card entity", async () => {
        // Arrange
        const cardId = "card-456";
        const userId = "user-456";

        const mockCard: CardEntity = {
          id: cardId,
          user_id: userId,
          front: "Front",
          back: "Back",
          source: "ai",
          repetitions: 10,
          created_at: "2024-01-02T12:00:00Z",
          updated_at: "2024-01-02T12:00:00Z",
        };

        const mockSingle = vi.fn().mockResolvedValue({
          data: mockCard,
          error: null,
        });

        const mockSelect = vi.fn().mockReturnValue({
          single: mockSingle,
        });

        const mockEqUser = vi.fn().mockReturnValue({
          select: mockSelect,
        });

        const mockEqCard = vi.fn().mockReturnValue({
          eq: mockEqUser,
        });

        const mockDelete = vi.fn().mockReturnValue({
          eq: mockEqCard,
        });

        (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
          delete: mockDelete,
        });

        // Act
        const result = await deleteCard(cardId, userId, mockSupabase);

        // Assert
        expect(result).toHaveProperty("id");
        expect(result).toHaveProperty("front");
        expect(result).toHaveProperty("back");
        expect(result?.id).toBe(cardId);
      });

      it("should verify card ownership before deletion", async () => {
        // Arrange
        const cardId = "card-789";
        const userId = "user-789";

        const mockCard: CardEntity = {
          id: cardId,
          user_id: userId,
          front: "Q",
          back: "A",
          source: "manual",
          repetitions: 0,
          created_at: "2024-01-03T08:00:00Z",
          updated_at: "2024-01-03T08:00:00Z",
        };

        const mockSingle = vi.fn().mockResolvedValue({
          data: mockCard,
          error: null,
        });

        const mockSelect = vi.fn().mockReturnValue({
          single: mockSingle,
        });

        const mockEqUser = vi.fn().mockReturnValue({
          select: mockSelect,
        });

        const mockEqCard = vi.fn().mockReturnValue({
          eq: mockEqUser,
        });

        const mockDelete = vi.fn().mockReturnValue({
          eq: mockEqCard,
        });

        (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
          delete: mockDelete,
        });

        // Act
        await deleteCard(cardId, userId, mockSupabase);

        // Assert
        expect(mockEqUser).toHaveBeenCalledWith("user_id", userId);
      });
    });

    describe("Not found scenarios", () => {
      it("should return null when card not found", async () => {
        // Arrange
        const cardId = "non-existent";
        const userId = "user-123";

        const mockError = {
          message: "No rows found",
          code: "PGRST116",
        };

        const mockSingle = vi.fn().mockResolvedValue({
          data: null,
          error: mockError,
        });

        const mockSelect = vi.fn().mockReturnValue({
          single: mockSingle,
        });

        const mockEqUser = vi.fn().mockReturnValue({
          select: mockSelect,
        });

        const mockEqCard = vi.fn().mockReturnValue({
          eq: mockEqUser,
        });

        const mockDelete = vi.fn().mockReturnValue({
          eq: mockEqCard,
        });

        (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
          delete: mockDelete,
        });

        // Act
        const result = await deleteCard(cardId, userId, mockSupabase);

        // Assert
        expect(result).toBeNull();
      });

      it("should return null when card belongs to different user", async () => {
        // Arrange
        const cardId = "card-abc";
        const userId = "wrong-user";

        const mockError = {
          message: "No rows found",
          code: "PGRST116",
        };

        const mockSingle = vi.fn().mockResolvedValue({
          data: null,
          error: mockError,
        });

        const mockSelect = vi.fn().mockReturnValue({
          single: mockSingle,
        });

        const mockEqUser = vi.fn().mockReturnValue({
          select: mockSelect,
        });

        const mockEqCard = vi.fn().mockReturnValue({
          eq: mockEqUser,
        });

        const mockDelete = vi.fn().mockReturnValue({
          eq: mockEqCard,
        });

        (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
          delete: mockDelete,
        });

        // Act
        const result = await deleteCard(cardId, userId, mockSupabase);

        // Assert
        expect(result).toBeNull();
      });
    });

    describe("Database errors", () => {
      it("should throw Error for non-PGRST116 errors", async () => {
        // Arrange
        const cardId = "card-error";
        const userId = "user-error";

        const mockError = {
          message: "Database connection failed",
          code: "PGRST301",
        };

        const mockSingle = vi.fn().mockResolvedValue({
          data: null,
          error: mockError,
        });

        const mockSelect = vi.fn().mockReturnValue({
          single: mockSingle,
        });

        const mockEqUser = vi.fn().mockReturnValue({
          select: mockSelect,
        });

        const mockEqCard = vi.fn().mockReturnValue({
          eq: mockEqUser,
        });

        const mockDelete = vi.fn().mockReturnValue({
          eq: mockEqCard,
        });

        (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
          delete: mockDelete,
        });

        // Act & Assert
        await expect(deleteCard(cardId, userId, mockSupabase)).rejects.toThrow(
          /Failed to delete card/
        );
      });

      it("should log error to console.error for non-PGRST116 errors", async () => {
        // Arrange
        const cardId = "card-log";
        const userId = "user-log";

        const mockError = {
          message: "Query timeout",
          code: "PGRST504",
        };

        const mockSingle = vi.fn().mockResolvedValue({
          data: null,
          error: mockError,
        });

        const mockSelect = vi.fn().mockReturnValue({
          single: mockSingle,
        });

        const mockEqUser = vi.fn().mockReturnValue({
          select: mockSelect,
        });

        const mockEqCard = vi.fn().mockReturnValue({
          eq: mockEqUser,
        });

        const mockDelete = vi.fn().mockReturnValue({
          eq: mockEqCard,
        });

        (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
          delete: mockDelete,
        });

        // Act
        try {
          await deleteCard(cardId, userId, mockSupabase);
        } catch {
          // Expected to throw
        }

        // Assert
        expect(consoleErrorSpy).toHaveBeenCalledWith("Failed to delete card:", mockError);
      });

      it("should not log error for PGRST116 (not found)", async () => {
        // Arrange
        const cardId = "card-not-found";
        const userId = "user-not-found";

        const mockError = {
          message: "No rows found",
          code: "PGRST116",
        };

        const mockSingle = vi.fn().mockResolvedValue({
          data: null,
          error: mockError,
        });

        const mockSelect = vi.fn().mockReturnValue({
          single: mockSingle,
        });

        const mockEqUser = vi.fn().mockReturnValue({
          select: mockSelect,
        });

        const mockEqCard = vi.fn().mockReturnValue({
          eq: mockEqUser,
        });

        const mockDelete = vi.fn().mockReturnValue({
          eq: mockEqCard,
        });

        (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
          delete: mockDelete,
        });

        consoleErrorSpy.mockClear();

        // Act
        await deleteCard(cardId, userId, mockSupabase);

        // Assert
        expect(consoleErrorSpy).not.toHaveBeenCalled();
      });
    });
  });
});
