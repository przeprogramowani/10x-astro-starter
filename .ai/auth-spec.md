# Specyfikacja techniczna modułu autentykacji - 10x-cards

## 1. Przegląd

Niniejsza specyfikacja określa architekturę modułu autentykacji dla aplikacji 10x-cards, obejmującą funkcjonalności rejestracji, logowania, wylogowania oraz odzyskiwania hasła. Rozwiązanie opiera się na integracji Supabase Auth z frameworkiem Astro 5 w trybie SSR (Server-Side Rendering), wykorzystując komponenty React 19 dla warstwy interaktywnej.

### 1.1. Zakres funkcjonalny

Moduł realizuje następujące historyjki użytkownika:
- **US-001**: Rejestracja konta z weryfikacją email i hasła
- **US-002**: Logowanie do aplikacji z obsługą błędów
- **US-008**: Bezpieczny dostęp i autoryzacja do zasobów użytkownika
- **US-009**: Zmiana hasła w profilu użytkownika (dla zalogowanego użytkownika)
- **US-010**: Wylogowanie z aplikacji
- **US-011**: Odzyskiwanie hasła przez wysyłkę linku resetującego na email (forgot password)
- **US-012**: Usuwanie konta użytkownika wraz z powiązanymi danymi (wymagane zgodnie z RODO)

### 1.2. Wymagania niefunkcjonalne

- Wykorzystanie Supabase Auth jako dostawcy usług autentykacji
- Implementacja Row-Level Security (RLS) w bazie danych PostgreSQL
- Przechowywanie sesji w bezpiecznych cookies HttpOnly
- Zgodność z RODO (możliwość usunięcia konta i danych)
- Walidacja danych po stronie klienta i serwera
- Przyjazne dla użytkownika komunikaty błędów w języku polskim

---

## 2. ARCHITEKTURA INTERFEJSU UŻYTKOWNIKA

### 2.1. Struktura stron i komponentów

#### 2.1.1. Strony Astro (SSR)

##### `/src/pages/register.astro` - Strona rejestracji
**Status**: Zaimplementowana częściowo  
**Wymagane zmiany**: Brak (działająca implementacja)

**Opis**:
- Renderowana server-side z wykorzystaniem Layout.astro
- Zawiera komponent React `<RegisterForm client:load />`
- Wyświetla nagłówek, opis i link do strony logowania
- Nie wymaga autentykacji (dostępna publicznie)

**Kontrakty z backendem**: Brak bezpośrednich - delegacja do komponentu RegisterForm

##### `/src/pages/login.astro` - Strona logowania
**Status**: Placeholder do implementacji  
**Wymagane zmiany**: Pełna implementacja

**Struktura**:
```
Layout (title="Logowanie - 10x-cards")
└── main (container z centrowaniem i gradientem)
    └── div (karta)
        ├── nagłówek (h1, h2)
        └── LoginForm (client:load)
```

**Logika server-side**:
- Sprawdzenie sesji użytkownika poprzez `Astro.locals.user`
- Jeśli użytkownik jest zalogowany → przekierowanie do `/generate`
- Jeśli nie jest zalogowany → wyświetlenie formularza logowania

**Kontrakty z backendem**: Odczyt sesji z middleware

##### `/src/pages/forgot-password.astro` - Strona odzyskiwania hasła
**Status**: Do utworzenia

**Struktura**:
```
Layout (title="Resetuj hasło - 10x-cards")
└── main (container z centrowaniem i gradientem)
    └── div (karta)
        ├── nagłówek (h1, h2)
        └── ForgotPasswordForm (client:load)
```

**Logika server-side**:
- Sprawdzenie sesji użytkownika
- Jeśli użytkownik jest zalogowany → przekierowanie do `/generate`
- Jeśli nie jest zalogowany → wyświetlenie formularza resetowania hasła

**Kontrakty z backendem**: Odczyt sesji z middleware

##### `/src/pages/reset-password.astro` - Strona ustawiania nowego hasła
**Status**: Do utworzenia

**Struktura**:
```
Layout (title="Ustaw nowe hasło - 10x-cards")
└── main (container z centrowaniem i gradientem)
    └── div (karta)
        ├── nagłówek (h1, h2)
        └── ResetPasswordForm (client:load, token)
```

**Logika server-side**:
- Odczyt tokenu resetowania z URL query params (`Astro.url.searchParams.get('token')`)
- Walidacja obecności tokenu - jeśli brak → przekierowanie do `/forgot-password`
- Przekazanie tokenu do komponentu React jako prop

**Kontrakty z backendem**: Walidacja tokenu w komponencie React

##### `/src/pages/generate.astro` - Strona generowania fiszek
**Status**: Zaimplementowana  
**Wymagane zmiany**: Odkomentowanie logiki ochrony (wymuszenie logowania)

**Zmiany**:
```typescript
// PRZED (aktualnie):
// Session should be set by middleware
const { user } = Astro.locals;

// For development - no login required
// if (!user) {
//   return Astro.redirect('/login');
// }

// PO (docelowo):
const { user } = Astro.locals;

// Protect route - require authentication
if (!user) {
  return Astro.redirect('/login');
}
```

**Kontrakty z backendem**: Odczyt sesji z middleware, przekierowanie jeśli brak uwierzytelnienia

##### `/src/pages/index.astro` - Strona główna (landing)
**Status**: Zaimplementowana  
**Wymagane zmiany**: Warunkowe wyświetlanie treści i przekierowanie dla zalogowanych

**Logika do dodania**:
```typescript
const { user } = Astro.locals;

// Redirect authenticated users to /generate
if (user) {
  return Astro.redirect('/generate');
}
```

**Kontrakty z backendem**: Odczyt sesji z middleware

##### `/src/pages/profile.astro` - Strona profilu użytkownika
**Status**: Do utworzenia

**Struktura**:
```
Layout (title="Profil - 10x-cards")
└── main (container)
    └── div (karta)
        ├── nagłówek (h1)
        ├── Sekcja: Dane konta
        │   └── Email (readonly)
        ├── Sekcja: Zmiana hasła
        │   └── ChangePasswordForm (client:load)
        └── Sekcja: Usuwanie konta
            └── DeleteAccountButton (client:load)
```

**Logika server-side**:
- Sprawdzenie sesji użytkownika poprzez `Astro.locals.user`
- Jeśli użytkownik nie jest zalogowany → przekierowanie do `/login`
- Przekazanie danych użytkownika do komponentów

**Kontrakty z backendem**: Odczyt sesji z middleware

#### 2.1.2. Komponenty React (Client-side)

##### `RegisterForm.tsx`
**Status**: Zaimplementowany  
**Wymagane zmiany**: Brak

**Odpowiedzialności**:
- Zarządzanie stanem formularza (email, password)
- Walidacja po stronie klienta (minimum 6 znaków hasła, format email)
- Wywołanie Supabase Auth API (`authClient.auth.signUp()`)
- Obsługa błędów z mapowaniem na user-friendly komunikaty w języku polskim
- Obsługa przypadku wymagania weryfikacji email
- Automatyczne przekierowanie do `/generate` po sukcesie
- Wyświetlanie stanu ładowania (loading spinner)

**Wykorzystywane komponenty UI**:
- `Button` (shadcn/ui)
- `Input` (shadcn/ui)
- `Label` (shadcn/ui)

**Kontrakt z backendem**:
```typescript
// Wywołanie
authClient.auth.signUp({ email, password })

// Odpowiedź sukces
{
  data: { user, session },
  error: null
}

// Odpowiedź błąd
{
  data: { user: null, session: null },
  error: AuthError
}
```

##### `LoginForm.tsx`
**Status**: Do utworzenia  
**Lokalizacja**: `/src/components/LoginForm.tsx`

**Odpowiedzialności**:
- Zarządzanie stanem formularza (email, password)
- Walidacja po stronie klienta (niepuste pola, format email)
- Wywołanie Supabase Auth API (`authClient.auth.signInWithPassword()`)
- Obsługa błędów z mapowaniem na komunikaty w języku polskim
- Automatyczne przekierowanie do `/generate` po sukcesie
- Wyświetlanie stanu ładowania
- Link do strony rejestracji i resetowania hasła

**Struktura komponentu**:
```typescript
interface LoginFormState {
  email: string;
  password: string;
  isLoading: boolean;
  error: string | null;
}

// Funkcje pomocnicze
mapSupabaseError(error: AuthError): string
handleSubmit(e: React.FormEvent): Promise<void>

// JSX
<form>
  <error alert />
  <email input />
  <password input />
  <submit button />
  <links to /register and /forgot-password />
</form>
```

**Wykorzystywane komponenty UI**:
- `Button` (shadcn/ui)
- `Input` (shadcn/ui)
- `Label` (shadcn/ui)

**Kontrakt z backendem**:
```typescript
// Wywołanie
authClient.auth.signInWithPassword({ email, password })

// Odpowiedź sukces
{
  data: { user, session },
  error: null
}

// Odpowiedź błąd
{
  data: { user: null, session: null },
  error: AuthError
}
```

