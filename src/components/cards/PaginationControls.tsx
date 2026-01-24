import { Button } from '@/components/ui/button';

/**
 * Pagination controls component
 * Displays current page info and navigation buttons
 */

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  hasMore: boolean;
  onPrevious: () => void;
  onNext: () => void;
}

export default function PaginationControls({
  currentPage,
  totalPages,
  hasMore,
  onPrevious,
  onNext,
}: PaginationControlsProps) {
  const isFirstPage = currentPage === 1;

  return (
    <div className="flex items-center justify-between mt-8">
      <Button onClick={onPrevious} disabled={isFirstPage} variant="outline">
        Poprzednia
      </Button>
      <span className="text-sm text-muted-foreground">
        Strona {currentPage} z {totalPages}
      </span>
      <Button onClick={onNext} disabled={!hasMore} variant="outline">
        Następna
      </Button>
    </div>
  );
}
