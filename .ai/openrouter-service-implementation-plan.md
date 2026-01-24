# Plan Implementacji OpenRouter Service

## 1. Opis Usługi

OpenRouter Service to warstwa abstrakcji odpowiedzialna za komunikację z API OpenRouter.ai w celu generowania fiszek przy użyciu modeli językowych (LLM). Usługa enkapsuluje całą logikę związaną z:

- Konstruowaniem żądań API z odpowiednim formatem wiadomości
- Zarządzaniem konfiguracją modeli i parametrów
- Obsługą strukturyzowanych odpowiedzi poprzez JSON Schema
- Walidacją odpowiedzi przy użyciu Zod
- Obsługą błędów i timeout'ów
- Zapewnieniem bezpieczeństwa kluczy API

**Lokalizacja:** `src/lib/services/openrouter.service.ts`

**Główne Cechy:**
- Typ-bezpieczna komunikacja z API
- Automatyczna walidacja odpowiedzi
- Obsługa timeout'ów i retry
- Szczegółowa obsługa błędów
- Wsparcie dla różnych modeli LLM

---

## 2. Opis Konstruktora

Konstruktor klasy `OpenRouterService` jest odpowiedzialny za inicjalizację usługi z odpowiednią konfiguracją.

### Parametry Konstruktora

```typescript
interface OpenRouterConfig {
  apiKey: string;
  defaultModel?: string;
  timeout?: number;
  baseUrl?: string;
}
```

### Przykład Użycia

```typescript
const openRouterService = new OpenRouterService({
  apiKey: import.meta.env.OPENROUTER_API_KEY,
  defaultModel: "anthropic/claude-3-haiku",
  timeout: 60000, // 60 sekund
  baseUrl: "https://openrouter.ai/api/v1"
});
```

### Walidacja w Konstruktorze

Konstruktor powinien:
1. Walidować obecność i format API key
2. Sprawdzić dostępność modelu
3. Ustawić wartości domyślne dla opcjonalnych parametrów
4. Rzucić szczegółowy błąd jeśli konfiguracja jest nieprawidłowa

---

## 3. Publiczne Metody i Pola

### 3.1 Metoda: `generateFlashcards()`

**Cel:** Generowanie fiszek z tekstu wejściowego przy użyciu LLM.

**Sygnatura:**
```typescript
async generateFlashcards(
  inputText: string,
  options?: GenerateFlashcardsOptions
): Promise<SuggestedCardDTO[]>
```

**Parametry:**
- `inputText`: Tekst źródłowy do wygenerowania fiszek (1000-10000 znaków)
- `options`: Opcjonalna konfiguracja nadpisująca ustawienia domyślne

**Typ Options:**
```typescript
interface GenerateFlashcardsOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  minCards?: number;
  maxCards?: number;
}
```

**Zwraca:** Tablicę `SuggestedCardDTO[]` (5-10 fiszek)

**Rzuca:**
- `OpenRouterAPIError` - błędy API (401, 404, 500)
- `OpenRouterTimeoutError` - timeout żądania
- `OpenRouterValidationError` - odpowiedź nie pasuje do schematu
- `OpenRouterRateLimitError` - przekroczony limit zapytań

**Przykład:**
```typescript
try {
  const cards = await openRouterService.generateFlashcards(
    "The Krebs cycle is a series of chemical reactions...",
    {
      temperature: 0.7,
      minCards: 5,
      maxCards: 10
    }
  );
  console.log(`Generated ${cards.length} flashcards`);
} catch (error) {
  if (error instanceof OpenRouterRateLimitError) {
    console.error(`Rate limited. Retry after ${error.retryAfter}s`);
  }
}
```

### 3.2 Metoda: `generateCompletion()`

**Cel:** Ogólna metoda do wykonywania zapytań z dowolnym promptem i schematem.

**Sygnatura:**
```typescript
async generateCompletion<T>(
  config: CompletionConfig<T>
): Promise<T>
```

**Parametry:**
```typescript
interface CompletionConfig<T> {
  systemPrompt: string;
  userPrompt: string;
  model?: string;
  responseSchema: z.ZodSchema<T>;
  responseSchemaName: string;
  parameters?: ModelParameters;
}

interface ModelParameters {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}
```

**Zwraca:** Sparsowaną i zwalidowaną odpowiedź typu `T`

**Przykład:**
```typescript
const SummarySchema = z.object({
  summary: z.string(),
  keyPoints: z.array(z.string())
});

const result = await openRouterService.generateCompletion({
  systemPrompt: "You are a text summarization expert.",
  userPrompt: "Summarize the following: ...",
  responseSchema: SummarySchema,
  responseSchemaName: "text_summary",
  parameters: { temperature: 0.3 }
});
```

### 3.3 Publiczne Pole: `supportedModels`

**Typ:** `readonly string[]`

**Cel:** Lista wspieranych modeli LLM

**Przykład:**
```typescript
const models = openRouterService.supportedModels;
// ["anthropic/claude-3-haiku", "anthropic/claude-3-sonnet", "openai/gpt-4o-mini", ...]
```

