import { useState, useEffect, useCallback } from 'react';
import type {
  CardDTO,
  CardsListResponseDTO,
  CreateCardCommand,
  UpdateCardCommand,
  PaginationMetadataDTO,
} from '../../types';
import type { FilterState } from '../cards/types';

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

/**
 * Custom hook for managing cards data and operations
 * Handles fetching, CRUD operations, filtering, sorting, and pagination
 */
export const useCards = (): UseCardsReturn => {
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

  /**
   * Fetch cards with current filters and pagination
   */
  const fetchCards = useCallback(async () => {
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
        credentials: 'same-origin',
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.error('Session expired, redirecting to login');
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
      setCards([]);
    } finally {
      setIsLoading(false);
    }
  }, [filters, currentOffset, limit]);

  /**
   * Add a new manual card
   */
  const addCard = useCallback(
    async (cardData: CreateCardCommand) => {
      try {
        const response = await fetch('/api/cards', {
          method: 'POST',
          credentials: 'same-origin',
          headers: {
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
        setCards((prev) => [newCard, ...prev]);
      } catch (err) {
        console.error('Error adding card:', err);
        throw err;
      }
    },
    []
  );

  /**
   * Update an existing card
   */
  const updateCard = useCallback(
    async (cardId: string, updates: UpdateCardCommand) => {
      try {
        const response = await fetch(`/api/cards/${cardId}`, {
          method: 'PATCH',
          credentials: 'same-origin',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updates),
        });

        if (!response.ok) {
          if (response.status === 404) {
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
      } catch (err) {
        console.error('Error updating card:', err);
        throw err;
      }
    },
    []
  );

  /**
   * Delete a card
   */
  const deleteCard = useCallback(
    async (cardId: string) => {
      try {
        const response = await fetch(`/api/cards/${cardId}`, {
          method: 'DELETE',
          credentials: 'same-origin',
        });

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Card not found');
          }
          throw new Error('Failed to delete card');
        }

        setCards((prev) => prev.filter((card) => card.id !== cardId));
      } catch (err) {
        console.error('Error deleting card:', err);
        throw err;
      }
    },
    []
  );

  /**
   * Navigate to next page
   */
  const nextPage = useCallback(() => {
    if (pagination?.has_more) {
      setCurrentOffset((prev) => prev + limit);
    }
  }, [pagination, limit]);

  /**
   * Navigate to previous page
   */
  const previousPage = useCallback(() => {
    setCurrentOffset((prev) => Math.max(0, prev - limit));
  }, [limit]);

  /**
   * Fetch cards when filters or pagination changes
   */
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
