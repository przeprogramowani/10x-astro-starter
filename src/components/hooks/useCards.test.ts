import { renderHook, waitFor } from '@testing-library/react';
import { act } from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useCards } from './useCards';
import type { CardDTO, CardsListResponseDTO } from '../../types';

describe('useCards', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Pobieranie fiszek', () => {
    it('powinien pobrać fiszki przy inicjalizacji', async () => {
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

      const mockResponse: CardsListResponseDTO = {
        data: mockCards,
        pagination: { limit: 50, offset: 0, total: 2, has_more: false },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useCards());

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.cards).toEqual(mockCards);
      expect(result.current.pagination).toEqual({
        limit: 50,
        offset: 0,
        total: 2,
        has_more: false,
      });
    });

    it('powinien obsłużyć błąd 401 i przekierować do logowania', async () => {
      const originalLocation = window.location;
      delete (window as any).location;
      window.location = { ...originalLocation, href: '' } as Location;

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
      });

      const { result } = renderHook(() => useCards());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(window.location.href).toBe('/login');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Session expired, redirecting to login');

      window.location = originalLocation;
      consoleErrorSpy.mockRestore();
    });

    it('powinien obsłużyć błąd pobierania i ustawić pustą listę', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      });

      const { result } = renderHook(() => useCards());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.cards).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Filtrowanie i sortowanie', () => {
    it('powinien zaktualizować filtry i ponownie pobrać dane', async () => {
      const mockResponse: CardsListResponseDTO = {
        data: [],
        pagination: { limit: 50, offset: 0, total: 0, has_more: false },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useCards());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.setFilters({
          source: 'ai',
          sort: 'updated_at',
          order: 'asc',
        });
      });

      await waitFor(() => {
        const lastCall = (global.fetch as any).mock.calls[(global.fetch as any).mock.calls.length - 1][0];
        expect(lastCall).toContain('source=ai');
        expect(lastCall).toContain('sort=updated_at');
        expect(lastCall).toContain('order=asc');
      });
    });

    it('nie powinien wysyłać parametru source gdy wybrano "all"', async () => {
      const mockResponse: CardsListResponseDTO = {
        data: [],
        pagination: { limit: 50, offset: 0, total: 0, has_more: false },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useCards());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const lastCall = (global.fetch as any).mock.calls[0][0];
      expect(lastCall).not.toContain('source=');
    });
  });

  describe('Paginacja', () => {
    it('powinien przejść do następnej strony', async () => {
      const mockResponse: CardsListResponseDTO = {
        data: [],
        pagination: { limit: 50, offset: 0, total: 100, has_more: true },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useCards());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.nextPage();
      });

      await waitFor(() => {
        const lastCall = (global.fetch as any).mock.calls[(global.fetch as any).mock.calls.length - 1][0];
        expect(lastCall).toContain('offset=50');
      });
    });

    it('powinien przejść do poprzedniej strony', async () => {
      const mockResponse: CardsListResponseDTO = {
        data: [],
        pagination: { limit: 50, offset: 50, total: 100, has_more: true },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useCards());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Najpierw ustawiamy offset na 50
      act(() => {
        result.current.nextPage();
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.previousPage();
      });

      await waitFor(() => {
        const lastCall = (global.fetch as any).mock.calls[(global.fetch as any).mock.calls.length - 1][0];
        expect(lastCall).toContain('offset=0');
      });
    });

    it('nie powinien przejść poniżej offset = 0', async () => {
      const mockResponse: CardsListResponseDTO = {
        data: [],
        pagination: { limit: 50, offset: 0, total: 100, has_more: true },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useCards());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const fetchCallsBefore = (global.fetch as any).mock.calls.length;

      // Wywołaj previousPage gdy już jesteśmy na offset = 0
      act(() => {
        result.current.previousPage();
      });

      // previousPage ustawia offset na Math.max(0, prev - limit), więc gdy prev = 0, to 0 - 50 = -50, ale Math.max(0, -50) = 0
      // To powoduje ponowne wywołanie fetchCards z tym samym offsetem
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Sprawdź czy offset pozostał 0
      const lastCall = (global.fetch as any).mock.calls[(global.fetch as any).mock.calls.length - 1][0];
      expect(lastCall).toContain('offset=0');
    });

    it('nie powinien przejść do następnej strony gdy has_more = false', async () => {
      const mockResponse: CardsListResponseDTO = {
        data: [],
        pagination: { limit: 50, offset: 0, total: 10, has_more: false },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useCards());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const fetchCallsBefore = (global.fetch as any).mock.calls.length;

      act(() => {
        result.current.nextPage();
      });

      // Nie powinno być nowego wywołania fetch
      await waitFor(() => {
        const fetchCallsAfter = (global.fetch as any).mock.calls.length;
        expect(fetchCallsAfter).toBe(fetchCallsBefore);
      });
    });
  });

  describe('Dodawanie fiszki', () => {
    it('powinien dodać nową fiszkę i zaktualizować listę', async () => {
      const mockCard: CardDTO = {
        id: '1',
        front: 'Test',
        back: 'Answer',
        source: 'manual',
        user_id: 'user-1',
        repetitions: 0,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const mockResponse: CardsListResponseDTO = {
        data: [],
        pagination: { limit: 50, offset: 0, total: 0, has_more: false },
      };

      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockCard,
        });

      const { result } = renderHook(() => useCards());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.addCard({ front: 'Test', back: 'Answer' });
      });

      expect(result.current.cards).toEqual([mockCard]);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/cards',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify([{ front: 'Test', back: 'Answer' }]),
        })
      );
    });

    it('powinien obsłużyć błąd walidacji podczas dodawania', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const mockResponse: CardsListResponseDTO = {
        data: [],
        pagination: { limit: 50, offset: 0, total: 0, has_more: false },
      };

      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({
            details: [{ message: 'Front is required' }],
          }),
        });

      const { result } = renderHook(() => useCards());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.addCard({ front: '', back: 'Answer' });
        })
      ).rejects.toThrow('Front is required');

      consoleErrorSpy.mockRestore();
    });

    it('powinien obsłużyć błąd serwera podczas dodawania', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const mockResponse: CardsListResponseDTO = {
        data: [],
        pagination: { limit: 50, offset: 0, total: 0, has_more: false },
      };

      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({}),
        });

      const { result } = renderHook(() => useCards());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.addCard({ front: 'Test', back: 'Answer' });
        })
      ).rejects.toThrow('Failed to create card');

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Aktualizacja fiszki', () => {
    it('powinien zaktualizować fiszkę w liście', async () => {
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

      const updatedCard: CardDTO = {
        id: '1',
        front: 'Updated',
        back: 'Updated Answer',
        source: 'manual',
        user_id: 'user-1',
        repetitions: 0,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-03T00:00:00Z',
      };

      const mockResponse: CardsListResponseDTO = {
        data: mockCards,
        pagination: { limit: 50, offset: 0, total: 2, has_more: false },
      };

      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => updatedCard,
        });

      const { result } = renderHook(() => useCards());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.updateCard('1', { front: 'Updated', back: 'Updated Answer' });
      });

      expect(result.current.cards[0]).toEqual(updatedCard);
      expect(result.current.cards[1]).toEqual(mockCards[1]);
    });

    it('powinien obsłużyć błąd 404 podczas aktualizacji', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const mockResponse: CardsListResponseDTO = {
        data: [],
        pagination: { limit: 50, offset: 0, total: 0, has_more: false },
      };

      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
        });

      const { result } = renderHook(() => useCards());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.updateCard('999', { front: 'Test' });
        })
      ).rejects.toThrow('Card not found');

      consoleErrorSpy.mockRestore();
    });

    it('powinien obsłużyć błąd walidacji podczas aktualizacji', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const mockResponse: CardsListResponseDTO = {
        data: [],
        pagination: { limit: 50, offset: 0, total: 0, has_more: false },
      };

      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({
            details: [{ message: 'Front cannot be empty' }],
          }),
        });

      const { result } = renderHook(() => useCards());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.updateCard('1', { front: '' });
        })
      ).rejects.toThrow('Front cannot be empty');

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Usuwanie fiszki', () => {
    it('powinien usunąć fiszkę z listy', async () => {
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

      const mockResponse: CardsListResponseDTO = {
        data: mockCards,
        pagination: { limit: 50, offset: 0, total: 2, has_more: false },
      };

      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
        });

      const { result } = renderHook(() => useCards());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.deleteCard('1');
      });

      expect(result.current.cards).toEqual([mockCards[1]]);
      expect(result.current.cards).toHaveLength(1);
    });

    it('powinien obsłużyć błąd 404 podczas usuwania', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const mockResponse: CardsListResponseDTO = {
        data: [],
        pagination: { limit: 50, offset: 0, total: 0, has_more: false },
      };

      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
        });

      const { result } = renderHook(() => useCards());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.deleteCard('999');
        })
      ).rejects.toThrow('Card not found');

      consoleErrorSpy.mockRestore();
    });

    it('powinien obsłużyć błąd serwera podczas usuwania', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const mockResponse: CardsListResponseDTO = {
        data: [],
        pagination: { limit: 50, offset: 0, total: 0, has_more: false },
      };

      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
        });

      const { result } = renderHook(() => useCards());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.deleteCard('1');
        })
      ).rejects.toThrow('Failed to delete card');

      consoleErrorSpy.mockRestore();
    });
  });
});
