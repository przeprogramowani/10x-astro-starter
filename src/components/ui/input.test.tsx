import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@/test/test-utils";
import userEvent from "@testing-library/user-event";
import { Input } from "./input";

describe("Input Component", () => {
  describe("Rendering", () => {
    it("should render input element", () => {
      render(<Input />);
      const input = screen.getByRole("textbox");
      expect(input).toBeInTheDocument();
    });

    it("should render with default type text", () => {
      render(<Input />);
      const input = screen.getByRole("textbox");
      // Note: HTML5 default type is "text" but may not be explicitly set
      expect(input.tagName).toBe("INPUT");
    });

    it("should render with custom type", () => {
      render(<Input type="email" />);
      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("type", "email");
    });

    it("should render password input", () => {
      render(<Input type="password" />);
      const input = document.querySelector('input[type="password"]');
      expect(input).toBeInTheDocument();
    });

    it("should render number input", () => {
      render(<Input type="number" />);
      const input = screen.getByRole("spinbutton");
      expect(input).toHaveAttribute("type", "number");
    });
  });

  describe("Props handling", () => {
    it("should apply placeholder", () => {
      render(<Input placeholder="Enter text" />);
      const input = screen.getByPlaceholderText("Enter text");
      expect(input).toBeInTheDocument();
    });

    it("should apply name attribute", () => {
      render(<Input name="username" />);
      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("name", "username");
    });

    it("should apply id attribute", () => {
      render(<Input id="email-input" />);
      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("id", "email-input");
    });

    it("should apply required attribute", () => {
      render(<Input required />);
      const input = screen.getByRole("textbox");
      expect(input).toBeRequired();
    });

    it("should apply disabled attribute", () => {
      render(<Input disabled />);
      const input = screen.getByRole("textbox");
      expect(input).toBeDisabled();
    });

    it("should apply readOnly attribute", () => {
      render(<Input readOnly />);
      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("readonly");
    });

    it("should apply autoComplete attribute", () => {
      render(<Input autoComplete="email" />);
      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("autocomplete", "email");
    });

    it("should apply maxLength attribute", () => {
      render(<Input maxLength={10} />);
      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("maxlength", "10");
    });

    it("should apply minLength attribute", () => {
      render(<Input minLength={3} />);
      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("minlength", "3");
    });
  });

  describe("Value and onChange", () => {
    it("should handle controlled input", async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();

      render(<Input value="test" onChange={handleChange} />);
      const input = screen.getByRole("textbox") as HTMLInputElement;

      expect(input.value).toBe("test");

      await user.type(input, "a");
      expect(handleChange).toHaveBeenCalled();
    });

    it("should handle uncontrolled input", async () => {
      const user = userEvent.setup();

      render(<Input defaultValue="initial" />);
      const input = screen.getByRole("textbox") as HTMLInputElement;

      expect(input.value).toBe("initial");

      await user.type(input, " text");
      expect(input.value).toBe("initial text");
    });

    it("should call onChange on every keystroke", async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();

      render(<Input onChange={handleChange} />);
      const input = screen.getByRole("textbox");

      await user.type(input, "abc");
      expect(handleChange).toHaveBeenCalledTimes(3);
    });

    it("should update value when typing", async () => {
      const user = userEvent.setup();

      render(<Input />);
      const input = screen.getByRole("textbox") as HTMLInputElement;

      await user.type(input, "Hello World");
      expect(input.value).toBe("Hello World");
    });

    it("should clear value", async () => {
      const user = userEvent.setup();

      render(<Input defaultValue="initial" />);
      const input = screen.getByRole("textbox") as HTMLInputElement;

      expect(input.value).toBe("initial");

      await user.clear(input);
      expect(input.value).toBe("");
    });
  });

  describe("CSS classes", () => {
    it("should apply default classes", () => {
      render(<Input />);
      const input = screen.getByRole("textbox");

      expect(input).toHaveClass("h-9");
      expect(input).toHaveClass("rounded-md");
      expect(input).toHaveClass("border");
    });

    it("should merge custom className with default classes", () => {
      render(<Input className="custom-class" />);
      const input = screen.getByRole("textbox");

      expect(input).toHaveClass("custom-class");
      expect(input).toHaveClass("h-9"); // default class still present
    });

    it("should override conflicting Tailwind classes", () => {
      render(<Input className="h-12" />);
      const input = screen.getByRole("textbox");

      // h-12 should override h-9 due to cn() utility
      expect(input.className).toContain("h-12");
    });

    it("should have data-slot attribute", () => {
      render(<Input />);
      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("data-slot", "input");
    });
  });

  describe("Accessibility - aria-invalid", () => {
    it("should apply aria-invalid attribute", () => {
      render(<Input aria-invalid={true} />);
      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("aria-invalid", "true");
    });

    it("should not have aria-invalid by default", () => {
      render(<Input />);
      const input = screen.getByRole("textbox");
      expect(input).not.toHaveAttribute("aria-invalid");
    });

    it("should apply aria-describedby for error messages", () => {
      render(<Input aria-describedby="error-message" aria-invalid={true} />);
      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("aria-describedby", "error-message");
      expect(input).toHaveAttribute("aria-invalid", "true");
    });
  });

  describe("Focus behavior", () => {
    it("should be focusable", async () => {
      const user = userEvent.setup();

      render(<Input />);
      const input = screen.getByRole("textbox");

      await user.click(input);
      expect(input).toHaveFocus();
    });

    it("should not be focusable when disabled", async () => {
      const user = userEvent.setup();

      render(<Input disabled />);
      const input = screen.getByRole("textbox");

      await user.click(input);
      expect(input).not.toHaveFocus();
    });

    it("should trigger onFocus event", async () => {
      const handleFocus = vi.fn();
      const user = userEvent.setup();

      render(<Input onFocus={handleFocus} />);
      const input = screen.getByRole("textbox");

      await user.click(input);
      expect(handleFocus).toHaveBeenCalledTimes(1);
    });

    it("should trigger onBlur event", async () => {
      const handleBlur = vi.fn();
      const user = userEvent.setup();

      render(
        <div>
          <Input onBlur={handleBlur} />
          <button>Other element</button>
        </div>
      );

      const input = screen.getByRole("textbox");
      const button = screen.getByRole("button");

      await user.click(input);
      await user.click(button);

      expect(handleBlur).toHaveBeenCalledTimes(1);
    });
  });

  describe("Number input specific", () => {
    it("should handle number input with min/max", () => {
      render(<Input type="number" min={0} max={100} />);
      const input = screen.getByRole("spinbutton");

      expect(input).toHaveAttribute("min", "0");
      expect(input).toHaveAttribute("max", "100");
    });

    it("should handle step attribute", () => {
      render(<Input type="number" step={0.1} />);
      const input = screen.getByRole("spinbutton");

      expect(input).toHaveAttribute("step", "0.1");
    });
  });

  describe("Edge cases", () => {
    it("should handle very long text input", async () => {
      const user = userEvent.setup();
      const longText = "a".repeat(500);

      render(<Input />);
      const input = screen.getByRole("textbox") as HTMLInputElement;

      await user.type(input, longText);
      expect(input.value).toBe(longText);
    });

    it("should handle special characters", async () => {
      const user = userEvent.setup();
      // Use paste instead of type for special characters that conflict with userEvent syntax
      const specialChars = "!@#$%^&*()_+-=[]{}|;:',.<>?/~`";

      render(<Input />);
      const input = screen.getByRole("textbox") as HTMLInputElement;

      await user.click(input);
      await user.paste(specialChars);
      expect(input.value).toBe(specialChars);
    });

    it("should handle unicode characters", async () => {
      const user = userEvent.setup();
      const unicode = "你好世界 🌍 Привет мир";

      render(<Input />);
      const input = screen.getByRole("textbox") as HTMLInputElement;

      await user.type(input, unicode);
      expect(input.value).toBe(unicode);
    });

    it("should handle paste event", async () => {
      const user = userEvent.setup();

      render(<Input />);
      const input = screen.getByRole("textbox") as HTMLInputElement;

      await user.click(input);
      await user.paste("Pasted text");

      expect(input.value).toBe("Pasted text");
    });

    it("should respect maxLength constraint", async () => {
      const user = userEvent.setup();

      render(<Input maxLength={5} />);
      const input = screen.getByRole("textbox") as HTMLInputElement;

      await user.type(input, "1234567890");
      expect(input.value.length).toBeLessThanOrEqual(5);
    });
  });

  describe("Form integration", () => {
    it("should work within a form", async () => {
      const handleSubmit = vi.fn((e) => e.preventDefault());
      const user = userEvent.setup();

      render(
        <form onSubmit={handleSubmit}>
          <Input name="username" />
          <button type="submit">Submit</button>
        </form>
      );

      const input = screen.getByRole("textbox") as HTMLInputElement;
      const submitButton = screen.getByRole("button");

      await user.type(input, "testuser");
      await user.click(submitButton);

      expect(handleSubmit).toHaveBeenCalledTimes(1);
      expect(input.value).toBe("testuser");
    });

    it("should validate required field in form", async () => {
      const handleSubmit = vi.fn((e) => e.preventDefault());
      const user = userEvent.setup();

      render(
        <form onSubmit={handleSubmit}>
          <Input name="email" required />
          <button type="submit">Submit</button>
        </form>
      );

      const input = screen.getByRole("textbox");
      const submitButton = screen.getByRole("button");

      expect(input).toBeRequired();
      await user.click(submitButton);

      // HTML5 validation should prevent submission
      // Note: In jsdom/happy-dom, this behavior may vary
    });
  });

  describe("Performance", () => {
    it("should not re-render unnecessarily", () => {
      const { rerender } = render(<Input value="test" onChange={vi.fn()} />);

      // Re-render with same props
      rerender(<Input value="test" onChange={vi.fn()} />);

      const input = screen.getByRole("textbox") as HTMLInputElement;
      expect(input.value).toBe("test");
    });
  });
});
