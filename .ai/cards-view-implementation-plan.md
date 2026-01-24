# Plan implementacji widoku "Moje fiszki" (/cards)

## 1. Przegląd

Widok "Moje fiszki" umożliwia użytkownikom przeglądanie, filtrowanie, sortowanie oraz kompleksowe zarządzanie swoją kolekcją fiszek. Użytkownicy mogą dodawać fiszki ręcznie, edytować istniejące oraz usuwać niepotrzebne. Widok obsługuje zarówno fiszki wygenerowane przez AI, jak i utworzone manualnie, zapewniając elastyczne narzędzia do organizacji materiałów do nauki.

Główne funkcjonalności:
- Responsywny grid fiszek z adaptacyjnym układem (1-3 kolumny)
- Zaawansowane filtrowanie po źródle (AI/ręczne/wszystkie)
- Sortowanie według daty utworzenia, aktualizacji lub liczby powtórek
- Dodawanie ręcznych fiszek przez modal
- Edycja fiszek z walidacją w czasie rzeczywistym
- Usuwanie fiszek z potwierdzeniem
- Paginacja (przyciski Poprzednia/Następna)
- Empty state z call-to-action

## 2. Routing widoku

**Ścieżka:** `/cards`

**Typ:** Chroniony (wymaga uwierzytelnienia)

**Plik implementacji:** `src/pages/cards.astro`

**Middleware:** Automatyczne sprawdzenie sesji przez `src/middleware/index.ts`. Niezalogowani użytkownicy są przekierowywani do `/login`.

**Nawigacja:** Dostępny przez główny navbar na chronionych stronach. Link: "Moje fiszki".

## 3. Struktura komponentów

### Hierarchia komponentów

```
cards.astro (Astro SSR)
└── Layout.astro
    └── CardsView.tsx (React - client:load)
        ├── FiltersBar.tsx
        │   ├── Select (Źródło) - Shadcn/ui
        │   ├── Select (Sortuj według) - Shadcn/ui
        │   ├── Select (Kolejność) - Shadcn/ui
        │   └── Button (Dodaj fiszkę ręcznie) - Shadcn/ui
        │
        ├── FlashcardsGrid.tsx
        │   ├── [Loading State] SkeletonCard[]
        │   ├── [Empty State] EmptyState.tsx
        │   │   ├── BookOpen Icon - lucide-react
        │   │   ├── Heading
        │   │   ├── Description
        │   │   ├── Button (Generuj fiszki AI)
        │   │   └── Button (Dodaj fiszkę ręcznie)
        │   │
        │   └── [Data State] FlashcardItem[]
        │       └── Card - Shadcn/ui
        │           ├── CardHeader (front)
        │           ├── CardContent (back, truncated)
        │           └── CardFooter
        │               ├── Badge (źródło)
        │               ├── Text (powtórki)
        │               └── ActionButtons
        │                   ├── Button (Edytuj)
        │                   └── Button (Usuń)
        │
        ├── PaginationControls.tsx
        │   ├── Button (Poprzednia)
        │   ├── Text (Strona X z Y)
        │   └── Button (Następna)
        │
        ├── AddCardModal.tsx
        │   └── Dialog - Shadcn/ui
        │       ├── DialogHeader
        │       ├── DialogContent
        │       │   ├── Label + Textarea (front)
        │       │   ├── CharacterCounter (max 200)
        │       │   ├── Label + Textarea (back)
        │       │   └── CharacterCounter (max 500)
        │       └── DialogFooter
        │           ├── Button (Anuluj)
        │           └── Button (Dodaj)
        │
        ├── EditCardModal.tsx
        │   └── Dialog - Shadcn/ui
        │       └── [identyczna struktura jak AddCardModal]
        │
        └── DeleteConfirmDialog.tsx
            └── AlertDialog - Shadcn/ui
                ├── AlertDialogHeader
                ├── AlertDialogContent
                │   ├── Preview (front fiszki, bold)
                │   └── Warning text
                └── AlertDialogFooter
                    ├── Button (Anuluj)
                    └── Button (Usuń, destructive)
```

### Lokalizacja plików

```
src/pages/
  cards.astro

src/components/
  cards/
    CardsView.tsx
    FiltersBar.tsx
    FlashcardsGrid.tsx
    FlashcardItem.tsx
    AddCardModal.tsx
    EditCardModal.tsx
    DeleteConfirmDialog.tsx
    EmptyState.tsx
    PaginationControls.tsx
    CharacterCounter.tsx
    SkeletonCard.tsx

src/components/hooks/
  useCards.ts
```

## 4. Szczegóły komponentów

### CardsView.tsx

**Opis:** Główny kontener widoku zarządzający stanem globalnym, fetchowaniem danych i koordynacją wszystkich podkomponentów.

**Główne elementy:**
- Container div z padding i max-width
- FiltersBar (sticky na górze)
- FlashcardsGrid
- PaginationControls
- Trzy modals (Add, Edit, Delete)

**Obsługiwane interakcje:**
- Zmiana filtrów (source, sort, order) → refetch listy
- Klik "Dodaj fiszkę ręcznie" → otwiera AddCardModal
- Klik "Edytuj" na karcie → otwiera EditCardModal z pre-filled data
- Klik "Usuń" na karcie → otwiera DeleteConfirmDialog
- Paginacja → zmiana offset i refetch
- Submit w modalach → wywołanie odpowiedniego API call

**Obsługiwana walidacja:**
- Walidacja auth (sprawdzana przez middleware)
- Walidacja ownership fiszek (backend automatycznie filtruje po user_id)

**Typy:**
- `CardDTO[]` - lista fiszek
- `FilterState` - stan filtrów
- `PaginationMetadataDTO` - metadane paginacji
- `CardDTO | null` - edytowana/usuwana fiszka

**Propsy:** Brak (główny komponent, otrzymuje dane z API)

**Hook:** Wykorzystuje `useCards()` custom hook

---

### FiltersBar.tsx

**Opis:** Pasek narzędzi z filtrami, sortowaniem i przyciskiem dodawania nowych fiszek. Sticky position na desktopie.

**Główne elementy:**
- Wrapper div z flexbox layout (responsive)
- Select "Źródło" z opcjami: Wszystkie / AI / Ręczne
- Select "Sortuj według" z opcjami: Data utworzenia / Data aktualizacji / Liczba powtórek
- Select "Kolejność" z opcjami: Malejąco / Rosnąco
- Button "Dodaj fiszkę ręcznie" (primary variant)

**Obsługiwane zdarzenia:**
- `onChange` na każdym Select → callback `onFilterChange`
- `onClick` na Button → callback `onAddClick`

**Obsługiwana walidacja:** Brak (wszystkie opcje są predefiniowane)

**Typy:**
- `FilterState` - wewnętrzny stan filtrów

**Propsy:**
```typescript
interface FiltersBarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onAddClick: () => void;
}
```

**Struktura FilterState:**
```typescript
interface FilterState {
  source: 'all' | 'manual' | 'ai';
  sort: 'created_at' | 'updated_at' | 'repetitions';
  order: 'asc' | 'desc';
}
```

---

### FlashcardsGrid.tsx

**Opis:** Responsywny grid kontener wyświetlający fiszki. Obsługuje trzy stany: loading (skeleton), empty (EmptyState), data (grid fiszek).

**Główne elementy:**
- Grid container z responsive columns
- Conditional rendering na podstawie stanu
- SkeletonCard[] podczas ładowania (8 sztuk)
- EmptyState gdy brak fiszek
- FlashcardItem[] gdy dane dostępne

**Obsługiwane zdarzenia:**
- Przekazanie callbacks do FlashcardItem (onEdit, onDelete)
- Przekazanie callbacks do EmptyState (onGenerateClick, onAddManualClick)

**Obsługiwana walidacja:** Brak (tylko wyświetlanie)

**Typy:**
- `CardDTO[]` - lista fiszek
- `boolean` - isLoading state

**Propsy:**
```typescript
interface FlashcardsGridProps {
  cards: CardDTO[];
  isLoading: boolean;
  onEdit: (card: CardDTO) => void;
  onDelete: (card: CardDTO) => void;
  onGenerateClick: () => void;
  onAddManualClick: () => void;
}
```

**Grid classes:**
```css
grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6
```

---

### FlashcardItem.tsx

**Opis:** Pojedyncza karta fiszki z podglądem front/back, badge źródła, liczby powtórek i action buttons.

**Główne elementy:**
- Card (Shadcn/ui) jako wrapper
- CardHeader: front fiszki jako CardTitle (bold, text-lg)
- CardContent: back fiszki (truncated, line-clamp-3)
- CardFooter:
  - Badge z tekstem "AI" (zielony) lub "Ręczna" (niebieski)
  - Span "Powtórki: X" (jeśli repetitions > 0)
  - Div z action buttons (Edytuj, Usuń)

