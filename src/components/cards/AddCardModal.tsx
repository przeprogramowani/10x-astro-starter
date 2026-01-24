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
import type { CreateCardCommand } from '../../types';

/**
 * Modal for adding a new manual flashcard
 * Includes real-time validation and character counters
 */

interface AddCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (cardData: CreateCardCommand) => Promise<void>;
}

const MAX_FRONT_LENGTH = 200;
const MAX_BACK_LENGTH = 500;

export default function AddCardModal({ isOpen, onClose, onAdd }: AddCardModalProps) {
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [errors, setErrors] = useState<{ front?: string; back?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFront('');
      setBack('');
      setErrors({});
      setIsSubmitting(false);
    }
  }, [isOpen]);

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
      await onAdd({ front, back });
      onClose();
    } catch (error) {
      console.error('Error adding card:', error);
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
          <DialogTitle>Dodaj nową fiszkę</DialogTitle>
          <DialogDescription>
            Utwórz nową fiszkę ręcznie. Wypełnij przód i tył fiszki.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Front field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="front">Przód fiszki</Label>
                <CharacterCounter count={front.length} max={MAX_FRONT_LENGTH} />
              </div>
              <Textarea
                id="front"
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
                <Label htmlFor="back">Tył fiszki</Label>
                <CharacterCounter count={back.length} max={MAX_BACK_LENGTH} />
              </div>
              <Textarea
                id="back"
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
              {isSubmitting ? 'Dodawanie...' : 'Dodaj'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
