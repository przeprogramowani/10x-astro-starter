import { test as base } from "@playwright/test";

/**
 * Custom fixtures for Playwright tests
 * Extend this as needed with custom fixtures
 */

type CustomFixtures = {
  // Add custom fixtures here
  // Example: authenticatedPage: Page;
};

export const test = base.extend<CustomFixtures>({
  // Define custom fixtures here
  // Example:
  // authenticatedPage: async ({ page }, use) => {
  //   await login(page, testUsers.valid.email, testUsers.valid.password);
  //   await use(page);
  // },
});

export { expect } from "@playwright/test";
