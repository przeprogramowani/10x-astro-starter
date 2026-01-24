# API Endpoint Implementation Plan: POST /api/generation-requests

## 1. Przegląd punktu końcowego

Endpoint `POST /api/generation-requests` umożliwia generowanie sugestii fiszek z tekstu przy użyciu LLM. Użytkownik przesyła tekst o długości 1000-10000 znaków, a API zwraca 5-10 wygenerowanych par pytanie-odpowiedź, które użytkownik może następnie zaakceptować i zapisać jako fiszki.

**Kluczowe funkcjonalności:**
- Walidacja długości tekstu wejściowego (1000-10000 znaków)
- Integracja z OpenRouter.ai do generowania fiszek
- Zapis metadanych generowania do bazy danych
- Logowanie eventów do tabeli `events`
- Zwracanie sugestii bez automatycznego zapisywania jako fiszki

## 2. Szczegóły żądania

### Metoda HTTP
`POST`

### Struktura URL
`/api/generation-requests`

### Nagłówki wymagane
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

### Parametry

**Wymagane (Request Body):**
- `input_text` (string): Tekst do przetworzenia przez AI
  - Minimalna długość: 1000 znaków
  - Maksymalna długość: 10000 znaków
  - Wymagany: Tak

**Opcjonalne:**
- Brak

### Request Body (przykład)
```json
{
  "input_text": "React is a JavaScript library for building user interfaces. It was created by Facebook and is maintained by Facebook and a community of individual developers and companies. React can be used as a base in the development of single-page or mobile applications. However, React is only concerned with state management and rendering that state to the DOM, so creating React applications usually requires the use of additional libraries for routing and certain client-side functionality... [text continues to meet 1000-10000 character requirement]"
}
```

## 3. Wykorzystywane typy

### DTOs (Data Transfer Objects)

**Input:**
```typescript
// z src/types.ts
interface CreateGenerationRequestCommand {
  input_text: string;
}
```

**Output (sukces - 200 OK):**
```typescript
// z src/types.ts
interface GenerationRequestResponseDTO {
  generation_request_id: string;
  generated_count: number;
  suggested_cards: SuggestedCardDTO[];
  created_at: string;
}

interface SuggestedCardDTO {
  front: string;
  back: string;
}
```

**Output (błąd - 400 Bad Request):**
```typescript
// z src/types.ts
interface ValidationErrorResponseDTO {
  error: string;
  details: ValidationErrorDetailDTO[];
}

interface ValidationErrorDetailDTO {
  field: string;
  message: string;
  value?: unknown;
}
```

**Output (błąd - 429 Too Many Requests):**
```typescript
// z src/types.ts
interface RateLimitErrorResponseDTO extends ErrorResponseDTO {
  retry_after: number;
  limit?: number;
  remaining?: number;
  reset_at?: string;
}
```

**Output (błędy - 401, 502, 500):**
```typescript
// z src/types.ts
interface ErrorResponseDTO {
  error: string;
  message: string;
}
```

### Encje bazodanowe

```typescript
// z src/types.ts
type GenerationRequestInsertEntity = Database['public']['Tables']['generation_requests']['Insert'];
type EventInsertEntity = Database['public']['Tables']['events']['Insert'];
```

### Schemat walidacji Zod

```typescript
// Nowy schemat do stworzenia w pliku endpointu lub w osobnym pliku schemas
import { z } from 'zod';

const CreateGenerationRequestSchema = z.object({
  input_text: z.string()
    .min(1000, "Input text must be between 1000 and 10000 characters")
    .max(10000, "Input text must be between 1000 and 10000 characters")
});
```

## 4. Szczegóły odpowiedzi

### Sukces (200 OK)
```json
{
  "generation_request_id": "aa0e8400-e29b-41d4-a716-446655440000",
  "generated_count": 5,
  "suggested_cards": [
    {
      "front": "What is React?",
      "back": "React is a JavaScript library for building user interfaces, created and maintained by Facebook."
    },
    {
      "front": "What is React primarily concerned with?",
      "back": "React is only concerned with state management and rendering that state to the DOM."
    },
    {
      "front": "Can React be used for mobile applications?",
      "back": "Yes, React can be used as a base in the development of single-page or mobile applications."
    },
    {
      "front": "Does React provide routing functionality?",
      "back": "No, creating React applications usually requires additional libraries for routing and certain client-side functionality."
    },
    {
      "front": "Who maintains React?",
      "back": "React is maintained by Facebook and a community of individual developers and companies."
    }
  ],
  "created_at": "2026-01-24T12:00:00Z"
}
```

