# 02 - GUÍA DE DEPLOY

## 🚀 Deploy en Vercel (Frontend) + InsForge (Backend)

Esta guía cubre el proceso completo de deploy del proyecto Expense Manager.

---

## 📋 Resumen de Arquitectura

```
┌─────────────────────────────────────┐
│  Usuario                             │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Frontend (Next.js)                  │
│  Deploy: Vercel                      │
│  URL: expense-manager.vercel.app     │
└──────────────┬──────────────────────┘
               │
               │ API Calls
               ▼
┌─────────────────────────────────────┐
│  Backend (InsForge)                  │
│  PostgreSQL + Auth + Storage         │
│  URL: [proyecto].insforge.app        │
└─────────────────────────────────────┘
```

---

## PARTE 1: PRE-DEPLOY (Preparación)

### 1.1. Verificar Build Local

Antes de deployar, asegúrate de que todo funciona localmente:

```bash
# Instalar todas las dependencias
pnpm install

# Build de producción
pnpm build

# Verificar que build fue exitoso
# Deberías ver: "Compiled successfully"

# Probar build
pnpm start

# Abrir http://localhost:3000
# Verificar que todo funciona
```

**Verificar:**

- ✅ No hay errores de TypeScript
- ✅ No hay errores de build
- ✅ La aplicación se ve correcta
- ✅ Todas las funcionalidades funcionan

### 1.2. Verificar Variables de Entorno

Asegúrate de tener un archivo `.env.local.example`:

```env
# NextAuth
NEXTAUTH_URL=
NEXTAUTH_SECRET=

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# InsForge
NEXT_PUBLIC_INSFORGE_URL=
INSFORGE_API_KEY=

# Claude API
ANTHROPIC_API_KEY=
```

**⚠️ NO incluir valores reales en `.env.local.example`**

### 1.3. Actualizar .gitignore

Asegúrate de que `.gitignore` incluye:

```gitignore
# Environment variables
.env
.env.local
.env.*.local
.env.production

# Build
.next/
out/

# Vercel
.vercel
```

### 1.4. Push Final a GitHub

```bash
# Asegurarse de estar en main actualizado
git checkout main
git pull origin main

# Verificar estado
git status

# Si hay cambios pendientes
git add .
git commit -m "chore: prepare for deployment"
git push origin main
```

---

## PARTE 2: CONFIGURAR VERCEL

### 2.1. Crear Cuenta en Vercel

1. Ve a https://vercel.com
2. Click **"Sign Up"**
3. Selecciona **"Continue with GitHub"**
4. Autoriza Vercel en GitHub

### 2.2. Instalar Vercel CLI (opcional pero recomendado)

```bash
# Instalar globalmente
npm install -g vercel

# Verificar
vercel --version

# Login
vercel login
```

### 2.3. Importar Proyecto desde GitHub

**Opción A - Vercel Web (Recomendado para primera vez):**

1. En dashboard de Vercel, click **"Add New Project"**
2. Click **"Import Git Repository"**
3. Selecciona tu repositorio `expense-manager`
4. Click **"Import"**

**Opción B - Vercel CLI:**

```bash
# Desde la raíz del proyecto
cd expense-manager
vercel

# Seleccionar opciones:
# - Set up and deploy? Y
# - Which scope? [tu cuenta]
# - Link to existing project? N
# - Project name: expense-manager
# - Directory: ./
# - Override settings? N
```

### 2.4. Configurar Proyecto en Vercel

#### Framework Preset

Vercel debería detectar automáticamente **Next.js**.

Si no:

- **Framework Preset**: Next.js
- **Build Command**: `next build` (o `pnpm build`)
- **Output Directory**: `.next`
- **Install Command**: `pnpm install`

#### Root Directory

- Dejar en `./` (raíz del proyecto)

---

## PARTE 3: CONFIGURAR VARIABLES DE ENTORNO EN VERCEL

### 3.1. Ir a Settings del Proyecto

1. En tu proyecto de Vercel
2. Click **"Settings"**
3. Click **"Environment Variables"**

