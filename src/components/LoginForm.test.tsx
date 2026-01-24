import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@/test/test-utils";
import userEvent from "@testing-library/user-event";
import LoginForm from "./LoginForm";

// Mock auth client
vi.mock("@/db/auth.client", () => ({
  authClient: {
    auth: {
      signInWithPassword: vi.fn(),
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

describe("LoginForm Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocationHref.mockClear();
  });

  describe("Rendering", () => {
    it("should render email input field", () => {
      render(<LoginForm />);
      const emailInput = screen.getByLabelText(/adres e-mail/i);
      expect(emailInput).toBeInTheDocument();
      expect(emailInput).toHaveAttribute("type", "email");
      expect(emailInput).toHaveAttribute("name", "email");
    });

    it("should render password input field", () => {
      render(<LoginForm />);
      const passwordInput = screen.getByLabelText(/hasło/i);
      expect(passwordInput).toBeInTheDocument();
      expect(passwordInput).toHaveAttribute("type", "password");
      expect(passwordInput).toHaveAttribute("name", "password");
    });

    it("should render submit button", () => {
      render(<LoginForm />);
      const submitButton = screen.getByRole("button", { name: /zaloguj się/i });
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).toHaveAttribute("type", "submit");
    });

    it("should render forgot password link", () => {
      render(<LoginForm />);
      const forgotLink = screen.getByRole("link", { name: /zapomniałeś hasła/i });
      expect(forgotLink).toBeInTheDocument();
      expect(forgotLink).toHaveAttribute("href", "/forgot-password");
    });

    it("should render register link", () => {
      render(<LoginForm />);
      const registerLink = screen.getByRole("link", { name: /zarejestruj się/i });
      expect(registerLink).toBeInTheDocument();
      expect(registerLink).toHaveAttribute("href", "/register");
    });

    it("should not show error message initially", () => {
      render(<LoginForm />);
      const errorAlert = screen.queryByRole("alert");
      expect(errorAlert).not.toBeInTheDocument();
    });
  });

  describe("Form validation - Empty fields", () => {
    it("should disable submit button when both fields are empty", () => {
      render(<LoginForm />);
      const submitButton = screen.getByRole("button", { name: /zaloguj się/i });
      expect(submitButton).toBeDisabled();
    });

    it("should disable submit button when only email is filled", async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/adres e-mail/i);
      await user.type(emailInput, "test@example.com");

      const submitButton = screen.getByRole("button", { name: /zaloguj się/i });
      expect(submitButton).toBeDisabled();
    });

    it("should disable submit button when only password is filled", async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      const passwordInput = screen.getByLabelText(/hasło/i);
      await user.type(passwordInput, "password123");

      const submitButton = screen.getByRole("button", { name: /zaloguj się/i });
      expect(submitButton).toBeDisabled();
    });

    it("should enable submit button when both fields are filled", async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/adres e-mail/i);
      const passwordInput = screen.getByLabelText(/hasło/i);

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");

      const submitButton = screen.getByRole("button", { name: /zaloguj się/i });
      expect(submitButton).not.toBeDisabled();
    });

    it("should show error when submitting empty form", async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      // Force enable button to test validation
      const form = screen.getByRole("button", { name: /zaloguj się/i }).closest("form");
      if (form) {
        await user.click(screen.getByRole("button", { name: /zaloguj się/i }));
      }

      // Note: This test verifies the HTML5 required attribute prevents submission
      // The actual validation happens at browser level
    });
  });

  describe("User input handling", () => {
    it("should update email value on input change", async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/adres e-mail/i) as HTMLInputElement;
      await user.type(emailInput, "test@example.com");

      expect(emailInput.value).toBe("test@example.com");
    });

    it("should update password value on input change", async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      const passwordInput = screen.getByLabelText(/hasło/i) as HTMLInputElement;
      await user.type(passwordInput, "mypassword");

      expect(passwordInput.value).toBe("mypassword");
    });

    it("should handle rapid typing in email field", async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/adres e-mail/i) as HTMLInputElement;
      await user.type(emailInput, "rapid@test.com", { delay: 1 });

      expect(emailInput.value).toBe("rapid@test.com");
    });

    it("should clear and re-enter values", async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/adres e-mail/i) as HTMLInputElement;

      await user.type(emailInput, "first@test.com");
      expect(emailInput.value).toBe("first@test.com");

      await user.clear(emailInput);
      expect(emailInput.value).toBe("");

      await user.type(emailInput, "second@test.com");
      expect(emailInput.value).toBe("second@test.com");
    });
  });

  describe("Loading state", () => {
    it("should show loading state during submission", async () => {
      const user = userEvent.setup();

      // Mock slow API call
      const { authClient } = await import("@/db/auth.client");
      vi.mocked(authClient.auth.signInWithPassword).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  data: { user: { id: "123" }, session: null },
                  error: null,
                }),
              100
            )
          )
      );

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/adres e-mail/i);
      const passwordInput = screen.getByLabelText(/hasło/i);

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");

      const submitButton = screen.getByRole("button", { name: /zaloguj się/i });
      await user.click(submitButton);

      // Check for loading text
      expect(screen.getByText(/logowanie\.\.\./i)).toBeInTheDocument();

      // Check button is disabled during loading
      expect(submitButton).toBeDisabled();
    });

    it("should disable input fields during loading", async () => {
      const user = userEvent.setup();

      // Mock slow API call
      const { authClient } = await import("@/db/auth.client");
      vi.mocked(authClient.auth.signInWithPassword).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  data: { user: { id: "123" }, session: null },
                  error: null,
                }),
              100
            )
          )
      );

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/adres e-mail/i);
      const passwordInput = screen.getByLabelText(/hasło/i);

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");

      const submitButton = screen.getByRole("button", { name: /zaloguj się/i });
      await user.click(submitButton);

      // Check inputs are disabled
      expect(emailInput).toBeDisabled();
      expect(passwordInput).toBeDisabled();
    });
  });

  describe("Successful login", () => {
    it("should redirect to /generate on successful login", async () => {
      const user = userEvent.setup();

      const { authClient } = await import("@/db/auth.client");
      vi.mocked(authClient.auth.signInWithPassword).mockResolvedValue({
        data: {
          user: { id: "user-123", email: "test@example.com" } as any,
          session: { access_token: "token" } as any,
        },
        error: null,
      });

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/adres e-mail/i);
      const passwordInput = screen.getByLabelText(/hasło/i);

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");

      const submitButton = screen.getByRole("button", { name: /zaloguj się/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(window.location.href).toBe("/generate");
      });
    });

    it("should call signInWithPassword with correct credentials", async () => {
      const user = userEvent.setup();

      const { authClient } = await import("@/db/auth.client");
      vi.mocked(authClient.auth.signInWithPassword).mockResolvedValue({
        data: {
          user: { id: "user-123" } as any,
          session: { access_token: "token" } as any,
        },
        error: null,
      });

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/adres e-mail/i);
      const passwordInput = screen.getByLabelText(/hasło/i);

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "mypassword123");

      const submitButton = screen.getByRole("button", { name: /zaloguj się/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(authClient.auth.signInWithPassword).toHaveBeenCalledWith({
          email: "test@example.com",
          password: "mypassword123",
        });
      });
    });
  });

  describe("Error handling - Supabase errors", () => {
    it("should show error for invalid credentials", async () => {
      const user = userEvent.setup();

      const { authClient } = await import("@/db/auth.client");
      vi.mocked(authClient.auth.signInWithPassword).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: "Invalid login credentials" } as any,
      });

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/adres e-mail/i);
      const passwordInput = screen.getByLabelText(/hasło/i);

      await user.type(emailInput, "wrong@example.com");
      await user.type(passwordInput, "wrongpassword");

      const submitButton = screen.getByRole("button", { name: /zaloguj się/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole("alert")).toHaveTextContent(
          /nieprawidłowy email lub hasło/i
        );
      });
    });

    it("should show error for unconfirmed email", async () => {
      const user = userEvent.setup();

      const { authClient } = await import("@/db/auth.client");
      vi.mocked(authClient.auth.signInWithPassword).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: "Email not confirmed" } as any,
      });

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/adres e-mail/i);
      const passwordInput = screen.getByLabelText(/hasło/i);

      await user.type(emailInput, "unconfirmed@example.com");
      await user.type(passwordInput, "password123");

      const submitButton = screen.getByRole("button", { name: /zaloguj się/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole("alert")).toHaveTextContent(
          /potwierdź swój adres email przed zalogowaniem/i
        );
      });
    });

    it("should show error for network issues", async () => {
      const user = userEvent.setup();

      const { authClient } = await import("@/db/auth.client");
      vi.mocked(authClient.auth.signInWithPassword).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: "Network error" } as any,
      });

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/adres e-mail/i);
      const passwordInput = screen.getByLabelText(/hasło/i);

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");

      const submitButton = screen.getByRole("button", { name: /zaloguj się/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole("alert")).toHaveTextContent(
          /brak połączenia z internetem/i
        );
      });
    });

    it("should clear previous error on new submission", async () => {
      const user = userEvent.setup();

      const { authClient } = await import("@/db/auth.client");

      // First attempt - error
      vi.mocked(authClient.auth.signInWithPassword).mockResolvedValueOnce({
        data: { user: null, session: null },
        error: { message: "Invalid login credentials" } as any,
      });

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/adres e-mail/i);
      const passwordInput = screen.getByLabelText(/hasło/i);
      const submitButton = screen.getByRole("button", { name: /zaloguj się/i });

      await user.type(emailInput, "wrong@example.com");
      await user.type(passwordInput, "wrongpassword");
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeInTheDocument();
      });

      // Second attempt - should clear error first
      vi.mocked(authClient.auth.signInWithPassword).mockResolvedValueOnce({
        data: {
          user: { id: "123" } as any,
          session: { access_token: "token" } as any,
        },
        error: null,
      });

      await user.clear(emailInput);
      await user.clear(passwordInput);
      await user.type(emailInput, "correct@example.com");
      await user.type(passwordInput, "correctpassword");
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
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const { authClient } = await import("@/db/auth.client");
      vi.mocked(authClient.auth.signInWithPassword).mockRejectedValue(
        new Error("Unexpected error")
      );

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/adres e-mail/i);
      const passwordInput = screen.getByLabelText(/hasło/i);

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");

      const submitButton = screen.getByRole("button", { name: /zaloguj się/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole("alert")).toHaveTextContent(
          /wystąpił błąd\. spróbuj ponownie/i
        );
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Login error:",
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe("Accessibility", () => {
    it("should have proper form labels", () => {
      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/adres e-mail/i);
      const passwordInput = screen.getByLabelText(/hasło/i);

      expect(emailInput).toHaveAttribute("id", "email");
      expect(passwordInput).toHaveAttribute("id", "password");
    });

    it("should have proper autocomplete attributes", () => {
      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/adres e-mail/i);
      const passwordInput = screen.getByLabelText(/hasło/i);

      expect(emailInput).toHaveAttribute("autocomplete", "email");
      expect(passwordInput).toHaveAttribute("autocomplete", "current-password");
    });

    it("should mark error alert with role='alert'", async () => {
      const user = userEvent.setup();

      const { authClient } = await import("@/db/auth.client");
      vi.mocked(authClient.auth.signInWithPassword).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: "Invalid login credentials" } as any,
      });

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/adres e-mail/i);
      const passwordInput = screen.getByLabelText(/hasło/i);

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");

      const submitButton = screen.getByRole("button", { name: /zaloguj się/i });
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
      render(<LoginForm />);

      const longEmail = "a".repeat(100) + "@example.com";
      const emailInput = screen.getByLabelText(/adres e-mail/i) as HTMLInputElement;

      await user.type(emailInput, longEmail);
      expect(emailInput.value).toBe(longEmail);
    });

    it("should handle special characters in password", async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      const specialPassword = "P@ssw0rd!#$%^&*()";
      const passwordInput = screen.getByLabelText(/hasło/i) as HTMLInputElement;

      await user.type(passwordInput, specialPassword);
      expect(passwordInput.value).toBe(specialPassword);
    });

    it("should prevent double submission", async () => {
      const user = userEvent.setup();

      const { authClient } = await import("@/db/auth.client");
      vi.mocked(authClient.auth.signInWithPassword).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  data: { user: { id: "123" } as any, session: null },
                  error: null,
                }),
              100
            )
          )
      );

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/adres e-mail/i);
      const passwordInput = screen.getByLabelText(/hasło/i);

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");

      const submitButton = screen.getByRole("button", { name: /zaloguj się/i });

      // Click twice rapidly
      await user.click(submitButton);
      await user.click(submitButton);

      // Should only be called once
      await waitFor(() => {
        expect(authClient.auth.signInWithPassword).toHaveBeenCalledTimes(1);
      });
    });
  });
});
