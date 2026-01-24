import { render, screen } from '@/test/test-utils';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import FlashcardsGrid from './FlashcardsGrid';
import type { CardDTO } from '@/types';

describe('FlashcardsGrid', () => {
  const mockCards: CardDTO[] = [
    {
      id: '1',
      front: 'Test 1',
      back: 'Answer 1',
      source: 'manual',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      repetitions: 0,
      user_id: 'user-1',
    },
    {
      id: '2',
      front: 'Test 2',
      back: 'Answer 2',
      source: 'ai',
      created_at: '2024-01-02T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z',
      repetitions: 5,
      user_id: 'user-1',
    },
  ];

  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();
  const mockOnGenerateClick = vi.fn();
  const mockOnAddManualClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Stan ładowania', () => {
    it('powinien renderować skeleton cards podczas ładowania', () => {
      const { container } = render(
        <FlashcardsGrid
          cards={[]}
          isLoading={true}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onGenerateClick={mockOnGenerateClick}
          onAddManualClick={mockOnAddManualClick}
        />
      );

      // SkeletonCard używa komponentu Skeleton z animacją pulse
      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('powinien renderować 8 skeleton cards', () => {
      const { container } = render(
        <FlashcardsGrid
          cards={[]}
          isLoading={true}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onGenerateClick={mockOnGenerateClick}
          onAddManualClick={mockOnAddManualClick}
        />
      );

      // Sprawdź strukturę grid
      const grid = container.querySelector('.grid');
      expect(grid).toBeInTheDocument();
      expect(grid?.children).toHaveLength(8);
    });

    it('nie powinien renderować EmptyState podczas ładowania', () => {
      render(
        <FlashcardsGrid
          cards={[]}
          isLoading={true}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onGenerateClick={mockOnGenerateClick}
          onAddManualClick={mockOnAddManualClick}
        />
      );

      expect(screen.queryByText(/nie masz jeszcze żadnych fiszek/i)).not.toBeInTheDocument();
    });

    it('nie powinien renderować kart podczas ładowania', () => {
      render(
        <FlashcardsGrid
          cards={mockCards}
          isLoading={true}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onGenerateClick={mockOnGenerateClick}
          onAddManualClick={mockOnAddManualClick}
        />
      );

      expect(screen.queryByText('Test 1')).not.toBeInTheDocument();
      expect(screen.queryByText('Test 2')).not.toBeInTheDocument();
    });
  });

  describe('Stan pusty', () => {
    it('powinien renderować EmptyState gdy brak fiszek', () => {
      render(
        <FlashcardsGrid
          cards={[]}
          isLoading={false}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onGenerateClick={mockOnGenerateClick}
          onAddManualClick={mockOnAddManualClick}
        />
      );

      expect(screen.getByText(/nie masz jeszcze żadnych fiszek/i)).toBeInTheDocument();
    });

    it('powinien renderować przyciski w EmptyState', () => {
      render(
        <FlashcardsGrid
          cards={[]}
          isLoading={false}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onGenerateClick={mockOnGenerateClick}
          onAddManualClick={mockOnAddManualClick}
        />
      );

      expect(screen.getByRole('button', { name: /generuj fiszki ai/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /dodaj fiszkę ręcznie/i })).toBeInTheDocument();
    });

    it('powinien wywołać onGenerateClick po kliknięciu przycisku generowania', async () => {
      const user = userEvent.setup();
      render(
        <FlashcardsGrid
          cards={[]}
          isLoading={false}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onGenerateClick={mockOnGenerateClick}
          onAddManualClick={mockOnAddManualClick}
        />
      );

      const generateButton = screen.getByRole('button', { name: /generuj fiszki ai/i });
      await user.click(generateButton);

      expect(mockOnGenerateClick).toHaveBeenCalledTimes(1);
    });

    it('powinien wywołać onAddManualClick po kliknięciu przycisku dodawania', async () => {
      const user = userEvent.setup();
      render(
        <FlashcardsGrid
          cards={[]}
          isLoading={false}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onGenerateClick={mockOnGenerateClick}
          onAddManualClick={mockOnAddManualClick}
        />
      );

      const addButton = screen.getByRole('button', { name: /dodaj fiszkę ręcznie/i });
      await user.click(addButton);

      expect(mockOnAddManualClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Wyświetlanie fiszek', () => {
    it('powinien renderować listę fiszek', () => {
      render(
        <FlashcardsGrid
          cards={mockCards}
          isLoading={false}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onGenerateClick={mockOnGenerateClick}
          onAddManualClick={mockOnAddManualClick}
        />
      );

      expect(screen.getByText('Test 1')).toBeInTheDocument();
      expect(screen.getByText('Test 2')).toBeInTheDocument();
    });

    it('powinien renderować odpowiednią liczbę fiszek', () => {
      const { container } = render(
        <FlashcardsGrid
          cards={mockCards}
          isLoading={false}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onGenerateClick={mockOnGenerateClick}
          onAddManualClick={mockOnAddManualClick}
        />
      );

      const grid = container.querySelector('.grid');
      expect(grid?.children).toHaveLength(2);
    });

    it('powinien renderować fiszkę z wszystkimi danymi', () => {
      render(
        <FlashcardsGrid
          cards={[mockCards[0]]}
          isLoading={false}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onGenerateClick={mockOnGenerateClick}
          onAddManualClick={mockOnAddManualClick}
        />
      );

      expect(screen.getByText('Test 1')).toBeInTheDocument();
      expect(screen.getByText('Answer 1')).toBeInTheDocument();
      expect(screen.getByText('Ręczna')).toBeInTheDocument();
    });

    it('powinien renderować badge "AI" dla fiszek AI', () => {
      render(
        <FlashcardsGrid
          cards={[mockCards[1]]}
          isLoading={false}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onGenerateClick={mockOnGenerateClick}
          onAddManualClick={mockOnAddManualClick}
        />
      );

      expect(screen.getByText('AI')).toBeInTheDocument();
    });

    it('powinien renderować badge "Ręczna" dla fiszek ręcznych', () => {
      render(
        <FlashcardsGrid
          cards={[mockCards[0]]}
          isLoading={false}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onGenerateClick={mockOnGenerateClick}
          onAddManualClick={mockOnAddManualClick}
        />
      );

      expect(screen.getByText('Ręczna')).toBeInTheDocument();
    });

    it('powinien renderować liczbę powtórek gdy > 0', () => {
      render(
        <FlashcardsGrid
          cards={[mockCards[1]]}
          isLoading={false}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onGenerateClick={mockOnGenerateClick}
          onAddManualClick={mockOnAddManualClick}
        />
      );

      expect(screen.getByText(/powtórki: 5/i)).toBeInTheDocument();
    });

    it('nie powinien renderować liczby powtórek gdy = 0', () => {
      render(
        <FlashcardsGrid
          cards={[mockCards[0]]}
          isLoading={false}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onGenerateClick={mockOnGenerateClick}
          onAddManualClick={mockOnAddManualClick}
        />
      );

      expect(screen.queryByText(/powtórki:/i)).not.toBeInTheDocument();
    });

    it('powinien renderować przyciski edycji i usuwania dla każdej fiszki', () => {
      render(
        <FlashcardsGrid
          cards={mockCards}
          isLoading={false}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onGenerateClick={mockOnGenerateClick}
          onAddManualClick={mockOnAddManualClick}
        />
      );

      const editButtons = screen.getAllByLabelText(/edytuj fiszkę/i);
      const deleteButtons = screen.getAllByLabelText(/usuń fiszkę/i);

      expect(editButtons).toHaveLength(2);
      expect(deleteButtons).toHaveLength(2);
    });
  });

  describe('Interakcje z fiszkami', () => {
    it('powinien wywołać onEdit z poprawną fiszką', async () => {
      const user = userEvent.setup();
      render(
        <FlashcardsGrid
          cards={mockCards}
          isLoading={false}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onGenerateClick={mockOnGenerateClick}
          onAddManualClick={mockOnAddManualClick}
        />
      );

      const editButtons = screen.getAllByLabelText(/edytuj fiszkę/i);
      await user.click(editButtons[0]);

      expect(mockOnEdit).toHaveBeenCalledWith(mockCards[0]);
      expect(mockOnEdit).toHaveBeenCalledTimes(1);
    });

    it('powinien wywołać onDelete z poprawną fiszką', async () => {
      const user = userEvent.setup();
      render(
        <FlashcardsGrid
          cards={mockCards}
          isLoading={false}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onGenerateClick={mockOnGenerateClick}
          onAddManualClick={mockOnAddManualClick}
        />
      );

      const deleteButtons = screen.getAllByLabelText(/usuń fiszkę/i);
      await user.click(deleteButtons[1]);

      expect(mockOnDelete).toHaveBeenCalledWith(mockCards[1]);
      expect(mockOnDelete).toHaveBeenCalledTimes(1);
    });

    it('powinien wywołać onEdit dla różnych fiszek', async () => {
      const user = userEvent.setup();
      render(
        <FlashcardsGrid
          cards={mockCards}
          isLoading={false}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onGenerateClick={mockOnGenerateClick}
          onAddManualClick={mockOnAddManualClick}
        />
      );

      const editButtons = screen.getAllByLabelText(/edytuj fiszkę/i);
      await user.click(editButtons[0]);
      await user.click(editButtons[1]);

      expect(mockOnEdit).toHaveBeenCalledTimes(2);
      expect(mockOnEdit).toHaveBeenNthCalledWith(1, mockCards[0]);
      expect(mockOnEdit).toHaveBeenNthCalledWith(2, mockCards[1]);
    });
  });

  describe('Responsywność grid', () => {
    it('powinien mieć poprawne klasy grid', () => {
      const { container } = render(
        <FlashcardsGrid
          cards={mockCards}
          isLoading={false}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onGenerateClick={mockOnGenerateClick}
          onAddManualClick={mockOnAddManualClick}
        />
      );

      const grid = container.querySelector('.grid');
      expect(grid).toHaveClass('grid-cols-1');
      expect(grid).toHaveClass('md:grid-cols-2');
      expect(grid).toHaveClass('lg:grid-cols-3');
    });

    it('powinien mieć te same klasy grid dla skeleton', () => {
      const { container } = render(
        <FlashcardsGrid
          cards={[]}
          isLoading={true}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onGenerateClick={mockOnGenerateClick}
          onAddManualClick={mockOnAddManualClick}
        />
      );

      const grid = container.querySelector('.grid');
      expect(grid).toHaveClass('grid-cols-1');
      expect(grid).toHaveClass('md:grid-cols-2');
      expect(grid).toHaveClass('lg:grid-cols-3');
    });
  });

  describe('Obsługa dużej liczby fiszek', () => {
    it('powinien renderować wiele fiszek', () => {
      const manyCards: CardDTO[] = Array.from({ length: 50 }, (_, i) => ({
        id: `${i + 1}`,
        front: `Test ${i + 1}`,
        back: `Answer ${i + 1}`,
        source: i % 2 === 0 ? ('manual' as const) : ('ai' as const),
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        repetitions: i,
        user_id: 'user-1',
      }));

      const { container } = render(
        <FlashcardsGrid
          cards={manyCards}
          isLoading={false}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onGenerateClick={mockOnGenerateClick}
          onAddManualClick={mockOnAddManualClick}
        />
      );

      const grid = container.querySelector('.grid');
      expect(grid?.children).toHaveLength(50);
    });

    it('powinien renderować pierwszą i ostatnią fiszkę z dużej listy', () => {
      const manyCards: CardDTO[] = Array.from({ length: 100 }, (_, i) => ({
        id: `${i + 1}`,
        front: `Test ${i + 1}`,
        back: `Answer ${i + 1}`,
        source: 'manual' as const,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        repetitions: 0,
        user_id: 'user-1',
      }));

      render(
        <FlashcardsGrid
          cards={manyCards}
          isLoading={false}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onGenerateClick={mockOnGenerateClick}
          onAddManualClick={mockOnAddManualClick}
        />
      );

      expect(screen.getByText('Test 1')).toBeInTheDocument();
      expect(screen.getByText('Test 100')).toBeInTheDocument();
    });
  });
});
