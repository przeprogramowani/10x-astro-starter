# Plan implementacji widoku Rejestracja

## 1. Przegląd

Widok rejestracji umożliwia nowym użytkownikom utworzenie konta w aplikacji 10x-cards. Po pomyślnej rejestracji użytkownik jest automatycznie logowany i przekierowywany do strony głównej aplikacji (/generate), gdzie może rozpocząć generowanie fiszek przez AI.

Widok składa się z prostego formularza zawierającego pola email i hasło, przycisk rejestracji oraz link do strony logowania dla użytkowników, którzy już posiadają konto.

## 2. Routing widoku

**Ścieżka:** `/register`

**Typ dostępu:** Publiczny (dostępny dla niezalogowanych użytkowników)

**Middleware:** 
- Zalogowani użytkownicy są automatycznie przekierowywani do `/generate`
- Sprawdzenie sesji odbywa się w middleware Astro (`src/middleware/index.ts`)

## 3. Struktura komponentów

```
RegisterPage (Astro)
└── RegisterForm (React)
    ├── Form
    │   ├── EmailInput
    │   │   ├── Label
    │   │   ├── Input (Shadcn/ui)
    │   │   └── ErrorMessage (conditional)
    │   ├── PasswordInput
    │   │   ├── Label
    │   │   ├── Input (Shadcn/ui)
    │   │   └── ErrorMessage (conditional)
    │   └── SubmitButton
    │       ├── Spinner (conditional - podczas ładowania)
    │       └── Text "Zarejestruj się"
    └── LoginLink
        └── Text "Masz już konto? Zaloguj się"
```

## 4. Szczegóły komponentów

### RegisterPage (Astro component)

**Opis komponentu:**
Główna strona Astro renderująca widok rejestracji. Odpowiada za layout strony i osadzenie interaktywnego komponentu RegisterForm.

**Główne elementy:**
- Container z centrowaniem treści
- Nagłówek "Zarejestruj się"
- Opcjonalny opis aplikacji
- Komponent `RegisterForm` (React island)

**Obsługiwane zdarzenia:**
- Brak (statyczny layout)

**Warunki walidacji:**
- Brak (walidacja w komponencie React)

**Typy:**
- Brak specjalnych propsów

**Propsy:**
- Brak (strona główna)

---

### RegisterForm (React component)

**Opis komponentu:**
Główny interaktywny formularz rejestracji. Zarządza stanem formularza, walidacją, wywołaniem API rejestracji i obsługą błędów. Po pomyślnej rejestracji automatycznie loguje użytkownika i przekierowuje do /generate.

**Główne elementy:**
- `<form>` element z obsługą submit
- Input dla email (type="email")
- Input dla hasła (type="password")
- Button submit z loading state
- Error messages (inline pod polami lub nad formularzem)
- Link nawigacyjny do /login

**Obsługiwane zdarzenia:**
- `onSubmit` - submit formularza, wywołanie rejestracji
- `onChange` - aktualizacja wartości pól email i hasło
- `onBlur` - opcjonalna walidacja przy opuszczeniu pola

**Warunki walidacji:**

1. **Email:**
   - Wymagane (nie może być puste)
   - Format email (walidacja HTML5 type="email")
   - Uniqueness sprawdzana przez Supabase przy submit
   - Komunikat błędu dla nieprawidłowego formatu: "Wprowadź prawidłowy adres email"
   - Komunikat błędu dla zajętego email (z API): "Ten adres email jest już zajęty"

2. **Hasło:**
   - Wymagane (nie może być puste)
   - Minimum 6 znaków (Supabase default)
   - Komunikat błędu: "Hasło musi mieć co najmniej 6 znaków"

3. **Ogólne:**
   - Przycisk submit disabled gdy:
     - Email jest pusty ALBO
     - Hasło jest puste ALBO
     - Formularz jest w trakcie submitowania (isLoading = true)

**Typy:**

```typescript
// Stan komponentu
interface RegisterFormState {
  email: string;
  password: string;
  isLoading: boolean;
  error: string | null;
}

// Propsy komponentu
interface RegisterFormProps {
  supabaseClient: SupabaseClient; // Przekazany z Astro locals lub Context
}
```

**Propsy:**
- `supabaseClient` (opcjonalnie - może być pobierane z Context API)

---

### EmailInput (część RegisterForm)

**Opis komponentu:**
Pole formularza dla adresu email z labelką, inputem i miejscem na komunikat błędu.

