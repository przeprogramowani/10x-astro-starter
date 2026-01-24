# Plan implementacji widoku Generowanie fiszek

## 1. Przegląd

Widok generowania fiszek (`/generate`) jest główną funkcjonalnością aplikacji 10x-cards, umożliwiającą użytkownikom automatyczne tworzenie fiszek edukacyjnych przy pomocy sztucznej inteligencji. Użytkownik wkleja tekst źródłowy (1000-10000 znaków), aplikacja komunikuje się z modelem LLM i generuje propozycje fiszek w formacie pytanie-odpowiedź. Użytkownik może następnie przejrzeć sugestie, zaznaczyć te, które chce zachować, i zapisać je do swojej kolekcji.

Widok składa się z czterech głównych stanów:
1. **Stan początkowy** - formularz z pustym polem tekstowym
2. **Stan walidacji** - walidacja długości tekstu z wizualnym feedbackiem
3. **Stan ładowania** - prezentacja wizualnego wskaźnika podczas generowania (może trwać do 30 sekund)
4. **Stan wyników** - lista wygenerowanych sugestii z możliwością selekcji i zapisu

Widok jest chroniony i wymaga uwierzytelnienia użytkownika. Po zalogowaniu jest to domyślna strona, na którą użytkownik jest przekierowywany.

## 2. Routing widoku

**Ścieżka:** `/generate`

**Typ:** Chroniony - wymaga uwierzytelnienia

**Middleware:** 
- Sprawdzenie sesji Supabase
- Jeśli użytkownik niezalogowany → przekierowanie do `/login`
- Jeśli użytkownik zalogowany → dostęp do widoku

**Layout:** Wykorzystuje standardowy layout z Navbar dla zalogowanych użytkowników

## 3. Struktura komponentów

```
GeneratePage (Astro)
└── GenerateView (React)
    ├── GenerateForm
    │   ├── Label
    │   ├── Textarea (Shadcn/ui)
    │   ├── CharacterCounter
    │   └── Button "Generuj" (Shadcn/ui)
    │
    ├── LoadingState (warunkowe renderowanie)
    │   ├── Spinner (lucide-react: Loader2)
    │   └── Text "Generuję fiszki..."
    │
    ├── GeneratedCardsList (warunkowe renderowanie)
    │   ├── SelectionControls
    │   │   ├── Checkbox "Zaznacz wszystkie"
    │   │   └── Checkbox "Odznacz wszystkie"
    │   │
    │   ├── CardSuggestionItem[] (lista)
    │   │   ├── Checkbox (Shadcn/ui)
    │   │   ├── Card (Shadcn/ui)
    │   │   │   ├── CardHeader: Front jako CardTitle
    │   │   │   └── CardContent: Back
    │   │   └── (opcjonalnie) Inline edit controls
    │   │
    │   └── Button "Zapisz wybrane fiszki" (Shadcn/ui)
    │
    └── EmptyResultsMessage (warunkowe renderowanie)
        ├── Icon (AlertCircle z lucide-react)
        ├── Heading "Nie udało się wygenerować fiszek"
        └── Text "Spróbuj z innym tekstem lub zmień długość wejścia"
```

## 4. Szczegóły komponentów

### 4.1 GeneratePage (Astro)

**Opis:** Główna strona Astro hostująca widok generowania. Odpowiada za sprawdzenie uwierzytelnienia i przekazanie danych użytkownika do komponentu React.

**Główne elementy:**
- Import Layout z Navbar
- Sprawdzenie sesji użytkownika przez middleware
- Rendering komponentu `GenerateView` jako React island
- Przekazanie danych sesji do komponentu

**Propsy przekazywane do GenerateView:**
```typescript
interface GenerateViewProps {
  userId: string;
  userEmail: string;
}
```

**Odpowiedzialność:**
- Sprawdzenie autoryzacji
- Server-side rendering layoutu
- Hydratacja React componentu z danymi użytkownika

---

### 4.2 GenerateView (React)

**Opis:** Główny kontener React zarządzający całym przepływem generowania fiszek. Koordynuje wszystkie podkomponenty i zarządza stanem widoku.

**Główne elementy:**
- Kontener z responsywnym paddingiem
- Heading "Generuj fiszki przez AI"
- Warunkowe renderowanie GenerateForm, LoadingState, GeneratedCardsList lub EmptyResultsMessage

**Obsługiwane interakcje:**
- Delegowanie obsługi submitu formularza do GenerateForm
- Zarządzanie stanem ładowania
- Zarządzanie wynikami generowania
- Delegowanie zapisu fiszek do backendu

**Obsługiwana walidacja:**
- Brak - walidacja delegowana do GenerateForm

**Typy:**
- `GenerateViewProps` - propsy otrzymane z Astro
- `ViewState` - stan widoku (idle, loading, results, empty)
- `SuggestedCardDTO[]` - tablica wygenerowanych sugestii
- `GenerationRequestResponseDTO` - odpowiedź z API

**Propsy:**
```typescript
interface GenerateViewProps {
  userId: string;
  userEmail: string;
}
```

---

### 4.3 GenerateForm (React)

**Opis:** Formularz wprowadzania tekstu źródłowego z walidacją długości i wizualnym feedbackiem. Odpowiada za zbieranie danych wejściowych i inicjowanie generowania.

**Główne elementy:**
- `<form>` element z onSubmit handler
- Label "Wklej tekst do wygenerowania fiszek" połączony z textarea
- Textarea (Shadcn/ui) - full-width na mobile, 60% na desktop, min-height: 200px
- CharacterCounter poniżej textarea
- Button "Generuj" (primary variant, disabled podczas walidacji lub ładowania)
- Inline error message (jeśli walidacja nie przechodzi)

**Obsługiwane interakcje:**
- onChange textarea → aktualizacja licznika znaków w czasie rzeczywistym
- onSubmit formularza → walidacja + wywołanie API generowania
- Blokowanie submitu gdy tekst < 1000 lub > 10000 znaków
- Blokowanie submitu podczas ładowania
- Enter w textarea nie submituje (multi-line input)

**Obsługiwana walidacja:**
- Długość tekstu: 1000-10000 znaków (client-side)
- Wyświetlenie inline error message jeśli walidacja nie przechodzi
- Disabled state przycisku "Generuj" gdy walidacja nie OK
- Komunikat: "Tekst musi mieć między 1000 a 10000 znaków"

**Typy:**
- `CreateGenerationRequestCommand` - payload do API: `{ input_text: string }`
- `GenerationRequestResponseDTO` - odpowiedź z API

**Propsy:**
```typescript
interface GenerateFormProps {
  onSubmit: (inputText: string) => Promise<void>;
  isLoading: boolean;
}
```

---

### 4.4 CharacterCounter (React)

**Opis:** Komponent wyświetlający licznik znaków z kolorową walidacją wizualną. Zapewnia natychmiastowy feedback użytkownikowi o statusie walidacji.

**Główne elementy:**
- Span z dynamiczną klasą koloru (czerwony lub zielony)
- Format tekstu: "X / 10000"
- Aria-live="polite" dla dostępności

**Obsługiwane interakcje:**
- Brak - komponent prezentacyjny

**Obsługiwana walidacja:**
- Wizualna walidacja poprzez kolor:
  - Czerwony (`text-red-600`): count < 1000 lub count > 10000
  - Zielony (`text-green-600`): 1000 <= count <= 10000

