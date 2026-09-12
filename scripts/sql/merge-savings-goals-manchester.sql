-- =====================================================================
-- Fusión de las 4 metas de ahorro del usuario propietario en una
-- sola meta: "Manchester".
--
-- Fecha: 2026-09-12
--
-- QUÉ HACE
--   1. Borra los 11 aportes existentes de las 4 metas.
--   2. Borra 3 de las 4 metas.
--   3. Reconvierte la meta "Ahorro para vacaciones" en "Manchester"
--      (objetivo 30.000.000 COP, fecha límite 30/09/2027).
--   4. Inserta un único aporte consolidado de 2.400.000 COP.
--
-- QUÉ *NO* HACE
--   No toca accounts.balance ni transactions. Los aportes solo descuentan
--   saldo desde la server action addFundsToGoal (lib/actions/savings.actions.ts);
--   no hay triggers en savings_goals / savings_contributions / accounts.
--   Borrar e insertar filas aquí deja los saldos exactamente como están.
--
-- CÓMO EJECUTARLO
--   Consola SQL de InsForge. `npx @insforge/cli db query` no sirve: la
--   ejecución SQL sin restricciones está deshabilitada en este proyecto.
--
-- OJO: la tabla savings_goals contiene además la meta "Boda" (USD) de otro
-- usuario. Por eso cada DELETE/UPDATE filtra por user_id.
-- =====================================================================


-- ---------------------------------------------------------------------
-- PASO 1 — VERIFICACIÓN PREVIA (ejecutar y revisar antes de seguir)
-- Debe devolver 4 metas y un total de aportes de 2.400.000.
-- ---------------------------------------------------------------------

SELECT id, name, target_amount, current_amount, currency, deadline, is_completed
FROM savings_goals
WHERE user_id = 'eff99695-917a-4d91-a419-9114ca91d4ac'
ORDER BY created_at;

SELECT count(*) AS aportes, sum(converted_amount) AS total_convertido
FROM savings_contributions
WHERE goal_id IN (
  '78e3b336-d9d5-4441-95ac-c8a16ef21bfa',  -- Fondo de emergencia
  '493fb367-4684-4c56-be64-b46ff7e4c80c',  -- Inversión adicional
  '4178f4f5-1086-46ab-b759-3b19fc575798',  -- Ahorro para vacaciones (se conserva)
  'bd8f19ec-0d7b-488e-80df-2f53d7d98f89'   -- Mac Mini
);

-- RESPALDO: guardá el resultado de este SELECT antes de continuar.
-- El historial de los 11 aportes se pierde de forma irreversible.
SELECT * FROM savings_contributions
WHERE goal_id IN (
  '78e3b336-d9d5-4441-95ac-c8a16ef21bfa',
  '493fb367-4684-4c56-be64-b46ff7e4c80c',
  '4178f4f5-1086-46ab-b759-3b19fc575798',
  'bd8f19ec-0d7b-488e-80df-2f53d7d98f89'
)
ORDER BY created_at;


-- ---------------------------------------------------------------------
-- PASO 2 — LA FUSIÓN (bloque transaccional)
-- ---------------------------------------------------------------------

BEGIN;

-- 2.1 Borrar los aportes de las 4 metas.
DELETE FROM savings_contributions
WHERE goal_id IN (
  '78e3b336-d9d5-4441-95ac-c8a16ef21bfa',
  '493fb367-4684-4c56-be64-b46ff7e4c80c',
  '4178f4f5-1086-46ab-b759-3b19fc575798',
  'bd8f19ec-0d7b-488e-80df-2f53d7d98f89'
);

-- 2.2 Borrar las 3 metas absorbidas.
DELETE FROM savings_goals
WHERE id IN (
  '78e3b336-d9d5-4441-95ac-c8a16ef21bfa',  -- Fondo de emergencia
  '493fb367-4684-4c56-be64-b46ff7e4c80c',  -- Inversión adicional
  'bd8f19ec-0d7b-488e-80df-2f53d7d98f89'   -- Mac Mini
)
AND user_id = 'eff99695-917a-4d91-a419-9114ca91d4ac';

-- 2.3 Convertir la meta conservada en "Manchester".
UPDATE savings_goals
SET name           = 'Manchester',
    target_amount  = 30000000,
    current_amount = 2400000,
    currency       = 'COP',
    deadline       = DATE '2027-09-30',
    is_completed   = false
WHERE id      = '4178f4f5-1086-46ab-b759-3b19fc575798'
  AND user_id = 'eff99695-917a-4d91-a419-9114ca91d4ac';

-- 2.4 Aporte consolidado.
--     account_id se conserva para no perder de qué cuenta salió el dinero:
--     si algún día se borra este aporte desde la UI, reintegrará los
--     2.400.000 a esa cuenta, que es el comportamiento correcto.
--     savings_contributions.user_id es de tipo text, no uuid.
INSERT INTO savings_contributions
  (goal_id, user_id, amount, currency, converted_amount, account_id, notes)
VALUES
  ('4178f4f5-1086-46ab-b759-3b19fc575798',
   'eff99695-917a-4d91-a419-9114ca91d4ac',
   2400000,
   'COP',
   2400000,
   'd2c2c030-deca-427f-a8d2-3f47a4af894b',
   'Aporte consolidado — fusión de 4 metas de ahorro (2026-09-12)');

COMMIT;


-- ---------------------------------------------------------------------
-- PASO 3 — VERIFICACIÓN POSTERIOR
-- Esperado: 1 meta ("Manchester", 30.000.000 / 2.400.000, 2027-09-30)
--           y 1 aporte de 2.400.000.
-- ---------------------------------------------------------------------

SELECT id, name, target_amount, current_amount, currency, deadline, is_completed
FROM savings_goals
WHERE user_id = 'eff99695-917a-4d91-a419-9114ca91d4ac';

SELECT id, goal_id, amount, currency, converted_amount, account_id, notes, created_at
FROM savings_contributions
WHERE user_id = 'eff99695-917a-4d91-a419-9114ca91d4ac';