**Główne elementy:**
- `<Label>` (Shadcn/ui) z tekstem "Adres e-mail"
- `<Input>` (Shadcn/ui) z atrybutami:
  - `type="email"`
  - `id="email"`
  - `name="email"`
  - `required`
  - `disabled={isLoading}`
  - `autoComplete="email"`
- `<p>` element dla error message (conditional render)

**Obsługiwane zdarzenia:**
- `onChange` - aktualizacja wartości email w state
- `onBlur` - opcjonalna walidacja przy opuszczeniu pola

**Warunki walidacji:**
- Format email (HTML5 validation)
- Niepuste pole (required)
- Error message wyświetlany gdy błąd w state

---

### PasswordInput (część RegisterForm)

**Opis komponentu:**
Pole formularza dla hasła z labelką, inputem i miejscem na komunikat błędu.

**Główne elementy:**
- `<Label>` (Shadcn/ui) z tekstem "Hasło"
- `<Input>` (Shadcn/ui) z atrybutami:
  - `type="password"`
  - `id="password"`
  - `name="password"`
  - `required`
  - `minLength={6}`
  - `disabled={isLoading}`
  - `autoComplete="new-password"`
- `<p>` element dla error message (conditional render)

**Obsługiwane zdarzenia:**
- `onChange` - aktualizacja wartości hasła w state
- `onBlur` - opcjonalna walidacja długości

**Warunki walidacji:**
- Minimum 6 znaków
- Niepuste pole (required)
- Error message wyświetlany gdy błąd w state

---

### SubmitButton (część RegisterForm)

**Opis komponentu:**
Przycisk submit formularza z loading state (spinner podczas rejestracji).

**Główne elementy:**
- `<Button>` (Shadcn/ui) z atrybutami:
  - `type="submit"`
  - `disabled={isLoading || !email || !password}`
  - Variant: primary
- Conditional render:
  - Jeśli `isLoading`: `<Spinner />` (ikona Loader2 z lucide-react) + tekst "Rejestrowanie..."
  - Jeśli nie: tekst "Zarejestruj się"

**Obsługiwane zdarzenia:**
- `onClick` - submit formularza (implicit przez type="submit")

---

### LoginLink (część RegisterForm)

**Opis komponentu:**
Link nawigacyjny do strony logowania dla użytkowników, którzy już posiadają konto.

**Główne elementy:**
- `<p>` element z tekstem i linkiem
- Tekst: "Masz już konto? "
- `<a>` lub `<Link>` komponent do `/login` z tekstem "Zaloguj się"

**Obsługiwane zdarzenia:**
- `onClick` - nawigacja do /login (standard link behavior)

## 5. Typy

### RegisterFormState (ViewModel)

```typescript
interface RegisterFormState {
  email: string;           // Wartość pola email
  password: string;        // Wartość pola hasło
  isLoading: boolean;      // Czy formularz jest w trakcie submitowania
  error: string | null;    // Błąd do wyświetlenia (null = brak błędu)
}
```

**Pola:**
- `email`: string - aktualna wartość pola email
- `password`: string - aktualna wartość pola hasło
- `isLoading`: boolean - stan ładowania podczas wywołania API
- `error`: string | null - komunikat błędu do wyświetlenia użytkownikowi

### Typy Supabase Auth

Korzystamy z wbudowanych typów z `@supabase/supabase-js`:

```typescript
import type { AuthError, Session, User } from '@supabase/supabase-js';

// Response z signUp
interface SignUpResponse {
  data: {
    user: User | null;
    session: Session | null;
  };
  error: AuthError | null;
}
```

## 6. Zarządzanie stanem

**Strategia:** Lokalny stan w komponencie React (useState)

**Stan komponentu RegisterForm:**

```typescript
const [email, setEmail] = useState<string>('');
const [password, setPassword] = useState<string>('');
const [isLoading, setIsLoading] = useState<boolean>(false);
const [error, setError] = useState<string | null>(null);
```

**Przepływ zarządzania stanem:**

1. **Inicjalizacja:**
   - Wszystkie pola puste
   - `isLoading = false`
   - `error = null`

2. **Wprowadzanie danych:**
   - User wpisuje email → `setEmail(newValue)`
   - User wpisuje hasło → `setPassword(newValue)`
   - Realtime update wartości w state

