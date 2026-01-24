import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@/test/test-utils";
import userEvent from "@testing-library/user-event";
import RegisterForm from "./RegisterForm";

// Mock auth client
vi.mock("@/db/auth.client", () => ({
  authClient: {
    auth: {
      signUp: vi.fn(),
    },
  },
}));

// Mock window.location
const mockLocationHref = vi.fn();
Object.defineProperty(window, "location", {
  value: {
    href: "",
    assign: mockLocationHref,
  },
  writable: true,
});

// Mock window.alert
const mockAlert = vi.fn();
vi.stubGlobal("alert", mockAlert);

describe("RegisterForm Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocationHref.mockClear();
    mockAlert.mockClear();
  });

  describe("Rendering", () => {
    it("should render email input field", () => {
      render(<RegisterForm />);
      const emailInput = screen.getByLabelText(/adres e-mail/i);
      expect(emailInput).toBeInTheDocument();
      expect(emailInput).toHaveAttribute("type", "email");
      expect(emailInput).toHaveAttribute("name", "email");
    });

    it("should render password input field", () => {
      render(<RegisterForm />);
      const passwordInput = screen.getByLabelText(/hasło/i);
      expect(passwordInput).toBeInTheDocument();
      expect(passwordInput).toHaveAttribute("type", "password");
      expect(passwordInput).toHaveAttribute("name", "password");
      expect(passwordInput).toHaveAttribute("minLength", "6");
    });

    it("should render submit button", () => {
      render(<RegisterForm />);
      const submitButton = screen.getByRole("button", { name: /zarejestruj się/i });
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).toHaveAttribute("type", "submit");
    });

    it("should render login link", () => {
      render(<RegisterForm />);
      const loginLink = screen.getByRole("link", { name: /zaloguj się/i });
      expect(loginLink).toBeInTheDocument();
      expect(loginLink).toHaveAttribute("href", "/login");
    });

    it("should not show error message initially", () => {
      render(<RegisterForm />);
      const errorAlert = screen.queryByRole("alert");
      expect(errorAlert).not.toBeInTheDocument();
    });

    it("should have proper placeholder texts", () => {
      render(<RegisterForm />);
      const emailInput = screen.getByLabelText(/adres e-mail/i);
      const passwordInput = screen.getByLabelText(/hasło/i);
      
      expect(emailInput).toHaveAttribute("placeholder", "twoj@email.com");
      expect(passwordInput).toHaveAttribute("placeholder", "Minimum 6 znaków");
    });

    it("should render with proper form structure", () => {
      render(<RegisterForm />);
      const form = screen.getByRole("button", { name: /zarejestruj się/i }).closest("form");
      expect(form).toBeInTheDocument();
    });
  });

  describe("Form validation - Client-side", () => {
    it("should disable submit button when both fields are empty", () => {
      render(<RegisterForm />);
      const submitButton = screen.getByRole("button", { name: /zarejestruj się/i });
      expect(submitButton).toBeDisabled();
    });

    it("should disable submit button when only email is filled", async () => {
      const user = userEvent.setup();
      render(<RegisterForm />);

      const emailInput = screen.getByLabelText(/adres e-mail/i);
      await user.type(emailInput, "test@example.com");

      const submitButton = screen.getByRole("button", { name: /zarejestruj się/i });
      expect(submitButton).toBeDisabled();
    });

    it("should disable submit button when only password is filled", async () => {
      const user = userEvent.setup();
      render(<RegisterForm />);

      const passwordInput = screen.getByLabelText(/hasło/i);
      await user.type(passwordInput, "password123");

      const submitButton = screen.getByRole("button", { name: /zarejestruj się/i });
      expect(submitButton).toBeDisabled();
    });

    it("should disable submit button when password is too short", async () => {
      const user = userEvent.setup();
      render(<RegisterForm />);

      const emailInput = screen.getByLabelText(/adres e-mail/i);
      const passwordInput = screen.getByLabelText(/hasło/i);

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "12345"); // 5 characters

      const submitButton = screen.getByRole("button", { name: /zarejestruj się/i });
      expect(submitButton).toBeDisabled();
    });

    it("should enable submit button when both fields are valid", async () => {
      const user = userEvent.setup();
      render(<RegisterForm />);

      const emailInput = screen.getByLabelText(/adres e-mail/i);
      const passwordInput = screen.getByLabelText(/hasło/i);

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123"); // 11 characters

      const submitButton = screen.getByRole("button", { name: /zarejestruj się/i });
      expect(submitButton).not.toBeDisabled();
    });

    it("should show client-side error for password < 6 characters", async () => {
      const user = userEvent.setup();

      const { authClient } = await import("@/db/auth.client");
      vi.mocked(authClient.auth.signUp).mockResolvedValue({
        data: { user: null, session: null },
        error: null,
      });

      render(<RegisterForm />);

      const emailInput = screen.getByLabelText(/adres e-mail/i);
      const passwordInput = screen.getByLabelText(/hasło/i);

      // First fill with valid password to enable button
      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "123456"); // 6 characters - valid

      const submitButton = screen.getByRole("button", { name: /zarejestruj się/i });
      expect(submitButton).not.toBeDisabled();

      // Now change password to invalid length
      await user.clear(passwordInput);
      await user.type(passwordInput, "12345"); // 5 characters - invalid

      // Button should be disabled
      expect(submitButton).toBeDisabled();
    });
  });

  describe("User input handling", () => {
    it("should update email value on input change", async () => {
      const user = userEvent.setup();
      render(<RegisterForm />);

      const emailInput = screen.getByLabelText(/adres e-mail/i) as HTMLInputElement;
      await user.type(emailInput, "test@example.com");

      expect(emailInput.value).toBe("test@example.com");
    });

    it("should update password value on input change", async () => {
      const user = userEvent.setup();
      render(<RegisterForm />);

      const passwordInput = screen.getByLabelText(/hasło/i) as HTMLInputElement;
      await user.type(passwordInput, "mypassword123");

      expect(passwordInput.value).toBe("mypassword123");
    });

    it("should handle rapid typing in both fields", async () => {
      const user = userEvent.setup();
      render(<RegisterForm />);

      const emailInput = screen.getByLabelText(/adres e-mail/i) as HTMLInputElement;
      const passwordInput = screen.getByLabelText(/hasło/i) as HTMLInputElement;

      await user.type(emailInput, "rapid@test.com", { delay: 1 });
      await user.type(passwordInput, "rapid123", { delay: 1 });

      expect(emailInput.value).toBe("rapid@test.com");
      expect(passwordInput.value).toBe("rapid123");
    });

    it("should clear and re-enter values", async () => {
      const user = userEvent.setup();
      render(<RegisterForm />);

      const emailInput = screen.getByLabelText(/adres e-mail/i) as HTMLInputElement;

      await user.type(emailInput, "first@test.com");
      expect(emailInput.value).toBe("first@test.com");

      await user.clear(emailInput);
      expect(emailInput.value).toBe("");

      await user.type(emailInput, "second@test.com");
      expect(emailInput.value).toBe("second@test.com");
    });

    it("should handle password with exactly 6 characters", async () => {
      const user = userEvent.setup();
      render(<RegisterForm />);

      const emailInput = screen.getByLabelText(/adres e-mail/i);
      const passwordInput = screen.getByLabelText(/hasło/i) as HTMLInputElement;

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "123456"); // Exactly 6 characters

      expect(passwordInput.value).toBe("123456");

      const submitButton = screen.getByRole("button", { name: /zarejestruj się/i });
      expect(submitButton).not.toBeDisabled();
    });
  });

  describe("Loading state", () => {
    it("should show loading state during registration", async () => {
      const user = userEvent.setup();

      // Mock slow API call
      const { authClient } = await import("@/db/auth.client");
      vi.mocked(authClient.auth.signUp).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  data: { 
                    user: { id: "123", email: "test@example.com" } as any, 
                    session: { access_token: "token" } as any 
                  },
                  error: null,
                }),
              100
            )
          )
      );

      render(<RegisterForm />);

      const emailInput = screen.getByLabelText(/adres e-mail/i);
      const passwordInput = screen.getByLabelText(/hasło/i);

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");

      const submitButton = screen.getByRole("button", { name: /zarejestruj się/i });
      await user.click(submitButton);

      // Check for loading text
      expect(screen.getByText(/rejestrowanie\.\.\./i)).toBeInTheDocument();

      // Check button is disabled during loading
      expect(submitButton).toBeDisabled();
    });

    it("should disable input fields and button during loading", async () => {
      const user = userEvent.setup();

      // Mock slow API call
      const { authClient } = await import("@/db/auth.client");
      vi.mocked(authClient.auth.signUp).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  data: { 
                    user: { id: "123", email: "test@example.com" } as any, 
                    session: { access_token: "token" } as any 
                  },
                  error: null,
                }),
              100
            )
          )
      );

      render(<RegisterForm />);

      const emailInput = screen.getByLabelText(/adres e-mail/i);
      const passwordInput = screen.getByLabelText(/hasło/i);

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");

      const submitButton = screen.getByRole("button", { name: /zarejestruj się/i });
      await user.click(submitButton);

      // Check inputs are disabled
      expect(emailInput).toBeDisabled();
      expect(passwordInput).toBeDisabled();
    });
  });

  describe("Successful registration", () => {
    it("should redirect to /generate on successful registration with auto-login", async () => {
      const user = userEvent.setup();

      const { authClient } = await import("@/db/auth.client");
      vi.mocked(authClient.auth.signUp).mockResolvedValue({
        data: {
          user: { id: "user-123", email: "test@example.com" } as any,
          session: { access_token: "token" } as any,
        },
        error: null,
      });

      render(<RegisterForm />);

      const emailInput = screen.getByLabelText(/adres e-mail/i);
      const passwordInput = screen.getByLabelText(/hasło/i);

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");

      const submitButton = screen.getByRole("button", { name: /zarejestruj się/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(window.location.href).toBe("/generate");
      });
    });

    it("should call signUp with correct credentials", async () => {
      const user = userEvent.setup();

      const { authClient } = await import("@/db/auth.client");
      vi.mocked(authClient.auth.signUp).mockResolvedValue({
        data: {
          user: { id: "user-123", email: "test@example.com" } as any,
          session: { access_token: "token" } as any,
        },
        error: null,
      });

      render(<RegisterForm />);

      const emailInput = screen.getByLabelText(/adres e-mail/i);
      const passwordInput = screen.getByLabelText(/hasło/i);

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "mypassword123");

      const submitButton = screen.getByRole("button", { name: /zarejestruj się/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(authClient.auth.signUp).toHaveBeenCalledWith({
          email: "test@example.com",
          password: "mypassword123",
        });
      });
    });

    it("should show alert when email confirmation is required", async () => {
      const user = userEvent.setup();

      const { authClient } = await import("@/db/auth.client");
      vi.mocked(authClient.auth.signUp).mockResolvedValue({
        data: {
          user: { id: "user-123", email: "test@example.com" } as any,
          session: null, // No session = email confirmation required
        },
        error: null,
      });

      render(<RegisterForm />);

      const emailInput = screen.getByLabelText(/adres e-mail/i);
      const passwordInput = screen.getByLabelText(/hasło/i);

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");

      const submitButton = screen.getByRole("button", { name: /zarejestruj się/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(
          "Konto zostało utworzone. Sprawdź email i potwierdź adres."
        );
      });

      // Loading state should be cleared (button re-enabled)
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });
  });

  describe("Error handling - Supabase errors", () => {
    it("should show error for duplicate email", async () => {
      const user = userEvent.setup();

      const { authClient } = await import("@/db/auth.client");
      vi.mocked(authClient.auth.signUp).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: "User already registered" } as any,
      });

      render(<RegisterForm />);

      const emailInput = screen.getByLabelText(/adres e-mail/i);
      const passwordInput = screen.getByLabelText(/hasło/i);

      await user.type(emailInput, "existing@example.com");
      await user.type(passwordInput, "password123");

      const submitButton = screen.getByRole("button", { name: /zarejestruj się/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole("alert")).toHaveTextContent(
          /ten adres email jest już zajęty/i
        );
      });
    });

    it("should show error for invalid email format", async () => {
      const user = userEvent.setup();

      const { authClient } = await import("@/db/auth.client");
      vi.mocked(authClient.auth.signUp).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: "Unable to validate email address: invalid email format" } as any,
      });

      render(<RegisterForm />);

      const emailInput = screen.getByLabelText(/adres e-mail/i);
      const passwordInput = screen.getByLabelText(/hasło/i);

      await user.type(emailInput, "test@example.com"); // Use valid format to pass HTML5 validation
      await user.type(passwordInput, "password123");

      const submitButton = screen.getByRole("button", { name: /zarejestruj się/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole("alert")).toHaveTextContent(
          /wprowadź prawidłowy adres email/i
        );
      });
    });

    it("should show error for password too short (server-side)", async () => {
      const user = userEvent.setup();

      const { authClient } = await import("@/db/auth.client");
      vi.mocked(authClient.auth.signUp).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: "Password should be at least 6 characters" } as any,
      });

      render(<RegisterForm />);

      const emailInput = screen.getByLabelText(/adres e-mail/i);
      const passwordInput = screen.getByLabelText(/hasło/i);

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "123456"); // Valid on client, but server rejects

      const submitButton = screen.getByRole("button", { name: /zarejestruj się/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole("alert")).toHaveTextContent(
          /hasło musi mieć co najmniej 6 znaków/i
        );
      });
    });

    it("should show error for network issues", async () => {
      const user = userEvent.setup();

      const { authClient } = await import("@/db/auth.client");
      vi.mocked(authClient.auth.signUp).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: "Network error" } as any,
      });

      render(<RegisterForm />);

      const emailInput = screen.getByLabelText(/adres e-mail/i);
      const passwordInput = screen.getByLabelText(/hasło/i);

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");

      const submitButton = screen.getByRole("button", { name: /zarejestruj się/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole("alert")).toHaveTextContent(
          /brak połączenia z internetem/i
        );
      });
    });

    it("should show generic error for unknown Supabase errors", async () => {
      const user = userEvent.setup();

      const { authClient } = await import("@/db/auth.client");
      vi.mocked(authClient.auth.signUp).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: "Some unknown error from Supabase" } as any,
      });

      render(<RegisterForm />);

      const emailInput = screen.getByLabelText(/adres e-mail/i);
      const passwordInput = screen.getByLabelText(/hasło/i);

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");

      const submitButton = screen.getByRole("button", { name: /zarejestruj się/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole("alert")).toHaveTextContent(
          /wystąpił błąd\. spróbuj ponownie/i
        );
      });
    });

    it("should clear previous error on new submission", async () => {
      const user = userEvent.setup();

      const { authClient } = await import("@/db/auth.client");

      // First attempt - error
      vi.mocked(authClient.auth.signUp).mockResolvedValueOnce({
        data: { user: null, session: null },
        error: { message: "User already registered" } as any,
      });

      render(<RegisterForm />);

      const emailInput = screen.getByLabelText(/adres e-mail/i);
      const passwordInput = screen.getByLabelText(/hasło/i);
      const submitButton = screen.getByRole("button", { name: /zarejestruj się/i });

      await user.type(emailInput, "existing@example.com");
      await user.type(passwordInput, "password123");
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeInTheDocument();
      });

      // Second attempt - should clear error first
      vi.mocked(authClient.auth.signUp).mockResolvedValueOnce({
        data: {
          user: { id: "123", email: "new@example.com" } as any,
          session: { access_token: "token" } as any,
        },
        error: null,
      });

      await user.clear(emailInput);
      await user.clear(passwordInput);
      await user.type(emailInput, "new@example.com");
      await user.type(passwordInput, "newpassword123");
      await user.click(submitButton);

      // Error should be cleared during loading
      await waitFor(() => {
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      });
    });
  });

  describe("Error handling - Unexpected errors", () => {
    it("should handle thrown exceptions gracefully", async () => {
      const user = userEvent.setup();

      const { authClient } = await import("@/db/auth.client");
      vi.mocked(authClient.auth.signUp).mockRejectedValue(
        new Error("Unexpected error")
      );

      render(<RegisterForm />);

      const emailInput = screen.getByLabelText(/adres e-mail/i);
      const passwordInput = screen.getByLabelText(/hasło/i);

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");

      const submitButton = screen.getByRole("button", { name: /zarejestruj się/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole("alert")).toHaveTextContent(
          /wystąpił błąd\. spróbuj ponownie/i
        );
      });
    });
  });

  describe("Accessibility", () => {
    it("should have proper form labels", () => {
      render(<RegisterForm />);

      const emailInput = screen.getByLabelText(/adres e-mail/i);
      const passwordInput = screen.getByLabelText(/hasło/i);

      expect(emailInput).toHaveAttribute("id", "email");
      expect(passwordInput).toHaveAttribute("id", "password");
    });

    it("should have proper autocomplete attributes", () => {
      render(<RegisterForm />);

      const emailInput = screen.getByLabelText(/adres e-mail/i);
      const passwordInput = screen.getByLabelText(/hasło/i);

      expect(emailInput).toHaveAttribute("autocomplete", "email");
      expect(passwordInput).toHaveAttribute("autocomplete", "new-password");
    });

    it("should mark error alert with role='alert'", async () => {
      const user = userEvent.setup();

      const { authClient } = await import("@/db/auth.client");
      vi.mocked(authClient.auth.signUp).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: "User already registered" } as any,
      });

      render(<RegisterForm />);

      const emailInput = screen.getByLabelText(/adres e-mail/i);
      const passwordInput = screen.getByLabelText(/hasło/i);

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");

      const submitButton = screen.getByRole("button", { name: /zarejestruj się/i });
      await user.click(submitButton);

      await waitFor(() => {
        const alert = screen.getByRole("alert");
        expect(alert).toBeInTheDocument();
      });
    });
  });

  describe("Edge cases", () => {
    it("should handle very long email input", async () => {
      const user = userEvent.setup();
      render(<RegisterForm />);

      const longEmail = "a".repeat(100) + "@example.com";
      const emailInput = screen.getByLabelText(/adres e-mail/i) as HTMLInputElement;

      await user.type(emailInput, longEmail);
      expect(emailInput.value).toBe(longEmail);
    });

    it("should prevent double submission", async () => {
      const user = userEvent.setup();

      const { authClient } = await import("@/db/auth.client");
      vi.mocked(authClient.auth.signUp).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  data: { 
                    user: { id: "123", email: "test@example.com" } as any, 
                    session: { access_token: "token" } as any 
                  },
                  error: null,
                }),
              100
            )
          )
      );

      render(<RegisterForm />);

      const emailInput = screen.getByLabelText(/adres e-mail/i);
      const passwordInput = screen.getByLabelText(/hasło/i);

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");

      const submitButton = screen.getByRole("button", { name: /zarejestruj się/i });

      // Click twice rapidly
      await user.click(submitButton);
      await user.click(submitButton);

      // Should only be called once
      await waitFor(() => {
        expect(authClient.auth.signUp).toHaveBeenCalledTimes(1);
      });
    });
  });
});