**Typy:**
- `CharacterCounterProps` - propsy komponentu

**Propsy:**
```typescript
interface CharacterCounterProps {
  count: number;
  max: number; // 10000
}
```

---

### 4.5 LoadingState (React)

**Opis:** Komponent wyświetlany podczas generowania fiszek przez AI. Pokazuje spinner i tekst informacyjny. Generowanie może trwać do 30 sekund.

**Główne elementy:**
- Kontener wycentrowany
- Spinner icon (Loader2 z lucide-react z animacją `animate-spin`)
- Text "Generuję fiszki..." lub opcjonalnie dynamiczny komunikat

**Obsługiwane interakcje:**
- Brak - komponent prezentacyjny bez interakcji

**Obsługiwana walidacja:**
- Brak

**Typy:**
- `LoadingStateProps` - propsy komponentu (opcjonalny message)

**Propsy:**
```typescript
interface LoadingStateProps {
  message?: string; // default: "Generuję fiszki..."
}
```

---

### 4.6 GeneratedCardsList (React)

**Opis:** Główny komponent wyświetlający listę wygenerowanych sugestii fiszek. Pozwala na selekcję fiszek poprzez checkboxy, masową selekcję/deselekcję oraz zapis wybranych fiszek do bazy.

**Główne elementy:**
- Kontener z headingiem "Wygenerowane fiszki"
- SelectionControls (checkboxy "Zaznacz wszystkie" / "Odznacz wszystkie")
- Lista CardSuggestionItem (5-10 elementów)
- Button "Zapisz wybrane fiszki" (primary, disabled gdy 0 zaznaczonych)

**Obsługiwane interakcje:**
- onChange na checkboxach pojedynczych kart → aktualizacja selectedCards Set
- onClick "Zaznacz wszystkie" → zaznaczenie wszystkich checkboxów
- onClick "Odznacz wszystkie" → odznaczenie wszystkich checkboxów
- onClick "Zapisz wybrane fiszki" → wywołanie POST /api/cards z zaznaczonymi fiszkami
- Disabled button gdy selectedCards.size === 0

**Obsługiwana walidacja:**
- Button "Zapisz" disabled gdy brak zaznaczonych fiszek
- Minimalnie 1 fiszka musi być zaznaczona do zapisu

**Typy:**
- `SuggestedCardDTO[]` - lista sugestii z API
- `Set<number>` - indeksy zaznaczonych fiszek
- `CreateCardCommand[]` - payload do POST /api/cards

**Propsy:**
```typescript
interface GeneratedCardsListProps {
  suggestedCards: SuggestedCardDTO[];
  onSave: (selectedCards: CreateCardCommand[]) => Promise<void>;
  isSaving: boolean;
}
```

---

### 4.7 SelectionControls (React)

**Opis:** Komponent zawierający kontrolki do masowej selekcji/deselekcji fiszek. Upraszcza obsługę gdy jest wiele sugestii (5-10).

**Główne elementy:**
- Flex container z dwoma elementami
- Button "Zaznacz wszystkie" (secondary variant)
- Button "Odznacz wszystkie" (secondary variant)

**Obsługiwane interakcje:**
- onClick "Zaznacz wszystkie" → callback do rodzica z akcją selectAll
- onClick "Odznacz wszystkie" → callback do rodzica z akcją deselectAll

**Obsługiwana walidacja:**
- Brak

**Typy:**
- `SelectionControlsProps` - propsy komponentu

**Propsy:**
```typescript
interface SelectionControlsProps {
  onSelectAll: () => void;
  onDeselectAll: () => void;
}
```

---

### 4.8 CardSuggestionItem (React)

**Opis:** Pojedyncza pozycja na liście wygenerowanych sugestii. Wyświetla fiszkę w formie karty z checkboxem do zaznaczenia.

**Główne elementy:**
- Flex container (checkbox + card)
- Checkbox (Shadcn/ui) po lewej stronie
- Card (Shadcn/ui) z:
  - CardHeader: Front jako CardTitle (bold, larger font)
  - CardContent: Back jako paragraph

**Obsługiwane interakcje:**
- onChange checkbox → callback do rodzica z indeksem fiszki
- (opcjonalnie) onClick na "Edytuj" → inline editing (nierozstrzygnięte w MVP)

**Obsługiwana walidacja:**
- Brak - sugestie już zwalidowane przez API

**Typy:**
- `SuggestedCardDTO` - pojedyncza sugestia
- `boolean` - stan zaznaczenia

**Propsy:**
```typescript
interface CardSuggestionItemProps {
  card: SuggestedCardDTO;
  index: number;
  isSelected: boolean;
  onSelectionChange: (index: number, selected: boolean) => void;
}
```

---

### 4.9 EmptyResultsMessage (React)

**Opis:** Komponent wyświetlany gdy AI zwróci 0 fiszek (generated_count: 0). Informuje użytkownika o problemie i sugeruje działania.

**Główne elementy:**
- Wycentrowany kontener
- Icon AlertCircle (lucide-react)
- Heading "Nie udało się wygenerować fiszek"
- Paragraph "Spróbuj z innym tekstem lub zmień długość wejścia"

**Obsługiwane interakcje:**
- Brak - komponent prezentacyjny

**Obsługiwana walidacja:**
- Brak

**Typy:**
- Brak - komponent nie przyjmuje propsów

**Propsy:**
```typescript
// Komponent bez propsów
```

---

## 5. Typy

### 5.1 Typy żądań API (Request DTOs)

```typescript
/**
 * Payload do POST /api/generation-requests
 * Zawiera tylko tekst wejściowy od użytkownika
 */
interface CreateGenerationRequestCommand {
  input_text: string; // 1000-10000 znaków
}

/**
 * Payload do POST /api/cards
 * Tablica obiektów fiszek do zapisania
 * Każda fiszka zawiera tylko front i back
 */
type CreateCardCommand = {
  front: string; // 1-200 znaków
  back: string;  // 1-500 znaków
}[];
```

### 5.2 Typy odpowiedzi API (Response DTOs)

```typescript
/**
 * Odpowiedź z POST /api/generation-requests
 * Zawiera metadane generowania oraz listę sugestii
 */
interface GenerationRequestResponseDTO {
  generation_request_id: string;  // UUID
  generated_count: number;         // 0-10
  suggested_cards: SuggestedCardDTO[];
  created_at: string;              // ISO 8601
}

/**
 * Pojedyncza sugestia fiszki z AI
 * Nie jest jeszcze zapisana w bazie
 */
interface SuggestedCardDTO {
  front: string;
  back: string;
}

/**
 * Odpowiedź z POST /api/cards
 * Zwraca utworzone fiszki z dodatkowymi polami
 */
interface CardDTO {
  id: string;              // UUID
  user_id: string;         // UUID
  front: string;
  back: string;
  repetitions: number;     // zawsze 0 dla nowych
  source: 'ai' | 'manual'; // zawsze 'ai' dla generowanych
  created_at: string;      // ISO 8601
  updated_at: string;      // ISO 8601
}
```

### 5.3 Typy błędów (Error Response DTOs)

