# Architektura UI dla 10x-cards

## 1. Przegląd struktury UI

Aplikacja 10x-cards została zaprojektowana jako Multi-Page Application (MPA) wykorzystująca Astro 5 jako framework bazowy z React 19 dla interaktywnych komponentów. Architektura UI opiera się na minimalistycznym podejściu odpowiednim dla MVP, wykorzystując gotowe komponenty Shadcn/ui dla zapewnienia spójności i szybkości rozwoju.

### Główne założenia architektoniczne

- **Pattern architektoniczny**: Multi-Page Application (MPA) z wykorzystaniem Astro dla routingu i server-side rendering
- **Interaktywność**: React components dla dynamicznych elementów (formularze, modale, listy)
- **Design system**: Shadcn/ui + Tailwind CSS 4 z custom design tokens
- **Responsywność**: Mobile-first approach z breakpointami: sm (640px), md (768px), lg (1024px)
- **State management**: React hooks (useState, useEffect) dla stanu lokalnego, Context API dla uwierzytelniania
- **Error handling**: Trójpoziomowa obsługa - toast notifications (globalne), inline messages (walidacja), modals (critical errors)

### Podział na strefy dostępu

1. **Publiczne widoki** (niezalogowani użytkownicy):
   - Landing page (/)
   - Logowanie (/login)
   - Rejestracja (/register)

2. **Chronione widoki** (zalogowani użytkownicy):
   - Generowanie fiszek (/generate) - strona główna po zalogowaniu
   - Moje fiszki (/cards) - zarządzanie kolekcją
   - Profil użytkownika (/profile) - informacje o koncie

3. **Komponenty globalne**:
   - Navbar (nawigacja główna na chronionych stronach)
   - Toast notifications (feedback systemowy)
   - Auth Context Provider (zarządzanie sesją)

---

## 2. Lista widoków

### 2.1 Landing Page (/)

**Ścieżka:** `/`  
**Typ:** Publiczny (dostępny dla niezalogowanych, przekierowuje zalogowanych)

**Główny cel:**  
Przedstawienie value proposition aplikacji i przekonanie nowych użytkowników do rejestracji. Dla zalogowanych użytkowników automatyczne przekierowanie do głównej funkcjonalności.

**Kluczowe informacje do wyświetlenia:**
- Opis aplikacji i głównej wartości dla użytkownika
- Krótkie przedstawienie kluczowych funkcjonalności (AI generation, zarządzanie fiszkami)
- Call-to-action buttons: "Zaloguj się" i "Zarejestruj się"

**Kluczowe komponenty widoku:**
- Hero section z opisem produktu
- Features showcase (opcjonalnie)
- CTA buttons (primary: "Zarejestruj się", secondary: "Zaloguj się")

**UX considerations:**
- Jasne value proposition w ciągu pierwszych 3 sekund
- Wyraźne CTA buttons z kontrastem
- Automatyczne przekierowanie zalogowanych użytkowników do /generate

**Dostępność:**
- Minimalna w MVP (komponenty Shadcn/ui zapewniają podstawy)

**Bezpieczeństwo:**
- Sprawdzenie sesji przy wejściu → przekierowanie do /generate jeśli zalogowany

---

### 2.2 Logowanie (/login)

**Ścieżka:** `/login`  
**Typ:** Publiczny (przekierowuje zalogowanych do /generate)

**Główny cel:**  
Uwierzytelnienie użytkownika i zapewnienie bezpiecznego dostępu do chronionej części aplikacji.

**Kluczowe informacje do wyświetlenia:**
- Formularz logowania (email, hasło)
- Link do strony rejestracji
- Komunikaty o błędach (nieprawidłowe dane logowania)

**Kluczowe komponenty widoku:**
- `LoginForm` (React component)
  - Input dla email (z walidacją formatu)
  - Input dla hasła (type="password")
  - Button "Zaloguj się" (disabled podczas ładowania)
  - Loading state (spinner w buttonie)
- Link "Nie masz konta? Zarejestruj się" → /register
- Inline error messages

**Integracja z API:**
- `supabase.auth.signInWithPassword({ email, password })`
- Sukces: przekierowanie do /generate
- Błąd 401: inline error "Nieprawidłowy email lub hasło"

**UX considerations:**
- Wyraźny feedback podczas ładowania (disabled button + spinner)
- Inline error messages zamiast alertów
- Focus na polu email przy wejściu na stronę
- Enter key submits form

**Dostępność:**
- Label połączone z inputs
- Error messages z aria-live="polite"

**Bezpieczeństwo:**
- Token przechowywany w Supabase session (httpOnly cookie)
- Brak możliwości wejścia dla zalogowanych (redirect do /generate)
- CSRF protection przez Supabase Auth

---

### 2.3 Rejestracja (/register)

**Ścieżka:** `/register`  
**Typ:** Publiczny (przekierowuje zalogowanych do /generate)

**Główny cel:**  
Utworzenie nowego konta użytkownika i automatyczne zalogowanie do aplikacji.

**Kluczowe informacje do wyświetlenia:**
- Formularz rejestracji (email, hasło)
- Link do strony logowania
- Komunikaty o błędach walidacji

**Kluczowe komponenty widoku:**
- `RegisterForm` (React component)
  - Input dla email (z walidacją formatu)
  - Input dla hasła (type="password", min 6 znaków)
  - Button "Zarejestruj się" (disabled podczas ładowania)
  - Loading state (spinner w buttonie)
- Link "Masz już konto? Zaloguj się" → /login
- Inline error messages

**Integracja z API:**
- `supabase.auth.signUp({ email, password })`
- Sukces: automatyczne zalogowanie + przekierowanie do /generate
- Błąd 400: inline error messages (email już zarejestrowany, słabe hasło)

**UX considerations:**
- Wyraźny feedback podczas ładowania
- Inline validation errors
- Automatyczne zalogowanie po rejestracji (seamless onboarding)
- Password strength indicator (opcjonalnie)

**Dostępność:**
- Label połączone z inputs
- Error messages z aria-live="polite"

**Bezpieczeństwo:**
- Walidacja siły hasła (minimum 6 znaków - Supabase default)
- Email uniqueness sprawdzana przez Supabase
- Automatyczne hash hasła przez Supabase (bcrypt)

---

### 2.4 Generowanie fiszek (/generate)

**Ścieżka:** `/generate`  
**Typ:** Chroniony (wymaga uwierzytelnienia)

**Główny cel:**  
Umożliwienie użytkownikowi generowania fiszek przez AI na podstawie dostarczonego tekstu oraz przeglądu i akceptacji wygenerowanych sugestii.

**Kluczowe informacje do wyświetlenia:**
- Formularz z textarea dla tekstu wejściowego
- Licznik znaków z wizualizacją walidacji (kolory)
- Loading state podczas generowania
- Lista wygenerowanych sugestii fiszek
- Możliwość selekcji i akceptacji fiszek

**Kluczowe komponenty widoku:**

1. **GenerateForm** (główny container)
   - Textarea (full-width na mobile, 60% na desktop, min-height: 200px)
   - CharacterCounter (X / 10000, czerwony <1000 lub >10000, zielony 1000-10000)
   - Button "Generuj" (primary, disabled gdy walidacja nie przechodzi)
   - Walidacja: 1000-10000 znaków, inline error messages

2. **LoadingState** (podczas generowania AI)
   - Disabled textarea i button
   - Spinner z tekstem "Generuję fiszki..."
   - Opcjonalnie: progress bar lub animowane komunikaty

3. **GeneratedCardsList** (po otrzymaniu sugestii)
   - Lista 5-10 wygenerowanych fiszek
   - Każda pozycja zawiera:
     - Checkbox dla zaznaczenia
     - Front fiszki (wyświetlany)
     - Back fiszki (wyświetlany)
     - Przycisk "Edytuj" (inline editing - nierozstrzygnięte w MVP)
   - Button "Zapisz wybrane fiszki" (disabled gdy 0 zaznaczonych)
   - Select all / Deselect all (opcjonalnie)

4. **EmptyResultsMessage** (gdy AI zwróci 0 fiszek)
   - Ikona
   - Nagłówek "Nie udało się wygenerować fiszek"
   - Komunikat "Spróbuj z innym tekstem lub zmień długość wejścia"

