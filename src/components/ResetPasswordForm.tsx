import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface ResetPasswordFormProps {
  token: string; // Token z URL przekazany z Astro
}

/**
 * ResetPasswordForm Component
 *
 * Formularz do ustawiania nowego hasła. Przyjmuje token resetowania z URL
 * i pozwala użytkownikowi ustawić nowe hasło. W przyszłości wywoła API Supabase.
 */
export default function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  // Stan formularza
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
   * TODO: Zintegrować z Supabase Auth API (authClient.auth.updateUser)
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
      // TODO: Backend integration
      // const { data, error: updateError } = await authClient.auth.updateUser({
      //   password: password
      // });
      //
      // if (updateError) {
      //   if (updateError.message.includes('token') || updateError.message.includes('expired')) {
      //     setError("Link resetowania hasła wygasł. Wygeneruj nowy");
      //   } else {
      //     setError("Wystąpił błąd. Spróbuj ponownie");
      //   }
      //   setIsLoading(false);
      //   return;
      // }
      //
      // // Sukces - wyświetl alert i przekieruj do logowania
      // alert("Hasło zostało zmienione. Możesz się teraz zalogować");
      // window.location.href = "/login";

      // Placeholder - symulacja opóźnienia
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log("Password reset for token:", token);
      setIsLoading(false);
      alert("Backend nie jest jeszcze zaimplementowany. Token: " + token);
    } catch (err) {
      // Obsługa nieoczekiwanych błędów
      setError("Wystąpił błąd. Spróbuj ponownie");
      setIsLoading(false);
    }
  };

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
