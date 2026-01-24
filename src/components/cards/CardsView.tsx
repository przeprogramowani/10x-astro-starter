import { useState } from 'react';
import { useCards } from '../hooks/useCards';
import FiltersBar from './FiltersBar';
import FlashcardsGrid from './FlashcardsGrid';
import PaginationControls from './PaginationControls';
import AddCardModal from './AddCardModal';
import EditCardModal from './EditCardModal';
import DeleteConfirmDialog from './DeleteConfirmDialog';
import type { CardDTO, CreateCardCommand, UpdateCardCommand } from '../../types';

/**
 * Main Cards view component
 * Manages global state, data fetching, and coordinates all subcomponents
 */

export default function CardsView() {
  // Use custom hook for cards management
  const { cards, isLoading, filters, pagination, setFilters, addCard, updateCard, deleteCard, nextPage, previousPage } =
    useCards();

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CardDTO | null>(null);
  const [deletingCard, setDeletingCard] = useState<CardDTO | null>(null);

  // Calculate pagination info
  const currentPage = pagination ? Math.floor(pagination.offset / pagination.limit) + 1 : 1;
  const totalPages = pagination ? Math.ceil(pagination.total / pagination.limit) : 1;

  // Handlers
  const handleAddClick = () => {
    setIsAddModalOpen(true);
  };

  const handleEditClick = (card: CardDTO) => {
    setEditingCard(card);
  };

  const handleDeleteClick = (card: CardDTO) => {
    setDeletingCard(card);
  };

  const handleGenerateClick = () => {
    window.location.href = '/generate';
  };

  const handleAddCard = async (cardData: CreateCardCommand) => {
    try {
      await addCard(cardData);
      setIsAddModalOpen(false);
    } catch (error) {
      // Error is handled by the hook
      throw error;
    }
  };

  const handleUpdateCard = async (cardId: string, updates: UpdateCardCommand) => {
    try {
      await updateCard(cardId, updates);
      setEditingCard(null);
    } catch (error) {
      // Error is handled by the hook
      throw error;
    }
  };

  const handleDeleteCard = async () => {
    if (!deletingCard) return;
    try {
      await deleteCard(deletingCard.id);
      setDeletingCard(null);
    } catch (error) {
      // Error is handled by the hook
      throw error;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <h1 className="text-3xl font-bold mb-6">Moje fiszki</h1>

      <FiltersBar filters={filters} onFilterChange={setFilters} onAddClick={handleAddClick} />

      <FlashcardsGrid
        cards={cards}
        isLoading={isLoading}
        onEdit={handleEditClick}
        onDelete={handleDeleteClick}
        onGenerateClick={handleGenerateClick}
        onAddManualClick={handleAddClick}
      />

      {pagination && cards.length > 0 && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          hasMore={pagination.has_more}
          onPrevious={previousPage}
          onNext={nextPage}
        />
      )}

      {/* Add Card Modal */}
      <AddCardModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onAdd={handleAddCard} />

      {/* Edit Card Modal */}
      {editingCard && (
        <EditCardModal
          card={editingCard}
          isOpen={!!editingCard}
          onClose={() => setEditingCard(null)}
          onSave={handleUpdateCard}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deletingCard && (
        <DeleteConfirmDialog
          card={deletingCard}
          isOpen={!!deletingCard}
          onClose={() => setDeletingCard(null)}
          onConfirm={handleDeleteCard}
        />
      )}
    </div>
  );
}