3. **Submit formularza:**
   - User klika "Zarejestruj się"
   - `setIsLoading(true)` - button disabled, spinner visible
   - `setError(null)` - clear previous errors
   - Wywołanie `supabase.auth.signUp({ email, password })`

4. **Sukces:**
   - Sprawdzenie `session` w response
   - Jeśli session istnieje: automatycznie zalogowany
   - Przekierowanie do `/generate` (via `window.location.href` lub Astro navigation)
   - Optional: Toast notification "Konto zostało utworzone"

5. **Błąd:**
   - `setError(mapSupabaseError(error))` - user-friendly message
   - `setIsLoading(false)` - przywrócenie interaktywności
   - Wyświetlenie error message nad formularzem lub inline

## 7. Integracja API

**Endpoint:** Supabase Auth SDK - `supabase.auth.signUp()`

**Metoda wywołania:**

```typescript
const { data, error } = await supabase.auth.signUp({
  email: email,
  password: password
});
```

**Request:**
- Typ: Funkcja SDK (nie bezpośrednie HTTP call)
- Parametry:
  - `email`: string - adres email użytkownika
  - `password`: string - hasło użytkownika (min 6 znaków)

**Response - Sukces:**

```typescript
{
  data: {
    user: {
      id: 'uuid',
      email: 'user@example.com',
      // ... inne pola User
    },
    session: {
      access_token: 'jwt_token',
      refresh_token: 'refresh_token',
      user: { /* user object */ },
      // ... inne pola Session
    }
  },
  error: null
}
```

**Response - Błąd:**

```typescript
{
  data: {
    user: null,
    session: null
  },
  error: {
    message: 'User already registered' | 'Password should be at least 6 characters' | ...,
    status: 400 | 422 | 500
  }
}
```

**Mapowanie błędów na user-friendly messages:**

```typescript
const mapSupabaseError = (error: AuthError): string => {
  const message = error.message.toLowerCase();
  
  if (message.includes('already registered') || message.includes('already exists')) {
    return 'Ten adres email jest już zajęty';
  }
  
  if (message.includes('password') && message.includes('6')) {
    return 'Hasło musi mieć co najmniej 6 znaków';
  }
  
  if (message.includes('invalid email')) {
    return 'Wprowadź prawidłowy adres email';
  }
  
  // Fallback dla nieznanych błędów
  return 'Wystąpił błąd. Spróbuj ponownie';
};
```

**Konfiguracja Supabase (ważne dla MVP):**

Aby automatyczne zalogowanie działało, w konfiguracji Supabase Auth należy:
- **Disable email confirmation** (auto-confirm users) - dla uproszczenia MVP
- Lub: obsłużyć przypadek, gdy `session` jest null i wymagana jest weryfikacja email

**Client initialization:**

```typescript
// src/db/supabase.client.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.PUBLIC_SUPABASE_URL,
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY
);
```

## 8. Interakcje użytkownika

### 8.1 Wejście na stronę /register

**Akcja użytkownika:** Wpisanie `/register` w pasku adresu lub kliknięcie linku z landing page/loginu

**Przepływ:**
1. Middleware sprawdza czy użytkownik jest zalogowany
2. Jeśli TAK: Przekierowanie do `/generate`
3. Jeśli NIE: Renderowanie strony RegisterPage

**Oczekiwany wynik:**
- Wyświetlenie formularza rejestracji
- Pola email i hasło puste
- Button "Zarejestruj się" aktywny (jeśli pola będą wypełnione)
- Link do /login widoczny

---

### 8.2 Wypełnienie pola email

**Akcja użytkownika:** Wpisanie tekstu w pole email

**Przepływ:**
1. Event `onChange` triggeruje `setEmail(e.target.value)`
2. Stan `email` aktualizowany w realtime
3. HTML5 validation (type="email") sprawdza format podczas submit

**Oczekiwany wynik:**
- Wartość email aktualizowana w state
- Brak błędów walidacji (jeszcze)
- Button "Zarejestruj się" staje się enabled gdy oba pola wypełnione

---

### 8.3 Wypełnienie pola hasło

**Akcja użytkownika:** Wpisanie tekstu w pole hasło

**Przepływ:**
1. Event `onChange` triggeruje `setPassword(e.target.value)`
2. Stan `password` aktualizowany w realtime
3. Znaki hasła ukryte (type="password")

**Oczekiwany wynik:**
- Wartość password aktualizowana w state
- Znaki wyświetlane jako bullets/asterisks
- Button "Zarejestruj się" enabled gdy oba pola wypełnione

