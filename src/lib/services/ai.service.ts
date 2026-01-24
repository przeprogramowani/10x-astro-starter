import type { SuggestedCardDTO } from "../../types";

/**
 * AI Service for generating flashcards using OpenRouter.ai
 * Handles integration with LLM API for card generation
 */

// TODO: Uncomment when implementing real OpenRouter.ai integration
// interface OpenRouterMessage {
//   role: "system" | "user" | "assistant";
//   content: string;
// }

// interface OpenRouterRequest {
//   model: string;
//   messages: OpenRouterMessage[];
// }

// interface OpenRouterResponse {
//   choices: {
//     message: {
//       content: string;
//     };
//   }[];
// }

// const SYSTEM_PROMPT = `You are a helpful assistant that creates high-quality flashcards from educational text.
//
// Your task is to generate 5-10 flashcards (question-answer pairs) from the provided text.
//
// Requirements:
// - Each flashcard should have a "front" (question/prompt) and "back" (answer)
// - Front: 1-200 characters
// - Back: 1-500 characters
// - Questions should be clear, specific, and test understanding
// - Answers should be concise but complete
// - Generate 5-10 flashcards (aim for quality over quantity)
// - Focus on key concepts, definitions, and important facts
//
// Return ONLY a valid JSON array with this exact structure:
// [
//   {
//     "front": "Question or prompt here",
//     "back": "Answer here"
//   }
// ]
//
// Do not include any text before or after the JSON array.`;

// function isValidCard(card: unknown): card is SuggestedCardDTO {
//   if (!card || typeof card !== "object") {
//     return false;
//   }
//
//   const c = card as Record<string, unknown>;
//
//   if (typeof c.front !== "string" || typeof c.back !== "string") {
//     return false;
//   }
//
//   // Validate length constraints
//   const frontLength = c.front.length;
//   const backLength = c.back.length;
//
//   if (frontLength < 1 || frontLength > 200) {
//     return false;
//   }
//
//   if (backLength < 1 || backLength > 500) {
//     return false;
//   }
//
//   return true;
// }

// function parseLLMResponse(responseText: string): SuggestedCardDTO[] {
//   try {
//     // Try to parse JSON
//     const parsed = JSON.parse(responseText);
//
//     // Ensure it's an array
//     if (!Array.isArray(parsed)) {
//       throw new Error("LLM response is not an array");
//     }
//
//     // Filter and validate cards
//     const validCards = parsed.filter(isValidCard);
//
//     if (validCards.length === 0) {
//       throw new Error("No valid cards in LLM response");
//     }
//
//     return validCards;
//   } catch (error) {
//     if (error instanceof SyntaxError) {
//       throw new Error("Failed to parse LLM response as JSON");
//     }
//     throw error;
//   }
// }

/**
 * Generates flashcards from input text using OpenRouter.ai API
 * @param _inputText - Text to generate flashcards from (1000-10000 characters)
 * @returns Array of 5-10 suggested flashcards
 * @throws Error if API call fails, times out, or returns invalid response
 *
 * NOTE: Currently mocked for development. Real OpenRouter.ai integration to be implemented later.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function generateFlashcards(_inputText: string): Promise<SuggestedCardDTO[]> {
  // MOCK: Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // MOCK: Return sample flashcards for testing
  const mockCards: SuggestedCardDTO[] = [
    {
      front: "What is the main topic of the provided text?",
      back: "The text discusses key concepts and information related to the subject matter.",
    },
    {
      front: "What are the key takeaways from this content?",
      back: "The main points include important definitions, processes, and relationships between concepts.",
    },
    {
      front: "How does this concept work?",
      back: "It functions through a series of steps and interactions that achieve the desired outcome.",
    },
    {
      front: "Why is this information important?",
      back: "Understanding this helps build foundational knowledge and enables practical application.",
    },
    {
      front: "What are the practical applications?",
      back: "This knowledge can be applied in real-world scenarios to solve problems and improve outcomes.",
    },
  ];

  return mockCards;

  /* TODO: Implement real OpenRouter.ai integration
  const apiKey = import.meta.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY environment variable is not set");
  }

  // Prepare request
  const requestBody: OpenRouterRequest = {
    model: "anthropic/claude-3-haiku",
    messages: [
      {
        role: "system",
        content: SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: inputText,
      },
    ],
  };

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

  try {
    // Make API request
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Check response status
    if (!response.ok) {
      throw new Error(`OpenRouter API returned status ${response.status}`);
    }

    // Parse response
    const data: OpenRouterResponse = await response.json();

    // Extract content from response
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("Invalid response structure from OpenRouter API");
    }

    // Parse and validate flashcards
    const suggestedCards = parseLLMResponse(content);

    return suggestedCards;
  } catch (error) {
    clearTimeout(timeoutId);

    // Handle abort (timeout)
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("OpenRouter API request timed out");
    }

    // Re-throw other errors
    throw error;
  }
  */
}
