-- Tabla para registrar aportes a metas de ahorro con cuenta y moneda
-- Ejecutar en Supabase → SQL Editor antes del deploy de v1.5
-- v1.5.0 — 2026-04-24

CREATE TABLE IF NOT EXISTS savings_contributions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  goal_id uuid REFERENCES savings_goals(id) ON DELETE CASCADE NOT NULL,
  user_id text NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  currency text NOT NULL,
  account_id uuid REFERENCES accounts(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Index for querying by goal
CREATE INDEX IF NOT EXISTS idx_savings_contributions_goal_id ON savings_contributions(goal_id);

-- Enable RLS
ALTER TABLE savings_contributions ENABLE ROW LEVEL SECURITY;

-- Policy: users can only see/modify their own contributions
CREATE POLICY "Users can manage their own savings contributions"
  ON savings_contributions
  FOR ALL
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);
