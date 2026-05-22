-- Migration: drop recurring_transactions table (deprecated in v3.4.0)
-- The module has been removed in favor of Gmail auto-import + Reminders pay flow.

DROP TABLE IF EXISTS recurring_transactions CASCADE;
