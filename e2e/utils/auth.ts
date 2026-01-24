import { Page } from "@playwright/test";

/**
 * Helper function to log in a user
 */
export async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  
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
export async function register(
  page: Page,
  email: string,
  password: string,
  confirmPassword?: string
) {
  await page.goto("/register");
  await page.fill('input[type="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.fill('input[name="confirmPassword"]', confirmPassword || password);
  await page.click('button[type="submit"]');
}
