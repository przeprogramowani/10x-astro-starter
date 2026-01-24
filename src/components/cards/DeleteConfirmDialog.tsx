import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import type { CardDTO } from '../../types';

/**
 * Confirmation dialog for deleting a flashcard
 * Shows card preview and warning about irreversible action
 */

interface DeleteConfirmDialogProps {
  card: CardDTO;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export default function DeleteConfirmDialog({
  card,
  isOpen,
  onClose,
  onConfirm,
}: DeleteConfirmDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Error deleting card:', error);
      // Error is already handled by the hook with toast
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Czy na pewno chcesz usunąć tę fiszkę?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p className="font-semibold text-foreground">"{card.front}"</p>
            <p className="text-muted-foreground">Ta akcja jest nieodwracalna.</p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            Anuluj
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={isDeleting}>
            {isDeleting ? 'Usuwanie...' : 'Usuń'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
