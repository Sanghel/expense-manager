-- Migration: Gmail integration for automatic transaction registration
-- Run this against your InsForge/Supabase database
--
-- Adds:
-- 1. Gmail OAuth refresh-token storage on users
-- 2. last_four column on accounts (to match Bancolombia emails)
-- 3. 'gmail' as a valid transactions.source value
-- 4. transaction_drafts table (low-confidence parses awaiting user confirmation)
-- 5. processed_emails table (idempotency log)

-- 1. users: gmail connection fields ------------------------------------------
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS gmail_refresh_token text NULL,
  ADD COLUMN IF NOT EXISTS gmail_connected_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS gmail_last_synced_at timestamptz NULL;

-- 2. accounts: last 4 digits for email-to-account matching -------------------
ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS last_four varchar(4) NULL
    CHECK (last_four IS NULL OR last_four ~ '^[0-9]{4}$');

CREATE INDEX IF NOT EXISTS accounts_user_last_four_idx
  ON accounts(user_id, last_four)
  WHERE last_four IS NOT NULL;

-- 3. transactions.source: allow 'gmail' --------------------------------------
-- Drop the previous CHECK constraint and recreate with the new value.
-- The constraint name follows Postgres' default for table_column_check.
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_source_check;
ALTER TABLE transactions
  ADD CONSTRAINT transactions_source_check
  CHECK (source IN ('manual', 'conversational', 'import', 'gmail'));

-- Allow gmail-sourced transactions to land without a category. The user can
-- categorize them later from the transactions list. Manual transactions still
-- require a category at the form/validation layer.
ALTER TABLE transactions ALTER COLUMN category_id DROP NOT NULL;

-- 4. transaction_drafts: pending review queue --------------------------------
CREATE TABLE IF NOT EXISTS transaction_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  gmail_message_id text NOT NULL UNIQUE,
  -- Parsed transaction fields (all nullable; user fills gaps on confirm)
  amount numeric NULL,
  currency text NULL CHECK (currency IS NULL OR currency IN ('COP', 'USD', 'VES')),
  type text NULL CHECK (type IS NULL OR type IN ('income', 'expense')),
  category_id uuid NULL REFERENCES categories(id) ON DELETE SET NULL,
  account_id uuid NULL REFERENCES accounts(id) ON DELETE SET NULL,
  description text NULL,
  date date NULL,
  notes text NULL,
  -- Raw email context for review
  raw_subject text NULL,
  raw_snippet text NULL,
  raw_from text NULL,
  -- Parse quality
  confidence numeric(3,2) NOT NULL DEFAULT 0,
  parse_reason text NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz NULL
);

CREATE INDEX IF NOT EXISTS transaction_drafts_user_status_idx
  ON transaction_drafts(user_id, status);

ALTER TABLE transaction_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own transaction drafts"
  ON transaction_drafts
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 5. processed_emails: idempotency log ---------------------------------------
CREATE TABLE IF NOT EXISTS processed_emails (
  gmail_message_id text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  outcome text NOT NULL
    CHECK (outcome IN ('auto_registered', 'drafted', 'skipped', 'error')),
  transaction_id uuid NULL REFERENCES transactions(id) ON DELETE SET NULL,
  draft_id uuid NULL REFERENCES transaction_drafts(id) ON DELETE SET NULL,
  error_message text NULL,
  processed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS processed_emails_user_idx
  ON processed_emails(user_id, processed_at DESC);

ALTER TABLE processed_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own processed emails"
  ON processed_emails
  FOR SELECT
  USING (user_id = auth.uid());
