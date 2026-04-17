# Changelog

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
