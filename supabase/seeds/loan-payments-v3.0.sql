-- Migration: loan_payments table for detailed payment history
-- Run this against your InsForge/Supabase database

CREATE TABLE IF NOT EXISTS loan_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id uuid NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount numeric(18, 2) NOT NULL CHECK (amount > 0),
  currency text NOT NULL DEFAULT 'COP',
  date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast lookups by loan
CREATE INDEX IF NOT EXISTS loan_payments_loan_id_idx ON loan_payments(loan_id);
CREATE INDEX IF NOT EXISTS loan_payments_user_id_idx ON loan_payments(user_id);

-- Row Level Security (same pattern as other tables)
ALTER TABLE loan_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own loan payments"
  ON loan_payments
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