```typescript
/**
 * Błąd walidacji 400 Bad Request
 * Zawiera szczegóły o polach, które nie przeszły walidacji
 */
interface ValidationErrorResponseDTO {
  error: string;              // "Validation failed"
  details: ValidationErrorDetailDTO[];
}

interface ValidationErrorDetailDTO {
  field: string;              // np. "input_text"
  message: string;            // np. "Input text must be between 1000 and 10000 characters"
  value?: unknown;            // opcjonalnie wartość, która nie przeszła walidacji
}

/**
 * Błąd rate limit 429 Too Many Requests
 * Zawiera informacje o limicie i czasie do ponowienia
 */
interface RateLimitErrorResponseDTO {
  error: string;              // "Rate limit exceeded"
  message: string;            // "Maximum 10 generation requests per hour. Try again in 45 minutes."
  retry_after: number;        // Sekundy do ponowienia (np. 2700 = 45 minut)
}

/**
 * Błąd AI service 502 Bad Gateway
 * Gdy usługa AI jest niedostępna
 */
interface AIServiceErrorResponseDTO {
  error: string;              // "AI service unavailable"
  message: string;            // "Unable to generate flashcards at this time. Please try again later."
}

/**
 * Ogólny błąd serwera 500 Internal Server Error
 */
interface ErrorResponseDTO {
  error: string;              // np. "Internal server error"
  message: string;            // Przyjazny komunikat dla użytkownika
}
```

### 5.4 Typy stanu widoku (View State Types)

```typescript
/**
 * Stan głównego widoku GenerateView
 */
type ViewState = 'idle' | 'loading' | 'results' | 'empty';

/**
 * Stan formularza GenerateForm
 */
interface FormState {
  inputText: string;
  characterCount: number;
  isValid: boolean;
  error: string | null;
}

/**
 * Stan listy wyników GeneratedCardsList
 */
interface ResultsState {
  suggestedCards: SuggestedCardDTO[];
  selectedIndices: Set<number>;
  isSaving: boolean;
}
```

### 5.5 Typy propsów komponentów

```typescript
// Propsy głównego widoku
interface GenerateViewProps {
  userId: string;
  userEmail: string;
}

// Propsy formularza
interface GenerateFormProps {
  onSubmit: (inputText: string) => Promise<void>;
  isLoading: boolean;
}

// Propsy licznika znaków
interface CharacterCounterProps {
  count: number;
  max: number; // 10000
}

// Propsy stanu ładowania
interface LoadingStateProps {
  message?: string;
}

// Propsy listy wyników
interface GeneratedCardsListProps {
  suggestedCards: SuggestedCardDTO[];
  onSave: (selectedCards: CreateCardCommand[]) => Promise<void>;
  isSaving: boolean;
}

// Propsy kontrolek selekcji
interface SelectionControlsProps {
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

// Propsy pojedynczej sugestii
interface CardSuggestionItemProps {
  card: SuggestedCardDTO;
  index: number;
  isSelected: boolean;
  onSelectionChange: (index: number, selected: boolean) => void;
}
```

---

## 6. Zarządzanie stanem

### 6.1 Stan globalny

**Brak dodatkowego stanu globalnego** - widok korzysta z:
- `AuthContext` (Context API) dla sesji użytkownika - już istniejący
- Stan lokalny komponentów React (useState)

### 6.2 Stan lokalny GenerateView

```typescript
const [viewState, setViewState] = useState<ViewState>('idle');
const [suggestedCards, setSuggestedCards] = useState<SuggestedCardDTO[]>([]);
const [error, setError] = useState<string | null>(null);
```

**Przepływ stanów:**
1. `idle` - stan początkowy, wyświetla formularz
2. `loading` - podczas generowania, wyświetla LoadingState
3. `results` - po otrzymaniu sugestii, wyświetla GeneratedCardsList
4. `empty` - gdy AI zwróci 0 fiszek, wyświetla EmptyResultsMessage

### 6.3 Stan lokalny GenerateForm

```typescript
const [inputText, setInputText] = useState('');
const [characterCount, setCharacterCount] = useState(0);
const [validationError, setValidationError] = useState<string | null>(null);
```

**Logika walidacji:**
```typescript
const isValid = characterCount >= 1000 && characterCount <= 10000;
const buttonDisabled = !isValid || isLoading;
```

### 6.4 Stan lokalny GeneratedCardsList

```typescript
const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
const [isSaving, setIsSaving] = useState(false);
```

**Logika selekcji:**
```typescript
// Dodanie/usunięcie z selekcji
const toggleSelection = (index: number) => {
  setSelectedIndices(prev => {
    const next = new Set(prev);
    if (next.has(index)) {
      next.delete(index);
    } else {
      next.add(index);
    }
    return next;
  });
};

// Zaznacz wszystkie
const selectAll = () => {
  setSelectedIndices(new Set(suggestedCards.map((_, i) => i)));
};

// Odznacz wszystkie
const deselectAll = () => {
  setSelectedIndices(new Set());
};
```

### 6.5 Custom Hook (opcjonalny)

**useGenerateFlashcards** - enkapsuluje logikę generowania:

```typescript
interface UseGenerateFlashcardsReturn {
  generateFlashcards: (inputText: string) => Promise<void>;
  saveSelectedCards: (selectedCards: CreateCardCommand[]) => Promise<void>;
  viewState: ViewState;
  suggestedCards: SuggestedCardDTO[];
  error: string | null;
  isLoading: boolean;
  isSaving: boolean;
}

function useGenerateFlashcards(): UseGenerateFlashcardsReturn {
  const [viewState, setViewState] = useState<ViewState>('idle');
  const [suggestedCards, setSuggestedCards] = useState<SuggestedCardDTO[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const { session } = useAuth(); // z AuthContext
  
  const generateFlashcards = async (inputText: string) => {
    setIsLoading(true);
    setError(null);
    setViewState('loading');
    
    try {
      const response = await fetch('/api/generation-requests', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ input_text: inputText })
      });
      
      if (!response.ok) {
        // Obsługa błędów...
        throw new Error('Failed to generate');
      }
      
      const data: GenerationRequestResponseDTO = await response.json();
      
      if (data.generated_count === 0) {
        setViewState('empty');
      } else {
        setSuggestedCards(data.suggested_cards);
        setViewState('results');
      }
    } catch (err) {
      setError(err.message);
      setViewState('idle');
    } finally {
      setIsLoading(false);
    }
  };
  
  const saveSelectedCards = async (selectedCards: CreateCardCommand[]) => {
    setIsSaving(true);
    
    try {
      const response = await fetch('/api/cards', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(selectedCards)
      });
      
      if (!response.ok) {
        throw new Error('Failed to save cards');
      }
      
      // Success - pokazać toast i reset
      toast.success('Fiszki zostały zapisane');
      setViewState('idle');
      setSuggestedCards([]);
    } catch (err) {
      toast.error('Wystąpił błąd podczas zapisywania fiszek');
    } finally {
      setIsSaving(false);
    }
  };
  
  return {
    generateFlashcards,
    saveSelectedCards,
    viewState,
    suggestedCards,
    error,
    isLoading,
    isSaving
  };
}
```

**Zalety custom hooka:**
- Enkapsulacja logiki biznesowej
- Łatwiejsze testowanie
- Reużywalność (jeśli potrzebna w przyszłości)
- Czystsza struktura komponentów

---

## 7. Integracja API

### 7.1 POST /api/generation-requests

