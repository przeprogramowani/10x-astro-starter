# E2E Tests

This directory contains end-to-end tests using Playwright.

## Structure

- `fixtures/` - Custom Playwright fixtures and test data
- `utils/` - Utility functions for tests (e.g., authentication helpers)
- `*.spec.ts` - Test files
- `global-teardown.ts` - Global teardown script for database cleanup

## Database Cleanup

The `global-teardown.ts` script runs automatically after all E2E tests complete. It cleans up test data from the following Supabase tables:

1. **events** - Deleted first (has foreign key to cards)
2. **cards** - Deleted second
3. **generation_requests** - Deleted third

The teardown uses the Supabase service role key to bypass Row Level Security (RLS) policies and ensure all test data is removed regardless of user permissions.

### Environment Variables Required

The teardown script requires the following environment variables in `.env.test`:

- `PUBLIC_SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key with admin privileges

### Running Tests

```bash
# Run all E2E tests (teardown runs automatically after)
npm run test:e2e

# Run with UI mode
npm run test:e2e:ui

# Run in debug mode
npm run test:e2e:debug

# View test report
npm run test:e2e:report
```

## Writing Tests

When writing new E2E tests:

1. Use the custom fixtures from `./fixtures/index.ts`
2. Use test data from `./fixtures/test-data.ts`
3. Use authentication helpers from `./utils/auth.ts`
4. Don't worry about cleanup - the global teardown handles it automatically

Example:

```typescript
import { test, expect } from "./fixtures";
import { login } from "./utils/auth";
import { testUsers } from "./fixtures/test-data";

test.describe("My Feature", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, testUsers.valid.email, testUsers.valid.password);
  });

  test("should do something", async ({ page }) => {
    // Your test code here
  });
});
```