**Integracja z API:**
1. `POST /api/generation-requests`
   - Body: `{ input_text: string }`
   - Response: `{ generation_request_id, generated_count, suggested_cards: [{ front, back }] }`
2. `POST /api/cards`
   - Body: `[{ front, back }]` (array zaznaczonych fiszek)
   - Header: `Authorization: Bearer <token>`
   - Response: Created cards with `source: 'ai'`

**Przepływ użytkownika:**
1. Wklejenie tekstu do textarea
2. Obserwacja licznika znaków (realtime update)
3. Walidacja długości (przycisk disabled jeśli nieprawidłowa)
4. Klik "Generuj" → loading state (do 30s)
5. Wyświetlenie listy sugestii
6. Zaznaczenie fiszek checkboxami
7. Opcjonalna edycja niektórych fiszek (nierozstrzygnięte)
8. Klik "Zapisz wybrane fiszki"
9. Toast success "Fiszki zostały zapisane"
10. Opcjonalnie: przekierowanie do /cards lub reset formularza

**Stany komponentu:**
- **Empty state**: Formularz bez wyników (initial state)
- **Validation error**: Licznik czerwony + inline message + disabled button
- **Loading state**: Disabled textarea/button + spinner
- **Results state**: Lista sugestii z checkboxami
- **Empty results**: Komunikat o braku wygenerowanych fiszek
- **Error state**: Toast notification (502, 500) lub modal (429)

**UX considerations:**
- Realtime character counter z kolorami
- Wyraźny loading indicator (może trwać do 30s)
- Disabled states zapobiegają przypadkowym kliknięciom
- Toast notifications dla sukcesu i błędów globalnych
- Autosave textarea do localStorage (nierozstrzygnięte - rekomendowane)

**Dostępność:**
- Label dla textarea
- Aria-live dla licznika
- Keyboard navigation dla checkboxów

**Bezpieczeństwo:**
- Walidacja długości client-side (1000-10000 znaków)
- Token w Authorization header
- Brak sanityzacji HTML (polegamy na backend validation)

**Obsługa błędów:**
- **400 Validation Error**: Inline message "Tekst musi mieć między 1000 a 10000 znaków"
- **429 Rate Limit**: Modal "Przekroczono limit. Spróbuj ponownie za X minut"
- **502 AI Service Error**: Toast "Usługa AI niedostępna. Spróbuj później"
- **500 Server Error**: Toast "Wystąpił błąd. Spróbuj ponownie"
- **Timeout (>30s)**: Toast "Generowanie trwało zbyt długo. Spróbuj ponownie"

---

### 2.5 Moje fiszki (/cards)

**Ścieżka:** `/cards`  
**Typ:** Chroniony (wymaga uwierzytelnienia)

**Główny cel:**  
Przeglądanie, filtrowanie, sortowanie oraz zarządzanie (edycja, usuwanie, dodawanie) kolekcją fiszek użytkownika.

**Kluczowe informacje do wyświetlenia:**
- Grid fiszek z responsywnym układem
- Filtry i sortowanie
- Informacje o każdej fiszce (front, back, źródło, liczba powtórek)
- Opcje akcji per fiszka (edytuj, usuń)

**Kluczowe komponenty widoku:**

1. **FiltersBar** (nad gridem)
   - Dropdown "Źródło": Wszystkie / AI / Ręczne
   - Dropdown "Sortuj według": Data utworzenia / Data aktualizacji / Liczba powtórek
   - Dropdown "Kolejność": Malejąco / Rosnąco
   - Button "Dodaj fiszkę ręcznie" (primary, po prawej)

2. **FlashcardsGrid** (główny kontener)
   - Responsywny grid:
     - Mobile (< 640px): 1 kolumna
     - Tablet (640-1024px): 2 kolumny
     - Desktop (> 1024px): 2-3 kolumny
   - Gap: 1rem (mobile), 1.5rem (desktop)

3. **FlashcardItem** (pojedyncza karta)
   - Card wrapper (Shadcn/ui Card component)
   - CardHeader:
     - Front jako CardTitle (bold, larger font)
   - CardContent:
     - Back jako paragraph (truncated do 2-3 linii, line-clamp-3)
   - CardFooter:
     - Badge źródła: "AI" (zielony) lub "Ręczna" (niebieski)
     - Text "Powtórki: X" (jeśli > 0)
     - Action buttons (on hover desktop, zawsze widoczne mobile):
       - Button "Edytuj" → otwiera EditCardModal
       - Button "Usuń" → otwiera DeleteConfirmDialog

4. **EditCardModal** (Dialog z Shadcn/ui)
   - DialogHeader: Tytuł "Edytuj fiszkę"
   - DialogContent:
     - Label + Textarea "Przód fiszki" (max 200 znaków, z licznikiem)
     - Label + Textarea "Tył fiszki" (max 500 znaków, z licznikiem)
   - DialogFooter:
     - Button "Anuluj" (secondary, zamyka modal)
     - Button "Zapisz zmiany" (primary, wywołuje API)

5. **AddCardModal** (Dialog z Shadcn/ui)
   - Identyczny formularz jak EditCardModal
   - DialogHeader: Tytuł "Dodaj nową fiszkę"
   - Puste pola
   - DialogFooter:
     - Button "Anuluj" (secondary)
     - Button "Dodaj" (primary, wywołuje API)

6. **DeleteConfirmDialog** (AlertDialog z Shadcn/ui)
   - Tytuł: "Czy na pewno chcesz usunąć tę fiszkę?"
   - Content:
     - Podgląd front fiszki (bold, quoted)
     - Warning "Ta akcja jest nieodwracalna."
   - Actions:
     - Button "Anuluj" (secondary)
     - Button "Usuń" (destructive, red)

7. **EmptyState** (gdy brak fiszek)
   - Wycentrowany komponent
   - Ikona 📚 (lub icon z lucide-react)
   - Nagłówek "Nie masz jeszcze żadnych fiszek"
   - Opis "Zacznij od wygenerowania fiszek przez AI lub utwórz je ręcznie"
   - 2 CTA buttons:
     - "Generuj fiszki AI" (primary, link do /generate)
     - "Dodaj fiszkę ręcznie" (secondary, otwiera AddCardModal)

**Integracja z API:**
1. **Pobieranie listy fiszek:**
   - `GET /api/cards?limit=50&source={filter}&sort={sort}&order={order}`
   - Response: `{ data: Card[], pagination: {...} }`

2. **Dodawanie ręcznej fiszki:**
   - `POST /api/cards`
   - Body: `[{ front, back }]`
   - Response: Created card with `source: 'manual'`

3. **Edycja fiszki:**
   - `PATCH /api/cards/:id`
   - Body: `{ front?, back? }`
   - Response: Updated card

4. **Usuwanie fiszki:**
   - `DELETE /api/cards/:id`
   - Response: `{ message, deleted_id }`

**Przepływ użytkownika:**

**Przeglądanie:**
1. Wejście na /cards → fetch listy fiszek
2. Wyświetlenie gridu
3. Filtrowanie po źródle (dropdown zmienia query param)
4. Sortowanie (dropdown zmienia query param)
5. Refetch z nowymi parametrami

**Dodawanie ręcznej fiszki:**
1. Klik "Dodaj fiszkę ręcznie"
2. Otwarcie AddCardModal
3. Wypełnienie formularza (front, back)
4. Walidacja długości (realtime)
5. Klik "Dodaj" → POST API
6. Toast success "Fiszka została dodana"
7. Zamknięcie modalu
8. Dodanie nowej karty na początek gridu (prepend)

**Edycja fiszki:**
1. Hover na karcie → wyświetlenie action buttons (desktop)
2. Klik "Edytuj"
3. Otwarcie EditCardModal z pre-filled values
4. Modyfikacja front i/lub back
5. Walidacja długości
6. Klik "Zapisz zmiany" → PATCH API
7. Toast success "Fiszka została zaktualizowana"
8. Zamknięcie modalu
9. Aktualizacja karty w gridzie (merge z response)

