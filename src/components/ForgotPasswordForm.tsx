import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { authClient } from "@/db/auth.client";

/**
 * ForgotPasswordForm Component
 *
 * Formularz do odzyskiwania hasła. Przyjmuje email użytkownika i wysyła
 * link resetujący hasło przez Supabase Auth API.
 */
export default function ForgotPasswordForm() {
  // Stan formularza
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  /**
   * Obsługa submitu formularza
   * Wysyła email z linkiem resetującym hasło
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Wyczyść poprzednie błędy i komunikaty sukcesu
    setError(null);
    setSuccess(false);

    // Walidacja po stronie klienta
    if (!email) {
      setError("Wpisz adres email");
      return;
    }

    // Rozpocznij ładowanie
    setIsLoading(true);

    try {
      // Wysłanie emaila z linkiem resetującym
      const { error: resetError } = await authClient.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (resetError) {
        console.error("Password reset error:", resetError);
        setError("Nie udało się wysłać emaila. Spróbuj ponownie");
        setIsLoading(false);
        return;
      }

      // Sukces - zawsze wyświetl komunikat (security best practice)
      // Nie ujawniamy czy konto istnieje
      setSuccess(true);
      setIsLoading(false);
    } catch (err) {
      // Obsługa nieoczekiwanych błędów
      console.error("Unexpected error:", err);
      setError("Wystąpił błąd. Spróbuj ponownie");
      setIsLoading(false);
    }
  };

  // Sprawdzenie czy formularz jest prawidłowy
  const isFormValid = email !== "";
  const isButtonDisabled = isLoading || !isFormValid;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Wyświetlanie błędów */}
      {error && (
        <div
          role="alert"
          className="p-3 bg-red-50 border border-red-200 rounded-md dark:bg-red-900/20 dark:border-red-800"
        >
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Wyświetlanie komunikatu sukcesu */}
      {success && (
        <div
          role="alert"
          className="p-3 bg-green-50 border border-green-200 rounded-md dark:bg-green-900/20 dark:border-green-800"
        >
          <p className="text-sm text-green-600 dark:text-green-400">
            Jeśli konto z tym adresem email istnieje, wysłaliśmy link do resetowania hasła. Sprawdź swoją skrzynkę
            pocztową.
          </p>
        </div>
      )}

      {/* Pole email */}
      <div className="space-y-2">
        <Label htmlFor="email">Adres e-mail</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
          autoComplete="email"
          placeholder="twoj@email.com"
          className="w-full"
        />
        <p className="text-xs text-slate-500 dark:text-slate-400">Podaj adres email powiązany z Twoim kontem</p>
      </div>

      {/* Przycisk submit */}
      <Button type="submit" disabled={isButtonDisabled} className="w-full">
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Wysyłanie...
          </>
        ) : (
          "Wyślij link resetujący"
        )}
      </Button>

      {/* Link powrotu do logowania */}
      <p className="text-center text-sm text-slate-600 dark:text-slate-400">
        Pamiętasz hasło?{" "}
        <a href="/login" className="font-medium text-primary hover:underline">
          Wróć do logowania
        </a>
      </p>
    </form>
  );
}
