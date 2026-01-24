# API Endpoint Implementation Plan: DELETE /api/users/me

## 1. Przegląd punktu końcowego

### Cel
Endpoint umożliwia uwierzytelnionemu użytkownikowi trwałe usunięcie swojego konta oraz wszystkich powiązanych danych z systemu. Jest to operacja nieodwracalna, która usuwa:
- Rekord użytkownika z Supabase Auth
- Wszystkie fiszki użytkownika (cards)
- Wszystkie żądania generowania AI (generation_requests)
- Wszystkie zdarzenia użytkownika (events)

### Funkcjonalność
- Użytkownik musi być uwierzytelniony (token Bearer w nagłówku Authorization)
- Operacja jest nieodwracalna - brak możliwości cofnięcia
- Wszystkie dane użytkownika są automatycznie usuwane dzięki kaskadowym ograniczeniom bazy danych
- Sesja użytkownika jest unieważniana po usunięciu konta

### Kontekst w aplikacji
Ten endpoint jest zazwyczaj dostępny w sekcji ustawień profilu użytkownika jako opcja "Usuń konto". Wymaga potwierdzenia przed wykonaniem operacji z powodu jej destrukcyjnego charakteru.

---

## 2. Szczegóły żądania

### Metoda HTTP
`DELETE`

### Struktura URL
```
DELETE /api/users/me
```

### Parametry

#### Wymagane:
- **Authorization header**: Bearer token w formacie `Bearer <access_token>`
  - Walidacja: Wykonywana przez middleware (`src/middleware/index.ts`)
  - Źródło: Token otrzymany podczas logowania przez Supabase Auth
  - User ID jest wydobywany z tokena przez middleware i dostępny w `context.locals.user.id`

#### Opcjonalne:
- Brak

#### Parametry URL:
- Brak

#### Parametry zapytania (query):
- Brak

### Request Body
Brak - endpoint nie przyjmuje danych w body żądania.

### Request Headers
```json
{
  "Authorization": "Bearer <access_token>"
}
```

---

## 3. Wykorzystywane typy

### DTOs używane w implementacji

#### DeleteUserResponseDTO
```typescript
// Zdefiniowany w: src/types.ts (linie 164-166)
export interface DeleteUserResponseDTO {
  message: string;
}
```
**Użycie**: Odpowiedź sukcesu (200 OK)

#### ErrorResponseDTO
```typescript
// Zdefiniowany w: src/types.ts (linie 206-209)
export interface ErrorResponseDTO {
  error: string;
  message: string;
}
```
**Użycie**: Odpowiedzi błędów (401, 500)

### Typy bazodanowe (wykorzystywane w service)

Nie są potrzebne typy encji, ponieważ operacja delete nie zwraca danych użytkownika. Service używa tylko `userId: string` i `supabase: SupabaseClientType`.

### Nowe typy

Brak - wszystkie potrzebne typy już istnieją w projekcie.

---

## 4. Szczegóły odpowiedzi

### Sukces (200 OK)

**Status Code**: `200 OK`

**Response Body**:
```json
{
  "message": "Account and all associated data deleted successfully"
}
```

**Response Type**: `DeleteUserResponseDTO`

**Headers**:
```
Content-Type: application/json
```

### Błędy

#### 401 Unauthorized
**Przyczyna**: Brak tokenu uwierzytelniającego lub nieprawidłowy token

**Response Body**:
```json
{
  "error": "Unauthorized",
  "message": "Missing or invalid authentication token"
}
```

**Obsługa**: Middleware automatycznie zwraca ten błąd gdy użytkownik nie jest uwierzytelniony

#### 500 Internal Server Error
**Przyczyna**: Błąd bazy danych lub błąd API Supabase Auth podczas usuwania

**Response Body**:
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred while deleting your account. Please try again later."
}
```

**Logowanie**: 
- Error message
- Stack trace (tylko server-side)
- User ID
- Timestamp
- Szczegóły błędu (database vs auth)

---

## 5. Przepływ danych

### Diagram przepływu
```
Client Request
    ↓
[DELETE /api/users/me] + Authorization Header
    ↓
Middleware (src/middleware/index.ts)
    ↓ [verifies token]
    ↓
API Route Handler (src/pages/api/users/me.ts)
    ↓ [extracts user.id from locals]
    ↓
