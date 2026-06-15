-- Migration: associate a card number with an account
-- Run this against your InsForge/Supabase database
--
-- Some accounts and cards share the same fund. Bank emails sometimes reference
-- the card number instead of the account number, so we let an account also
-- store the last 4 digits of its linked card. Gmail matching then resolves a
-- transaction by either last_four (the account's own number) or card_number.

ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS card_number varchar(4) NULL
    CHECK (card_number IS NULL OR card_number ~ '^[0-9]{4}$');

CREATE INDEX IF NOT EXISTS accounts_user_card_number_idx
  ON accounts(user_id, card_number)
  WHERE card_number IS NOT NULL;