### Błąd walidacji (400 Bad Request)
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "input_text",
      "message": "Input text must be between 1000 and 10000 characters"
    }
  ]
}
```

### Błąd uwierzytelniania (401 Unauthorized)
```json
{
  "error": "Unauthorized",
  "message": "Missing or invalid authentication token"
}
```

### Przekroczenie limitu (429 Too Many Requests)
```json
{
  "error": "Rate limit exceeded",
  "message": "Maximum 10 generation requests per hour. Try again in 45 minutes.",
  "retry_after": 2700
}
```

### Błąd API LLM (502 Bad Gateway)
```json
{
  "error": "AI service unavailable",
  "message": "Unable to generate flashcards at this time. Please try again later."
}
```

### Błąd serwera (500 Internal Server Error)
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred. Please try again later."
}
```

## 5. Przepływ danych

### Diagram przepływu

```
1. Klient → POST /api/generation-requests
   ↓
2. Middleware uwierzytelniania (Supabase Auth)
   ↓
3. Walidacja danych wejściowych (Zod)
   ↓
4. Wywołanie OpenRouter.ai API (AI Service)
   ↓
5. Parsowanie odpowiedzi LLM
   ↓
6. Zapis do tabeli generation_requests (Generation Request Service)
   ↓
7. Logowanie eventu ai_generation (Event Service)
   ↓
8. Zwrócenie odpowiedzi do klienta
```

### Szczegółowy opis przepływu

**Krok 1: Uwierzytelnianie**
- Middleware pobiera token z nagłówka `Authorization`
- Weryfikacja tokenu przez Supabase Auth (`supabase.auth.getUser(token)`)
- Pobranie `user_id` z sesji
- Jeśli błąd → zwróć 401 Unauthorized

**Krok 2: Walidacja danych wejściowych**
- Parsowanie JSON z request body
- Walidacja za pomocą schematu Zod
- Sprawdzenie długości `input_text` (1000-10000 znaków)
- Jeśli błąd → zwróć 400 Bad Request z szczegółami

**Krok 3: Wywołanie API OpenRouter.ai**
- Przygotowanie promptu dla LLM
- Wysłanie żądania do OpenRouter.ai z timeoutem 30s
- Model: zalecany model o wysokiej efektywności i niskich kosztach (np. `anthropic/claude-3-haiku`)
- Format odpowiedzi: JSON array z obiektami `{front, back}`
- Obsługa błędów:
  - Timeout → 502 Bad Gateway
  - API error → 502 Bad Gateway
  - Invalid response → 500 Internal Server Error

**Krok 4: Parsowanie i walidacja odpowiedzi LLM**
- Parsowanie JSON z odpowiedzi
- Walidacja każdej wygenerowanej fiszki:
  - `front`: 1-200 znaków
  - `back`: 1-500 znaków
- Odrzucenie nieprawidłowych fiszek
- Minimum 1 poprawna fiszka, zalecane 5-10

**Krok 5: Zapis do bazy danych**
- Utworzenie rekordu w tabeli `generation_requests`:
  ```typescript
  {
    user_id: current_user_id,
    input_text: validated_input_text,
    generated_count: suggested_cards.length
  }
  ```
- Transakcja bazodanowa (rollback w przypadku błędu)
- Pobranie `id` i `created_at` z utworzonego rekordu

**Krok 6: Logowanie eventu**
- Utworzenie eventu w tabeli `events`:
  ```typescript
  {
    user_id: current_user_id,
    event_type: 'ai_generation',
    card_id: null,
    metadata: {
      generation_request_id: generation_request.id,
      generated_count: suggested_cards.length,
      input_text_length: input_text.length
    }
  }
  ```

