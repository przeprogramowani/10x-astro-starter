import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { authClient } from "@/db/auth.client";

/**
 * ResetPasswordForm Component
 *
 * Formularz do ustawiania nowego hasła. Supabase automatycznie obsługuje
 * token z URL (fragment #access_token) i loguje użytkownika.
 * Ten komponent pozwala użytkownikowi ustawić nowe hasło.
 */
export default function ResetPasswordForm() {
  // Stan formularza
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(true);

  /**
   * Weryfikacja sesji przy montowaniu komponentu
   * Sprawdza czy użytkownik został zalogowany (token był ważny)
   */
  useEffect(() => {
    const verifySession = async () => {
      try {
        const { data: { session }, error: sessionError } = await authClient.auth.getSession();
        
        if (sessionError || !session) {
          // Brak sesji - token był nieważny lub wygasł
          window.location.href = "/forgot-password?error=" + encodeURIComponent("Link wygasł lub jest nieważny");
          return;
        }
        
        // Sesja jest ważna, można zmienić hasło
        setIsVerifying(false);
      } catch (err) {
        console.error("Session verification error:", err);
        window.location.href = "/forgot-password";
      }
    };

    verifySession();
  }, []);

  /**
   * Walidacja haseł
   */
  const validatePasswords = (): boolean => {
    if (password.length < 6) {
      setError("Hasło musi mieć co najmniej 6 znaków");
      return false;
    }

    if (password !== confirmPassword) {
      setError("Hasła nie są identyczne");
      return false;
    }

    return true;
  };

  /**
   * Obsługa submitu formularza
   * Aktualizuje hasło użytkownika przez Supabase Auth API
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Wyczyść poprzednie błędy
    setError(null);

    // Walidacja po stronie klienta
    if (!validatePasswords()) {
      return;
    }

    // Rozpocznij ładowanie
    setIsLoading(true);

    try {
      // Aktualizacja hasła
      const { error: updateError } = await authClient.auth.updateUser({
        password: password
      });

      if (updateError) {
        console.error("Password update error:", updateError);
        
        if (updateError.message.includes('token') || updateError.message.includes('expired')) {
          setError("Sesja wygasła. Wygeneruj nowy link resetujący");
          setIsLoading(false);
          return;
        }
        
        setError("Wystąpił błąd podczas zmiany hasła. Spróbuj ponownie");
        setIsLoading(false);
        return;
      }

      // Sukces - przekieruj do logowania z komunikatem
      window.location.href = "/login?message=" + encodeURIComponent("Hasło zostało zmienione. Zaloguj się");
    } catch (err) {
      // Obsługa nieoczekiwanych błędów
      console.error("Unexpected error:", err);
      setError("Wystąpił błąd. Spróbuj ponownie");
      setIsLoading(false);
    }
  };

  // Wyświetl loader podczas weryfikacji sesji
  if (isVerifying) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-3 text-sm text-slate-600 dark:text-slate-400">Weryfikacja linku...</p>
      </div>
    );
  }

  // Sprawdzenie czy formularz jest prawidłowy
  const isFormValid = password !== "" && confirmPassword !== "" && password === confirmPassword;
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

      {/* Pole nowego hasła */}
      <div className="space-y-2">
        <Label htmlFor="password">Nowe hasło</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
          autoComplete="new-password"
          placeholder="Minimum 6 znaków"
          className="w-full"
        />
      </div>

      {/* Pole potwierdzenia hasła */}
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Potwierdź hasło</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          minLength={6}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={isLoading}
          autoComplete="new-password"
          placeholder="Wpisz hasło ponownie"
          className="w-full"
        />
      </div>

      {/* Przycisk submit */}
      <Button type="submit" disabled={isButtonDisabled} className="w-full">
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Ustawianie hasła...
          </>
        ) : (
          "Zmień hasło"
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