**Cel:** Wygenerowanie propozycji fiszek przez AI

**Endpoint:** `POST /api/generation-requests`

**Request Headers:**
```typescript
{
  'Authorization': `Bearer ${session.access_token}`,
  'Content-Type': 'application/json'
}
```

**Request Body:**
```typescript
{
  input_text: string // 1000-10000 znaków
}
```

**Response Success (200 OK):**
```typescript
{
  generation_request_id: string,
  generated_count: number,
  suggested_cards: [
    { front: string, back: string },
    // ... 5-10 sugestii
  ],
  created_at: string
}
```

**Response Error (400 Bad Request):**
```typescript
{
  error: "Validation failed",
  details: [
    {
      field: "input_text",
      message: "Input text must be between 1000 and 10000 characters"
    }
  ]
}
```

**Response Error (429 Too Many Requests):**
```typescript
{
  error: "Rate limit exceeded",
  message: "Maximum 10 generation requests per hour. Try again in 45 minutes.",
  retry_after: 2700 // sekundy
}
```

**Response Error (502 Bad Gateway):**
```typescript
{
  error: "AI service unavailable",
  message: "Unable to generate flashcards at this time. Please try again later."
}
```

**Obsługa w komponencie:**
```typescript
const handleGenerate = async (inputText: string) => {
  setIsLoading(true);
  setError(null);
  
  try {
    const response = await fetch('/api/generation-requests', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ input_text: inputText })
    });
    
    if (response.status === 429) {
      const data: RateLimitErrorResponseDTO = await response.json();
      // Pokazać modal z informacją o rate limit
      showRateLimitModal(data);
      return;
    }
    
    if (response.status === 502) {
      toast.error('Usługa AI niedostępna. Spróbuj później.');
      return;
    }
    
    if (!response.ok) {
      throw new Error('Generowanie nie powiodło się');
    }
    
    const data: GenerationRequestResponseDTO = await response.json();
    
    if (data.generated_count === 0) {
      setViewState('empty');
    } else {
      setSuggestedCards(data.suggested_cards);
      setViewState('results');
    }
  } catch (err) {
    toast.error('Wystąpił błąd. Spróbuj ponownie.');
    setError(err.message);
  } finally {
    setIsLoading(false);
  }
};
```

---

### 7.2 POST /api/cards

**Cel:** Zapisanie zaznaczonych fiszek do bazy danych

**Endpoint:** `POST /api/cards`

**Request Headers:**
```typescript
{
  'Authorization': `Bearer ${session.access_token}`,
  'Content-Type': 'application/json'
}
```

**Request Body:**
```typescript
[
  { front: string, back: string },
  { front: string, back: string },
  // ... zaznaczone fiszki
]
```

**Response Success (201 Created):**
```typescript
// Dla wielu fiszek - tablica
[
  {
    id: string,
    user_id: string,
    front: string,
    back: string,
    repetitions: 0,
    source: 'ai',
    created_at: string,
    updated_at: string
  },
  // ...
]

// Dla pojedynczej fiszki - obiekt
{
  id: string,
  user_id: string,
  front: string,
  back: string,
  repetitions: 0,
  source: 'ai',
  created_at: string,
  updated_at: string
}
```

**Response Error (400 Bad Request):**
```typescript
{
  error: "Validation failed",
  details: [
    {
      field: "0.front",
      message: "Front must be between 1 and 200 characters"
    }
  ]
}
```

**Obsługa w komponencie:**
```typescript
const handleSaveCards = async (selectedIndices: Set<number>) => {
  setIsSaving(true);
  
  // Filtrowanie zaznaczonych fiszek
  const cardsToSave: CreateCardCommand[] = Array.from(selectedIndices)
    .map(index => suggestedCards[index])
    .map(card => ({
      front: card.front,
      back: card.back
    }));
  
  try {
    const response = await fetch('/api/cards', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(cardsToSave)
    });
    
    if (!response.ok) {
      throw new Error('Zapis nie powiódł się');
    }
    
    // Success
    toast.success('Fiszki zostały zapisane');
    
    // Reset widoku
    setViewState('idle');
    setSuggestedCards([]);
    setInputText('');
    
    // Opcjonalnie: przekierowanie do /cards
    // navigate('/cards');
  } catch (err) {
    toast.error('Wystąpił błąd podczas zapisywania fiszek');
  } finally {
    setIsSaving(false);
  }
};
```

---

## 8. Interakcje użytkownika

### 8.1 Wklejanie i edycja tekstu

**Akcja:** Użytkownik wkleja lub wpisuje tekst w textarea

**Reakcja systemu:**
1. Aktualizacja `inputText` state w czasie rzeczywistym
2. Obliczenie `characterCount` (inputText.length)
3. Aktualizacja CharacterCounter z nowym countem
4. Zmiana koloru licznika:
   - Czerwony jeśli < 1000 lub > 10000
   - Zielony jeśli 1000-10000
5. Aktualizacja disabled state przycisku "Generuj":
   - Disabled jeśli < 1000 lub > 10000
   - Enabled jeśli 1000-10000

**Edge cases:**
- Pusty textarea: count = 0, przycisk disabled, licznik czerwony
- Tekst dokładnie 1000 znaków: licznik zielony, przycisk enabled
- Tekst dokładnie 10000 znaków: licznik zielony, przycisk enabled
- Tekst 999 znaków: licznik czerwony, przycisk disabled
- Tekst 10001 znaków: licznik czerwony, przycisk disabled

---

### 8.2 Kliknięcie "Generuj"

**Akcja:** Użytkownik klika przycisk "Generuj" (lub submit formularza)

**Warunki wstępne:**
- Tekst ma 1000-10000 znaków
- Przycisk nie jest w stanie disabled
- Widok nie jest w stanie loading

**Reakcja systemu:**
1. Zmiana `viewState` na 'loading'
2. Wyświetlenie LoadingState (spinner + "Generuję fiszki...")
3. Disabled textarea i przycisku
4. Wywołanie POST /api/generation-requests
5. Oczekiwanie na odpowiedź (do 30 sekund)

**Po otrzymaniu odpowiedzi:**
- **Sukces (200 OK):**
  1. Parsowanie `GenerationRequestResponseDTO`
  2. Jeśli `generated_count > 0`:
     - Zapisanie `suggested_cards` do state
     - Zmiana `viewState` na 'results'
     - Wyświetlenie GeneratedCardsList
  3. Jeśli `generated_count === 0`:
     - Zmiana `viewState` na 'empty'
     - Wyświetlenie EmptyResultsMessage

- **Błąd 400 (Validation):**
  1. Parsowanie `ValidationErrorResponseDTO`
  2. Wyświetlenie inline error message pod textarea
  3. Powrót do stanu 'idle'

- **Błąd 429 (Rate Limit):**
  1. Parsowanie `RateLimitErrorResponseDTO`
  2. Otwarcie modalu z informacją o limicie
  3. Wyświetlenie `retry_after` w formacie przyjaznym (np. "45 minut")
  4. Powrót do stanu 'idle'

- **Błąd 502 (AI Service):**
  1. Wyświetlenie toast error: "Usługa AI niedostępna. Spróbuj później."
  2. Powrót do stanu 'idle'

- **Błąd 500 lub inne:**
  1. Wyświetlenie toast error: "Wystąpił błąd. Spróbuj ponownie."
  2. Powrót do stanu 'idle'

