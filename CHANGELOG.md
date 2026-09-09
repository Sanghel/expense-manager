# Changelog

## [3.10.0] — 2026-09-06

### Added

**Consejos de Ahorro por grupo e higiene de categorías**

- La IA ahora ve los **grupos de categorías** con su gasto agregado y razona en "tipos de gasto", no solo por categoría fija.
- El resumen incluye **mediana de ticket y número de transacciones** por categoría. Sin eso, el modelo identificaba los gastos hormiga por el nombre — el error clásico es tomar "Ropa" (mediana ~314.000) por gasto hormiga cuando el hormiga real es "Transporte" (mediana ~13.000 con 108 transacciones).
- Nueva sección **Grupos sugeridos**, con botón "Crear grupo".
- Nueva sección **Orden de tus categorías**: duplicados, solapamientos y gasto sin categorizar. Los hechos exactos (nombres duplicados, % sin categorizar) se calculan en código; el modelo solo aporta el juicio semántico.

**Campanilla de recordatorios**

- Nueva **campanilla** en el header, visible en toda la app, con un badge que cuenta lo **vencido + de hoy**. El panel agrupa en **Vencidos / Hoy / Próximos** (ventana de ±7 días) y permite **Registrar** (reutiliza el diálogo de pago), **Posponer** una semana, **Descartar** y **activar/desactivar** el recordatorio desde ahí.
- Los recordatorios son reglas recurrentes, no instancias: `lib/reminders/pending.ts` las expande y descarta las ya atendidas cruzando contra las transacciones del día, igual que la tab de Recordatorios.
- Al registrar un recordatorio **vencido**, la transacción se crea con la **fecha de la ocurrencia**, no la de hoy.

**Presupuestos por grupo y por porcentaje**

- Nuevos **grupos de categorías** (ej. "gastos hormiga" = Ropa + Meriendas + Salidas), gestionables en Configuración → Categorías. Una categoría puede pertenecer a varios grupos.
- Un presupuesto ahora tiene **ámbito** (categoría / grupo / general) y **tipo de límite** (monto fijo / % de ingresos / % del gasto). Los porcentajes se resuelven a un límite **recalculado cada periodo**.

**Metas de ahorro: historial y ritmo**

- **Historial de aportes** colapsable en cada meta, con posibilidad de **eliminar un aporte** (revierte la meta y reintegra el saldo a la cuenta de origen).
- **Ritmo de ahorro**: con fecha límite, la tarjeta muestra `Faltan X · N meses → Y/mes` y un badge **Al día / Atrasada / Vencida**.
- Franja resumen con el total ahorrado convertido a la moneda preferida.
- Botón para **marcar como completada o reabrir** una meta.

**Balances de cuentas en Transacciones**

- Balance total convertido y grilla por cuenta en `/movimientos?tab=transacciones`.
- Columna **Cuenta** en la tabla, línea en la tarjeta móvil y **filtro por cuenta**.

**Reportes ampliados**

- Nuevas gráficas: **waffle** de reparto del gasto (por grupo si existen), **polar bar** de consumo de presupuesto, **radar** del perfil de gasto contra el periodo anterior, **calendario** de intensidad diaria, **tasa de ahorro** mensual, **gasto fijo vs. variable**, **gastos hormiga**, y desgloses por **cuenta**, **origen** y **día de la semana**.

### Changed

- **Librería de gráficas: de Recharts a Nivo.** Se evaluó Mono Charts (`amicro.vercel.app/mono-charts`): es un registry copy-paste con 4 bloques de estética "dither" y **sin polar bar, radar ni waffle**, así que no cubría lo pedido.
- Nueva paleta categórica de orden fijo en `components/charts/nivo-theme.ts`, **validada** contra la superficie oscura de la app (banda de luminosidad, croma, separación CVD, visión normal y contraste 3:1).
- **Reportes: una sola petición.** `getReportDataset` reemplaza las cuatro llamadas independientes de 500 filas que hacía cada gráfica por su cuenta, y convierte todo a la moneda preferida en servidor.

### Fixed