---

### 8.4 Submit formularza z prawidłowymi danymi

**Akcja użytkownika:** Kliknięcie przycisku "Zarejestruj się" lub Enter w polu

**Przepływ:**
1. Event `onSubmit` triggerowany
2. `preventDefault()` - zapobiegamy standardowemu submit
3. Client-side validation:
   - Email niepusty i prawidłowy format
   - Hasło min 6 znaków
4. `setIsLoading(true)` + `setError(null)`
5. Wywołanie `supabase.auth.signUp({ email, password })`
6. Oczekiwanie na response (1-3 sekundy)
7. **Sukces:**
   - Sprawdzenie `data.session`
   - Jeśli session istnieje: użytkownik zalogowany
   - `window.location.href = '/generate'` (przekierowanie)
   - Optional: Toast "Konto zostało utworzone pomyślnie"

**Oczekiwany wynik:**
- Button zmienia się na "Rejestrowanie..." ze spinnerem
- Wszystkie pola disabled
- Po sukcesie: przekierowanie do /generate
- User automatycznie zalogowany

---

### 8.5 Submit formularza z nieprawidłowymi danymi

**Akcja użytkownika:** Kliknięcie "Zarejestruj się" z błędnymi danymi

**Scenariusze błędów:**

#### A. Email już zarejestrowany
**Przepływ:**
1. Submit formularza
2. Supabase zwraca error: "User already registered"
3. `setError('Ten adres email jest już zajęty')`
4. `setIsLoading(false)`

**Oczekiwany wynik:**
- Error message wyświetlony nad formularzem lub pod polem email
- Kolor czerwony (text-red-600)
- Pola pozostają wypełnione
- User może poprawić email i spróbować ponownie

#### B. Hasło za krótkie (< 6 znaków)
**Przepływ:**
1. Client-side validation przed submittem wykrywa błąd
2. Lub: Supabase zwraca error "Password should be at least 6 characters"
3. `setError('Hasło musi mieć co najmniej 6 znaków')`

**Oczekiwany wynik:**
- Error message pod polem hasło
- Button może być pre-emptively disabled jeśli client-side validation

#### C. Nieprawidłowy format email
**Przepływ:**
1. HTML5 validation (type="email") blokuje submit
2. Lub: custom validation przed API call
3. Error message: "Wprowadź prawidłowy adres email"

**Oczekiwany wynik:**
- Browser native validation message (HTML5)
- Lub: inline error message pod polem email

#### D. Błąd serwera (500) lub sieci
**Przepływ:**
1. Supabase API zwraca 500 lub network error
2. `setError('Wystąpił błąd. Spróbuj ponownie')`
3. `setIsLoading(false)`

**Oczekiwany wynik:**
- Generic error message nad formularzem
- User może spróbować ponownie

---

### 8.6 Kliknięcie "Masz już konto? Zaloguj się"

**Akcja użytkownika:** Kliknięcie linku do logowania

**Przepływ:**
1. Link `<a href="/login">` lub Astro navigation
2. Przekierowanie do `/login`

**Oczekiwany wynik:**
- Nawigacja do strony logowania
- Brak zapisywania danych z formularza (user może wrócić Back button)

---

### 8.7 Naciśnięcie Enter w polu formularza

**Akcja użytkownika:** Naciśnięcie klawisza Enter w polu email lub hasło

**Przepływ:**
1. Standard HTML form behavior
2. Submit formularza triggerowany
3. Identyczny przepływ jak kliknięcie przycisku submit

**Oczekiwany wynik:**
- Submit formularza (jeśli pola wypełnione i valid)
- Rejestracja użytkownika

## 9. Warunki i walidacja

### 9.1 Walidacja po stronie klienta

#### Email field (EmailInput component)

**Warunki:**
1. **Niepuste pole**
   - Sprawdzane przez: HTML5 `required` attribute
   - Moment sprawdzenia: Przed submittem
   - Komunikat: Browser native validation message
   - Wpływ na UI: Submit blokowany przez browser

2. **Format email**
   - Sprawdzane przez: HTML5 `type="email"` validation
   - Moment sprawdzenia: Przed submittem
   - Komunikat: Browser native "Please enter a valid email"
   - Wpływ na UI: Submit blokowany przez browser

3. **Custom format validation (opcjonalnie)**
   - Sprawdzane przez: Regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
   - Moment sprawdzenia: `onBlur` lub przed submittem
   - Komunikat: "Wprowadź prawidłowy adres email"
   - Wpływ na UI: Inline error message, button disabled

