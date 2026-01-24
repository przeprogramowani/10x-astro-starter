import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, AlertTriangle } from "lucide-react";

/**
 * DeleteAccountButton Component
 *
 * Przycisk do usuwania konta użytkownika z modalem potwierdzenia.
 * Wymaga wpisania tekstu potwierdzającego "USUŃ KONTO".
 * Wywołuje endpoint API DELETE /api/users/me.
 *
 * WYMAGANE zgodnie z RODO (prawo do usunięcia danych osobowych).
 */
export default function DeleteAccountButton() {
  // Stan modala
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Otwórz modal
   */
  const openModal = () => {
    setIsModalOpen(true);
    setError(null);
    setConfirmText("");
  };

  /**
   * Zamknij modal
   */
  const closeModal = () => {
    if (!isDeleting) {
      setIsModalOpen(false);
      setError(null);
      setConfirmText("");
    }
  };

  /**
   * Walidacja potwierdzenia
   */
  const validateConfirmation = (): boolean => {
    if (confirmText !== "USUŃ KONTO") {
      setError('Wpisz dokładnie "USUŃ KONTO" aby potwierdzić');
      return false;
    }

    return true;
  };

  /**
   * Obsługa usuwania konta
   * Wywołuje DELETE /api/users/me
   */
  const handleDelete = async () => {
    // Wyczyść poprzednie błędy
    setError(null);

    // Walidacja
    if (!validateConfirmation()) {
      return;
    }

    // Rozpocznij usuwanie
    setIsDeleting(true);

    try {
      // Wywołanie API endpoint DELETE /api/users/me
      // Autentykacja odbywa się automatycznie przez session cookies (Supabase)
      const response = await fetch("/api/users/me", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const data = await response.json();

        // Obsługa błędu 401 - brak autentykacji
        if (response.status === 401) {
          setError("Sesja wygasła. Zaloguj się ponownie.");
          setIsDeleting(false);
          return;
        }

        // Obsługa innych błędów (500, itp.)
        setError(data.message || "Nie udało się usunąć konta. Spróbuj ponownie.");
        setIsDeleting(false);
        return;
      }

      // Sukces - przekierowanie na stronę główną
      // Użytkownik zostanie automatycznie wylogowany (sesja usunięta)
      window.location.href = "/";
    } catch {
      // Obsługa nieoczekiwanych błędów (np. brak połączenia)
      setError("Wystąpił błąd połączenia. Sprawdź internet i spróbuj ponownie.");
      setIsDeleting(false);
    }
  };

  const isConfirmationValid = confirmText === "USUŃ KONTO";

  return (
    <>
      {/* Przycisk otwierający modal */}
      <Button variant="destructive" onClick={openModal} className="w-full" type="button">
        <AlertTriangle className="mr-2 h-4 w-4" />
        Usuń konto
      </Button>

      {/* Modal potwierdzenia */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => {
            // Zamknij tylko jeśli kliknięto na overlay (nie na dialog)
            if (e.target === e.currentTarget) {
              closeModal();
            }
          }}
          onKeyDown={(e) => e.key === "Escape" && closeModal()}
          role="presentation"
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 max-w-md w-full"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-account-title"
          >
            {/* Nagłówek */}
            <div className="flex items-start space-x-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h2 id="delete-account-title" className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  Usuń konto
                </h2>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                  Ta operacja jest nieodwracalna. Wszystkie Twoje fiszki oraz dane zostaną trwale usunięte.
                </p>
              </div>
            </div>

            {/* Wyświetlanie błędów */}
            {error && (
              <div
                role="alert"
                className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md dark:bg-red-900/20 dark:border-red-800"
              >
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Formularz potwierdzenia */}
            <div className="space-y-4">
              {/* Pole tekstowe potwierdzenia */}
              <div className="space-y-2">
                <Label htmlFor="confirmText">
                  Wpisz <strong>USUŃ KONTO</strong> aby potwierdzić
                </Label>
                <Input
                  id="confirmText"
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  disabled={isDeleting}
                  placeholder="USUŃ KONTO"
                  className="w-full font-mono"
                />
              </div>
            </div>

            {/* Przyciski akcji */}
            <div className="flex space-x-3 mt-6">
              <Button variant="outline" onClick={closeModal} disabled={isDeleting} className="flex-1" type="button">
                Anuluj
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting || !isConfirmationValid}
                className="flex-1"
                type="button"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Usuwanie...
                  </>
                ) : (
                  "Usuń konto"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
