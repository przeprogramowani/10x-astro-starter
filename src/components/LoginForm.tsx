import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { mapSupabaseError } from "@/lib/errors";

/**
 * LoginForm Component
 *
 * Interaktywny formularz logowania. Zarządza stanem formularza, walidacją,
 * i obsługą błędów. W przyszłości wywoła API Supabase do logowania.
 * Po pomyślnym zalogowaniu przekierowuje użytkownika do /generate.
 */
export default function LoginForm() {
  // Stan formularza
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Obsługa submitu formularza
   * Integracja z Supabase Auth API
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Wyczyść poprzednie błędy
    setError(null);

    // Walidacja po stronie klienta
    if (!email || !password) {
      setError("Wypełnij wszystkie pola");
      return;
    }

    // Rozpocznij ładowanie
    setIsLoading(true);

    try {
      // Importuj dynamicznie authClient (tylko w przeglądarce)
      const { authClient } = await import("@/db/auth.client");

      // Wywołanie Supabase Auth API
      const { data, error: signInError } = await authClient.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(mapSupabaseError(signInError));
        setIsLoading(false);
        return;
      }

      // Sukces - przekierowanie do /generate (client-side)
      if (data.user) {
        window.location.href = "/generate";
      }
    } catch (err) {
      // Obsługa nieoczekiwanych błędów
      console.error("Login error:", err);
      setError("Wystąpił błąd. Spróbuj ponownie");
      setIsLoading(false);
    }
  };

  // Sprawdzenie czy formularz jest prawidłowy
  const isFormValid = email !== "" && password !== "";
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
      </div>

      {/* Pole hasło */}
      <div className="space-y-2">
        <Label htmlFor="password">Hasło</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
          autoComplete="current-password"
          placeholder="Twoje hasło"
          className="w-full"
        />
      </div>

      {/* Link do resetowania hasła */}
      <div className="text-right">
        <a href="/forgot-password" className="text-sm text-primary hover:underline">
          Zapomniałeś hasła?
        </a>
      </div>

      {/* Przycisk submit */}
      <Button type="submit" disabled={isButtonDisabled} className="w-full">
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Logowanie...
          </>
        ) : (
          "Zaloguj się"
        )}
      </Button>

      {/* Link do rejestracji */}
      <p className="text-center text-sm text-slate-600 dark:text-slate-400">
        Nie masz konta?{" "}
        <a href="/register" className="font-medium text-primary hover:underline">
          Zarejestruj się
        </a>
      </p>
    </form>
  );
}