User Service (src/lib/services/user.service.ts)
    ↓
    ├─→ Supabase Auth Admin API
    │   └─→ deleteUser(userId)
    │       ↓
    │   [Auth User Deleted]
    │
    └─→ PostgreSQL Database
        └─→ Cascading Deletes (automatic)
            ├─→ cards (ON DELETE CASCADE)
            ├─→ generation_requests (ON DELETE CASCADE)
            └─→ events (ON DELETE CASCADE)
        ↓
    [All User Data Deleted]
    ↓
Success Response (200 OK)
    ↓
Client
```

### Szczegółowy przepływ krok po kroku

#### 1. Weryfikacja autentykacji (Middleware)
- Middleware sprawdza obecność tokena Bearer w nagłówku Authorization
- Wywołuje `supabase.auth.getUser()` aby zweryfikować token
- Ustawia `context.locals.user` lub zwraca 401 jeśli brak autentykacji

#### 2. Walidacja żądania (API Route Handler)
- Sprawdzenie czy `locals.user` istnieje (double-check)
- Wydobycie `userId = user.id`
- Brak walidacji parametrów (nie są wymagane)

#### 3. Usunięcie użytkownika (User Service)
- Wywołanie `deleteUserAccount(userId, supabase)`
- **Krok 3a**: Użycie Supabase Auth Admin API do usunięcia użytkownika z auth:
  ```typescript
  await supabase.auth.admin.deleteUser(userId)
  ```
- **Krok 3b**: Automatyczne kaskadowe usuwanie w bazie danych:
  - PostgreSQL automatycznie usuwa wszystkie powiązane rekordy
  - Foreign keys z `ON DELETE CASCADE` obsługują powiązania

#### 4. Obsługa błędów
- Try-catch w service i route handler
- Logowanie błędów z kontekstem (userId, timestamp, error details)
- Zwrócenie odpowiedniego kodu błędu (500)

#### 5. Zwrócenie odpowiedzi
- Sukces: 200 OK z komunikatem potwierdzającym
- Błąd: 500 z ogólnym komunikatem (bez wrażliwych szczegółów)

### Interakcja z zewnętrznymi usługami

#### Supabase Auth Admin API
- **Endpoint**: `supabase.auth.admin.deleteUser(userId)`
- **Cel**: Usunięcie użytkownika z systemu autentykacji Supabase
- **Wymagania**: 
  - Service role key (nie anonymous key)
  - Admin privileges
- **Timeout**: Domyślny timeout Supabase SDK (zwykle 10-30s)
- **Retry**: Brak automatycznego retry - błąd kończy operację

#### PostgreSQL Database (Supabase)
- **Operacja**: Kaskadowe usuwanie przez foreign keys
- **Tabele**:
  - `auth.users` - główny rekord użytkownika
  - `public.cards` - fiszki użytkownika
  - `public.generation_requests` - żądania generowania
  - `public.events` - zdarzenia użytkownika
- **Transakcja**: Operacje są wykonywane w ramach transakcji database

---

## 6. Względy bezpieczeństwa

### Uwierzytelnianie
- **Wymagane**: Token Bearer w nagłówku Authorization
- **Mechanizm**: JWT token wydany przez Supabase Auth
- **Weryfikacja**: Middleware sprawdza token przed dotarciem do route handlera
- **Fail-safe**: Brak tokena = automatyczny 401 zwrócony przez middleware

### Autoryzacja
- **Zasada**: Użytkownik może usunąć tylko własne konto
- **Implementacja**: 
  - User ID jest wydobywany z zweryfikowanego tokena (nie z parametrów żądania)
  - Nie ma możliwości podania innego user_id w żądaniu
  - Endpoint `/api/users/me` oznacza "current user" - nie ma parametru ID
- **Zabezpieczenie**: Nawet gdyby ktoś podszył się pod token, może usunąć tylko konto powiązane z tym tokenem

### Walidacja danych wejściowych
- **Brak parametrów**: Endpoint nie przyjmuje żadnych danych wejściowych oprócz tokena
- **Brak walidacji**: Nie jest potrzebna walidacja payload (brak payload)
- **User ID**: Pochodzi z zaufanego źródła (zweryfikowany JWT token)

### Ochrona przed atakami

#### SQL Injection
- **Ryzyko**: Brak - używamy Supabase SDK, nie raw SQL
- **Mitygacja**: Supabase SDK używa parametryzowanych zapytań

#### CSRF (Cross-Site Request Forgery)
- **Ryzyko**: Średnie - operacja DELETE jest destrukcyjna
- **Mitygacja**: 
  - Wymagany Bearer token (nie cookie-based auth for API)
  - SameSite cookie policy dla sesji web
  - Dobra praktyka: Frontend powinien wymagać dodatkowego potwierdzenia

#### Rate Limiting
- **Rekomendacja**: Implementacja rate limitingu dla tego endpointu
- **Propozycja**: Max 3 próby na godzinę na użytkownika
- **Uwaga**: Nie jest częścią MVP, ale zalecane dla produkcji

#### Brute Force
- **Ryzyko**: Niskie - operacja wymaga autentykacji
- **Mitygacja**: Rate limiting na poziomie autentykacji (Supabase Auth)

### Bezpieczeństwo danych

#### Permanentne usuwanie
- **Charakter**: Operacja nieodwracalna - brak soft delete
- **Zalecenia**:
  - Frontend powinien wyświetlić ostrzeżenie i wymagać potwierdzenia
  - Opcjonalnie: Potwierdzenie przez email lub re-auth przed usunięciem
  - Opcjonalnie: Grace period (np. 30 dni) zanim dane zostaną trwale usunięte (nie w MVP)

#### Dane wrażliwe
- **Exposure**: Endpoint nie zwraca żadnych danych użytkownika w odpowiedzi
- **Logowanie**: Logi błędów nie powinny zawierać danych osobowych (tylko user_id)

#### GDPR Compliance
- **Prawo do bycia zapomnianym**: Ten endpoint realizuje GDPR "right to erasure"
- **Kompletność**: Wszystkie dane użytkownika muszą być usunięte (zapewnione przez cascades)

---

## 7. Obsługa błędów

### Lista potencjalnych błędów

#### 1. Brak autentykacji (401 Unauthorized)
**Przyczyna**: 
- Brak nagłówka Authorization
- Nieprawidłowy format tokena (nie "Bearer <token>")
- Token wygasł (expired JWT)
- Token został unieważniony (logout)

**Obsługa**:
- Middleware automatycznie zwraca 401
- Route handler nie jest wywoływany
- Komunikat: "Missing or invalid authentication token"

**Response**:
```json
{
  "error": "Unauthorized",
  "message": "Missing or invalid authentication token"
}
```

**Kod statusu**: `401 Unauthorized`

**Logowanie**: Brak (to normalna sytuacja, nie błąd serwera)

---

#### 2. Błąd Supabase Auth API (500 Internal Server Error)
**Przyczyna**:
- Błąd sieci podczas komunikacji z Supabase Auth
- Timeout API Supabase
- Supabase service unavailable (downtime)
- Nieprawidłowe uprawnienia (brak service role key)
- User już nie istnieje w auth (race condition)

**Obsługa**:
```typescript
try {
  const { error } = await supabase.auth.admin.deleteUser(userId);
  if (error) {
    console.error("Supabase Auth deletion failed:", {
      error: error.message,
      user_id: userId,
      timestamp: new Date().toISOString(),
    });
    throw new Error(`Failed to delete auth user: ${error.message}`);
  }
} catch (error) {
  // Handle and return 500
}
```

**Response**:
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred while deleting your account. Please try again later."
}
```