### 3.2. Agregar Variables una por una

Para cada variable:

**NEXTAUTH_URL**

- Key: `NEXTAUTH_URL`
- Value: `https://expense-manager.vercel.app` (tu URL de producción)
- Environments: ✅ Production, ✅ Preview, ✅ Development

**NEXTAUTH_SECRET**

- Key: `NEXTAUTH_SECRET`
- Value: [generar con `openssl rand -base64 32`]
- Environments: ✅ Production

**GOOGLE_CLIENT_ID**

- Key: `GOOGLE_CLIENT_ID`
- Value: [tu Client ID de Google]
- Environments: ✅ Production, ✅ Preview

**GOOGLE_CLIENT_SECRET**

- Key: `GOOGLE_CLIENT_SECRET`
- Value: [tu Client Secret de Google]
- Environments: ✅ Production, ✅ Preview

**NEXT_PUBLIC_INSFORGE_URL**

- Key: `NEXT_PUBLIC_INSFORGE_URL`
- Value: `https://[tu-proyecto].us-east.insforge.app`
- Environments: ✅ Production, ✅ Preview, ✅ Development

**INSFORGE_API_KEY**

- Key: `INSFORGE_API_KEY`
- Value: `if_live_xxxxxxxxx`
- Environments: ✅ Production, ✅ Preview

**ANTHROPIC_API_KEY**

- Key: `ANTHROPIC_API_KEY`
- Value: `sk-ant-xxxxx`
- Environments: ✅ Production, ✅ Preview

### 3.3. Guardar Cambios

Click **"Save"** después de agregar todas las variables.

---

## PARTE 4: ACTUALIZAR GOOGLE OAUTH REDIRECT URIS

### 4.1. Obtener URL de Vercel

Después del primer deploy, Vercel te dará una URL:

```
https://expense-manager.vercel.app
```

O una preview URL como:

```
https://expense-manager-xyz123.vercel.app
```

### 4.2. Agregar URLs a Google Cloud Console

1. Ve a https://console.cloud.google.com
2. Selecciona tu proyecto
3. Ve a **"APIs & Services" > "Credentials"**
4. Click en tu OAuth Client ID
5. En **"Authorized redirect URIs"**, agregar:

```
https://expense-manager.vercel.app/api/auth/callback/google
https://expense-manager-xyz123.vercel.app/api/auth/callback/google
```

6. Click **"Save"**

---

## PARTE 5: PRIMER DEPLOY

### 5.1. Deploy Automático desde GitHub

Vercel deployará automáticamente cuando:

- Hagas push a `main` (deploy de producción)
- Hagas push a cualquier otra rama (deploy de preview)
- Abras un PR (deploy de preview para el PR)

### 5.2. Deploy Manual (CLI)

```bash
# Deploy a producción
vercel --prod

# Deploy a preview
vercel
```

### 5.3. Monitorear el Deploy

1. Ve a https://vercel.com/[tu-usuario]/expense-manager
2. Click en el deployment más reciente
3. Verás:
   - **Building**: Compilando el proyecto
   - **Deployment**: Desplegando
   - **Ready**: Listo

### 5.4. Verificar Logs

Si hay errores:

1. Click en el deployment
2. Ve a **"Functions"** o **"Build Logs"**
3. Revisa los errores

**Errores comunes:**

- Falta una variable de entorno
- Error de TypeScript no detectado localmente
- Dependencia faltante en package.json

---

## PARTE 6: CONFIGURAR DOMINIO CUSTOM (Opcional)

### 6.1. Si tienes un dominio

1. En Vercel project settings
2. Ve a **"Domains"**
3. Click **"Add"**
4. Ingresa tu dominio: `expense.tudominio.com`
5. Click **"Add"**

### 6.2. Configurar DNS

Vercel te dará instrucciones para configurar:

**CNAME Record:**

```
Host: expense
Value: cname.vercel-dns.com
```

O **A Record:**

```
Host: @
Value: 76.76.21.21
```

### 6.3. Actualizar Variables de Entorno

