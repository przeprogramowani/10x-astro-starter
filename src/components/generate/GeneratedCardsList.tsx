import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { SuggestedCardDTO, CreateCardCommand } from '@/types';
import SelectionControls from './SelectionControls';
import CardSuggestionItem from './CardSuggestionItem';

interface GeneratedCardsListProps {
  suggestedCards: SuggestedCardDTO[];
  onSave: (selectedCards: CreateCardCommand[]) => Promise<void>;
  isSaving: boolean;
}

export default function GeneratedCardsList({ 
  suggestedCards, 
  onSave, 
  isSaving 
}: GeneratedCardsListProps) {
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());

  const toggleSelection = (index: number) => {
    setSelectedIndices(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIndices(new Set(suggestedCards.map((_, i) => i)));
  };

  const deselectAll = () => {
    setSelectedIndices(new Set());
  };

  const handleSave = async () => {
    const selectedCards = Array.from(selectedIndices)
      .map(index => suggestedCards[index])
      .map(card => ({
        front: card.front,
        back: card.back
      }));
    await onSave(selectedCards);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Wygenerowane fiszki</h2>
      
      <SelectionControls 
        onSelectAll={selectAll} 
        onDeselectAll={deselectAll} 
      />
      
      <div className="space-y-4">
        {suggestedCards.map((card, index) => (
          <CardSuggestionItem
            key={index}
            card={card}
            index={index}
            isSelected={selectedIndices.has(index)}
            onSelectionChange={toggleSelection}
          />
        ))}
      </div>
      
      <Button
        onClick={handleSave}
        disabled={selectedIndices.size === 0 || isSaving}
      >
        {isSaving ? 'Zapisuję...' : `Zapisz wybrane fiszki (${selectedIndices.size})`}
      </Button>
    </div>
  );
}