- **Consejos de Ahorro: la generación fallaba de forma intermitente.** El prompt pide hasta 5 insights + 5 sugerencias + 3 metas con prosa en español y UUIDs, pero `max_tokens` era **1500**: con pocas categorías cabía y con muchas la respuesta se cortaba a mitad del JSON. Además nada miraba `stop_reason`, así que una truncación se reportaba como "JSON inválido" — la causa equivocada. Ahora el esquema Zod se pasa como `output_config.format` (`messages.parse` + `zodOutputFormat`), de modo que el modelo no puede devolver algo malformado, y una truncación se detecta y se reintenta.
- **Consejos de Ahorro: una generación fallida borraba la anterior.** El `delete` iba antes del `insert`; ahora se actualiza la fila existente.
- **Consejos de Ahorro: vuelve el botón "Regenerar"** (con confirmación). El cron solo corre el día 1, así que una ejecución fallida dejaba la página vacía todo el mes sin forma de reintentar.
- **Metas de ahorro (el módulo estaba roto).** `current_amount + amount` concatenaba strings porque los `numeric` llegan como texto desde InsForge: la meta se guardaba con saldo casi nulo mientras la cuenta se debitaba el monto completo. Además la meta sumaba el monto **sin convertir** mientras el saldo de la cuenta sí se convertía, y los errores del aporte y del ajuste de saldo se descartaban devolviendo `success: true`.
- El aporte ahora se resuelve en un orden compensable: si falta la tasa de cambio se aborta **antes** de escribir nada, y cada paso que falla revierte los anteriores.
- Se elimina el `Math.min` que truncaba el aporte a la meta mientras la contribución y el débito registraban el monto completo.
- `is_completed` pasa a ser derivado: subir el objetivo **reabre** la meta, que antes quedaba bloqueada para siempre.
- La **fecha límite** de una meta ya se puede borrar.
- **Presupuestos**: el periodo se calculaba con aritmética de fechas que desborda (uno que arrancaba el 31-ene producía un periodo empezando el 3 de marzo); el gasto se sumaba **sin convertir moneda** y sin coerción numérica; y la consulta traía todas las transacciones del usuario sin acotar.
- Barras de progreso con `NaN%` / `Infinity` cuando el monto era 0.
- El widget de presupuestos del dashboard enlazaba a `/dashboard/budgets`, una ruta inexistente.
- Los mensajes de error de metas y presupuestos ya no son cadenas fijas en inglés: se propaga el error real.

### Removed

- **Recharts**.
- **Módulo de tags** completo (ruta, componentes, acciones, validaciones y tipos). Era inalcanzable: los formularios de transacción nunca persistían tags, nada llamaba a sus acciones y la ruta ni siquiera aparecía en la navegación. Las tablas `tags` y `transaction_tags` quedan huérfanas en la base de datos.
- `markGoalAsCompleted`, que no tenía ninguna llamada. Lo reemplaza `setGoalCompleted`, ya conectado a la UI.

### Database

Migraciones manuales aplicadas en InsForge:

