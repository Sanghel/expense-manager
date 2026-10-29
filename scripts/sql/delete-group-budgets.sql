-- =====================================================================
-- Borra los presupuestos de grupo guardados.
--
-- Fecha: 2026-10-29 · Issue #574
--
-- POR QUÉ
--   El presupuesto de un grupo ya no se guarda: la app lo calcula como la
--   suma de los presupuestos mensuales de sus categorías. Las filas con
--   scope = 'group' quedaron sin uso (getBudgets las ignora).
--
-- QUÉ HACE
--   1. Muestra las filas que se van a borrar (revisar antes del paso 2).
--   2. Las borra.
--
-- QUÉ *NO* HACE
--   No toca presupuestos de categoría ni el general (scope = 'total'), ni
--   transacciones, ni grupos de categorías.
-- =====================================================================

-- 1. Revisar
SELECT b.id, g.name AS grupo, b.amount_type, b.amount, b.percent, b.currency, b.period
FROM budgets b
LEFT JOIN category_groups g ON g.id = b.group_id
WHERE b.scope = 'group';

-- 2. Borrar
DELETE FROM budgets WHERE scope = 'group';
