-- Agregar columna paid_amount a la tabla loans para soporte de abonos parciales
-- Ejecutar en Supabase → SQL Editor antes de hacer deploy de v1.5
-- v1.5.0 — 2026-04-24

ALTER TABLE loans ADD COLUMN IF NOT EXISTS paid_amount numeric DEFAULT 0;
