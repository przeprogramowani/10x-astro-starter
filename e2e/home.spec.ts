import { test, expect } from "./fixtures";

test.describe("Home Page", () => {
  test("should load the home page", async ({ page }) => {
    await page.goto("/");
    
    // Check if the page title is correct
    await expect(page).toHaveTitle(/10x Cards/i);
  });

  test("should display navigation links", async ({ page }) => {
    await page.goto("/");
    
    // Check for login and register links
    const loginLink = page.getByRole("link", { name: /login/i });
    const registerLink = page.getByRole("link", { name: /register/i });
    
    await expect(loginLink).toBeVisible();
    await expect(registerLink).toBeVisible();
  });

  test("should navigate to login page", async ({ page }) => {
    await page.goto("/");
    
    await page.click('a[href="/login"]');
    await expect(page).toHaveURL("/login");
  });

  test("should navigate to register page", async ({ page }) => {
    await page.goto("/");
    
    await page.click('a[href="/register"]');
    await expect(page).toHaveURL("/register");
  });
});