**Usuwanie fiszki:**
1. Klik "Usuń"
2. Otwarcie DeleteConfirmDialog z podglądem fiszki
3. Klik "Usuń" (destructive) → DELETE API
4. Toast success "Fiszka została usunięta"
5. Zamknięcie dialogu
6. Usunięcie karty z gridu (filter out)

**Stany komponentu:**
- **Loading state**: Skeleton cards podczas initial fetch
- **Empty state**: EmptyState component gdy brak fiszek
- **Error state**: Toast notification "Nie udało się załadować fiszek"
- **No results after filter**: "Brak fiszek spełniających kryteria" + przycisk "Resetuj filtry"

**UX considerations:**
- Responsywny grid z płynną adaptacją do ekranu
- Action buttons on hover (desktop) zapobiegają zagraceniu UI
- Action buttons zawsze widoczne (mobile) dla łatwego dostępu
- Truncate długich tekstów (line-clamp-3) z pełną treścią w modallu
- Destructive styling dla przycisku usuwania (red)
- Confirmation dialog zapobiega przypadkowemu usunięciu
- Toast notifications dla wszystkich akcji
- Loading states na buttonach podczas operacji

**Dostępność:**
- Keyboard navigation dla gridu
- Focus trap w modalach
- Aria-labels dla action buttons
- Screen reader friendly card structure

**Bezpieczeństwo:**
- Filtrowanie po user_id na backendzie
- Walidacja ownership przed edycją/usunięciem
- Token w Authorization header

**Obsługa błędów:**
- **400 Validation Error**: Inline messages w modalach
- **401 Unauthorized**: Przekierowanie do /login
- **404 Not Found**: Toast "Fiszka nie została znaleziona"
- **500 Server Error**: Toast "Wystąpił błąd. Spróbuj ponownie"

**Pagination (nierozstrzygnięte w MVP):**
- Opcja 1: Infinite scroll
- Opcja 2: "Load more" button
- Opcja 3: Traditional pagination z numerami stron
- **Rekomendacja dla MVP**: Prosta paginacja z przyciskami "Poprzednia"/"Następna" + info "Strona X z Y"

---

### 2.6 Profil użytkownika (/profile)

**Ścieżka:** `/profile`  
**Typ:** Chroniony (wymaga uwierzytelnienia)

**Główny cel:**  
Wyświetlenie podstawowych informacji o koncie użytkownika. W MVP ograniczone do read-only emaila.

**Kluczowe informacje do wyświetlenia:**
- Adres email użytkownika (read-only)

**Kluczowe komponenty widoku:**

1. **ProfileSection**
   - Card wrapper
   - Section "Twoje konto"
   - Label "Adres e-mail"
   - Input (read-only, disabled) z wartością email
   - Brak przycisku edycji w MVP

**Integracja z API:**
- `supabase.auth.getSession()` → `session.user.email`
- Brak dodatkowych API calls w MVP

**UX considerations:**
- Minimalistyczny widok (zgodnie z uproszczeniem z notatek sesji)
- Read-only field z disabled styling
- Brak akcji w MVP

**Dostępność:**
- Label połączony z input
- Semantic HTML

**Bezpieczeństwo:**
- Email z sesji Supabase (zaufane źródło)

---

## 3. Mapa podróży użytkownika

### 3.1 Główny przepływ: Nowy użytkownik generuje i zarządza fiszkami

```
1. Wejście na aplikację
   └─> Landing Page (/)
       ├─> Prezentacja value proposition
       └─> CTA "Zarejestruj się"

2. Rejestracja
   └─> /register
       ├─> Wypełnienie formularza (email, hasło)
       ├─> Submit → POST supabase.auth.signUp()
       ├─> Sukces: Automatyczne zalogowanie
       └─> Przekierowanie → /generate

3. Generowanie fiszek przez AI
   └─> /generate (pierwsza strona po zalogowaniu)
       ├─> Wklejenie tekstu (np. fragment podręcznika)
       ├─> Obserwacja licznika znaków (realtime)
       │   ├─> Czerwony jeśli <1000 lub >10000
       │   └─> Zielony jeśli 1000-10000
       ├─> Klik "Generuj" (disabled jeśli walidacja nie przechodzi)
       ├─> Loading state (spinner + "Generuję fiszki..." - do 30s)
       ├─> POST /api/generation-requests → response: suggested_cards[]
       ├─> Wyświetlenie listy 5-10 sugestii
       ├─> Przegląd każdej fiszki (front + back widoczne)
       ├─> Zaznaczenie checkboxami (select all / deselect all)
       ├─> Opcjonalna edycja niektórych sugestii (nierozstrzygnięte)
       ├─> Klik "Zapisz wybrane fiszki"
       ├─> POST /api/cards (batch) → response: created cards
       ├─> Toast success "Fiszki zostały zapisane"
       └─> Opcjonalnie: Przekierowanie do /cards lub reset formularza

4. Zarządzanie fiszkami
   └─> /cards (przez navbar lub przekierowanie)
       ├─> GET /api/cards → wyświetlenie gridu fiszek
       ├─> Przegląd kart (front jako tytuł, back jako preview)
       ├─> Filtrowanie po źródle (Wszystkie / AI / Ręczne)
       ├─> Sortowanie (Data utworzenia / aktualizacji / Liczba powtórek)
       │
       ├─> **Dodawanie ręcznej fiszki:**
       │   ├─> Klik "Dodaj fiszkę ręcznie"
       │   ├─> Otwarcie AddCardModal
       │   ├─> Wypełnienie formularza (front max 200, back max 500)
       │   ├─> Klik "Dodaj" → POST /api/cards
       │   ├─> Toast success "Fiszka została dodana"
       │   └─> Dodanie karty na początek gridu
       │
       ├─> **Edycja fiszki:**
       │   ├─> Hover na karcie → wyświetlenie buttons (desktop)
       │   ├─> Klik "Edytuj"
       │   ├─> Otwarcie EditCardModal z pre-filled values
       │   ├─> Modyfikacja front i/lub back
       │   ├─> Klik "Zapisz zmiany" → PATCH /api/cards/:id
       │   ├─> Toast success "Fiszka została zaktualizowana"
       │   └─> Aktualizacja karty w gridzie
       │
       └─> **Usuwanie fiszki:**
           ├─> Klik "Usuń"
           ├─> Otwarcie DeleteConfirmDialog
           ├─> Przeczytanie ostrzeżenia + podgląd fiszki
           ├─> Klik "Usuń" (destructive) → DELETE /api/cards/:id
           ├─> Toast success "Fiszka została usunięta"
           └─> Usunięcie karty z gridu

5. Profil użytkownika
   └─> /profile (przez navbar)
       ├─> Wyświetlenie adresu email (read-only)
       └─> Brak dodatkowych akcji w MVP

6. Wylogowanie
   └─> Klik "Wyloguj" w navbar
       ├─> supabase.auth.signOut()
       └─> Przekierowanie → / (Landing Page)
```

### 3.2 Przepływ powracającego użytkownika

```
1. Wejście na aplikację
   └─> Landing Page (/) lub /login
       ├─> Jeśli sesja aktywna: Automatyczne przekierowanie → /generate
       └─> Jeśli brak sesji: Formularz logowania

2. Logowanie
   └─> /login
       ├─> Wypełnienie formularza (email, hasło)
       ├─> Submit → POST supabase.auth.signInWithPassword()
       ├─> Sukces: Sesja utworzona
       └─> Przekierowanie → /generate

3. Nawigacja między głównymi widokami
   └─> Navbar dostępny na wszystkich chronionych stronach:
       ├─> "Generuj fiszki" → /generate
       ├─> "Moje fiszki" → /cards
       ├─> "Profil użytkownika" → /profile
       └─> "Wyloguj" → logout + redirect do /

4. Typowa sesja pracy
   ├─> Wygenerowanie nowych fiszek w /generate
   ├─> Przegląd i organizacja w /cards
   ├─> Dodanie kilku ręcznych fiszek
   ├─> Edycja/usunięcie niepotrzebnych
   └─> Wylogowanie
```

### 3.3 Przepływ obsługi błędów

