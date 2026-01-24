-- ============================================================================
-- Migration: Initial schema for 10x-cards application
-- Created: 2026-01-22 14:00:00 UTC
-- Description: Creates the core database schema including:
--              - cards: user flashcards with spaced repetition data
--              - generation_requests: AI generation history
--              - events: user activity tracking
--              - Indexes, triggers, and RLS policies
-- ============================================================================

-- ============================================================================
-- 1. TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Table: cards
-- Purpose: Stores user flashcards with front/back content and repetition data
-- RLS: Enabled - users can only access their own cards
-- ----------------------------------------------------------------------------
create table cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  front text not null check (char_length(front) between 1 and 200),
  back text not null check (char_length(back) between 1 and 500),
  repetitions integer not null default 0 check (repetitions >= 0),
  source text not null default 'manual' check (source in ('manual', 'ai')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table cards is 'User flashcards with spaced repetition metadata';
comment on column cards.front is 'Front side of the card (question/prompt), max 200 characters';
comment on column cards.back is 'Back side of the card (answer), max 500 characters';
comment on column cards.repetitions is 'Number of times card has been reviewed';
comment on column cards.source is 'Origin of the card: manual (user-created) or ai (AI-generated)';

-- ----------------------------------------------------------------------------
-- Table: generation_requests
-- Purpose: Tracks AI card generation requests and their outcomes
-- RLS: Enabled - users can only access their own generation requests
-- ----------------------------------------------------------------------------
create table generation_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  input_text text null check (input_text is null or char_length(input_text) between 1000 and 10000),
  generated_count integer not null default 0 check (generated_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table generation_requests is 'AI card generation requests history';
comment on column generation_requests.input_text is 'Input text for AI generation, between 1000-10000 characters';
comment on column generation_requests.generated_count is 'Number of cards successfully generated from this request';

-- ----------------------------------------------------------------------------
-- Table: events
-- Purpose: Audit log for user actions and system events
-- RLS: Enabled - users can only access their own events
-- ----------------------------------------------------------------------------
create table events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  card_id uuid null references cards(id) on delete set null,
  event_type text not null check (event_type in (
    'login',
    'ai_generation',
    'card_accepted',
    'card_rejected',
    'card_edited',
    'card_deleted',
    'card_created_manual'
  )),
  metadata jsonb null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table events is 'Audit log of user actions and system events';
comment on column events.event_type is 'Type of event: login, ai_generation, card_accepted, card_rejected, card_edited, card_deleted, card_created_manual';
comment on column events.metadata is 'Additional event data stored as JSON';
comment on column events.card_id is 'Optional reference to related card, set to null if card is deleted';

-- ============================================================================
-- 2. INDEXES
-- ============================================================================

-- Index for efficient user data lookups across all tables
create index idx_cards_user_id on cards(user_id);
create index idx_generation_requests_user_id on generation_requests(user_id);
create index idx_events_user_id on events(user_id);

comment on index idx_cards_user_id is 'Fast lookup of all cards for a specific user';
comment on index idx_generation_requests_user_id is 'Fast lookup of generation requests for a specific user';
comment on index idx_events_user_id is 'Fast lookup of events for a specific user';

-- ============================================================================
-- 3. FUNCTIONS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Function: set_updated_at
-- Purpose: Automatically updates the updated_at timestamp on row modification
-- Usage: Attached as a BEFORE UPDATE trigger to tables with updated_at column
-- ----------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

comment on function set_updated_at is 'Trigger function to automatically set updated_at timestamp on row updates';

-- ============================================================================
-- 4. TRIGGERS
-- ============================================================================

-- Attach updated_at triggers to all tables with the column
create trigger trigger_cards_updated_at
  before update on cards
  for each row
  execute function set_updated_at();

create trigger trigger_generation_requests_updated_at
  before update on generation_requests
  for each row
  execute function set_updated_at();

create trigger trigger_events_updated_at
  before update on events
  for each row
  execute function set_updated_at();

-- ============================================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Enable RLS on all tables
-- Note: MVP phase with permissive policies - users can only access their own data
-- ----------------------------------------------------------------------------
alter table cards enable row level security;
alter table generation_requests enable row level security;
alter table events enable row level security;

-- ----------------------------------------------------------------------------
-- RLS Policies for: cards
-- Strategy: Users can only access cards they own (user_id = auth.uid())
-- ----------------------------------------------------------------------------

-- Policy: Authenticated users can view their own cards
create policy "authenticated users can select their own cards"
  on cards
  for select
  to authenticated
  using (user_id = auth.uid());

-- Policy: Authenticated users can insert their own cards
create policy "authenticated users can insert their own cards"
  on cards
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- Policy: Authenticated users can update their own cards
create policy "authenticated users can update their own cards"
  on cards
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Policy: Authenticated users can delete their own cards
-- Note: This is a destructive operation - card data will be permanently removed
create policy "authenticated users can delete their own cards"
  on cards
  for delete
  to authenticated
  using (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- RLS Policies for: generation_requests
-- Strategy: Users can only access their own generation requests
-- ----------------------------------------------------------------------------

-- Policy: Authenticated users can view their own generation requests
create policy "authenticated users can select their own generation requests"
  on generation_requests
  for select
  to authenticated
  using (user_id = auth.uid());

-- Policy: Authenticated users can create their own generation requests
create policy "authenticated users can insert their own generation requests"
  on generation_requests
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- Policy: Authenticated users can update their own generation requests
create policy "authenticated users can update their own generation requests"
  on generation_requests
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Policy: Authenticated users can delete their own generation requests
-- Note: This is a destructive operation - generation request history will be lost
create policy "authenticated users can delete their own generation requests"
  on generation_requests
  for delete
  to authenticated
  using (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- RLS Policies for: events
-- Strategy: Users can only access their own events
-- Note: Typically events are append-only (no update/delete), but policies
--       are included for completeness
-- ----------------------------------------------------------------------------

-- Policy: Authenticated users can view their own events
create policy "authenticated users can select their own events"
  on events
  for select
  to authenticated
  using (user_id = auth.uid());

-- Policy: Authenticated users can create their own events
create policy "authenticated users can insert their own events"
  on events
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- Policy: Authenticated users can update their own events
create policy "authenticated users can update their own events"
  on events
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Policy: Authenticated users can delete their own events
-- Note: This is a destructive operation - audit trail will be permanently lost
-- Consider making events append-only in production
create policy "authenticated users can delete their own events"
  on events
  for delete
  to authenticated
  using (user_id = auth.uid());

-- ============================================================================
-- End of migration
-- ============================================================================
