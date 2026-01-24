import { describe, it, expect, vi, beforeEach } from "vitest";
import { createGenerationRequest } from "./generation-request.service";
import type { SupabaseClientType } from "./generation-request.service";
import type { GenerationRequestInsertEntity } from "../../types";

// Mock console.error to avoid noise in test output
const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

describe("Generation Request Service", () => {
  let mockSupabase: SupabaseClientType;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create mock Supabase client
    mockSupabase = {
      from: vi.fn(),
    } as unknown as SupabaseClientType;
  });

  describe("createGenerationRequest()", () => {
    describe("Successful creation", () => {
      it("should insert generation request to database", async () => {
        // Arrange
        const insertData: GenerationRequestInsertEntity = {
          user_id: "user-123",
          input_text: "a".repeat(1000),
          generated_count: 7,
        };

        const mockResponse = {
          id: "gen-req-123",
          user_id: "user-123",
          input_text: insertData.input_text,
          generated_count: 7,
          created_at: "2024-01-01T00:00:00Z",
        };

        const mockSelect = vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockResponse,
            error: null,
          }),
        });

        const mockInsert = vi.fn().mockReturnValue({
          select: mockSelect,
        });

        (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
          insert: mockInsert,
        });

        // Act
        const result = await createGenerationRequest(insertData, mockSupabase);

        // Assert
        expect(result).toEqual(mockResponse);
        expect(mockSupabase.from).toHaveBeenCalledWith("generation_requests");
        expect(mockInsert).toHaveBeenCalledWith({
          user_id: insertData.user_id,
          input_text: insertData.input_text,
          generated_count: insertData.generated_count,
        });
      });

      it("should return created entity with id and created_at", async () => {
        // Arrange
        const insertData: GenerationRequestInsertEntity = {
          user_id: "user-456",
          input_text: "b".repeat(2000),
          generated_count: 5,
        };

        const mockResponse = {
          id: "gen-req-456",
          user_id: "user-456",
          input_text: insertData.input_text,
          generated_count: 5,
          created_at: "2024-01-02T12:00:00Z",
        };

        const mockSelect = vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockResponse,
            error: null,
          }),
        });

        const mockInsert = vi.fn().mockReturnValue({
          select: mockSelect,
        });

        (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
          insert: mockInsert,
        });

        // Act
        const result = await createGenerationRequest(insertData, mockSupabase);

        // Assert
        expect(result).toHaveProperty("id");
        expect(result).toHaveProperty("created_at");
        expect(result.id).toBe("gen-req-456");
        expect(result.created_at).toBe("2024-01-02T12:00:00Z");
      });

      it("should call supabase.from('generation_requests').insert()", async () => {
        // Arrange
        const insertData: GenerationRequestInsertEntity = {
          user_id: "user-789",
          input_text: "c".repeat(3000),
          generated_count: 10,
        };

        const mockResponse = {
          id: "gen-req-789",
          user_id: "user-789",
          input_text: insertData.input_text,
          generated_count: 10,
          created_at: "2024-01-03T08:00:00Z",
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

        const mockFrom = vi.fn().mockReturnValue({
          insert: mockInsert,
        });

        mockSupabase.from = mockFrom;

        // Act
        await createGenerationRequest(insertData, mockSupabase);

        // Assert
        expect(mockFrom).toHaveBeenCalledWith("generation_requests");
        expect(mockInsert).toHaveBeenCalledTimes(1);
        expect(mockSelect).toHaveBeenCalledTimes(1);
        expect(mockSingle).toHaveBeenCalledTimes(1);
      });

      it("should include user_id, input_text, generated_count", async () => {
        // Arrange
        const insertData: GenerationRequestInsertEntity = {
          user_id: "user-abc",
          input_text: "d".repeat(5000),
          generated_count: 8,
        };

        const mockResponse = {
          id: "gen-req-abc",
          user_id: "user-abc",
          input_text: insertData.input_text,
          generated_count: 8,
          created_at: "2024-01-04T14:30:00Z",
        };

        const mockSelect = vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockResponse,
            error: null,
          }),
        });

        const mockInsert = vi.fn().mockReturnValue({
          select: mockSelect,
        });

        (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
          insert: mockInsert,
        });

        // Act
        const result = await createGenerationRequest(insertData, mockSupabase);

        // Assert
        expect(result.user_id).toBe(insertData.user_id);
        expect(result.input_text).toBe(insertData.input_text);
        expect(result.generated_count).toBe(insertData.generated_count);
      });
    });

    describe("Database errors", () => {
      it("should throw Error when insert fails", async () => {
        // Arrange
        const insertData: GenerationRequestInsertEntity = {
          user_id: "user-error",
          input_text: "e".repeat(1000),
          generated_count: 5,
        };

        const mockError = {
          message: "Database connection failed",
          code: "PGRST301",
        };

        const mockSelect = vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: mockError,
          }),
        });

        const mockInsert = vi.fn().mockReturnValue({
          select: mockSelect,
        });

        (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
          insert: mockInsert,
        });

        // Act & Assert
        await expect(createGenerationRequest(insertData, mockSupabase)).rejects.toThrow(
          /Failed to create generation request/
        );
      });

      it("should log error to console.error", async () => {
        // Arrange
        const insertData: GenerationRequestInsertEntity = {
          user_id: "user-log",
          input_text: "f".repeat(1000),
          generated_count: 5,
        };

        const mockError = {
          message: "Constraint violation",
          code: "23505",
        };

        const mockSelect = vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: mockError,
          }),
        });

        const mockInsert = vi.fn().mockReturnValue({
          select: mockSelect,
        });

        (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
          insert: mockInsert,
        });

        // Act
        try {
          await createGenerationRequest(insertData, mockSupabase);
        } catch {
          // Expected to throw
        }

        // Assert
        expect(consoleErrorSpy).toHaveBeenCalledWith("Failed to create generation request:", mockError);
      });

      it("should include error message in thrown error", async () => {
        // Arrange
        const insertData: GenerationRequestInsertEntity = {
          user_id: "user-msg",
          input_text: "g".repeat(1000),
          generated_count: 5,
        };

        const mockError = {
          message: "Foreign key constraint failed",
          code: "23503",
        };

        const mockSelect = vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: mockError,
          }),
        });

        const mockInsert = vi.fn().mockReturnValue({
          select: mockSelect,
        });

        (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
          insert: mockInsert,
        });

        // Act & Assert
        await expect(createGenerationRequest(insertData, mockSupabase)).rejects.toThrow(
          "Failed to create generation request: Foreign key constraint failed"
        );
      });

      it("should handle missing data in response", async () => {
        // Arrange
        const insertData: GenerationRequestInsertEntity = {
          user_id: "user-null",
          input_text: "h".repeat(1000),
          generated_count: 5,
        };

        const mockSelect = vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        });

        const mockInsert = vi.fn().mockReturnValue({
          select: mockSelect,
        });

        (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
          insert: mockInsert,
        });

        // Act & Assert
        await expect(createGenerationRequest(insertData, mockSupabase)).rejects.toThrow(
          "Generation request created but no data returned"
        );
      });

      it("should handle null response", async () => {
        // Arrange
        const insertData: GenerationRequestInsertEntity = {
          user_id: "user-undefined",
          input_text: "i".repeat(1000),
          generated_count: 5,
        };

        const mockSelect = vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: undefined,
            error: null,
          }),
        });

        const mockInsert = vi.fn().mockReturnValue({
          select: mockSelect,
        });

        (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
          insert: mockInsert,
        });

        // Act & Assert
        await expect(createGenerationRequest(insertData, mockSupabase)).rejects.toThrow(
          "Generation request created but no data returned"
        );
      });
    });

    describe("Data validation", () => {
      it("should accept valid GenerationRequestInsertEntity", async () => {
        // Arrange
        const validData: GenerationRequestInsertEntity = {
          user_id: "user-valid",
          input_text: "j".repeat(1000),
          generated_count: 7,
        };

        const mockResponse = {
          id: "gen-req-valid",
          ...validData,
          created_at: "2024-01-05T10:00:00Z",
        };

        const mockSelect = vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockResponse,
            error: null,
          }),
        });

        const mockInsert = vi.fn().mockReturnValue({
          select: mockSelect,
        });

        (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
          insert: mockInsert,
        });

        // Act
        const result = await createGenerationRequest(validData, mockSupabase);

        // Assert
        expect(result).toBeDefined();
        expect(result.user_id).toBe(validData.user_id);
      });

      it("should pass through user_id correctly", async () => {
        // Arrange
        const userId = "user-uuid-12345";
        const insertData: GenerationRequestInsertEntity = {
          user_id: userId,
          input_text: "k".repeat(2000),
          generated_count: 6,
        };

        const mockResponse = {
          id: "gen-req-uuid",
          user_id: userId,
          input_text: insertData.input_text,
          generated_count: 6,
          created_at: "2024-01-06T16:00:00Z",
        };

        const mockSelect = vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockResponse,
            error: null,
          }),
        });

        const mockInsert = vi.fn().mockReturnValue({
          select: mockSelect,
        });

        (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
          insert: mockInsert,
        });

        // Act
        const result = await createGenerationRequest(insertData, mockSupabase);

        // Assert
        expect(result.user_id).toBe(userId);
        expect(mockInsert).toHaveBeenCalledWith(
          expect.objectContaining({
            user_id: userId,
          })
        );
      });

      it("should pass through generated_count correctly", async () => {
        // Arrange
        const generatedCount = 9;
        const insertData: GenerationRequestInsertEntity = {
          user_id: "user-count",
          input_text: "l".repeat(3000),
          generated_count: generatedCount,
        };

        const mockResponse = {
          id: "gen-req-count",
          user_id: "user-count",
          input_text: insertData.input_text,
          generated_count: generatedCount,
          created_at: "2024-01-07T18:00:00Z",
        };

        const mockSelect = vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockResponse,
            error: null,
          }),
        });

        const mockInsert = vi.fn().mockReturnValue({
          select: mockSelect,
        });

        (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
          insert: mockInsert,
        });

        // Act
        const result = await createGenerationRequest(insertData, mockSupabase);

        // Assert
        expect(result.generated_count).toBe(generatedCount);
        expect(mockInsert).toHaveBeenCalledWith(
          expect.objectContaining({
            generated_count: generatedCount,
          })
        );
      });
    });
  });
});