```
1. Rate Limit Exceeded (429)
   └─> /generate → POST /api/generation-requests → 429 response
       ├─> Otwarcie RateLimitModal
       ├─> Wyświetlenie komunikatu "Przekroczono limit 10 generacji na godzinę"
       ├─> Wyświetlenie retry_after "Spróbuj ponownie za 45 minut"
       ├─> Przycisk "OK" → zamknięcie modalu
       └─> Użytkownik może:
           ├─> Poczekać
           ├─> Pracować z istniejącymi fiszkami w /cards
           └─> Dodawać ręczne fiszki

2. AI Service Unavailable (502)
   └─> /generate → POST /api/generation-requests → 502 response
       ├─> Toast error "Usługa AI niedostępna. Spróbuj później."
       └─> Użytkownik może:
           ├─> Spróbować ponownie za chwilę
           └─> Dodać fiszki ręcznie w /cards

3. Validation Errors (400)
   └─> /generate lub /cards → POST/PATCH → 400 response
       ├─> Inline error messages przy polach
       ├─> Przykład: "Przód fiszki musi mieć między 1 a 200 znaków"
       └─> Użytkownik poprawia dane i ponownie submituje

4. Session Expired (401)
   └─> Dowolna operacja → 401 response
       ├─> Toast info "Sesja wygasła. Zaloguj się ponownie."
       └─> Automatyczne przekierowanie → /login

5. Network Error
   └─> Brak połączenia z internetem
       ├─> Toast error "Brak połączenia z internetem"
       └─> Retry po przywróceniu połączenia
```

### 3.4 Edge cases i nietypowe przepływy

```
1. Użytkownik odświeża stronę podczas generowania AI
   └─> /generate → Textarea cleared, brak sugestii
       ├─> Sugestie nie są persystowane (nierozstrzygnięte w MVP)
       └─> Użytkownik musi wygenerować ponownie
       └─> **Rekomendacja**: Autosave textarea do localStorage (debounced, co 5s)

2. AI generuje 0 fiszek
   └─> /generate → POST /api/generation-requests → response: generated_count: 0
       ├─> Wyświetlenie EmptyResultsMessage
       ├─> "Nie udało się wygenerować fiszek. Spróbuj z innym tekstem."
       └─> Użytkownik może:
           ├─> Spróbować z innym tekstem
           ├─> Zmienić długość wejścia
           └─> Dodać fiszki ręcznie

3. Użytkownik próbuje zapisać 0 fiszek
   └─> /generate → Żaden checkbox nie zaznaczony
       ├─> Button "Zapisz wybrane fiszki" disabled
       └─> Brak możliwości kliknięcia

4. Brak fiszek w bazie po zalogowaniu
   └─> /cards → GET /api/cards → response: data: []
       ├─> Wyświetlenie EmptyState
       ├─> "Nie masz jeszcze żadnych fiszek"
       ├─> CTA "Generuj fiszki AI" → /generate
       └─> CTA "Dodaj fiszkę ręcznie" → AddCardModal

5. Filtry nie zwracają wyników
   └─> /cards → Zmiana filtra → GET /api/cards → response: data: []
       ├─> "Brak fiszek spełniających kryteria"
       ├─> Przycisk "Resetuj filtry"
       └─> Powrót do widoku wszystkich fiszek

6. Bardzo długi tekst w back fiszki (500 znaków)
   └─> /cards → FlashcardItem
       ├─> Truncate do 2-3 linii (line-clamp-3)
       ├─> "..." na końcu preview
       └─> Pełna treść dostępna po kliknięciu "Edytuj" → modal

7. Przypadkowe kliknięcie "Usuń"
   └─> /cards → Klik "Usuń" → DeleteConfirmDialog
       ├─> Wymóg potwierdzenia
       ├─> Wyświetlenie podglądu fiszki
       ├─> Ostrzeżenie "Ta akcja jest nieodwracalna"
       └─> Użytkownik może kliknąć "Anuluj" → zamknięcie bez usunięcia
```

---

## 4. Układ i struktura nawigacji

### 4.1 Główna nawigacja (Navbar)

**Lokalizacja:** Top bar na wszystkich chronionych stronach (/generate, /cards, /profile)  
**Brak na:** Stronach publicznych (/, /login, /register)

**Struktura:**

```
┌─────────────────────────────────────────────────────────────┐
│ [Logo/10x-cards]  Generuj fiszki  |  Moje fiszki  |  Profil  [Wyloguj] │
└─────────────────────────────────────────────────────────────┘
```

**Elementy:**
1. **Logo / Nazwa aplikacji** (po lewej)
   - Link do /generate (home dla zalogowanych)
   - Font: bold, większy rozmiar

2. **Linki nawigacyjne** (center)
   - "Generuj fiszki" → /generate
   - "Moje fiszki" → /cards
   - "Profil użytkownika" → /profile
   - Active state: underline lub background color dla aktywnej strony

3. **Przycisk "Wyloguj"** (po prawej)
   - Wywołuje `supabase.auth.signOut()`
   - Przekierowanie do /
   - Styling: secondary button (outline lub subtle)

**Responsywność:**
- **Desktop (> 1024px):**
  - Horizontal layout
  - Wszystkie elementy widoczne
  - Spacing: justify-between

- **Tablet (640-1024px):**
  - Horizontal layout
  - Mniejszy font size
  - Logo skrócone do inicjałów (opcjonalnie)

- **Mobile (< 640px):**
  - **Nierozstrzygnięte w notatach sesji**
  - **Opcje:**
    1. Hamburger menu (collapse do drawer)
    2. Bottom navigation bar z ikonami
    3. Stacked vertical menu (zawsze widoczny)
  - **Rekomendacja**: Bottom navigation bar z ikonami (dla 3 elementów wystarczy, mobile-friendly)

**Bottom Navigation (rekomendacja dla mobile):**
```
┌─────────────────────────────────────────────┐
│  [Icon: Sparkles]  [Icon: Cards]  [Icon: User]  [Icon: Logout] │
│    Generuj           Fiszki        Profil       Wyloguj  │
└─────────────────────────────────────────────┘
```

### 4.2 Breadcrumbs / Active states

**Nie implementowane w MVP** 

### 4.3 Mapa routingu

```
Public Routes (niezalogowani):
├─ / (Landing Page)
├─ /login
└─ /register

Protected Routes (zalogowani):
├─ /generate (main page after login)
├─ /cards
└─ /profile

Redirects:
├─ zalogowany na / → /generate
├─ zalogowany na /login → /generate
├─ zalogowany na /register → /generate
├─ niezalogowany na /generate → /login
├─ niezalogowany na /cards → /login
└─ niezalogowany na /profile → /login
```

### 4.4 Middleware autoryzacji (Astro)

```typescript
// src/middleware/index.ts
export async function onRequest(context, next) {
  const { pathname } = context.url;
  
  // Ścieżki publiczne
  const publicPaths = ['/', '/login', '/register'];
  
  if (publicPaths.includes(pathname)) {
    // Jeśli zalogowany, przekieruj z /login i /register do /generate
    const session = await getSession(context);
    if (session && ['/login', '/register'].includes(pathname)) {
      return context.redirect('/generate');
    }
    return next();
  }
  
  // Ścieżki chronione - wymagaj sesji
  const session = await getSession(context);
  if (!session) {
    return context.redirect('/login');
  }
  
  // Dodaj session do locals dla dostępu w stronach
  context.locals.session = session;
  context.locals.user = session.user;
  
  return next();
}
```

### 4.5 Interakcje między widokami

**Landing Page (/):**
- CTA "Zaloguj się" → /login
- CTA "Zarejestruj się" → /register

**/login:**
- Link "Nie masz konta? Zarejestruj się" → /register
- Po sukcesie → /generate

**/register:**
- Link "Masz już konto? Zaloguj się" → /login
- Po sukcesie → /generate (automatyczne zalogowanie)

**/generate:**
- Navbar links → /cards, /profile
- Opcjonalnie po zapisaniu fiszek: Button "Zobacz moje fiszki" → /cards

**/cards:**
- Navbar links → /generate, /profile
- EmptyState CTA "Generuj fiszki AI" → /generate
- Button "Dodaj fiszkę ręcznie" → AddCardModal (zostaje w /cards)
- Button "Edytuj" → EditCardModal (zostaje w /cards)
- Button "Usuń" → DeleteConfirmDialog (zostaje w /cards)