**Timeout (>30s):**
1. Przerwanie requestu (AbortController)
2. Wyświetlenie toast error: "Generowanie trwało zbyt długo. Spróbuj ponownie."
3. Powrót do stanu 'idle'

---

### 8.3 Zaznaczanie fiszek

**Akcja:** Użytkownik klika checkbox przy fiszce

**Reakcja systemu:**
1. Toggle stanu checkbox (zaznaczony ↔ odznaczony)
2. Aktualizacja `selectedIndices` Set:
   - Jeśli zaznaczono: dodanie indeksu do Set
   - Jeśli odznaczono: usunięcie indeksu z Set
3. Aktualizacja disabled state przycisku "Zapisz wybrane fiszki":
   - Disabled jeśli `selectedIndices.size === 0`
   - Enabled jeśli `selectedIndices.size > 0`

---

### 8.4 Zaznacz wszystkie / Odznacz wszystkie

**Akcja:** Użytkownik klika przycisk "Zaznacz wszystkie"

**Reakcja systemu:**
1. Aktualizacja `selectedIndices` z wszystkimi indeksami (0 do suggestedCards.length - 1)
2. Zaznaczenie wszystkich checkboxów
3. Enable przycisku "Zapisz wybrane fiszki"

**Akcja:** Użytkownik klika przycisk "Odznacz wszystkie"

**Reakcja systemu:**
1. Wyczyszczenie `selectedIndices` (Set pusty)
2. Odznaczenie wszystkich checkboxów
3. Disable przycisku "Zapisz wybrane fiszki"

---

### 8.5 Zapisywanie wybranych fiszek

**Akcja:** Użytkownik klika przycisk "Zapisz wybrane fiszki"

**Warunki wstępne:**
- Co najmniej 1 fiszka jest zaznaczona
- Przycisk nie jest w stanie disabled lub saving

**Reakcja systemu:**
1. Zmiana `isSaving` na true
2. Disabled przycisku "Zapisz wybrane fiszki"
3. Wyświetlenie spinnera w przycisku lub loading state
4. Filtrowanie zaznaczonych fiszek z `suggestedCards`
5. Przygotowanie payload: `CreateCardCommand[]`
6. Wywołanie POST /api/cards

**Po otrzymaniu odpowiedzi:**
- **Sukces (201 Created):**
  1. Wyświetlenie toast success: "Fiszki zostały zapisane"
  2. Reset widoku:
     - `viewState` → 'idle'
     - `suggestedCards` → []
     - `selectedIndices` → new Set()
     - `inputText` → ''
  3. Opcjonalnie: przekierowanie do /cards lub wyświetlenie przycisku "Zobacz moje fiszki"

- **Błąd:**
  1. Wyświetlenie toast error: "Wystąpił błąd podczas zapisywania fiszek"
  2. Pozostawienie widoku w stanie 'results' (użytkownik może spróbować ponownie)

---

## 9. Warunki i walidacja

### 9.1 Walidacja długości tekstu wejściowego

**Komponent:** GenerateForm

**Warunek:** Tekst musi mieć między 1000 a 10000 znaków

**Sprawdzenie:**
```typescript
const isValid = inputText.length >= 1000 && inputText.length <= 10000;
```

**Wpływ na UI:**
1. **CharacterCounter:**
   - Kolor czerwony (`text-red-600`) jeśli < 1000 lub > 10000
   - Kolor zielony (`text-green-600`) jeśli 1000-10000

2. **Przycisk "Generuj":**
   - `disabled={!isValid || isLoading}`
   - Wizualnie wyszarzony gdy disabled

3. **Inline error message:**
   - Wyświetlany pod textarea gdy użytkownik próbuje submitować z nieprawidłową długością
   - Tekst: "Tekst musi mieć między 1000 a 10000 znaków"
   - Kolor czerwony, mały font

**Moment sprawdzenia:**
- Real-time podczas wpisywania (onChange textarea)
- Przed wywołaniem API (onSubmit formularza)

---

### 9.2 Walidacja zaznaczenia fiszek

**Komponent:** GeneratedCardsList

**Warunek:** Co najmniej 1 fiszka musi być zaznaczona do zapisu

**Sprawdzenie:**
```typescript
const hasSelection = selectedIndices.size > 0;
```

**Wpływ na UI:**
1. **Przycisk "Zapisz wybrane fiszki":**
   - `disabled={selectedIndices.size === 0 || isSaving}`
   - Vizualnie wyszarzony gdy disabled
   - Tooltip (opcjonalnie): "Zaznacz co najmniej jedną fiszkę"

**Moment sprawdzenia:**
- Real-time podczas zaznaczania/odznaczania checkboxów
- Przed wywołaniem POST /api/cards

---

### 9.3 Walidacja stanu ładowania

**Komponenty:** GenerateForm, GeneratedCardsList

**Warunek:** Podczas operacji asynchronicznych UI musi być zablokowany

**Sprawdzenie:**
```typescript
// Podczas generowania
if (isLoading) {
  // Disable textarea i przycisk "Generuj"
}

// Podczas zapisywania
if (isSaving) {
  // Disable przycisku "Zapisz wybrane fiszki"
}
```

**Wpływ na UI:**
1. **Podczas generowania (isLoading = true):**
   - Textarea disabled
   - Przycisk "Generuj" disabled
   - Wyświetlenie LoadingState zamiast formularza

2. **Podczas zapisywania (isSaving = true):**
   - Przycisk "Zapisz wybrane fiszki" disabled
   - Spinner w przycisku
   - Checkboxy pozostają enabled (użytkownik może zmienić selekcję przed zapisem)

**Moment sprawdzenia:**
- Ustawienie na true przed wywołaniem API
- Ustawienie na false w finally block po zakończeniu requestu

---

### 9.4 Walidacja sesji użytkownika

**Komponent:** GeneratePage (Astro middleware)

**Warunek:** Użytkownik musi być zalogowany aby uzyskać dostęp do widoku

**Sprawdzenie:**
```typescript
// W middleware Astro
const session = await getSession(context);
if (!session) {
  return context.redirect('/login');
}
```

**Wpływ na UI:**
- Przekierowanie do /login jeśli brak sesji
- Dodanie `Authorization` header do wszystkich requestów API

**Moment sprawdzenia:**
- Przed renderowaniem strony (middleware)
- Przed każdym wywołaniem API (w fetch headers)

---

### 9.5 Walidacja odpowiedzi API

**Komponenty:** useGenerateFlashcards hook (lub handleGenerate function)

**Warunki:**
1. Response status 200 OK
2. Response zawiera poprawny JSON
3. `generated_count` >= 0
4. `suggested_cards` jest tablicą

**Sprawdzenie:**
```typescript
if (!response.ok) {
  // Obsługa błędów według status code
}

const data: GenerationRequestResponseDTO = await response.json();

if (data.generated_count === 0) {
  setViewState('empty');
} else if (data.suggested_cards.length > 0) {
  setSuggestedCards(data.suggested_cards);
  setViewState('results');
}
```

**Wpływ na UI:**
- Wyświetlenie odpowiedniego stanu widoku (results vs empty)
- Wyświetlenie komunikatów błędów (toast lub modal)

