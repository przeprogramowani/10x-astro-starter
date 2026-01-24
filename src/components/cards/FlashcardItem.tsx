import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import type { CardDTO } from '../../types';

/**
 * Single flashcard item component
 * Displays card front/back, source badge, repetitions count, and action buttons
 * Action buttons are visible on hover (desktop) or always visible (mobile)
 */

interface FlashcardItemProps {
  card: CardDTO;
  onEdit: (card: CardDTO) => void;
  onDelete: (card: CardDTO) => void;
}

export default function FlashcardItem({ card, onEdit, onDelete }: FlashcardItemProps) {
  const [isHovered, setIsHovered] = useState(false);

  const badgeVariant = card.source === 'ai' ? 'default' : 'secondary';
  const badgeText = card.source === 'ai' ? 'AI' : 'Ręczna';

  return (
    <Card
      className="group hover:shadow-lg transition-shadow duration-200 relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardHeader>
        <CardTitle className="text-lg font-bold">{card.front}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground line-clamp-3">{card.back}</p>
      </CardContent>
      <CardFooter className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant={badgeVariant}>{badgeText}</Badge>
          {card.repetitions > 0 && (
            <span className="text-sm text-muted-foreground">Powtórki: {card.repetitions}</span>
          )}
        </div>
        <div
          className={`flex items-center gap-2 transition-opacity ${
            isHovered ? 'opacity-100' : 'opacity-0 md:opacity-0'
          } md:group-hover:opacity-100 flex md:hidden md:group-hover:flex`}
        >
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onEdit(card)}
            aria-label="Edytuj fiszkę"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete(card)}
            aria-label="Usuń fiszkę"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