**/profile:**
- Navbar links → /generate, /cards

**Wszystkie chronione strony:**
- Button "Wyloguj" → logout + redirect do /

---

## 5. Kluczowe komponenty

### 5.1 Komponenty globalne (używane w wielu widokach)

#### Navbar
**Typ:** Astro component z React islands  
**Lokalizacja:** Wszystkie chronione strony  
**Odpowiedzialność:**
- Wyświetlanie głównej nawigacji
- Zarządzanie active state dla aktualnej strony
- Obsługa wylogowania

**Props:**
- `currentPath: string` - aktywna ścieżka dla highlighting

**Komponenty wewnętrzne:**
- Button (Shadcn/ui) dla "Wyloguj"
- Link components (Astro) dla nawigacji

**Stan:**
- Brak stanu lokalnego (stateless)
- Korzysta z Context API dla session info

---

#### Toast Notifications
**Typ:** React component (sonner lub react-hot-toast)  
**Lokalizacja:** Root layout (dostępny globalnie)  
**Odpowiedzialność:**
- Wyświetlanie powiadomień o sukcesie, błędach, info
- Auto-dismiss po 3-5 sekundach
- Stack notifications (max 3 na raz)

**Variants:**
- Success (zielony): "Fiszki zostały zapisane"
- Error (czerwony): "Wystąpił błąd. Spróbuj ponownie"
- Info (niebieski): "Sesja wygasła. Zaloguj się ponownie"
- Warning (pomarańczowy): "Tekst jest za krótki"

**API:**
```typescript
toast.success('Message')
toast.error('Message')
toast.info('Message')
toast.warning('Message')
```

---

#### AuthContext Provider
**Typ:** React Context  
**Lokalizacja:** Root layout  
**Odpowiedzialność:**
- Zarządzanie sesją użytkownika
- Dostarczanie supabaseClient
- Funkcje login, logout, register

**Context Value:**
```typescript
{
  session: Session | null,
  user: User | null,
  supabaseClient: SupabaseClient,
  login: (email, password) => Promise<void>,
  logout: () => Promise<void>,
  register: (email, password) => Promise<void>,
  isLoading: boolean
}
```

**Hook:**
```typescript
const { session, user, login, logout } = useAuth();
```

---

### 5.2 Komponenty widoku /generate

#### GenerateForm
**Typ:** React component  
**Odpowiedzialność:**
- Główny kontener dla formularza generowania
- Zarządzanie stanem textarea i walidacją
- Wywołanie API i obsługa loading state

**Stan:**
```typescript
const [inputText, setInputText] = useState('')
const [isGenerating, setIsGenerating] = useState(false)
const [error, setError] = useState(null)
```

**Komponenty wewnętrzne:**
- Textarea (Shadcn/ui)
- CharacterCounter (custom)
- Button "Generuj" (Shadcn/ui)
- Inline error messages

**Walidacja:**
- Realtime character count
- Disabled button jeśli <1000 lub >10000 znaków
- Inline error message przy submit

---

#### CharacterCounter
**Typ:** React component  
**Odpowiedzialność:**
- Wyświetlanie liczby znaków
- Kolorowanie według walidacji

**Props:**
```typescript
{
  count: number,
  max: number // 10000
}
```

**Kolory:**
- Czerwony (`text-red-600`): count < 1000 lub count > 10000
- Zielony (`text-green-600`): 1000 <= count <= 10000

**Przykład output:**
```
"2547 / 10000" (zielony)
"850 / 10000" (czerwony)
"11234 / 10000" (czerwony)
```

---

#### LoadingSpinner
**Typ:** React component  
**Odpowiedzialność:**
- Wyświetlanie spinnera podczas generowania AI
- Opcjonalnie: progress bar lub animowane komunikaty

**Props:**
```typescript
{
  message?: string // default: "Generuję fiszki..."
}
```

**Komponenty:**
- Spinner icon (lucide-react: Loader2 z animacją spin)
- Text message

---

#### GeneratedCardsList
**Typ:** React component  
**Odpowiedzialność:**
- Wyświetlanie listy wygenerowanych sugestii
- Zarządzanie selekcją checkboxów
- Umożliwienie inline edycji (nierozstrzygnięte)

**Props:**
```typescript
{
  suggestedCards: Array<{ front: string, back: string }>,
  onSave: (selectedCards: Array<{ front: string, back: string }>) => void
}
```

**Stan:**
```typescript
const [selectedCards, setSelectedCards] = useState<Set<number>>(new Set())
const [editedCards, setEditedCards] = useState<Record<number, { front: string, back: string }>>({})
```

**Komponenty wewnętrzne:**
- Checkbox (Shadcn/ui) per card
- Card display (front + back)
- Button "Edytuj" (opcjonalnie - nierozstrzygnięte)
- Button "Zapisz wybrane fiszki" (disabled gdy selectedCards.size === 0)
- Opcjonalnie: "Zaznacz wszystkie" / "Odznacz wszystkie"

---

#### EmptyResultsMessage
**Typ:** React component  
**Odpowiedzialność:**
- Wyświetlanie komunikatu gdy AI zwróci 0 fiszek

**Props:** Brak

**Content:**
- Ikona (opcjonalnie)
- Nagłówek: "Nie udało się wygenerować fiszek"
- Komunikat: "Spróbuj z innym tekstem lub zmień długość wejścia"

---

### 5.3 Komponenty widoku /cards

#### FiltersBar
**Typ:** React component  
**Odpowiedzialność:**
- Filtry i sortowanie dla listy fiszek
- Przycisk dodawania ręcznej fiszki

**Stan:**
```typescript
const [filterSource, setFilterSource] = useState<'all' | 'ai' | 'manual'>('all')
const [sortBy, setSortBy] = useState<'created_at' | 'updated_at' | 'repetitions'>('created_at')
const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
```

**Komponenty wewnętrzne:**
- 3x Select (Shadcn/ui) dla filtrów
- Button "Dodaj fiszkę ręcznie" (primary)

**Callback:**
- `onFilterChange(source, sortBy, order)` → refetch cards

---

#### FlashcardsGrid
**Typ:** React component  
**Odpowiedzialność:**
- Responsywny grid kontener dla fiszek
- Conditional rendering (EmptyState vs grid)

**Props:**
```typescript
{
  cards: Card[],
  isLoading: boolean,
  onEdit: (card: Card) => void,
  onDelete: (cardId: string) => void
}
```

**Komponenty wewnętrzne:**
- FlashcardItem (per card)
- EmptyState (gdy cards.length === 0)
- Skeleton cards (gdy isLoading)

**Grid classes:**
```css
grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6
```

---

#### FlashcardItem
**Typ:** React component (reużywalny)  
**Odpowiedzialność:**
- Wyświetlanie pojedynczej karty fiszki
- Action buttons (edytuj, usuń)

**Props:**
```typescript
{
  card: Card,
  onEdit: () => void,
  onDelete: () => void
}
```

**Struktura:**
- Card (Shadcn/ui)
  - CardHeader: Front jako CardTitle
  - CardContent: Back (line-clamp-3)
  - CardFooter:
    - Badge "AI" lub "Ręczna"
    - Text "Powtórki: X" (jeśli > 0)
    - Action buttons (on hover desktop, zawsze mobile)

**Styling:**
- Hover effect: `hover:shadow-lg transition-shadow`
- Action buttons: `group-hover:opacity-100 opacity-0` (desktop)

---

#### EditCardModal
**Typ:** React component (Dialog z Shadcn/ui)  
**Odpowiedzialność:**
- Edycja istniejącej fiszki
- Walidacja długości front/back

**Props:**
```typescript
{
  card: Card,
  isOpen: boolean,
  onClose: () => void,
  onSave: (front: string, back: string) => Promise<void>
}
```

**Stan:**
```typescript
const [front, setFront] = useState(card.front)
const [back, setBack] = useState(card.back)
const [isSaving, setIsSaving] = useState(false)
const [errors, setErrors] = useState<{ front?: string, back?: string }>({})
```