**Krok 7: Zwrócenie odpowiedzi**
- Konstruowanie `GenerationRequestResponseDTO`
- Zwrócenie 200 OK z sugerowanymi fiszkami
- Fiszki NIE są automatycznie zapisywane - użytkownik musi je zaakceptować

### Interakcje z bazą danych

**Tabela `generation_requests`:**
- INSERT: Jeden rekord na każde żądanie generowania
- SELECT: Sprawdzanie rate limit (count last hour)

**Tabela `events`:**
- INSERT: Jeden rekord typu `ai_generation` na żądanie

**Tabela `cards`:**
- Brak interakcji (fiszki są zapisywane później przez endpoint POST /api/cards)

### Interakcje z zewnętrznymi usługami

**OpenRouter.ai API:**
- Endpoint: `https://openrouter.ai/api/v1/chat/completions`
- Metoda: POST
- Headers:
  - `Authorization: Bearer ${OPENROUTER_API_KEY}`
  - `Content-Type: application/json`
- Body:
  ```json
  {
    "model": "anthropic/claude-3-haiku",
    "messages": [
      {
        "role": "system",
        "content": "Generate 5-10 flashcards from the provided text..."
      },
      {
        "role": "user",
        "content": "{input_text}"
      }
    ]
  }
  ```
- Timeout: 60 sekund

## 6. Względy bezpieczeństwa

### Uwierzytelnianie

**Mechanizm:**
- Supabase Auth z tokenami JWT
- Walidacja tokenu w middleware
- Użycie `context.locals.supabase` w Astro routes

**Implementacja:**
```typescript
// W middleware (src/middleware/index.ts)
const authHeader = request.headers.get('Authorization');
if (!authHeader?.startsWith('Bearer ')) {
  return new Response(JSON.stringify({
    error: 'Unauthorized',
    message: 'Missing or invalid authentication token'
  }), { status: 401 });
}

const token = authHeader.substring(7);
const { data: { user }, error } = await supabase.auth.getUser(token);

if (error || !user) {
  return new Response(JSON.stringify({
    error: 'Unauthorized',
    message: 'Invalid authentication token'
  }), { status: 401 });
}

// Zapisz user w context
context.locals.user = user;
```

### Autoryzacja

**Izolacja użytkowników:**
- Wszystkie zapytania filtrowane po `user_id`
- Automatyczne przypisanie `user_id` z sesji
- Brak możliwości podania `user_id` w request body

**Implementacja:**
```typescript
const user_id = context.locals.user.id; // Z uwierzytelnionej sesji
// Użyj user_id w zapytaniach do bazy
```

### Walidacja danych wejściowych

**Sanityzacja:**
- Walidacja typu danych (string)
- Walidacja długości (1000-10000 znaków)
- Ochrona przed bardzo długimi tekstami (zapobieganie DoS)

**Bezpieczeństwo LLM:**
- Limit długości tekstu chroni przed kosztownymi wywołaniami
- Timeout zapobiega długotrwałym operacjom
- Walidacja odpowiedzi LLM przed zwróceniem do użytkownika

### Ochrona kluczy API

**Przechowywanie:**
- Klucz OpenRouter.ai w zmiennych środowiskowych
- Użycie `import.meta.env.OPENROUTER_API_KEY`
- Nigdy nie zwracaj klucza w odpowiedzi
- Nie loguj klucza w logach

**Plik .env:**
```
OPENROUTER_API_KEY=sk-or-v1-...
```

**Plik .env.example:**
```
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

### Ochrona przed atakami

**SQL Injection:**
- Użycie Supabase SDK (automatyczne escapowanie)
- Parametryzowane zapytania

**XSS (Cross-Site Scripting):**
- Brak renderowania HTML w odpowiedziach API
- Zwracanie danych jako JSON

**DoS (Denial of Service):**
- Timeout na wywołania LLM (60s)
- Limit długości tekstu (max 10000 znaków)

## 7. Obsługa błędów

### Hierarchia błędów

1. **Błędy uwierzytelniania (401)** - najwyższy priorytet
2. **Błędy walidacji (400)** - przed logiką biznesową
3. **Błędy zewnętrznych API (502)** - podczas wywołania LLM
4. **Błędy serwera (500)** - catch-all dla nieoczekiwanych błędów

### Szczegółowe scenariusze błędów

#### 400 Bad Request - Błędy walidacji

**Scenariusz 1: Brak pola input_text**
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "input_text",
      "message": "Input text is required"
    }
  ]
}
```

