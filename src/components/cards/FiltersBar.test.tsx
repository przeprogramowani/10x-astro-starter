import { render, screen } from '@/test/test-utils';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import FiltersBar from './FiltersBar';
import type { FilterState } from './types';

describe('FiltersBar', () => {
  const mockFilters: FilterState = {
    source: 'all',
    sort: 'created_at',
    order: 'desc',
  };

  const mockOnFilterChange = vi.fn();
  const mockOnAddClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Renderowanie', () => {
    it('powinien renderować wszystkie filtry', () => {
      render(
        <FiltersBar
          filters={mockFilters}
          onFilterChange={mockOnFilterChange}
          onAddClick={mockOnAddClick}
        />
      );

      expect(screen.getByLabelText('Źródło:')).toBeInTheDocument();
      expect(screen.getByLabelText('Sortuj:')).toBeInTheDocument();
      expect(screen.getByLabelText('Kolejność:')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /dodaj fiszkę ręcznie/i })).toBeInTheDocument();
    });

    it('powinien wyświetlać poprawne wartości filtrów', () => {
      render(
        <FiltersBar
          filters={mockFilters}
          onFilterChange={mockOnFilterChange}
          onAddClick={mockOnAddClick}
        />
      );

      // Sprawdź czy selecty wyświetlają poprawne wartości tekstowe
      expect(screen.getByText('Wszystkie')).toBeInTheDocument();
      expect(screen.getByText('Data utworzenia')).toBeInTheDocument();
      expect(screen.getByText('Malejąco')).toBeInTheDocument();
    });

    it('powinien renderować przycisk dodawania z ikoną', () => {
      render(
        <FiltersBar
          filters={mockFilters}
          onFilterChange={mockOnFilterChange}
          onAddClick={mockOnAddClick}
        />
      );

      const addButton = screen.getByRole('button', { name: /dodaj fiszkę ręcznie/i });
      expect(addButton).toBeInTheDocument();
      expect(addButton).toHaveTextContent('Dodaj fiszkę ręcznie');
    });

    it('powinien wyświetlać wartość "AI" gdy source = "ai"', () => {
      render(
        <FiltersBar
          filters={{ ...mockFilters, source: 'ai' }}
          onFilterChange={mockOnFilterChange}
          onAddClick={mockOnAddClick}
        />
      );

      expect(screen.getByText('AI')).toBeInTheDocument();
    });

    it('powinien wyświetlać wartość "Ręczne" gdy source = "manual"', () => {
      render(
        <FiltersBar
          filters={{ ...mockFilters, source: 'manual' }}
          onFilterChange={mockOnFilterChange}
          onAddClick={mockOnAddClick}
        />
      );

      expect(screen.getByText('Ręczne')).toBeInTheDocument();
    });

    it('powinien wyświetlać wartość "Data aktualizacji" gdy sort = "updated_at"', () => {
      render(
        <FiltersBar
          filters={{ ...mockFilters, sort: 'updated_at' }}
          onFilterChange={mockOnFilterChange}
          onAddClick={mockOnAddClick}
        />
      );

      expect(screen.getByText('Data aktualizacji')).toBeInTheDocument();
    });

    it('powinien wyświetlać wartość "Liczba powtórek" gdy sort = "repetitions"', () => {
      render(
        <FiltersBar
          filters={{ ...mockFilters, sort: 'repetitions' }}
          onFilterChange={mockOnFilterChange}
          onAddClick={mockOnAddClick}
        />
      );

      expect(screen.getByText('Liczba powtórek')).toBeInTheDocument();
    });

    it('powinien wyświetlać wartość "Rosnąco" gdy order = "asc"', () => {
      render(
        <FiltersBar
          filters={{ ...mockFilters, order: 'asc' }}
          onFilterChange={mockOnFilterChange}
          onAddClick={mockOnAddClick}
        />
      );

      expect(screen.getByText('Rosnąco')).toBeInTheDocument();
    });
  });

  describe('Przycisk dodawania', () => {
    it('powinien wywołać onAddClick po kliknięciu przycisku', async () => {
      const user = userEvent.setup();
      render(
        <FiltersBar
          filters={mockFilters}
          onFilterChange={mockOnFilterChange}
          onAddClick={mockOnAddClick}
        />
      );

      const addButton = screen.getByRole('button', { name: /dodaj fiszkę ręcznie/i });
      await user.click(addButton);

      expect(mockOnAddClick).toHaveBeenCalledTimes(1);
    });

    it('powinien wywołać onAddClick wielokrotnie przy wielokrotnym kliknięciu', async () => {
      const user = userEvent.setup();
      render(
        <FiltersBar
          filters={mockFilters}
          onFilterChange={mockOnFilterChange}
          onAddClick={mockOnAddClick}
        />
      );

      const addButton = screen.getByRole('button', { name: /dodaj fiszkę ręcznie/i });
      await user.click(addButton);
      await user.click(addButton);
      await user.click(addButton);

      expect(mockOnAddClick).toHaveBeenCalledTimes(3);
    });
  });

  describe('Responsywność', () => {
    it('powinien mieć poprawną strukturę responsywną', () => {
      const { container } = render(
        <FiltersBar
          filters={mockFilters}
          onFilterChange={mockOnFilterChange}
          onAddClick={mockOnAddClick}
        />
      );

      // Sprawdź czy główny kontener ma klasy responsywne
      const mainContainer = container.querySelector('.flex.flex-col.sm\\:flex-row');
      expect(mainContainer).toBeInTheDocument();
    });
  });

  // Uwaga: Testy interakcji z Radix UI Select są pominięte, ponieważ wymagają
  // specjalnej konfiguracji testów (pointer events, portal rendering).
  // Te interakcje są testowane w testach e2e (Playwright).
});