---

## 4. Prywatne Metody i Pola

### 4.1 Prywatne Pole: `config`

```typescript
private readonly config: Required<OpenRouterConfig>;
```

Przechowuje pełną konfigurację usługi ze wszystkimi wartościami domyślnymi.

### 4.2 Metoda: `buildRequest()`

**Cel:** Konstruowanie obiektu żądania API

**Sygnatura:**
```typescript
private buildRequest<T>(
  systemPrompt: string,
  userPrompt: string,
  responseSchema: z.ZodSchema<T>,
  schemaName: string,
  model: string,
  parameters: ModelParameters
): OpenRouterRequest
```

**Struktura Żądania:**
```typescript
interface OpenRouterRequest {
  model: string;
  messages: Message[];
  response_format: ResponseFormat;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ResponseFormat {
  type: "json_schema";
  json_schema: {
    name: string;
    strict: true;
    schema: JSONSchema;
  };
}
```

**Szczegóły Implementacji:**

1. **Budowanie Messages:**
```typescript
const messages: Message[] = [
  {
    role: "system",
    content: systemPrompt
  },
  {
    role: "user",
    content: userPrompt
  }
];
```

2. **Budowanie Response Format:**
```typescript
const responseFormat: ResponseFormat = {
  type: "json_schema",
  json_schema: {
    name: schemaName, // np. "flashcard_generation"
    strict: true,
    schema: this.zodToJsonSchema(responseSchema)
  }
};
```

3. **Pełne Żądanie:**
```typescript
const request: OpenRouterRequest = {
  model,
  messages,
  response_format: responseFormat,
  temperature: parameters.temperature ?? 0.7,
  max_tokens: parameters.maxTokens ?? 2000,
  top_p: parameters.topP ?? 1.0,
  frequency_penalty: parameters.frequencyPenalty ?? 0,
  presence_penalty: parameters.presencePenalty ?? 0
};
```

### 4.3 Metoda: `zodToJsonSchema()`

**Cel:** Konwersja schematu Zod do formatu JSON Schema zgodnego z OpenRouter

**Sygnatura:**
```typescript
private zodToJsonSchema<T>(schema: z.ZodSchema<T>): JSONSchema
```

**Przykład Konwersji:**

**Input (Zod):**
```typescript
const FlashcardSchema = z.object({
  cards: z.array(
    z.object({
      front: z.string().min(1).max(200),
      back: z.string().min(1).max(500)
    })
  ).min(5).max(10)
});
```

**Output (JSON Schema):**
```typescript
{
  type: "object",
  properties: {
    cards: {
      type: "array",
      minItems: 5,
      maxItems: 10,
      items: {
        type: "object",
        properties: {
          front: {
            type: "string",
            minLength: 1,
            maxLength: 200
          },
          back: {
            type: "string",
            minLength: 1,
            maxLength: 500
          }
        },
        required: ["front", "back"],
        additionalProperties: false
      }
    }
  },
  required: ["cards"],
  additionalProperties: false
}
```

**Implementacja:** Użyj biblioteki `zod-to-json-schema` do automatycznej konwersji.

### 4.4 Metoda: `executeRequest()`

**Cel:** Wykonanie HTTP żądania do API z obsługą timeout

**Sygnatura:**
```typescript
private async executeRequest(
  request: OpenRouterRequest
): Promise<OpenRouterResponse>
```

**Implementacja z AbortController:**
```typescript
private async executeRequest(request: OpenRouterRequest): Promise<OpenRouterResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

  try {
    const response = await fetch(
      `${this.config.baseUrl}/chat/completions`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.config.apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://10x-cards.app", // Opcjonalne
          "X-Title": "10x Cards" // Opcjonalne
        },
        body: JSON.stringify(request),
        signal: controller.signal
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      await this.handleErrorResponse(response);
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error && error.name === "AbortError") {
      throw new OpenRouterTimeoutError(
        `Request timed out after ${this.config.timeout}ms`
      );
    }
    
    throw error;
  }
}
```

### 4.5 Metoda: `parseResponse()`

**Cel:** Ekstrakcja i walidacja contentu z odpowiedzi API

**Sygnatura:**
```typescript
private parseResponse<T>(
  response: OpenRouterResponse,
  schema: z.ZodSchema<T>
): T
```

**Implementacja:**
```typescript
private parseResponse<T>(
  response: OpenRouterResponse,
  schema: z.ZodSchema<T>
): T {
  // 1. Sprawdź strukturę odpowiedzi
  if (!response.choices || response.choices.length === 0) {
    throw new OpenRouterValidationError(
      "Invalid response structure: missing choices"
    );
  }

  // 2. Wydobądź content
  const content = response.choices[0].message?.content;
  if (!content) {
    throw new OpenRouterValidationError(
      "Invalid response structure: missing content"
    );
  }

  // 3. Parsuj JSON
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch (error) {
    throw new OpenRouterValidationError(
      "Failed to parse response as JSON",
      { cause: error }
    );
  }

  // 4. Waliduj schema
  const result = schema.safeParse(parsed);
  if (!result.success) {
    throw new OpenRouterValidationError(
      "Response validation failed",
      { zodError: result.error }
    );
  }

  return result.data;
}
```

