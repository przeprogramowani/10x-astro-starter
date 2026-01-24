/**
 * Error mapping utilities for user-friendly error messages
 */

/**
 * Maps Supabase authentication errors to Polish user-friendly messages
 * 
 * @param error - Error object from Supabase with a message property
 * @returns User-friendly error message in Polish
 * 
 * @example
 * ```ts
 * const error = { message: 'Invalid login credentials' };
 * mapSupabaseError(error); // "Nieprawidłowy email lub hasło"
 * ```
 */
export const mapSupabaseError = (error: { message: string }): string => {
  const errorMessage = error.message.toLowerCase();

  // Invalid credentials
  if (errorMessage.includes("invalid login credentials")) {
    return "Nieprawidłowy email lub hasło";
  }

  // Email not confirmed
  if (errorMessage.includes("email not confirmed")) {
    return "Potwierdź swój adres email przed zalogowaniem";
  }

  // Network/connection errors
  if (errorMessage.includes("network") || errorMessage.includes("connection")) {
    return "Brak połączenia z internetem";
  }

  // User already registered
  if (errorMessage.includes("user already registered")) {
    return "Użytkownik z tym adresem email już istnieje";
  }

  // Invalid email format
  if (errorMessage.includes("invalid email")) {
    return "Nieprawidłowy format adresu email";
  }

  // Password too weak
  if (errorMessage.includes("password") && errorMessage.includes("weak")) {
    return "Hasło jest zbyt słabe";
  }

  // Rate limit exceeded
  if (errorMessage.includes("rate limit")) {
    return "Zbyt wiele prób. Spróbuj ponownie za chwilę";
  }

  // Session expired
  if (errorMessage.includes("session") && errorMessage.includes("expired")) {
    return "Sesja wygasła. Zaloguj się ponownie";
  }

  // Default fallback
  return "Wystąpił błąd. Spróbuj ponownie";
};

/**
 * Validates email format using a simple regex pattern
 * 
 * @param email - Email address to validate
 * @returns true if email format is valid, false otherwise
 * 
 * @example
 * ```ts
 * isValidEmail('test@example.com'); // true
 * isValidEmail('invalid-email'); // false
 * ```
 */
export const isValidEmail = (email: string): boolean => {
  if (!email || typeof email !== "string") {
    return false;
  }

  // Basic email regex pattern
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

/**
 * Validates password strength
 * 
 * Requirements:
 * - Minimum 8 characters
 * - At least one letter
 * - At least one number
 * 
 * @param password - Password to validate
 * @returns Object with isValid flag and optional error message
 * 
 * @example
 * ```ts
 * validatePassword('Test123'); // { isValid: true }
 * validatePassword('weak'); // { isValid: false, error: 'Hasło musi mieć...' }
 * ```
 */
export const validatePassword = (
  password: string
): { isValid: boolean; error?: string } => {
  if (!password || typeof password !== "string") {
    return { isValid: false, error: "Hasło jest wymagane" };
  }

  // Minimum length check
  if (password.length < 8) {
    return {
      isValid: false,
      error: "Hasło musi mieć co najmniej 8 znaków",
    };
  }

  // Must contain at least one letter
  if (!/[a-zA-Z]/.test(password)) {
    return {
      isValid: false,
      error: "Hasło musi zawierać co najmniej jedną literę",
    };
  }

  // Must contain at least one number
  if (!/\d/.test(password)) {
    return {
      isValid: false,
      error: "Hasło musi zawierać co najmniej jedną cyfrę",
    };
  }

  return { isValid: true };
};
