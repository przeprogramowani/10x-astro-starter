import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import CharacterCounter from './CharacterCounter';
import type { CardDTO, UpdateCardCommand } from '../../types';

/**
 * Modal for editing an existing flashcard
 * Pre-fills form with current card data and validates changes
 */

interface EditCardModalProps {
  card: CardDTO;
  isOpen: boolean;
  onClose: () => void;
  onSave: (cardId: string, updates: UpdateCardCommand) => Promise<void>;
}

const MAX_FRONT_LENGTH = 200;
const MAX_BACK_LENGTH = 500;

export default function EditCardModal({ card, isOpen, onClose, onSave }: EditCardModalProps) {
  const [front, setFront] = useState(card.front);
  const [back, setBack] = useState(card.back);
  const [errors, setErrors] = useState<{ front?: string; back?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when card changes or modal opens
  useEffect(() => {
    if (card) {
      setFront(card.front);
      setBack(card.back);
      setErrors({});
      setIsSubmitting(false);
    }
  }, [card, isOpen]);

  const validateFront = (value: string): string | undefined => {
    if (value.length === 0) {
      return 'Przód fiszki jest wymagany';
    }
    if (value.length > MAX_FRONT_LENGTH) {
      return `Przód fiszki musi mieć między 1 a ${MAX_FRONT_LENGTH} znaków`;
    }
    return undefined;
  };

  const validateBack = (value: string): string | undefined => {
    if (value.length === 0) {
      return 'Tył fiszki jest wymagany';
    }
    if (value.length > MAX_BACK_LENGTH) {
      return `Tył fiszki musi mieć między 1 a ${MAX_BACK_LENGTH} znaków`;
    }
    return undefined;
  };

  const handleFrontChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setFront(value);
    const error = validateFront(value);
    setErrors((prev) => ({ ...prev, front: error }));
  };

  const handleBackChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setBack(value);
    const error = validateBack(value);
    setErrors((prev) => ({ ...prev, back: error }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate both fields
    const frontError = validateFront(front);
    const backError = validateBack(back);

    if (frontError || backError) {
      setErrors({ front: frontError, back: backError });
      return;
    }

    setIsSubmitting(true);
    try {
      // Only send changed fields
      const updates: UpdateCardCommand = {};
      if (front !== card.front) updates.front = front;
      if (back !== card.back) updates.back = back;

      await onSave(card.id, updates);
      onClose();
    } catch (error) {
      console.error('Error updating card:', error);
      // Error is already handled by the hook with toast
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = !errors.front && !errors.back && front.length > 0 && back.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edytuj fiszkę</DialogTitle>
          <DialogDescription>
            Wprowadź zmiany w treści fiszki. Możesz edytować przód i tył.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Front field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="edit-front">Przód fiszki</Label>
                <CharacterCounter count={front.length} max={MAX_FRONT_LENGTH} />
              </div>
              <Textarea
                id="edit-front"
                value={front}
                onChange={handleFrontChange}
                placeholder="Wpisz pytanie lub termin..."
                rows={3}
                disabled={isSubmitting}
                className={errors.front ? 'border-red-500 focus-visible:ring-red-500' : ''}
              />
              {errors.front && <p className="text-sm text-red-600">{errors.front}</p>}
            </div>

            {/* Back field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="edit-back">Tył fiszki</Label>
                <CharacterCounter count={back.length} max={MAX_BACK_LENGTH} />
              </div>
              <Textarea
                id="edit-back"
                value={back}
                onChange={handleBackChange}
                placeholder="Wpisz odpowiedź lub definicję..."
                rows={5}
                disabled={isSubmitting}
                className={errors.back ? 'border-red-500 focus-visible:ring-red-500' : ''}
              />
              {errors.back && <p className="text-sm text-red-600">{errors.back}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Anuluj
            </Button>
            <Button type="submit" disabled={!isFormValid || isSubmitting}>
              {isSubmitting ? 'Zapisywanie...' : 'Zapisz zmiany'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
