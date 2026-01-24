import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { authClient } from "../db/auth.client";
import type { AuthError } from "@supabase/supabase-js";

/**
 * RegisterForm Component
 *
 * Główny interaktywny formularz rejestracji. Zarządza stanem formularza,
 * walidacją, wywołaniem API rejestracji i obsługą błędów.
 * Po pomyślnej rejestracji automatycznie loguje użytkownika i przekierowuje do /generate.
 */
export default function RegisterForm() {
  // Stan formularza
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Mapowanie błędów Supabase na user-friendly messages
   */
  const mapSupabaseError = (error: AuthError): string => {
    const message = error.message.toLowerCase();

    if (message.includes("already registered") || message.includes("already exists") || message.includes("duplicate")) {
      return "Ten adres email jest już zajęty";
    }

    if (message.includes("password") && (message.includes("6") || message.includes("short"))) {
      return "Hasło musi mieć co najmniej 6 znaków";
    }

    if (message.includes("invalid email") || message.includes("email format")) {
      return "Wprowadź prawidłowy adres email";
    }

    if (message.includes("network") || message.includes("connection")) {
      return "Brak połączenia z internetem. Sprawdź połączenie i spróbuj ponownie";
    }

    // Fallback dla nieznanych błędów
    return "Wystąpił błąd. Spróbuj ponownie";
  };

  /**
   * Obsługa submitu formularza
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Wyczyść poprzednie błędy
    setError(null);

    // Walidacja po stronie klienta
    if (password.length < 6) {
      setError("Hasło musi mieć co najmniej 6 znaków");
      return;
    }

    // Rozpocznij ładowanie
    setIsLoading(true);

    try {
      // Wywołanie Supabase Auth API
      const { data, error: signUpError } = await authClient.auth.signUp({
        email,
        password,
      });

      // Obsługa błędu
      if (signUpError) {
        setError(mapSupabaseError(signUpError));
        setIsLoading(false);
        return;
      }

      // Obsługa przypadku gdy wymagana jest weryfikacja email
      if (data.user && !data.session) {
        alert("Konto zostało utworzone. Sprawdź email i potwierdź adres.");
        setIsLoading(false);
        return;
      }

      // Sukces - użytkownik jest automatycznie zalogowany
      // Przekierowanie do /generate
      window.location.href = "/generate";
    } catch (err) {
      // Obsługa nieoczekiwanych błędów (sieć, itp.)
      setError("Wystąpił błąd. Spróbuj ponownie");
      setIsLoading(false);
    }
  };

  // Sprawdzenie czy formularz jest prawidłowy
  const isFormValid = email !== "" && password !== "" && password.length >= 6;
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
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
          autoComplete="new-password"
          placeholder="Minimum 6 znaków"
          className="w-full"
        />
      </div>

      {/* Przycisk submit */}
      <Button type="submit" disabled={isButtonDisabled} className="w-full">
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Rejestrowanie...
          </>
        ) : (
          "Zarejestruj się"
        )}
      </Button>

      {/* Link do logowania */}
      <p className="text-center text-sm text-slate-600 dark:text-slate-400">
        Masz już konto?{" "}
        <a href="/login" className="font-medium text-primary hover:underline">
          Zaloguj się
        </a>
      </p>
    </form>
  );
}
