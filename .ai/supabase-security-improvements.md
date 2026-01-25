# Supabase Security Improvements - User Account Deletion

## Problem

Funkcja `deleteUserAccount()` używała admin client z service role key bezpośrednio, bez weryfikacji tożsamości użytkownika. To stwarzało potencjalne ryzyko bezpieczeństwa:

```typescript
// PRZED - Niebezpieczne
export async function deleteUserAccount(userId: string): Promise<void> {
  const adminClient = createSupabaseAdminClient();
  const { error } = await adminClient.auth.admin.deleteUser(userId);
  // Brak weryfikacji czy użytkownik usuwa swoje własne konto!
}
```

**Ryzyko**: Gdyby ktoś ominął middleware lub znalazł sposób na wywołanie tej funkcji z innym `userId`, mógłby usunąć konto innego użytkownika.

## Rozwiązanie

Dodano weryfikację tożsamości użytkownika przed użyciem admin client:

```typescript
// PO - Bezpieczne
export async function deleteUserAccount(
  userId: string,
  supabase: SupabaseClient<Database>
): Promise<void> {
  // Krok 1: Weryfikacja tożsamości
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    throw new Error("Authentication verification failed");
  }

  // Krok 2: Sprawdzenie czy użytkownik usuwa swoje konto
  if (user.id !== userId) {
    throw new Error("Cannot delete another user's account");
  }

  // Krok 3: Dopiero teraz użyj admin client
  const adminClient = createSupabaseAdminClient();
  const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);
  
  if (deleteError) {
    throw new Error(`Failed to delete user account: ${deleteError.message}`);
  }
}
```

## Zmiany w kodzie

### 1. `src/lib/services/user.service.ts`
- Dodano parametr `supabase: SupabaseClient<Database>` do funkcji
- Dodano weryfikację tożsamości przed użyciem admin client
- Dodano sprawdzenie czy `authenticated user.id === target userId`
- Dodano odpowiednie logi błędów

### 2. `src/pages/api/users/me.ts`
- Przekazywanie `locals.supabase` do `deleteUserAccount()`
- Klient zawiera sesję zalogowanego użytkownika

### 3. `src/lib/services/user.service.test.ts`
- Zaktualizowano wszystkie 29 testów
- Dodano 5 nowych testów bezpieczeństwa:
  - Weryfikacja tożsamości użytkownika
  - Próba usunięcia konta innego użytkownika
  - Błąd autentykacji
  - Brak użytkownika w odpowiedzi
  - Logowanie prób naruszenia bezpieczeństwa

## Dlaczego admin client jest nadal potrzebny?

Supabase Auth API nie pozwala zwykłym użytkownikom na usunięcie samych siebie. Metoda `auth.signOut()` tylko wylogowuje, ale nie usuwa konta. Aby faktycznie usunąć konto z Auth, potrzebny jest `auth.admin.deleteUser()`, który wymaga service role key.

**Rozwiązanie**: 
1. Używamy authenticated client do weryfikacji tożsamości (RLS)
2. Używamy admin client tylko do operacji Auth (bypass RLS)
3. Zapewniamy, że użytkownik może usunąć tylko swoje konto

## Flow bezpieczeństwa

```
DELETE /api/users/me
  ↓
Middleware weryfikuje sesję
  ↓
API Route: locals.supabase (authenticated client)
  ↓
deleteUserAccount(userId, locals.supabase)
  ↓
1. supabase.auth.getUser() - weryfikacja tożsamości
  ↓
2. Sprawdzenie: user.id === userId?
  ↓
3. Jeśli TAK: createSupabaseAdminClient()
  ↓
4. adminClient.auth.admin.deleteUser(userId)
  ↓
5. Sukces: konto usunięte
```

## Testy

Wszystkie 29 testów przechodzą:
- ✅ Successful deletion (6 testów)
- ✅ Security and validation (5 testów - NOWE!)
- ✅ Error handling (5 testów)
- ✅ Edge cases (4 testy)
- ✅ Admin client usage (3 testy)
- ✅ Cascading deletes (2 testy)
- ✅ Return value (2 testy)

## Best Practices

### ✅ DO:
- Zawsze weryfikuj tożsamość użytkownika przed operacjami admin
- Używaj authenticated client do weryfikacji
- Używaj admin client tylko dla operacji wymagających elevated privileges
- Loguj próby naruszenia bezpieczeństwa

### ❌ DON'T:
- Nie używaj admin client bez weryfikacji tożsamości
- Nie ufaj `userId` z parametrów bez weryfikacji
- Nie pomijaj warstwy bezpieczeństwa "dla wygody"

## Wpływ na bezpieczeństwo

| Aspekt | Przed | Po |
|--------|-------|-----|
| Weryfikacja tożsamości | ❌ Brak | ✅ Tak |
| Możliwość usunięcia konta innego użytkownika | ⚠️ Teoretycznie możliwe | ✅ Niemożliwe |
| Logowanie prób naruszenia | ❌ Brak | ✅ Tak |
| Zgodność z zasadą least privilege | ❌ Nie | ✅ Tak |
| Defense in depth | ❌ Jedna warstwa (middleware) | ✅ Dwie warstwy (middleware + funkcja) |

## Podsumowanie

Zmiana poprawia bezpieczeństwo aplikacji poprzez:
1. **Weryfikację tożsamości** - użytkownik musi być zalogowany
2. **Autoryzację** - użytkownik może usunąć tylko swoje konto
3. **Defense in depth** - dodatkowa warstwa bezpieczeństwa poza middleware
4. **Audyt** - logowanie prób naruszenia bezpieczeństwa
5. **Least privilege** - admin client używany tylko tam gdzie konieczny

Wszystkie testy przechodzą, kod jest czytelny i dobrze udokumentowany.