**Scenariusz 2: Tekst za krótki**
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "input_text",
      "message": "Input text must be between 1000 and 10000 characters",
      "value": 500
    }
  ]
}
```

**Scenariusz 3: Tekst za długi**
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "input_text",
      "message": "Input text must be between 1000 and 10000 characters",
      "value": 15000
    }
  ]
}
```

**Scenariusz 4: Nieprawidłowy typ danych**
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "input_text",
      "message": "Input text must be a string"
    }
  ]
}
```

**Implementacja:**
```typescript
try {
  const validated = CreateGenerationRequestSchema.parse(requestBody);
} catch (error) {
  if (error instanceof z.ZodError) {
    return new Response(JSON.stringify({
      error: 'Validation failed',
      details: error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        value: err.path.length > 0 ? requestBody[err.path[0]] : undefined
      }))
    }), { status: 400 });
  }
}
```

#### 401 Unauthorized - Błędy uwierzytelniania

**Scenariusz 1: Brak nagłówka Authorization**
```json
{
  "error": "Unauthorized",
  "message": "Missing or invalid authentication token"
}
```

**Scenariusz 2: Nieprawidłowy format tokenu**
```json
{
  "error": "Unauthorized",
  "message": "Missing or invalid authentication token"
}
```

**Scenariusz 3: Token wygasły**
```json
{
  "error": "Unauthorized",
  "message": "Invalid authentication token"
}
```

**Implementacja:**
Obsługiwana przez middleware (patrz sekcja Bezpieczeństwo)

#### 502 Bad Gateway - Błędy LLM API

**Scenariusz 1: Timeout wywołania**
```json
{
  "error": "AI service unavailable",
  "message": "Unable to generate flashcards at this time. Please try again later."
}
```

**Scenariusz 2: Błąd API OpenRouter.ai**
```json
{
  "error": "AI service unavailable",
  "message": "Unable to generate flashcards at this time. Please try again later."
}
```

**Scenariusz 3: Nieprawidłowa odpowiedź z LLM**
```json
{
  "error": "AI service unavailable",
  "message": "Unable to generate flashcards at this time. Please try again later."
}
```

**Implementacja:**
```typescript
try {
  const suggestedCards = await generateFlashcards(input_text);
  
  if (!suggestedCards || suggestedCards.length === 0) {
    return new Response(JSON.stringify({
      error: 'AI service unavailable',
      message: 'Unable to generate flashcards at this time. Please try again later.'
    }), { status: 502 });
  }
} catch (error) {
  console.error('LLM API error:', error);
  return new Response(JSON.stringify({
    error: 'AI service unavailable',
    message: 'Unable to generate flashcards at this time. Please try again later.'
  }), { status: 502 });
}
```

#### 500 Internal Server Error - Błędy serwera

**Scenariusz 1: Błąd zapisu do bazy danych**
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred. Please try again later."
}
```

