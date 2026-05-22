-- Migration v3.4.0:
-- 1. Add `is_default` boolean to accounts so users can mark one default per user.
-- 2. Add `account_id` to reminders so a reminder can preselect an account on pay.

ALTER TABLE accounts ADD COLUMN IF NOT EXISTS is_default boolean NOT NULL DEFAULT false;

-- Only one default account per user (partial unique index keeps non-default rows free).
CREATE UNIQUE INDEX IF NOT EXISTS accounts_one_default_per_user
  ON accounts(user_id) WHERE is_default = true;

ALTER TABLE reminders
  ADD COLUMN IF NOT EXISTS account_id uuid NULL
  REFERENCES accounts(id) ON DELETE SET NULL;
