# Changelog

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
