import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, AlertTriangle } from "lucide-react";

/**
 * DeleteAccountButton Component
 *
 * Przycisk do usuwania konta użytkownika z modalem potwierdzenia.
 * Wymaga wpisania tekstu potwierdzającego "USUŃ KONTO" i hasła.
 * W przyszłości wywoła endpoint API DELETE /api/users/me.
 *
 * WYMAGANE zgodnie z RODO (prawo do usunięcia danych osobowych).
 */
export default function DeleteAccountButton() {
  // Stan modala
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [password, setPassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Otwórz modal
   */
  const openModal = () => {
    setIsModalOpen(true);
    setError(null);
    setConfirmText("");
    setPassword("");
  };

  /**
   * Zamknij modal
   */
  const closeModal = () => {
    if (!isDeleting) {
      setIsModalOpen(false);
      setError(null);
      setConfirmText("");
      setPassword("");
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

    if (!password) {
      setError("Wpisz hasło aby potwierdzić usunięcie konta");
      return false;
    }

    return true;
  };

  /**
   * Obsługa usuwania konta
   * TODO: Zintegrować z API endpoint DELETE /api/users/me
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
      // TODO: Backend integration
      // const response = await fetch('/api/users/me', {
      //   method: 'DELETE',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ password })
      // });
      //
      // if (!response.ok) {
      //   const data = await response.json();
      //   if (data.error === 'Invalid password') {
      //     setError("Nieprawidłowe hasło");
      //   } else {
      //     setError("Nie udało się usunąć konta. Spróbuj ponownie");
      //   }
      //   setIsDeleting(false);
      //   return;
      // }
      //
      // // Sukces - wylogowanie i przekierowanie
      // alert("Konto zostało usunięte");
      // window.location.href = "/";

      // Placeholder - symulacja opóźnienia
      await new Promise((resolve) => setTimeout(resolve, 1500));
      console.log("Account deletion attempt");
      setIsDeleting(false);
      alert("Backend nie jest jeszcze zaimplementowany. Konto nie zostało usunięte.");
      closeModal();
    } catch (err) {
      // Obsługa nieoczekiwanych błędów
      setError("Brak połączenia z internetem");
      setIsDeleting(false);
    }
  };

  const isConfirmationValid = confirmText === "USUŃ KONTO" && password !== "";

  return (
    <>
      {/* Przycisk otwierający modal */}
      <Button variant="destructive" onClick={openModal} className="w-full" type="button">
        <AlertTriangle className="mr-2 h-4 w-4" />
        Usuń konto
      </Button>

      {/* Modal potwierdzenia */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={closeModal}>
          <div
            className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Nagłówek */}
            <div className="flex items-start space-x-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Usuń konto</h2>
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

              {/* Pole hasła */}
              <div className="space-y-2">
                <Label htmlFor="password">Twoje hasło</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isDeleting}
                  autoComplete="current-password"
                  placeholder="Wpisz hasło"
                  className="w-full"
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