**Kod statusu**: `500 Internal Server Error`

**Logowanie**: 
```typescript
console.error("Supabase Auth deletion error:", {
  error: error instanceof Error ? error.message : "Unknown error",
  user_id: userId,
  timestamp: new Date().toISOString(),
  stack: error instanceof Error ? error.stack : undefined,
});
```

---

#### 3. Błąd bazy danych (500 Internal Server Error)
**Przyczyna**:
- PostgreSQL connection error
- Database timeout
- Constraint violation (nie powinno się zdarzyć przy DELETE)
- Transaction rollback

**Obsługa**:
- Service łapie błąd z Supabase SDK
- Logowanie szczegółów błędu
- Rzucenie błędu do route handlera
- Route handler zwraca ogólny 500

**Response**:
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred while deleting your account. Please try again later."
}
```

**Kod statusu**: `500 Internal Server Error`

**Logowanie**:
```typescript
console.error("Database deletion error:", {
  error: error instanceof Error ? error.message : "Unknown error",
  user_id: userId,
  timestamp: new Date().toISOString(),
  stack: error instanceof Error ? error.stack : undefined,
});
```

---

#### 4. Partial deletion failure (500 Internal Server Error)
**Przyczyna**:
- Auth user został usunięty, ale database operation failuje
- Database records zostały usunięte, ale auth user pozostaje

**Obsługa**:
- To jest poważny problem wymagający manual cleanup
- Logowanie jako CRITICAL error
- Zwrócenie 500 do klienta
- **Rekomendacja**: Implementacja transaction pattern lub cleanup job

**Response**:
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred while deleting your account. Please try again later."
}
```