**Obsługiwane zdarzenia:**
- `onClick` na Button "Edytuj" → callback `onEdit(card)`
- `onClick` na Button "Usuń" → callback `onDelete(card)`
- `onMouseEnter` / `onMouseLeave` na Card (desktop) → pokaż/ukryj action buttons

**Obsługiwana walidacja:** Brak (tylko wyświetlanie)

**Typy:**
- `CardDTO` - dane fiszki

**Propsy:**
```typescript
interface FlashcardItemProps {
  card: CardDTO;
  onEdit: (card: CardDTO) => void;
  onDelete: (card: CardDTO) => void;
}
```

**Styling szczegóły:**
- Hover effect: `hover:shadow-lg transition-shadow duration-200`
- Action buttons desktop: `opacity-0 group-hover:opacity-100 transition-opacity md:flex hidden`
- Action buttons mobile: `flex md:hidden` (zawsze widoczne)
- Back truncation: `line-clamp-3 text-muted-foreground`

---

### AddCardModal.tsx

**Opis:** Dialog z formularzem dodawania nowej ręcznej fiszki. Zawiera dwa textarea z licznikami znaków i walidacją realtime.

**Główne elementy:**
- Dialog (Shadcn/ui) z open state
- DialogHeader z tytułem "Dodaj nową fiszkę"
- DialogContent z formularzem:
  - Label "Przód fiszki"
  - Textarea (max 200 znaków)
  - CharacterCounter (current / 200)
  - Label "Tył fiszki"
  - Textarea (max 500 znaków)
  - CharacterCounter (current / 500)
  - Inline error messages (jeśli walidacja fails)
- DialogFooter:
  - Button "Anuluj" (secondary, zamyka modal)
  - Button "Dodaj" (primary, disabled jeśli walidacja fails lub isSubmitting)

**Obsługiwane zdarzenia:**
- `onChange` na textarea → update local state + realtime validation
- `onClick` "Anuluj" → callback `onClose()`
- `onClick` "Dodaj" → walidacja → callback `onAdd(cardData)` → close modal
- `onOpenChange` na Dialog → callback `onClose()` (zamknięcie przez escape lub backdrop)

**Obsługiwana walidacja:**
- **Front:**
  - Wymagane: tak
  - Min: 1 znak
  - Max: 200 znaków
  - Komunikat: "Przód fiszki musi mieć między 1 a 200 znaków"
- **Back:**
  - Wymagane: tak
  - Min: 1 znak
  - Max: 500 znaków
  - Komunikat: "Tył fiszki musi mieć między 1 a 500 znaków"
- **Realtime:** CharacterCounter zmienia kolor na czerwony gdy > max
- **Submit:** Button disabled gdy validation errors lub puste pola

**Typy:**
- `CreateCardCommand` - dane wyjściowe (front, back)
- `CardFormData` - stan wewnętrzny formularza

**Propsy:**
```typescript
interface AddCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (cardData: CreateCardCommand) => Promise<void>;
}
```

**Wewnętrzny stan:**
```typescript
const [front, setFront] = useState<string>('');
const [back, setBack] = useState<string>('');
const [errors, setErrors] = useState<{ front?: string; back?: string }>({});
const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
```

---

### EditCardModal.tsx

**Opis:** Dialog edycji istniejącej fiszki. Identyczna struktura jak AddCardModal, ale z pre-filled values.

**Główne elementy:**
- Dialog (Shadcn/ui)
- DialogHeader z tytułem "Edytuj fiszkę"
- DialogContent z formularzem (identyczny jak AddCardModal)
- DialogFooter z buttonami "Anuluj" i "Zapisz zmiany"

**Obsługiwane zdarzenia:**
- `onChange` na textarea → update local state + realtime validation
- `onClick` "Anuluj" → callback `onClose()`
- `onClick` "Zapisz zmiany" → walidacja → callback `onSave(cardId, updates)` → close modal

**Obsługiwana walidacja:**
- Identyczna jak AddCardModal
- Front: 1-200 znaków
- Back: 1-500 znaków

**Typy:**
- `CardDTO` - dane początkowe
- `UpdateCardCommand` - dane wyjściowe (partial)

**Propsy:**
```typescript
interface EditCardModalProps {
  card: CardDTO;
  isOpen: boolean;
  onClose: () => void;
  onSave: (cardId: string, updates: UpdateCardCommand) => Promise<void>;
}
```

**Wewnętrzny stan:**
```typescript
const [front, setFront] = useState<string>(card.front);
const [back, setBack] = useState<string>(card.back);
const [errors, setErrors] = useState<{ front?: string; back?: string }>({});
const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
```

**useEffect:** Reset formularza gdy card prop się zmienia

---

### DeleteConfirmDialog.tsx

**Opis:** AlertDialog z potwierdzeniem usunięcia fiszki. Wyświetla podgląd front fiszki i warning.

**Główne elementy:**
- AlertDialog (Shadcn/ui)
- AlertDialogHeader z tytułem "Czy na pewno chcesz usunąć tę fiszkę?"
- AlertDialogContent:
  - Paragraph z podglądem front (bold, quoted): `"${card.front}"`
  - Warning paragraph: "Ta akcja jest nieodwracalna." (text-muted-foreground)
- AlertDialogFooter:
  - Button "Anuluj" (secondary)
  - Button "Usuń" (variant="destructive", red)

**Obsługiwane zdarzenia:**
- `onClick` "Anuluj" → callback `onClose()`
- `onClick` "Usuń" → callback `onConfirm()` → close dialog
- `onOpenChange` → callback `onClose()` (zamknięcie przez escape)

**Obsługiwana walidacja:** Brak

**Typy:**
- `CardDTO` - fiszka do usunięcia

**Propsy:**
```typescript
interface DeleteConfirmDialogProps {
  card: CardDTO;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}
```

**Wewnętrzny stan:**
```typescript
const [isDeleting, setIsDeleting] = useState<boolean>(false);
```

---

### EmptyState.tsx

**Opis:** Wycentrowany komponent wyświetlany gdy użytkownik nie ma żadnych fiszek. Zawiera call-to-action buttons.

**Główne elementy:**
- Wrapper div (centered, flex column)
- BookOpen Icon z lucide-react (size 64, text-muted-foreground)
- Heading h2: "Nie masz jeszcze żadnych fiszek" (text-2xl, font-semibold)
- Paragraph: "Zacznij od wygenerowania fiszek przez AI lub utwórz je ręcznie" (text-muted-foreground)
- Flex container z 2 buttons:
  - Button "Generuj fiszki AI" (primary)
  - Button "Dodaj fiszkę ręcznie" (secondary)

**Obsługiwane zdarzenia:**
- `onClick` "Generuj fiszki AI" → callback `onGenerateClick()` → navigate to /generate
- `onClick` "Dodaj fiszkę ręcznie" → callback `onAddManualClick()` → otwiera AddCardModal

**Obsługiwana walidacja:** Brak

**Typy:** Brak specyficznych typów

**Propsy:**
```typescript
interface EmptyStateProps {
  onGenerateClick: () => void;
  onAddManualClick: () => void;
}
```

---

### PaginationControls.tsx

**Opis:** Prosty komponent paginacji z przyciskami Poprzednia/Następna i informacją o aktualnej stronie.

**Główne elementy:**
- Wrapper div (flex, justify-between)
- Button "Poprzednia" (disabled na pierwszej stronie)
- Span "Strona X z Y"
- Button "Następna" (disabled na ostatniej stronie)

**Obsługiwane zdarzenia:**
- `onClick` "Poprzednia" → callback `onPrevious()`
- `onClick` "Następna" → callback `onNext()`

**Obsługiwana walidacja:**
- Button "Poprzednia" disabled gdy currentPage === 1
- Button "Następna" disabled gdy !hasMore

**Typy:**
- `PaginationMetadataDTO` - metadane z API

**Propsy:**
```typescript
interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  hasMore: boolean;
  onPrevious: () => void;
  onNext: () => void;
}
```

---

### CharacterCounter.tsx

**Opis:** Reużywalny komponent licznika znaków z kolorowaniem. Używany w AddCardModal i EditCardModal.

**Główne elementy:**
- Span z tekstem "X / MAX"
- Klasy kolorów:
  - `text-red-600` gdy count > max
  - `text-green-600` gdy count <= max
  - `text-sm text-muted-foreground` jako base

**Obsługiwane zdarzenia:** Brak (tylko wyświetlanie)

**Obsługiwana walidacja:**
- Wizualna walidacja przez kolor

**Typy:** Proste number types

**Propsy:**
```typescript
interface CharacterCounterProps {
  count: number;
  max: number;
}
```

---

### SkeletonCard.tsx

**Opis:** Skeleton loader wyświetlany podczas ładowania listy fiszek.

**Główne elementy:**
- Card wrapper
- Skeleton dla CardHeader (prostokąt, h-6, w-3/4)
- Skeleton dla CardContent (3 linie, h-4, w-full/w-5/6/w-4/5)
- Skeleton dla CardFooter (2 okręgi dla badge i tekstu)