**Scenariusz 2: Nieoczekiwany błąd**
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred. Please try again later."
}
```

**Implementacja:**
```typescript
try {
  // Cała logika endpointu
} catch (error) {
  console.error('Unexpected error:', error);
  
  return new Response(JSON.stringify({
    error: 'Internal server error',
    message: 'An unexpected error occurred. Please try again later.'
  }), { status: 500 });
}
```

### Logowanie błędów

**Co logować:**
- Wszystkie błędy 5xx (serwer)
- Błędy komunikacji z OpenRouter.ai
- Błędy zapisu do bazy danych
- Stack trace dla debugowania

**Czego NIE logować:**
- Tokenów uwierzytelniania
- Kluczy API
- Pełnej treści `input_text` (może zawierać dane wrażliwe)

**Implementacja:**
```typescript
console.error('Error in POST /api/generation-requests:', {
  error: error.message,
  user_id: user.id,
  timestamp: new Date().toISOString(),
  // NIE loguj: token, api_key, pełny input_text
});
```

## 8. Wydajność

### Optymalizacje

**1. Timeout dla LLM API:**
- Maksymalny czas: 60 sekund
- Zapobiega długotrwałym operacjom blokującym serwer

**2. Asynchroniczne operacje:**
- Wykorzystanie `async/await` dla wszystkich operacji I/O
- Równoległe wykonanie niezależnych operacji (jeśli możliwe)

**3. Connection pooling:**
- Wykorzystanie connection pool Supabase
- Ponowne użycie połączeń bazodanowych

### Potencjalne wąskie gardła

**1. Wywołanie OpenRouter.ai API:**
- Czas odpowiedzi: 5-30 sekund
- Rozwiązanie: Timeout, informacje dla użytkownika o czasie oczekiwania

**2. Zapis do bazy danych:**
- Transakcje mogą blokować inne operacje
- Rozwiązanie: Optymalizacja zapytań, indeksy

### Monitorowanie

**Metryki do śledzenia:**
- Średni czas odpowiedzi endpointu
- Liczba żądań z błędem 502 (problemy z LLM)
- Liczba żądań z błędem 429 (rate limit)
- Średnia długość `input_text`
- Średnia liczba wygenerowanych fiszek

**Narzędzia:**
- Logi serwera (console.log/console.error)
- Monitoring Supabase (query performance)
- Monitoring OpenRouter.ai (API usage, costs)

## 9. Etapy wdrożenia

### Krok 1: Przygotowanie środowiska

**1.1. Dodanie zmiennych środowiskowych**
- [ ] Dodaj `OPENROUTER_API_KEY` do pliku `.env`
- [ ] Dodaj przykład w `.env.example`
- [ ] Zaktualizuj `src/env.d.ts` (jeśli potrzebne dla TypeScript)

**1.2. Weryfikacja struktury bazy danych**
- [ ] Sprawdź, czy tabela `generation_requests` istnieje
- [ ] Sprawdź, czy tabela `events` istnieje
- [ ] Sprawdź, czy istnieją odpowiednie indeksy

**1.3. Instalacja zależności (jeśli potrzebne)**
- [ ] Upewnij się, że `zod` jest zainstalowany
- [ ] Upewnij się, że Supabase client jest skonfigurowany

### Krok 2: Utworzenie serwisów

**2.1. AI Service (`src/lib/services/ai.service.ts`)**
- [ ] Utworzyć funkcję `generateFlashcards(inputText: string): Promise<SuggestedCardDTO[]>`
- [ ] Zaimplementować integrację z OpenRouter.ai API
- [ ] Dodać obsługę timeout (30s)
- [ ] Zaimplementować parsowanie odpowiedzi LLM
- [ ] Dodać walidację wygenerowanych fiszek (długość front/back)
- [ ] Dodać obsługę błędów API

**2.2. Event Service (`src/lib/services/event.service.ts`)**
- [ ] Utworzyć funkcję `createEvent(eventData: CreateEventCommand, userId: string, supabase: SupabaseClient): Promise<void>`
- [ ] Zaimplementować INSERT do tabeli `events`
- [ ] Dodać obsługę błędów
- [ ] Opcjonalnie: funkcja pomocnicza dla eventów `ai_generation`

**2.3. Generation Request Service (`src/lib/services/generation-request.service.ts`)**
- [ ] Utworzyć funkcję `createGenerationRequest(data: GenerationRequestInsertEntity, supabase: SupabaseClient): Promise<GenerationRequestEntity>`
- [ ] Zaimplementować INSERT do tabeli `generation_requests`
- [ ] Zwrócić utworzony rekord z `id` i `created_at`
- [ ] Dodać obsługę błędów

### Krok 3: Utworzenie schematu walidacji

**3.1. Schema Zod**
- [ ] Utworzyć plik `src/lib/schemas/generation-request.schema.ts` (opcjonalne) lub umieścić w pliku endpointu
- [ ] Zdefiniować `CreateGenerationRequestSchema` z walidacją `input_text`
- [ ] Eksportować schemat

### Krok 4: Implementacja endpointu

**4.1. Utworzenie pliku endpointu**
- [ ] Utworzyć plik `src/pages/api/generation-requests.ts` (lub `.astro` jeśli preferujesz)
- [ ] Dodać `export const prerender = false`

**4.2. Implementacja handler POST**
- [ ] Utworzyć funkcję `POST` zgodnie z konwencją Astro
- [ ] Pobrać `supabase` z `context.locals`
- [ ] Pobrać `user` z `context.locals` (z middleware uwierzytelniania)

**4.3. Walidacja uwierzytelniania**
- [ ] Sprawdzić, czy `user` istnieje
- [ ] Jeśli nie → zwrócić 401 Unauthorized
- [ ] Pobrać `user_id`

**4.4. Parsowanie i walidacja request body**
- [ ] Parsować JSON z `request.body`
- [ ] Walidować za pomocą `CreateGenerationRequestSchema.parse()`
- [ ] Obsłużyć błędy walidacji → zwrócić 400 Bad Request

**4.5. Sprawdzenie rate limit**
- [ ] Wywołać `checkRateLimit(user.id, supabase)`
- [ ] Jeśli `!allowed` → zwrócić 429 Too Many Requests z odpowiednimi danymi
- [ ] Dodać nagłówki `Retry-After`, `X-RateLimit-*`

**4.6. Wywołanie AI Service**
- [ ] Wywołać `generateFlashcards(validated.input_text)` (na tym etapie niech to będzie mock)
- [ ] Obsłużyć błędy:
  - Timeout → 502 Bad Gateway
  - API error → 502 Bad Gateway
  - Empty response → 502 Bad Gateway

**4.7. Zapis do bazy danych**
- [ ] Wywołać `createGenerationRequest()` z danymi:
  ```typescript
  {
    user_id: user.id,
    input_text: validated.input_text,
    generated_count: suggestedCards.length
  }
  ```
- [ ] Obsłużyć błędy → 500 Internal Server Error
- [ ] Zapisać zwrócony rekord (id, created_at)

**4.8. Logowanie eventu**
- [ ] Wywołać `createEvent()` z danymi:
  ```typescript
  {
    event_type: 'ai_generation',
    card_id: null,
    metadata: {
      generation_request_id: generationRequest.id,
      generated_count: suggestedCards.length,
      input_text_length: validated.input_text.length
    }
  }
  ```
- [ ] Obsłużyć błędy (non-blocking, tylko logowanie)

**4.9. Konstruowanie odpowiedzi**
- [ ] Utworzyć obiekt `GenerationRequestResponseDTO`:
  ```typescript
  {
    generation_request_id: generationRequest.id,
    generated_count: suggestedCards.length,
    suggested_cards: suggestedCards,
    created_at: generationRequest.created_at
  }
  ```
- [ ] Zwrócić 200 OK z JSON

**4.10. Globalna obsługa błędów**
- [ ] Owinąć całą logikę w `try-catch`
- [ ] Logować błędy do console.error
- [ ] Zwrócić 500 Internal Server Error dla nieoczekiwanych błędów

### Krok 5: Konfiguracja middleware (jeśli nie istnieje)

**5.1. Middleware uwierzytelniania**
- [ ] Otworzyć/utworzyć `src/middleware/index.ts`
- [ ] Dodać logikę weryfikacji tokenu dla endpointów `/api/*`
- [ ] Zapisać `user` w `context.locals.user`
- [ ] Zapisać `supabase` w `context.locals.supabase`

**5.2. Konfiguracja Astro middleware**
- [ ] Upewnić się, że middleware jest poprawnie zarejestrowane w Astro

## Podsumowanie

Ten plan wdrożenia zawiera wszystkie niezbędne informacje do implementacji endpointu `POST /api/generation-requests`. Kluczowe punkty:

1. **Bezpieczeństwo**: Uwierzytelnianie, rate limiting, walidacja danych
2. **Architektura**: Wyodrębnienie logiki do serwisów (AI, Rate Limit, Event, Generation Request)
3. **Obsługa błędów**: Kompletna obsługa wszystkich scenariuszy (400, 401, 429, 502, 500)
4. **Wydajność**: Timeout, indeksy bazodanowe, asynchroniczne operacje
5. **Jakość kodu**: Zgodność z konwencjami projektu (Astro, TypeScript, Zod)