**Mapowanie błędów**:
- `"Invalid login credentials"` → `"Nieprawidłowy email lub hasło"`
- `"Email not confirmed"` → `"Potwierdź swój adres email przed zalogowaniem"`
- `"network/connection"` → `"Brak połączenia z internetem"`
- Inne → `"Wystąpił błąd. Spróbuj ponownie"`

##### `ForgotPasswordForm.tsx`
**Status**: Do utworzenia  
**Lokalizacja**: `/src/components/ForgotPasswordForm.tsx`

**Odpowiedzialności**:
- Zarządzanie stanem formularza (email)
- Walidacja formatu email
- Wywołanie Supabase Auth API (`authClient.auth.resetPasswordForEmail()`)
- Obsługa błędów
- Wyświetlanie komunikatu sukcesu (sprawdź email)
- Link powrotu do logowania

**Struktura komponentu**:
```typescript
interface ForgotPasswordFormState {
  email: string;
  isLoading: boolean;
  error: string | null;
  success: boolean;
}

// Funkcje
handleSubmit(e: React.FormEvent): Promise<void>

// JSX
<form>
  <error/success alert />
  <email input />
  <submit button />
  <link to /login />
</form>
```

**Wykorzystywane komponenty UI**:
- `Button` (shadcn/ui)
- `Input` (shadcn/ui)
- `Label` (shadcn/ui)

**Kontrakt z backendem**:
```typescript
// Wywołanie
authClient.auth.resetPasswordForEmail(email, {
  redirectTo: `${window.location.origin}/reset-password`
})

// Odpowiedź (zawsze sukces, nawet dla nieistniejącego email - security best practice)
{
  data: {},
  error: null
}
```

**Komunikaty**:
- Sukces: `"Jeśli konto z tym adresem email istnieje, wysłaliśmy link do resetowania hasła"`
- Błąd sieci: `"Brak połączenia z internetem"`

##### `ResetPasswordForm.tsx`
**Status**: Do utworzenia  
**Lokalizacja**: `/src/components/ResetPasswordForm.tsx`

**Props**:
```typescript
interface ResetPasswordFormProps {
  token: string; // Token z URL przekazany z Astro
}
```

**Odpowiedzialności**:
- Zarządzanie stanem formularza (password, confirmPassword)
- Walidacja hasła (minimum 6 znaków, zgodność haseł)
- Wywołanie Supabase Auth API (`authClient.auth.updateUser()`)
- Obsługa błędów (nieprawidłowy/wygasły token, błędy sieci)
- Automatyczne przekierowanie do `/login` po sukcesie z komunikatem

**Struktura komponentu**:
```typescript
interface ResetPasswordFormState {
  password: string;
  confirmPassword: string;
  isLoading: boolean;
  error: string | null;
}

// Funkcje
validatePasswords(): boolean
handleSubmit(e: React.FormEvent): Promise<void>

// JSX
<form>
  <error alert />
  <password input />
  <confirmPassword input />
  <submit button />
</form>
```

**Wykorzystywane komponenty UI**:
- `Button` (shadcn/ui)
- `Input` (shadcn/ui)
- `Label` (shadcn/ui)

**Kontrakt z backendem**:
```typescript
// Wywołanie
authClient.auth.updateUser({ password: newPassword })

// Odpowiedź sukces
{
  data: { user },
  error: null
}

// Odpowiedź błąd
{
  data: { user: null },
  error: AuthError
}
```

**Mapowanie błędów**:
- `"Invalid or expired token"` → `"Link resetowania hasła wygasł. Wygeneruj nowy"`
- `"Password too short"` → `"Hasło musi mieć co najmniej 6 znaków"`
- Hasła się nie zgadzają (walidacja lokalna) → `"Hasła nie są identyczne"`

##### `UserMenu.tsx`
**Status**: Do utworzenia  
**Lokalizacja**: `/src/components/UserMenu.tsx`

**Props**:
```typescript
interface UserMenuProps {
  userEmail: string;
}
```

**Odpowiedzialności**:
- Wyświetlanie menu użytkownika w nawigacji
- Pokazanie adresu email zalogowanego użytkownika
- Link do strony ustawień/profilu
- Przycisk wylogowania
- Wywołanie Supabase Auth API (`authClient.auth.signOut()`)
- Przekierowanie do `/` po wylogowaniu

**Struktura komponentu**:
```typescript
// Stan
const [isOpen, setIsOpen] = useState(false);
const [isLoggingOut, setIsLoggingOut] = useState(false);

// Funkcje
handleSignOut(): Promise<void>

// JSX
<dropdown menu>
  <trigger button with email />
  <menu items>
    <item: email display />
    <divider />
    <item: link to /profile (ustawienia) />
    <item: logout button />
  </menu>
</dropdown>
```

**Wykorzystywane komponenty UI**:
- `Button` (shadcn/ui)
- `DropdownMenu` (shadcn/ui - do dodania jeśli nieobecne)

**Kontrakt z backendem**:
```typescript
// Wywołanie
authClient.auth.signOut()

// Odpowiedź
{
  error: null
}
```

##### `ChangePasswordForm.tsx`
**Status**: Do utworzenia  
**Lokalizacja**: `/src/components/ChangePasswordForm.tsx`

**Odpowiedzialności**:
- Zarządzanie stanem formularza (currentPassword, newPassword, confirmPassword)
- Walidacja hasła (minimum 6 znaków, zgodność nowego hasła z potwierdzeniem)
- Weryfikacja obecnego hasła przez re-authentication
- Wywołanie Supabase Auth API (`authClient.auth.updateUser()`)
- Obsługa błędów (nieprawidłowe obecne hasło, błędy sieci)
- Wyświetlanie komunikatu sukcesu

**Struktura komponentu**:
```typescript
interface ChangePasswordFormState {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  isLoading: boolean;
  error: string | null;
  success: boolean;
}

// Funkcje
validatePasswords(): boolean
verifyCurrentPassword(): Promise<boolean>
handleSubmit(e: React.FormEvent): Promise<void>

// JSX
<form>
  <error/success alert />
  <currentPassword input />
  <newPassword input />
  <confirmPassword input />
  <submit button />
</form>
```

**Wykorzystywane komponenty UI**:
- `Button` (shadcn/ui)
- `Input` (shadcn/ui)
- `Label` (shadcn/ui)

**Kontrakt z backendem**:
```typescript
// Weryfikacja obecnego hasła (re-authentication)
authClient.auth.signInWithPassword({ 
  email: user.email, 
  password: currentPassword 
})

// Aktualizacja hasła
authClient.auth.updateUser({ password: newPassword })

// Odpowiedź sukces
{
  data: { user },
  error: null
}

// Odpowiedź błąd
{
  data: { user: null },
  error: AuthError
}
```

**Mapowanie błędów**:
- Nieprawidłowe obecne hasło → `"Nieprawidłowe obecne hasło"`
- `"Password too short"` → `"Nowe hasło musi mieć co najmniej 6 znaków"`
- Hasła się nie zgadzają (walidacja lokalna) → `"Nowe hasła nie są identyczne"`
- Nowe hasło takie samo jak obecne → `"Nowe hasło musi być inne niż obecne"`

**Komunikat sukcesu**:
- `"Hasło zostało zmienione pomyślnie"`

##### `DeleteAccountButton.tsx`
**Status**: Do utworzenia  
**Lokalizacja**: `/src/components/DeleteAccountButton.tsx`

**Odpowiedzialności**:
- Wyświetlanie przycisku usuwania konta
- Otwarcie modala z potwierdzeniem
- Wymaganie wpisania hasła lub tekstu potwierdzającego ("USUŃ KONTO")
- Wywołanie endpointu API `DELETE /api/users/me`
- Obsługa błędów (nieprawidłowe hasło, błędy sieci)
- Automatyczne wylogowanie i przekierowanie po sukcesie

**Struktura komponentu**:
```typescript
interface DeleteAccountButtonState {
  isModalOpen: boolean;
  confirmText: string;
  password: string;
  isDeleting: boolean;
  error: string | null;
}

// Funkcje
openModal(): void
closeModal(): void
handleDelete(): Promise<void>
validateConfirmation(): boolean

// JSX
<>
  <danger button to open modal />
  <modal>
    <warning message />
    <confirm text input (type "USUŃ KONTO") />
    <password input />
    <error alert />
    <actions: cancel + delete buttons />
  </modal>
</>
```

**Wykorzystywane komponenty UI**:
- `Button` (shadcn/ui)
- `Dialog` (shadcn/ui)
- `Input` (shadcn/ui)
- `Label` (shadcn/ui)

**Kontrakt z backendem**:
```typescript
// Wywołanie
fetch('/api/users/me', {
  method: 'DELETE',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ password })
})

// Odpowiedź sukces
{
  message: "Account deleted successfully"
}

// Odpowiedź błąd
{
  error: "Invalid password" | "Failed to delete account"
}
```