```sql
-- Aportes de metas: monto realmente acreditado, en la moneda de la meta, al
-- momento del aporte. Necesario para revertir con exactitud (las tasas cambian).
ALTER TABLE savings_contributions
  ADD COLUMN IF NOT EXISTS converted_amount numeric,
  ADD COLUMN IF NOT EXISTS notes text;

UPDATE savings_contributions SET converted_amount = amount WHERE converted_amount IS NULL;

CREATE INDEX IF NOT EXISTS savings_contributions_goal_idx
  ON savings_contributions (goal_id, created_at DESC);

-- Grupos de categorías
CREATE TABLE IF NOT EXISTS category_groups (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        text NOT NULL,
  icon        text,
  color       text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS category_groups_user_name_key
  ON category_groups (user_id, upper(name));

CREATE TABLE IF NOT EXISTS category_group_members (
  group_id    uuid NOT NULL REFERENCES category_groups(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES categories(id)      ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (group_id, category_id)
);
CREATE INDEX IF NOT EXISTS category_group_members_category_idx
  ON category_group_members (category_id);

-- Presupuestos: ámbito y tipo de límite. Aditivo: toda fila existente queda en
-- scope='category' / amount_type='fixed'.
ALTER TABLE budgets
  ADD COLUMN IF NOT EXISTS scope       text NOT NULL DEFAULT 'category',
  ADD COLUMN IF NOT EXISTS group_id    uuid REFERENCES category_groups(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS amount_type text NOT NULL DEFAULT 'fixed',
  ADD COLUMN IF NOT EXISTS percent     numeric(5,2);

ALTER TABLE budgets ALTER COLUMN category_id DROP NOT NULL;
ALTER TABLE budgets ALTER COLUMN amount      DROP NOT NULL;

ALTER TABLE budgets ADD CONSTRAINT budgets_scope_chk
  CHECK (scope IN ('category','group','total'));
ALTER TABLE budgets ADD CONSTRAINT budgets_amount_type_chk
  CHECK (amount_type IN ('fixed','percent_income','percent_expense'));

ALTER TABLE budgets ADD CONSTRAINT budgets_scope_target_chk CHECK (
  (scope = 'category' AND category_id IS NOT NULL AND group_id IS NULL) OR
  (scope = 'group'    AND group_id   IS NOT NULL AND category_id IS NULL) OR
  (scope = 'total'    AND category_id IS NULL    AND group_id IS NULL)
);
ALTER TABLE budgets ADD CONSTRAINT budgets_limit_chk CHECK (
  (amount_type =  'fixed' AND amount IS NOT NULL AND amount > 0 AND percent IS NULL) OR
  (amount_type <> 'fixed' AND percent IS NOT NULL AND percent > 0 AND percent <= 100)
);
ALTER TABLE budgets ADD CONSTRAINT budgets_no_trivial_pct_chk CHECK (
  NOT (scope = 'total' AND amount_type = 'percent_expense')
);

CREATE INDEX IF NOT EXISTS budgets_user_scope_idx ON budgets (user_id, scope);

-- Consejos de Ahorro: sugerencias de grupo y de higiene de categorías.
ALTER TABLE ai_savings_advice
  ADD COLUMN IF NOT EXISTS group_suggestions    jsonb NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS category_suggestions jsonb NOT NULL DEFAULT '[]';

-- Habilita la integración con Gmail por usuario. Se cambia SOLO desde la base de
-- datos: no hay UI para activarlo. Por defecto queda apagada para todos.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS gmail_sync_enabled boolean NOT NULL DEFAULT false;

-- Habilitarlo para tu cuenta:
-- UPDATE users SET gmail_sync_enabled = true WHERE email = 'tu-correo@ejemplo.com';

-- Descartar/posponer una ocurrencia de recordatorio. El UNIQUE no es opcional:
-- ambas acciones usan upsert con onConflict.
CREATE TABLE IF NOT EXISTS reminder_dismissals (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reminder_id     uuid NOT NULL REFERENCES reminders(id) ON DELETE CASCADE,
  occurrence_date date NOT NULL,
  snoozed_until   date,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (reminder_id, occurrence_date)
);
```

Opcional, tras eliminar el módulo de tags: `DROP TABLE transaction_tags; DROP TABLE tags;`

## [3.9.0] — 2026-06-20

### Added

**Recordatorios de ingreso**

- Los recordatorios ahora tienen **tipo** (`income` | `expense`): se puede crear un recordatorio de **ingreso** además de gasto.
- **Diferenciación visual** por tipo: en el listado (badge verde "Ingreso" / rojo "Gasto" con icono) y en el calendario (color del punto, leyenda con ambos, badges y textos "Registrar ingreso"/"Registrar pago"). Al registrar desde el calendario o el diálogo, la transacción se crea con el tipo correcto.

### Changed

- **Layout**: el logo se movió al **sidebar** (visible siempre; contraído solo el logo, expandido logo + "GitPush Money"). El sidebar ahora ocupa toda la altura, por encima del header. El footer **"Crafted with… by Sanghel González"** aparece en el **header** cuando el sidebar está contraído (desktop); en mobile el logo sigue en el header.
- **Consejos de Ahorro**: se quitó el botón **"Actualizar"** del header (la regeneración queda a cargo únicamente del cron mensual). Se eliminaron las **tabs** y el **Coach/chat de ahorro**; la página muestra directamente diagnóstico, sugerencias de presupuesto y metas.
- **Selectores (dropdown)**: la **frecuencia** y el **tipo** del recordatorio, y el **tipo de cuenta**, ahora usan un selector desplegable (componente reutilizable `SelectField`).