**Kod statusu**: `500 Internal Server Error`

**Logowanie**:
```typescript
console.error("CRITICAL: Partial user deletion:", {
  error: "Database deleted but auth user remains (or vice versa)",
  user_id: userId,
  timestamp: new Date().toISOString(),
  details: error,
});
```

---

#### 5. Unexpected errors (500 Internal Server Error)
**Przyczyna**:
- Błędy runtime (TypeError, ReferenceError itp.)
- Niespodziewane wyjątki w kodzie
- Out of memory
- Inne nieprzewidziane błędy

**Obsługa**:
- Global try-catch w route handler
- Logowanie pełnego stack trace
- Zwrócenie ogólnego 500

**Response**:
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred. Please try again later."
}
```

**Kod statusu**: `500 Internal Server Error`

**Logowanie**:
```typescript
console.error("Unexpected error in DELETE /api/users/me:", {
  error: error instanceof Error ? error.message : "Unknown error",
  stack: error instanceof Error ? error.stack : undefined,
  user_id: userId,
  timestamp: new Date().toISOString(),
});
```

---

### Error Handling Strategy

#### Zasady
1. **Graceful degradation**: Nigdy nie eksponuj wrażliwych informacji w odpowiedziach błędów
2. **Szczegółowe logowanie**: Loguj wszystkie szczegóły server-side dla debugowania
3. **Przyjazne komunikaty**: Zwracaj zrozumiałe komunikaty dla użytkowników
4. **Consistent format**: Używaj ErrorResponseDTO dla wszystkich błędów
5. **Status codes**: Używaj odpowiednich kodów HTTP (401, 500)

#### Pattern obsługi błędów
```typescript
try {
  // Main logic
  await deleteUserAccount(userId, supabase);
  return new Response(JSON.stringify({ message: "..." }), { status: 200 });
} catch (error) {
  console.error("Error details:", {
    error: error instanceof Error ? error.message : "Unknown",
    user_id: userId,
    timestamp: new Date().toISOString(),
  });
  
  return new Response(
    JSON.stringify({
      error: "Internal server error",
      message: "Generic user-friendly message",
    }),
    { status: 500, headers: { "Content-Type": "application/json" } }
  );
}
```

---

## 8. Rozważania dotyczące wydajności

### Potencjalne wąskie gardła

#### 1. Kaskadowe usuwanie w bazie danych
**Problem**:
- Użytkownik z tysiącami fiszek może wymagać długiego czasu usuwania
- Kaskadowe DELETE na wielu tabelach może być kosztowne

**Analiza**:
- MVP: Większość użytkowników będzie miała < 1000 fiszek
- Kaskadowe DELETE w PostgreSQL są zoptymalizowane
- Operacja jest jednokrotna (user delete raz)

**Mitygacja**:
- Brak potrzeby optymalizacji w MVP
- Dla produkcji: Rozważyć async deletion (queue + background job)
- Monitoring czasu wykonania DELETE operations

**Oczekiwana wydajność**:
- < 100 cards: ~100-200ms
- 100-1000 cards: ~200-500ms  
- 1000+ cards: ~500ms-2s

---

#### 2. Supabase Auth API latency
**Problem**:
- Zewnętrzne API call do Supabase Auth
- Network latency
- API może mieć rate limiting

**Analiza**:
- Typowy latency: 100-300ms dla Supabase API
- Timeout domyślny: ~10s (wystarczający)

**Mitygacja**:
- Używamy domyślnego timeout z Supabase SDK
- Dla produkcji: Monitoring i alerting na długie requesty
- Opcjonalnie: Retry logic z exponential backoff

**Oczekiwana wydajność**:
- Typowy czas: 100-300ms
- Max timeout: 10s

---

#### 3. Database connection pool
**Problem**:
- Connection pool może być wyczerpany przy wielu równoczesnych deletions
- Long-running DELETE może blokować connection

**Analiza**:
- Operacja delete user jest rzadka
- Connection pool w Supabase jest zarządzany automatycznie
- MVP nie będzie miał dużego ruchu

**Mitygacja**:
- Używamy connection poolingu Supabase (Supavisor)
- Dla produkcji: Monitoring connection pool usage
- Ensure proper connection closing (SDK robi to automatycznie)

---

#### 4. Database locks
**Problem**:
- DELETE operation może tworzyć locks na tabelach
- Kaskadowe DELETE lockuje wiele tabel jednocześnie

**Analiza**:
- PostgreSQL używa MVCC - minimalizuje lock contention
- Locks są na poziomie row, nie table
- DELETE jest wystarczająco szybki w MVP

**Mitygacja**:
- Brak specjalnej mitygacji potrzebnej w MVP
- Dla produkcji: Vacuum analyze na tabelach z dużym churn

---

### Strategie optymalizacji

#### Obecne (MVP)
1. **Używaj kaskadowych DELETE**: Database obsługuje automatycznie related records
2. **Single API call**: Jeden call do `deleteUser()` zamiast multiple operations
3. **Brak soft delete**: Hard delete jest szybszy niż soft delete + cleanup
4. **No event logging**: Nie logujemy event dla user deletion (zgodnie ze spec)

#### Przyszłe optymalizacje (poza MVP)
1. **Async deletion**:
   - Mark user jako "pending deletion"
   - Background job usuwa dane
   - Immediate logout user
   - Benefit: Szybszy response dla użytkownika

2. **Batch operations**:
   - Dla bulk admin operations (gdyby potrzebne)
   - Queue system (np. BullMQ, Inngest)

3. **Caching**:
   - Nie dotyczy DELETE operations

4. **Database indexing**:
   - Indexy na foreign keys już istnieją
   - Composite indexes nie są potrzebne dla DELETE

5. **Monitoring i alerting**:
   - Track deletion time
   - Alert jeśli deletion > 5s
   - Dashboard z metrics

---

### Benchmarking (szacunki)

#### Oczekiwane czasy odpowiedzi
| Scenariusz | Cards | Generation Requests | Events | Oczekiwany czas |
|------------|-------|---------------------|--------|-----------------|
| Nowy user | 0 | 0 | 1-5 | 100-200ms |
| Lekkie użycie | 1-50 | 1-5 | 10-50 | 200-400ms |
| Średnie użycie | 50-500 | 5-25 | 50-500 | 400-800ms |
| Ciężkie użycie | 500-5000 | 25-100 | 500-5000 | 800ms-2s |

#### Acceptable performance targets (MVP)
- **P50**: < 500ms
- **P95**: < 2s
- **P99**: < 5s
- **Max timeout**: 10s (after that, return 500)

---

## 9. Etapy wdrożenia

### Faza 1: Przygotowanie (Setup)

#### Krok 1.1: Utworzenie service dla użytkownika
**Plik**: `src/lib/services/user.service.ts`

**Zadanie**: Utworzyć nowy service file z funkcją `deleteUserAccount`

**Implementacja**:
```typescript
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";

