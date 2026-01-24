import { BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Empty state component shown when user has no flashcards
 * Provides call-to-action buttons to generate or create cards
 */

interface EmptyStateProps {
  onGenerateClick: () => void;
  onAddManualClick: () => void;
}

export default function EmptyState({ onGenerateClick, onAddManualClick }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <BookOpen className="w-16 h-16 text-muted-foreground mb-4" />
      <h2 className="text-2xl font-semibold mb-2">Nie masz jeszcze żadnych fiszek</h2>
      <p className="text-muted-foreground mb-6 max-w-md">
        Zacznij od wygenerowania fiszek przez AI lub utwórz je ręcznie
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={onGenerateClick}>Generuj fiszki AI</Button>
        <Button onClick={onAddManualClick} variant="outline">
          Dodaj fiszkę ręcznie
        </Button>
      </div>
    </div>
  );
}