### Removed

- Coach de ahorro (chat) y la acción `askSavingsCoach` / tipo `CoachMessage`.

### Database

- Migración manual: `ALTER TABLE reminders ADD COLUMN type text NOT NULL DEFAULT 'expense';`

## [3.8.0] — 2026-06-19

### Added

**Descartar y deduplicar sugerencias de IA en "Consejos de Ahorro"**

- Cada sugerencia de **presupuesto** y de **meta de ahorro** tiene ahora un botón **"Descartar"** que la oculta de forma **persistente** (se elimina del análisis cacheado en `ai_savings_advice`, sin reaparecer hasta la próxima generación mensual).
- Las **metas de ahorro** sugeridas alcanzan **paridad** con los presupuestos: se deduplican contra las metas existentes por nombre y permiten editar la existente.

### Changed

- **Dedup de sugerencias**: una sugerencia idéntica a un presupuesto/meta ya creado (mismo monto/objetivo) deja de mostrarse; una que difiere se muestra como **"Editar"** abriendo el registro existente prellenado; las nuevas se muestran para crear. Se reemplaza el botón "Aplicado" deshabilitado.
- **Iconos en los títulos de página**: todas las páginas (Dashboard, Movimientos, Transacciones, Planificación, Metas de Ahorro, Presupuestos, Deudas y Préstamos, Calendario, Chat IA, Etiquetas, Reportes, Configuración) muestran un icono junto al título, siguiendo el patrón de "Consejos de Ahorro".

### Fixed

- La lista **"Mis Recordatorios"** (`movimientos?tab=recordatorios`) se muestra en una **grilla de varias columnas** en desktop, aprovechando el ancho completo (1 columna en móvil).

## [3.7.0] — 2026-06-17

### Added

**Metas de ahorro sugeridas en "Consejos de Ahorro"**

- Nueva sección inferior en la tab de consejos con la **capacidad de ahorro mensual** estimada (promedios de ingreso y gasto sobre los últimos 6 meses con actividad: ingreso prom. − gasto prom.).
- La IA propone **metas de ahorro** (`goal_suggestions`) con nombre, monto objetivo, aporte mensual sugerido (≤ capacidad de ahorro), fecha límite y justificación. Cada meta tiene un botón "Crear meta" que abre el formulario de meta prellenado para ajustar y confirmar.

### Changed

- El cron `/api/cron/generate-savings-advice` volvió a ejecutarse **mensualmente el día 1** (`0 6 1 * *`).

### Database

- Nueva migración `supabase/seeds/savings-goal-suggestions-v3.7.0.sql`: agrega la columna `ai_savings_advice.goal_suggestions jsonb` (default `'[]'`).

## [3.6.1] — 2026-06-17

### Changed

**Mejoras de UI en la sección "Consejos de Ahorro"**

- El panel se reorganizó en **2 tabs**: "Consejos de ahorro" (diagnóstico + sugerencias de presupuesto) y "Coach de ahorro" (el chat, antes apilado como tercer bloque).
- En desktop, la tab de consejos usa un **layout 40/60**: diagnóstico a la izquierda y sugerencias de presupuesto a la derecha, cada columna con alto fijo y scroll propio. En móvil se apilan.
- Las tarjetas de sugerencia y de diagnóstico ahora muestran el **icono y color de la categoría** para identificarlas mejor.
- Una sugerencia cuya categoría ya tiene presupuesto (incluido el recién creado) se marca como **"Aplicado"** con el botón deshabilitado.

## [3.6.0] — 2026-06-17

### Added

**Sección "Consejos de Ahorro con IA"** (`/consejos-ahorro`)

