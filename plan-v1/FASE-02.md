# FASE 02: Configuración de InsForge + NextAuth

## 🎯 Objetivo de la Fase

Conectar el frontend con InsForge (backend), implementar autenticación con NextAuth.js y Google OAuth, y crear el sistema de whitelist de emails.

**Resultado esperado:** Login funcional con Google OAuth, verificación de whitelist, y conexión establecida con InsForge.

---

## ⚠️ Pre-requisitos

- ✅ FASE 01 completada y mergeada a `main`
- ✅ Variables de entorno del archivo 00-SETUP-MANUAL.md preparadas
- ✅ Google OAuth configurado
- ✅ Proyecto de InsForge creado

---

## 📋 Inicio de Fase

```bash
# Asegurarse de estar en develop actualizado
git checkout develop
git pull origin develop

# Crear issue de fase
gh issue create \
  --title "FASE 02: Configuración de InsForge + NextAuth" \
  --body "## Objetivo
Implementar autenticación con NextAuth.js, Google OAuth, y conexión con InsForge.

## Tareas
- [ ] Tarea 2.1: Configurar cliente de InsForge
- [ ] Tarea 2.2: Crear archivo de configuración de NextAuth
- [ ] Tarea 2.3: Implementar API route de NextAuth
- [ ] Tarea 2.4: Crear provider de sesión
- [ ] Tarea 2.5: Implementar página de login
- [ ] Tarea 2.6: Crear middleware de autenticación
- [ ] Tarea 2.7: Implementar verificación de whitelist
- [ ] Tarea 2.8: Crear tipos TypeScript de sesión
- [ ] Tarea 2.9: Agregar variables de entorno
- [ ] Tarea 2.10: Testing de autenticación

## Criterios de Aceptación
- Login con Google funciona
- Whitelist verifica emails correctamente
- Sesión persiste después de login
- Rutas protegidas funcionan"
```