**Moment sprawdzenia:**
- Po otrzymaniu odpowiedzi z API
- Przed aktualizacją state i UI

---

## 10. Obsługa błędów

### 10.1 Błędy walidacji (400 Bad Request)

**Źródło:** POST /api/generation-requests z nieprawidłową długością tekstu

**Typ błędu:** `ValidationErrorResponseDTO`

**Obsługa:**
1. Parsowanie `details` z response
2. Wyświetlenie inline error message pod textarea
3. Przykładowy komunikat: "Tekst musi mieć między 1000 a 10000 znaków"
4. Kolor czerwony, mały font
5. Powrót widoku do stanu 'idle'

**UI:**
```tsx
{validationError && (
  <p className="text-sm text-red-600 mt-1">
    {validationError}
  </p>
)}
```

**Scenariusze:**
- Tekst < 1000 znaków (choć powinno być zablokowane client-side)
- Tekst > 10000 znaków (choć powinno być zablokowane client-side)
- Puste body w request (edge case)

---

### 10.2 Rate Limit (429 Too Many Requests)

**Źródło:** POST /api/generation-requests gdy użytkownik przekroczył limit 10 generacji na godzinę

**Typ błędu:** `RateLimitErrorResponseDTO`

**Obsługa:**
1. Parsowanie `message` i `retry_after` z response
2. Otwarcie modalu (Shadcn/ui Dialog) z informacjami:
   - Nagłówek: "Przekroczono limit"
   - Komunikat: response.message (np. "Maximum 10 generation requests per hour. Try again in 45 minutes.")
   - Przycisk "OK" do zamknięcia
3. Formatowanie `retry_after` na przyjazny format:
   - Jeśli < 60s: "X sekund"
   - Jeśli < 3600s: "X minut"
   - Jeśli >= 3600s: "X godzin"
4. Powrót widoku do stanu 'idle'

**UI (Modal):**
```tsx
<Dialog open={isRateLimitModalOpen} onOpenChange={setIsRateLimitModalOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Przekroczono limit</DialogTitle>
    </DialogHeader>
    <p>{rateLimitMessage}</p>
    <p className="text-sm text-muted-foreground">
      Spróbuj ponownie za {formatRetryAfter(retryAfter)}
    </p>
    <DialogFooter>
      <Button onClick={() => setIsRateLimitModalOpen(false)}>
        OK
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**Alternatywne działania użytkownika:**
- Przejście do /cards i praca z istniejącymi fiszkami
- Dodawanie fiszek ręcznie
- Czekanie do resetu limitu

---

### 10.3 AI Service Error (502 Bad Gateway)

**Źródło:** POST /api/generation-requests gdy usługa OpenRouter.ai jest niedostępna

**Typ błędu:** `AIServiceErrorResponseDTO`

**Obsługa:**
1. Wyświetlenie toast error (Shadcn/ui Sonner lub react-hot-toast)
2. Komunikat: "Usługa AI niedostępna. Spróbuj później."
3. Auto-dismiss po 5 sekundach
4. Powrót widoku do stanu 'idle'

**UI:**
```tsx
toast.error('Usługa AI niedostępna. Spróbuj później.');
```

**Scenariusze:**
- OpenRouter.ai API down
- Timeout połączenia z LLM
- Błąd komunikacji z modelem
- Brak odpowiedzi z modelu

**Alternatywne działania użytkownika:**
- Spróbowanie ponownie za kilka minut
- Dodanie fiszek ręcznie w /cards
- Zgłoszenie problemu (jeśli błąd się powtarza)

---

### 10.4 Server Error (500 Internal Server Error)

**Źródło:** POST /api/generation-requests lub POST /api/cards - nieoczekiwany błąd serwera

**Typ błędu:** `ErrorResponseDTO`

**Obsługa:**
1. Wyświetlenie toast error
2. Komunikat: "Wystąpił błąd. Spróbuj ponownie."
3. Auto-dismiss po 5 sekundach
4. Powrót widoku do stanu 'idle' (dla generowania) lub pozostawienie w 'results' (dla zapisu)

**UI:**
```tsx
toast.error('Wystąpił błąd. Spróbuj ponownie.');
```

**Scenariusze:**
- Błąd bazy danych
- Nieoczekiwany exception w kodzie API
- Brak połączenia z bazą danych
- Błąd zapisu do bazy

**Logging:**
- Server-side: pełne logi błędu z stack trace
- Client-side: brak szczegółów (bezpieczeństwo)

---

### 10.5 Network Error

**Źródło:** Brak połączenia z internetem lub timeout requestu

**Obsługa:**
1. Catch w try-catch bloku fetch
2. Wyświetlenie toast error
3. Komunikat: "Brak połączenia z internetem" lub "Nie udało się połączyć z serwerem"
4. Powrót widoku do stanu 'idle'

**UI:**
```tsx
toast.error('Brak połączenia z internetem');
```

**Scenariusze:**
- Użytkownik offline
- Słabe połączenie
- Request timeout (> 30s dla generowania)

---

### 10.6 Empty Results (generated_count = 0)

**Źródło:** POST /api/generation-requests zwraca 0 fiszek

**Typ:** Nie jest błędem, ale edge case wymagający obsługi

**Obsługa:**
1. Sprawdzenie `generated_count === 0`
2. Zmiana `viewState` na 'empty'
3. Wyświetlenie EmptyResultsMessage component:
   - Icon AlertCircle
   - Nagłówek: "Nie udało się wygenerować fiszek"
   - Komunikat: "Spróbuj z innym tekstem lub zmień długość wejścia"

**UI:**
```tsx
<div className="flex flex-col items-center justify-center p-8 text-center">
  <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
  <h3 className="text-lg font-semibold mb-2">
    Nie udało się wygenerować fiszek
  </h3>
  <p className="text-muted-foreground">
    Spróbuj z innym tekstem lub zmień długość wejścia
  </p>
</div>
```

**Możliwe przyczyny:**
- Tekst zbyt ogólny lub bez konkretnych informacji
- Tekst w nieznanym języku
- Tekst niskiej jakości (spam, losowe znaki)
- Problem z modelem LLM

**Działania użytkownika:**
- Wypróbowanie innego tekstu
- Zmiana długości tekstu (bliżej środka zakresu 1000-10000)
- Dodanie fiszek ręcznie

---

### 10.7 Unauthorized (401)

**Źródło:** Sesja wygasła podczas korzystania z widoku

**Obsługa:**
1. Catch w middleware lub w fetch error handling
2. Wyświetlenie toast info: "Sesja wygasła. Zaloguj się ponownie."
3. Automatyczne przekierowanie do /login
4. Wyczyszczenie lokalnego stanu sesji

**UI:**
```tsx
toast.info('Sesja wygasła. Zaloguj się ponownie.');
navigate('/login');
```

**Scenariusze:**
- Token JWT wygasł (po 7 dniach)
- Użytkownik wylogował się w innej zakładce
- Token został unieważniony

---

### 10.8 Timeout (>30s)

**Źródło:** Request POST /api/generation-requests trwa zbyt długo

**Obsługa:**
1. Użycie `AbortController` z timeoutem 30s
2. Przerwanie requestu po przekroczeniu czasu
3. Wyświetlenie toast error: "Generowanie trwało zbyt długo. Spróbuj ponownie."
4. Powrót widoku do stanu 'idle'

**Implementacja:**
```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 30000);

