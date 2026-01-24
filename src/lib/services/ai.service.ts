import { OpenRouterService } from "./openrouter.service";
import type { SuggestedCardDTO } from "../../types";

/**
 * AI Service for generating flashcards using OpenRouter.ai
 * Handles integration with LLM API for card generation
 */

// Initialize OpenRouter service with configuration from environment
const openRouterService = new OpenRouterService({
  apiKey: import.meta.env.OPENROUTER_API_KEY,
  defaultModel: "meta-llama/llama-3.3-70b-instruct:free",
  timeout: 60000,
});

/**
 * Generates flashcards from input text using OpenRouter.ai API
 * @param inputText - Text to generate flashcards from (1000-10000 characters)
 * @returns Array of 5-10 suggested flashcards
 * @throws OpenRouterError variants if API call fails, times out, or returns invalid response
 */
export async function generateFlashcards(inputText: string): Promise<SuggestedCardDTO[]> {
  return await openRouterService.generateFlashcards(inputText, {
    minCards: 5,
    maxCards: 10,
    temperature: 0.7,
  });
}