### 4.6 Metoda: `handleErrorResponse()`

**Cel:** Przetwarzanie błędów HTTP z API

**Sygnatura:**
```typescript
private async handleErrorResponse(response: Response): Promise<never>
```

**Implementacja:**
```typescript
private async handleErrorResponse(response: Response): Promise<never> {
  const status = response.status;
  let errorBody: any;
  
  try {
    errorBody = await response.json();
  } catch {
    errorBody = { error: await response.text() };
  }

  switch (status) {
    case 401:
      throw new OpenRouterAPIError(
        "Invalid API key",
        status,
        errorBody
      );
    
    case 404:
      throw new OpenRouterAPIError(
        "Model not found or not available",
        status,
        errorBody
      );
    
    case 429:
      const retryAfter = response.headers.get("Retry-After");
      throw new OpenRouterRateLimitError(
        "Rate limit exceeded",
        parseInt(retryAfter || "60", 10),
        errorBody
      );
    
    case 500:
    case 502:
    case 503:
      throw new OpenRouterAPIError(
        "OpenRouter service error",
        status,
        errorBody
      );
    
    default:
      throw new OpenRouterAPIError(
        `API request failed with status ${status}`,
        status,
        errorBody
      );
  }
}
```

### 4.7 Metoda: `getFlashcardSystemPrompt()`

**Cel:** Generowanie system prompt dla fiszek

**Sygnatura:**
```typescript
private getFlashcardSystemPrompt(minCards: number, maxCards: number): string
```

**Przykład:**
```typescript
private getFlashcardSystemPrompt(minCards: number, maxCards: number): string {
  return `You are an expert educational content creator specializing in flashcard generation.

Your task is to analyze the provided text and create ${minCards}-${maxCards} high-quality flashcards.

Requirements:
- Each flashcard must have a "front" (question/prompt) and "back" (answer)
- Front: 1-200 characters - should be clear, specific questions or prompts
- Back: 1-500 characters - should be concise but complete answers
- Focus on key concepts, definitions, processes, and important facts
- Questions should test understanding, not just memorization
- Avoid ambiguous or trick questions
- Prioritize quality over quantity

Format your response as a JSON object with a "cards" array containing the flashcards.`;
}
```

---

## 5. Obsługa Błędów

### 5.1 Hierarchia Błędów

Stwórz dedykowane klasy błędów dla różnych scenariuszy:

```typescript
// Bazowa klasa dla wszystkich błędów OpenRouter
export class OpenRouterError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "OpenRouterError";
  }
}

// Błędy API (4xx, 5xx)
export class OpenRouterAPIError extends OpenRouterError {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body?: unknown
  ) {
    super(message);
    this.name = "OpenRouterAPIError";
  }
}

// Błąd Rate Limit (429)
export class OpenRouterRateLimitError extends OpenRouterAPIError {
  constructor(
    message: string,
    public readonly retryAfter: number,
    body?: unknown
  ) {
    super(message, 429, body);
    this.name = "OpenRouterRateLimitError";
  }
}

// Błąd Timeout
export class OpenRouterTimeoutError extends OpenRouterError {
  constructor(message: string) {
    super(message);
    this.name = "OpenRouterTimeoutError";
  }
}

// Błąd Walidacji
export class OpenRouterValidationError extends OpenRouterError {
  constructor(
    message: string,
    public readonly details?: { zodError?: z.ZodError; cause?: unknown }
  ) {
    super(message);
    this.name = "OpenRouterValidationError";
  }
}

// Błąd Konfiguracji
export class OpenRouterConfigError extends OpenRouterError {
  constructor(message: string) {
    super(message);
    this.name = "OpenRouterConfigError";
  }
}
```

### 5.2 Scenariusze Błędów

| Typ Błędu | Przyczyna | Obsługa |
|-----------|-----------|---------|
| `OpenRouterConfigError` | Brak lub nieprawidłowy API key | Rzuć błąd w konstruktorze |
| `OpenRouterTimeoutError` | Żądanie przekroczyło timeout | Pozwól klientowi spróbować ponownie |
| `OpenRouterRateLimitError` | Przekroczony limit API | Zwróć `retryAfter` klientowi |
| `OpenRouterAPIError` (401) | Nieprawidłowy API key | Loguj i zwróć błąd użytkownikowi |
| `OpenRouterAPIError` (404) | Model niedostępny | Zasugeruj alternatywny model |
| `OpenRouterAPIError` (500+) | Błąd serwera | Implementuj retry z exponential backoff |
| `OpenRouterValidationError` | Odpowiedź nie pasuje do schematu | Loguj szczegóły i zwróć błąd ogólny |
| `NetworkError` | Brak połączenia | Informuj o problemach z siecią |

### 5.3 Implementacja Retry Logic

