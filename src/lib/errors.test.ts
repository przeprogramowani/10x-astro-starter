import { describe, it, expect } from "vitest";
import { mapSupabaseError, isValidEmail, validatePassword } from "./errors";

describe("mapSupabaseError", () => {
  describe("Authentication errors", () => {
    it("should map invalid login credentials error", () => {
      const error = { message: "Invalid login credentials" };
      expect(mapSupabaseError(error)).toBe("Nieprawidłowy email lub hasło");
    });

    it("should map invalid credentials error (case insensitive)", () => {
      const error = { message: "INVALID LOGIN CREDENTIALS" };
      expect(mapSupabaseError(error)).toBe("Nieprawidłowy email lub hasło");
    });

    it("should map email not confirmed error", () => {
      const error = { message: "Email not confirmed" };
      expect(mapSupabaseError(error)).toBe(
        "Potwierdź swój adres email przed zalogowaniem"
      );
    });

    it("should map user already registered error", () => {
      const error = { message: "User already registered" };
      expect(mapSupabaseError(error)).toBe(
        "Użytkownik z tym adresem email już istnieje"
      );
    });

    it("should map session expired error", () => {
      const error = { message: "Session expired" };
      expect(mapSupabaseError(error)).toBe("Sesja wygasła. Zaloguj się ponownie");
    });
  });

  describe("Network errors", () => {
    it("should map network error", () => {
      const error = { message: "Network error occurred" };
      expect(mapSupabaseError(error)).toBe("Brak połączenia z internetem");
    });

    it("should map connection error", () => {
      const error = { message: "Connection failed" };
      expect(mapSupabaseError(error)).toBe("Brak połączenia z internetem");
    });

    it("should map network timeout", () => {
      const error = { message: "Network timeout" };
      expect(mapSupabaseError(error)).toBe("Brak połączenia z internetem");
    });
  });

  describe("Validation errors", () => {
    it("should map invalid email error", () => {
      const error = { message: "Invalid email format" };
      expect(mapSupabaseError(error)).toBe("Nieprawidłowy format adresu email");
    });

    it("should map weak password error", () => {
      const error = { message: "Password is too weak" };
      expect(mapSupabaseError(error)).toBe("Hasło jest zbyt słabe");
    });
  });

  describe("Rate limiting", () => {
    it("should map rate limit exceeded error", () => {
      const error = { message: "Rate limit exceeded" };
      expect(mapSupabaseError(error)).toBe(
        "Zbyt wiele prób. Spróbuj ponownie za chwilę"
      );
    });

    it("should map rate limit error with details", () => {
      const error = { message: "Rate limit exceeded. Try again in 60 seconds" };
      expect(mapSupabaseError(error)).toBe(
        "Zbyt wiele prób. Spróbuj ponownie za chwilę"
      );
    });
  });

  describe("Edge cases", () => {
    it("should return default error for unknown error", () => {
      const error = { message: "Some unknown error" };
      expect(mapSupabaseError(error)).toBe("Wystąpił błąd. Spróbuj ponownie");
    });

    it("should return default error for empty message", () => {
      const error = { message: "" };
      expect(mapSupabaseError(error)).toBe("Wystąpił błąd. Spróbuj ponownie");
    });

    it("should handle error with special characters", () => {
      const error = { message: "Error: [500] Internal Server Error!" };
      expect(mapSupabaseError(error)).toBe("Wystąpił błąd. Spróbuj ponownie");
    });

    it("should handle error with mixed case", () => {
      const error = { message: "InVaLiD LoGiN CrEdEnTiAlS" };
      expect(mapSupabaseError(error)).toBe("Nieprawidłowy email lub hasło");
    });
  });
});

