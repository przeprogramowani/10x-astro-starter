import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { authClient } from "@/db/auth.client";

interface ChangePasswordFormProps {
  userEmail: string;
}

/**
 * ChangePasswordForm Component
 *
 * Formularz do zmiany hasła dla zalogowanego użytkownika.
 * Wymaga wpisania obecnego hasła, nowego hasła i potwierdzenia.
 * Weryfikuje obecne hasło przez re-autentykację i aktualizuje hasło przez Supabase Auth API.
 */
export default function ChangePasswordForm({ userEmail }: ChangePasswordFormProps) {
  // Stan formularza
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  /**
   * Walidacja haseł
   */
  const validatePasswords = (): boolean => {
    if (!currentPassword) {
      setError("Wpisz obecne hasło");
      return false;
    }

    if (newPassword.length < 6) {
      setError("Nowe hasło musi mieć co najmniej 6 znaków");
      return false;
    }

    if (newPassword !== confirmPassword) {
      setError("Nowe hasła nie są identyczne");
      return false;
    }

    if (currentPassword === newPassword) {
      setError("Nowe hasło musi być inne niż obecne");
      return false;
    }

    return true;
  };

  /**
   * Obsługa submitu formularza
   * 1. Weryfikacja obecnego hasła przez re-autentykację
   * 2. Aktualizacja hasła przez Supabase Auth API
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Wyczyść poprzednie komunikaty
    setError(null);
    setSuccess(false);

    // Walidacja po stronie klienta
    if (!validatePasswords()) {
      return;
    }

    // Rozpocznij ładowanie
    setIsLoading(true);

    try {
      // Krok 1: Weryfikacja obecnego hasła (re-authentication)
      const { error: verifyError } = await authClient.auth.signInWithPassword({
        email: userEmail,
        password: currentPassword
      });

      if (verifyError) {
        console.error("Current password verification error:", verifyError);
        setError("Nieprawidłowe obecne hasło");
        setIsLoading(false);
        return;
      }

      // Krok 2: Aktualizacja hasła
      const { error: updateError } = await authClient.auth.updateUser({
        password: newPassword
      });

      if (updateError) {
        console.error("Password update error:", updateError);
        setError("Wystąpił błąd podczas zmiany hasła. Spróbuj ponownie");
        setIsLoading(false);
        return;
      }

      // Sukces
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setIsLoading(false);
    } catch (err) {
      // Obsługa nieoczekiwanych błędów
      console.error("Unexpected error:", err);
      setError("Wystąpił błąd. Spróbuj ponownie");
      setIsLoading(false);
    }
  };

  // Sprawdzenie czy formularz jest prawidłowy
  const isFormValid =
    currentPassword !== "" && newPassword !== "" && confirmPassword !== "" && newPassword === confirmPassword;
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
          <p className="text-sm text-green-600 dark:text-green-400">Hasło zostało zmienione pomyślnie</p>
        </div>
      )}

      {/* Pole obecnego hasła */}
      <div className="space-y-2">
        <Label htmlFor="currentPassword">Obecne hasło</Label>
        <Input
          id="currentPassword"
          name="currentPassword"
          type="password"
          required
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          disabled={isLoading}
          autoComplete="current-password"
          placeholder="Wpisz obecne hasło"
          className="w-full"
        />
      </div>

      {/* Pole nowego hasła */}
      <div className="space-y-2">
        <Label htmlFor="newPassword">Nowe hasło</Label>
        <Input
          id="newPassword"
          name="newPassword"
          type="password"
          required
          minLength={6}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          disabled={isLoading}
          autoComplete="new-password"
          placeholder="Minimum 6 znaków"
          className="w-full"
        />
      </div>

      {/* Pole potwierdzenia nowego hasła */}
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Potwierdź nowe hasło</Label>
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
          placeholder="Wpisz nowe hasło ponownie"
          className="w-full"
        />
      </div>

      {/* Przycisk submit */}
      <Button type="submit" disabled={isButtonDisabled} className="w-full">
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Zmienianie hasła...
          </>
        ) : (
          "Zmień hasło"
        )}
      </Button>
    </form>
  );
}