**📝 Anotar número de issue** (ejemplo: #8)

---

## 📝 Tareas de la Fase

### Tarea 2.1: Configurar cliente de InsForge

**Issue:** "Configurar cliente de InsForge (Supabase)"

```bash
git checkout develop
git pull origin develop
git checkout -b feature/9-insforge-client
```

**Desarrollo:**

1. Crear `lib/insforge.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'

if (!process.env.NEXT_PUBLIC_INSFORGE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_INSFORGE_URL')
}
if (!process.env.INSFORGE_API_KEY) {
  throw new Error('Missing env.INSFORGE_API_KEY')
}

export const insforge = createClient(
  process.env.NEXT_PUBLIC_INSFORGE_URL,
  process.env.INSFORGE_API_KEY,
  {
    auth: {
      persistSession: false, // NextAuth maneja la sesión
    },
  }
)

// Helper para verificar conexión
export async function testInsforgeConnection() {
  try {
    const { error } = await insforge.from('users').select('count').single()
    if (error && error.code !== 'PGRST116') {
      // PGRST116 = tabla no existe aún (esperado)
      throw error
    }
    return true
  } catch (error) {
    console.error('InsForge connection failed:', error)
    return false
  }
}
```

2. Crear archivo `.env.local`:

```env
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here-generate-with-openssl

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret

# InsForge
NEXT_PUBLIC_INSFORGE_URL=https://your-project.us-east.insforge.app
INSFORGE_API_KEY=if_live_your_api_key

# Claude API (usaremos más adelante)
ANTHROPIC_API_KEY=your-anthropic-key
```

**⚠️ Nota:** Usa tus credenciales reales del archivo 00-SETUP-MANUAL.md

**Generar NEXTAUTH_SECRET:**

```bash
openssl rand -base64 32
```

3. Actualizar `.gitignore` (verificar que existe):

```gitignore
.env
.env.local
.env.*.local
```

**Verificar conexión (crear script temporal):**

Crear `scripts/test-insforge.ts`:

```typescript
import { testInsforgeConnection } from '../lib/insforge'

async function test() {
  console.log('Testing InsForge connection...')
  const result = await testInsforgeConnection()
  console.log('Connection:', result ? '✅ Success' : '❌ Failed')
}

test()
```

```bash
# Ejecutar test
npx tsx scripts/test-insforge.ts
```

**Commit y PR:**

```bash
git add .
git commit -m "feat: configure InsForge client"
git push -u origin feature/9-insforge-client

gh pr create \
  --base develop \
  --title "Configure InsForge client" \
  --body "- Created InsForge client with Supabase SDK
- Added connection test helper
- Created .env.local template

Closes #9"

gh pr merge --squash
git checkout develop
git pull
git branch -d feature/9-insforge-client
```

---

### Tarea 2.2: Crear archivo de configuración de NextAuth

**Issue:** "Crear configuración de NextAuth"

```bash
git checkout develop
git pull
git checkout -b feature/10-nextauth-config
```

**Desarrollo:**

1. Crear `lib/auth.ts`:

```typescript
import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { insforge } from './insforge'

if (!process.env.GOOGLE_CLIENT_ID) {
  throw new Error('Missing GOOGLE_CLIENT_ID')
}
if (!process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error('Missing GOOGLE_CLIENT_SECRET')
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Verificar si el email está en la whitelist
      if (!user.email) {
        return false
      }

      try {
        // Buscar en tabla de whitelist (la crearemos en FASE 03)
        // Por ahora, permitir cualquier email para testing
        console.log('User attempting to sign in:', user.email)

        // TODO: En FASE 03 implementaremos la verificación real:
        // const { data } = await insforge
        //   .from('whitelist')
        //   .select('email')
        //   .eq('email', user.email)
        //   .single()
        //
        // if (!data) {
        //   return false // Email no está en whitelist
        // }

        return true
      } catch (error) {
        console.error('SignIn error:', error)
        return false
      }
    },
    async session({ session, token }) {
      // Agregar info adicional a la sesión
      if (session.user) {
        session.user.id = token.sub as string
      }
      return session
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
}
```

2. Crear tipos extendidos de NextAuth en `types/next-auth.d.ts`:

```typescript
import 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
    }
  }
}
```

**Commit y PR:**

```bash
git add .
git commit -m "feat: create NextAuth configuration"
git push -u origin feature/10-nextauth-config

gh pr create \
  --base develop \
  --title "Create NextAuth configuration" \
  --body "- NextAuth config with Google provider
- Extended session types
- Placeholder for whitelist verification

Closes #10"

gh pr merge --squash
git checkout develop
git pull
git branch -d feature/10-nextauth-config
```

---

### Tarea 2.3: Implementar API route de NextAuth

**Issue:** "Crear API route para NextAuth"

```bash
git checkout develop
git pull
git checkout -b feature/11-nextauth-api-route
```

**Desarrollo:**

Crear `app/api/auth/[...nextauth]/route.ts`:

```typescript
import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
```

**Verificar que funciona:**

```bash
pnpm dev
```

Abrir: http://localhost:3000/api/auth/signin

Deberías ver la página de sign in de NextAuth.

**Commit y PR:**

```bash
git add .
git commit -m "feat: create NextAuth API route"
git push -u origin feature/11-nextauth-api-route

gh pr create \
  --base develop \
  --title "Create NextAuth API route" \
  --body "Closes #11"

gh pr merge --squash
git checkout develop
git pull
git branch -d feature/11-nextauth-api-route
```

---

### Tarea 2.4: Crear provider de sesión

**Issue:** "Crear SessionProvider para la aplicación"

```bash
git checkout develop
git pull
git checkout -b feature/12-session-provider
```

**Desarrollo:**

1. Crear `components/providers/SessionProvider.tsx`:

```typescript
'use client'

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react'
import { ReactNode } from 'react'

interface Props {
  children: ReactNode
}

export function SessionProvider({ children }: Props) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>
}
```

2. Actualizar `app/layout.tsx`:

```typescript
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { SessionProvider } from '@/components/providers/SessionProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Expense Manager',
  description: 'Sistema de gestión de finanzas personales',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  )
}
```

**Commit y PR:**

```bash
git add .
git commit -m "feat: add SessionProvider to app layout"
git push -u origin feature/12-session-provider

gh pr create \
  --base develop \
  --title "Add SessionProvider to app layout" \
  --body "Closes #12"

gh pr merge --squash
git checkout develop
git pull
git branch -d feature/12-session-provider
```

---

### Tarea 2.5: Implementar página de login

**Issue:** "Crear página de login"

```bash
git checkout develop
git pull
git checkout -b feature/13-login-page
```

**Desarrollo:**

Crear `app/login/page.tsx`:

```typescript
'use client'

import { signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'

export default function LoginPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900">
            Expense Manager
          </h1>
          <p className="mt-2 text-gray-600">
            Gestión de finanzas personales
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error === 'AccessDenied' && (
              <p>
                Tu email no tiene acceso. Contacta al administrador.
              </p>
            )}
            {error !== 'AccessDenied' && (
              <p>Ocurrió un error. Intenta nuevamente.</p>
            )}
          </div>
        )}

        <button
          onClick={() => signIn('google', { callbackUrl: '/' })}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span className="text-gray-700 font-medium">
            Continuar con Google
          </span>
        </button>

        <p className="text-center text-sm text-gray-500">
          Solo usuarios autorizados pueden acceder
        </p>
      </div>
    </div>
  )
}
```

**Probar:**

```bash
pnpm dev
```

Ir a: http://localhost:3000/login

**Commit y PR:**

```bash
git add .
git commit -m "feat: create login page with Google OAuth button"
git push -u origin feature/13-login-page

gh pr create \
  --base develop \
  --title "Create login page with Google OAuth button" \
  --body "Closes #13"

gh pr merge --squash
git checkout develop
git pull
git branch -d feature/13-login-page
```

---

### Tarea 2.6: Crear middleware de autenticación

**Issue:** "Implementar middleware para proteger rutas"

```bash
git checkout develop
git pull
git checkout -b feature/14-auth-middleware
```

**Desarrollo:**

Crear `middleware.ts` en la raíz:

```typescript
import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: '/login',
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - /login (login page)
     * - /api/auth (NextAuth API routes)
     * - /_next (Next.js internals)
     * - /favicon.ico, /robots.txt (static files)
     */
    '/((?!login|api/auth|_next|favicon.ico|robots.txt).*)',
  ],
}
```

**Probar:**

```bash
pnpm dev
```

1. Ir a http://localhost:3000
2. Debería redirigir a /login
3. Hacer login con Google
4. Debería redirigir de vuelta a /

**Commit y PR:**

```bash
git add .
git commit -m "feat: implement auth middleware to protect routes"
git push -u origin feature/14-auth-middleware

gh pr create \
  --base develop \
  --title "Implement auth middleware to protect routes" \
  --body "Closes #14"

gh pr merge --squash
git checkout develop
git pull
git branch -d feature/14-auth-middleware
```

---

### Tarea 2.7: Implementar verificación de whitelist (placeholder)

**Issue:** "Agregar placeholder para verificación de whitelist"

```bash
git checkout develop
git pull
git checkout -b feature/15-whitelist-placeholder
```

**Desarrollo:**

Actualizar `lib/auth.ts` para agregar logging:

```typescript
// ... resto del código ...

callbacks: {
  async signIn({ user, account, profile }) {
    if (!user.email) {
      console.log('❌ SignIn rejected: No email')
      return false
    }

    console.log('👤 User attempting sign in:', user.email)

    // TODO FASE 03: Implementar verificación real de whitelist
    // Por ahora, permitir todos los emails
    // En FASE 03 crearemos la tabla whitelist en InsForge

    console.log('✅ SignIn allowed (whitelist check pending FASE 03)')
    return true
  },
  // ... resto de callbacks ...
},
```

Crear archivo de documentación `docs/WHITELIST.md`:

```markdown
# Sistema de Whitelist

## Estado Actual (FASE 02)

- ✅ Estructura de autenticación implementada
- ⏳ Verificación de whitelist: PENDIENTE (FASE 03)

## Implementación Pendiente (FASE 03)

En la FASE 03 se implementará:

1. Tabla `whitelist` en InsForge
2. Seed de emails autorizados
3. Verificación real en signIn callback
4. UI para gestionar whitelist (opcional)

## Emails Autorizados Iniciales
```

tu-email@gmail.com
otro-email@example.com

```

Estos emails se agregarán en el seed de FASE 03.
```

**Commit y PR:**

```bash
git add .
git commit -m "docs: add whitelist placeholder and documentation"
git push -u origin feature/15-whitelist-placeholder

gh pr create \
  --base develop \
  --title "Add whitelist placeholder and documentation" \
  --body "Closes #15"

gh pr merge --squash
git checkout develop
git pull
git branch -d feature/15-whitelist-placeholder
```

---

### Tarea 2.8: Mejorar homepage con info de sesión

**Issue:** "Mostrar información de usuario en homepage"

```bash
git checkout develop
git pull
git checkout -b feature/16-homepage-session
```

**Desarrollo:**

Actualizar `app/page.tsx`:

```typescript
'use client'

import { useSession, signOut } from 'next-auth/react'

export default function Home() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <main className="min-h-screen p-8">
        <p>Cargando...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold">Expense Manager</h1>
            <p className="mt-2 text-gray-600">
              Sistema de gestión de finanzas personales
            </p>
          </div>
          {session && (
            <button
              onClick={() => signOut()}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Cerrar Sesión
            </button>
          )}
        </div>

        {session?.user && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">
              Sesión Iniciada
            </h2>
            <div className="space-y-2">
              <p>
                <strong>Nombre:</strong> {session.user.name}
              </p>
              <p>
                <strong>Email:</strong> {session.user.email}
              </p>
              {session.user.image && (
                <img
                  src={session.user.image}
                  alt="Avatar"
                  className="w-16 h-16 rounded-full mt-4"
                />
              )}
            </div>
            <p className="mt-4 text-sm text-gray-500">
              ✅ Autenticación funcional con NextAuth + Google OAuth
            </p>
          </div>
        )}

        <div className="mt-8 bg-blue-50 p-6 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">
            FASE 02 Completada
          </h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✅ InsForge configurado</li>
            <li>✅ NextAuth implementado</li>
            <li>✅ Google OAuth funcionando</li>
            <li>✅ Middleware de autenticación activo</li>
            <li>⏳ Whitelist pendiente (FASE 03)</li>
          </ul>
        </div>
      </div>
    </main>
  )
}
```

**Probar:**

```bash
pnpm dev
```

1. Login con Google
2. Ver información de sesión
3. Probar botón de cerrar sesión

**Commit y PR:**

```bash
git add .
git commit -m "feat: display session info on homepage"
git push -u origin feature/16-homepage-session

gh pr create \
  --base develop \
  --title "Display session info on homepage" \
  --body "Closes #16"

gh pr merge --squash
git checkout develop
git pull
git branch -d feature/16-homepage-session
```

---

### Tarea 2.9: Documentar variables de entorno

**Issue:** "Actualizar documentación de variables de entorno"

```bash
git checkout develop
git pull
git checkout -b feature/17-env-docs
```

**Desarrollo:**

Actualizar `README.md`:

````markdown
## 🔑 Variables de Entorno Requeridas

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
````

### Obtener Credenciales

Ver [00-SETUP-MANUAL.md](./docs/00-SETUP-MANUAL.md) para instrucciones detalladas.

**Resumen:**

- **Google OAuth**: Google Cloud Console > APIs & Services > Credentials
- **InsForge**: InsForge Dashboard > Settings > API
- **Anthropic**: https://console.anthropic.com > API Keys

````

**Commit y PR:**

```bash
git add .
git commit -m "docs: update environment variables documentation"
git push -u origin feature/17-env-docs

gh pr create \
  --base develop \
  --title "Update environment variables documentation" \
  --body "Closes #17"

gh pr merge --squash
git checkout develop
git pull
git branch -d feature/17-env-docs
````

---

### Tarea 2.10: Testing completo de autenticación

**Issue:** "Verificar funcionamiento completo de autenticación"

**Checklist de Testing:**

```bash
# Asegurarse de estar en develop
git checkout develop
git pull

# Limpiar y reinstalar
rm -rf node_modules .next
pnpm install

# Build de producción
pnpm build

# Ejecutar en dev
pnpm dev
```

**Tests manuales:**

1. **Test de Login:**
   - [ ] Ir a http://localhost:3000
   - [ ] Redirige a /login
   - [ ] Click en "Continuar con Google"
   - [ ] Login exitoso
   - [ ] Redirige a /
   - [ ] Muestra información de usuario

2. **Test de Sesión:**
   - [ ] Refrescar la página
   - [ ] Sesión persiste (no vuelve a /login)
   - [ ] Información de usuario sigue visible

3. **Test de Logout:**
   - [ ] Click en "Cerrar Sesión"
   - [ ] Sesión se cierra
   - [ ] Redirige a /login

4. **Test de Rutas Protegidas:**
   - [ ] Sin sesión, ir a http://localhost:3000
   - [ ] Redirige a /login
   - [ ] Con sesión, acceso a /

5. **Test de Variables de Entorno:**
   - [ ] Verificar que todas las variables están configuradas
   - [ ] No hay errores de "Missing env variable"

**Documentar resultados:**

Crear issue con resultados:

```bash
gh issue create \
  --title "Testing Results - FASE 02 Authentication" \
  --label "testing" \
  --body "## Testing Results

### Login Flow
- [x] Redirect to /login works
- [x] Google OAuth works
- [x] Successful login redirects to /

### Session Management
- [x] Session persists on refresh
- [x] User info displays correctly
- [x] Logout works

### Route Protection
- [x] Protected routes redirect to /login
- [x] Authenticated users can access protected routes

### Environment Variables
- [x] All variables configured correctly
- [x] No missing env errors

## Status
✅ All tests passed - FASE 02 ready for merge to main"
```

---

## 🎯 Fin de Fase 2

### Verificación Final

```bash
git checkout develop
git pull

# Build sin errores
pnpm build

# Lint sin errores
pnpm lint

# Type check sin errores
pnpm type-check
```

**Checklist Final:**

- [ ] ✅ Cliente de InsForge configurado
- [ ] ✅ NextAuth configurado
- [ ] ✅ API route de NextAuth funcionando
- [ ] ✅ SessionProvider implementado
- [ ] ✅ Página de login creada
- [ ] ✅ Middleware de autenticación activo
- [ ] ✅ Login con Google funciona
- [ ] ✅ Sesión persiste
- [ ] ✅ Logout funciona
- [ ] ✅ Rutas protegidas funcionan
- [ ] ✅ Variables de entorno documentadas
- [ ] ✅ Build exitoso

---

### Crear PR Final de Fase

```bash
gh pr create \
  --base main \
  --head develop \
  --title "FASE 02: Configuración de InsForge + NextAuth" \
  --body "## Resumen
Implementación completa de autenticación con NextAuth.js, Google OAuth, y conexión con InsForge.

## Tareas Completadas
- [x] Tarea 2.1: Configurar cliente de InsForge (#9)
- [x] Tarea 2.2: Crear configuración de NextAuth (#10)
- [x] Tarea 2.3: Implementar API route de NextAuth (#11)
- [x] Tarea 2.4: Crear provider de sesión (#12)
- [x] Tarea 2.5: Implementar página de login (#13)
- [x] Tarea 2.6: Crear middleware de autenticación (#14)
- [x] Tarea 2.7: Placeholder para whitelist (#15)
- [x] Tarea 2.8: Homepage con info de sesión (#16)
- [x] Tarea 2.9: Documentar variables de entorno (#17)
- [x] Tarea 2.10: Testing completo

## Funcionalidades
✅ Login con Google OAuth
✅ Sesión persistente
✅ Rutas protegidas
✅ Logout
✅ Conexión con InsForge establecida

## Pendiente para FASE 03
- Implementar verificación real de whitelist
- Crear tabla whitelist en InsForge
- Seed de emails autorizados

Closes #8"
```

---

### ⚠️ CHECKPOINT - Requiere Aprobación Manual

**🛑 DETENER DESARROLLO**

**📢 NOTIFICAR:**

```
FASE 02 completada y lista para revisión.
PR #[número] creado: develop → main
Autenticación con Google OAuth funcionando.
Conexión con InsForge establecida.
Esperando aprobación para continuar con FASE 03.
```

**⏸️ ESPERAR APROBACIÓN**

---

### Después de Aprobación

```bash
gh pr merge [número] --merge
git checkout develop
git pull origin develop
gh issue close 8

# ✅ Listo para FASE 03
```

---

**¡FASE 02 COMPLETADA! 🎉**

Continuar con: **FASE-03.md** (Base de Datos y Esquema)