try {
  const response = await fetch('/api/generation-requests', {
    method: 'POST',
    signal: controller.signal,
    // ...
  });
  clearTimeout(timeoutId);
  // ...
} catch (error) {
  if (error.name === 'AbortError') {
    toast.error('Generowanie trwało zbyt długo. Spróbuj ponownie.');
  }
  // ...
}
```

---

## 11. Kroki implementacji

### Krok 1: Przygotowanie struktury plików

**Cel:** Utworzenie struktury katalogów i plików dla widoku

**Działania:**
1. Utworzenie strony Astro: `src/pages/generate.astro`
2. Utworzenie głównego komponentu React: `src/components/GenerateView.tsx`
3. Utworzenie podkomponentów w `src/components/generate/`:
   - `GenerateForm.tsx`
   - `CharacterCounter.tsx`
   - `LoadingState.tsx`
   - `GeneratedCardsList.tsx`
   - `SelectionControls.tsx`
   - `CardSuggestionItem.tsx`
   - `EmptyResultsMessage.tsx`
4. (Opcjonalnie) Utworzenie custom hooka: `src/hooks/useGenerateFlashcards.ts`

**Rezultat:** Pełna struktura plików gotowa do implementacji

---

### Krok 2: Implementacja strony Astro (generate.astro)

**Cel:** Utworzenie strony z middleware i layoutem

**Działania:**
1. Import Layout z Navbar
2. Sprawdzenie sesji użytkownika (z `Astro.locals`)
3. Przekierowanie do /login jeśli brak sesji
4. Rendering `GenerateView` jako React island z `client:load`
5. Przekazanie `userId` i `userEmail` jako propsy

**Kod:**
```astro
---
import Layout from '../layouts/Layout.astro';
import GenerateView from '../components/GenerateView';

// Session should be set by middleware
const { user } = Astro.locals;

if (!user) {
  return Astro.redirect('/login');
}
---

<Layout title="Generuj fiszki | 10x-cards">
  <GenerateView 
    client:load 
    userId={user.id} 
    userEmail={user.email} 
  />
</Layout>
```

**Rezultat:** Strona Astro gotowa do hostowania komponentów React

---

### Krok 3: Implementacja GenerateView (główny kontener)

**Cel:** Utworzenie głównego komponentu zarządzającego stanem widoku

**Działania:**
1. Implementacja state management (viewState, suggestedCards, error)
2. Implementacja custom hooka `useGenerateFlashcards` (opcjonalnie)
3. Warunkowe renderowanie komponentów według viewState
4. Implementacja obsługi błędów globalnych

**Kod (szkielet):**
```tsx
export default function GenerateView({ userId, userEmail }: GenerateViewProps) {
  const {
    generateFlashcards,
    saveSelectedCards,
    viewState,
    suggestedCards,
    error,
    isLoading,
    isSaving
  } = useGenerateFlashcards();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Generuj fiszki przez AI</h1>
      
      {viewState === 'idle' && (
        <GenerateForm onSubmit={generateFlashcards} isLoading={isLoading} />
      )}
      
      {viewState === 'loading' && (
        <LoadingState message="Generuję fiszki..." />
      )}
      
      {viewState === 'results' && (
        <GeneratedCardsList
          suggestedCards={suggestedCards}
          onSave={saveSelectedCards}
          isSaving={isSaving}
        />
      )}
      
      {viewState === 'empty' && (
        <EmptyResultsMessage />
      )}
      
      {error && (
        <div className="text-red-600 mt-4">{error}</div>
      )}
    </div>
  );
}
```

**Rezultat:** Główny kontener z logiką zarządzania stanem

---

### Krok 4: Implementacja GenerateForm

**Cel:** Utworzenie formularza z walidacją i licznikiem znaków

**Działania:**
1. Implementacja state dla inputText i characterCount
2. Implementacja logiki walidacji (1000-10000 znaków)
3. Integracja z Shadcn/ui (Textarea, Label, Button)
4. Implementacja CharacterCounter
5. Implementacja obsługi submitu z wywołaniem API

**Kod (szkielet):**
```tsx
export default function GenerateForm({ onSubmit, isLoading }: GenerateFormProps) {
  const [inputText, setInputText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const characterCount = inputText.length;
  const isValid = characterCount >= 1000 && characterCount <= 10000;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isValid) {
      setError('Tekst musi mieć między 1000 a 10000 znaków');
      return;
    }
    
    setError(null);
    await onSubmit(inputText);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="input-text">
          Wklej tekst do wygenerowania fiszek
        </Label>
        <Textarea
          id="input-text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={isLoading}
          className="min-h-[200px] w-full lg:w-3/5"
          placeholder="Wklej tutaj tekst (1000-10000 znaków)..."
        />
        <CharacterCounter count={characterCount} max={10000} />
        {error && (
          <p className="text-sm text-red-600 mt-1">{error}</p>
        )}
      </div>
      
      <Button type="submit" disabled={!isValid || isLoading}>
        {isLoading ? 'Generuję...' : 'Generuj'}
      </Button>
    </form>
  );
}
```

**Rezultat:** Działający formularz z walidacją

---

### Krok 5: Implementacja CharacterCounter

**Cel:** Utworzenie licznika znaków z kolorową walidacją

**Działania:**
1. Implementacja logiki kolorowania (czerwony/zielony)
2. Implementacja formatowania tekstu "X / 10000"
3. Dodanie aria-live dla dostępności

**Kod:**
```tsx
export default function CharacterCounter({ count, max }: CharacterCounterProps) {
  const isValid = count >= 1000 && count <= max;
  const colorClass = isValid ? 'text-green-600' : 'text-red-600';

  return (
    <span
      className={`text-sm ${colorClass} mt-1 block`}
      aria-live="polite"
    >
      {count} / {max}
    </span>
  );
}
```

**Rezultat:** Licznik znaków z dynamicznym kolorem

---

### Krok 6: Implementacja LoadingState

**Cel:** Utworzenie komponentu ładowania

**Działania:**
1. Import Loader2 icon z lucide-react
2. Implementacja spinnera z animacją
3. Implementacja tekstu z opcjonalnym message

**Kod:**
```tsx
import { Loader2 } from 'lucide-react';