**Mapowanie błędów**:
- `"Invalid password"` → `"Nieprawidłowe hasło"`
- `"Failed to delete account"` → `"Nie udało się usunąć konta. Spróbuj ponownie"`
- Brak połączenia → `"Brak połączenia z internetem"`

#### 2.1.3. Layout i nawigacja

##### `Layout.astro`
**Status**: Zaimplementowany  
**Wymagane zmiany**: Dodanie nawigacji warunkowej dla użytkowników auth/non-auth

**Zmiany struktury**:
```astro
---
// Odczyt użytkownika z locals
const { user } = Astro.locals;
const currentPath = Astro.url.pathname;
---

<!doctype html>
<html>
  <head>...</head>
  <body>
    {user ? (
      <nav>
        <!-- Nawigacja dla zalogowanych -->
        <a href="/generate">Generuj fiszki</a>
        <UserMenu client:load userEmail={user.email} />
      </nav>
    ) : (
      <nav>
        <!-- Nawigacja dla niezalogowanych -->
        <a href="/">Strona główna</a>
        <a href="/login">Logowanie</a>
        <a href="/register">Rejestracja</a>
      </nav>
    )}
    
    <slot />
  </body>
</html>
```

**Odpowiedzialności**:
- Warunkowe renderowanie nawigacji w zależności od stanu uwierzytelnienia
- Przekazanie danych użytkownika do komponentu UserMenu
- Zachowanie istniejącej struktury HTML i stylów

### 2.2. Walidacja i komunikaty błędów

#### 2.2.1. Walidacja po stronie klienta (React)

**Rejestracja (RegisterForm)**:
- Email: niepusty, format email (HTML5 validation + React state)
- Hasło: minimum 6 znaków (walidowane przed wysłaniem)

**Logowanie (LoginForm)**:
- Email: niepusty, format email
- Hasło: niepuste

**Resetowanie hasła (ResetPasswordForm)**:
- Hasło: minimum 6 znaków
- Potwierdzenie hasła: musi być identyczne z hasłem

**Odzyskiwanie hasła (ForgotPasswordForm)**:
- Email: niepusty, format email

#### 2.2.2. Komunikaty błędów w języku polskim

**RegisterForm**:
- `"Ten adres email jest już zajęty"` - duplikat email
- `"Hasło musi mieć co najmniej 6 znaków"` - za krótkie hasło
- `"Wprowadź prawidłowy adres email"` - nieprawidłowy format
- `"Brak połączenia z internetem. Sprawdź połączenie i spróbuj ponownie"` - błąd sieci
- `"Wystąpił błąd. Spróbuj ponownie"` - nieznany błąd

**LoginForm**:
- `"Nieprawidłowy email lub hasło"` - błędne credentials
- `"Potwierdź swój adres email przed zalogowaniem"` - email niepotwierdzony
- `"Brak połączenia z internetem"` - błąd sieci
- `"Wystąpił błąd. Spróbuj ponownie"` - nieznany błąd

**ResetPasswordForm**:
- `"Link resetowania hasła wygasł. Wygeneruj nowy"` - token wygasły
- `"Hasło musi mieć co najmniej 6 znaków"` - za krótkie hasło
- `"Hasła nie są identyczne"` - niezgodność haseł
- `"Wystąpił błąd. Spróbuj ponownie"` - nieznany błąd

**Komunikaty sukcesu**:
- Rejestracja: `"Konto zostało utworzone. Sprawdź email i potwierdź adres."` (jeśli wymagana weryfikacja)
- Reset hasła: `"Jeśli konto z tym adresem email istnieje, wysłaliśmy link do resetowania hasła"`
- Nowe hasło: `"Hasło zostało zmienione. Możesz się teraz zalogować"` (alert przed przekierowaniem)

#### 2.2.3. Obsługa stanów UI

**Loading states**:
- Przycisk submit z spinner (Loader2 icon z lucide-react)
- Tekst: "Rejestrowanie...", "Logowanie...", "Wysyłanie...", "Ustawianie hasła..."
- Wyłączenie pól formularza podczas ładowania

**Disabled states**:
- Przycisk submit nieaktywny gdy:
  - Formularz jest nieprawidłowy (walidacja)
  - Trwa operacja (isLoading)

**Focus management**:
- Automatyczny focus na pierwszym polu formularza
- Zachowanie focus po błędach

### 2.3. Najważniejsze scenariusze użytkownika

#### 2.3.1. Rejestracja nowego użytkownika (Happy Path)

1. Użytkownik odwiedza `/register`
2. Middleware sprawdza sesję - brak zalogowanego użytkownika
3. Renderowanie strony z formularzem rejestracji
4. Użytkownik wpisuje email i hasło (min. 6 znaków)
5. Kliknięcie "Zarejestruj się"
6. Walidacja po stronie klienta (React)
7. Wywołanie `authClient.auth.signUp()` → Supabase
8. Supabase tworzy konto i sesję
9. **PRZYPADEK A**: Jeśli weryfikacja email wyłączona (dev):
   - Automatyczne zalogowanie
   - Przekierowanie do `/generate`
10. **PRZYPADEK B**: Jeśli weryfikacja email włączona (prod):
    - Alert: "Sprawdź email i potwierdź adres"
    - Użytkownik pozostaje na stronie `/register`
    - Użytkownik klika link w emailu
    - Link aktywuje konto w Supabase
    - Przekierowanie do `/login`

#### 2.3.2. Logowanie użytkownika (Happy Path)

1. Użytkownik odwiedza `/login`
2. Middleware sprawdza sesję - brak zalogowanego użytkownika
3. Renderowanie strony z formularzem logowania
4. Użytkownik wpisuje email i hasło
5. Kliknięcie "Zaloguj się"
6. Wywołanie `authClient.auth.signInWithPassword()` → Supabase
7. Supabase weryfikuje credentials i tworzy sesję
8. Cookie sesyjne zapisywane w przeglądarce (automatycznie przez Supabase)
9. Przekierowanie do `/generate`
10. Middleware przy następnym requestcie wykrywa sesję w cookie
11. Użytkownik widzi chroniony widok `/generate`

#### 2.3.3. Odzyskiwanie hasła (Happy Path)

1. Użytkownik odwiedza `/login`
2. Kliknięcie linka "Zapomniałeś hasła?"
3. Przekierowanie do `/forgot-password`
4. Użytkownik wpisuje email
5. Kliknięcie "Wyślij link resetujący"
6. Wywołanie `authClient.auth.resetPasswordForEmail()` → Supabase
7. Komunikat: "Sprawdź email"
8. Supabase wysyła email z linkiem zawierającym token
9. Użytkownik klika link w emailu
10. Przekierowanie do `/reset-password?token=abc123`
11. Strona odczytuje token z URL i przekazuje do komponentu
12. Użytkownik wpisuje nowe hasło (2x)
13. Kliknięcie "Zmień hasło"
14. Wywołanie `authClient.auth.updateUser()` → Supabase
15. Supabase aktualizuje hasło
16. Alert: "Hasło zostało zmienione"
17. Przekierowanie do `/login`
18. Użytkownik loguje się nowym hasłem

#### 2.3.4. Wylogowanie użytkownika (Happy Path)

1. Użytkownik jest zalogowany na `/generate`
2. W nawigacji widzi UserMenu z emailem
3. Kliknięcie menu → "Wyloguj się"
4. Wywołanie `authClient.auth.signOut()` → Supabase
5. Supabase usuwa sesję i cookie
6. Przekierowanie do `/`
7. Middleware przy następnym requestcie nie wykrywa sesji
8. Użytkownik widzi stronę główną (non-auth view)

#### 2.3.5. Zmiana hasła (zalogowany użytkownik) (Happy Path)

1. Użytkownik jest zalogowany
2. Klika UserMenu → "Ustawienia" (lub przechodzi do `/profile`)
3. Na stronie profilu widzi sekcję "Zmiana hasła"
4. Wpisuje obecne hasło
5. Wpisuje nowe hasło (2x)
6. Kliknięcie "Zmień hasło"
7. Walidacja po stronie klienta (zgodność haseł, min. 6 znaków)
8. Wywołanie `authClient.auth.signInWithPassword()` → weryfikacja obecnego hasła
9. Jeśli weryfikacja OK → wywołanie `authClient.auth.updateUser({ password })` → Supabase
10. Supabase aktualizuje hasło
11. Alert: "Hasło zostało zmienione pomyślnie"
12. Formularz czyszczony
13. Użytkownik pozostaje zalogowany (sesja aktywna)

#### 2.3.6. Usuwanie konta użytkownika (Happy Path)

1. Użytkownik jest zalogowany na `/profile`
2. Przewija do sekcji "Usuwanie konta"
3. Kliknięcie przycisku "Usuń konto"
4. Otwiera się modal z ostrzeżeniem
5. Użytkownik wpisuje "USUŃ KONTO" w polu tekstowym
6. Użytkownik wpisuje swoje hasło
7. Kliknięcie "Potwierdź usunięcie"
8. Wywołanie `DELETE /api/users/me` → Backend
9. Backend weryfikuje hasło
10. Backend usuwa wszystkie dane użytkownika (fiszki, requesty, eventy)
11. Backend usuwa konto z Supabase Auth
12. Sukces → automatyczne wylogowanie
13. Przekierowanie do `/` z komunikatem "Konto zostało usunięte"

