-- Migration: AI savings-goal suggestions
-- Run this against your InsForge/Supabase database
--
-- Adds a column to ai_savings_advice to cache the AI-proposed savings goals
-- (based on the user's average monthly income/expense). Existing rows default
-- to an empty array; they get populated on the next generation.

ALTER TABLE ai_savings_advice
  ADD COLUMN IF NOT EXISTS goal_suggestions jsonb NOT NULL DEFAULT '[]'::jsonb;
-- [{ name, target_amount, monthly_contribution?, deadline?, rationale }]