**Komponenty wewnętrzne:**
- Dialog, DialogHeader, DialogContent, DialogFooter (Shadcn/ui)
- 2x Textarea z Labels
- 2x CharacterCounter (max 200 dla front, max 500 dla back)
- Button "Anuluj" (secondary)
- Button "Zapisz zmiany" (primary, disabled podczas saving)

**Walidacja:**
- Front: 1-200 znaków
- Back: 1-500 znaków
- Inline error messages

---

#### AddCardModal
**Typ:** React component (Dialog z Shadcn/ui)  
**Odpowiedzialność:**
- Dodawanie nowej ręcznej fiszki

**Props:**
```typescript
{
  isOpen: boolean,
  onClose: () => void,
  onAdd: (front: string, back: string) => Promise<void>
}
```

**Stan i struktura:**
- Identyczna jak EditCardModal, ale:
  - Tytuł: "Dodaj nową fiszkę"
  - Puste pola initial state
  - Button "Dodaj" zamiast "Zapisz zmiany"

---

#### DeleteConfirmDialog
**Typ:** React component (AlertDialog z Shadcn/ui)  
**Odpowiedzialność:**
- Potwierdzenie usunięcia fiszki
- Wyświetlenie podglądu

**Props:**
```typescript
{
  card: Card,
  isOpen: boolean,
  onClose: () => void,
  onConfirm: () => Promise<void>
}
```

**Struktura:**
- AlertDialog (Shadcn/ui)
- AlertDialogHeader: Tytuł "Czy na pewno chcesz usunąć tę fiszkę?"
- AlertDialogContent:
  - Podgląd front (bold, quoted): `"${card.front}"`
  - Warning: "Ta akcja jest nieodwracalna."
- AlertDialogFooter:
  - Button "Anuluj" (secondary)
  - Button "Usuń" (destructive variant, red)

---

#### EmptyState
**Typ:** React component (reużywalny)  
**Odpowiedzialność:**
- Wyświetlanie komunikatu gdy brak fiszek
- Prowadzenie użytkownika do akcji (CTA)

**Props:**
```typescript
{
  onGenerateClick: () => void,
  onAddManualClick: () => void
}
```

**Struktura:**
- Wycentrowany kontener
- Ikona 📚 (lub Book icon z lucide-react)
- Nagłówek h2: "Nie masz jeszcze żadnych fiszek"
- Paragraph: "Zacznij od wygenerowania fiszek przez AI lub utwórz je ręcznie"
- Flex container z 2 buttons:
  - Button "Generuj fiszki AI" (primary) → onClick: onGenerateClick
  - Button "Dodaj fiszkę ręcznie" (secondary) → onClick: onAddManualClick

---

### 5.4 Komponenty widoku /profile

#### ProfileSection
**Typ:** React component  
**Odpowiedzialność:**
- Wyświetlanie informacji o koncie

**Props:**
```typescript
{
  email: string
}
```

**Struktura:**
- Card (Shadcn/ui)
  - CardHeader: Tytuł "Twoje konto"
  - CardContent:
    - Label "Adres e-mail"
    - Input (read-only, disabled) z wartością email

---

### 5.5 Komponenty formularzy (współdzielone)

#### LoginForm
**Typ:** React component  
**Lokalizacja:** /login  
**Odpowiedzialność:**
- Formularz logowania
- Walidacja i obsługa błędów

**Stan:**
```typescript
const [email, setEmail] = useState('')
const [password, setPassword] = useState('')
const [isLoading, setIsLoading] = useState(false)
const [error, setError] = useState<string | null>(null)
```

**Komponenty:**
- 2x Input (Shadcn/ui) z Labels
- Button "Zaloguj się" (disabled podczas loading)
- Spinner w buttonie podczas loading
- Inline error message

**API:**
- `supabase.auth.signInWithPassword({ email, password })`

---

#### RegisterForm
**Typ:** React component  
**Lokalizacja:** /register  
**Odpowiedzialność:**
- Formularz rejestracji
- Walidacja i obsługa błędów

**Stan i struktura:**
- Identyczna jak LoginForm, ale:
  - Button "Zarejestruj się"
  - API: `supabase.auth.signUp({ email, password })`
  - Po sukcesie: automatyczne zalogowanie + redirect do /generate

---

### 5.6 Design Tokens

**Lokalizacja:** `src/lib/design-tokens.ts`

```typescript
export const designTokens = {
  colors: {
    primary: 'hsl(var(--primary))',      // Shadcn primary
    secondary: 'hsl(var(--secondary))',  // Shadcn secondary
    success: 'hsl(142, 76%, 36%)',       // Green
    error: 'hsl(var(--destructive))',    // Red
    warning: 'hsl(38, 92%, 50%)',        // Orange
    muted: 'hsl(var(--muted))',
  },
  
  spacing: {
    xs: '0.25rem',  // 4px
    sm: '0.5rem',   // 8px
    md: '1rem',     // 16px
    lg: '1.5rem',   // 24px
    xl: '2rem',     // 32px
    '2xl': '3rem',  // 48px
  },
  
  fontSize: {
    xs: '0.75rem',   // 12px
    sm: '0.875rem',  // 14px
    base: '1rem',    // 16px
    lg: '1.125rem',  // 18px
    xl: '1.25rem',   // 20px
    '2xl': '1.5rem', // 24px
    '3xl': '1.875rem', // 30px
  },
  
  borderRadius: {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
    full: '9999px',
  },
  
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
  }
}
```

---

### 5.7 Pattern Compositions (wzorce projektowe dla developerów)

#### Pattern 1: Formularz z walidacją
```tsx
<form onSubmit={handleSubmit}>
  <div className="space-y-4">
    <div>
      <Label htmlFor="field">Label</Label>
      <Input
        id="field"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={isLoading}
      />
      {error && (
        <p className="text-sm text-error mt-1">{error}</p>
      )}
    </div>
    
    <Button type="submit" disabled={isLoading}>
      {isLoading ? <Spinner /> : 'Submit'}
    </Button>
  </div>
</form>
```

#### Pattern 2: Lista z empty state
```tsx
{isLoading ? (
  <SkeletonCards />
) : cards.length > 0 ? (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {cards.map(card => (
      <FlashcardItem key={card.id} card={card} />
    ))}
  </div>
) : (
  <EmptyState />
)}
```

#### Pattern 3: Modal workflow
```tsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
    </DialogHeader>
    
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      
      <DialogFooter>
        <Button variant="secondary" onClick={() => setIsOpen(false)}>
          Anuluj
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? <Spinner /> : 'Zapisz'}
        </Button>
      </DialogFooter>
    </form>
  </DialogContent>
</Dialog>
```

#### Pattern 4: Karta z hover actions
```tsx
<Card className="group hover:shadow-lg transition-shadow">
  <CardHeader>
    <CardTitle>{front}</CardTitle>
  </CardHeader>
  
  <CardContent>
    <p className="line-clamp-3">{back}</p>
  </CardContent>
  
  <CardFooter className="flex justify-between items-center">
    <div className="flex gap-2">
      <Badge>{source}</Badge>
      {repetitions > 0 && <span>Powtórki: {repetitions}</span>}
    </div>
    
    <div className="opacity-0 group-hover:opacity-100 md:flex hidden gap-2">
      <Button size="sm" variant="secondary" onClick={onEdit}>
        Edytuj
      </Button>
      <Button size="sm" variant="destructive" onClick={onDelete}>
        Usuń
      </Button>
    </div>
  </CardFooter>
</Card>
```

---

## 6. Integracja z API i zarządzanie stanem

### 6.1 Klient Supabase

**Inicjalizacja:**
```typescript
// src/db/supabase.client.ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.PUBLIC_SUPABASE_URL,
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY
)
```

**Context Provider:**
```typescript
// src/components/AuthProvider.tsx
export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setIsLoading(false)
    })
    
    // Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
      }
    )
    
    return () => subscription.unsubscribe()
  }, [])
  
  const login = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }
  
  const logout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }
  
  const register = async (email, password) => {
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
  }
  
  return (
    <AuthContext.Provider value={{ session, user, login, logout, register, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}
```

### 6.2 Wzorzec wywołań API

