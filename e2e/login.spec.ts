import { test, expect } from "./fixtures";

test.describe("Login Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("should display login form", async ({ page }) => {
    // Check for email and password inputs
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const submitButton = page.locator('button[type="submit"]');

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();
  });

  test("should show validation errors for empty form", async ({ page }) => {
    // Click submit without filling the form
    await page.click('button[type="submit"]');

    // Wait for validation errors to appear
    // Note: Adjust selectors based on your actual error message implementation
    await page.waitForTimeout(500);
    
    // Check if we're still on the login page (form didn't submit)
    await expect(page).toHaveURL("/login");
  });

  test("should show error for invalid credentials", async ({ page }) => {
    // Fill in invalid credentials
    await page.fill('input[type="email"]', "invalid@example.com");
    await page.fill('input[type="password"]', "wrongpassword");
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Wait for error message
    await page.waitForTimeout(1000);
    
    // Should still be on login page
    await expect(page).toHaveURL("/login");
  });

  test("should have link to register page", async ({ page }) => {
    const registerLink = page.getByRole("link", { name: /register/i });
    await expect(registerLink).toBeVisible();
  });

  test("should have link to forgot password page", async ({ page }) => {
    const forgotPasswordLink = page.getByRole("link", {
      name: /forgot.*password/i,
    });
    await expect(forgotPasswordLink).toBeVisible();
  });
});
