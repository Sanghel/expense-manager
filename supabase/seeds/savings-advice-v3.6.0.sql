-- Migration: AI savings advice cache
-- Run this against your InsForge/Supabase database
--
-- Adds:
-- 1. ai_savings_advice table — caches the AI-generated insights and budget
--    suggestions per user and period (YYYY-MM). The monthly cron upserts one
--    row per (user_id, period); the panel reads from here.

CREATE TABLE IF NOT EXISTS ai_savings_advice (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  -- Period this advice covers, as 'YYYY-MM'
  period text NOT NULL,
  -- Currency the amounts are expressed in (user's preferred currency at gen time)
  currency text NOT NULL CHECK (currency IN ('COP', 'USD', 'VES')),
  -- [{ title, detail, severity: 'info'|'warning'|'critical', category_id? }]
  insights jsonb NOT NULL DEFAULT '[]'::jsonb,
  -- [{ category_id, category_name, suggested_amount, rationale, current_budget_amount? }]
  budget_suggestions jsonb NOT NULL DEFAULT '[]'::jsonb,
  generated_at timestamptz NOT NULL DEFAULT now(),
  -- One cached advice per user per period (enables delete-then-insert refresh)
  UNIQUE (user_id, period)
);

CREATE INDEX IF NOT EXISTS ai_savings_advice_user_period_idx
  ON ai_savings_advice(user_id, period);

ALTER TABLE ai_savings_advice ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own savings advice"
  ON ai_savings_advice
  FOR SELECT
  USING (user_id = auth.uid());