#### Password field (PasswordInput component)

**Warunki:**
1. **Niepuste pole**
   - Sprawdzane przez: HTML5 `required` attribute
   - Moment sprawdzenia: Przed submittem
   - Komunikat: Browser native validation message
   - Wpływ na UI: Submit blokowany

2. **Minimum 6 znaków**
   - Sprawdzane przez: `minLength={6}` attribute lub custom validation
   - Moment sprawdzenia: `onBlur` lub przed submittem
   - Komunikat: "Hasło musi mieć co najmniej 6 znaków"
   - Wpływ na UI: Inline error message pod polem, button disabled

#### Submit button (SubmitButton component)

**Warunki disabled:**
1. `isLoading === true` - formularz w trakcie submitowania
2. `email === ''` - pole email puste
3. `password === ''` - pole hasło puste
4. `password.length < 6` - hasło za krótkie (opcjonalna early validation)

**Implementacja:**
```typescript
const isFormValid = email !== '' && password !== '' && password.length >= 6;
const isButtonDisabled = isLoading || !isFormValid;

<Button type="submit" disabled={isButtonDisabled}>
  {isLoading ? <Spinner /> : 'Zarejestruj się'}
</Button>
```

### 9.2 Walidacja po stronie serwera (Supabase)

#### Email uniqueness
- **Sprawdzane przez:** Supabase Auth podczas signUp
- **Moment sprawdzenia:** Po submit, podczas API call
- **Błąd z API:** `AuthError` z message "User already registered"
- **Komunikat użytkownikowi:** "Ten adres email jest już zajęty"
- **Wpływ na UI:** Error message nad formularzem lub pod polem email (inline)

#### Password strength
- **Sprawdzane przez:** Supabase Auth (default: min 6 znaków)
- **Moment sprawdzenia:** Po submit, podczas API call
- **Błąd z API:** `AuthError` z message "Password should be at least 6 characters"
- **Komunikat użytkownikowi:** "Hasło musi mieć co najmniej 6 znaków"
- **Wpływ na UI:** Error message pod polem hasło

#### Email format validation (server-side)
- **Sprawdzane przez:** Supabase Auth
- **Moment sprawdzenia:** Po submit
- **Błąd z API:** `AuthError` z message "Invalid email"
- **Komunikat użytkownikowi:** "Wprowadź prawidłowy adres email"
- **Wpływ na UI:** Error message pod polem email

### 9.3 Przepływ walidacji

```
User wypełnia formularz
    ↓
User klika "Zarejestruj się" (lub Enter)
    ↓
[CLIENT] HTML5 validation (required, type="email", minLength)
    ↓ PASS
[CLIENT] Custom validation (opcjonalnie - email regex, password length)
    ↓ PASS
[CLIENT] setIsLoading(true), disable inputs/button
    ↓
[API CALL] supabase.auth.signUp({ email, password })
    ↓
[SERVER] Supabase sprawdza:
    - Email format ✓
    - Email uniqueness ✓
    - Password strength (min 6 chars) ✓
    ↓
┌─────────────┴─────────────┐
↓ SUKCES                    ↓ BŁĄD
Session utworzona           AuthError zwrócony
    ↓                           ↓
Redirect → /generate        mapSupabaseError(error)
                               ↓
                            setError(message)
                               ↓
                            setIsLoading(false)
                               ↓
                            Wyświetl error message
```

## 10. Obsługa błędów

### 10.1 Typy błędów i strategie obsługi

#### 1. Błąd walidacji email (nieprawidłowy format)

**Źródło:** Client-side (HTML5) lub Supabase API

**Typ błędu:** Validation error

**Obsługa:**
- **Client-side:** HTML5 validation blokuje submit, native browser message
- **Server-side:** Jeśli przejdzie client-side, Supabase zwróci błąd
- **Komunikat:** "Wprowadź prawidłowy adres email"
- **UI:** Inline error message pod polem email, czerwony border na input
- **Recovery:** User poprawia email i próbuje ponownie

**Implementacja:**
```typescript
// Client-side (opcjonalnie przed API call)
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  setError('Wprowadź prawidłowy adres email');
  return;
}
```

---

#### 2. Błąd walidacji hasła (< 6 znaków)

**Źródło:** Client-side validation lub Supabase API

**Typ błędu:** Validation error

