import { useGenerateFlashcards } from "./hooks/useGenerateFlashcards";
import GenerateForm from "./generate/GenerateForm";
import LoadingState from "./generate/LoadingState";
import GeneratedCardsList from "./generate/GeneratedCardsList";
import EmptyResultsMessage from "./generate/EmptyResultsMessage";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";

interface GenerateViewProps {
  userId: string;
  userEmail: string;
}

export default function GenerateView({ userId, userEmail }: GenerateViewProps) {
  const {
    generateFlashcards,
    saveSelectedCards,
    viewState,
    suggestedCards,
    error,
    isLoading,
    isSaving,
    showSuccessDialog,
    closeSuccessDialog,
  } = useGenerateFlashcards();

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Generuj fiszki przez AI</h1>

      {viewState === "idle" && <GenerateForm onSubmit={generateFlashcards} isLoading={isLoading} />}

      {viewState === "loading" && <LoadingState message="Generuję fiszki..." />}

      {viewState === "results" && (
        <GeneratedCardsList suggestedCards={suggestedCards} onSave={saveSelectedCards} isSaving={isSaving} />
      )}

      {viewState === "empty" && <EmptyResultsMessage />}

      {error && <div className="text-red-600 mt-4 p-4 border border-red-300 rounded-md bg-red-50">{error}</div>}

      <AlertDialog open={showSuccessDialog} onOpenChange={closeSuccessDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sukces!</AlertDialogTitle>
            <AlertDialogDescription>
              Fiszki zostały pomyślnie zapisane. Możesz je teraz znaleźć w swoich fiszkach.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={closeSuccessDialog}>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