```typescript
private async executeRequestWithRetry(
  request: OpenRouterRequest,
  maxRetries: number = 3
): Promise<OpenRouterResponse> {
  let lastError: Error;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await this.executeRequest(request);
    } catch (error) {
      lastError = error as Error;
      
      // Nie retry dla błędów klienta (4xx oprócz 429)
      if (error instanceof OpenRouterAPIError) {
        if (error.status >= 400 && error.status < 500 && error.status !== 429) {
          throw error;
        }
      }
      
      // Nie retry dla błędów walidacji
      if (error instanceof OpenRouterValidationError) {
        throw error;
      }
      
      // Czekaj przed kolejną próbą (exponential backoff)
      if (attempt < maxRetries - 1) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError!;
}
```

---

## 6. Kwestie Bezpieczeństwa

### 6.1 Ochrona API Key

**Zasady:**
1. ✅ Przechowuj API key tylko w zmiennych środowiskowych
2. ✅ Nigdy nie eksponuj API key w client-side code
3. ✅ Używaj service tylko w API routes (server-side)
4. ✅ Waliduj API key w konstruktorze
5. ❌ Nigdy nie loguj API key

**Implementacja:**
```typescript
constructor(config: OpenRouterConfig) {
  // Waliduj API key
  if (!config.apiKey || typeof config.apiKey !== "string") {
    throw new OpenRouterConfigError("API key is required and must be a string");
  }
  
  if (config.apiKey.length < 20) {
    throw new OpenRouterConfigError("API key appears to be invalid");
  }
  
  // Nigdy nie loguj całego config
  console.log("OpenRouter service initialized with model:", config.defaultModel);
}
```

### 6.2 Input Sanitization

**Walidacja Input Text:**
```typescript
private validateInputText(text: string): void {
  if (typeof text !== "string") {
    throw new OpenRouterValidationError("Input text must be a string");
  }
  
  if (text.length < 1000) {
    throw new OpenRouterValidationError(
      "Input text too short (minimum 1000 characters)"
    );
  }
  
  if (text.length > 10000) {
    throw new OpenRouterValidationError(
      "Input text too long (maximum 10000 characters)"
    );
  }
  
  // Opcjonalnie: sprawdź czy tekst nie zawiera złośliwych injection
  if (this.containsMaliciousContent(text)) {
    throw new OpenRouterValidationError("Input text contains invalid content");
  }
}
```

### 6.3 Rate Limiting (Client-Side Protection)

```typescript
private requestTimestamps: number[] = [];
private readonly maxRequestsPerMinute = 10;

private checkRateLimit(): void {
  const now = Date.now();
  const oneMinuteAgo = now - 60000;
  
  // Usuń stare timestampy
  this.requestTimestamps = this.requestTimestamps.filter(
    ts => ts > oneMinuteAgo
  );
  
  if (this.requestTimestamps.length >= this.maxRequestsPerMinute) {
    throw new OpenRouterRateLimitError(
      "Client-side rate limit exceeded",
      60
    );
  }
  
  this.requestTimestamps.push(now);
}
```

### 6.4 Timeout Protection

Zawsze używaj timeout aby zapobiec wiszącym requestom:

```typescript
const DEFAULT_TIMEOUT = 60000; // 60 sekund
const MAX_TIMEOUT = 120000; // 2 minuty

constructor(config: OpenRouterConfig) {
  this.config = {
    ...config,
    timeout: Math.min(
      config.timeout ?? DEFAULT_TIMEOUT,
      MAX_TIMEOUT
    )
  };
}
```

---

## 7. Plan Wdrożenia Krok po Kroku

### Krok 1: Setup Projektu i Zależności

**Akcje:**
1. Zainstaluj wymagane pakiety:
```bash
npm install zod-to-json-schema
```

2. Dodaj zmienne środowiskowe do `.env`:
```env
OPENROUTER_API_KEY=sk-or-v1-...
```

3. Zaktualizuj `src/env.d.ts`:
```typescript
interface ImportMetaEnv {
  readonly OPENROUTER_API_KEY: string;
  // ... other env vars
}
```

**Weryfikacja:** Sprawdź czy pakiety są zainstalowane i env vars dostępne.

---

### Krok 2: Definiowanie Typów i Interfejsów

**Plik:** `src/lib/services/openrouter.types.ts`

**Akcje:**
1. Zdefiniuj typy dla requestów OpenRouter:
```typescript
export interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface OpenRouterResponseFormat {
  type: "json_schema";
  json_schema: {
    name: string;
    strict: true;
    schema: Record<string, unknown>;
  };
}

export interface OpenRouterRequest {
  model: string;
  messages: OpenRouterMessage[];
  response_format?: OpenRouterResponseFormat;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

export interface OpenRouterResponse {
  id: string;
  model: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}
```

2. Zdefiniuj typy konfiguracji:
```typescript
export interface OpenRouterConfig {
  apiKey: string;
  defaultModel?: string;
  timeout?: number;
  baseUrl?: string;
}

export interface ModelParameters {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

export interface CompletionConfig<T> {
  systemPrompt: string;
  userPrompt: string;
  model?: string;
  responseSchema: z.ZodSchema<T>;
  responseSchemaName: string;
  parameters?: ModelParameters;
}

export interface GenerateFlashcardsOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  minCards?: number;
  maxCards?: number;
}
```