**Obsługiwane zdarzenia:** Brak

**Obsługiwana walidacja:** Brak

**Typy:** Brak

**Propsy:** Brak

**Wykorzystanie:** Renderowane 8 sztuk w FlashcardsGrid podczas isLoading

---

## 5. Typy

### Istniejące typy (z `src/types.ts`)

```typescript
// Entity z bazy danych
export type CardDTO = {
  id: string; // UUID
  user_id: string; // UUID
  front: string; // 1-200 znaków
  back: string; // 1-500 znaków
  repetitions: number; // >= 0
  source: 'manual' | 'ai';
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
};

// Response z GET /api/cards
export interface CardsListResponseDTO {
  data: CardDTO[];
  pagination: PaginationMetadataDTO;
}

// Metadane paginacji
export interface PaginationMetadataDTO {
  total: number; // Całkowita liczba fiszek
  limit: number; // Limit na stronę
  offset: number; // Aktualny offset
  has_more: boolean; // Czy są kolejne strony
}

// Command dla tworzenia fiszki
export type CreateCardCommand = {
  front: string; // 1-200 znaków
  back: string; // 1-500 znaków
};

// Command dla aktualizacji fiszki (partial)
export type UpdateCardCommand = {
  front?: string; // 1-200 znaków
  back?: string; // 1-500 znaków
  repetitions?: number; // >= 0
};

// Response po usunięciu
export interface DeleteCardResponseDTO {
  message: string;
  deleted_id: string;
}

// Błąd walidacji
export interface ValidationErrorResponseDTO {
  error: string;
  details: ValidationErrorDetailDTO[];
}

export interface ValidationErrorDetailDTO {
  field: string;
  message: string;
  value?: unknown;
}

// Ogólny błąd
export interface ErrorResponseDTO {
  error: string;
  message: string;
}
```

### Nowe typy ViewModel (do utworzenia w komponencie lub oddzielnym pliku)

```typescript
// Stan filtrów
export interface FilterState {
  source: 'all' | 'manual' | 'ai';
  sort: 'created_at' | 'updated_at' | 'repetitions';
  order: 'asc' | 'desc';
}

// Stan paginacji w komponencie
export interface PaginationState {
  currentPage: number;
  totalPages: number;
  hasMore: boolean;
  limit: number;
  offset: number;
}

// Stan formularza (Add/Edit Modal)
export interface CardFormData {
  front: string;
  back: string;
  errors: {
    front?: string;
    back?: string;
  };
}

// Stan głównego komponentu CardsView
export interface CardsViewState {
  cards: CardDTO[];
  isLoading: boolean;
  isSubmitting: boolean;
  filters: FilterState;
  pagination: PaginationState;
  editingCard: CardDTO | null;
  deletingCard: CardDTO | null;
  isAddModalOpen: boolean;
  error: string | null;
}
```

### Typy dla API Query Parameters

```typescript
// Query params dla GET /api/cards
export interface GetCardsQueryParams {
  limit: number; // 1-100, default 50
  offset: number; // >= 0, default 0
  source?: 'manual' | 'ai'; // optional
  sort: 'created_at' | 'updated_at' | 'repetitions'; // default created_at
  order: 'asc' | 'desc'; // default desc
}
```

### Mapowanie pól CardDTO

| Pole | Typ | Opis | Wyświetlanie |
|------|-----|------|--------------|
| `id` | `string` | UUID fiszki | Nie wyświetlane, używane jako key i w API calls |
| `user_id` | `string` | UUID właściciela | Nie wyświetlane, weryfikowane przez backend |
| `front` | `string` | Przód fiszki (1-200 znaków) | CardHeader jako CardTitle, bold |
| `back` | `string` | Tył fiszki (1-500 znaków) | CardContent, truncated (line-clamp-3) |
| `repetitions` | `number` | Liczba powtórek (>= 0) | CardFooter jako "Powtórki: X" (jeśli > 0) |
| `source` | `'manual' \| 'ai'` | Źródło fiszki | CardFooter jako Badge (zielony/niebieski) |
| `created_at` | `string` | ISO timestamp utworzenia | Nie wyświetlane bezpośrednio, używane do sortowania |
| `updated_at` | `string` | ISO timestamp aktualizacji | Nie wyświetlane bezpośrednio, używane do sortowania |

## 6. Zarządzanie stanem

### Stan globalny

Aplikacja nie używa globalnego state managera (Redux, Zustand). Stan jest zarządzany lokalnie w głównym komponencie `CardsView.tsx` i przekazywany przez props do komponentów dzieci.

**Context API:**
- `AuthContext` (istniejący) - dostarcza `session`, `user`, `supabaseClient`

### Stan lokalny w CardsView.tsx

```typescript
const CardsView = () => {
  // Auth context
  const { session, user } = useAuth();
  const accessToken = session?.access_token;

  // Lista fiszek
  const [cards, setCards] = useState<CardDTO[]>([]);

  // Loading states
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Filtry
  const [filterSource, setFilterSource] = useState<'all' | 'manual' | 'ai'>('all');
  const [sortBy, setSortBy] = useState<'created_at' | 'updated_at' | 'repetitions'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Paginacja
  const [pagination, setPagination] = useState<PaginationMetadataDTO | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingCard, setEditingCard] = useState<CardDTO | null>(null);
  const [deletingCard, setDeletingCard] = useState<CardDTO | null>(null);

  // Error state
  const [error, setError] = useState<string | null>(null);

  // ... handlers i effects
};
```

### Custom Hook: useCards (opcjonalnie)

Dla lepszej organizacji kodu, logika zarządzania fiszkami może być wyodrębniona do custom hooka `useCards.ts`:

```typescript
// src/components/hooks/useCards.ts
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import type {
  CardDTO,
  CardsListResponseDTO,
  CreateCardCommand,
  UpdateCardCommand,
  PaginationMetadataDTO,
} from '../../types';

interface FilterState {
  source: 'all' | 'manual' | 'ai';
  sort: 'created_at' | 'updated_at' | 'repetitions';
  order: 'asc' | 'desc';
}

interface UseCardsReturn {
  cards: CardDTO[];
  isLoading: boolean;
  filters: FilterState;
  pagination: PaginationMetadataDTO | null;
  setFilters: (filters: FilterState) => void;
  addCard: (cardData: CreateCardCommand) => Promise<void>;
  updateCard: (cardId: string, updates: UpdateCardCommand) => Promise<void>;
  deleteCard: (cardId: string) => Promise<void>;
  refetch: () => Promise<void>;
  nextPage: () => void;
  previousPage: () => void;
}

export const useCards = (accessToken: string | undefined): UseCardsReturn => {
  const [cards, setCards] = useState<CardDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    source: 'all',
    sort: 'created_at',
    order: 'desc',
  });
  const [pagination, setPagination] = useState<PaginationMetadataDTO | null>(null);
  const [currentOffset, setCurrentOffset] = useState(0);
  const limit = 50;

  // Fetch cards with current filters and pagination
  const fetchCards = useCallback(async () => {
    if (!accessToken) return;

    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: currentOffset.toString(),
        sort: filters.sort,
        order: filters.order,
      });

      if (filters.source !== 'all') {
        params.append('source', filters.source);
      }

      const response = await fetch(`/api/cards?${params}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          toast.error('Sesja wygasła. Zaloguj się ponownie');
          window.location.href = '/login';
          return;
        }
        throw new Error('Failed to fetch cards');
      }

      const data: CardsListResponseDTO = await response.json();
      setCards(data.data);
      setPagination(data.pagination);
    } catch (err) {
      console.error('Error fetching cards:', err);
      toast.error('Nie udało się załadować fiszek');
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, filters, currentOffset, limit]);

  // Add card
  const addCard = useCallback(
    async (cardData: CreateCardCommand) => {
      if (!accessToken) return;

      try {
        const response = await fetch('/api/cards', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify([cardData]),
        });

        if (!response.ok) {
          const errorData = await response.json();
          if (errorData.details) {
            throw new Error(errorData.details[0]?.message || 'Validation failed');
          }
          throw new Error('Failed to create card');
        }

        const newCard: CardDTO = await response.json();
        setCards((prev) => [newCard, ...prev]); // prepend
        toast.success('Fiszka została dodana');
      } catch (err) {
        console.error('Error adding card:', err);
        toast.error(err instanceof Error ? err.message : 'Nie udało się dodać fiszki');
        throw err;
      }
    },
    [accessToken]
  );

  // Update card
  const updateCard = useCallback(
    async (cardId: string, updates: UpdateCardCommand) => {
      if (!accessToken) return;

      try {
        const response = await fetch(`/api/cards/${cardId}`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updates),
        });

        if (!response.ok) {
          if (response.status === 404) {
            toast.error('Fiszka nie została znaleziona');
            throw new Error('Card not found');
          }
          const errorData = await response.json();
          if (errorData.details) {
            throw new Error(errorData.details[0]?.message || 'Validation failed');
          }
          throw new Error('Failed to update card');
        }

        const updatedCard: CardDTO = await response.json();
        setCards((prev) => prev.map((card) => (card.id === cardId ? updatedCard : card)));
        toast.success('Fiszka została zaktualizowana');
      } catch (err) {
        console.error('Error updating card:', err);
        toast.error(err instanceof Error ? err.message : 'Nie udało się zaktualizować fiszki');
        throw err;
      }
    },
    [accessToken]
  );

  // Delete card
  const deleteCard = useCallback(
    async (cardId: string) => {
      if (!accessToken) return;

      try {
        const response = await fetch(`/api/cards/${cardId}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          if (response.status === 404) {
            toast.error('Fiszka nie została znaleziona');
            throw new Error('Card not found');
          }
          throw new Error('Failed to delete card');
        }

        setCards((prev) => prev.filter((card) => card.id !== cardId));
        toast.success('Fiszka została usunięta');
      } catch (err) {
        console.error('Error deleting card:', err);
        toast.error('Nie udało się usunąć fiszki');
        throw err;
      }
    },
    [accessToken]
  );

  // Pagination handlers
  const nextPage = useCallback(() => {
    if (pagination?.has_more) {
      setCurrentOffset((prev) => prev + limit);
    }
  }, [pagination, limit]);

  const previousPage = useCallback(() => {
    setCurrentOffset((prev) => Math.max(0, prev - limit));
  }, [limit]);

  // Fetch cards when filters or pagination changes
  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  return {
    cards,
    isLoading,
    filters,
    pagination,
    setFilters,
    addCard,
    updateCard,
    deleteCard,
    refetch: fetchCards,
    nextPage,
    previousPage,
  };
};
```

### Przepływ danych

1. **Initial load:**
   - CardsView mount → useEffect → fetchCards()
   - GET /api/cards → setCards() + setPagination()
   - Render FlashcardsGrid z danymi

2. **Zmiana filtrów:**
   - User zmienia Select → FiltersBar.onFilterChange()
   - CardsView.setFilters() → useEffect triggers → fetchCards()
   - GET /api/cards z nowymi params → update state

3. **Dodawanie fiszki:**
   - User klik "Dodaj" → setIsAddModalOpen(true)
   - User wypełnia formularz → submit
   - AddCardModal.onAdd() → CardsView.addCard()
   - POST /api/cards → prepend do state → toast → close modal

4. **Edycja fiszki:**
   - User klik "Edytuj" → setEditingCard(card)
   - User modyfikuje → submit
   - EditCardModal.onSave() → CardsView.updateCard()
   - PATCH /api/cards/:id → merge w state → toast → close modal

5. **Usuwanie fiszki:**
   - User klik "Usuń" → setDeletingCard(card)
   - User potwierdza → DeleteConfirmDialog.onConfirm()
   - CardsView.deleteCard() → DELETE /api/cards/:id
   - Filter z state → toast → close dialog

### Strategia aktualizacji state

**Brak optimistic updates w MVP:**
- Wszystkie operacje czekają na response z API
- Loading states na buttonach/modals podczas operacji
- Po otrzymaniu success response: aktualizacja state + toast
- Po błędzie: toast error + pozostawienie state bez zmian

**Aktualizacje state:**
- **Dodawanie:** Prepend nowej fiszki na początek listy
- **Edycja:** Merge updatedCard z istniejącą kartą w array
- **Usuwanie:** Filter out usuniętej karty z array
- **Refetch:** Zastąpienie całej listy nową (po zmianie filtrów lub paginacji)

## 7. Integracja API

### Wykorzystywane endpointy

#### 1. GET /api/cards

**Cel:** Pobieranie listy fiszek użytkownika z filtrowaniem, sortowaniem i paginacją.

**Request:**
```typescript
// Query parameters
interface GetCardsQueryParams {
  limit?: number; // default 50, max 100
  offset?: number; // default 0
  source?: 'manual' | 'ai'; // optional
  sort?: 'created_at' | 'updated_at' | 'repetitions'; // default 'created_at'
  order?: 'asc' | 'desc'; // default 'desc'
}

// Headers
{
  'Authorization': `Bearer ${accessToken}`
}
```

**Response (200 OK):**
```typescript
{
  data: CardDTO[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
  };
}
```

**Przykład wywołania:**
```typescript
const params = new URLSearchParams({
  limit: '50',
  offset: '0',
  source: 'ai', // lub pominąć dla 'all'
  sort: 'created_at',
  order: 'desc',
});

const response = await fetch(`/api/cards?${params}`, {
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
});

const data: CardsListResponseDTO = await response.json();
```

**Error responses:**
- `400 Bad Request` - Invalid query parameters
  - Obsługa: Toast error "Nieprawidłowe parametry zapytania"
- `401 Unauthorized` - Missing or invalid token
  - Obsługa: Toast info + redirect to /login
- `500 Internal Server Error` - Unexpected error
  - Obsługa: Toast error "Wystąpił błąd. Spróbuj ponownie"

---

#### 2. POST /api/cards

**Cel:** Tworzenie nowej fiszki ręcznej.

**Request:**
```typescript
// Body (array z 1 elementem)
[
  {
    front: string; // 1-200 znaków
    back: string; // 1-500 znaków
  }
]

// Headers
{
  'Authorization': `Bearer ${accessToken}`,
  'Content-Type': 'application/json'
}
```

**Response (201 Created):**
```typescript
// Single card object (not array)
{
  id: string;
  user_id: string;
  front: string;
  back: string;
  repetitions: 0;
  source: 'manual';
  created_at: string;
  updated_at: string;
}
```

**Przykład wywołania:**
```typescript
const cardData: CreateCardCommand = {
  front: 'What is React?',
  back: 'A JavaScript library for building user interfaces',
};

const response = await fetch('/api/cards', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify([cardData]),
});

const newCard: CardDTO = await response.json();
```

**Error responses:**
- `400 Bad Request` - Validation error
  ```json
  {
    "error": "Validation failed",
    "details": [
      {
        "field": "front",
        "message": "Front must be between 1 and 200 characters"
      }
    ]
  }
  ```
  - Obsługa: Inline error messages w modallu
- `401 Unauthorized` - Missing or invalid token
  - Obsługa: Toast + redirect to /login
- `500 Internal Server Error`
  - Obsługa: Toast error "Wystąpił błąd. Spróbuj ponownie"

---

#### 3. PATCH /api/cards/:id

**Cel:** Aktualizacja istniejącej fiszki.

**Request:**
```typescript
// URL parameter
cardId: string; // UUID

// Body (partial update)
{
  front?: string; // 1-200 znaków
  back?: string; // 1-500 znaków
  // repetitions można też aktualizować, ale nie w MVP UI
}

// Headers
{
  'Authorization': `Bearer ${accessToken}`,
  'Content-Type': 'application/json'
}
```

**Response (200 OK):**
```typescript
// Updated card object
{
  id: string;
  user_id: string;
  front: string;
  back: string;
  repetitions: number;
  source: 'manual' | 'ai';
  created_at: string;
  updated_at: string; // zaktualizowany timestamp
}
```

**Przykład wywołania:**
```typescript
const updates: UpdateCardCommand = {
  front: 'Updated front text',
  // back nie zmienione - nie przesyłamy
};

const response = await fetch(`/api/cards/${cardId}`, {
  method: 'PATCH',
  headers: {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(updates),
});

const updatedCard: CardDTO = await response.json();
```

**Error responses:**
- `400 Bad Request` - Validation error lub invalid UUID
  - Obsługa: Inline error messages w modallu
- `401 Unauthorized`
  - Obsługa: Toast + redirect to /login
- `404 Not Found` - Card doesn't exist lub nie należy do użytkownika
  - Obsługa: Toast error "Fiszka nie została znaleziona"
- `500 Internal Server Error`
  - Obsługa: Toast error "Wystąpił błąd. Spróbuj ponownie"

---

#### 4. DELETE /api/cards/:id

**Cel:** Usunięcie fiszki.

**Request:**
```typescript
// URL parameter
cardId: string; // UUID

// Headers
{
  'Authorization': `Bearer ${accessToken}`
}

// Body: brak
```

**Response (200 OK):**
```typescript
{
  message: 'Card deleted successfully';
  deleted_id: string; // UUID usuniętej fiszki
}
```

**Przykład wywołania:**
```typescript
const response = await fetch(`/api/cards/${cardId}`, {
  method: 'DELETE',
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
});

const result: DeleteCardResponseDTO = await response.json();
```

**Error responses:**
- `400 Bad Request` - Invalid UUID format
  - Obsługa: Toast error (nie powinno się zdarzyć w UI)
- `401 Unauthorized`
  - Obsługa: Toast + redirect to /login
- `404 Not Found` - Card doesn't exist lub nie należy do użytkownika
  - Obsługa: Toast error "Fiszka nie została znaleziona"
- `500 Internal Server Error`
  - Obsługa: Toast error "Wystąpił błąd. Spróbuj ponownie"

---

### Obsługa tokenów

**Access Token:**
- Pobierany z `session.access_token` przez AuthContext
- Przechowywany w Supabase session (httpOnly cookie lub localStorage)
- Dodawany do każdego API call w header `Authorization: Bearer <token>`

**Refresh Token:**
- Automatycznie obsługiwany przez Supabase SDK
- Nie wymaga ręcznej implementacji w komponencie

**Session expiration:**
- Jeśli API zwraca 401 → redirect to /login
- Toast info: "Sesja wygasła. Zaloguj się ponownie"

## 8. Interakcje użytkownika

### Scenariusz 1: Przeglądanie listy fiszek

**Kroki:**
1. Użytkownik wchodzi na `/cards` przez navbar
2. Middleware sprawdza sesję → authorized
3. Astro page renderuje Layout + CardsView (client:load)
4. CardsView mount → useEffect → fetchCards()
5. GET /api/cards?limit=50&sort=created_at&order=desc
6. Response → setCards() + setPagination()
7. FlashcardsGrid renderuje:
   - Jeśli isLoading → SkeletonCard[] (8 sztuk)
   - Jeśli cards.length === 0 → EmptyState
   - Jeśli cards.length > 0 → FlashcardItem[]
8. Użytkownik widzi grid fiszek

**Interakcje w gridzie:**
- Scroll w dół → przeglądanie fiszek
- [Desktop] Hover na karcie → wyświetlenie action buttons
- [Mobile] Action buttons zawsze widoczne

---

### Scenariusz 2: Filtrowanie po źródle

**Kroki:**
1. Użytkownik klika Select "Źródło"
2. Dropdown otwiera się z opcjami: Wszystkie / AI / Ręczne
3. Użytkownik wybiera "AI"
4. FiltersBar.onFilterChange({ ...filters, source: 'ai' })
5. CardsView.setFilterSource('ai')
6. useEffect triggers → fetchCards()
7. GET /api/cards?limit=50&source=ai&sort=created_at&order=desc
8. Response → setCards() z filtrowaną listą
9. Grid aktualizuje się → wyświetla tylko fiszki AI

**Podobnie dla sortowania:**
- Zmiana "Sortuj według" → update sortBy → refetch
- Zmiana "Kolejność" → update sortOrder → refetch

**Resetowanie filtrów:**
- Jeśli brak wyników po filtrowaniu → wyświetla się komunikat
- Przycisk "Resetuj filtry" → setFilters do defaults → refetch

---

### Scenariusz 3: Dodawanie ręcznej fiszki

**Kroki:**
1. Użytkownik klika przycisk "Dodaj fiszkę ręcznie" w FiltersBar
2. CardsView.setIsAddModalOpen(true)
3. AddCardModal otwiera się (Dialog)
4. Formularz jest pusty, focus na textarea "Przód fiszki"
5. Użytkownik wpisuje tekst w "Przód fiszki"
   - onChange → setFront(value)
   - CharacterCounter aktualizuje się realtime (X / 200)
   - Jeśli > 200 → kolor czerwony + error message
6. Użytkownik wpisuje tekst w "Tył fiszki"
   - onChange → setBack(value)
   - CharacterCounter aktualizuje się realtime (X / 500)
   - Jeśli > 500 → kolor czerwony + error message
7. Walidacja:
   - Front: 1-200 znaków ✓
   - Back: 1-500 znaków ✓
   - Button "Dodaj" enabled
8. Użytkownik klika "Dodaj"
   - setIsSubmitting(true)
   - Button disabled + spinner
9. POST /api/cards z body: [{ front, back }]
10. Response 201 → newCard
11. CardsView.addCard() → setCards([newCard, ...prev])
12. Toast success: "Fiszka została dodana"
13. Modal zamyka się → setIsAddModalOpen(false)
14. Nowa fiszka pojawia się na początku gridu (prepend)

**Anulowanie:**
- Użytkownik klika "Anuluj" lub Escape → modal zamyka się bez zmian

**Błędy:**
- 400 Validation → inline error messages w modallu
- 500 Server Error → toast error + modal pozostaje otwarty

---

### Scenariusz 4: Edycja fiszki

**Kroki:**
1. Użytkownik znajduje fiszkę do edycji w gridzie
2. [Desktop] Hover na karcie → action buttons pojawiają się
3. Użytkownik klika "Edytuj"
4. CardsView.setEditingCard(card)
5. EditCardModal otwiera się z pre-filled values:
   - front: card.front
   - back: card.back
6. Użytkownik modyfikuje front lub back
   - onChange → update local state
   - CharacterCounter aktualizuje się realtime
   - Walidacja realtime (1-200 / 1-500)
7. Użytkownik klika "Zapisz zmiany"
   - setIsSubmitting(true)
   - Button disabled + spinner
8. PATCH /api/cards/:id z body: { front?, back? }
9. Response 200 → updatedCard
10. CardsView.updateCard() → merge w state
11. Toast success: "Fiszka została zaktualizowana"
12. Modal zamyka się → setEditingCard(null)
13. Karta w gridzie aktualizuje się z nowymi wartościami

**Anulowanie:**
- Użytkownik klika "Anuluj" → modal zamyka się, zmiany odrzucone

**Błędy:**
- 404 Not Found → toast error + modal zamyka się
- 400 Validation → inline errors
- 500 Server Error → toast error + modal pozostaje otwarty

---

### Scenariusz 5: Usuwanie fiszki

**Kroki:**
1. Użytkownik znajduje fiszkę do usunięcia
2. Klika "Usuń"
3. CardsView.setDeletingCard(card)
4. DeleteConfirmDialog otwiera się
5. Użytkownik widzi:
   - Tytuł: "Czy na pewno chcesz usunąć tę fiszkę?"
   - Preview: `"${card.front}"` (bold)
   - Warning: "Ta akcja jest nieodwracalna."
6. Użytkownik czyta i decyduje:
   - **Opcja A: Potwierdza**
     - Klika "Usuń" (red button)
     - setIsDeleting(true)
     - Button disabled + spinner
     - DELETE /api/cards/:id
     - Response 200 → deleted_id
     - CardsView.deleteCard() → filter z state
     - Toast success: "Fiszka została usunięta"
     - Dialog zamyka się
     - Karta znika z gridu
   - **Opcja B: Anuluje**
     - Klika "Anuluj" lub Escape
     - Dialog zamyka się bez zmian

**Błędy:**
- 404 Not Found → toast error + dialog zamyka się
- 500 Server Error → toast error + dialog pozostaje otwarty

---

### Scenariusz 6: Paginacja

**Kroki:**
1. Użytkownik ma > 50 fiszek
2. GET /api/cards zwraca:
   ```json
   {
     "data": [...], // 50 fiszek
     "pagination": {
       "total": 127,
       "limit": 50,
       "offset": 0,
       "has_more": true
     }
   }
   ```
3. PaginationControls wyświetla:
   - "Poprzednia" (disabled)
   - "Strona 1 z 3"
   - "Następna" (enabled)
4. Użytkownik klika "Następna"
5. CardsView.nextPage() → setCurrentOffset(50)
6. useEffect triggers → fetchCards()
7. GET /api/cards?limit=50&offset=50&...
8. Response → druga strona fiszek
9. Grid aktualizuje się
10. PaginationControls:
    - "Poprzednia" (enabled)
    - "Strona 2 z 3"
    - "Następna" (enabled)

**Nawigacja:**
- Klik "Poprzednia" → decrement offset → refetch
- Klik "Następna" → increment offset → refetch
- Buttony disabled gdy brak więcej stron

---

### Scenariusz 7: Empty State

**Przypadek A: Brak fiszek w ogóle**
1. Użytkownik nowy lub usunął wszystkie fiszki
2. GET /api/cards → { data: [], pagination: { total: 0, ... } }
3. FlashcardsGrid renderuje EmptyState:
   - Icon (BookOpen)
   - Heading: "Nie masz jeszcze żadnych fiszek"
   - Description: "Zacznij od wygenerowania fiszek przez AI lub utwórz je ręcznie"
   - Button "Generuj fiszki AI" → navigate to /generate
   - Button "Dodaj fiszkę ręcznie" → otwiera AddCardModal

**Przypadek B: Brak wyników po filtrowaniu**
1. Użytkownik ma tylko fiszki manualne
2. Użytkownik filtruje po "AI"
3. GET /api/cards?source=ai → { data: [], ... }
4. Wyświetla komunikat:
   - "Brak fiszek spełniających kryteria"
   - Button "Resetuj filtry" → setFilters(defaults) → refetch

---

## 9. Warunki i walidacja

### Walidacja po stronie komponentów

#### 1. Walidacja długości tekstu w modalach (Add/Edit)

**Przód fiszki (front):**
- **Wymagane:** Tak
- **Min:** 1 znak
- **Max:** 200 znaków
- **Weryfikacja:** Realtime w textarea (onChange)
- **Wizualna:** CharacterCounter zmienia kolor na czerwony gdy > 200
- **Inline error:** Wyświetla się pod textarea gdy walidacja fails
- **Komunikat:** "Przód fiszki musi mieć między 1 a 200 znaków"
- **Wpływ na UI:** Button "Dodaj"/"Zapisz" disabled gdy validation fails

**Implementacja:**
```typescript
const validateFront = (value: string): string | undefined => {
  if (value.length === 0) {
    return 'Przód fiszki jest wymagany';
  }
  if (value.length > 200) {
    return 'Przód fiszki musi mieć między 1 a 200 znaków';
  }
  return undefined;
};

// W komponencie
const [frontError, setFrontError] = useState<string>();

const handleFrontChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
  const value = e.target.value;
  setFront(value);
  setFrontError(validateFront(value));
};
```

**Tył fiszki (back):**
- **Wymagane:** Tak
- **Min:** 1 znak
- **Max:** 500 znaków
- **Weryfikacja:** Realtime w textarea (onChange)
- **Wizualna:** CharacterCounter zmienia kolor na czerwony gdy > 500
- **Inline error:** Wyświetla się pod textarea
- **Komunikat:** "Tył fiszki musi mieć między 1 a 500 znaków"
- **Wpływ na UI:** Button disabled gdy validation fails

**Implementacja:** Analogicznie jak dla front

---

#### 2. Walidacja w FiltersBar

**Select "Źródło":**
- **Dozwolone wartości:** 'all', 'manual', 'ai'
- **Default:** 'all'
- **Walidacja:** Brak (wszystkie opcje są predefiniowane w Select)

**Select "Sortuj według":**
- **Dozwolone wartości:** 'created_at', 'updated_at', 'repetitions'
- **Default:** 'created_at'
- **Walidacja:** Brak (predefiniowane opcje)

**Select "Kolejność":**
- **Dozwolone wartości:** 'asc', 'desc'
- **Default:** 'desc'
- **Walidacja:** Brak (predefiniowane opcje)

---

#### 3. Walidacja UUID w operacjach PATCH/DELETE

**Warunek:** `cardId` musi być valid UUID v4

**Weryfikacja:** Backend sprawdza format UUID przed operacją

**Obsługa w UI:**
- Jeśli backend zwraca 400 "Invalid card ID format" → toast error
- W praktyce nie powinno się zdarzyć, bo ID pochodzi z CardDTO z bazy

---

#### 4. Walidacja ownership

**Warunek:** Użytkownik może edytować/usuwać tylko swoje fiszki

**Weryfikacja:** Backend automatycznie filtruje po `user_id` z tokenu

**Obsługa w UI:**
- Jeśli backend zwraca 404 → toast error "Fiszka nie została znaleziona"
- Użytkownik nigdy nie widzi fiszek innych użytkowników w gridzie

---

### Warunki wymagane przez API

#### GET /api/cards

**Query parameters validation:**
```typescript
{
  limit: number; // 1-100, default 50
  offset: number; // >= 0, default 0
  source?: 'manual' | 'ai'; // optional
  sort: 'created_at' | 'updated_at' | 'repetitions'; // default 'created_at'
  order: 'asc' | 'desc'; // default 'desc'
}
```

**Backend walidacja (Zod schema):**
- limit przekształcane z string → int, validation 1-100
- offset przekształcane z string → int, validation >= 0
- source enum validation
- sort enum validation, default 'created_at'
- order enum validation, default 'desc'

**Frontend:** Zawsze wysyła valid params (predefiniowane w UI)

---

#### POST /api/cards

**Body validation:**
```typescript
[
  {
    front: string; // 1-200 znaków
    back: string; // 1-500 znaków
  }
]
```

**Backend walidacja (Zod schema):**
- Array: min 1 element, max 50 elementów (w UI zawsze 1)
- front: string, 1-200 znaków, wymagane
- back: string, 1-500 znaków, wymagane

**Frontend walidacja:**
- Sprawdzenie przed submit w AddCardModal
- Button disabled jeśli validation fails
- Inline error messages

---

#### PATCH /api/cards/:id

**Body validation:**
```typescript
{
  front?: string; // 1-200 znaków
  back?: string; // 1-500 znaków
  repetitions?: number; // >= 0, nie używane w MVP UI
}
```

**Backend walidacja:**
- Co najmniej jedno pole musi być podane
- front optional: jeśli podane, 1-200 znaków
- back optional: jeśli podane, 1-500 znaków

**Frontend walidacja:**
- Sprawdzenie przed submit w EditCardModal
- Button disabled jeśli validation fails dla podanych pól

---

#### DELETE /api/cards/:id

**Walidacja:**
- cardId musi być valid UUID
- Karta musi należeć do użytkownika

**Frontend:** Zawsze używa valid UUID z CardDTO

---

### Wpływ warunków na stan UI

**Button states:**
- "Dodaj" w AddCardModal: disabled gdy frontError || backError || !front || !back || isSubmitting
- "Zapisz zmiany" w EditCardModal: disabled gdy frontError || backError || isSubmitting
- "Usuń" w DeleteConfirmDialog: disabled gdy isDeleting

**Input states:**
- Textarea: disabled gdy isSubmitting
- Select w FiltersBar: nigdy disabled

**Visual feedback:**
- CharacterCounter: czerwony gdy > max, zielony gdy <= max
- Inline error: wyświetla się pod textarea z text-red-600
- Border: textarea z error border (ring-red-500)

**Loading states:**
- SkeletonCard[] podczas isLoading
- Spinner w buttonach podczas submit
- Disabled state na całym formularzu

## 10. Obsługa błędów

### Błędy API i ich obsługa

#### 400 Bad Request (Validation Error)

**Kiedy:** Nieprawidłowe dane w body (POST, PATCH) lub query params (GET)

**Response:**
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "front",
      "message": "Front must be between 1 and 200 characters",
      "value": "..." // optional
    }
  ]
}
```

**Obsługa w UI:**
- **Modals (Add/Edit):** Inline error messages pod polami formularza
- **FiltersBar:** Toast error (nie powinno się zdarzyć, bo opcje predefiniowane)
- **Styl:** text-red-600, icon exclamation-circle

**Implementacja:**
```typescript
const handleSubmit = async () => {
  try {
    // ... API call
  } catch (error) {
    if (error.status === 400) {
      const data = await error.json();
      if (data.details) {
        // Map errors to form fields
        const newErrors: { front?: string; back?: string } = {};
        data.details.forEach((detail) => {
          if (detail.field === 'front') newErrors.front = detail.message;
          if (detail.field === 'back') newErrors.back = detail.message;
        });
        setErrors(newErrors);
      }
    }
  }
};
```

---

#### 401 Unauthorized

**Kiedy:** Brak tokenu, invalid token lub sesja wygasła

**Response:**
```json
{
  "error": "Unauthorized",
  "message": "Missing or invalid authentication token"
}
```

**Obsługa w UI:**
- Toast info: "Sesja wygasła. Zaloguj się ponownie"
- Automatyczne przekierowanie do `/login`
- Clear local session state

**Implementacja:**
```typescript
if (response.status === 401) {
  toast.info('Sesja wygasła. Zaloguj się ponownie');
  window.location.href = '/login';
  return;
}
```

---

#### 404 Not Found

**Kiedy:** 
- Fiszka nie istnieje (PATCH, DELETE, GET by id)
- Fiszka nie należy do użytkownika

**Response:**
```json
{
  "error": "Not found",
  "message": "Card not found"
}
```

**Obsługa w UI:**
- Toast error: "Fiszka nie została znaleziona"
- Modal zamyka się (jeśli otwarty)
- Opcjonalnie: refetch listy (na wypadek desynchronizacji)

**Implementacja:**
```typescript
if (response.status === 404) {
  toast.error('Fiszka nie została znaleziona');
  // Close modal
  setEditingCard(null);
  // Optionally refetch
  await refetch();
  return;
}
```

---

#### 500 Internal Server Error

**Kiedy:** Nieoczekiwany błąd na serwerze (database error, etc.)

**Response:**
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred. Please try again later."
}
```

**Obsługa w UI:**
- Toast error: "Wystąpił błąd. Spróbuj ponownie"
- Modal pozostaje otwarty (użytkownik może spróbować ponownie)
- Log error w konsoli dla debugowania

**Implementacja:**
```typescript
if (response.status === 500) {
  console.error('Server error:', await response.text());
  toast.error('Wystąpił błąd. Spróbuj ponownie');
  return;
}
```

---

### Błędy sieci

#### Network Error (brak połączenia)

**Kiedy:** Brak internetu, timeout, CORS issues

**Obsługa w UI:**
- Toast error: "Brak połączenia z internetem"
- Retry button w toaście (opcjonalnie)

**Implementacja:**
```typescript
try {
  const response = await fetch('/api/cards', ...);
} catch (error) {
  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    toast.error('Brak połączenia z internetem');
  } else {
    toast.error('Wystąpił nieoczekiwany błąd');
  }
  console.error('Network error:', error);
}
```

---

### Scenariusze specjalne

#### Empty results after filter

**Kiedy:** Użytkownik filtruje po "AI", ale ma tylko fiszki manualne

**Obsługa:**
- Wyświetlenie komunikatu: "Brak fiszek spełniających kryteria"
- Button "Resetuj filtry" → reset do defaults → refetch
- Nie jest to błąd, tylko empty state

**Implementacja:**
```typescript
{cards.length === 0 && !isLoading && filters.source !== 'all' && (
  <div className="text-center py-8">
    <p className="text-muted-foreground mb-4">
      Brak fiszek spełniających kryteria
    </p>
    <Button onClick={() => {
      setFilters({ source: 'all', sort: 'created_at', order: 'desc' });
    }}>
      Resetuj filtry
    </Button>
  </div>
)}
```

---

#### No cards at all (Empty State)

**Kiedy:** Nowy użytkownik lub usunął wszystkie fiszki

**Obsługa:**
- EmptyState component z CTA buttons
- Nie jest to błąd, tylko empty state
- Prowadzi użytkownika do akcji (generowanie AI lub dodanie ręczne)

---

### Logging błędów

**Client-side logging:**
```typescript
console.error('Error fetching cards:', {
  error: error.message,
  status: response?.status,
  url: response?.url,
  timestamp: new Date().toISOString(),
});
```

**W produkcji:** Integracja z error tracking (Sentry, LogRocket, etc.)

**W MVP:** Console.error wystarczy

---

### User feedback

**Toast notifications (biblioteka: sonner):**
- **Success:** Zielony, icon check-circle, auto-dismiss 3s
- **Error:** Czerwony, icon x-circle, auto-dismiss 5s
- **Info:** Niebieski, icon info-circle, auto-dismiss 3s

**Inline messages:**
- Pod textarea w modalach
- text-red-600, text-sm
- Icon exclamation-circle (opcjonalnie)

**Modal persistence:**
- Przy błędach walidacji (400) → modal pozostaje otwarty
- Przy błędach systemowych (500) → modal pozostaje otwarty
- Przy 404 → modal zamyka się

**Loading states:**
- Button disabled + spinner podczas submit
- Skeleton cards podczas fetch
- Disabled textarea podczas submit

## 11. Kroki implementacji

### Faza 1: Setup projektu i struktura

**Krok 1.1:** Utworzenie struktury folderów
```bash
mkdir -p src/components/cards
mkdir -p src/components/hooks
```

**Krok 1.2:** Utworzenie pliku głównej strony
- Plik: `src/pages/cards.astro`
- Zawartość:
  ```astro
  ---
  import Layout from '../layouts/Layout.astro';
  import CardsView from '../components/cards/CardsView';
  
  // Protected route - middleware checks auth
  ---
  
  <Layout title="Moje fiszki | 10x-cards">
    <CardsView client:load />
  </Layout>
  ```

**Krok 1.3:** Dodanie linku do navbar
- Edycja istniejącego navbar component
- Dodanie linku "Moje fiszki" → `/cards`

---

### Faza 2: Typy i interfejsy

**Krok 2.1:** Utworzenie typów ViewModel
- Plik: `src/components/cards/types.ts` (lub dodać do `src/types.ts`)
- Zawartość:
  ```typescript
  export interface FilterState {
    source: 'all' | 'manual' | 'ai';
    sort: 'created_at' | 'updated_at' | 'repetitions';
    order: 'asc' | 'desc';
  }

  export interface PaginationState {
    currentPage: number;
    totalPages: number;
    hasMore: boolean;
    limit: number;
    offset: number;
  }

  export interface CardFormData {
    front: string;
    back: string;
    errors: {
      front?: string;
      back?: string;
    };
  }
  ```

---

### Faza 3: Custom hook useCards

**Krok 3.1:** Implementacja hooka
- Plik: `src/components/hooks/useCards.ts`
- Funkcjonalności:
  - fetchCards() z filtrowaniem i paginacją
  - addCard()
  - updateCard()
  - deleteCard()
  - nextPage() / previousPage()
- Zarządzanie stanem cards, loading, filters, pagination
- Obsługa błędów z toast notifications

**Krok 3.2:** Testy manualne hooka
- Sprawdzenie fetchCards() w komponencie testowym
- Weryfikacja error handling

---

### Faza 4: Komponenty pomocnicze

**Krok 4.1:** CharacterCounter.tsx
- Plik: `src/components/cards/CharacterCounter.tsx`
- Props: count, max
- Wyświetlanie "X / MAX" z kolorowaniem
- Czerwony gdy > max, zielony gdy <= max

**Krok 4.2:** SkeletonCard.tsx
- Plik: `src/components/cards/SkeletonCard.tsx`
- Skeleton loader w kształcie FlashcardItem
- Używa Shadcn/ui Skeleton component

**Krok 4.3:** EmptyState.tsx
- Plik: `src/components/cards/EmptyState.tsx`
- Props: onGenerateClick, onAddManualClick
- Icon BookOpen z lucide-react
- Heading, description, 2 CTA buttons

---

### Faza 5: FlashcardItem

**Krok 5.1:** Implementacja komponentu
- Plik: `src/components/cards/FlashcardItem.tsx`
- Props: card, onEdit, onDelete
- Card (Shadcn/ui) wrapper
- CardHeader: front jako CardTitle
- CardContent: back z line-clamp-3
- CardFooter: Badge, powtórki, action buttons

**Krok 5.2:** Responsywne action buttons
- Desktop: opacity-0, group-hover:opacity-100
- Mobile: zawsze widoczne
- Classes: `opacity-0 group-hover:opacity-100 transition-opacity md:flex hidden`

**Krok 5.3:** Styling
- Hover effect na Card: hover:shadow-lg transition-shadow
- Badge colors: AI (zielony), Ręczna (niebieski)
- Truncation: line-clamp-3 na back

---

### Faza 6: FlashcardsGrid

**Krok 6.1:** Implementacja Grid container
- Plik: `src/components/cards/FlashcardsGrid.tsx`
- Props: cards, isLoading, onEdit, onDelete, onGenerateClick, onAddManualClick
- Conditional rendering:
  - isLoading → SkeletonCard[] (8 sztuk)
  - cards.length === 0 → EmptyState
  - else → FlashcardItem[]

**Krok 6.2:** Responsive grid classes
```css
grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6
```

**Krok 6.3:** Test z mock data
- Sprawdzenie layoutu na różnych breakpointach
- Weryfikacja EmptyState

---

### Faza 7: Modals - AddCardModal

**Krok 7.1:** Implementacja AddCardModal
- Plik: `src/components/cards/AddCardModal.tsx`
- Props: isOpen, onClose, onAdd
- Dialog (Shadcn/ui)
- DialogHeader z tytułem
- Formularz:
  - Label + Textarea (front)
  - CharacterCounter (200)
  - Label + Textarea (back)
  - CharacterCounter (500)
- DialogFooter: Anuluj, Dodaj

**Krok 7.2:** Walidacja realtime
- State: front, back, errors, isSubmitting
- onChange → update + validateFront/validateBack
- Button disabled gdy validation fails

**Krok 7.3:** Submit handler
- Wywołanie onAdd(cardData)
- Loading state (isSubmitting)
- Error handling (400, 500)
- Close modal po success

---

### Faza 8: Modals - EditCardModal

**Krok 8.1:** Implementacja EditCardModal
- Plik: `src/components/cards/EditCardModal.tsx`
- Props: card, isOpen, onClose, onSave
- Identyczna struktura jak AddCardModal
- Pre-filled values z card prop

**Krok 8.2:** useEffect dla reset formularza
```typescript
useEffect(() => {
  if (card) {
    setFront(card.front);
    setBack(card.back);
    setErrors({});
  }
}, [card]);
```

**Krok 8.3:** Submit handler
- Wywołanie onSave(card.id, { front, back })
- Partial update (tylko zmienione pola)

---

### Faza 9: Modals - DeleteConfirmDialog

**Krok 9.1:** Implementacja DeleteConfirmDialog
- Plik: `src/components/cards/DeleteConfirmDialog.tsx`
- Props: card, isOpen, onClose, onConfirm
- AlertDialog (Shadcn/ui)
- Preview front fiszki (bold, quoted)
- Warning text

**Krok 9.2:** Confirm handler
- Wywołanie onConfirm()
- Loading state (isDeleting)
- Close dialog po success

---

### Faza 10: FiltersBar

**Krok 10.1:** Implementacja FiltersBar
- Plik: `src/components/cards/FiltersBar.tsx`
- Props: filters, onFilterChange, onAddClick
- 3x Select (Shadcn/ui):
  - Źródło: Wszystkie / AI / Ręczne
  - Sortuj według: Data utworzenia / Data aktualizacji / Liczba powtórek
  - Kolejność: Malejąco / Rosnąco
- Button "Dodaj fiszkę ręcznie"

**Krok 10.2:** onChange handlers
```typescript
const handleSourceChange = (value: 'all' | 'manual' | 'ai') => {
  onFilterChange({ ...filters, source: value });
};
// analogicznie dla sort i order
```

**Krok 10.3:** Responsywny layout
- Desktop: flex-row, justify-between
- Mobile: flex-col, gap-4

---

### Faza 11: PaginationControls

**Krok 11.1:** Implementacja PaginationControls
- Plik: `src/components/cards/PaginationControls.tsx`
- Props: currentPage, totalPages, hasMore, onPrevious, onNext
- Button "Poprzednia" (disabled na stronie 1)
- Span "Strona X z Y"
- Button "Następna" (disabled gdy !hasMore)

**Krok 11.2:** Kalkulacja totalPages
```typescript
const totalPages = pagination ? Math.ceil(pagination.total / pagination.limit) : 1;
const currentPage = pagination ? Math.floor(pagination.offset / pagination.limit) + 1 : 1;
```

---

### Faza 12: CardsView - główny komponent

**Krok 12.1:** Podstawowa struktura
- Plik: `src/components/cards/CardsView.tsx`
- Import wszystkich subkomponentów
- Wykorzystanie useCards() hook
- useState dla modals (isAddModalOpen, editingCard, deletingCard)

**Krok 12.2:** Handlers
```typescript
const handleAddClick = () => setIsAddModalOpen(true);
const handleEditClick = (card: CardDTO) => setEditingCard(card);
const handleDeleteClick = (card: CardDTO) => setDeletingCard(card);
const handleGenerateClick = () => window.location.href = '/generate';

const handleAddCard = async (cardData: CreateCardCommand) => {
  await addCard(cardData);
  setIsAddModalOpen(false);
};

const handleUpdateCard = async (cardId: string, updates: UpdateCardCommand) => {
  await updateCard(cardId, updates);
  setEditingCard(null);
};

const handleDeleteCard = async (cardId: string) => {
  await deleteCard(cardId);
  setDeletingCard(null);
};
```

**Krok 12.3:** Layout JSX
```tsx
return (
  <div className="container mx-auto px-4 py-8 max-w-7xl">
    <h1 className="text-3xl font-bold mb-6">Moje fiszki</h1>
    
    <FiltersBar
      filters={filters}
      onFilterChange={setFilters}
      onAddClick={handleAddClick}
    />
    
    <FlashcardsGrid
      cards={cards}
      isLoading={isLoading}
      onEdit={handleEditClick}
      onDelete={handleDeleteClick}
      onGenerateClick={handleGenerateClick}
      onAddManualClick={handleAddClick}
    />
    
    {pagination && cards.length > 0 && (
      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        hasMore={pagination.has_more}
        onPrevious={previousPage}
        onNext={nextPage}
      />
    )}
    
    <AddCardModal
      isOpen={isAddModalOpen}
      onClose={() => setIsAddModalOpen(false)}
      onAdd={handleAddCard}
    />
    
    {editingCard && (
      <EditCardModal
        card={editingCard}
        isOpen={!!editingCard}
        onClose={() => setEditingCard(null)}
        onSave={handleUpdateCard}
      />
    )}
    
    {deletingCard && (
      <DeleteConfirmDialog
        card={deletingCard}
        isOpen={!!deletingCard}
        onClose={() => setDeletingCard(null)}
        onConfirm={() => handleDeleteCard(deletingCard.id)}
      />
    )}
  </div>
);
```

---

### Faza 13: Integracja i testy

**Krok 13.1:** Test całego flow
- [ ] Wejście na /cards → lista się ładuje
- [ ] Filtrowanie po źródle → działa
- [ ] Sortowanie → działa
- [ ] Dodawanie fiszki → modal, walidacja, submit, toast, prepend
- [ ] Edycja fiszki → modal pre-filled, walidacja, submit, toast, update
- [ ] Usuwanie fiszki → confirm dialog, submit, toast, remove

**Krok 13.2:** Test responsywności
- [ ] Mobile (< 640px): 1 kolumna, action buttons zawsze widoczne
- [ ] Tablet (640-1024px): 2 kolumny
- [ ] Desktop (> 1024px): 3 kolumny, action buttons on hover

**Krok 13.3:** Test error handling
- [ ] 401 → redirect to /login
- [ ] 400 → inline errors w modalach
- [ ] 404 → toast error
- [ ] 500 → toast error
- [ ] Network error → toast error

**Krok 13.4:** Test empty states
- [ ] Brak fiszek → EmptyState
- [ ] Brak wyników po filtrze → komunikat + reset filters
- [ ] Loading → skeleton cards

**Krok 13.5:** Test paginacji
- [ ] > 50 fiszek → pagination controls
- [ ] Klik "Następna" → druga strona
- [ ] Klik "Poprzednia" → powrót
- [ ] Disabled states działają

---

### Faza 14: Styling i polish

**Krok 14.1:** Shadcn/ui theme
- Sprawdzenie czy wszystkie komponenty używają theme tokens
- Border radius, colors, spacing

**Krok 14.2:** Transitions i animations
- Hover effects na kartach: hover:shadow-lg transition-shadow
- Fade in/out dla action buttons: transition-opacity
- Dialog animations (Shadcn/ui defaults)

**Krok 14.3:** Focus states
- Wszystkie interactive elements mają focus ring
- Tab navigation działa poprawnie

**Krok 14.4:** Mobile refinements
- Touch targets min 44x44px
- Spacing comfortable na małych ekranach
- Text sizes czytelne

---

### Faza 15: Dokumentacja i cleanup

**Krok 15.1:** JSDoc comments
- Dodanie comments do wszystkich komponentów
- Props interfaces z descriptions

**Krok 15.2:** README update
- Dodanie sekcji o widoku /cards
- Screenshot/gif (opcjonalnie)

**Krok 15.3:** Code cleanup
- Usunięcie console.logs (poza error logging)
- Usunięcie unused imports
- Format code (Prettier)

**Krok 15.4:** Linter check
- Uruchomienie ESLint
- Fix wszystkich warnings

---

### Faza 16: Final testing i deployment

**Krok 16.1:** Manual testing checklist
- [ ] Happy path: add → edit → delete
- [ ] Wszystkie filtry i sortowania
- [ ] Paginacja (jeśli > 50 fiszek)
- [ ] Wszystkie error scenarios
- [ ] Responsywność na 3+ devices
- [ ] Empty states

**Krok 16.2:** Performance check
- Bundle size (czy client:load jest ok?)
- Lazy loading obrazków (jeśli są)
- API response times

**Krok 16.3:** Accessibility check (basic)
- Tab navigation
- Screen reader friendly (Shadcn/ui defaults)
- Focus trap w modalach

**Krok 16.4:** Deploy
- Merge do main branch
- Deploy na środowisko produkcyjne
- Smoke test na produkcji

---

## Podsumowanie kroków

1. **Setup** (struktura folderów, strona cards.astro)
2. **Typy** (FilterState, PaginationState, CardFormData)
3. **Custom hook** (useCards z fetch, CRUD, pagination)
4. **Komponenty pomocnicze** (CharacterCounter, SkeletonCard, EmptyState)
5. **FlashcardItem** (karta fiszki z action buttons)
6. **FlashcardsGrid** (responsywny grid z conditional rendering)
7. **AddCardModal** (formularz z walidacją)
8. **EditCardModal** (formularz z pre-filled)
9. **DeleteConfirmDialog** (potwierdzenie usunięcia)
10. **FiltersBar** (filtry, sortowanie, przycisk dodaj)
11. **PaginationControls** (poprzednia/następna)
12. **CardsView** (główny komponent, integracja wszystkiego)
13. **Integracja i testy** (flow, responsywność, errors, empty states)
14. **Styling i polish** (theme, transitions, focus, mobile)
15. **Dokumentacja** (JSDoc, README, cleanup)
16. **Final testing i deployment** (checklist, performance, accessibility)

Każdy krok powinien być wykonany w kolejności, z testowaniem po każdej fazie.

---

## Uwagi końcowe

- **Kolejność implementacji:** Od małych komponentów do dużych (bottom-up)
- **Testowanie:** Po każdej fazie, nie na końcu
- **Iteracyjne podejście:** MVP najpierw, potem refinements
- **Shadcn/ui:** Maksymalne wykorzystanie gotowych komponentów
- **TypeScript:** Strict typing dla wszystkich props i state
- **Error handling:** Zawsze try-catch + user feedback
- **Loading states:** Zawsze podczas async operations
- **Responsywność:** Mobile-first, testowanie na real devices

Ten plan implementacji jest kompletny i gotowy do użycia przez innego frontend developera.