- **Diagnóstico del mes**: la IA analiza el gasto del periodo (tendencias mes a mes, categorías problemáticas y presupuestos en riesgo) y muestra observaciones accionables con nivel de severidad (info / atención / crítico).
- **Sugerencias de presupuesto**: la IA propone montos por categoría basándose en el gasto real; cada sugerencia tiene un botón "Aplicar y editar" que abre el formulario de presupuesto prellenado (crea si no existe, ajusta si ya hay uno). Reutiliza `BudgetForm` vía el nuevo prop opcional `prefill`.
- **Coach conversacional**: chat en vivo (`askSavingsCoach`) para preguntar "¿en qué estoy gastando de más?" o "¿cómo ahorro este mes?"; responde usando el resumen financiero del usuario como contexto, sin registrar transacciones. Historial efímero en `localStorage`.
- **Generación**: los insights y sugerencias se pre-generan con un cron semanal (`/api/cron/generate-savings-advice`, lunes 06:00) y se cachean por usuario y mes; un botón "Generar / Actualizar" sirve de fallback bajo demanda. La IA recibe un resumen agregado compacto (no transacciones crudas) para controlar costo.
- **Navegación**: nueva entrada "Consejos de Ahorro" en el sidebar y el menú móvil.

### Database

- Nueva migración `supabase/seeds/savings-advice-v3.6.0.sql`: tabla `ai_savings_advice` (cache de consejos por `(user_id, period)` con `insights` y `budget_suggestions` en jsonb) + RLS de lectura.

### Operational

- Nuevo cron en `vercel.json`: `/api/cron/generate-savings-advice` (`0 6 * * 1`). Usa la `ANTHROPIC_API_KEY` y el `CRON_SECRET` ya existentes.

## [3.3.0] — 2026-05-21

### Added

**Integración Gmail → auto-registro de transacciones de Bancolombia**

- **Auto-registro de transacciones**: los correos de Bancolombia (compras con tarjeta de crédito/débito, transferencias enviadas, pagos PSE/servicios y consignaciones recibidas) se registran automáticamente como transacciones cuando la confianza del parser es alta y la cuenta queda identificada por los últimos 4 dígitos.
- **Cola "Pendientes"** (`/pendientes`): los correos con confianza baja o sin cuenta matcheable quedan como borradores editables. El usuario revisa monto, categoría, cuenta, descripción y fecha, y confirma o rechaza.
- **Botón "Sincronizar correos"** en la toolbar de `/transactions` que dispara el sync on-demand y muestra un toast con scanned / auto / pendientes / omitidos / errores.
- **Sección Gmail en Settings**: conectar/desconectar Gmail, ver estado de la conexión, última sincronización, y disparar sync manual.
- **Cron de respaldo** (`/api/cron/sync-gmail`) diario a las 11:00 UTC (06:00 Colombia) itera usuarios con Gmail conectado y ejecuta el mismo pipeline; idempotencia garantizada vía `processed_emails.gmail_message_id UNIQUE`. Limitado a daily por Vercel Hobby; el botón manual cubre sync más frecuente.
- **Campo "Últimos 4 dígitos"** en el formulario de cuentas, opcional, para asociar correos a la cuenta correcta.
- **OAuth Gmail multiusuario**: NextAuth pide el scope `gmail.readonly` en el consent; el refresh_token se persiste cifrado con AES-256-GCM (`GMAIL_TOKEN_ENCRYPTION_KEY`) en `users.gmail_refresh_token`.
- **Parser Bancolombia** (`lib/gmail/parsers/bancolombia.ts`) con 4 reglas regex (compra tarjeta, transferencia enviada, pago servicio, recepción) y score de confianza basado en monto + last_four + merchant. Cubierto por fixtures en `scripts/test-bancolombia-parser.ts` (`npm run test:bancolombia-parser`).

### Changed

- `createTransaction` ahora acepta un parámetro opcional `source` (default `'manual'`) para que pipelines externos (gmail, futuros adaptadores) puedan tagear sus inserts sin tocar el contrato.
- `transactions.category_id` ahora es nullable a nivel DB y tipo. Las transacciones auto-registradas desde Gmail entran sin categoría (el usuario la asigna después); las manuales siguen exigiéndola en el formulario.

### Database

- Nueva migración `supabase/seeds/gmail-integration-v3.3.sql`: columnas `gmail_*` en `users`, `last_four` en `accounts`, tablas `transaction_drafts` y `processed_emails`, `'gmail'` añadido al CHECK de `transactions.source` y `category_id` relajado a nullable.