**Weryfikacja:** TypeScript powinien kompilować się bez błędów.

---

### Krok 3: Implementacja Klas Błędów

**Plik:** `src/lib/services/openrouter.errors.ts`

**Akcje:**
1. Stwórz hierarchię klas błędów zgodnie z sekcją 5.1
2. Wyeksportuj wszystkie klasy błędów
3. Dodaj helper functions dla formatowania błędów:

```typescript
export function formatZodError(error: z.ZodError): string {
  return error.errors
    .map(e => `${e.path.join(".")}: ${e.message}`)
    .join(", ");
}

export function isRetriableError(error: unknown): boolean {
  if (error instanceof OpenRouterAPIError) {
    return error.status >= 500 || error.status === 429;
  }
  if (error instanceof OpenRouterTimeoutError) {
    return true;
  }
  return false;
}
```

**Weryfikacja:** Sprawdź czy błędy można instancjonować i czy dziedziczą prawidłowo.

---

### Krok 4: Implementacja Schematów Zod

**Plik:** `src/lib/schemas/openrouter.schema.ts`

**Akcje:**
1. Zdefiniuj schemat dla fiszek:
```typescript
import { z } from "zod";

export const FlashcardItemSchema = z.object({
  front: z
    .string({
      required_error: "Front is required",
      invalid_type_error: "Front must be a string",
    })
    .min(1, "Front must be at least 1 character")
    .max(200, "Front must not exceed 200 characters"),
  back: z
    .string({
      required_error: "Back is required",
      invalid_type_error: "Back must be a string",
    })
    .min(1, "Back must be at least 1 character")
    .max(500, "Back must not exceed 500 characters"),
});

export const FlashcardsResponseSchema = z.object({
  cards: z
    .array(FlashcardItemSchema, {
      required_error: "Cards array is required",
      invalid_type_error: "Cards must be an array",
    })
    .min(5, "At least 5 flashcards must be provided")
    .max(10, "Maximum 10 flashcards allowed"),
});

export type FlashcardsResponse = z.infer<typeof FlashcardsResponseSchema>;
```

2. Dodaj schemat konfiguracji:
```typescript
export const OpenRouterConfigSchema = z.object({
  apiKey: z.string().min(20, "API key too short"),
  defaultModel: z.string().optional().default("anthropic/claude-3-haiku"),
  timeout: z.number().int().positive().max(120000).optional().default(60000),
  baseUrl: z.string().url().optional().default("https://openrouter.ai/api/v1"),
});
```

**Weryfikacja:** Testuj schematy z przykładowymi danymi używając `.safeParse()`.

---

### Krok 5: Implementacja OpenRouterService - Część 1 (Struktura i Konstruktor)

**Plik:** `src/lib/services/openrouter.service.ts`

**Akcje:**
1. Stwórz klasę z polami prywatnymi:
```typescript
import { zodToJsonSchema } from "zod-to-json-schema";
import type { z } from "zod";
import type {
  OpenRouterConfig,
  OpenRouterRequest,
  OpenRouterResponse,
  ModelParameters,
  CompletionConfig,
  GenerateFlashcardsOptions,
} from "./openrouter.types";
import {
  OpenRouterError,
  OpenRouterAPIError,
  OpenRouterRateLimitError,
  OpenRouterTimeoutError,
  OpenRouterValidationError,
  OpenRouterConfigError,
} from "./openrouter.errors";
import {
  FlashcardsResponseSchema,
  OpenRouterConfigSchema,
} from "../schemas/openrouter.schema";
import type { SuggestedCardDTO } from "../../types";

export class OpenRouterService {
  private readonly config: Required<OpenRouterConfig>;
  private requestTimestamps: number[] = [];
  private readonly maxRequestsPerMinute = 10;

  public readonly supportedModels = [
    "anthropic/claude-3-haiku",
    "anthropic/claude-3-sonnet",
    "anthropic/claude-3-opus",
    "openai/gpt-4o-mini",
    "openai/gpt-4o",
  ] as const;

  constructor(config: OpenRouterConfig) {
    // Waliduj konfigurację
    const validationResult = OpenRouterConfigSchema.safeParse(config);
    if (!validationResult.success) {
      throw new OpenRouterConfigError(
        `Invalid configuration: ${validationResult.error.message}`
      );
    }

    this.config = validationResult.data as Required<OpenRouterConfig>;

    console.log(
      `OpenRouterService initialized with model: ${this.config.defaultModel}`
    );
  }

  // Metody publiczne i prywatne będą dodane w kolejnych krokach
}
```

**Weryfikacja:** Instancjonuj service z poprawną i niepoprawną konfiguracją.

---

### Krok 6: Implementacja OpenRouterService - Część 2 (Metody Prywatne)

