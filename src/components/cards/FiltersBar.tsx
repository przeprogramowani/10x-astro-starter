import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus } from 'lucide-react';
import type { FilterState } from './types';

/**
 * Filters bar component with source, sort, order selects and add button
 * Sticky position on desktop for easy access while scrolling
 */

interface FiltersBarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onAddClick: () => void;
}

export default function FiltersBar({ filters, onFilterChange, onAddClick }: FiltersBarProps) {
  const handleSourceChange = (value: 'all' | 'manual' | 'ai') => {
    onFilterChange({ ...filters, source: value });
  };

  const handleSortChange = (value: 'created_at' | 'updated_at' | 'repetitions') => {
    onFilterChange({ ...filters, sort: value });
  };

  const handleOrderChange = (value: 'asc' | 'desc') => {
    onFilterChange({ ...filters, order: value });
  };

  return (
    <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border py-4 mb-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
          {/* Source filter */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label htmlFor="source-filter" className="text-sm font-medium whitespace-nowrap">
              Źródło:
            </label>
            <Select value={filters.source} onValueChange={handleSourceChange}>
              <SelectTrigger id="source-filter" className="w-full sm:w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Wszystkie</SelectItem>
                <SelectItem value="ai">AI</SelectItem>
                <SelectItem value="manual">Ręczne</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sort filter */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label htmlFor="sort-filter" className="text-sm font-medium whitespace-nowrap">
              Sortuj:
            </label>
            <Select value={filters.sort} onValueChange={handleSortChange}>
              <SelectTrigger id="sort-filter" className="w-full sm:w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Data utworzenia</SelectItem>
                <SelectItem value="updated_at">Data aktualizacji</SelectItem>
                <SelectItem value="repetitions">Liczba powtórek</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Order filter */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label htmlFor="order-filter" className="text-sm font-medium whitespace-nowrap">
              Kolejność:
            </label>
            <Select value={filters.order} onValueChange={handleOrderChange}>
              <SelectTrigger id="order-filter" className="w-full sm:w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Malejąco</SelectItem>
                <SelectItem value="asc">Rosnąco</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Add button */}
        <Button onClick={onAddClick} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Dodaj fiszkę ręcznie
        </Button>
      </div>
    </div>
  );
}