#### 2.3.7. Próba dostępu do chronionego zasobu bez logowania

1. Użytkownik (niezalogowany) próbuje odwiedzić `/generate`
2. Middleware sprawdza sesję - brak
3. Logika SSR w `generate.astro` wykrywa brak użytkownika
4. Przekierowanie do `/login`
5. Po zalogowaniu → przekierowanie z powrotem do `/generate`

#### 2.3.8. Błędne logowanie (Unhappy Path)

1. Użytkownik odwiedza `/login`
2. Wpisuje nieprawidłowy email lub hasło
3. Kliknięcie "Zaloguj się"
4. Wywołanie `authClient.auth.signInWithPassword()` → Supabase
5. Supabase zwraca błąd: "Invalid login credentials"
6. Komponent mapuje błąd na user-friendly message
7. Wyświetlenie: "Nieprawidłowy email lub hasło"
8. Użytkownik pozostaje na `/login` z możliwością ponowienia

---

## 3. LOGIKA BACKENDOWA

### 3.1. Middleware autentykacji

#### 3.1.1. `/src/middleware/index.ts`
**Status**: Zaimplementowany z zakomentowaną logiką auth  
**Wymagane zmiany**: Odkomentowanie i modyfikacja logiki sesji

**Odpowiedzialności**:
- Odczytywanie cookie sesyjnego z każdego requestu
- Weryfikacja sesji z Supabase
- Zapisanie danych użytkownika w `context.locals.user`
- Udostępnienie klienta Supabase w `context.locals.supabase`
- Opcjonalna ochrona ścieżek API przed nieautoryzowanym dostępem

**Implementacja docelowa**:
```typescript
import { defineMiddleware } from "astro:middleware";
import { supabaseClient } from "../db/supabase.client";

export const onRequest = defineMiddleware(async (context, next) => {
  // Zawsze udostępnij klienta Supabase
  context.locals.supabase = supabaseClient;
  
  // Odczytaj token sesyjny z cookies
  const accessToken = context.cookies.get('sb-access-token')?.value;
  const refreshToken = context.cookies.get('sb-refresh-token')?.value;
  
  // Jeśli istnieje token, zweryfikuj sesję
  if (accessToken && refreshToken) {
    const { data: { user }, error } = await supabaseClient.auth.getUser(accessToken);
    
    if (!error && user) {
      // Użytkownik uwierzytelniony
      context.locals.user = user;
    } else {
      // Token nieprawidłowy - usuń cookies
      context.cookies.delete('sb-access-token');
      context.cookies.delete('sb-refresh-token');
      context.locals.user = null;
    }
  } else {
    context.locals.user = null;
  }
  
  // Ochrona API routes (opcjonalnie)
  if (context.url.pathname.startsWith("/api/")) {
    // Większość endpointów wymaga autentykacji
    const publicEndpoints = []; // Brak publicznych API endpoints
    const isPublicEndpoint = publicEndpoints.some(
      endpoint => context.url.pathname.startsWith(endpoint)
    );
    
    if (!isPublicEndpoint && !context.locals.user) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "Authentication required",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }
  
  return next();
});
```

**Kontrakt z Astro Locals**:
```typescript
// src/env.d.ts
interface Locals {
  supabase: SupabaseClient<Database>;
  user: User | null;
}
```

**Obsługa cookies**:
- Cookies zarządzane automatycznie przez Supabase JS Client
- Nazwy cookies: `sb-access-token`, `sb-refresh-token`
- Atrybuty: `HttpOnly`, `Secure` (w prod), `SameSite=Lax`
- TTL: zgodnie z konfiguracją Supabase (domyślnie 1h dla access, 30 dni dla refresh)

### 3.2. Klienty Supabase

#### 3.2.1. `/src/db/auth.client.ts` - Client-side Auth Client
**Status**: Zaimplementowany  
**Wymagane zmiany**: Brak

**Konfiguracja**:
```typescript
export const authClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,     // Automatyczne odświeżanie tokenu
    persistSession: true,        // Zapisywanie sesji w localStorage
    detectSessionInUrl: true,    // Wykrywanie tokenu w URL (callback OAuth)
  },
});
```

**Wykorzystanie**:
- Wyłącznie w komponentach React po stronie klienta
- Metody: `signUp()`, `signInWithPassword()`, `signOut()`, `resetPasswordForEmail()`, `updateUser()`

**Bezpieczeństwo**:
- Używa `PUBLIC_SUPABASE_ANON_KEY` - bezpieczny do ekspozycji w przeglądarce
- Row-Level Security (RLS) w bazie danych chroni przed nieautoryzowanym dostępem

#### 3.2.2. `/src/db/supabase.client.ts` - Server-side Client
**Status**: Zaimplementowany  
**Wymagane zmiany**: Brak bezpośrednich, ale weryfikacja konfiguracji

**Konfiguracja**:
```typescript
export const supabaseClient = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,    // Middleware zarządza tokenami
    persistSession: false        // Sesja w cookies, nie w client
  }
});
```

**Wykorzystanie**:
- W middleware Astro
- W endpointach API (poprzez `context.locals.supabase`)
- W stronach SSR (poprzez `Astro.locals.supabase`)

**Bezpieczeństwo**:
- Używa klucza `SUPABASE_SERVICE_ROLE_KEY` (jeśli dostępny) lub `SUPABASE_KEY`
- Działa po stronie serwera - nigdy nie eksponowany w przeglądarce

### 3.3. Endpointy API

#### 3.3.1. Istniejące endpointy - wymagane zmiany

Wszystkie istniejące endpointy wymagają zapewnienia, że działają z uwierzytelnionym użytkownikiem:

**`/src/pages/api/cards.ts`** - GET, POST
- Odczyt `user` z `context.locals`
- Operacje bazodanowe z filtrem `user_id = user.id`
- Middleware automatycznie blokuje nieautoryzowane requesty

**`/src/pages/api/cards/[id].ts`** - GET, PATCH, DELETE
- Odczyt `user` z `context.locals`
- Weryfikacja własności zasobu: `card.user_id === user.id` przed operacją
- Zwrot 403 Forbidden jeśli użytkownik nie jest właścicielem

**`/src/pages/api/generation-requests.ts`** - POST
- Odczyt `user` z `context.locals`
- Zapisanie `user_id` w generation_request

**Wspólny pattern zabezpieczenia endpointów**:
```typescript
export const POST: APIRoute = async ({ locals, request }) => {
  const user = locals.user;
  
  // Middleware już weryfikuje autentykację dla /api/*, ale double-check
  if (!user) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401 }
    );
  }
  
  // Logika endpointu z user.id
  // ...
};
```

#### 3.3.2. Nowe endpointy (opcjonalnie, jeśli wymagane)

**`/src/pages/api/auth/session.ts`** - GET
**Cel**: Endpoint do weryfikacji sesji z client-side (jeśli potrzebny)

```typescript
export const GET: APIRoute = async ({ locals }) => {
  const user = locals.user;
  
  if (!user) {
    return new Response(
      JSON.stringify({ authenticated: false }),
      { status: 200 }
    );
  }
  
  return new Response(
    JSON.stringify({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
      }
    }),
    { status: 200 }
  );
};
```

**Status**: Opcjonalny - nie wymagany w MVP, ponieważ SSR obsługuje sprawdzanie sesji

### 3.4. Walidacja danych wejściowych

#### 3.4.1. Schematy Zod (opcjonalne dla autentykacji)

Autentykacja korzysta z wbudowanej walidacji Supabase, ale dla spójności z resztą aplikacji można dodać schematy:

**`/src/lib/schemas/auth.schema.ts`** (do utworzenia, opcjonalnie):
```typescript
import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});
```

**Wykorzystanie**: Walidacja po stronie komponentów React przed wysłaniem do Supabase

### 3.5. Obsługa wyjątków

#### 3.5.1. Błędy autentykacji

**Typy błędów z Supabase Auth**:
- `AuthApiError` - błędy API (400, 401, 422)
- `AuthRetryableError` - błędy przejściowe (5xx, timeout)
- `AuthUnknownError` - nieznane błędy

**Pattern obsługi w komponentach React**:
```typescript
try {
  const { data, error } = await authClient.auth.signUp({ email, password });
  
  if (error) {
    // Mapowanie błędów Supabase na user-friendly messages
    setError(mapSupabaseError(error));
    return;
  }
  
  // Sukces
} catch (err) {
  // Nieoczekiwane błędy (sieć, itp.)
  setError("Wystąpił błąd. Spróbuj ponownie");
}
```

#### 3.5.2. Błędy middleware