**Obsługa:**
- **Client-side:** `minLength={6}` attribute lub custom check
- **Komunikat:** "Hasło musi mieć co najmniej 6 znaków"
- **UI:** Inline error message pod polem hasło, button disabled
- **Recovery:** User wydłuża hasło

**Implementacja:**
```typescript
// Pre-submit validation
if (password.length < 6) {
  setError('Hasło musi mieć co najmniej 6 znaków');
  return;
}
```

---

#### 3. Email już zarejestrowany

**Źródło:** Supabase Auth API

**Typ błędu:** 400 Bad Request (AuthError)

**Obsługa:**
- **Detection:** `error.message.includes('already registered')`
- **Komunikat:** "Ten adres email jest już zajęty"
- **UI:** Error message nad formularzem lub inline pod polem email
- **Recovery:** User może:
  - Użyć innego adresu email
  - Przejść do /login jeśli zapomniał że ma konto

**Implementacja:**
```typescript
if (error && error.message.toLowerCase().includes('already registered')) {
  setError('Ten adres email jest już zajęty');
  setIsLoading(false);
  return;
}
```

---

#### 4. Błąd serwera (500 Internal Server Error)

**Źródło:** Supabase API lub network

**Typ błędu:** Server error

**Obsługa:**
- **Detection:** `error.status === 500` lub generic error
- **Komunikat:** "Wystąpił błąd. Spróbuj ponownie"
- **UI:** Error message nad formularzem (nie inline - nie dotyczy konkretnego pola)
- **Recovery:** User próbuje ponownie za chwilę
- **Dodatkowe:** Można dodać retry button

**Implementacja:**
```typescript
if (error) {
  // Generic fallback error
  setError('Wystąpił błąd. Spróbuj ponownie');
  setIsLoading(false);
  
  // Optional: log error for debugging
  console.error('Registration error:', error);
}
```

---

#### 5. Błąd sieci (Network Error)

**Źródło:** Brak połączenia z internetem

**Typ błędu:** Network error (nie dochodzi do serwera)

**Obsługa:**
- **Detection:** `error.message.includes('network')` lub catch network exceptions
- **Komunikat:** "Brak połączenia z internetem. Sprawdź połączenie i spróbuj ponownie"
- **UI:** Error message nad formularzem, może z ikoną offline
- **Recovery:** User sprawdza połączenie i retry

**Implementacja:**
```typescript
try {
  const { data, error } = await supabase.auth.signUp({ email, password });
  // ...
} catch (err) {
  // Network error or unexpected error
  setError('Brak połączenia z internetem. Sprawdź połączenie i spróbuj ponownie');
  setIsLoading(false);
}
```

---

#### 6. Session nie utworzona po rejestracji

**Źródło:** Supabase Auth configuration (email verification enabled)

**Typ błędu:** Edge case - sukces rejestracji ale brak sesji

**Obsługa:**
- **Detection:** `data.user` istnieje ale `data.session === null`
- **Komunikat:** "Konto zostało utworzone. Sprawdź swoją skrzynkę email i potwierdź adres"
- **UI:** Success message (zielony) z instrukcjami
- **Recovery:** User klika link w emailu do weryfikacji

**Implementacja:**
```typescript
if (data.user && !data.session) {
  // Email verification required
  setError(null); // clear errors
  // Show success message (może użyć toast notification)
  alert('Konto zostało utworzone. Sprawdź email i potwierdź adres.');
  // Opcjonalnie: redirect do /login lub stay na /register
  return;
}
```

**Uwaga:** W MVP zakładamy że email verification jest disabled (auto-confirm), więc ten scenariusz nie powinien wystąpić.

---

### 10.2 Centralna funkcja mapowania błędów

```typescript
const mapSupabaseError = (error: AuthError): string => {
  const message = error.message.toLowerCase();
  
  // Email already exists
  if (message.includes('already registered') || 
      message.includes('already exists') ||
      message.includes('duplicate')) {
    return 'Ten adres email jest już zajęty';
  }
  
  // Password too short
  if (message.includes('password') && 
      (message.includes('6') || message.includes('short'))) {
    return 'Hasło musi mieć co najmniej 6 znaków';
  }
  
  // Invalid email format
  if (message.includes('invalid email') || 
      message.includes('email format')) {
    return 'Wprowadź prawidłowy adres email';
  }
  
  // Network errors
  if (message.includes('network') || 
      message.includes('connection')) {
    return 'Brak połączenia z internetem. Sprawdź połączenie i spróbuj ponownie';
  }
  
  // Generic server error
  return 'Wystąpił błąd. Spróbuj ponownie';
};
```