**Przykład: Generowanie fiszek**
```typescript
const handleGenerateCards = async (inputText: string) => {
  setIsLoading(true)
  setError(null)
  
  try {
    const response = await fetch('/api/generation-requests', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ input_text: inputText })
    })
    
    if (!response.ok) {
      if (response.status === 429) {
        // Handle rate limit
        const data = await response.json()
        openRateLimitModal(data)
        return
      }
      throw new Error('Generowanie nie powiodło się')
    }
    
    const data = await response.json()
    setSuggestedCards(data.suggested_cards)
    toast.success('Wygenerowano fiszki!')
  } catch (err) {
    setError(err.message)
    toast.error('Wystąpił błąd podczas generowania')
  } finally {
    setIsLoading(false)
  }
}
```

### 6.3 Endpointy wykorzystywane przez UI

**Uwierzytelnianie (Supabase Auth SDK):**
- `supabase.auth.signUp({ email, password })` - rejestracja
- `supabase.auth.signInWithPassword({ email, password })` - logowanie
- `supabase.auth.signOut()` - wylogowanie
- `supabase.auth.getSession()` - sprawdzenie sesji

**Generowanie fiszek:**
- `POST /api/generation-requests`
  - Body: `{ input_text: string }`
  - Response: `{ generation_request_id, generated_count, suggested_cards: [{ front, back }] }`

**Zarządzanie fiszkami:**
- `GET /api/cards?limit=50&source=all&sort=created_at&order=desc` - lista fiszek
- `POST /api/cards` - tworzenie fiszek (array)
  - Body: `[{ front: string, back: string }]`
  - Response: Created card(s) with `source: 'manual'` or `'ai'`
- `PATCH /api/cards/:id` - edycja fiszki
  - Body: `{ front?: string, back?: string }`
  - Response: Updated card
- `DELETE /api/cards/:id` - usuwanie fiszki
  - Response: `{ message, deleted_id }`

**Statystyki (opcjonalnie - nierozstrzygnięte w MVP):**
- `GET /api/stats/cards` - statystyki fiszek
- `GET /api/stats/generation` - statystyki generowania

### 6.4 Zarządzanie stanem aplikacji

**Stan globalny (Context):**
- `AuthContext`: session, user, supabaseClient, login(), logout(), register()

**Stan lokalny (useState w komponentach):**

**Widok /generate:**
```typescript
const [inputText, setInputText] = useState('')
const [isGenerating, setIsGenerating] = useState(false)
const [suggestedCards, setSuggestedCards] = useState([])
const [selectedCards, setSelectedCards] = useState(new Set())
const [error, setError] = useState(null)
```

**Widok /cards:**
```typescript
const [cards, setCards] = useState([])
const [isLoading, setIsLoading] = useState(true)
const [filterSource, setFilterSource] = useState('all')
const [sortBy, setSortBy] = useState('created_at')
const [sortOrder, setSortOrder] = useState('desc')
const [editingCard, setEditingCard] = useState(null)
const [deletingCard, setDeletingCard] = useState(null)
```

**Brak optimistic updates w MVP:**
- Wszystkie operacje czekają na potwierdzenie z serwera
- Loading states na przyciskach/kartach podczas operacji
- Po otrzymaniu response: aktualizacja stanu + toast notification

**Strategia refetch:**
- Po utworzeniu fiszek: refetch listy w /cards (jeśli użytkownik nawiguje)
- Po edycji: aktualizacja konkretnej karty w state (merge z response)
- Po usunięciu: filter out usuniętej karty ze state

### 6.5 Obsługa błędów API

**Trójpoziomowa strategia:**

1. **Toast notifications** (globalne błędy systemowe):
   - 500 Internal Server Error
   - 502 AI Service Unavailable
   - Network errors
   - Generic: "Wystąpił błąd. Spróbuj ponownie"

2. **Inline error messages** (walidacja formularzy):
   - 400 Bad Request
   - Wyświetlane pod polami formularza
   - Przykład: "Przód fiszki musi mieć między 1 a 200 znaków"

3. **Modal** (critical errors):
   - 429 Rate Limit Exceeded
   - RateLimitModal z informacją o limicie i retry_after
   - Przykład: "Przekroczono limit 10 generacji na godzinę. Spróbuj ponownie za 45 minut."

**Obsługa 401 Unauthorized:**
- Automatyczne przekierowanie do /login
- Toast info: "Sesja wygasła. Zaloguj się ponownie"
- Clear local session state

---

## 7. Responsywność, dostępność i bezpieczeństwo

### 7.1 Responsywność

**Breakpointy (Tailwind CSS):**
- Mobile: < 640px (sm)
- Tablet: 640px - 1024px (sm-lg)
- Desktop: > 1024px (lg+)

**Responsive patterns:**

**Grid układy:**
```css
/* FlashcardsGrid */
grid-cols-1           /* Mobile: 1 kolumna */
md:grid-cols-2        /* Tablet: 2 kolumny */
lg:grid-cols-3        /* Desktop: 2-3 kolumny */
```

**Textarea generowania:**
```css
w-full                /* Mobile: full-width */
lg:w-3/5              /* Desktop: 60% szerokości */
min-h-[200px]         /* Minimalna wysokość */
```

**Navbar:**
- Desktop: horizontal navigation
- Mobile: bottom navigation bar z ikonami (rekomendacja)

**Przyciski akcji na kartach:**
- Mobile: zawsze widoczne, ułożone w row
- Desktop: widoczne on hover (`group-hover:opacity-100 opacity-0`)

**Font sizes:**
```css
text-sm md:text-base  /* Mniejszy na mobile, base na desktop */
text-base md:text-lg  /* Base na mobile, większy na desktop */
```

**Spacing:**
```css
gap-4 lg:gap-6        /* Mniejsze gappy na mobile */
p-4 lg:p-6            /* Mniejszy padding na mobile */
```

### 7.2 Dostępność (a11y)

**Status w MVP:** Nie jest priorytetem, ale minimalne wymagania dzięki Shadcn/ui

**Implementowane:**
- Komponenty Shadcn/ui mają wbudowane aria-labels i keyboard navigation
- Formularze używają `<label>` elementów połączonych z inputs (`htmlFor`)
- Buttony mają sensowny tekst (nie tylko ikony)
- Focus states na interaktywnych elementach

**NIE implementowane w MVP:**
- Skip to content links
- Szczegółowe aria-live regions (poza podstawowymi)
- Enhanced keyboard navigation (poza defaults)
- Screen reader optimizations (testing)
- High contrast mode
- Reduced motion preferences

**Podstawowe best practices:**
```tsx
{/* Label połączony z input */}
<Label htmlFor="email">Email</Label>
<Input id="email" type="email" />

{/* Button z sensownym tekstem */}
<Button>Zapisz zmiany</Button>  // Dobrze
<Button><Icon /></Button>       // Źle w MVP

{/* Aria-live dla errors */}
<div role="alert" aria-live="polite">
  {error && <p className="text-error">{error}</p>}
</div>
```

### 7.3 Bezpieczeństwo

**Autoryzacja na poziomie UI:**

**Middleware w Astro:**
```typescript
// src/middleware/index.ts
export async function onRequest(context, next) {
  const { pathname } = context.url
  
  // Publiczne ścieżki
  const publicPaths = ['/', '/login', '/register']
  if (publicPaths.includes(pathname)) {
    // Jeśli zalogowany, przekieruj z /login i /register
    const session = await getSession(context)
    if (session && ['/login', '/register'].includes(pathname)) {
      return context.redirect('/generate')
    }
    return next()
  }
  
  // Chronione ścieżki - wymagaj sesji
  const session = await getSession(context)
  if (!session) {
    return context.redirect('/login')
  }
  
  // Dodaj session do locals dla dostępu w stronach
  context.locals.session = session
  context.locals.user = session.user
  
  return next()
}
```

**Token management:**
- Access token przechowywany w Supabase session (httpOnly cookie lub localStorage)
- Automatyczne dodawanie tokenu do Authorization header w każdym wywołaniu API:
  ```typescript
  headers: {
    'Authorization': `Bearer ${session.access_token}`
  }
  ```
- Refresh token automatycznie obsługiwany przez Supabase SDK