### Operational

- Nuevas env vars requeridas: `GMAIL_TOKEN_ENCRYPTION_KEY` (clave para cifrar refresh tokens en reposo).
- Gmail API debe habilitarse en Google Cloud Console y el scope `gmail.readonly` debe añadirse al OAuth consent screen del mismo Client ID.

## [3.2.0] — 2026-05-21

### Fixed

- **Recurrentes en el calendario**: las transacciones recurrentes recién creadas no aparecían en el calendario de programados porque el insert no establecía `is_active`. Adicionalmente, todas las mutaciones de recurrentes (crear/editar/eliminar/toggle) ahora revalidan `/calendar`.

### Added

- **Crear recurrentes desde el calendario**: el diálogo de día en la tab "Programado" incluye un botón "Nueva recurrente" además del existente "Nuevo recordatorio", con la fecha clickeada prellenada como `start_date`.
- **Nueva tab "Recordatorios" en /movimientos**: listado completo de recordatorios con crear, editar y eliminar reutilizando los componentes del calendario. Soporta `?tab=recordatorios` en la URL.
- **Recordatorios fijados del día**: en la nueva tab, los recordatorios cuya frecuencia coincide con hoy se muestran como tarjetas fijadas arriba del listado con un botón "Pagar" que abre el formulario de transacción con descripción, categoría y fecha prellenadas (mismo flujo que en el calendario).
- **Ocultar pin tras pagar**: cuando se registra una transacción para un recordatorio del día con la misma descripción y categoría, deja de aparecer como fijado en la tab.

### Changed

- Lógica de matching de recordatorios extraída a `lib/reminders/matches-date.ts` como única fuente de verdad para el calendario y la nueva tab de recordatorios.
- Las server actions de recordatorios ahora revalidan también `/movimientos`.

## [1.3.0] — 2026-05-13

### Added

**Importación masiva de transacciones**
- Botón "Importar" en la toolbar de la página de transacciones (junto a Exportar y Nueva Transacción)
- Wizard de 3 pasos: subir archivo → revisar preview → resultado de importación
- Soporte para archivos `.xlsx` y `.csv` con alias de columnas en español e inglés
- Plantilla Excel descargable desde el propio modal con columnas predefinidas y filas de ejemplo
- Validación por fila antes de insertar: detecta categorías/cuentas inexistentes, mismatch de tipo ingreso/gasto, campos requeridos faltantes y formatos inválidos
- Preview con tabla de filas válidas (check verde) y erróneas (X roja con mensaje descriptivo)
- Importación parcial: opción de importar solo las filas válidas ignorando las erróneas
- Resumen final con conteo de transacciones importadas y lista de errores omitidos
- Transacciones importadas quedan marcadas con `source: 'import'` en la base de datos
- Cap de 500 filas por archivo con mensaje orientativo al usuario
- Conversión automática de fechas seriales de Excel a formato `YYYY-MM-DD`

## [1.2.0] — 2026-04-18

### Added

**Tasas de cambio automáticas**
- Cron job diario (`/api/cron/update-exchange-rates`) que se ejecuta a las 12 PM Colombia (17:00 UTC)
- Obtiene tasas en tiempo real desde exchangerate-api.com para USD↔COP y USD↔VES
- Calcula automáticamente VES↔COP por regla de tres
- Inserta los 6 pares de conversión en BD compartida para todos los usuarios

**Movimientos entre cuentas mejorados**
- Campos separados por cuenta: monto enviado + moneda origen / monto recibido + moneda destino
- Permite registrar cambios de divisas con montos manuales sin conversión automática
- Tabla de movimientos muestra "Monto enviado" y "Monto recibido" con sus respectivas monedas
- Balances de cuentas se actualizan usando los montos diferenciados por moneda

### Changed

- Settings: formulario manual de tasas de cambio reemplazado por tabla read-only con tasas actuales y fecha de última actualización
- Eliminadas funciones `updateRate()` y `seedInitialRates()` del servidor (ya no necesarias)

### Fixed

- GitHub Actions: permisos `pull-requests: write` agregados al job `deploy-preview` para permitir comentarios de preview URL en PRs