### 10.3 Wyświetlanie błędów w UI

**Lokalizacja error messages:**

1. **Nad formularzem** (dla błędów ogólnych):
   - Email już zajęty
   - Błąd serwera
   - Błąd sieci
   
   ```tsx
   {error && (
     <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
       <p className="text-sm text-red-600">{error}</p>
     </div>
   )}
   ```

2. **Inline pod polami** (dla błędów walidacji field-specific):
   - Nieprawidłowy format email (opcjonalnie)
   - Hasło za krótkie (opcjonalnie)
   
   ```tsx
   {emailError && (
     <p className="mt-1 text-sm text-red-600">{emailError}</p>
   )}
   ```

**Styling:**
- Kolor: `text-red-600` dla tekstu błędu
- Background: `bg-red-50` dla containera (jeśli nad formularzem)
- Border: `border-red-200` lub `border-red-500` na input z błędem
- Ikona: Opcjonalnie AlertCircle icon z lucide-react

**Accessibility:**
```tsx
<div role="alert" aria-live="polite">
  {error && <p className="text-sm text-red-600">{error}</p>}
</div>
```

## 11. Kroki implementacji

### Krok 1: Przygotowanie środowiska i typów
1. Upewnij się, że Supabase client jest skonfigurowany (`src/db/supabase.client.ts`)
2. Sprawdź czy komponenty Shadcn/ui są zainstalowane:
   - `Button`
   - `Input`
   - `Label`
3. Zaimportuj potrzebne ikony z `lucide-react` (Loader2 dla spinnera)
4. Zdefiniuj typy TypeScript dla stanu formularza

**Pliki do utworzenia/zmodyfikowania:**
- `src/db/supabase.client.ts` (jeśli nie istnieje)
- `src/types.ts` (dodaj RegisterFormState jeśli potrzebne)

---

### Krok 2: Utworzenie strony Astro /register
1. Utwórz plik `src/pages/register.astro`
2. Zaimportuj layout (jeśli istnieje) lub zdefiniuj podstawowy HTML
3. Dodaj container z centrowaniem treści
4. Dodaj nagłówek "Zarejestruj się"
5. Osadź komponent React `<RegisterForm client:load />`
6. Przekaż supabaseClient jako prop (jeśli potrzebne)

**Przykładowa struktura:**
```astro
---
import Layout from '../layouts/Layout.astro';
import RegisterForm from '../components/RegisterForm';
import { supabase } from '../db/supabase.client';
---

<Layout title="Rejestracja - 10x-cards">
  <main class="flex min-h-screen items-center justify-center px-4">
    <div class="w-full max-w-md">
      <h1 class="text-3xl font-bold text-center mb-8">Zarejestruj się</h1>
      <RegisterForm client:load />
    </div>
  </main>
</Layout>
```

---

### Krok 3: Utworzenie komponentu RegisterForm
1. Utwórz plik `src/components/RegisterForm.tsx`
2. Zdefiniuj useState dla: email, password, isLoading, error
3. Zaimportuj komponenty Shadcn/ui (Button, Input, Label)
4. Zaimportuj supabase client
5. Utworzyć podstawową strukturę JSX formularza:
   - `<form>` z onSubmit
   - Input email
   - Input password
   - Submit button
   - Link do /login

**Szkielet komponentu:**
```tsx
'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Loader2 } from 'lucide-react';
import { supabase } from '../db/supabase.client';

export default function RegisterForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: implementacja
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* TODO: pola formularza */}
    </form>
  );
}
```

---

### Krok 4: Implementacja pól formularza

**Email input:**
```tsx
<div>
  <Label htmlFor="email">Adres e-mail</Label>
  <Input
    id="email"
    name="email"
    type="email"
    required
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    disabled={isLoading}
    autoComplete="email"
    placeholder="twoj@email.com"
  />
</div>
```

**Password input:**
```tsx
<div>
  <Label htmlFor="password">Hasło</Label>
  <Input
    id="password"
    name="password"
    type="password"
    required
    minLength={6}
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    disabled={isLoading}
    autoComplete="new-password"
    placeholder="Minimum 6 znaków"
  />
</div>
```

---

