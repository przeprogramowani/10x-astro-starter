import type { CardDTO } from '../../types';
import FlashcardItem from './FlashcardItem';
import SkeletonCard from './SkeletonCard';
import EmptyState from './EmptyState';

/**
 * Responsive grid container for flashcards
 * Handles three states: loading (skeleton), empty (EmptyState), data (grid of cards)
 */

interface FlashcardsGridProps {
  cards: CardDTO[];
  isLoading: boolean;
  onEdit: (card: CardDTO) => void;
  onDelete: (card: CardDTO) => void;
  onGenerateClick: () => void;
  onAddManualClick: () => void;
}

export default function FlashcardsGrid({
  cards,
  isLoading,
  onEdit,
  onDelete,
  onGenerateClick,
  onAddManualClick,
}: FlashcardsGridProps) {
  // Loading state - show skeleton cards
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        {Array.from({ length: 8 }).map((_, index) => (
          <SkeletonCard key={index} />
        ))}
      </div>
    );
  }

  // Empty state - no cards
  if (cards.length === 0) {
    return <EmptyState onGenerateClick={onGenerateClick} onAddManualClick={onAddManualClick} />;
  }

  // Data state - display cards
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
      {cards.map((card) => (
        <FlashcardItem key={card.id} card={card} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  );
}