export default function LoadingState({ message = 'Generuję fiszki...' }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12">
      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
      <p className="text-lg text-muted-foreground">{message}</p>
    </div>
  );
}
```

**Rezultat:** Loading state z spinnerem

---

### Krok 7: Implementacja GeneratedCardsList

**Cel:** Utworzenie listy wyników z checkboxami i zapisem

**Działania:**
1. Implementacja state dla selectedIndices
2. Implementacja logiki selekcji (toggle, selectAll, deselectAll)
3. Integracja z SelectionControls
4. Renderowanie listy CardSuggestionItem
5. Implementacja przycisku "Zapisz wybrane fiszki" z wywołaniem API

**Kod (szkielet):**
```tsx
export default function GeneratedCardsList({ 
  suggestedCards, 
  onSave, 
  isSaving 
}: GeneratedCardsListProps) {
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());

  const toggleSelection = (index: number) => {
    setSelectedIndices(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIndices(new Set(suggestedCards.map((_, i) => i)));
  };

  const deselectAll = () => {
    setSelectedIndices(new Set());
  };

  const handleSave = async () => {
    const selectedCards = Array.from(selectedIndices)
      .map(index => suggestedCards[index]);
    await onSave(selectedCards);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Wygenerowane fiszki</h2>
      
      <SelectionControls 
        onSelectAll={selectAll} 
        onDeselectAll={deselectAll} 
      />
      
      <div className="space-y-4">
        {suggestedCards.map((card, index) => (
          <CardSuggestionItem
            key={index}
            card={card}
            index={index}
            isSelected={selectedIndices.has(index)}
            onSelectionChange={toggleSelection}
          />
        ))}
      </div>
      
      <Button
        onClick={handleSave}
        disabled={selectedIndices.size === 0 || isSaving}
      >
        {isSaving ? 'Zapisuję...' : `Zapisz wybrane fiszki (${selectedIndices.size})`}
      </Button>
    </div>
  );
}
```

**Rezultat:** Lista wyników z funkcjonalnością selekcji i zapisu

---

### Krok 8: Implementacja SelectionControls

**Cel:** Utworzenie kontrolek masowej selekcji

**Działania:**
1. Implementacja dwóch przycisków (Zaznacz wszystkie / Odznacz wszystkie)
2. Integracja z Shadcn/ui Button (secondary variant)

**Kod:**
```tsx
export default function SelectionControls({ 
  onSelectAll, 
  onDeselectAll 
}: SelectionControlsProps) {
  return (
    <div className="flex gap-2">
      <Button variant="secondary" size="sm" onClick={onSelectAll}>
        Zaznacz wszystkie
      </Button>
      <Button variant="secondary" size="sm" onClick={onDeselectAll}>
        Odznacz wszystkie
      </Button>
    </div>
  );
}
```

**Rezultat:** Kontrolki masowej selekcji

---

### Krok 9: Implementacja CardSuggestionItem

**Cel:** Utworzenie pojedynczej pozycji na liście sugestii

**Działania:**
1. Implementacja checkboxa (Shadcn/ui)
2. Implementacja karty (Shadcn/ui Card)
3. Integracja z propsami (card, isSelected, onSelectionChange)

**Kod:**
```tsx
import { Checkbox } from './ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

export default function CardSuggestionItem({
  card,
  index,
  isSelected,
  onSelectionChange
}: CardSuggestionItemProps) {
  return (
    <div className="flex items-start gap-3">
      <Checkbox
        checked={isSelected}
        onCheckedChange={(checked) => onSelectionChange(index, checked as boolean)}
        className="mt-1"
      />
      <Card className="flex-1">
        <CardHeader>
          <CardTitle>{card.front}</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{card.back}</p>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Rezultat:** Pojedyncza pozycja sugestii z checkboxem

---

### Krok 10: Implementacja EmptyResultsMessage

**Cel:** Utworzenie komunikatu o braku wyników

**Działania:**
1. Import AlertCircle icon z lucide-react
2. Implementacja wycentrowanego layoutu z ikoną i tekstem

**Kod:**
```tsx
import { AlertCircle } from 'lucide-react';

export default function EmptyResultsMessage() {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
      <h3 className="text-xl font-semibold mb-2">
        Nie udało się wygenerować fiszek
      </h3>
      <p className="text-muted-foreground">
        Spróbuj z innym tekstem lub zmień długość wejścia
      </p>
    </div>
  );
}
```

**Rezultat:** Komunikat o braku wyników

---

### Krok 11: Implementacja useGenerateFlashcards hook

**Cel:** Enkapsulacja logiki biznesowej generowania i zapisu

**Działania:**
1. Implementacja state management (viewState, suggestedCards, error, isLoading, isSaving)
2. Implementacja funkcji generateFlashcards z wywołaniem POST /api/generation-requests
3. Implementacja funkcji saveSelectedCards z wywołaniem POST /api/cards
4. Implementacja obsługi błędów (400, 429, 502, 500, network errors)
5. Implementacja timeout dla requestu generowania (30s)
6. Integracja z AuthContext dla tokenu

**Kod (szkielet):**
```tsx
export function useGenerateFlashcards() {
  const [viewState, setViewState] = useState<ViewState>('idle');
  const [suggestedCards, setSuggestedCards] = useState<SuggestedCardDTO[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const { session } = useAuth();
  
  const generateFlashcards = async (inputText: string) => {
    setIsLoading(true);
    setError(null);
    setViewState('loading');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    try {
      const response = await fetch('/api/generation-requests', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ input_text: inputText })
      });
      
      clearTimeout(timeoutId);
      
      // Obsługa różnych status codes...
      // 200 OK, 400 Bad Request, 429 Rate Limit, 502 AI Service, 500 Server Error
      
      if (!response.ok) {
        throw new Error('Failed to generate');
      }
      
      const data: GenerationRequestResponseDTO = await response.json();
      
      if (data.generated_count === 0) {
        setViewState('empty');
      } else {
        setSuggestedCards(data.suggested_cards);
        setViewState('results');
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        toast.error('Generowanie trwało zbyt długo. Spróbuj ponownie.');
      } else {
        toast.error('Wystąpił błąd. Spróbuj ponownie.');
      }
      setError(err.message);
      setViewState('idle');
    } finally {
      setIsLoading(false);
    }
  };
  
  const saveSelectedCards = async (selectedCards: CreateCardCommand[]) => {
    setIsSaving(true);
    
    try {
      const response = await fetch('/api/cards', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(selectedCards)
      });
      
      if (!response.ok) {
        throw new Error('Failed to save');
      }
      
      toast.success('Fiszki zostały zapisane');
      setViewState('idle');
      setSuggestedCards([]);
    } catch (err) {
      toast.error('Wystąpił błąd podczas zapisywania fiszek');
    } finally {
      setIsSaving(false);
    }
  };
  
  return {
    generateFlashcards,
    saveSelectedCards,
    viewState,
    suggestedCards,
    error,
    isLoading,
    isSaving
  };
}
```

**Rezultat:** Kompletny hook z logiką biznesową

---

### Krok 12: Obsługa błędów z Toast Notifications

**Cel:** Dodanie toast notifications dla błędów globalnych

**Działania:**
1. Instalacja biblioteki toast (Shadcn/ui Sonner lub react-hot-toast)
2. Dodanie ToastProvider w root layout
3. Implementacja wywołań toast.success / toast.error w hookach
4. Implementacja modalu dla rate limit (429)

**Rezultat:** Kompletna obsługa błędów z wizualnym feedbackiem

---

## Podsumowanie

Ten plan implementacji pokrywa kompleksowo cały widok generowania fiszek (`/generate`), od struktury komponentów przez zarządzanie stanem, integrację API, po obsługę błędów i walidację. 

**Kluczowe elementy:**
- Modułowa struktura komponentów (GenerateForm, LoadingState, GeneratedCardsList)
- Klarowne typy TypeScript dla request/response DTOs
- Custom hook dla enkapsulacji logiki biznesowej
- Trójpoziomowa obsługa błędów (toast/inline/modal)
- Walidacja client-side (1000-10000 znaków)
- Real-time character counter z kolorową walidacją
- Masowa selekcja/deselekcja fiszek

Implementacja powinna być wykonywana sekwencyjnie według kroków 1-12, co zapewni stopniowe budowanie funkcjonalności z możliwością testowania na każdym etapie.
