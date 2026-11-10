-- =====================================================================
-- Pasar la meta de ahorro "Manchester" de COP a USD.
--
-- Fecha: 2026-11-10 · Issue #608
--
-- QUÉ HACE
--   1. La meta pasa a currency = 'USD', objetivo US$ 7.000 y
--      acumulado US$ 1.300 (≈ COP 4.200.000 ahorrados).
--   2. Recalcula converted_amount de cada aporte (la parte que cada
--      aporte suma a la meta, en la moneda de la meta) de forma
--      proporcional, para que la suma sea exactamente 1.300 USD.
--      amount / currency / account_id de cada aporte NO cambian: si se
--      revierte un aporte desde la UI, la meta baja en USD y la cuenta
--      recibe de vuelta lo que realmente salió (en COP).
--
-- QUÉ *NO* HACE
--   No toca accounts.balance ni transactions (no hay triggers en
--   savings_goals / savings_contributions / accounts).
--
-- CÓMO EJECUTARLO
--   Consola SQL de InsForge, paso a paso. `npx @insforge/cli db query`
--   no sirve: la ejecución SQL sin restricciones está deshabilitada.
--
-- OJO: savings_goals contiene metas de otro usuario; todo filtra por
-- id de la meta Y user_id.
-- =====================================================================


-- ---------------------------------------------------------------------
-- PASO 1 — VERIFICACIÓN PREVIA
-- Esperado: la meta "Manchester" en COP, y que la suma de converted_amount
-- de sus aportes coincida con current_amount (≈ 4.200.000).
-- Si no coincide, PARAR y revisar antes de seguir.
-- ---------------------------------------------------------------------

SELECT id, name, target_amount, current_amount, currency, deadline, is_completed
FROM savings_goals
WHERE id      = '4178f4f5-1086-46ab-b759-3b19fc575798'
  AND user_id = 'eff99695-917a-4d91-a419-9114ca91d4ac';

SELECT count(*) AS aportes, sum(converted_amount) AS total_convertido
FROM savings_contributions
WHERE goal_id = '4178f4f5-1086-46ab-b759-3b19fc575798';


-- ---------------------------------------------------------------------
-- PASO 2 — RESPALDO (guardar el resultado antes de continuar)
-- ---------------------------------------------------------------------

SELECT * FROM savings_goals
WHERE id = '4178f4f5-1086-46ab-b759-3b19fc575798';

SELECT * FROM savings_contributions
WHERE goal_id = '4178f4f5-1086-46ab-b759-3b19fc575798'
ORDER BY created_at;


-- ---------------------------------------------------------------------
-- PASO 3 — EL CAMBIO (bloque transaccional)
-- ---------------------------------------------------------------------

BEGIN;

-- 3.1 Reparto proporcional de los 1.300 USD entre los aportes,
--     redondeado a centavos.
UPDATE savings_contributions sc
SET converted_amount = round(sc.converted_amount * 1300 / t.total, 2)
FROM (
  SELECT sum(converted_amount) AS total
  FROM savings_contributions
  WHERE goal_id = '4178f4f5-1086-46ab-b759-3b19fc575798'
) t
WHERE sc.goal_id = '4178f4f5-1086-46ab-b759-3b19fc575798'
  AND t.total > 0;

-- 3.2 El redondeo puede dejar la suma unos centavos arriba o abajo de
--     1.300: la diferencia se carga al aporte más grande.
UPDATE savings_contributions
SET converted_amount = converted_amount + (
  1300 - (SELECT sum(converted_amount)
          FROM savings_contributions
          WHERE goal_id = '4178f4f5-1086-46ab-b759-3b19fc575798')
)
WHERE id = (
  SELECT id FROM savings_contributions
  WHERE goal_id = '4178f4f5-1086-46ab-b759-3b19fc575798'
  ORDER BY converted_amount DESC, created_at
  LIMIT 1
);

-- 3.3 La meta en USD.
UPDATE savings_goals
SET currency       = 'USD',
    target_amount  = 7000,
    current_amount = 1300,
    is_completed   = false
WHERE id      = '4178f4f5-1086-46ab-b759-3b19fc575798'
  AND user_id = 'eff99695-917a-4d91-a419-9114ca91d4ac';

COMMIT;


-- ---------------------------------------------------------------------
-- PASO 4 — VERIFICACIÓN POSTERIOR
-- Esperado: Manchester · USD · 7000 / 1300, y total_convertido = 1300.00
-- ---------------------------------------------------------------------

SELECT id, name, target_amount, current_amount, currency, deadline, is_completed
FROM savings_goals
WHERE id = '4178f4f5-1086-46ab-b759-3b19fc575798';

SELECT count(*) AS aportes, sum(converted_amount) AS total_convertido
FROM savings_contributions
WHERE goal_id = '4178f4f5-1086-46ab-b759-3b19fc575798';

SELECT id, amount, currency, converted_amount, account_id, created_at
FROM savings_contributions
WHERE goal_id = '4178f4f5-1086-46ab-b759-3b19fc575798'
ORDER BY created_at;
