import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, User, Settings, LogOut, ChevronDown } from "lucide-react";

interface UserMenuProps {
  userEmail: string;
}

/**
 * UserMenu Component
 *
 * Menu użytkownika wyświetlane w nawigacji dla zalogowanych użytkowników.
 * Zawiera email użytkownika, link do profilu i przycisk wylogowania.
 * Wykorzystuje Supabase Auth API do zarządzania sesją użytkownika.
 */
export default function UserMenu({ userEmail }: UserMenuProps) {
  // Stan menu
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  /**
   * Obsługa wylogowania
   * Wywołuje Supabase Auth API do zakończenia sesji użytkownika
   */
  const handleSignOut = async () => {
    setIsLoggingOut(true);

    try {
      // Dynamiczny import auth client (tylko w przeglądarce)
      const { authClient } = await import("@/db/auth.client");

      const { error } = await authClient.auth.signOut();

      if (error) {
        console.error("Sign out error:", error);
        alert("Wystąpił błąd podczas wylogowywania. Spróbuj ponownie.");
        setIsLoggingOut(false);
        return;
      }

      // Sukces - przekierowanie do strony głównej
      // Używamy window.location.href aby wymusić pełne przeładowanie strony
      // i odświeżenie stanu sesji przez middleware
      window.location.href = "/";
    } catch (err) {
      console.error("Sign out error:", err);
      alert("Wystąpił nieoczekiwany błąd. Spróbuj ponownie.");
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="relative">
      {/* Przycisk otwierający menu */}
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoggingOut}
        className="flex items-center space-x-2"
        type="button"
      >
        <User className="h-4 w-4" />
        <span className="hidden sm:inline">{userEmail}</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </Button>

      {/* Dropdown menu */}
      {isOpen && (
        <>
          {/* Overlay do zamykania menu */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          {/* Menu content */}
          <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-50">
            {/* Email użytkownika */}
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Zalogowany jako</p>
              <p className="text-sm text-slate-600 dark:text-slate-400 truncate">{userEmail}</p>
            </div>

            {/* Opcje menu */}
            <div className="py-2">
              {/* Link do profilu/ustawień */}
              <a
                href="/profile"
                className="flex items-center px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <Settings className="mr-3 h-4 w-4" />
                Ustawienia
              </a>

              {/* Przycisk wylogowania */}
              <button
                onClick={handleSignOut}
                disabled={isLoggingOut}
                className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                type="button"
              >
                {isLoggingOut ? (
                  <>
                    <Loader2 className="mr-3 h-4 w-4 animate-spin" />
                    Wylogowywanie...
                  </>
                ) : (
                  <>
                    <LogOut className="mr-3 h-4 w-4" />
                    Wyloguj się
                  </>
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