/**
 * Type for Supabase client with proper database types
 */
export type SupabaseClientType = SupabaseClient<Database>;

/**
 * Deletes a user account and all associated data
 * 
 * This function performs the following operations:
 * 1. Deletes the user from Supabase Auth (admin API)
 * 2. Database cascading deletes automatically remove:
 *    - All user's cards (via FK constraint)
 *    - All user's generation_requests (via FK constraint)
 *    - All user's events (via FK constraint)
 * 
 * @param userId - ID of the user to delete
 * @param supabase - Supabase client instance with admin privileges
 * @throws Error if deletion fails (auth API error or database error)
 */
export async function deleteUserAccount(
  userId: string,
  supabase: SupabaseClientType
): Promise<void> {
  // Delete user from Supabase Auth
  // This will automatically trigger cascading deletes in the database
  const { error } = await supabase.auth.admin.deleteUser(userId);

  if (error) {
    console.error("Failed to delete user from Supabase Auth:", {
      error: error.message,
      user_id: userId,
      timestamp: new Date().toISOString(),
    });
    throw new Error(`Failed to delete user account: ${error.message}`);
  }

  // Database cascading deletes happen automatically via FK constraints
  // No need to manually delete from cards, generation_requests, or events tables
  
  // Log successful deletion
  console.info("User account deleted successfully:", {
    user_id: userId,
    timestamp: new Date().toISOString(),
  });
}
```

**Test**: Utworzyć test file (opcjonalnie dla MVP, ale zalecane)

---

#### Krok 1.2: Utworzenie API route
**Plik**: `src/pages/api/users/me.ts`

**Zadanie**: Utworzyć nowy plik API route (może wymagać utworzenia folderu `users/`)

**Struktura**:
```
src/pages/api/
  ├── cards.ts
  ├── cards/
  │   └── [id].ts
  ├── generation-requests.ts
  └── users/              ← NOWY FOLDER
      └── me.ts           ← NOWY PLIK
