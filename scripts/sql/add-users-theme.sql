-- =====================================================================
-- Preferencia de tema (oscuro/claro) por usuario.
--
-- Fecha: 2026-10-29 · Issue #553
--
-- QUÉ HACE
--   Añade users.theme ('dark' | 'light'), por defecto 'dark'.
--
-- La app funciona sin esta columna: getTheme() devuelve null y se usa el
-- tema guardado en el navegador. Aplicarla antes del selector de
-- Apariencia (#562) para que el tema se sincronice entre dispositivos.
-- =====================================================================

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS theme text NOT NULL DEFAULT 'dark'
  CHECK (theme IN ('dark', 'light'));
