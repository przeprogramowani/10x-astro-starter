# Testing Guide

This project uses Vitest for unit testing and Playwright for end-to-end (E2E) testing.

## Unit Tests (Vitest)

### Running Unit Tests

```bash
# Run tests in watch mode (recommended for development)
npm test

# Run tests once
npm run test:run

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

### Writing Unit Tests

Unit tests are located next to the files they test with the `.test.ts` or `.test.tsx` extension.

Example test file structure:

```typescript
import { describe, it, expect } from "vitest";
import { render, screen } from "@/test/test-utils";
import { YourComponent } from "./YourComponent";

describe("YourComponent", () => {
  it("should render correctly", () => {
    render(<YourComponent />);
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });
});
```

### Test Utilities

- **Test Utils**: Located in `src/test/test-utils.tsx` - provides custom render function with providers
- **Setup File**: Located in `src/test/setup.ts` - configures testing environment and global mocks

### Best Practices

- Use descriptive test names that explain what is being tested
- Follow the Arrange-Act-Assert pattern
- Use `screen` queries from Testing Library for better accessibility
- Mock external dependencies using `vi.mock()`
- Use `userEvent` for simulating user interactions

## E2E Tests (Playwright)

### Running E2E Tests

```bash
# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run E2E tests in debug mode
npm run test:e2e:debug

# Show test report
npm run test:e2e:report
```

### Writing E2E Tests

E2E tests are located in the `e2e/` directory with the `.spec.ts` extension.

Example E2E test:

```typescript
import { test, expect } from "./fixtures";

test.describe("Feature Name", () => {
  test("should perform action", async ({ page }) => {
    await page.goto("/");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL("/success");
  });
});
```

### Test Utilities

- **Auth Helpers**: Located in `e2e/utils/auth.ts` - provides login, logout, and register helpers
- **Test Data**: Located in `e2e/fixtures/test-data.ts` - contains test data for E2E tests
- **Custom Fixtures**: Located in `e2e/fixtures/index.ts` - provides custom Playwright fixtures

### Best Practices

- Use Page Object Model for complex pages
- Use data-testid attributes for stable selectors
- Wait for navigation and network requests to complete
- Use fixtures for common setup/teardown
- Keep tests independent and isolated

## Configuration

### Vitest Configuration

Configuration file: `vitest.config.ts`

Key settings:
- Environment: `happy-dom` (lightweight DOM implementation)
- Globals: `true` (no need to import test functions)
- Coverage: `v8` provider with HTML/JSON/text reporters

### Playwright Configuration

Configuration file: `playwright.config.ts`

Key settings:
- Test directory: `e2e/`
- Browser: Chromium (Desktop Chrome)
- Base URL: `http://localhost:3000`
- Automatic dev server startup

## CI/CD Integration

Both test suites are configured to run in CI environments:

- Vitest runs with `npm run test:run`
- Playwright runs with `npm run test:e2e`

The Playwright configuration automatically:
- Retries failed tests 2 times in CI
- Runs tests sequentially in CI
- Starts the dev server before running tests

## Troubleshooting

### Unit Tests

**Issue**: Tests fail with module resolution errors
**Solution**: Check that path aliases in `vitest.config.ts` match `tsconfig.json`

**Issue**: Tests timeout
**Solution**: Increase timeout in test file or config

### E2E Tests

**Issue**: Browser not found
**Solution**: Run `npx playwright install chromium`

**Issue**: Tests fail in CI but pass locally
**Solution**: Check that the base URL is correct and the server is running

**Issue**: Flaky tests
**Solution**: Add proper waits and use stable selectors

## Examples

Example tests are provided in:
- `src/lib/utils.test.ts` - Simple utility function tests
- `src/components/ui/button.test.tsx` - React component tests
- `e2e/home.spec.ts` - Basic page navigation tests
- `e2e/login.spec.ts` - Form interaction tests

## Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Documentation](https://testing-library.com/)
- [Playwright Documentation](https://playwright.dev/)