Actualiza `NEXTAUTH_URL` con tu dominio custom:

```
https://expense.tudominio.com
```

### 6.4. Actualizar Google OAuth

Agrega redirect URI con tu dominio:

```
https://expense.tudominio.com/api/auth/callback/google
```

---

## PARTE 7: CONFIGURAR DEPLOY AUTOMÁTICO

### 7.1. Branches y Deploy

**Configuración recomendada:**

- `main` → Deploy de **Producción**
- `develop` → Deploy de **Preview**
- `feature/*` → Deploy de **Preview**

### 7.2. Configurar en Vercel

1. Settings del proyecto
2. **"Git"**
3. **Production Branch**: `main`
4. ✅ **Auto-deploy**: Enabled
5. ✅ **Preview Deployments**: All branches

### 7.3. Proteger Rama Main

En GitHub:

1. Ve a Settings del repositorio
2. **"Branches"**
3. **"Branch protection rules"**
4. Agregar regla para `main`:
   - ✅ Require pull request reviews
   - ✅ Require status checks to pass (Vercel)
   - Número de reviews: 1
5. Save

---

## PARTE 8: VERIFICAR DEPLOYMENT

### 8.1. Checklist de Verificación

Abre tu URL de producción y verifica:

- [ ] ✅ La página carga correctamente
- [ ] ✅ Login con Google funciona
- [ ] ✅ Dashboard se muestra
- [ ] ✅ Puedes crear transacciones
- [ ] ✅ Gráficos se renderizan
- [ ] ✅ Chat de IA funciona
- [ ] ✅ Conversión de monedas funciona
- [ ] ✅ Responsive en móvil
- [ ] ✅ No hay errores en consola del navegador

### 8.2. Verificar Performance

1. Ve a tu deployment en Vercel
2. Click **"Analytics"** (si está disponible)
3. Verifica:
   - Tiempo de carga
   - Core Web Vitals
   - Errores

### 8.3. Verificar Logs

```bash
# Ver logs en tiempo real (CLI)
vercel logs

# Ver logs de producción
vercel logs --prod

# Ver logs de función específica
vercel logs [función]
```

---

## PARTE 9: INSFORGE - CONFIGURACIÓN DE PRODUCCIÓN

### 9.1. Verificar Backend en Producción

1. Ve a https://insforge.dev/dashboard
2. Selecciona tu proyecto
3. Verifica estado:
   - Database: Running ✅
   - Storage: Running ✅
   - Functions: Running ✅

### 9.2. Verificar RLS Policies

1. En InsForge dashboard
2. Ve a **"Database"**
3. Click en cada tabla
4. Verifica que las RLS policies estén activas

### 9.3. Monitorear Uso

1. En InsForge dashboard
2. Ve a **"Usage"**
3. Verifica:
   - Database size
   - Monthly Active Users (MAU)
   - Bandwidth
   - Storage

**Límites del plan gratuito:**

- 500 MB database
- 50,000 MAU
- 5 GB bandwidth
- 1 GB storage

---

## PARTE 10: CI/CD Y AUTOMATIZACIÓN

### 10.1. Deploy Automático en cada Push

Ya configurado con Vercel + GitHub:

```
git push origin main
  ↓
GitHub detecta push
  ↓
Vercel inicia build
  ↓
Deploy a producción
  ↓
URL actualizada
```

### 10.2. Preview Deployments en PRs

Cuando abres un PR:

1. Vercel crea deployment de preview
2. Te da una URL única
3. Puedes probar los cambios antes de merge

### 10.3. GitHub Actions (opcional)

Crear `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  pull_request:
    branches: [develop, main]

jobs:
  lint-and-type-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Lint
        run: pnpm lint

      - name: Type check
        run: pnpm type-check

      - name: Build
        run: pnpm build
```

---

## PARTE 11: ROLLBACK Y TROUBLESHOOTING

### 11.1. Rollback a Versión Anterior

Si algo falla en producción:

**Opción A - Vercel Dashboard:**