**Akcje:**
1. Implementuj `buildRequest()`:
```typescript
private buildRequest<T>(
  systemPrompt: string,
  userPrompt: string,
  responseSchema: z.ZodSchema<T>,
  schemaName: string,
  model: string,
  parameters: ModelParameters
): OpenRouterRequest {
  const messages: OpenRouterMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];

  const jsonSchema = zodToJsonSchema(responseSchema, {
    name: schemaName,
    $refStrategy: "none",
  });

  return {
    model,
    messages,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: schemaName,
        strict: true,
        schema: jsonSchema as Record<string, unknown>,
      },
    },
    temperature: parameters.temperature ?? 0.7,
    max_tokens: parameters.maxTokens ?? 2000,
    top_p: parameters.topP ?? 1.0,
    frequency_penalty: parameters.frequencyPenalty ?? 0,
    presence_penalty: parameters.presencePenalty ?? 0,
  };
}
```

2. Implementuj `executeRequest()` zgodnie z sekcją 4.4

3. Implementuj `parseResponse()` zgodnie z sekcją 4.5

4. Implementuj `handleErrorResponse()` zgodnie z sekcją 4.6

5. Implementuj `checkRateLimit()` zgodnie z sekcją 6.3

6. Implementuj `getFlashcardSystemPrompt()` zgodnie z sekcją 4.7

7. Implementuj `validateInputText()`:
```typescript
private validateInputText(text: string): void {
  if (typeof text !== "string") {
    throw new OpenRouterValidationError("Input text must be a string");
  }

  const length = text.trim().length;

  if (length < 1000) {
    throw new OpenRouterValidationError(
      `Input text too short (${length}/1000 characters minimum)`
    );
  }

  if (length > 10000) {
    throw new OpenRouterValidationError(
      `Input text too long (${length}/10000 characters maximum)`
    );
  }
}
```

**Weryfikacja:** Sprawdź każdą metodę osobno z unit testami.

---

### Krok 7: Implementacja OpenRouterService - Część 3 (Metody Publiczne)

**Akcje:**
1. Implementuj `generateCompletion()`:
```typescript
async generateCompletion<T>(config: CompletionConfig<T>): Promise<T> {
  this.checkRateLimit();

  const model = config.model ?? this.config.defaultModel;

  const request = this.buildRequest(
    config.systemPrompt,
    config.userPrompt,
    config.responseSchema,
    config.responseSchemaName,
    model,
    config.parameters ?? {}
  );

  const response = await this.executeRequestWithRetry(request);

  return this.parseResponse(response, config.responseSchema);
}
```

2. Implementuj `generateFlashcards()`:
```typescript
async generateFlashcards(
  inputText: string,
  options: GenerateFlashcardsOptions = {}
): Promise<SuggestedCardDTO[]> {
  // Walidacja input
  this.validateInputText(inputText);

  const minCards = options.minCards ?? 5;
  const maxCards = options.maxCards ?? 10;

  if (minCards < 1 || minCards > maxCards || maxCards > 10) {
    throw new OpenRouterValidationError(
      "Invalid card limits: minCards must be 1-10 and <= maxCards"
    );
  }

  // Przygotuj system prompt
  const systemPrompt =
    options.systemPrompt ?? this.getFlashcardSystemPrompt(minCards, maxCards);

  // Wykonaj completion
  const result = await this.generateCompletion({
    systemPrompt,
    userPrompt: inputText,
    model: options.model,
    responseSchema: FlashcardsResponseSchema,
    responseSchemaName: "flashcard_generation",
    parameters: {
      temperature: options.temperature ?? 0.7,
      maxTokens: options.maxTokens ?? 2000,
    },
  });

  return result.cards;
}
```

3. Implementuj `executeRequestWithRetry()` zgodnie z sekcją 5.3

**Weryfikacja:** Testuj z prawdziwym API key i mockowanymi odpowiedziami.

---

### Krok 8: Integracja z Istniejącym ai.service.ts

**Plik:** `src/lib/services/ai.service.ts`

**Akcje:**
1. Usuń cały zakomentowany kod TODO
2. Zaimportuj `OpenRouterService`:
```typescript
import { OpenRouterService } from "./openrouter.service";
import type { SuggestedCardDTO } from "../../types";
```

3. Zainicjalizuj service:
```typescript
const openRouterService = new OpenRouterService({
  apiKey: import.meta.env.OPENROUTER_API_KEY,
  defaultModel: "anthropic/claude-3-haiku",
  timeout: 60000,
});
```

4. Zaktualizuj funkcję `generateFlashcards()`:
```typescript
export async function generateFlashcards(
  inputText: string
): Promise<SuggestedCardDTO[]> {
  return await openRouterService.generateFlashcards(inputText, {
    minCards: 5,
    maxCards: 10,
    temperature: 0.7,
  });
}
```

**Weryfikacja:** Upewnij się, że istniejące API endpointy nadal działają.

---

### Krok 9: Testowanie i Obsługa Błędów w API Route

**Plik:** `src/pages/api/generation-requests.ts`

