# Expense Manager

Sistema de gestión de finanzas personales con IA integrada, soporte multi-moneda y análisis de gastos.

## Características

- **Transacciones** — CRUD completo de ingresos y gastos con categorización
- **IA Conversacional** — Chat con Claude para registrar gastos en lenguaje natural
- **Multi-moneda** — Soporte COP, USD, VES con conversión en tiempo real
- **Dashboard** — Resumen financiero con gráficos de tendencia mensual
- **Presupuestos** — Seguimiento de límites de gasto por categoría
- **Metas de Ahorro** — Objetivos con barra de progreso y depósitos
- **Gastos Recurrentes** — Suscripciones y pagos periódicos con generación automática vía cron
- **Etiquetas** — Sistema de tags para clasificación adicional
- **Exportación** — CSV y JSON con filtros personalizados
- **Calendario** — Vista mensual de transacciones
- **Mobile-first** — Bottom navigation, card views y experiencia nativa en móvil
- **Autenticación** — Google OAuth con NextAuth.js

## Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16 (App Router, Server Components) |
| Lenguaje | TypeScript |
| UI | Chakra UI v3 |
| Autenticación | NextAuth.js v4 |
| Base de datos | InsForge (PostgreSQL) |
| IA | Anthropic Claude (claude-sonnet-4-5) |
| Gráficos | Recharts |
| Validación | Zod |
| Deploy | Vercel |
| Animaciones | Framer Motion |

## Prerequisitos

- Node.js 20+
- pnpm 8+
- Cuenta en [InsForge](https://insforge.dev)
- Proyecto OAuth en [Google Cloud Console](https://console.cloud.google.com)
- API Key de [Anthropic](https://console.anthropic.com)

## Instalación

```bash
# 1. Clonar repositorio
git clone https://github.com/Sanghel/expense-manager.git
cd expense-manager

# 2. Instalar dependencias
pnpm install

# 3. Variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales

# 4. Iniciar en desarrollo
pnpm dev
```

Abrir [http://localhost:3000](http://localhost:3000)

## Variables de Entorno

```env
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=                    # openssl rand -base64 32

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# InsForge
NEXT_PUBLIC_INSFORGE_URL=           # https://<proyecto>.us-east.insforge.app
NEXT_PUBLIC_INSFORGE_ANON_KEY=      # clave pública (cliente)
INSFORGE_API_KEY=                   # clave privada (servidor, bypassa RLS)

# Anthropic (chat IA)
ANTHROPIC_API_KEY=

# Cron job (generación de recurrentes)
CRON_SECRET=                        # openssl rand -hex 32
```

Ver [`.env.example`](./.env.example) para referencia completa.

## Scripts

```bash
pnpm dev          # Servidor de desarrollo
pnpm build        # Build de producción
pnpm start        # Servidor de producción
pnpm lint         # ESLint
ANALYZE=true pnpm build   # Análisis de bundle
```

## Arquitectura

```
app/
  (dashboard)/      # Rutas protegidas del dashboard
  api/
    auth/           # NextAuth handlers
    cron/           # Cron jobs (generación de recurrentes)
  login/            # Página de autenticación
components/
  dashboard/        # Layout, Header, Sidebar, BottomNav
  transactions/     # CRUD + card mobile view
  budgets/          # Presupuestos
  savings/          # Metas de ahorro
  recurring/        # Transacciones recurrentes
  charts/           # Gráficos Recharts
  chat/             # Interfaz de chat IA
  ui/               # Componentes globales reutilizables
hooks/              # useFinancialSummary, useDebounce
lib/
  actions/          # Server Actions (una por módulo)
  validations/      # Schemas Zod
types/              # Tipos TypeScript compartidos
```

## Cron Jobs

El proyecto incluye un cron job que se ejecuta diariamente a las **00:00 COT** (05:00 UTC):

```
GET /api/cron/generate-recurring
Authorization: Bearer <CRON_SECRET>
```

Genera automáticamente las transacciones recurrentes cuya fecha de ejecución haya llegado.

Configurado en `vercel.json`:
```json
{ "crons": [{ "path": "/api/cron/generate-recurring", "schedule": "0 5 * * *" }] }
```

## Deploy

Push a `main` dispara deploy automático en Vercel.

Variables requeridas en Vercel → Settings → Environment Variables: ver sección anterior.

## Contribuir

Ver [CONTRIBUTING.md](./CONTRIBUTING.md).

## Licencia

MIT — ver [LICENSE](./LICENSE).

## Autor

**Sanghel González**
- GitHub: [@Sanghel](https://github.com/Sanghel)
