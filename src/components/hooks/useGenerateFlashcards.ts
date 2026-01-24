import { useState } from "react";
import type {
  SuggestedCardDTO,
  CreateCardCommand,
  GenerationRequestResponseDTO,
  RateLimitErrorResponseDTO,
} from "@/types";

type ViewState = "idle" | "loading" | "results" | "empty";

interface UseGenerateFlashcardsReturn {
  generateFlashcards: (inputText: string) => Promise<void>;
  saveSelectedCards: (selectedCards: CreateCardCommand[]) => Promise<void>;
  viewState: ViewState;
  suggestedCards: SuggestedCardDTO[];
  error: string | null;
  isLoading: boolean;
  isSaving: boolean;
}

export function useGenerateFlashcards(): UseGenerateFlashcardsReturn {
  const [viewState, setViewState] = useState<ViewState>("idle");
  const [suggestedCards, setSuggestedCards] = useState<SuggestedCardDTO[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const generateFlashcards = async (inputText: string) => {
    setIsLoading(true);
    setError(null);
    setViewState("loading");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch("/api/generation-requests", {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ input_text: inputText }),
      });

      clearTimeout(timeoutId);

      if (response.status === 429) {
        const data: RateLimitErrorResponseDTO = await response.json();
        const retryMinutes = Math.ceil(data.retry_after / 60);
        alert(`Przekroczono limit generacji. Spróbuj ponownie za ${retryMinutes} minut.`);
        setViewState("idle");
        return;
      }

      if (response.status === 502) {
        alert("Usługa AI niedostępna. Spróbuj później.");
        setViewState("idle");
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Generowanie nie powiodło się");
      }

      const data: GenerationRequestResponseDTO = await response.json();

      if (data.generated_count === 0) {
        setViewState("empty");
      } else {
        setSuggestedCards(data.suggested_cards);
        setViewState("results");
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        alert("Generowanie trwało zbyt długo. Spróbuj ponownie.");
      } else {
        const errorMessage = (err as Error).message || "Wystąpił błąd. Spróbuj ponownie.";
        alert(errorMessage);
      }
      setError((err as Error).message);
      setViewState("idle");
    } finally {
      setIsLoading(false);
    }
  };

  const saveSelectedCards = async (selectedCards: CreateCardCommand[]) => {
    setIsSaving(true);

    try {
      const response = await fetch("/api/cards?source=ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(selectedCards),
      });

      if (!response.ok) {
        throw new Error("Zapis nie powiódł się");
      }

      alert("Fiszki zostały zapisane");
      setViewState("idle");
      setSuggestedCards([]);
    } catch (err) {
      alert("Wystąpił błąd podczas zapisywania fiszek");
    } finally {
      setIsSaving(false);
    }
  };

  return {
    generateFlashcards,
    saveSelectedCards,
    viewState,
    suggestedCards,
    error,
    isLoading,
    isSaving,
  };
}
