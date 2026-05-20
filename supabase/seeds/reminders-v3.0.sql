-- Migration: reminders table for scheduled financial reminders
-- Run this against your InsForge/Supabase database

CREATE TABLE IF NOT EXISTS reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  description text NOT NULL,
  category_id uuid NULL REFERENCES categories(id) ON DELETE SET NULL,
  frequency text NOT NULL CHECK (frequency IN ('once', 'weekly', 'monthly', 'yearly')),
  day_of_week int NULL CHECK (day_of_week BETWEEN 0 AND 6),
  day_of_month int NULL CHECK (day_of_month BETWEEN 1 AND 31),
  month_of_year int NULL CHECK (month_of_year BETWEEN 1 AND 12),
  specific_date date NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS reminders_user_id_idx ON reminders(user_id);

ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own reminders"
  ON reminders
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