describe("isValidEmail", () => {
  describe("Valid emails", () => {
    it("should validate standard email", () => {
      expect(isValidEmail("test@example.com")).toBe(true);
    });

    it("should validate email with subdomain", () => {
      expect(isValidEmail("user@mail.example.com")).toBe(true);
    });

    it("should validate email with plus sign", () => {
      expect(isValidEmail("user+tag@example.com")).toBe(true);
    });

    it("should validate email with numbers", () => {
      expect(isValidEmail("user123@example456.com")).toBe(true);
    });

    it("should validate email with dots in local part", () => {
      expect(isValidEmail("first.last@example.com")).toBe(true);
    });

    it("should validate email with hyphen in domain", () => {
      expect(isValidEmail("user@my-domain.com")).toBe(true);
    });

    it("should trim whitespace and validate", () => {
      expect(isValidEmail("  test@example.com  ")).toBe(true);
    });
  });

  describe("Invalid emails", () => {
    it("should reject email without @", () => {
      expect(isValidEmail("testexample.com")).toBe(false);
    });

    it("should reject email without domain", () => {
      expect(isValidEmail("test@")).toBe(false);
    });

    it("should reject email without local part", () => {
      expect(isValidEmail("@example.com")).toBe(false);
    });

    it("should reject email without TLD", () => {
      expect(isValidEmail("test@example")).toBe(false);
    });

    it("should reject email with spaces", () => {
      expect(isValidEmail("test @example.com")).toBe(false);
    });

    it("should reject email with multiple @", () => {
      expect(isValidEmail("test@@example.com")).toBe(false);
    });

    it("should reject empty string", () => {
      expect(isValidEmail("")).toBe(false);
    });

    it("should reject whitespace only", () => {
      expect(isValidEmail("   ")).toBe(false);
    });
  });

  describe("Edge cases", () => {
    it("should reject null input", () => {
      expect(isValidEmail(null as any)).toBe(false);
    });

    it("should reject undefined input", () => {
      expect(isValidEmail(undefined as any)).toBe(false);
    });

    it("should reject number input", () => {
      expect(isValidEmail(123 as any)).toBe(false);
    });

    it("should reject object input", () => {
      expect(isValidEmail({} as any)).toBe(false);
    });

    it("should reject array input", () => {
      expect(isValidEmail([] as any)).toBe(false);
    });
  });
});

describe("validatePassword", () => {
  describe("Valid passwords", () => {
    it("should validate password with minimum requirements", () => {
      const result = validatePassword("Test1234");
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should validate password with special characters", () => {
      const result = validatePassword("Test123!@#");
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should validate long password", () => {
      const result = validatePassword("VeryLongPassword123456789");
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should validate password with uppercase and lowercase", () => {
      const result = validatePassword("AbCdEf123");
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should validate password with exactly 8 characters", () => {
      const result = validatePassword("Test1234");
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  describe("Invalid passwords - length", () => {
    it("should reject password with 7 characters", () => {
      const result = validatePassword("Test123");
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Hasło musi mieć co najmniej 8 znaków");
    });

    it("should reject very short password", () => {
      const result = validatePassword("T1");
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Hasło musi mieć co najmniej 8 znaków");
    });

    it("should reject empty password", () => {
      const result = validatePassword("");
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Hasło jest wymagane");
    });
  });

  describe("Invalid passwords - missing letter", () => {
    it("should reject password without letters", () => {
      const result = validatePassword("12345678");
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Hasło musi zawierać co najmniej jedną literę");
    });

    it("should reject password with only numbers and special chars", () => {
      const result = validatePassword("123456!@#");
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Hasło musi zawierać co najmniej jedną literę");
    });
  });

  describe("Invalid passwords - missing number", () => {
    it("should reject password without numbers", () => {
      const result = validatePassword("TestPassword");
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Hasło musi zawierać co najmniej jedną cyfrę");
    });

    it("should reject password with only letters and special chars", () => {
      const result = validatePassword("TestPass!@#");
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Hasło musi zawierać co najmniej jedną cyfrę");
    });
  });

  describe("Edge cases", () => {
    it("should reject null input", () => {
      const result = validatePassword(null as any);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Hasło jest wymagane");
    });

    it("should reject undefined input", () => {
      const result = validatePassword(undefined as any);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Hasło jest wymagane");
    });

    it("should reject number input", () => {
      const result = validatePassword(12345678 as any);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Hasło jest wymagane");
    });

    it("should reject whitespace only password", () => {
      const result = validatePassword("        ");
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Hasło musi zawierać co najmniej jedną literę");
    });

    it("should handle password with unicode characters", () => {
      const result = validatePassword("Tęst1234");
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  describe("Boundary conditions", () => {
    it("should validate password with exactly one letter and one number", () => {
      const result = validatePassword("a1234567");
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should validate password at minimum length boundary", () => {
      const result = validatePassword("Test1234");
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should reject password just below minimum length", () => {
      const result = validatePassword("Test123");
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Hasło musi mieć co najmniej 8 znaków");
    });
  });
});