**Walidacja po stronie klienta:**
- Długość tekstu generowania: 1000-10000 znaków
- Długość front fiszki: 1-200 znaków
- Długość back fiszki: 1-500 znaków
- **Brak sanityzacji HTML** - polegamy na walidacji backendowej
- Walidacja formatu email (type="email" w input)

**CSRF Protection:**
- Zapewniana przez Supabase Auth
- SameSite cookies dla sesji
- Token-based authentication (JWT)

**XSS Prevention:**
- React automatycznie escapuje dane w JSX
- Unikanie `dangerouslySetInnerHTML` (nie używane w MVP)
- Sanityzacja inputów na backendzie

**Sensitive data:**
- Hasła nigdy nie są przechowywane w plain text
- Supabase używa bcrypt dla hashowania
- Email i hasło przesyłane tylko przez HTTPS
- Brak logowania sensitive data w console

---

## 8. Nierozstrzygnięte kwestie i rekomendacje

### 8.1 Kwestie wymagające decyzji

**1. Strategia paginacji dla "Moje fiszki":**
- **Problem:** API wspiera limit/offset, ale nie określono jak implementować w UI
- **Opcje:**
  - Infinite scroll (seamless UX)
  - "Load more" button (kontrola użytkownika)
  - Traditional pagination z numerami stron (clear navigation)
- **Rekomendacja dla MVP:** Prosta paginacja z przyciskami "Poprzednia"/"Następna" + info "Strona X z Y"
- **Priorytet:** Medium (można zacząć bez pagination jeśli limit 50 wystarczy)
- **Decyzja:** Prosta paginacja z przyciskami "Poprzednia"/"Następna" + info "Strona X z Y"

**2. Nawigacja mobile:**
- **Problem:** Nie określono jak navbar będzie wyglądał na mobile
- **Opcje:**
  - Hamburger menu (classic)
  - Bottom navigation bar z ikonami (mobile-friendly)
  - Stacked vertical menu (zawsze widoczny)
- **Rekomendacja:** Bottom navigation bar z ikonami (dla 3 elementów wystarczy, thumb-friendly)
- **Priorytet:** High (kluczowe dla mobile UX)
- **Decyzja:** Bottom navigation bar z ikonami (dla 3 elementów wystarczy, thumb-friendly)

**3. Proaktywny rate limit counter:**
- **Problem:** Czy pokazywać użytkownikowi "Pozostało X/10 generacji w tej godzinie"?
- **Rekomendacja:** NIE w MVP - pokazuj tylko reaktywnie (modal po przekroczeniu)
- **Priorytet:** Low (nice to have, nie kluczowe)
- **Decyzja:** Nie implementuj w MVP

**4. Inline editing vs modal dla generowanych fiszek:**
- **Problem:** W sekcji rezultatów generowania - jak edytować przed zapisaniem?
- **Opcje:**
  - Inline editing (contentEditable lub małe input fields)
  - Mini-modal dla edycji
  - Brak edycji przed zapisaniem (edycja tylko po zapisaniu w /cards)
- **Rekomendacja:** Inline editing (małe textarea fields) bezpośrednio w liście rezultatów dla szybszej edycji
- **Priorytet:** Medium (usprawnia workflow, ale nie konieczne w MVP)
- **Decyzja:** Nie implementuj w MVP

**5. Persistence sugestii AI przy odświeżeniu:**
- **Problem:** Czy wygenerowane sugestie (przed zapisaniem) powinny być zachowane przy odświeżeniu strony?
- **Rekomendacja:** NIE w MVP - user musi zaakceptować w tej samej sesji. Jeśli problem, dodać sessionStorage persistence.
- **Dodatkowo:** Implementuj debounced autosave textarea do localStorage (co 5s) z promptem "Chcesz przywrócić poprzednią sesję?"
- **Priorytet:** High dla autosave textarea (zapobiega utracie długiego tekstu), Low dla persistence sugestii
- **Decyzja:** Nie implementuj w MVP

**6. Tooltip dla truncated text:**
- **Problem:** Back fiszki jest truncated do 2-3 linii. Czy pokazywać tooltip z pełną treścią on hover?
- **Rekomendacja:** NIE w MVP - użyj CSS line-clamp-3 bez dodatkowych tooltipów. Pełna treść dostępna po kliknięciu "Edytuj"
- **Priorytet:** Low (nice to have)
- **Decyzja:** Nie implementuj w MVP

**7. Statystyki w profilu:**
- **Problem:** Pierwotnie rekomendowane, ale profil został uproszczony. Gdzie pokazywać statystyki?
- **Opcje:**
  - Osobna strona /stats
  - Dashboard card na /generate
  - Sekcja w /profile
  - Brak w MVP
- **Rekomendacja:** Jeśli statystyki są częścią MVP requirements (metryki sukcesu), dodać osobną stronę /stats lub dashboard card na /generate
- **Priorytet:** Medium (zależy od wymagań metryki sukcesu)
- **Decyzja:** Nie implementuj w MVP

**8. Zmiana hasła:**
- **Problem:** Uproszczono profil do tylko emaila. Czy zmiana hasła powinna być dostępna?
- **Rekomendacja:** Dodać w przyszłości jako osobna strona /profile/change-password lub sekcja w profilu
- **Priorytet:** Low (można pominąć w MVP, użytkownik może użyć "Forgot password" flow)
- **Decyzja:** Nie implementuj w MVP

**9. Obsługa bardzo dużej liczby fiszek (>1000):**
- **Problem:** UI został zaprojektowany dla typowego use case. Co z power users?
- **Rekomendacja:** Backend już wspiera pagination (max 100). W przyszłości dodać:
  - Search/filter by text content (full-text search)
  - Tags/categories
  - Folders
- **Priorytet:** Low (poza MVP)

**10. Select all / Deselect all w GeneratedCardsList:**
- **Problem:** Nie określono czy dodawać te funkcje
- **Rekomendacja:** TAK - dodaj checkboxy "Zaznacz wszystkie" / "Odznacz wszystkie" nad listą sugestii
- **Priorytet:** High (znacząco usprawnia UX gdy jest 10 fiszek)
- **Decyzja:** TAK - dodaj checkboxy "Zaznacz wszystkie" / "Odznacz wszystkie" nad listą sugestii

---

## 9. Podsumowanie

Architektura UI dla aplikacji 10x-cards została zaprojektowana z myślą o:

✅ **Prostocie i minimalizmie** - odpowiednie dla MVP  
✅ **Responsywności** - mobile-first approach z trzema breakpointami  
✅ **Szybkim time-to-market** - wykorzystanie Shadcn/ui i gotowych wzorców  
✅ **Skalowalności** - struktura komponentów umożliwia łatwą rozbudowę  
✅ **Bezpieczeństwie** - middleware autoryzacji + Supabase Auth  
✅ **Dobrym UX** - jasne przepływy, wyraźny feedback, obsługa błędów  

**Kluczowe decyzje architektoniczne:**
- MPA pattern (Astro) zamiast SPA
- React components dla interaktywności
- Context API dla auth, useState dla lokalnego stanu
- Trójpoziomowa obsługa błędów (toast/inline/modal)
- Brak optimistic updates (priorytet: pewność)
- Shadcn/ui jako foundation dla UI components

**Główne przepływy użytkownika:**
1. Rejestracja → Generowanie przez AI → Akceptacja fiszek → Zarządzanie w /cards
2. Logowanie → Przegląd istniejących fiszek → Edycja/usuwanie → Generowanie nowych
3. Dodawanie ręcznych fiszek → Filtrowanie i sortowanie → Organizacja kolekcji

**Widoki i ich role:**
- `/` - Landing page (marketing)
- `/login` + `/register` - Uwierzytelnianie
- `/generate` - Główna funkcjonalność (AI generation)
- `/cards` - Zarządzanie kolekcją (CRUD)
- `/profile` - Informacje o koncie (minimal w MVP)

Architektura jest gotowa do implementacji z jasno określonymi komponentami, przepływami użytkownika i integracją z API. Nierozstrzygnięte kwestie zostały udokumentowane z rekomendacjami dla szybkiego podejmowania decyzji podczas implementacji.