1. Ve a **"Deployments"**
2. Encuentra el deployment anterior que funcionaba
3. Click en los tres puntos **"..."**
4. Click **"Promote to Production"**

**Opción B - CLI:**

```bash
vercel rollback
```

### 11.2. Problemas Comunes

**Error: Environment variable not found**

- Solución: Agrega la variable en Vercel Settings
- Redeploy

**Error: Google OAuth redirect URI mismatch**

- Solución: Verifica que agregaste la URL en Google Cloud Console
- Verifica que `NEXTAUTH_URL` sea correcta

**Error: Cannot connect to InsForge**

- Solución: Verifica `NEXT_PUBLIC_INSFORGE_URL`
- Verifica `INSFORGE_API_KEY`
- Verifica que InsForge backend esté running

**Error: Build failed**

- Revisa los logs de build en Vercel
- Verifica que `pnpm build` funcione localmente
- Verifica dependencias en `package.json`

### 11.3. Debugging en Producción

```bash
# Ver logs
vercel logs --prod

# Ver logs con filtro
vercel logs --prod | grep "ERROR"

# Ver logs de una función específica
vercel logs api/transactions
```

---

## PARTE 12: MONITOREO Y MANTENIMIENTO

### 12.1. Configurar Alertas (opcional)

**Vercel Pro tier:**

- Alertas por email
- Alertas de performance
- Alertas de errores

**Alternativa gratuita - UptimeRobot:**

1. Crea cuenta en https://uptimerobot.com
2. Agrega monitor HTTP(S)
3. URL: `https://expense-manager.vercel.app`
4. Interval: 5 minutes
5. Recibirás emails si el sitio está down

### 12.2. Analytics

**Vercel Analytics (gratis):**

- Web Vitals
- Real User Monitoring
- Pageviews

**Google Analytics (opcional):**

1. Crear propiedad en GA4
2. Obtener Measurement ID
3. Agregar a Next.js

### 12.3. Error Tracking con Sentry (opcional)

```bash
pnpm add @sentry/nextjs
```

Configurar `sentry.client.config.js` y `sentry.server.config.js`.

---

## PARTE 13: CHECKLIST FINAL DE DEPLOY

### Pre-Deploy

- [ ] ✅ Build local exitoso
- [ ] ✅ .gitignore configurado
- [ ] ✅ Variables de entorno documentadas
- [ ] ✅ Todo pusheado a GitHub

### Vercel

- [ ] ✅ Proyecto creado en Vercel
- [ ] ✅ Conectado con GitHub
- [ ] ✅ Variables de entorno configuradas
- [ ] ✅ Auto-deploy configurado

### Google OAuth

- [ ] ✅ Redirect URIs actualizados
- [ ] ✅ Authorized origins actualizados

### InsForge

- [ ] ✅ Backend running
- [ ] ✅ Database accessible
- [ ] ✅ RLS policies activas

### Verificación

- [ ] ✅ Deploy exitoso
- [ ] ✅ Login funciona
- [ ] ✅ CRUD de transacciones funciona
- [ ] ✅ Gráficos renderizan
- [ ] ✅ Chat IA funciona
- [ ] ✅ Responsive en móvil
- [ ] ✅ No errores en consola

---

## 📞 Recursos Útiles

- **Vercel Docs**: https://vercel.com/docs
- **Next.js Deploy**: https://nextjs.org/docs/deployment
- **InsForge Docs**: https://docs.insforge.dev
- **Vercel Status**: https://www.vercel-status.com
- **InsForge Status**: https://insforge.status.io

---

## 🎉 ¡Deploy Completado!

Si llegaste aquí con todos los checkmarks ✅, ¡felicidades! Tu aplicación está en producción.

**URLs Importantes:**

- Frontend: `https://expense-manager.vercel.app`
- Backend: `https://[proyecto].us-east.insforge.app`
- GitHub: `https://github.com/[usuario]/expense-manager`

---

**Próximos pasos:** Monitorear uso, agregar features, iterar basado en feedback.

¡Buen trabajo! 🚀