**Scenariusze błędów**:
- Brak konfiguracji Supabase (env vars) → 500 Internal Server Error
- Błąd połączenia z Supabase → User pozostaje niezalogowany (graceful degradation)
- Nieprawidłowy token w cookie → Usunięcie cookie, user jako niezalogowany

**Pattern obsługi**:
```typescript
try {
  const { data: { user }, error } = await supabaseClient.auth.getUser(accessToken);
  // ...
} catch (err) {
  // Błąd połączenia - graceful degradation
  console.error('Supabase auth error:', err);
  context.locals.user = null;
}
```

### 3.6. Aktualizacja renderowania server-side

#### 3.6.1. Hybrid rendering z ochroną tras

Aplikacja jest w pełni SSR (`output: "server"` w `astro.config.mjs`), więc każdy request przechodzi przez middleware.

**Pattern ochrony strony**:
```astro
---
// src/pages/protected-page.astro
const { user } = Astro.locals;

if (!user) {
  return Astro.redirect('/login');
}
---

<Layout>
  <!-- Chroniona treść -->
</Layout>
```

**Strony do ochrony**:
- `/src/pages/generate.astro` - generowanie fiszek (główna funkcjonalność)

**Strony publiczne** (nie wymagają autentykacji):
- `/src/pages/index.astro` - landing page
- `/src/pages/login.astro` - logowanie
- `/src/pages/register.astro` - rejestracja
- `/src/pages/forgot-password.astro` - reset hasła
- `/src/pages/reset-password.astro` - nowe hasło

**Przekierowania dla zalogowanych użytkowników**:
```astro
---
// Strony logowania/rejestracji
const { user } = Astro.locals;

if (user) {
  // Zalogowany użytkownik nie powinien widzieć formularzy auth
  return Astro.redirect('/generate');
}
---
```

#### 3.6.2. Dane użytkownika w SSR

**Przekazywanie danych do komponentów React**:
```astro
---
const { user } = Astro.locals;
---

<Layout>
  <GenerateView 
    client:load 
    userId={user.id} 
    userEmail={user.email} 
  />
</Layout>
```

**Conditional rendering w Astro**:
```astro
{user ? (
  <AuthenticatedNav user={user} />
) : (
  <PublicNav />
)}
```

---

## 4. SYSTEM AUTENTYKACJI

### 4.1. Integracja Supabase Auth z Astro

#### 4.1.1. Architektura przepływu autentykacji

```
┌─────────────────┐
│   Przeglądarka  │
└────────┬────────┘
         │
         │ 1. Request (z cookie sesyjnym)
         ▼
┌─────────────────────────┐
│   Astro Middleware      │
│  - Odczyt cookies       │
│  - Weryfikacja z        │
│    Supabase Auth        │
│  - Ustawienie locals    │
└────────┬────────────────┘
         │
         │ 2. context.locals.user
         ▼
┌─────────────────────────┐
│   Astro SSR Page        │
│  - Ochrona tras         │
│  - Conditional render   │
│  - Props do React       │
└────────┬────────────────┘
         │
         │ 3. HTML z hydration
         ▼
┌─────────────────────────┐
│  React Components       │
│  (client:load)          │
│  - Formularze auth      │
│  - authClient calls     │
└─────────────────────────┘
         │
         │ 4. Auth API calls
         ▼
┌─────────────────────────┐
│   Supabase Auth         │
│  - signUp               │
│  - signIn               │
│  - signOut              │
│  - resetPassword        │
└─────────────────────────┘
```

#### 4.1.2. Zarządzanie sesjami

**Cykl życia sesji**:

1. **Utworzenie sesji** (signUp / signIn):
   - Supabase generuje access token (JWT, 1h) i refresh token (30 dni)
   - Tokeny zapisywane w cookies przez Supabase JS Client
   - Cookie names: `sb-access-token`, `sb-refresh-token`
   - Attributes: `HttpOnly`, `Secure`, `SameSite=Lax`

2. **Weryfikacja sesji** (każdy request):
   - Middleware odczytuje cookies
   - Wywołanie `supabaseClient.auth.getUser(accessToken)`
   - Jeśli token ważny → `context.locals.user = user`
   - Jeśli token nieważny → usunięcie cookies

3. **Odświeżanie tokenu** (automatyczne):
   - authClient z `autoRefreshToken: true`
   - Przed wygaśnięciem access tokenu (1h), client automatycznie odświeża
   - Używa refresh tokenu do uzyskania nowego access tokenu
   - Aktualizuje cookies

4. **Zakończenie sesji** (signOut):
   - Wywołanie `authClient.auth.signOut()`
   - Supabase unieważnia sesję
   - Usunięcie cookies
   - Przekierowanie do `/`

#### 4.1.3. Bezpieczeństwo sesji

**Ochrona przed atakami**:

- **XSS (Cross-Site Scripting)**:
  - Tokeny w cookies `HttpOnly` - niedostępne dla JavaScript
  - React automatycznie sanityzuje output

- **CSRF (Cross-Site Request Forgery)**:
  - `SameSite=Lax` na cookies
  - Supabase weryfikuje origin requestów

- **Session Fixation**:
  - Nowa sesja generowana przy każdym logowaniu
  - Stare tokeny unieważniane przy zmianie hasła

- **Token Leakage**:
  - Tokeny przesyłane tylko przez HTTPS w produkcji
  - Short-lived access tokens (1h)

**Best practices**:
- Nigdy nie logować tokenów
- Używać `SUPABASE_SERVICE_ROLE_KEY` tylko server-side
- Regularnie rotować refresh tokeny
- Implementacja rate limiting na endpointach auth (Supabase ma wbudowane)

### 4.2. Rejestracja użytkownika

#### 4.2.1. Przepływ rejestracji

```
User                  RegisterForm         authClient         Supabase
  │                        │                    │                 │
  ├─ Wypełnia formularz ──▶│                    │                 │
  │                        │                    │                 │
  ├─ Submit ───────────────▶│                    │                 │
  │                        │                    │                 │
  │                        ├─ Walidacja (JS) ──▶│                 │
  │                        │                    │                 │
  │                        ├─ signUp() ─────────▶│                 │
  │                        │                    │                 │
  │                        │                    ├─ POST /auth/v1/signup ─▶│
  │                        │                    │                 │
  │                        │                    │                 ├─ Tworzy konto
  │                        │                    │                 ├─ Wysyła email (opcj.)
  │                        │                    │                 ├─ Generuje sesję
  │                        │                    │                 │
  │                        │                    │◀─ {user, session} ──────┤
  │                        │                    │                 │
  │                        │◀─ Success ─────────┤                 │
  │                        │                    │                 │
  │◀─ Redirect /generate ──┤                    │                 │
```

#### 4.2.2. Konfiguracja Supabase Auth

**Wymagane ustawienia w Supabase Dashboard**:

1. **Email Templates** (Settings → Auth → Email Templates):
   - Confirm signup: Email weryfikacyjny z linkiem aktywacyjnym
   - Reset password: Email z linkiem do resetowania hasła

2. **URL Configuration** (Settings → Auth → URL Configuration):
   - Site URL: `https://yourdomain.com` (produkcja)
   - Redirect URLs: 
     - `http://localhost:3000/reset-password` (dev)
     - `https://yourdomain.com/reset-password` (prod)

3. **Auth Providers** (Settings → Auth → Providers):
   - Email: Enabled
   - Confirm email: Disabled dla dev, Enabled dla prod
   - Secure password: Minimum 6 characters (domyślnie)

4. **Security** (Settings → Auth → Security):
   - Rate limiting: Enabled (domyślnie: 4 requesty/h dla reset password)

#### 4.2.3. Walidacja i weryfikacja

**Walidacje po stronie Supabase**:
- Email: format, unikalność
- Hasło: długość (min. 6 znaków), złożoność (opcjonalnie)

**Weryfikacja email**:
- **Development**: Wyłączona (Confirm email: Disabled)
  - Użytkownik od razu zalogowany po rejestracji
  - Natychmiastowe przekierowanie do `/generate`

- **Production**: Włączona (Confirm email: Enabled)
  - Użytkownik musi kliknąć link w emailu
  - Link zawiera token: `https://domain.com/auth/confirm?token=xxx`
  - Supabase automatycznie obsługuje potwierdzenie
  - Po kliknięciu → przekierowanie do Site URL lub custom redirect

### 4.3. Logowanie użytkownika

#### 4.3.1. Przepływ logowania

