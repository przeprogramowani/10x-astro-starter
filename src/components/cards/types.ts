/**
 * Types and interfaces for Cards view components
 */

/**
 * Filter state for cards list
 */
export interface FilterState {
  source: 'all' | 'manual' | 'ai';
  sort: 'created_at' | 'updated_at' | 'repetitions';
  order: 'asc' | 'desc';
}

/**
 * Pagination state for cards list
 */
export interface PaginationState {
  currentPage: number;
  totalPages: number;
  hasMore: boolean;
  limit: number;
  offset: number;
}

/**
 * Form data for Add/Edit card modals
 */
export interface CardFormData {
  front: string;
  back: string;
  errors: {
    front?: string;
    back?: string;
  };
}