**Akcje:**
1. Dodaj try-catch z obsługą błędów OpenRouter:
```typescript
import {
  OpenRouterError,
  OpenRouterRateLimitError,
  OpenRouterTimeoutError,
  OpenRouterValidationError,
} from "../../lib/services/openrouter.errors";

// W handlerze POST:
try {
  const suggestedCards = await generateFlashcards(validatedData.input_text);
  // ... reszta logiki
} catch (error) {
  if (error instanceof OpenRouterRateLimitError) {
    return new Response(
      JSON.stringify({
        error: "Rate limit exceeded",
        message: "Too many AI generation requests. Please try again later.",
        retry_after: error.retryAfter,
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": error.retryAfter.toString(),
        },
      }
    );
  }

  if (error instanceof OpenRouterTimeoutError) {
    return new Response(
      JSON.stringify({
        error: "Request timeout",
        message: "AI generation took too long. Please try again.",
      }),
      { status: 504, headers: { "Content-Type": "application/json" } }
    );
  }

  if (error instanceof OpenRouterValidationError) {
    console.error("OpenRouter validation error:", error.message, error.details);
    return new Response(
      JSON.stringify({
        error: "AI generation failed",
        message: "Unable to generate valid flashcards. Please try different text.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  if (error instanceof OpenRouterError) {
    console.error("OpenRouter error:", error.message);
    return new Response(
      JSON.stringify({
        error: "AI service error",
        message: "An error occurred with the AI service. Please try again later.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  // Ogólny błąd
  console.error("Unexpected error:", error);
  return new Response(
    JSON.stringify({
      error: "Internal server error",
      message: "An unexpected error occurred.",
    }),
    { status: 500, headers: { "Content-Type": "application/json" } }
  );
}
```

**Weryfikacja:** Testuj różne scenariusze błędów (brak API key, timeout, nieprawidłowa odpowiedź).

---

### Krok 10: Dokumentacja i Logging

**Akcje:**
1. Dodaj JSDoc do wszystkich publicznych metod
2. Implementuj strukturalne logowanie:
```typescript
private log(level: "info" | "warn" | "error", message: string, meta?: unknown) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    service: "OpenRouterService",
    level,
    message,
    ...(meta && { meta }),
  };

  if (level === "error") {
    console.error(JSON.stringify(logEntry));
  } else if (level === "warn") {
    console.warn(JSON.stringify(logEntry));
  } else {
    console.log(JSON.stringify(logEntry));
  }
}
```

3. Dodaj logging w kluczowych miejscach:
```typescript
// W generateFlashcards:
this.log("info", "Generating flashcards", {
  inputLength: inputText.length,
  model: options.model ?? this.config.defaultModel,
});

// W executeRequest:
this.log("info", "Sending request to OpenRouter", {
  model: request.model,
  messageCount: request.messages.length,
});

// W handleErrorResponse:
this.log("error", "API error", {
  status,
  error: errorBody,
});
```

4. Stwórz plik README dla service:
```markdown
# OpenRouter Service

## Overview
Service for communicating with OpenRouter.ai API to generate flashcards using LLMs.

## Usage
See examples in src/lib/services/ai.service.ts

## Configuration
Required environment variable: OPENROUTER_API_KEY

## Error Handling
All methods throw specific error types - see openrouter.errors.ts

## Supported Models
- anthropic/claude-3-haiku (default)
- anthropic/claude-3-sonnet
- openai/gpt-4o-mini
...
```

**Weryfikacja:** Sprawdź czy logi są czytelne i zawierają odpowiednie informacje.

---

### Krok 11: Testy Jednostkowe (Opcjonalne, ale zalecane)

**Plik:** `src/lib/services/__tests__/openrouter.service.test.ts`

**Akcje:**
1. Zainstaluj bibliotekę testową (jeśli jeszcze nie):
```bash
npm install -D vitest @vitest/ui
```

2. Stwórz testy dla kluczowych metod:
```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { OpenRouterService } from "../openrouter.service";
import {
  OpenRouterConfigError,
  OpenRouterValidationError,
} from "../openrouter.errors";

describe("OpenRouterService", () => {
  describe("constructor", () => {
    it("should throw error for missing API key", () => {
      expect(() => new OpenRouterService({ apiKey: "" })).toThrow(
        OpenRouterConfigError
      );
    });

    it("should initialize with valid config", () => {
      const service = new OpenRouterService({
        apiKey: "sk-or-v1-test-key-12345678",
      });
      expect(service.supportedModels).toBeDefined();
    });
  });

  describe("generateFlashcards", () => {
    let service: OpenRouterService;

    beforeEach(() => {
      service = new OpenRouterService({
        apiKey: "sk-or-v1-test-key-12345678",
      });
    });

    it("should throw error for text too short", async () => {
      await expect(service.generateFlashcards("short text")).rejects.toThrow(
        OpenRouterValidationError
      );
    });

    it("should throw error for invalid card limits", async () => {
      const longText = "a".repeat(2000);
      await expect(
        service.generateFlashcards(longText, { minCards: 15, maxCards: 10 })
      ).rejects.toThrow(OpenRouterValidationError);
    });

    // Więcej testów z mockami...
  });
});
```

