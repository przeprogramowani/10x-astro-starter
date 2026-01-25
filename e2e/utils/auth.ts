import { Page, expect } from "@playwright/test";

/**
 * Helper function to log in a user
 */
export async function login(page: Page, email: string, password: string) {
  await page.goto("/login");

  // Use pressSequentially to trigger onChange events for React form validation
  await page.locator('input[type="email"]').pressSequentially(email, { delay: 100 });
  await page.locator('input[type="password"]').pressSequentially(password, { delay: 300 });

  // Wait for the submit button to be enabled (validation complete)
  const submitButton = page.locator('button[type="submit"]');
  await expect(submitButton).toBeEnabled({ timeout: 10000 });

  await submitButton.click();

  // Wait for navigation after login
  await page.waitForURL(/\/(cards|generate|profile)/);
}

/**
 * Helper function to log out a user
 */
export async function logout(page: Page) {
  // Click user menu button
  await page.click('[data-testid="user-menu-trigger"]');

  // Click logout button
  await page.click('[data-testid="logout-button"]');

  // Wait for redirect to home page
  await page.waitForURL("/");
}

/**
 * Helper function to register a new user
 */
export async function register(page: Page, email: string, password: string, confirmPassword?: string) {
  await page.goto("/register");
  await page.fill('input[type="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.fill('input[name="confirmPassword"]', confirmPassword || password);
  await page.click('button[type="submit"]');
}