## [1.1.0] — 2026-04-17

### Added

**Cuentas**
- CRUD completo de cuentas bancarias, digitales, crypto y efectivo con ícono, color y moneda propia
- Balance inicial configurable por cuenta
- Tab "Cuentas" en Settings con cards de cuentas y tabla de movimientos
- Movimientos entre cuentas (transferencias) con reversión automática de balances al eliminar
- Cards de cuentas en el dashboard (solo lectura) debajo del resumen financiero
- Balance Total del dashboard ahora refleja la suma de saldos de todas las cuentas

**Transacciones vinculadas a cuentas**
- Selector de cuenta opcional en formulario de creación y edición de transacciones
- Al crear/editar/eliminar una transacción con cuenta asociada, el saldo de la cuenta se actualiza automáticamente via RPC
- El chat IA incluye selector de cuenta en la vista previa antes de confirmar

**Navegación**
- Loader en ítems del nav (sidebar, bottom nav, mobile nav) mientras carga la ruta usando `useTransition`

**UX/UI**
- Todos los modales tienen botón X en la esquina superior derecha
- Ningún modal se cierra al hacer clic fuera — solo con X o botón Cancelar
- Selector de ícono (IconPicker) funciona correctamente dentro y fuera de modales con portal `position: fixed`
- Iconos de categoría visibles en tablas de transacciones recientes, recurrentes y presupuestos
- Grids de cuentas usan `minChildWidth` para layout fluido responsive (no adaptativo)

**IA**
- Transacciones creadas vía chat actualizan la lista inmediatamente (`router.refresh()`)

**Seguridad**
- Auditoría de tokens: documentado que las cookies visibles son exclusivamente tokens estándar de NextAuth (JWE/A256GCM) — `INSFORGE_API_KEY` nunca se expone al cliente

### Fixed
- `TransactionsPageClient`: lista de transacciones no se actualizaba al crear/editar — corregido con `useEffect` sync sobre `initialTransactions`
- Chat móvil: panel del chat solapaba el BottomNav — ajustado `bottom` y altura
- `CategoryEditForm`: se cerraba al hacer clic fuera y no tenía botón X
- `BudgetList`: dialog de confirmación podía cerrarse con clic fuera
- `TransactionCalendar`: dialog de detalle podía cerrarse con clic fuera

## [1.0.0] — 2026-04-17

### Added

**Core**
- CRUD completo de transacciones (ingresos y gastos)
- Sistema de categorías predefinidas y personalizadas con icono y color
- Soporte multi-moneda: COP, USD, VES con conversión en tiempo real
- Autenticación con Google OAuth (NextAuth.js)

**Dashboard**
- Resumen financiero con tarjetas de balance, ingresos y gastos
- Selector de mes para filtrar datos
- Gráfico de tendencia mensual (últimos 6 meses)
- Lista de transacciones recientes

**Funcionalidades avanzadas**
- Sistema de presupuestos por categoría con barra de progreso y alertas
- Metas de ahorro con depósitos incrementales y fecha límite
- Gastos recurrentes (diarios, semanales, mensuales, anuales)
- Cron job automático para generación diaria de recurrentes (`/api/cron/generate-recurring`)
- Sistema de etiquetas para clasificación adicional de transacciones
- Exportación de datos a CSV y JSON con filtros
- Vista de calendario mensual de transacciones
- Reportes con gráficos de comparación mensual y distribución por categoría

**IA**
- Chat conversacional con Claude para registrar gastos en lenguaje natural
- Categorización automática de transacciones
- Interfaz flotante en todas las páginas del dashboard

**UX/UI**
- Diseño dark mode completo
- Mobile-first: bottom navigation bar, card views para listas en mobile
- Lazy loading de componentes pesados (Recharts)
- Debouncing en búsquedas (300ms)
- Prefetching de rutas en navegación
- Vercel Analytics para Core Web Vitals

**Infraestructura**
- Arquitectura server-first con Next.js App Router y Server Components
- Server Actions para todas las mutaciones
- Bundle analyzer (`ANALYZE=true pnpm build`)
- Componentes UI globales reutilizables (`FormDialog`, `DataTable`, `PrimaryButton`, etc.)
