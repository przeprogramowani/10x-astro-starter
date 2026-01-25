import { describe, it, expect, vi, beforeEach } from "vitest";
import { deleteUserAccount } from "./user.service";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";

// Mock createSupabaseAdminClient
vi.mock("../../db/supabase.client", () => ({
  createSupabaseAdminClient: vi.fn(),
}));

// Import mocked function
import { createSupabaseAdminClient } from "../../db/supabase.client";

// Mock console methods to avoid noise in test output
const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
const consoleInfoSpy = vi.spyOn(console, "info").mockImplementation(() => {});

describe("User Service", () => {
  let mockAdminClient: SupabaseClient<Database>;
  let mockSupabase: SupabaseClient<Database>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create mock authenticated supabase client
    mockSupabase = {
      auth: {
        getUser: vi.fn(),
      },
    } as unknown as SupabaseClient<Database>;

    // Create mock admin client
    mockAdminClient = {
      auth: {
        admin: {
          deleteUser: vi.fn(),
        },
      },
    } as unknown as SupabaseClient<Database>;

    // Mock createSupabaseAdminClient to return our mock client
    (createSupabaseAdminClient as ReturnType<typeof vi.fn>).mockReturnValue(mockAdminClient);
  });

  describe("deleteUserAccount()", () => {
    describe("Successful deletion", () => {
      it("should delete user from Supabase Auth after verifying identity", async () => {
        // Arrange
        const userId = "user-123";

        // Mock getUser to return authenticated user
        (mockSupabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
          data: { user: { id: userId } },
          error: null,
        });

        (mockAdminClient.auth.admin.deleteUser as ReturnType<typeof vi.fn>).mockResolvedValue({
          data: {},
          error: null,
        });

        // Act
        await deleteUserAccount(userId, mockSupabase);

        // Assert
        expect(mockSupabase.auth.getUser).toHaveBeenCalledTimes(1);
        expect(createSupabaseAdminClient).toHaveBeenCalledTimes(1);
        expect(mockAdminClient.auth.admin.deleteUser).toHaveBeenCalledWith(userId);
      });

      it("should not throw error on successful deletion", async () => {
        // Arrange
        const userId = "user-456";

        (mockSupabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
          data: { user: { id: userId } },
          error: null,
        });

        (mockAdminClient.auth.admin.deleteUser as ReturnType<typeof vi.fn>).mockResolvedValue({
          data: {},
          error: null,
        });

        // Act & Assert
        await expect(deleteUserAccount(userId, mockSupabase)).resolves.not.toThrow();
      });

      it("should log success message with user_id and timestamp", async () => {
        // Arrange
        const userId = "user-789";

        (mockSupabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
          data: { user: { id: userId } },
          error: null,
        });

        (mockAdminClient.auth.admin.deleteUser as ReturnType<typeof vi.fn>).mockResolvedValue({
          data: {},
          error: null,
        });

        // Act
        await deleteUserAccount(userId, mockSupabase);

        // Assert
        expect(consoleInfoSpy).toHaveBeenCalledWith(
          "User account deleted successfully:",
          expect.objectContaining({
            user_id: userId,
            timestamp: expect.any(String),
          })
        );
      });

      it("should log timestamp in ISO format", async () => {
        // Arrange
        const userId = "user-abc";

        (mockSupabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
          data: { user: { id: userId } },
          error: null,
        });

        (mockAdminClient.auth.admin.deleteUser as ReturnType<typeof vi.fn>).mockResolvedValue({
          data: {},
          error: null,
        });

        // Act
        await deleteUserAccount(userId, mockSupabase);

        // Assert
        expect(consoleInfoSpy).toHaveBeenCalledWith(
          "User account deleted successfully:",
          expect.objectContaining({
            timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
          })
        );
      });

      it("should create admin client with elevated privileges", async () => {
        // Arrange
        const userId = "user-def";

        (mockSupabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
          data: { user: { id: userId } },
          error: null,
        });

        (mockAdminClient.auth.admin.deleteUser as ReturnType<typeof vi.fn>).mockResolvedValue({
          data: {},
          error: null,
        });

        // Act
        await deleteUserAccount(userId, mockSupabase);

        // Assert
        expect(createSupabaseAdminClient).toHaveBeenCalled();
      });

      it("should complete without errors for valid UUID", async () => {
        // Arrange
        const userId = "550e8400-e29b-41d4-a716-446655440000";

        (mockSupabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
          data: { user: { id: userId } },
          error: null,
        });

        (mockAdminClient.auth.admin.deleteUser as ReturnType<typeof vi.fn>).mockResolvedValue({
          data: {},
          error: null,
        });

        // Act
        await deleteUserAccount(userId, mockSupabase);

        // Assert
        expect(mockAdminClient.auth.admin.deleteUser).toHaveBeenCalledWith(userId);
        expect(consoleInfoSpy).toHaveBeenCalled();
      });
    });

    describe("Security and validation", () => {
      it("should verify user identity before deletion", async () => {
        // Arrange
        const userId = "user-123";

        (mockSupabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
          data: { user: { id: userId } },
          error: null,
        });

        (mockAdminClient.auth.admin.deleteUser as ReturnType<typeof vi.fn>).mockResolvedValue({
          data: {},
          error: null,
        });

        // Act
        await deleteUserAccount(userId, mockSupabase);

        // Assert
        expect(mockSupabase.auth.getUser).toHaveBeenCalledTimes(1);
      });

      it("should throw error if authenticated user doesn't match target userId", async () => {
        // Arrange
        const authenticatedUserId = "user-123";
        const targetUserId = "user-456";

        (mockSupabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
          data: { user: { id: authenticatedUserId } },
          error: null,
        });

        // Act & Assert
        await expect(deleteUserAccount(targetUserId, mockSupabase)).rejects.toThrow(
          "Cannot delete another user's account"
        );
      });

      it("should throw error if user authentication fails", async () => {
        // Arrange
        const userId = "user-123";

        (mockSupabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
          data: { user: null },
          error: { message: "Invalid token", name: "AuthError", status: 401 },
        });

        // Act & Assert
        await expect(deleteUserAccount(userId, mockSupabase)).rejects.toThrow(
          "Authentication verification failed"
        );
      });

      it("should throw error if no user in auth response", async () => {
        // Arrange
        const userId = "user-123";

        (mockSupabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
          data: { user: null },
          error: null,
        });

        // Act & Assert
        await expect(deleteUserAccount(userId, mockSupabase)).rejects.toThrow(
          "Authentication verification failed"
        );
      });

      it("should log error when user tries to delete different account", async () => {
        // Arrange
        const authenticatedUserId = "user-123";
        const targetUserId = "user-456";

        (mockSupabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
          data: { user: { id: authenticatedUserId } },
          error: null,
        });

        // Act
        try {
          await deleteUserAccount(targetUserId, mockSupabase);
        } catch {
          // Expected to throw
        }

        // Assert
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          "User attempting to delete different account:",
          expect.objectContaining({
            authenticated_user_id: authenticatedUserId,
            target_user_id: targetUserId,
            timestamp: expect.any(String),
          })
        );
      });
    });

    describe("Error handling", () => {
      it("should throw Error when Supabase Auth deletion fails", async () => {
        // Arrange
        const userId = "user-error";
        const mockError = {
          message: "User not found in auth system",
          name: "AuthApiError",
          status: 404,
        };

        (mockSupabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
          data: { user: { id: userId } },
          error: null,
        });

        (mockAdminClient.auth.admin.deleteUser as ReturnType<typeof vi.fn>).mockResolvedValue({
          data: { user: null },
          error: mockError,
        });

        // Act & Assert
        await expect(deleteUserAccount(userId, mockSupabase)).rejects.toThrow(
          /Failed to delete user account/
        );
      });

      it("should include original error message in thrown error", async () => {
        // Arrange
        const userId = "user-msg";
        const mockError = {
          message: "Database connection timeout",
          name: "AuthApiError",
          status: 500,
        };

        (mockSupabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
          data: { user: { id: userId } },
          error: null,
        });

        (mockAdminClient.auth.admin.deleteUser as ReturnType<typeof vi.fn>).mockResolvedValue({
          data: { user: null },
          error: mockError,
        });

        // Act & Assert
        await expect(deleteUserAccount(userId, mockSupabase)).rejects.toThrow(
          "Failed to delete user account: Database connection timeout"
        );
      });

      it("should log error details when deletion fails", async () => {
        // Arrange
        const userId = "user-log";
        const mockError = {
          message: "Permission denied",
          name: "AuthApiError",
          status: 403,
        };

        (mockSupabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
          data: { user: { id: userId } },
          error: null,
        });

        (mockAdminClient.auth.admin.deleteUser as ReturnType<typeof vi.fn>).mockResolvedValue({
          data: { user: null },
          error: mockError,
        });

        // Act
        try {
          await deleteUserAccount(userId, mockSupabase);
        } catch {
          // Expected to throw
        }

        // Assert
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          "Failed to delete user from Supabase Auth:",
          expect.objectContaining({
            error: mockError.message,
            user_id: userId,
            timestamp: expect.any(String),
          })
        );
      });

      it("should log error with timestamp in ISO format", async () => {
        // Arrange
        const userId = "user-timestamp";
        const mockError = {
          message: "Internal server error",
          name: "AuthApiError",
          status: 500,
        };

        (mockSupabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
          data: { user: { id: userId } },
          error: null,
        });

        (mockAdminClient.auth.admin.deleteUser as ReturnType<typeof vi.fn>).mockResolvedValue({
          data: { user: null },
          error: mockError,
        });

        // Act
        try {
          await deleteUserAccount(userId, mockSupabase);
        } catch {
          // Expected to throw
        }

        // Assert
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          "Failed to delete user from Supabase Auth:",
          expect.objectContaining({
            timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
          })
        );
      });

      it("should handle network errors", async () => {
        // Arrange
        const userId = "user-network";
        const mockError = {
          message: "Network request failed",
          name: "NetworkError",
          status: 0,
        };

        (mockSupabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
          data: { user: { id: userId } },
          error: null,
        });

        (mockAdminClient.auth.admin.deleteUser as ReturnType<typeof vi.fn>).mockResolvedValue({
          data: { user: null },
          error: mockError,
        });

        // Act & Assert
        await expect(deleteUserAccount(userId, mockSupabase)).rejects.toThrow(
          "Failed to delete user account: Network request failed"
        );
      });

      it("should handle authentication errors", async () => {
        // Arrange
        const userId = "user-auth";
        const mockError = {
          message: "Invalid service role key",
          name: "AuthApiError",
          status: 401,
        };

        (mockSupabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
          data: { user: { id: userId } },
          error: null,
        });

        (mockAdminClient.auth.admin.deleteUser as ReturnType<typeof vi.fn>).mockResolvedValue({
          data: { user: null },
          error: mockError,
        });

        // Act & Assert
        await expect(deleteUserAccount(userId, mockSupabase)).rejects.toThrow(
          "Failed to delete user account: Invalid service role key"
        );
      });

      it("should not log success when deletion fails", async () => {
        // Arrange
        const userId = "user-no-success";
        const mockError = {
          message: "Deletion failed",
          name: "AuthApiError",
          status: 500,
        };

        (mockSupabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
          data: { user: { id: userId } },
          error: null,
        });

        (mockAdminClient.auth.admin.deleteUser as ReturnType<typeof vi.fn>).mockResolvedValue({
          data: { user: null },
          error: mockError,
        });

        consoleInfoSpy.mockClear();

        // Act
        try {
          await deleteUserAccount(userId, mockSupabase);
        } catch {
          // Expected to throw
        }

        // Assert
        expect(consoleInfoSpy).not.toHaveBeenCalled();
      });
    });

    describe("Edge cases", () => {
      it("should handle empty userId string", async () => {
        // Arrange
        const userId = "";

        (mockSupabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
          data: { user: { id: userId } },
          error: null,
        });

        (mockAdminClient.auth.admin.deleteUser as ReturnType<typeof vi.fn>).mockResolvedValue({
          data: { user: null },
          error: {
            message: "Invalid user ID",
            name: "AuthApiError",
            status: 400,
          },
        });

        // Act & Assert
        await expect(deleteUserAccount(userId, mockSupabase)).rejects.toThrow(/Failed to delete user account/);
      });

      it("should handle invalid UUID format", async () => {
        // Arrange
        const userId = "not-a-valid-uuid";

        (mockSupabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
          data: { user: { id: userId } },
          error: null,
        });

        (mockAdminClient.auth.admin.deleteUser as ReturnType<typeof vi.fn>).mockResolvedValue({
          data: { user: null },
          error: {
            message: "Invalid UUID format",
            name: "AuthApiError",
            status: 400,
          },
        });

        // Act & Assert
        await expect(deleteUserAccount(userId, mockSupabase)).rejects.toThrow(/Failed to delete user account/);
      });

      it("should handle non-existent user gracefully", async () => {
        // Arrange
        const userId = "non-existent-user-id";

        (mockSupabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
          data: { user: { id: userId } },
          error: null,
        });

        (mockAdminClient.auth.admin.deleteUser as ReturnType<typeof vi.fn>).mockResolvedValue({
          data: { user: null },
          error: {
            message: "User not found",
            name: "AuthApiError",
            status: 404,
          },
        });

        // Act & Assert
        await expect(deleteUserAccount(userId, mockSupabase)).rejects.toThrow(
          "Failed to delete user account: User not found"
        );
      });

      it("should pass userId exactly as provided", async () => {
        // Arrange
        const userId = "user-exact-match-123";

        (mockSupabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
          data: { user: { id: userId } },
          error: null,
        });

        (mockAdminClient.auth.admin.deleteUser as ReturnType<typeof vi.fn>).mockResolvedValue({
          data: {},
          error: null,
        });

        // Act
        await deleteUserAccount(userId, mockSupabase);

        // Assert
        expect(mockAdminClient.auth.admin.deleteUser).toHaveBeenCalledWith(userId);
        expect(mockAdminClient.auth.admin.deleteUser).toHaveBeenCalledWith(
          expect.stringContaining("user-exact-match-123")
        );
      });
    });

    describe("Admin client usage", () => {
      it("should create admin client for each deletion", async () => {
        // Arrange
        const userId1 = "user-1";
        const userId2 = "user-2";

        (mockSupabase.auth.getUser as ReturnType<typeof vi.fn>)
          .mockResolvedValueOnce({
            data: { user: { id: userId1 } },
            error: null,
          })
          .mockResolvedValueOnce({
            data: { user: { id: userId2 } },
            error: null,
          });

        (mockAdminClient.auth.admin.deleteUser as ReturnType<typeof vi.fn>).mockResolvedValue({
          data: {},
          error: null,
        });

        // Act
        await deleteUserAccount(userId1, mockSupabase);
        await deleteUserAccount(userId2, mockSupabase);

        // Assert
        expect(createSupabaseAdminClient).toHaveBeenCalledTimes(2);
      });

      it("should use admin.deleteUser method", async () => {
        // Arrange
        const userId = "user-admin";

        (mockSupabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
          data: { user: { id: userId } },
          error: null,
        });

        (mockAdminClient.auth.admin.deleteUser as ReturnType<typeof vi.fn>).mockResolvedValue({
          data: {},
          error: null,
        });

        // Act
        await deleteUserAccount(userId, mockSupabase);

        // Assert
        expect(mockAdminClient.auth.admin.deleteUser).toHaveBeenCalled();
      });

      it("should call deleteUser with correct userId parameter", async () => {
        // Arrange
        const userId = "user-param-check";

        (mockSupabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
          data: { user: { id: userId } },
          error: null,
        });

        (mockAdminClient.auth.admin.deleteUser as ReturnType<typeof vi.fn>).mockResolvedValue({
          data: {},
          error: null,
        });

        // Act
        await deleteUserAccount(userId, mockSupabase);

        // Assert
        expect(mockAdminClient.auth.admin.deleteUser).toHaveBeenCalledWith(userId);
        expect(mockAdminClient.auth.admin.deleteUser).toHaveBeenCalledTimes(1);
      });
    });

    describe("Cascading deletes", () => {
      it("should rely on database cascading for related data", async () => {
        // Arrange
        const userId = "user-cascade";

        (mockSupabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
          data: { user: { id: userId } },
          error: null,
        });

        (mockAdminClient.auth.admin.deleteUser as ReturnType<typeof vi.fn>).mockResolvedValue({
          data: {},
          error: null,
        });

        // Act
        await deleteUserAccount(userId, mockSupabase);

        // Assert
        // Only auth deletion should be called - no manual cleanup of cards, etc.
        expect(mockAdminClient.auth.admin.deleteUser).toHaveBeenCalledTimes(1);
        expect(consoleInfoSpy).toHaveBeenCalledWith(
          "User account deleted successfully:",
          expect.any(Object)
        );
      });

      it("should complete deletion in single operation", async () => {
        // Arrange
        const userId = "user-single-op";

        (mockSupabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
          data: { user: { id: userId } },
          error: null,
        });

        (mockAdminClient.auth.admin.deleteUser as ReturnType<typeof vi.fn>).mockResolvedValue({
          data: {},
          error: null,
        });

        // Act
        await deleteUserAccount(userId, mockSupabase);

        // Assert
        expect(mockAdminClient.auth.admin.deleteUser).toHaveBeenCalledTimes(1);
      });
    });

    describe("Return value", () => {
      it("should return void on success", async () => {
        // Arrange
        const userId = "user-void";

        (mockSupabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
          data: { user: { id: userId } },
          error: null,
        });

        (mockAdminClient.auth.admin.deleteUser as ReturnType<typeof vi.fn>).mockResolvedValue({
          data: {},
          error: null,
        });

        // Act
        const result = await deleteUserAccount(userId, mockSupabase);

        // Assert
        expect(result).toBeUndefined();
      });

      it("should not return any value on successful deletion", async () => {
        // Arrange
        const userId = "user-no-return";

        (mockSupabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
          data: { user: { id: userId } },
          error: null,
        });

        (mockAdminClient.auth.admin.deleteUser as ReturnType<typeof vi.fn>).mockResolvedValue({
          data: {},
          error: null,
        });

        // Act
        const result = await deleteUserAccount(userId, mockSupabase);

        // Assert
        expect(result).toBe(undefined);
      });
    });
  });
});