```

**Polecenie**:
```bash
mkdir -p src/pages/api/users
touch src/pages/api/users/me.ts
```

---

### Faza 2: Implementacja core logic

#### Krok 2.1: Implementacja DELETE handler w API route
**Plik**: `src/pages/api/users/me.ts`

**Zadanie**: Zaimplementować DELETE endpoint zgodnie z wzorcem używanym w projekcie

**Template**:
```typescript
import type { APIRoute } from "astro";
import { deleteUserAccount } from "../../../lib/services/user.service";
import type { DeleteUserResponseDTO, ErrorResponseDTO } from "../../../types";

/**
 * Disable prerendering for this API endpoint
 */
export const prerender = false;

/**
 * DELETE /api/users/me
 * Deletes the authenticated user's account and all associated data
 * 
 * This is a destructive operation that cannot be undone. It will:
 * - Delete the user from Supabase Auth
 * - Delete all user's cards (automatic cascade)
 * - Delete all user's generation requests (automatic cascade)  
 * - Delete all user's events (automatic cascade)
 * 
 * Authentication: Required (Bearer token)
 * 
 * Responses:
 * - 200 OK: Account deleted successfully
 * - 401 Unauthorized: Missing or invalid authentication (handled by middleware)
 * - 500 Internal Server Error: Database or Auth API error
 */
