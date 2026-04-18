# Changelog

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
