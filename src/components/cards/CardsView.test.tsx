import { render, screen, waitFor } from '@/test/test-utils';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import CardsView from './CardsView';
import * as useCardsModule from '../hooks/useCards';
import type { CardDTO, PaginationMetadataDTO } from '@/types';
import type { FilterState } from './types';

describe('CardsView', () => {
  const mockFilters: FilterState = {
    source: 'all',
    sort: 'created_at',
    order: 'desc',
  };

  const mockUseCards = {
    cards: [] as CardDTO[],
    isLoading: false,
    filters: mockFilters,
    pagination: null as PaginationMetadataDTO | null,
    setFilters: vi.fn(),
    addCard: vi.fn(),
    updateCard: vi.fn(),
    deleteCard: vi.fn(),
    refetch: vi.fn(),
    nextPage: vi.fn(),
    previousPage: vi.fn(),
  };

  beforeEach(() => {
    vi.spyOn(useCardsModule, 'useCards').mockReturnValue(mockUseCards);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  describe('Renderowanie podstawowe', () => {
    it('powinien renderować tytuł strony', () => {
      render(<CardsView />);
      expect(screen.getByText('Moje fiszki')).toBeInTheDocument();
    });

    it('powinien renderować FiltersBar z poprawnymi elementami', () => {
      render(<CardsView />);

      expect(screen.getByLabelText('Źródło:')).toBeInTheDocument();
      expect(screen.getByLabelText('Sortuj:')).toBeInTheDocument();
      expect(screen.getByLabelText('Kolejność:')).toBeInTheDocument();
      // Sprawdź czy istnieje przycisk z ikoną Plus (specyficzny dla FiltersBar)
      const addButtons = screen.getAllByRole('button', { name: /dodaj fiszkę ręcznie/i });
      expect(addButtons.length).toBeGreaterThanOrEqual(1);
    });

    it('powinien renderować FlashcardsGrid', () => {
      render(<CardsView />);

      // FlashcardsGrid zawsze się renderuje (albo skeleton, albo empty state, albo dane)
      const container = screen.getByText('Moje fiszki').parentElement;
      expect(container).toBeInTheDocument();
    });
  });

  describe('Stan ładowania', () => {
    it('powinien renderować skeleton cards podczas ładowania', () => {
      vi.spyOn(useCardsModule, 'useCards').mockReturnValue({
        ...mockUseCards,
        isLoading: true,
      });

      const { container } = render(<CardsView />);

      // SkeletonCard renderuje komponenty Skeleton z Shadcn
      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('nie powinien renderować paginacji podczas ładowania', () => {
      vi.spyOn(useCardsModule, 'useCards').mockReturnValue({
        ...mockUseCards,
        isLoading: true,
        pagination: { limit: 50, offset: 0, total: 100, has_more: true },
      });

      render(<CardsView />);

      expect(screen.queryByRole('button', { name: /poprzednia/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /następna/i })).not.toBeInTheDocument();
    });
  });

  describe('Stan pusty', () => {
    it('powinien renderować EmptyState gdy brak fiszek', () => {
      vi.spyOn(useCardsModule, 'useCards').mockReturnValue({
        ...mockUseCards,
        cards: [],
        isLoading: false,
      });

      render(<CardsView />);

      expect(screen.getByText(/nie masz jeszcze żadnych fiszek/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /generuj fiszki ai/i })).toBeInTheDocument();
    });

    it('nie powinien renderować paginacji gdy brak fiszek', () => {
      vi.spyOn(useCardsModule, 'useCards').mockReturnValue({
        ...mockUseCards,
        cards: [],
        isLoading: false,
        pagination: { limit: 50, offset: 0, total: 0, has_more: false },
      });

      render(<CardsView />);

      expect(screen.queryByRole('button', { name: /poprzednia/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /następna/i })).not.toBeInTheDocument();
    });
  });

  describe('Wyświetlanie fiszek', () => {
    it('powinien renderować listę fiszek', () => {
      const mockCards: CardDTO[] = [
        {
          id: '1',
          front: 'Test 1',
          back: 'Answer 1',
          source: 'manual',
          user_id: 'user-1',
          repetitions: 0,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: '2',
          front: 'Test 2',
          back: 'Answer 2',
          source: 'ai',
          user_id: 'user-1',
          repetitions: 5,
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
        },
      ];

      vi.spyOn(useCardsModule, 'useCards').mockReturnValue({
        ...mockUseCards,
        cards: mockCards,
      });

      render(<CardsView />);

      expect(screen.getByText('Test 1')).toBeInTheDocument();
      expect(screen.getByText('Test 2')).toBeInTheDocument();
    });

    it('powinien renderować odpowiednią liczbę fiszek', () => {
      const mockCards: CardDTO[] = [
        {
          id: '1',
          front: 'Test 1',
          back: 'Answer 1',
          source: 'manual',
          user_id: 'user-1',
          repetitions: 0,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: '2',
          front: 'Test 2',
          back: 'Answer 2',
          source: 'ai',
          user_id: 'user-1',
          repetitions: 5,
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
        },
        {
          id: '3',
          front: 'Test 3',
          back: 'Answer 3',
          source: 'manual',
          user_id: 'user-1',
          repetitions: 2,
          created_at: '2024-01-03T00:00:00Z',
          updated_at: '2024-01-03T00:00:00Z',
        },
      ];

      vi.spyOn(useCardsModule, 'useCards').mockReturnValue({
        ...mockUseCards,
        cards: mockCards,
      });

      render(<CardsView />);

      expect(screen.getByText('Test 1')).toBeInTheDocument();
      expect(screen.getByText('Test 2')).toBeInTheDocument();
      expect(screen.getByText('Test 3')).toBeInTheDocument();
    });
  });

  describe('Paginacja', () => {
    it('powinien renderować paginację gdy są fiszki i pagination', () => {
      const mockCards: CardDTO[] = [
        {
          id: '1',
          front: 'Test 1',
          back: 'Answer 1',
          source: 'manual',
          user_id: 'user-1',
          repetitions: 0,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      vi.spyOn(useCardsModule, 'useCards').mockReturnValue({
        ...mockUseCards,
        cards: mockCards,
        pagination: { limit: 50, offset: 0, total: 100, has_more: true },
      });

      render(<CardsView />);

      expect(screen.getByRole('button', { name: /poprzednia/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /następna/i })).toBeInTheDocument();
    });

    it('powinien obliczyć poprawnie currentPage i totalPages', () => {
      const mockCards: CardDTO[] = [
        {
          id: '1',
          front: 'Test',
          back: 'Answer',
          source: 'manual',
          user_id: 'user-1',
          repetitions: 0,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      vi.spyOn(useCardsModule, 'useCards').mockReturnValue({
        ...mockUseCards,
        cards: mockCards,
        pagination: { limit: 50, offset: 100, total: 250, has_more: true },
      });

      render(<CardsView />);

      // currentPage = Math.floor(100 / 50) + 1 = 3
      // totalPages = Math.ceil(250 / 50) = 5
      expect(screen.getByText(/strona 3 z 5/i)).toBeInTheDocument();
    });

    it('nie powinien renderować paginacji gdy pagination jest null', () => {
      const mockCards: CardDTO[] = [
        {
          id: '1',
          front: 'Test',
          back: 'Answer',
          source: 'manual',
          user_id: 'user-1',
          repetitions: 0,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      vi.spyOn(useCardsModule, 'useCards').mockReturnValue({
        ...mockUseCards,
        cards: mockCards,
        pagination: null,
      });

      render(<CardsView />);

      expect(screen.queryByRole('button', { name: /poprzednia/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /następna/i })).not.toBeInTheDocument();
    });
  });

  describe('Modal dodawania fiszki', () => {
    it('powinien otworzyć modal dodawania po kliknięciu przycisku', async () => {
      const user = userEvent.setup();
      render(<CardsView />);

      // Wybierz pierwszy przycisk (z FiltersBar)
      const addButtons = screen.getAllByRole('button', { name: /dodaj fiszkę ręcznie/i });
      await user.click(addButtons[0]);

      expect(screen.getByText(/dodaj nową fiszkę/i)).toBeInTheDocument();
    });

    it('powinien zamknąć modal po kliknięciu anuluj', async () => {
      const user = userEvent.setup();
      render(<CardsView />);

      // Otwórz modal - wybierz pierwszy przycisk (z FiltersBar)
      const addButtons = screen.getAllByRole('button', { name: /dodaj fiszkę ręcznie/i });
      await user.click(addButtons[0]);

      expect(screen.getByText(/dodaj nową fiszkę/i)).toBeInTheDocument();

      // Zamknij modal
      const cancelButton = screen.getByRole('button', { name: /anuluj/i });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByText(/dodaj nową fiszkę/i)).not.toBeInTheDocument();
      });
    });

    it('powinien wywołać addCard i zamknąć modal po dodaniu fiszki', async () => {
      const mockAddCard = vi.fn().mockResolvedValue(undefined);
      vi.spyOn(useCardsModule, 'useCards').mockReturnValue({
        ...mockUseCards,
        addCard: mockAddCard,
      });

      const user = userEvent.setup();
      render(<CardsView />);

      // Otwórz modal - wybierz pierwszy przycisk (z FiltersBar)
      const addButtons = screen.getAllByRole('button', { name: /dodaj fiszkę ręcznie/i });
      await user.click(addButtons[0]);

      // Wypełnij formularz
      const frontInput = screen.getByLabelText(/przód fiszki/i);
      const backInput = screen.getByLabelText(/tył fiszki/i);
      await user.type(frontInput, 'New front');
      await user.type(backInput, 'New back');

      // Wyślij formularz
      const submitButton = screen.getByRole('button', { name: /^dodaj$/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockAddCard).toHaveBeenCalledWith({
          front: 'New front',
          back: 'New back',
        });
      });

      await waitFor(() => {
        expect(screen.queryByText(/dodaj nową fiszkę/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Modal edycji fiszki', () => {
    it('powinien otworzyć modal edycji po kliknięciu przycisku edycji', async () => {
      const mockCards: CardDTO[] = [
        {
          id: '1',
          front: 'Test 1',
          back: 'Answer 1',
          source: 'manual',
          user_id: 'user-1',
          repetitions: 0,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      vi.spyOn(useCardsModule, 'useCards').mockReturnValue({
        ...mockUseCards,
        cards: mockCards,
      });

      const user = userEvent.setup();
      render(<CardsView />);

      // Znajdź i kliknij przycisk edycji
      const editButton = screen.getByLabelText(/edytuj fiszkę/i);
      await user.click(editButton);

      expect(screen.getByText(/edytuj fiszkę/i)).toBeInTheDocument();
    });

    it('powinien wywołać updateCard po zapisaniu zmian', async () => {
      const mockUpdateCard = vi.fn().mockResolvedValue(undefined);
      const mockCards: CardDTO[] = [
        {
          id: '1',
          front: 'Test 1',
          back: 'Answer 1',
          source: 'manual',
          user_id: 'user-1',
          repetitions: 0,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      vi.spyOn(useCardsModule, 'useCards').mockReturnValue({
        ...mockUseCards,
        cards: mockCards,
        updateCard: mockUpdateCard,
      });

      const user = userEvent.setup();
      render(<CardsView />);

      // Otwórz modal edycji
      const editButton = screen.getByLabelText(/edytuj fiszkę/i);
      await user.click(editButton);

      // Edytuj fiszkę
      const frontInput = screen.getByLabelText(/przód fiszki/i);
      await user.clear(frontInput);
      await user.type(frontInput, 'Updated front');

      // Zapisz zmiany
      const saveButton = screen.getByRole('button', { name: /zapisz/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockUpdateCard).toHaveBeenCalledWith('1', expect.objectContaining({
          front: 'Updated front',
        }));
      });
    });
  });

  describe('Dialog usuwania fiszki', () => {
    it('powinien otworzyć dialog usuwania po kliknięciu przycisku usuwania', async () => {
      const mockCards: CardDTO[] = [
        {
          id: '1',
          front: 'Test 1',
          back: 'Answer 1',
          source: 'manual',
          user_id: 'user-1',
          repetitions: 0,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      vi.spyOn(useCardsModule, 'useCards').mockReturnValue({
        ...mockUseCards,
        cards: mockCards,
      });

      const user = userEvent.setup();
      render(<CardsView />);

      // Znajdź i kliknij przycisk usuwania
      const deleteButton = screen.getByLabelText(/usuń fiszkę/i);
      await user.click(deleteButton);

      expect(screen.getByText(/czy na pewno chcesz usunąć tę fiszkę/i)).toBeInTheDocument();
    });

    it('powinien wywołać deleteCard po potwierdzeniu usunięcia', async () => {
      const mockDeleteCard = vi.fn().mockResolvedValue(undefined);
      const mockCards: CardDTO[] = [
        {
          id: '1',
          front: 'Test 1',
          back: 'Answer 1',
          source: 'manual',
          user_id: 'user-1',
          repetitions: 0,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      vi.spyOn(useCardsModule, 'useCards').mockReturnValue({
        ...mockUseCards,
        cards: mockCards,
        deleteCard: mockDeleteCard,
      });

      const user = userEvent.setup();
      render(<CardsView />);

      // Otwórz dialog usuwania
      const deleteButton = screen.getByLabelText(/usuń fiszkę/i);
      await user.click(deleteButton);

      // Potwierdź usunięcie
      const confirmButton = screen.getByRole('button', { name: /usuń/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(mockDeleteCard).toHaveBeenCalledWith('1');
      });
    });

    it('powinien zamknąć dialog po kliknięciu anuluj', async () => {
      const mockCards: CardDTO[] = [
        {
          id: '1',
          front: 'Test 1',
          back: 'Answer 1',
          source: 'manual',
          user_id: 'user-1',
          repetitions: 0,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      vi.spyOn(useCardsModule, 'useCards').mockReturnValue({
        ...mockUseCards,
        cards: mockCards,
      });

      const user = userEvent.setup();
      render(<CardsView />);

      // Otwórz dialog usuwania
      const deleteButton = screen.getByLabelText(/usuń fiszkę/i);
      await user.click(deleteButton);

      expect(screen.getByText(/czy na pewno chcesz usunąć tę fiszkę/i)).toBeInTheDocument();

      // Anuluj
      const cancelButton = screen.getByRole('button', { name: /anuluj/i });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByText(/czy na pewno chcesz usunąć tę fiszkę/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Nawigacja', () => {
    it('powinien przekierować do /generate po kliknięciu przycisku generowania w EmptyState', async () => {
      const originalLocation = window.location;
      delete (window as any).location;
      window.location = { ...originalLocation, href: '' } as Location;

      vi.spyOn(useCardsModule, 'useCards').mockReturnValue({
        ...mockUseCards,
        cards: [],
        isLoading: false,
      });

      const user = userEvent.setup();
      render(<CardsView />);

      const generateButton = screen.getByRole('button', { name: /generuj fiszki ai/i });
      await user.click(generateButton);

      expect(window.location.href).toBe('/generate');

      window.location = originalLocation;
    });
  });
});