export const DELETE: APIRoute = async ({ locals }) => {
  try {
    // Step 1: Verify authentication (user should be set by middleware)
    const { user, supabase } = locals;

    if (!user) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "Missing or invalid authentication token",
        } satisfies ErrorResponseDTO),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const userId = user.id;

    // Step 2: Delete user account and all associated data
    try {
      await deleteUserAccount(userId, supabase);
    } catch (error) {
      console.error("Failed to delete user account:", {
        error: error instanceof Error ? error.message : "Unknown error",
        user_id: userId,
        timestamp: new Date().toISOString(),
        stack: error instanceof Error ? error.stack : undefined,
      });

      return new Response(
        JSON.stringify({
          error: "Internal server error",
          message: "An unexpected error occurred while deleting your account. Please try again later.",
        } satisfies ErrorResponseDTO),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 3: Return success response
    return new Response(
      JSON.stringify({
        message: "Account and all associated data deleted successfully",
      } satisfies DeleteUserResponseDTO),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    // Global error handler - catch any unexpected errors
    console.error("Unexpected error in DELETE /api/users/me:", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: "An unexpected error occurred. Please try again later.",
      } satisfies ErrorResponseDTO),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
```

---

### Faza 3: Testowanie

#### Krok 3.1: Testy manualne - Sukces case
**Cel**: Zweryfikować że endpoint działa poprawnie w happy path

**Kroki**:
1. Utworzyć testowego użytkownika przez UI
2. Utworzyć kilka fiszek dla tego użytkownika
3. Wygenerować kilka AI cards (opcjonalnie)
4. Zalogować się jako ten użytkownik i uzyskać access token
5. Wykonać request:
   ```bash
   curl -X DELETE http://localhost:4321/api/users/me \
     -H "Authorization: Bearer <access_token>"
   ```

**Oczekiwany rezultat**:
- Status: 200 OK
- Response body: `{"message": "Account and all associated data deleted successfully"}`
- User nie może się już zalogować
- Wszystkie dane użytkownika są usunięte z bazy

**Weryfikacja w bazie danych**:
```sql
-- Powinno zwrócić 0 rekordów
SELECT * FROM auth.users WHERE id = '<user_id>';
SELECT * FROM cards WHERE user_id = '<user_id>';
SELECT * FROM generation_requests WHERE user_id = '<user_id>';
SELECT * FROM events WHERE user_id = '<user_id>';
```

---

#### Krok 3.2: Testy manualne - Error cases
**Cel**: Zweryfikować obsługę błędów

**Test 3.2a: Brak autentykacji (401)**
```bash
curl -X DELETE http://localhost:4321/api/users/me
# Expected: 401 Unauthorized
```

**Test 3.2b: Nieprawidłowy token (401)**
```bash
curl -X DELETE http://localhost:4321/api/users/me \
  -H "Authorization: Bearer invalid_token_xyz"
# Expected: 401 Unauthorized
```

**Test 3.2c: Wygasły token (401)**
```bash
curl -X DELETE http://localhost:4321/api/users/me \
  -H "Authorization: Bearer <expired_token>"
# Expected: 401 Unauthorized
```

---

#### Krok 3.3: Testy integracyjne (opcjonalne dla MVP)
**Cel**: Automatyczne testy z użyciem framework testowego

**Framework**: Vitest + Supabase testing utilities

**Test cases**:
1. Successfully deletes user and all data
2. Returns 401 for unauthenticated requests
3. Handles Supabase Auth API errors
4. Handles database errors
5. Verifies cascading deletes work correctly

**Implementacja**: Poza scope MVP, ale zalecane dla produkcji

---

### Faza 4: Dokumentacja i PR

#### Krok 4.1: Aktualizacja dokumentacji
**Pliki do aktualizacji**:
- `README.md` - Dodać informację o nowym endpoincie (jeśli jest API docs w README)
- `.ai/api-plan.md` - Już zawiera specyfikację, nic do zmiany

---

#### Krok 4.2: Code review checklist
**Przed wysłaniem PR**:
- [ ] Service utworzony i implementuje `deleteUserAccount`
- [ ] API route utworzony w `src/pages/api/users/me.ts`
- [ ] DELETE handler implementuje error handling
- [ ] Typy są poprawnie używane (`DeleteUserResponseDTO`, `ErrorResponseDTO`)
- [ ] Middleware authentication działa poprawnie
- [ ] Testy manualne przeprowadzone i przeszły
- [ ] Kod jest zgodny z linter rules
- [ ] Brak linter errors
- [ ] Console.error logowanie jest obecne dla błędów
- [ ] Komunikaty błędów są user-friendly (nie eksponują internals)

---

#### Krok 4.3: Deployment checklist
**Przed deployment na produkcję**:
- [ ] Testy na środowisku staging
- [ ] Weryfikacja że service role key jest skonfigurowany
- [ ] Weryfikacja że kaskadowe DELETE działa w production database
- [ ] Backup database przed pierwszym deployment
- [ ] Monitoring setup (opcjonalnie)
- [ ] Alerting setup (opcjonalnie)
- [ ] Documentation dla support team (jak handle user deletion requests)

---

### Faza 5: Post-deployment

#### Krok 5.1: Monitoring
**Co monitorować**:
- Liczba wywołań DELETE /api/users/me
- Czas wykonania operacji
- Rate of 500 errors
- Rate of successful deletions

**Tools** (opcjonalnie dla MVP):
- Supabase Dashboard Analytics
- Custom logging/metrics
- Sentry dla error tracking

---

#### Krok 5.2: User communication
**Frontend requirements**:
1. Dodać przycisk "Delete Account" w ustawieniach profilu
2. Wyświetlić ostrzeżenie przed usunięciem:
   ```
   "Are you sure you want to delete your account? 
   This action cannot be undone and will permanently delete:
   - All your flashcards
   - All your generation history
   - All your account data
   
   Type 'DELETE' to confirm:"
   ```
3. Wymagać potwierdzenia (np. wpisanie "DELETE")
4. Opcjonalnie: Re-authentication przed deletion
5. Po sukcesie: Redirect do strony głównej + wylogowanie

---

## 10. Potencjalne problemy i rozwiązania

### Problem 1: Partial deletion
**Opis**: Auth user zostaje usunięty, ale database operation failuje

**Rozwiązanie**:
1. Implement retry logic w service
2. Logowanie jako CRITICAL error dla manual cleanup
3. Dla produkcji: Transaction pattern lub cleanup job

---

### Problem 2: Race conditions
**Opis**: User wywołuje DELETE kilka razy jednocześnie

**Rozwiązanie**:
1. Frontend: Disable button po kliknięciu
2. Backend: Idempotent operation (usunięcie już usuniętego user = success)
3. Supabase Auth zwróci error jeśli user nie istnieje - handle gracefully

---

### Problem 3: Cascading delete failures
**Opis**: Foreign key constraints mogą failować jeśli database jest w inconsistent state

**Rozwiązanie**:
1. Ensure database migrations są wykonane poprawnie
2. Test cascading deletes w staging
3. Verify foreign keys w migration:
   ```sql
   ALTER TABLE cards 
   ADD CONSTRAINT cards_user_id_fkey 
   FOREIGN KEY (user_id) REFERENCES auth.users(id) 
   ON DELETE CASCADE;
   ```

---

### Problem 4: Long-running deletions
**Opis**: User z dużą ilością danych może spowodować timeout

**Rozwiązanie (dla produkcji, nie MVP)**:
1. Async deletion pattern:
   - Mark user dla deletion
   - Background job usuwa dane
   - Immediate logout
2. Connection timeout zwiększony w Supabase settings
3. Database performance tuning (indexes, vacuum)

---

## 11. Checklist implementacji

### Pre-implementation
- [ ] Review API specification (`DELETE /api/users/me` w api-plan.md)
- [ ] Review database schema (szczególnie ON DELETE CASCADE constraints)
- [ ] Review existing patterns w projekcie (card.service.ts, cards.ts endpoint)
- [ ] Ensure dev environment działa (local Supabase, migrations applied)

### Implementation
- [ ] Utworzyć `src/lib/services/user.service.ts`
- [ ] Zaimplementować `deleteUserAccount` function w service
- [ ] Utworzyć folder `src/pages/api/users/`
- [ ] Utworzyć `src/pages/api/users/me.ts`
- [ ] Zaimplementować DELETE handler w route
- [ ] Dodać error handling zgodnie z pattern z projektu
- [ ] Dodać proper logging (console.error dla błędów)
- [ ] Użyć typów z `src/types.ts` (DeleteUserResponseDTO, ErrorResponseDTO)

### Testing
- [ ] Test: Successful deletion (200 OK)
- [ ] Test: Unauthorized access (401)
- [ ] Test: Invalid token (401)
- [ ] Test: Verify cascading deletes w database
- [ ] Test: User cannot login po deletion
- [ ] Test: Error handling (mock Supabase errors)

### Code quality
- [ ] Run linter: `npm run lint`
- [ ] Fix linter errors jeśli są
- [ ] Format code: `npm run format` (jeśli script istnieje)
- [ ] Review code coverage (opcjonalnie)
- [ ] Review security concerns

### Documentation
- [ ] Verify api-plan.md jest up-to-date (już jest)
- [ ] Add JSDoc comments do service functions
- [ ] Add route comments explaining endpoint

### Deployment
- [ ] Test na local development environment
- [ ] Test na staging environment (jeśli istnieje)
- [ ] Verify Supabase service role key w environment variables
- [ ] Create backup przed production deployment
- [ ] Deploy do production
- [ ] Smoke test po deployment
- [ ] Monitor errors w production

---

## 12. Dodatkowe uwagi

### Zgodność z GDPR
Ten endpoint realizuje "Right to erasure" (Art. 17 GDPR). Ważne aspekty:
1. **Completeness**: Wszystkie dane użytkownika muszą być usunięte (zapewnione przez cascades)
2. **Verification**: User musi być uwierzytelniony (zapewnione przez JWT)
3. **Logs**: Retention policy dla server logs powinno być zgodne z GDPR
4. **Backups**: Database backups mogą zawierać usunięte dane - documentation policy needed

### Frontend considerations
Mimo że to plan backend, ważne jest aby frontend:
1. Wymagał potwierdzenia przed usunięciem
2. Wyświetlał jasne ostrzeżenie o nieodwracalności
3. Opcjonalnie wymagał re-authentication
4. Gracefully handleował errors (500)
5. Redirectował i wylogowywał po sukcesie

### Security best practices
1. **No user data in response**: Endpoint nie zwraca żadnych danych użytkownika
2. **No user data in logs**: Loguj tylko user_id, nie email ani inne PII
3. **Rate limiting**: Rozważyć rate limiting dla produkcji
4. **Audit trail**: Rozważyć audit log dla deleted accounts (GDPR compliance)

### Future enhancements (poza MVP)
1. **Soft delete**: Grace period przed permanent deletion
2. **Email confirmation**: Require email confirmation przed deletion
3. **Data export**: Offer data export przed deletion (GDPR requirement)
4. **Async deletion**: Background job dla dużych accounts
5. **Metrics dashboard**: Track user churn i deletion reasons
6. **Undo feature**: 30-day window aby odzyskać account

---

## 13. Podsumowanie

### Kluczowe punkty
- **Endpoint**: DELETE /api/users/me
- **Uwierzytelnianie**: Wymagane (Bearer token)
- **Operacja**: Nieodwracalne usunięcie użytkownika i wszystkich danych
- **Implementacja**: Service layer + API route handler
- **Cascading**: Automatyczne przez database foreign keys
- **Error handling**: 401 dla unauthorized, 500 dla błędów serwera

### Priorytet
**Średni**: Endpoint jest potrzebny dla complete user management, ale nie jest critical dla MVP functionality (users mogą nie usuwać kont często)

### Estimated effort
- **Implementacja**: 1-2 godziny
- **Testowanie**: 30-60 minut
- **Total**: 2-3 godziny

### Dependencies
- Supabase Auth Admin API musi działać
- Database migrations muszą mieć ON DELETE CASCADE
- Middleware authentication musi być skonfigurowane (już jest)

### Risks
- **Low risk**: Operacja jest prosta, pattern jest znany z innych endpoints
- **Main risk**: Partial deletion (mitigated przez logging i monitoring)
