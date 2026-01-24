import { ReactElement } from "react";
import { render, RenderOptions } from "@testing-library/react";

/**
 * Custom render function that wraps components with providers
 * Add any global providers here (e.g., Router, Theme, etc.)
 */
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) => {
  return render(ui, { ...options });
};

// Re-export everything from testing-library
export * from "@testing-library/react";
export { customRender as render };