```
User                  LoginForm           authClient         Supabase         Middleware
  │                       │                   │                 │                 │
  ├─ Odwiedza /login ─────▶│                   │                 │                 │
  │                       │                   │                 │                 │
  ├─ Wypełnia formularz ──▶│                   │                 │                 │
  │                       │                   │                 │                 │
  ├─ Submit ──────────────▶│                   │                 │                 │
  │                       │                   │                 │                 │
  │                       ├─ signInWithPassword() ─────────────▶│                 │
  │                       │                   │                 │                 │
  │                       │                   │                 ├─ Weryfikuje     │
  │                       │                   │                 ├─ Generuje sesję │
  │                       │                   │                 ├─ Zwraca tokeny  │
  │                       │                   │                 │                 │
  │                       │                   │◀─ {user, session} ───────────────┤
  │                       │                   │                 │                 │
  │                       │                   ├─ Zapisuje cookies ────────────────▶│
  │                       │                   │                 │                 │
  │                       │◀─ Success ────────┤                 │                 │
  │                       │                   │                 │                 │
  │◀─ Redirect /generate ─┤                   │                 │                 │
  │                       │                   │                 │                 │
  ├─ GET /generate ───────┴───────────────────┴─────────────────┴────────────────▶│
  │                                                                                │
  │                                                             ├─ Odczyt cookies  │
  │                                                             ├─ Weryfikacja     │
  │                                                             ├─ locals.user = X │
  │                                                                                │
  │◀─ Renderuje chroniony widok ───────────────────────────────────────────────────┤
```

#### 4.3.2. Obsługa błędów logowania

**Główne przypadki błędów**:

1. **Nieprawidłowe credentials**:
   - Error: `"Invalid login credentials"`
   - User message: `"Nieprawidłowy email lub hasło"`
   - Action: Pozostanie na `/login`, możliwość ponowienia

2. **Email niepotwierdzony** (jeśli weryfikacja włączona):
   - Error: `"Email not confirmed"`
   - User message: `"Potwierdź swój adres email przed zalogowaniem"`
   - Action: Link "Wyślij ponownie email potwierdzający"

3. **Konto zablokowane** (po wielu nieudanych próbach):
   - Error: `"Account locked"`
   - User message: `"Konto tymczasowo zablokowane. Spróbuj ponownie za 1 godzinę"`

4. **Błąd sieci**:
   - Error: Network/connection error
   - User message: `"Brak połączenia z internetem"`
   - Action: Możliwość ponowienia

### 4.4. Wylogowanie użytkownika

#### 4.4.1. Przepływ wylogowania

```
User              UserMenu           authClient         Supabase         Browser
  │                   │                   │                 │              │
  ├─ Klika "Wyloguj"─▶│                   │                 │              │
  │                   │                   │                 │              │
  │                   ├─ signOut() ───────▶│                 │              │
  │                   │                   │                 │              │
  │                   │                   ├─ POST /auth/v1/logout ────────▶│
  │                   │                   │                 │              │
  │                   │                   │                 ├─ Unieważnia sesję
  │                   │                   │                 │              │
  │                   │                   │◀─ Success ──────┤              │
  │                   │                   │                 │              │
  │                   │                   ├─ Usuwa cookies ────────────────▶│
  │                   │                   │                 │              │
  │                   │◀─ Success ────────┤                 │              │
  │                   │                   │                 │              │
  │◀─ Redirect / ─────┤                   │                 │              │
```

#### 4.4.2. Czyszczenie sesji

**Operacje przy wylogowaniu**:
1. Wywołanie `authClient.auth.signOut()`
2. Supabase unieważnia refresh token w bazie
3. Usunięcie cookies: `sb-access-token`, `sb-refresh-token`
4. Przekierowanie do `/` (strona główna)
5. Middleware przy kolejnym requestcie nie wykrywa sesji → `locals.user = null`

**Typy wylogowania**:
- **Local** (domyślne): Usuwa sesję tylko w tej przeglądarce
- **Global**: Usuwa wszystkie sesje użytkownika na wszystkich urządzeniach (Supabase ma to wbudowane)

### 4.5. Zmiana hasła (Password Change - US-009)

#### 4.5.1. Przepływ zmiany hasła

**Wymaganie**: Użytkownik MUSI być zalogowany i ZNAĆ swoje obecne hasło.

```
User             ChangePasswordForm      authClient         Supabase
  │                       │                   │                │
  ├─ Odwiedza /profile ──▶│                   │                │
  │                       │                   │                │
  ├─ Wypełnia formularz ──▶│                   │                │
  │  (current, new, confirm)                  │                │
  │                       │                   │                │
  ├─ Submit ──────────────▶│                   │                │
  │                       │                   │                │
  │                       ├─ Walidacja (JS) ──▶│                │
  │                       │                   │                │
  │                       ├─ signInWithPassword(email, currentPw) ─▶│
  │                       │                   │                │
  │                       │                   │                ├─ Weryfikuje
  │                       │                   │                │   obecne hasło
  │                       │                   │                │
  │                       │                   │◀─ Success/Fail ┤
  │                       │                   │                │
  │                       ├─ Jeśli OK: updateUser({password: newPw}) ─▶│
  │                       │                   │                │
  │                       │                   │                ├─ Aktualizuje
  │                       │                   │                │   hasło
  │                       │                   │                │
  │                       │                   │◀─ Success ─────┤
  │                       │                   │                │
  │                       │◀─ Success ────────┤                │
  │                       │                   │                │
  │◀─ "Hasło zmienione" ──┤                   │                │
  │  (pozostaje zalogowany)                   │                │
```

#### 4.5.2. Bezpieczeństwo zmiany hasła

**Weryfikacja dwuetapowa**:
1. **Re-authentication**: Najpierw weryfikujemy obecne hasło przez `signInWithPassword()`
2. **Aktualizacja**: Dopiero po pomyślnej weryfikacji wywołujemy `updateUser()`

**Powody weryfikacji obecnego hasła**:
- Ochrona przed nieautoryzowaną zmianą hasła (np. gdy użytkownik zostawił komputer bez blokady)
- Best practice bezpieczeństwa
- Zgodność z standardami uwierzytelniania

**Walidacje**:
- Obecne hasło: niepuste, prawidłowe (weryfikowane przez Supabase)
- Nowe hasło: minimum 6 znaków
- Potwierdzenie nowego hasła: musi być identyczne z nowym hasłem
- Nowe hasło: musi być różne od obecnego hasła (opcjonalnie, walidacja kliencka)

**Komunikaty błędów**:
- Nieprawidłowe obecne hasło → `"Nieprawidłowe obecne hasło"`
- Nowe hasło za krótkie → `"Nowe hasło musi mieć co najmniej 6 znaków"`
- Hasła się nie zgadzają → `"Nowe hasła nie są identyczne"`
- Nowe hasło takie samo jak obecne → `"Nowe hasło musi być inne niż obecne"`

**Sesja po zmianie hasła**:
- Użytkownik **pozostaje zalogowany** (nie wymaga ponownego logowania)
- Sesja nie jest unieważniana
- To jest różnica względem resetu hasła, gdzie wszystkie sesje są unieważniane

### 4.6. Odzyskiwanie hasła (Forgot Password - US-011)

**UWAGA**: To jest funkcja "forgot password" (reset hasła przez email) dla użytkowników, którzy NIE PAMIĘTAJĄ swojego hasła. Jest to **INNA** funkcja niż US-009 (zmiana hasła), która jest dla zalogowanych użytkowników, którzy ZNAJĄ swoje obecne hasło.

**Różnice**:
- **Reset hasła (forgot password - US-011)**: Użytkownik nie pamięta hasła → otrzymuje link resetujący na email → ustawia nowe hasło
- **Zmiana hasła (password change - US-009)**: Zalogowany użytkownik zna obecne hasło → wpisuje obecne i nowe hasło → zmienia hasło

#### 4.6.1. Przepływ odzyskiwania hasła

**Krok 1: Żądanie resetu**

```
User                ForgotPasswordForm    authClient         Supabase
  │                        │                   │                 │
  ├─ Odwiedza /forgot-password ──────────────▶│                 │
  │                        │                   │                 │
  ├─ Wpisuje email ────────▶│                   │                 │
  │                        │                   │                 │
  ├─ Submit ───────────────▶│                   │                 │
  │                        │                   │                 │
  │                        ├─ resetPasswordForEmail() ──────────▶│
  │                        │                   │                 │
  │                        │                   │                 ├─ Generuje token
  │                        │                   │                 ├─ Wysyła email
  │                        │                   │                 │
  │                        │                   │◀─ Success ──────┤
  │                        │                   │                 │
  │                        │◀─ Success ────────┤                 │
  │                        │                   │                 │
  │◀─ "Sprawdź email" ─────┤                   │                 │
```

**Krok 2: Kliknięcie linku w emailu**

```
User                 Email              Browser         Supabase
  │                    │                   │                │
  ├─ Otwiera email ────▶│                   │                │
  │                    │                   │                │
  ├─ Klika link ───────┤                   │                │
  │   (https://domain.com/reset-password?token=xxx)         │
  │                    │                   │                │
  │                    └───────────────────▶│                │
  │                                        │                │
  ├─ Wyświetla formularz zmiany hasła ────┤                │
```

**Krok 3: Ustawienie nowego hasła**

