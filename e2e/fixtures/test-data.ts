/**
 * Test data for E2E tests
 */

export const testUsers = {
  valid: {
    email: process.env.E2E_TEST_USER_EMAIL || "",
    password: process.env.E2E_TEST_USER_PASSWORD || "",
  },
  invalid: {
    email: "invalid@example.com",
    password: "wrongpassword",
  },
};

export const testCards = {
  valid: {
    front: "What is React?",
    back: "A JavaScript library for building user interfaces",
    difficulty: "medium" as const,
  },
  longContent: {
    front: "A".repeat(500),
    back: "B".repeat(1000),
    difficulty: "hard" as const,
  },
};

export const testGenerationPrompts = {
  valid: "Generate flashcards about JavaScript basics",
  short: "JS",
  long: "A".repeat(1000),
};
