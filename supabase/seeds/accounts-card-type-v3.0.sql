-- Migration: add credit_limit column and card type to accounts
-- Run this against your InsForge/Supabase database

ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS credit_limit numeric(18, 2) DEFAULT NULL;

-- The 'type' column is text, so 'card' is already valid without enum changes.
-- No additional SQL needed for the type field.