```
User           ResetPasswordForm      authClient         Supabase
  │                    │                   │                │
  ├─ Wpisuje nowe hasło ───────────────────▶│                │
  │                    │                   │                │
  ├─ Submit ───────────▶│                   │                │
  │                    │                   │                │
  │                    ├─ updateUser({password}) ──────────▶│
  │                    │                   │                │
  │                    │                   │                ├─ Weryfikuje token
  │                    │                   │                ├─ Aktualizuje hasło
  │                    │                   │                ├─ Unieważnia stare sesje
  │                    │                   │                │
  │                    │                   │◀─ Success ─────┤
  │                    │                   │                │
  │                    │◀─ Success ────────┤                │
  │                    │                   │                │
  │◀─ Redirect /login ─┤                   │                │
```

#### 4.6.2. Bezpieczeństwo procesu resetowania

**Ochrony w Supabase**:
- Token jednorazowy - po użyciu staje się nieważny
- Token z wygaśnięciem - domyślnie 1 godzina
- Rate limiting - max 4 requesty/h dla jednego email
- Zawsze zwraca sukces (nawet dla nieistniejącego email) - ochrona przed wyliczaniem użytkowników

**Konfiguracja email template**:
- Link w emailu: `{{ .SiteURL }}/reset-password?token={{ .Token }}`
- Token automatycznie generowany przez Supabase
- Email wysyłany tylko jeśli konto istnieje

**Walidacje**:
- Token musi być obecny w URL
- Nowe hasło min. 6 znaków
- Potwierdzenie hasła musi być identyczne

### 4.7. Row-Level Security (RLS)

#### 4.7.1. Polityki RLS dla tabeli `cards`

**Policy: Użytkownik widzi tylko swoje fiszki**

```sql
CREATE POLICY "Users can view own cards"
ON cards
FOR SELECT
USING (auth.uid() = user_id);
```

**Policy: Użytkownik może tworzyć własne fiszki**

```sql
CREATE POLICY "Users can insert own cards"
ON cards
FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

**Policy: Użytkownik może aktualizować własne fiszki**

```sql
CREATE POLICY "Users can update own cards"
ON cards
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

**Policy: Użytkownik może usuwać własne fiszki**

```sql
CREATE POLICY "Users can delete own cards"
ON cards
FOR DELETE
USING (auth.uid() = user_id);
```

#### 4.7.2. Polityki RLS dla tabeli `generation_requests`

**Policy: Użytkownik widzi tylko swoje requesty**

```sql
CREATE POLICY "Users can view own generation requests"
ON generation_requests
FOR SELECT
USING (auth.uid() = user_id);
```

**Policy: Użytkownik może tworzyć własne requesty**

```sql
CREATE POLICY "Users can insert own generation requests"
ON generation_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

#### 4.7.3. Polityki RLS dla tabeli `events`

**Policy: Użytkownik widzi tylko swoje eventy**

```sql
CREATE POLICY "Users can view own events"
ON events
FOR SELECT
USING (auth.uid() = user_id);
```

**Policy: Użytkownik może tworzyć własne eventy**

```sql
CREATE POLICY "Users can insert own events"
ON events
FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

#### 4.7.4. Włączenie RLS

```sql
-- Włączenie RLS dla wszystkich tabel
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
```

**Uwaga**: RLS musi być włączony przed wdrożeniem modułu autentykacji, aby zapobiec nieautoryzowanemu dostępowi do danych.

### 4.8. Usuwanie konta użytkownika (US-012)

#### 4.8.1. Przepływ usuwania konta

**Wymaganie**: WYMAGANE (zgodność z RODO - prawo do usunięcia danych)

**Endpoint**: `DELETE /api/users/me` (do utworzenia)

**Operacje**:
1. Weryfikacja autentykacji (`locals.user`)
2. Usunięcie wszystkich fiszek użytkownika
3. Usunięcie wszystkich generation requests użytkownika
4. Usunięcie wszystkich eventów użytkownika
5. Usunięcie konta użytkownika z Supabase Auth
6. Wylogowanie
7. Przekierowanie do `/`

**Implementacja**:
```typescript
export const DELETE: APIRoute = async ({ locals, request }) => {
  const user = locals.user;
  
  if (!user) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401 }
    );
  }
  
  try {
    // Odczyt hasła z body requestu
    const body = await request.json();
    const { password } = body;
    
    if (!password) {
      return new Response(
        JSON.stringify({ error: "Password required" }),
        { status: 400 }
      );
    }
    
    // Weryfikacja hasła przez re-authentication
    const { error: authError } = await locals.supabase.auth.signInWithPassword({
      email: user.email!,
      password: password,
    });
    
    if (authError) {
      return new Response(
        JSON.stringify({ error: "Invalid password" }),
        { status: 403 }
      );
    }
    
    // Usuwanie danych użytkownika w kolejności (z powodu foreign keys)
    // RLS automatycznie ogranicza do danych tego użytkownika
    
    // 1. Usuń eventy (brak foreign keys)
    await locals.supabase
      .from('events')
      .delete()
      .eq('user_id', user.id);
    
    // 2. Usuń fiszki (są linkowane przez generation_request_id)
    await locals.supabase
      .from('cards')
      .delete()
      .eq('user_id', user.id);
    
    // 3. Usuń generation requests
    await locals.supabase
      .from('generation_requests')
      .delete()
      .eq('user_id', user.id);
    
    // 4. Usuń konto (wymaga service role key)
    // To automatycznie wyloguje użytkownika
    await locals.supabase.auth.admin.deleteUser(user.id);
    
    return new Response(
      JSON.stringify({ message: "Account deleted successfully" }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete account error:', error);
    return new Response(
      JSON.stringify({ error: "Failed to delete account" }),
      { status: 500 }
    );
  }
};
```

**UI dla usuwania konta** (WYMAGANE w MVP):
- Dodać sekcję na stronie `/profile` (ustawienia)
- Komponent `DeleteAccountButton` z modalem potwierdzenia
- Modal z ostrzeżeniem: "Ta operacja jest nieodwracalna. Wszystkie twoje fiszki zostaną trwale usunięte."
- Wymagane wpisanie hasła lub tekstu potwierdzającego przed usunięciem
- Po pomyślnym usunięciu → wylogowanie i przekierowanie do `/`

---

## 5. IMPLEMENTACJA - PLAN DZIAŁANIA

### 5.1. Etapy implementacji

#### Etap 1: Przygotowanie infrastruktury autentykacji
1. Weryfikacja konfiguracji Supabase Auth w Dashboard
2. Aktualizacja middleware - odkomentowanie logiki sesji
3. Weryfikacja klientów Supabase (auth.client.ts, supabase.client.ts)
4. Implementacja polityk RLS w bazie danych

#### Etap 2: Implementacja logowania
1. Utworzenie komponentu `LoginForm.tsx`
2. Aktualizacja strony `login.astro`
3. Dodanie logiki przekierowań (zalogowani → `/generate`)
4. Testy przepływu logowania

#### Etap 3: Aktualizacja nawigacji
1. Modyfikacja `Layout.astro` - conditional navigation
2. Utworzenie komponentu `UserMenu.tsx`
3. Implementacja funkcji wylogowania
4. Testy nawigacji auth/non-auth

#### Etap 4: Ochrona zasobów
1. Odkomentowanie ochrony w `generate.astro`
2. Weryfikacja wszystkich endpointów API
3. Dodanie przekierowań dla zalogowanych (index, login, register)
4. Testy dostępu do chronionych zasobów

#### Etap 5: Odzyskiwanie hasła
1. Utworzenie komponentu `ForgotPasswordForm.tsx`
2. Utworzenie strony `forgot-password.astro`
3. Utworzenie komponentu `ResetPasswordForm.tsx`
4. Utworzenie strony `reset-password.astro`
5. Konfiguracja email templates w Supabase
6. Testy przepływu resetowania hasła

#### Etap 6: Zmiana hasła (US-009)
1. Utworzenie komponentu `ChangePasswordForm.tsx`
2. Utworzenie strony `profile.astro`
3. Dodanie linku do profilu w `UserMenu.tsx`
4. Implementacja weryfikacji obecnego hasła
5. Testy przepływu zmiany hasła

#### Etap 7: Usuwanie konta (US-012 - WYMAGANE RODO)
1. Utworzenie komponentu `DeleteAccountButton.tsx`
2. Dodanie sekcji usuwania konta na stronie `profile.astro`
3. Implementacja endpointu `DELETE /api/users/me`
4. Implementacja kaskadowego usuwania danych (fiszki, requesty, eventy)
5. Testy przepływu usuwania konta
6. Weryfikacja zgodności z RODO

#### Etap 8: Testy i weryfikacja
1. Testy wszystkich scenariuszy happy path
2. Testy obsługi błędów
3. Weryfikacja bezpieczeństwa (RLS, cookies, tokeny)
4. Testy E2E przepływów autentykacji
5. Weryfikacja zgodności z wszystkimi User Stories (US-001, US-002, US-008, US-009, US-010, US-011, US-012)

### 5.2. Zmienne środowiskowe

