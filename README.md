# Expense Manager

Sistema de gestión de finanzas personales con IA integrada.

## Características

- Registro de gastos e ingresos
- Categorización automática con IA
- Conversión de monedas (BOB, COP, USD)
- Visualización de datos con gráficos
- Chat para registro conversacional
- Diseño responsive

## Stack Tecnológico

### Frontend

- **Framework**: Next.js 16+ (App Router)
- **Lenguaje**: TypeScript
- **UI**: Chakra UI
- **Autenticación**: NextAuth.js
- **Gráficos**: Recharts
- **Validación**: Zod

### Backend

- **Platform**: InsForge
- **Database**: PostgreSQL
- **Auth**: JWT
- **Storage**: S3-compatible
- **Functions**: Edge Functions

### IA

- **Provider**: Anthropic Claude
- **Modelo**: Claude Sonnet 4.5

## Prerequisitos

- Node.js 18.17 o superior
- pnpm 8.x o superior
- Cuenta de InsForge
- Cuenta de Google Cloud (OAuth)
- API Key de Anthropic

## Instalación

```bash
# Clonar repositorio
git clone https://github.com/Sanghel/expense-manager.git
cd expense-manager

# Instalar dependencias
pnpm install

# Configurar variables de entorno
cp .env.local.example .env.local
# Editar .env.local con tus credenciales

# Ejecutar en desarrollo
pnpm dev
```

Abrir [http://localhost:3000](http://localhost:3000)

## Variables de Entorno

Crea un archivo `.env.local` con las siguientes variables:

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<generar-con-openssl-rand-base64-32>

# Google OAuth
GOOGLE_CLIENT_ID=<tu-client-id>.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-<tu-secret>

# InsForge Backend
NEXT_PUBLIC_INSFORGE_URL=https://<tu-proyecto>.us-east.insforge.app
INSFORGE_API_KEY=if_live_<tu-api-key>

# Claude API (para funcionalidad de IA)
ANTHROPIC_API_KEY=sk-ant-<tu-key>
```

Ver `.env.local.example` para referencia completa.

## Deploy

El proyecto está configurado para deploy automático en Vercel.

## Documentación

- [Plan de Trabajo](./plan-v1/)
- [Flujo Git/GitHub](./rules/github-flow.md)
- [Guía de Deploy](./rules/deploy-guide.md)

## Licencia

MIT

---

**Nota**: Proyecto en desarrollo activo.