### Krok 5: Implementacja przycisku submit z loading state
```tsx
<Button
  type="submit"
  disabled={isLoading || !email || !password}
  className="w-full"
>
  {isLoading ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Rejestrowanie...
    </>
  ) : (
    'Zarejestruj się'
  )}
</Button>
```

---

### Krok 6: Implementacja funkcji handleSubmit

```tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // Clear previous errors
  setError(null);
  
  // Client-side validation (opcjonalnie - HTML5 robi to za nas)
  if (password.length < 6) {
    setError('Hasło musi mieć co najmniej 6 znaków');
    return;
  }
  
  // Start loading
  setIsLoading(true);
  
  try {
    // Call Supabase Auth API
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password
    });
    
    // Handle error
    if (signUpError) {
      setError(mapSupabaseError(signUpError));
      setIsLoading(false);
      return;
    }
    
    // Handle case where email verification is required
    if (data.user && !data.session) {
      alert('Konto zostało utworzone. Sprawdź email i potwierdź adres.');
      // Opcjonalnie: przekieruj do /login
      return;
    }
    
    // Success - user is logged in automatically
    // Redirect to /generate
    window.location.href = '/generate';
    
  } catch (err) {
    // Handle unexpected errors (network, etc.)
    setError('Wystąpił błąd. Spróbuj ponownie');
    setIsLoading(false);
  }
};
```

---

### Krok 7: Implementacja funkcji mapSupabaseError

Dodaj na początku pliku lub w osobnym utility file:

```tsx
const mapSupabaseError = (error: any): string => {
  const message = error.message.toLowerCase();
  
  if (message.includes('already registered') || message.includes('already exists')) {
    return 'Ten adres email jest już zajęty';
  }
  
  if (message.includes('password') && message.includes('6')) {
    return 'Hasło musi mieć co najmniej 6 znaków';
  }
  
  if (message.includes('invalid email')) {
    return 'Wprowadź prawidłowy adres email';
  }
  
  return 'Wystąpił błąd. Spróbuj ponownie';
};
```

---

### Krok 8: Wyświetlanie błędów w UI

Dodaj nad formularzem (wewnątrz `<form>` ale przed polami):

```tsx
{error && (
  <div role="alert" className="p-3 bg-red-50 border border-red-200 rounded-md">
    <p className="text-sm text-red-600">{error}</p>
  </div>
)}
```

---

### Krok 9: Dodanie linku do strony logowania

Na końcu formularza (po przycisku submit):

```tsx
<p className="text-center text-sm text-gray-600">
  Masz już konto?{' '}
  <a href="/login" className="font-medium text-primary hover:underline">
    Zaloguj się
  </a>
</p>
```

---

### Krok 10: Konfiguracja middleware Astro (jeśli nie istnieje)

Upewnij się, że `src/middleware/index.ts` zawiera logikę przekierowania:

```typescript
export async function onRequest(context, next) {
  const { pathname } = context.url;
  
  // Public paths
  const publicPaths = ['/', '/login', '/register'];
  
  if (publicPaths.includes(pathname)) {
    // Check if user is logged in
    const session = await getSession(context);
    
    // Redirect logged-in users from /register to /generate
    if (session && pathname === '/register') {
      return context.redirect('/generate');
    }
    
    return next();
  }
  
  // Protected routes - require session
  const session = await getSession(context);
  if (!session) {
    return context.redirect('/login');
  }
  
  context.locals.session = session;
  context.locals.user = session.user;
  
  return next();
}
```

---

## Podsumowanie kroków

1. ✅ Przygotowanie środowiska i typów
2. ✅ Utworzenie strony Astro /register
3. ✅ Utworzenie komponentu RegisterForm
4. ✅ Implementacja pól formularza (email, password)
5. ✅ Implementacja przycisku submit z loading state
6. ✅ Implementacja funkcji handleSubmit (logika rejestracji)
7. ✅ Implementacja funkcji mapSupabaseError (mapowanie błędów)
8. ✅ Wyświetlanie błędów w UI
9. ✅ Dodanie linku do strony logowania
10. ✅ Konfiguracja middleware Astro (przekierowania)

---

**Szacowany czas implementacji:** 2-4 godziny dla doświadczonego dewelopera React/Astro

**Priorytet:** High (blokuje możliwość korzystania z aplikacji)

**Dependencies:**
- Supabase client skonfigurowany
- Shadcn/ui komponenty zainstalowane
- Middleware Astro działający
- Strona /generate istnieje (dla przekierowania)