3. Dodaj testy integracyjne z mockami `fetch`:
```typescript
global.fetch = vi.fn();

it("should successfully generate flashcards with mocked API", async () => {
  (global.fetch as any).mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      choices: [
        {
          message: {
            content: JSON.stringify({
              cards: [
                { front: "Question 1", back: "Answer 1" },
                { front: "Question 2", back: "Answer 2" },
                { front: "Question 3", back: "Answer 3" },
                { front: "Question 4", back: "Answer 4" },
                { front: "Question 5", back: "Answer 5" },
              ],
            }),
          },
        },
      ],
    }),
  });

  const result = await service.generateFlashcards("a".repeat(2000));
  expect(result).toHaveLength(5);
  expect(result[0]).toHaveProperty("front");
  expect(result[0]).toHaveProperty("back");
});
```

**Weryfikacja:** Uruchom testy: `npm test`

---

### Krok 12: Finalizacja i Code Review

**Akcje:**
1. Upewnij się, że wszystkie pliki są poprawnie zaimportowane
2. Sprawdź ESLint errors: `npm run lint`
3. Sprawdź TypeScript errors: `npx tsc --noEmit`
4. Przetestuj cały flow end-to-end:
   - Wywołaj POST `/api/generation-requests` z prawdziwym tekstem
   - Sprawdź czy fiszki są poprawnie generowane
   - Sprawdź czy błędy są odpowiednio obsługiwane
5. Zaktualizuj dokumentację projektu
6. Dodaj entry do CHANGELOG (jeśli istnieje)

**Weryfikacja końcowa:**
- [ ] Service działa z prawdziwym API OpenRouter
- [ ] Wszystkie błędy są odpowiednio obsługiwane
- [ ] Logging działa prawidłowo
- [ ] Testy przechodzą (jeśli zaimplementowane)
- [ ] Kod jest zgodny z linterem
- [ ] TypeScript kompiluje się bez błędów
- [ ] Dokumentacja jest aktualna

---

## 8. Przykładowe Użycie

### Przykład 1: Podstawowe Użycie w API Route

```typescript
// src/pages/api/generation-requests.ts
import { OpenRouterService } from "../../lib/services/openrouter.service";

const openRouterService = new OpenRouterService({
  apiKey: import.meta.env.OPENROUTER_API_KEY,
});

export async function POST({ request, locals }) {
  try {
    const body = await request.json();
    
    const cards = await openRouterService.generateFlashcards(
      body.input_text
    );
    
    return new Response(JSON.stringify({ cards }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Obsługa błędów...
  }
}
```

### Przykład 2: Zaawansowane Użycie z Custom Schema

```typescript
import { z } from "zod";

const QuizSchema = z.object({
  questions: z.array(
    z.object({
      question: z.string(),
      options: z.array(z.string()).length(4),
      correctAnswer: z.number().min(0).max(3),
    })
  ),
});

const quiz = await openRouterService.generateCompletion({
  systemPrompt: "Generate a multiple choice quiz from the text.",
  userPrompt: educationalText,
  responseSchema: QuizSchema,
  responseSchemaName: "quiz_generation",
  parameters: {
    temperature: 0.5,
    maxTokens: 1500,
  },
});
```

### Przykład 3: Obsługa Błędów w Frontend

```typescript
// src/components/hooks/useGenerateFlashcards.ts
async function generateFlashcards(text: string) {
  try {
    const response = await fetch("/api/generation-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input_text: text }),
    });

    if (!response.ok) {
      const error = await response.json();
      
      if (response.status === 429) {
        throw new Error(
          `Too many requests. Retry after ${error.retry_after} seconds.`
        );
      }
      
      throw new Error(error.message || "Generation failed");
    }

    const data = await response.json();
    return data.suggested_cards;
  } catch (error) {
    console.error("Failed to generate flashcards:", error);
    throw error;
  }
}
```

---


### 9 Batch Processing

Dla wielu requestów naraz:

```typescript
async generateFlashcardsBatch(
  inputs: string[]
): Promise<SuggestedCardDTO[][]> {
  const promises = inputs.map((text) => this.generateFlashcards(text));
  return await Promise.allSettled(promises).then((results) =>
    results.map((r) => (r.status === "fulfilled" ? r.value : []))
  );
}
```

## 10. Podsumowanie

Ten plan implementacji obejmuje:

✅ **Pełną strukturę service** z właściwym enkapsulowaniem logiki
✅ **Obsługę wszystkich wymagań OpenRouter API** (system/user messages, response_format, parametry)
✅ **Robust error handling** z dedykowanymi klasami błędów
✅ **Bezpieczeństwo** (API key protection, input validation, rate limiting)
✅ **Type safety** dzięki TypeScript i Zod
✅ **Zgodność z projektem** (struktura folderów, coding practices)
✅ **Extensibility** (łatwe dodawanie nowych use cases)
✅ **Testability** (separacja concerns, dependency injection)

**Uwaga:** Implementacja powinna być wykonywana iteracyjnie. Zachowaj focus na jakości kodu i proper error handling na każdym etapie.
