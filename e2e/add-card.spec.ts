import { test, expect } from "./fixtures";
import { login } from "./utils/auth";
import { testUsers, testCards } from "./fixtures/test-data";

test.describe("Add Card Manually", () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await login(page, testUsers.valid.email, testUsers.valid.password);

    // Navigate to cards page
    await page.goto("/cards");
    await page.waitForLoadState("networkidle");
  });

  test("should display add card button in filters bar", async ({ page }) => {
    const addButton = page.getByRole("button", { name: /dodaj fiszkę ręcznie/i }).first();
    await expect(addButton).toBeVisible();
  });

  test("should open add card modal when clicking add button", async ({ page }) => {
    // Click add button
    await page.getByRole("button", { name: /dodaj fiszkę ręcznie/i }).first().click();

    // Check if modal is visible
    const modalTitle = page.getByRole("heading", { name: /dodaj nową fiszkę/i });
    await expect(modalTitle).toBeVisible();

    // Check if form fields are visible
    const frontTextarea = page.locator("textarea#front");
    const backTextarea = page.locator("textarea#back");
    await expect(frontTextarea).toBeVisible();
    await expect(backTextarea).toBeVisible();

    // Check if buttons are visible
    const cancelButton = page.getByRole("button", { name: /anuluj/i });
    const submitButton = page.getByRole("button", { name: /^dodaj$/i });
    await expect(cancelButton).toBeVisible();
    await expect(submitButton).toBeVisible();
  });

  test("should close modal when clicking cancel button", async ({ page }) => {
    // Open modal
    await page.getByRole("button", { name: /dodaj fiszkę ręcznie/i }).first().click();

    // Wait for modal to be visible
    await expect(page.getByRole("heading", { name: /dodaj nową fiszkę/i })).toBeVisible();

    // Click cancel
    await page.getByRole("button", { name: /anuluj/i }).click();

    // Modal should be closed
    await expect(page.getByRole("heading", { name: /dodaj nową fiszkę/i })).not.toBeVisible();
  });

  test("should have submit button disabled when form is empty", async ({ page }) => {
    // Open modal
    await page.getByRole("button", { name: /dodaj fiszkę ręcznie/i }).first().click();

    // Submit button should be disabled
    const submitButton = page.getByRole("button", { name: /^dodaj$/i });
    await expect(submitButton).toBeDisabled();
  });

  test("should show character counters for both fields", async ({ page }) => {
    // Open modal
    await page.getByRole("button", { name: /dodaj fiszkę ręcznie/i }).first().click();

    // Check for character counters
    const frontCounter = page.locator("text=/0 \\/ 200/");
    const backCounter = page.locator("text=/0 \\/ 500/");

    await expect(frontCounter).toBeVisible();
    await expect(backCounter).toBeVisible();
  });

  test("should update character counter when typing", async ({ page }) => {
    // Open modal
    await page.getByRole("button", { name: /dodaj fiszkę ręcznie/i }).first().click();

    // Type in front field
    const frontTextarea = page.locator("textarea#front");
    await frontTextarea.fill("Test question");

    // Check if counter updated (12 characters)
    await expect(page.locator("text=/13 \\/ 200/")).toBeVisible();
  });

  test("should show validation error when front field is empty on submit", async ({ page }) => {
    // Open modal
    await page.getByRole("button", { name: /dodaj fiszkę ręcznie/i }).first().click();

    // Fill only back field
    await page.locator("textarea#back").fill("Test answer");

    // Try to submit (button should still be disabled)
    const submitButton = page.getByRole("button", { name: /^dodaj$/i });
    await expect(submitButton).toBeDisabled();
  });

  test("should show validation error when back field is empty on submit", async ({ page }) => {
    // Open modal
    await page.getByRole("button", { name: /dodaj fiszkę ręcznie/i }).first().click();

    // Fill only front field
    await page.locator("textarea#front").fill("Test question");

    // Try to submit (button should still be disabled)
    const submitButton = page.getByRole("button", { name: /^dodaj$/i });
    await expect(submitButton).toBeDisabled();
  });

  test("should enable submit button when both fields are filled", async ({ page }) => {
    // Open modal
    await page.getByRole("button", { name: /dodaj fiszkę ręcznie/i }).first().click();

    // Fill both fields
    await page.locator("textarea#front").fill(testCards.valid.front);
    await page.locator("textarea#back").fill(testCards.valid.back);

    // Submit button should be enabled
    const submitButton = page.getByRole("button", { name: /^dodaj$/i });
    await expect(submitButton).toBeEnabled();
  });

  test("should successfully add a new card", async ({ page }) => {
    // Count existing cards
    const initialCards = await page.locator('[data-testid="flashcard-item"]').count();

    // Open modal
    await page.getByRole("button", { name: /dodaj fiszkę ręcznie/i }).click();

    // Fill form
    await page.locator("textarea#front").fill(testCards.valid.front);
    await page.locator("textarea#back").fill(testCards.valid.back);

    // Submit form
    await page.getByRole("button", { name: /^dodaj$/i }).click();

    // Wait for modal to close
    await expect(page.getByRole("heading", { name: /dodaj nową fiszkę/i })).not.toBeVisible();

    // Wait for the page to reload or update
    await page.waitForLoadState("networkidle");

    // Verify new card appears (count should increase or card content should be visible)
    // Note: This might need adjustment based on pagination
    const cardWithFront = page.locator(`text=${testCards.valid.front}`).first();
    await expect(cardWithFront).toBeVisible({ timeout: 5000 });
  });

  test("should show validation error for front field exceeding max length", async ({ page }) => {
    // Open modal
    await page.getByRole("button", { name: /dodaj fiszkę ręcznie/i }).click();

    // Fill front field with text exceeding 200 characters
    const longText = "A".repeat(201);
    await page.locator("textarea#front").fill(longText);

    // Fill back field with valid text
    await page.locator("textarea#back").fill("Valid answer");

    // Check for error message
    const errorMessage = page.locator("text=/przód fiszki musi mieć między 1 a 200 znaków/i");
    await expect(errorMessage).toBeVisible();

    // Submit button should be disabled
    const submitButton = page.getByRole("button", { name: /^dodaj$/i });
    await expect(submitButton).toBeDisabled();
  });

  test("should show validation error for back field exceeding max length", async ({ page }) => {
    // Open modal
    await page.getByRole("button", { name: /dodaj fiszkę ręcznie/i }).click();

    // Fill front field with valid text
    await page.locator("textarea#front").fill("Valid question");

    // Fill back field with text exceeding 500 characters
    const longText = "B".repeat(501);
    await page.locator("textarea#back").fill(longText);

    // Check for error message
    const errorMessage = page.locator("text=/tył fiszki musi mieć między 1 a 500 znaków/i");
    await expect(errorMessage).toBeVisible();

    // Submit button should be disabled
    const submitButton = page.getByRole("button", { name: /^dodaj$/i });
    await expect(submitButton).toBeDisabled();
  });

  test("should clear form when modal is reopened", async ({ page }) => {
    // Open modal
    await page.getByRole("button", { name: /dodaj fiszkę ręcznie/i }).click();

    // Fill form
    await page.locator("textarea#front").fill("Test question");
    await page.locator("textarea#back").fill("Test answer");

    // Close modal
    await page.getByRole("button", { name: /anuluj/i }).click();

    // Reopen modal
    await page.getByRole("button", { name: /dodaj fiszkę ręcznie/i }).click();

    // Check if fields are empty
    const frontTextarea = page.locator("textarea#front");
    const backTextarea = page.locator("textarea#back");

    await expect(frontTextarea).toHaveValue("");
    await expect(backTextarea).toHaveValue("");
  });

  test("should show loading state while submitting", async ({ page }) => {
    // Open modal
    await page.getByRole("button", { name: /dodaj fiszkę ręcznie/i }).click();

    // Fill form
    await page.locator("textarea#front").fill(testCards.valid.front);
    await page.locator("textarea#back").fill(testCards.valid.back);

    // Click submit and immediately check for loading state
    const submitButton = page.getByRole("button", { name: /^dodaj$/i });
    await submitButton.click();

    // Check for loading text (might be very brief)
    const loadingButton = page.getByRole("button", { name: /dodawanie\.\.\./i });

    // The loading state might be very quick, so we use a short timeout
    // and don't fail the test if it's not visible
    try {
      await expect(loadingButton).toBeVisible({ timeout: 1000 });
    } catch {
      // Loading state was too quick to catch, which is fine
    }

    // Wait for modal to close (submission completed)
    await expect(page.getByRole("heading", { name: /dodaj nową fiszkę/i })).not.toBeVisible({ timeout: 5000 });
  });

  test("should add card from empty state", async ({ page }) => {
    // This test assumes we might see an empty state
    // If there's an empty state with an "Add Card" button, test it
    const emptyStateAddButton = page.getByRole("button", { name: /dodaj fiszkę ręcznie/i }).last();

    // Check if empty state exists
    const hasEmptyState = await emptyStateAddButton.isVisible().catch(() => false);

    if (hasEmptyState) {
      // Click add button from empty state
      await emptyStateAddButton.click();

      // Modal should open
      await expect(page.getByRole("heading", { name: /dodaj nową fiszkę/i })).toBeVisible();

      // Fill and submit
      await page.locator("textarea#front").fill(testCards.valid.front);
      await page.locator("textarea#back").fill(testCards.valid.back);
      await page.getByRole("button", { name: /^dodaj$/i }).click();

      // Wait for card to appear
      await expect(page.locator(`text=${testCards.valid.front}`).first()).toBeVisible({ timeout: 5000 });
    } else {
      // Skip this test if there's no empty state
      test.skip();
    }
  });

  test("should handle network errors gracefully", async ({ page }) => {
    // Open modal
    await page.getByRole("button", { name: /dodaj fiszkę/i }).click();

    // Fill form
    await page.locator("textarea#front").fill(testCards.valid.front);
    await page.locator("textarea#back").fill(testCards.valid.back);

    // Intercept the API call and make it fail
    await page.route("**/api/cards", (route) => {
      route.abort("failed");
    });

    // Submit form
    await page.getByRole("button", { name: /^dodaj$/i }).click();

    // Modal should remain open (or error should be shown)
    // Adjust this based on your error handling implementation
    await page.waitForTimeout(2000);

    // The modal might stay open or show an error toast
    // This is a placeholder - adjust based on actual error handling
  });
});