**Wymagane w `.env`**:
```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Public variables (dostępne w przeglądarce)
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**Uwaga**: `PUBLIC_*` zmienne są eksponowane w przeglądarce - nie umieszczać w nich service role key!

### 5.3. Komponenty do utworzenia

**Nowe komponenty React**:
- `/src/components/LoginForm.tsx`
- `/src/components/ForgotPasswordForm.tsx`
- `/src/components/ResetPasswordForm.tsx`
- `/src/components/ChangePasswordForm.tsx` (US-009)
- `/src/components/UserMenu.tsx`
- `/src/components/DeleteAccountButton.tsx` (US-012)

**Nowe strony Astro**:
- `/src/pages/forgot-password.astro`
- `/src/pages/reset-password.astro`
- `/src/pages/profile.astro` (ustawienia użytkownika - US-009, US-012)

**Nowe endpointy API**:
- `/src/pages/api/users/me.ts` - DELETE endpoint dla usuwania konta (WYMAGANE)

**Opcjonalne**:
- `/src/lib/schemas/auth.schema.ts` - schematy Zod dla walidacji

### 5.4. Modyfikacje istniejących plików

**Do modyfikacji**:
- `/src/middleware/index.ts` - odkomentowanie logiki autentykacji
- `/src/layouts/Layout.astro` - dodanie warunkowej nawigacji z linkiem do profilu
- `/src/pages/index.astro` - przekierowanie zalogowanych
- `/src/pages/login.astro` - implementacja formularza
- `/src/pages/generate.astro` - odkomentowanie ochrony
- `/src/pages/api/cards.ts` - weryfikacja `user_id`
- `/src/pages/api/cards/[id].ts` - weryfikacja własności
- `/src/pages/api/generation-requests.ts` - zapisanie `user_id`
- `/src/env.d.ts` - weryfikacja typów dla `Locals.user`

### 5.5. Baza danych - migracje SQL

**Migracja: Włączenie RLS i utworzenie polityk**

```sql
-- Migration: Enable RLS and create auth policies
-- Date: [DATA]

-- Enable RLS
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Policies for cards
CREATE POLICY "Users can view own cards"
ON cards FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cards"
ON cards FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cards"
ON cards FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own cards"
ON cards FOR DELETE
USING (auth.uid() = user_id);

-- Policies for generation_requests
CREATE POLICY "Users can view own generation requests"
ON generation_requests FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own generation requests"
ON generation_requests FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policies for events
CREATE POLICY "Users can view own events"
ON events FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own events"
ON events FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

---

## 6. PODSUMOWANIE

### 6.1. Kluczowe decyzje architektoniczne

1. **Supabase Auth jako jedyne źródło prawdy o autentykacji**
   - Żadne własne tokeny, hashing haseł, itp.
   - Pełna delegacja zarządzania użytkownikami do Supabase

2. **SSR-first approach z Astro Middleware**
   - Każdy request weryfikowany przez middleware
   - Sesje zarządzane przez cookies, nie localStorage
   - SEO-friendly, bezpieczne

3. **React dla interaktywności, Astro dla struktury**
   - Formularze auth jako React components (`client:load`)
   - Strony i routing w Astro
   - Clear separation of concerns

4. **Row-Level Security jako główna ochrona danych**
   - Polityki RLS na poziomie bazy danych
   - Ochrona przed nieautoryzowanym dostępem nawet przy błędzie w kodzie
   - Zgodność z RODO

5. **User-friendly error handling**
   - Wszystkie błędy mapowane na komunikaty w języku polskim
   - Graceful degradation przy błędach sieci
   - Informacyjne komunikaty bez ujawniania szczegółów technicznych

### 6.2. Diagram całościowy architektury

```
┌────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Browser)                          │
│                                                                     │
│  ┌─────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │  Astro Pages    │  │ React Components │  │   Navigation     │  │
│  │  - register     │  │  - RegisterForm  │  │  - Layout        │  │
│  │  - login        │  │  - LoginForm     │  │  - UserMenu      │  │
│  │  - forgot-pw    │  │  - ForgotPwForm  │  │                  │  │
│  │  - reset-pw     │  │  - ResetPwForm   │  │                  │  │
│  │  - generate     │  │  - GenerateView  │  │                  │  │
│  └────────┬────────┘  └────────┬─────────┘  └────────┬─────────┘  │
│           │                    │                     │             │
└───────────┼────────────────────┼─────────────────────┼─────────────┘
            │                    │                     │
            │                    ▼                     │
            │          ┌──────────────────┐            │
            │          │  authClient      │            │
            │          │  (client-side)   │            │
            │          └────────┬─────────┘            │
            │                   │                      │
            ▼                   ▼                      ▼
┌────────────────────────────────────────────────────────────────────┐
│                      ASTRO MIDDLEWARE                               │
│                                                                     │
│  - Odczyt cookies (sb-access-token, sb-refresh-token)              │
│  - Weryfikacja sesji z Supabase                                    │
│  - Ustawienie context.locals.user                                  │
│  - Ochrona /api/* routes                                           │
│                                                                     │
└──────────────────────────┬─────────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────────────────┐
│                     BACKEND SERVICES                                │
│                                                                     │
│  ┌──────────────────┐  ┌──────────────────┐  ┌─────────────────┐  │
│  │  API Endpoints   │  │  Supabase Client │  │  Services       │  │
│  │  - /api/cards    │  │  (server-side)   │  │  - card         │  │
│  │  - /api/gen-req  │  │                  │  │  - generation   │  │
│  └────────┬─────────┘  └────────┬─────────┘  │  - event        │  │
│           │                     │             └────────┬────────┘  │
│           └──────────┬──────────┘                     │            │
│                      │                                │            │
└──────────────────────┼────────────────────────────────┼────────────┘
                       │                                │
                       ▼                                ▼
┌────────────────────────────────────────────────────────────────────┐
│                       SUPABASE                                      │
│                                                                     │
│  ┌──────────────────┐         ┌──────────────────┐                │
│  │  Supabase Auth   │         │  PostgreSQL DB   │                │
│  │  - signUp        │         │  - cards         │                │
│  │  - signIn        │         │  - generation_   │                │
│  │  - signOut       │         │    requests      │                │
│  │  - resetPassword │         │  - events        │                │
│  │  - getUser       │         │  - RLS policies  │                │
│  └──────────────────┘         └──────────────────┘                │
│                                                                     │
└────────────────────────────────────────────────────────────────────┘
```

### 6.3. Zgodność z wymaganiami PRD

**US-001: Rejestracja konta** ✓
- Formularz z email i hasłem
- Weryfikacja danych (walidacja)
- Aktywacja konta (Supabase)
- Potwierdzenie rejestracji i auto-login

**US-002: Logowanie do aplikacji** ✓
- Prawidłowe dane → przekierowanie do `/generate`
- Błędne dane → komunikat o błędzie
- Bezpieczne przechowywanie (cookies HttpOnly, Supabase Auth)

**US-008: Bezpieczny dostęp i autoryzacja** ✓
- Tylko zalogowani widzą swoje fiszki (RLS policies)
- Brak dostępu do fiszek innych (RLS + middleware)
- Ochrona tras i API

**US-009: Zmiana hasła w profilu użytkownika** ✓
- Strona profilu z formularzem zmiany hasła
- Weryfikacja obecnego hasła
- Walidacja nowego hasła (min. 6 znaków, zgodność)
- Bezpieczna aktualizacja hasła przez Supabase

**US-010: Wylogowanie z aplikacji** ✓
- UserMenu z przyciskiem wylogowania
- Usunięcie sesji i cookies
- Przekierowanie do strony głównej

**US-011: Odzyskiwanie hasła (forgot password)** ✓
- Email z linkiem resetującym
- Bezpieczny token jednorazowy
- Ustawienie nowego hasła
- Rate limiting

**US-012: Usuwanie konta użytkownika** ✓ (WYMAGANE - RODO)
- Przycisk usuwania konta na stronie profilu
- Modal z potwierdzeniem i weryfikacją hasła
- Kaskadowe usuwanie wszystkich danych użytkownika
- Endpoint DELETE /api/users/me
- Zgodność z RODO (prawo do usunięcia danych)

### 6.4. Następne kroki po implementacji

1. **Testy bezpieczeństwa**:
   - Penetration testing
   - Weryfikacja RLS policies
   - Testy rate limiting

2. **Monitoring i logging**:
   - Logowanie prób nieautoryzowanego dostępu
   - Monitoring sesji użytkowników
   - Alerty dla podejrzanych aktywności

3. **Optymalizacje**:
   - Caching sesji (jeśli potrzebne)
   - Lazy loading komponentów auth
   - Optymalizacja cookies (rozmiar, czas życia)

4. **Rozszerzenia (poza MVP)**:
   - OAuth providers (Google, GitHub)
   - 2FA (Two-Factor Authentication)
   - Magic links (login bez hasła)
   - Remember me functionality

---

**Koniec specyfikacji**

Data utworzenia: 2026-01-24  
Wersja: 1.0  
Autorzy: Full-stack Development Team
