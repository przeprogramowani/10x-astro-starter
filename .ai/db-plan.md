# Schemat bazy danych (PostgreSQL/Supabase)

## 1. Lista tabel z ich kolumnami, typami danych i ograniczeniami

### 1.1 `users`

This table is managed by Supabase Auth.

- `id` UUID, PK, FK → `auth.users(id)` ON DELETE CASCADE
- `email` VARCHAR(255) NOT NULL UNIQUE
- `encrypted_password` VARCHAR NOT NULL
- `created_at` TIMESTAMPTZ, NOT NULL, `DEFAULT now()`
- `confirmed_at` TIMESTAMPTZ

### 1.2 `cards`

- `id` UUID, PK, `DEFAULT gen_random_uuid()`
- `user_id` UUID, NOT NULL, FK → `users(id)` ON DELETE CASCADE
- `front` TEXT, NOT NULL, `CHECK (char_length(front) BETWEEN 1 AND 200)`
- `back` TEXT, NOT NULL, `CHECK (char_length(back) BETWEEN 1 AND 500)`
- `repetitions` INTEGER, NOT NULL, `DEFAULT 0`, `CHECK (repetitions >= 0)`
- `source` TEXT, NOT NULL, `DEFAULT 'manual'`, `CHECK (source IN ('manual', 'ai'))`
- `created_at` TIMESTAMPTZ, NOT NULL, `DEFAULT now()`
- `updated_at` TIMESTAMPTZ, NOT NULL, `DEFAULT now()`

### 1.3 `generation_requests`

- `id` UUID, PK, `DEFAULT gen_random_uuid()`
- `user_id` UUID, NOT NULL, FK → `users(id)` ON DELETE CASCADE
- `input_text` TEXT, NULL, `CHECK (input_text IS NULL OR char_length(input_text) BETWEEN 1000 AND 10000)`
- `generated_count` INTEGER, NOT NULL, `DEFAULT 0`, `CHECK (generated_count >= 0)`
- `created_at` TIMESTAMPTZ, NOT NULL, `DEFAULT now()`
- `updated_at` TIMESTAMPTZ, NOT NULL, `DEFAULT now()`

### 1.4 `events`

- `id` UUID, PK, `DEFAULT gen_random_uuid()`
- `user_id` UUID, NOT NULL, FK → `users(id)` ON DELETE CASCADE
- `card_id` UUID, NULL, FK → `cards(id)` ON DELETE SET NULL
- `event_type` TEXT, NOT NULL, `CHECK (event_type IN ('login', 'ai_generation', 'card_accepted', 'card_rejected', 'card_edited', 'card_deleted', 'card_created_manual'))`
- `metadata` JSONB, NULL
- `created_at` TIMESTAMPTZ, NOT NULL, `DEFAULT now()`
- `updated_at` TIMESTAMPTZ, NOT NULL, `DEFAULT now()`

### 1.5 Funkcje i triggery

- `set_updated_at()` ustawiająca `updated_at = now()` dla tabel: `users`, `cards`, `generation_requests`, `events`
- Triggery `BEFORE UPDATE` wywołujące `set_updated_at()` dla powyższych tabel

## 2. Relacje między tabelami

- `auth.users (1) → (1) users` przez `users.id`
- `users (1) → (N) cards` przez `cards.user_id`
- `users (1) → (N) generation_requests` przez `generation_requests.user_id`
- `users (1) → (N) events` przez `events.user_id`
- `cards (1) → (N) events` przez `events.card_id` (opcjonalne powiązanie)

## 3. Indeksy

- `cards(user_id)`
- `generation_requests(user_id)`
- `events(user_id)`

## 4. Zasady PostgreSQL (jeśli dotyczy)

- RLS: wyłączone w MVP zgodnie z notatkami z sesji.
- Rekomendacja na etap produkcyjny: włączyć RLS i dodać polityki `USING (user_id = auth.uid())` oraz `WITH CHECK (user_id = auth.uid())` dla tabel `cards`, `generation_requests`, `events`.
