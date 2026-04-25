-- Nuevas categorías globales (user_id = null = predefinidas para todos los usuarios)
-- Ejecutar en Supabase → SQL Editor
-- v1.5.0 — 2026-04-24

INSERT INTO categories (id, user_id, name, type, icon, color, created_at) VALUES
  (gen_random_uuid(), null, 'Mercado',            'expense', '🛒', '#FF6B6B', now()),
  (gen_random_uuid(), null, 'Subscripciones',     'expense', '📱', '#A78BFA', now()),
  (gen_random_uuid(), null, 'Deudas',             'expense', '💸', '#F87171', now()),
  (gen_random_uuid(), null, 'Deudas Cobradas',    'income',  '💸', '#34D399', now()),
  (gen_random_uuid(), null, 'Vehículo',           'expense', '🚙', '#60A5FA', now()),
  (gen_random_uuid(), null, 'Inversiones Gasto',  'expense', '📉', '#C084FC', now()),
  (gen_random_uuid(), null, 'Salidas / Retiro',   'expense', '💵', '#94A3B8', now());
