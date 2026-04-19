# Expense Manager Native — Plan 1: Foundation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Crear el proyecto Expo desde cero con autenticación Google OAuth funcional, navegación por tabs protegida por sesión, y conexión a la base de datos InsForge existente.

**Architecture:** Expo Router para navegación file-based (igual que Next.js App Router), NativeWind para estilos dark mode, InsForge SDK con Google auth nativo para RLS automático. El usuario se autentica con Google → InsForge crea la sesión → la app guarda el token en SecureStore → todas las queries a InsForge incluyen el token automáticamente.

**Tech Stack:** Expo SDK 52, Expo Router v4, NativeWind v4, expo-auth-session, expo-secure-store, @insforge/sdk, TypeScript, Jest + @testing-library/react-native

**Spec:** `docs/superpowers/specs/2026-04-18-expense-manager-native-design.md`

**Git flow:** Mismo que el proyecto web — issues → feature branches → PRs a develop → PR final a main

---

## Archivos a crear

```
expense-manager-native/
├── app/
│   ├── _layout.tsx                    # Root layout: providers + fonts
│   ├── (auth)/
│   │   ├── _layout.tsx                # Auth layout (sin tab bar)
│   │   └── login.tsx                  # Pantalla de login con Google
│   └── (dashboard)/
│       ├── _layout.tsx                # Tab Navigator + verificación de sesión
│       ├── index.tsx                  # Dashboard (placeholder)
│       ├── transactions.tsx           # Transacciones (placeholder)
│       ├── accounts.tsx               # Cuentas (placeholder)
│       └── more.tsx                   # Más (placeholder)
├── components/
│   └── ui/
│       └── PrimaryButton.tsx          # Botón reutilizable
├── lib/
│   ├── insforge.ts                    # Cliente InsForge
│   └── auth.ts                        # Helpers de autenticación
├── context/
│   └── AuthContext.tsx                # Sesión global del usuario
├── types/
│   └── database.types.ts              # Copiado exacto del web
├── constants/
│   └── theme.ts                       # Colores dark mode
├── .env.local                         # Variables de entorno
└── tailwind.config.js                 # Configuración NativeWind
```

---

## FASE 0: Setup del proyecto

### Task 1: Crear proyecto Expo y configurar repositorio GitHub

**Prerrequisitos:**
```bash
# Verificar versiones instaladas
node --version   # Debe ser 20+
pnpm --version   # Debe ser instalado
```

- [ ] **Paso 1.1: Crear el proyecto Expo**

```bash
cd /Users/sanghelgonzalez/Documents/projects
npx create-expo-app@latest expense-manager-native --template blank-typescript
cd expense-manager-native
```

- [ ] **Paso 1.2: Verificar que el proyecto corre**

```bash
npx expo start
# Presionar 'i' para abrir el simulador iOS
# Debes ver la pantalla blanca con "Open up App.tsx to start working on your app!"
# Presionar 'q' para salir
```

- [ ] **Paso 1.3: Inicializar repositorio Git**

```bash
git init
git add .
git commit -m "chore: initial Expo project scaffold"
```

- [ ] **Paso 1.4: Crear repositorio en GitHub**

```bash
gh repo create expense-manager-native \
  --public \
  --description "Expense Manager — React Native app (Expo)" \
  --source=. \
  --remote=origin \
  --push
```

- [ ] **Paso 1.5: Crear rama develop y configurarla como default**

```bash
git checkout -b develop
git push -u origin develop
gh repo edit --default-branch develop
```

- [ ] **Paso 1.6: Crear issue maestro FASE 0**

```bash
gh issue create \
  --title "FASE 0: Setup del proyecto" \
  --body "## Objetivo
Configurar el proyecto Expo con todas las dependencias base y estructura de carpetas.

## Tareas
- [ ] Crear proyecto Expo + repo GitHub
- [ ] Instalar y configurar NativeWind
- [ ] Configurar Expo Router
- [ ] Copiar tipos compartidos del web
- [ ] Configurar cliente InsForge y variables de entorno

## Criterios de Aceptación
- App corre en simulador iOS
- NativeWind compila correctamente
- Expo Router muestra pantalla de login"
```

---

### Task 2: Instalar dependencias y configurar NativeWind

- [ ] **Paso 2.1: Crear issue de tarea**

```bash
gh issue create \
  --title "Instalar dependencias base y configurar NativeWind" \
  --body "## Objetivo
Instalar todas las dependencias necesarias para el proyecto y configurar NativeWind para estilos Tailwind en React Native.

## Archivos Afectados
- package.json
- tailwind.config.js
- babel.config.js
- app/_layout.tsx (nuevo)

## Criterios de Aceptación
- [ ] NativeWind funciona (clases Tailwind aplicadas correctamente)
- [ ] Sin errores de TypeScript

## Related
Parte de #1"
# Anotar el número del issue (ejemplo: #2)
```

- [ ] **Paso 2.2: Crear rama feature**

```bash
git checkout develop
git pull origin develop
git checkout -b feature/2-setup-nativewind-dependencies
```

- [ ] **Paso 2.3: Instalar dependencias**

```bash
npx expo install expo-router expo-secure-store expo-web-browser expo-auth-session
pnpm add nativewind tailwindcss react-native-safe-area-context react-native-screens
pnpm add -D @types/react @types/react-native
```

- [ ] **Paso 2.4: Crear `tailwind.config.js`**

```js
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        bg: '#0f0f14',
        surface: '#1a1a23',
        border: '#2d2d35',
        primary: '#4F46E5',
        muted: '#B0B0B0',
      },
    },
  },
  plugins: [],
}
```

- [ ] **Paso 2.5: Actualizar `babel.config.js`**

```js
// babel.config.js
module.exports = function (api) {
  api.cache(true)
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
  }
}
```

- [ ] **Paso 2.6: Actualizar `app.json` para usar Expo Router**

Abrir `app.json` y añadir dentro de `"expo"`:
```json
{
  "expo": {
    "scheme": "expensemanager",
    "web": {
      "bundler": "metro"
    },
    "plugins": [
      "expo-router"
    ]
  }
}
```

- [ ] **Paso 2.7: Crear `app/_layout.tsx` (Root Layout)**

```tsx
// app/_layout.tsx
import { Stack } from 'expo-router'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import '../global.css'

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </SafeAreaProvider>
  )
}
```

- [ ] **Paso 2.8: Crear `global.css`**

```css
/* global.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Paso 2.9: Verificar que NativeWind funciona**

Crear `app/index.tsx` temporal:
```tsx
// app/index.tsx
import { View, Text } from 'react-native'

export default function TestScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-bg">
      <Text className="text-white text-xl">NativeWind funcionando</Text>
    </View>
  )
}
```

```bash
npx expo start
# Abrir simulador iOS con 'i'
# Debe verse fondo oscuro (#0f0f14) con texto blanco
```

- [ ] **Paso 2.10: Commit y PR**

```bash
git add .
git commit -m "feat: configure NativeWind with dark theme and Expo Router"
git push -u origin feature/2-setup-nativewind-dependencies

gh pr create \
  --base develop \
  --title "feat: configure NativeWind and Expo Router" \
  --body "## Cambios
- Instaladas dependencias: expo-router, nativewind, expo-secure-store, expo-auth-session
- Configurado NativeWind v4 con tema dark mode
- Configurado babel.config.js para NativeWind
- Root layout con SafeAreaProvider

## Testing
- ✅ App corre en simulador iOS con estilos Tailwind

Closes #2
Related to #1"

gh pr merge --squash --delete-branch
git checkout develop && git pull origin develop
```

---

### Task 3: Copiar tipos compartidos y crear constantes

- [ ] **Paso 3.1: Crear issue de tarea**

```bash
gh issue create \
  --title "Copiar tipos TypeScript del web y crear constantes de tema" \
  --body "## Objetivo
Reutilizar los tipos TypeScript del proyecto web (database.types.ts) y crear el archivo de constantes de tema.

## Archivos Afectados
- types/database.types.ts (nuevo — copia del web)
- constants/theme.ts (nuevo)
- lib/utils/currency.ts (nuevo — copia del web)

## Related
Parte de #1"
# Anotar número (ejemplo: #3)
```

- [ ] **Paso 3.2: Crear rama**

```bash
git checkout -b feature/3-shared-types-and-constants
```

- [ ] **Paso 3.3: Crear `types/database.types.ts`**

Copiar exactamente desde el proyecto web. El archivo debe quedar así:

```ts
// types/database.types.ts
export type Currency = 'COP' | 'USD' | 'VES'
export type TransactionType = 'income' | 'expense'
export type BudgetPeriod = 'monthly' | 'yearly'
export type TransactionSource = 'manual' | 'conversational'
export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly'

export interface User {
  id: string
  email: string
  name: string | null
  avatar_url: string | null
  preferred_currency: Currency
  created_at: string
  updated_at: string
}

export type AccountType = 'bank' | 'digital' | 'crypto' | 'cash'

export interface Account {
  id: string
  user_id: string
  name: string
  type: AccountType
  currency: Currency
  balance: number
  color: string | null
  icon: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AccountMovement {
  id: string
  user_id: string
  from_account_id: string
  from_amount: number
  from_currency: Currency
  to_account_id: string
  to_amount: number
  to_currency: Currency
  description: string | null
  date: string
  created_at: string
}

export interface AccountMovementWithAccounts extends AccountMovement {
  from_account: Account
  to_account: Account
}

export interface Transaction {
  id: string
  user_id: string
  amount: number
  currency: Currency
  type: TransactionType
  category_id: string
  account_id: string | null
  description: string
  date: string
  source: TransactionSource
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  user_id: string | null
  name: string
  type: TransactionType
  icon: string | null
  color: string | null
  created_at: string
}

export interface Budget {
  id: string
  user_id: string
  category_id: string
  amount: number
  currency: Currency
  period: BudgetPeriod
  start_date: string
  created_at: string
}

export interface ExchangeRate {
  id: string
  from_currency: Currency
  to_currency: Currency
  rate: number
  date: string
  created_at: string
}

export interface RecurringTransaction {
  id: string
  user_id: string
  amount: number
  currency: Currency
  type: TransactionType
  category_id: string
  description: string
  frequency: RecurrenceFrequency
  start_date: string
  end_date: string | null
  is_active: boolean
  last_generated: string | null
  created_at: string
}

export interface SavingsGoal {
  id: string
  user_id: string
  name: string
  target_amount: number
  current_amount: number
  currency: Currency
  deadline: string | null
  is_completed: boolean
  created_at: string
}

export interface Tag {
  id: string
  user_id: string
  name: string
  color: string
  created_at: string
}

export interface TransactionWithCategory extends Transaction {
  category: Category
}

export interface BudgetWithCategory extends Budget {
  category: Category
}

export interface RecurringTransactionWithCategory extends RecurringTransaction {
  category: Category
}
```

- [ ] **Paso 3.4: Crear `constants/theme.ts`**

```ts
// constants/theme.ts
export const colors = {
  bg: '#0f0f14',
  surface: '#1a1a23',
  border: '#2d2d35',
  primary: '#4F46E5',
  primaryHover: '#4338CA',
  muted: '#B0B0B0',
  white: '#ffffff',
  error: '#ef4444',
  success: '#22c55e',
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
}
```

- [ ] **Paso 3.5: Crear `lib/utils/currency.ts`**

```ts
// lib/utils/currency.ts
import type { Currency } from '@/types/database.types'

export function formatCurrency(amount: number, currency: Currency): string {
  if (currency === 'VES') {
    return `Bs ${amount.toLocaleString('es-VE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}
```

- [ ] **Paso 3.6: Configurar alias `@/` en `tsconfig.json`**

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

- [ ] **Paso 3.7: Commit y PR**

```bash
git add .
git commit -m "feat: add shared types, theme constants and currency utils"
git push -u origin feature/3-shared-types-and-constants

gh pr create \
  --base develop \
  --title "feat: add shared TypeScript types and theme constants" \
  --body "## Cambios
- types/database.types.ts: copia exacta del web
- constants/theme.ts: paleta de colores dark mode
- lib/utils/currency.ts: formatCurrency reutilizada del web
- tsconfig.json: alias @/ configurado

Closes #3
Related to #1"

gh pr merge --squash --delete-branch
git checkout develop && git pull origin develop
```

---

### Task 4: Configurar cliente InsForge y variables de entorno

- [ ] **Paso 4.1: Crear issue de tarea**

```bash
gh issue create \
  --title "Configurar cliente InsForge y variables de entorno" \
  --body "## Objetivo
Configurar el SDK de InsForge para conectarse a la misma base de datos del proyecto web.

## Archivos Afectados
- .env.local (nuevo)
- lib/insforge.ts (nuevo)

## Related
Parte de #1"
# Anotar número (ejemplo: #4)
```

- [ ] **Paso 4.2: Crear rama**

```bash
git checkout -b feature/4-insforge-client
```

- [ ] **Paso 4.3: Instalar el SDK de InsForge**

```bash
npx expo install @insforge/sdk
```

- [ ] **Paso 4.4: Crear `.env.local`**

```bash
# .env.local
# Copiar los mismos valores del proyecto web
EXPO_PUBLIC_INSFORGE_URL=<pegar el valor de NEXT_PUBLIC_INSFORGE_URL del web>
EXPO_PUBLIC_INSFORGE_ANON_KEY=<pegar el valor de NEXT_PUBLIC_INSFORGE_ANON_KEY del web>
EXPO_PUBLIC_GOOGLE_CLIENT_ID=<se configura en Task 6 — dejar vacío por ahora>
```

> Los valores de INSFORGE_URL e INSFORGE_ANON_KEY están en el archivo `.env.local` del proyecto web (`/Users/sanghelgonzalez/Documents/projects/expense-manager/.env.local`).

- [ ] **Paso 4.5: Crear `lib/insforge.ts`**

```ts
// lib/insforge.ts
import { createClient } from '@insforge/sdk'

export const insforge = createClient({
  baseUrl: process.env.EXPO_PUBLIC_INSFORGE_URL!,
  anonKey: process.env.EXPO_PUBLIC_INSFORGE_ANON_KEY!,
})
```

- [ ] **Paso 4.6: Agregar `.env.local` al `.gitignore`**

Verificar que `.gitignore` contiene:
```
.env.local
.env*.local
```

- [ ] **Paso 4.7: Commit y PR**

```bash
git add lib/insforge.ts .gitignore
git commit -m "feat: add InsForge client configuration"
git push -u origin feature/4-insforge-client

gh pr create \
  --base develop \
  --title "feat: add InsForge SDK client" \
  --body "## Cambios
- lib/insforge.ts: cliente InsForge con anon key
- .gitignore: excluye .env.local

Closes #4
Related to #1"

gh pr merge --squash --delete-branch
git checkout develop && git pull origin develop
```

- [ ] **Paso 4.8: Crear PR de FASE 0 a main**

```bash
gh pr create \
  --base main \
  --head develop \
  --title "FASE 0: Setup del proyecto expense-manager-native" \
  --body "## Resumen
Setup completo del proyecto Expo con NativeWind, Expo Router, tipos TypeScript y cliente InsForge.

## Tareas completadas
- [x] Proyecto Expo scaffolded (#2)
- [x] NativeWind configurado con tema dark mode (#2)
- [x] Tipos TypeScript compartidos del web (#3)
- [x] Cliente InsForge configurado (#4)

## Testing
- ✅ App corre en simulador iOS

Closes #1"
```

⚠️ **DETENER — esperar aprobación del PR antes de continuar con FASE 1**

---

## FASE 1: Autenticación

### Task 5: Configurar Google OAuth en Google Cloud Console

> Esta tarea es de configuración manual — no hay código que escribir. Sigue los pasos exactamente.

- [ ] **Paso 5.1: Crear issue de tarea**

```bash
gh issue create \
  --title "FASE 1: Autenticación Google OAuth" \
  --body "## Objetivo
Implementar autenticación Google OAuth con InsForge, sesión persistente en SecureStore y protección de rutas.

## Tareas
- [ ] Configurar Google OAuth en Google Cloud Console
- [ ] Habilitar Google auth en InsForge dashboard
- [ ] Implementar AuthContext
- [ ] Implementar pantalla de login
- [ ] Implementar sesión persistente

## Related
FASE 1 del proyecto"
# Anotar número (ejemplo: #5)
```

- [ ] **Paso 5.2: Ir a Google Cloud Console**

1. Abrir https://console.cloud.google.com
2. Seleccionar el proyecto que ya usas para el web (el que tiene el OAuth de NextAuth)
3. Ir a **APIs & Services → Credentials**

- [ ] **Paso 5.3: Crear OAuth Client ID para iOS**

1. Click **+ CREATE CREDENTIALS → OAuth client ID**
2. Application type: **iOS**
3. Name: `Expense Manager Native iOS`
4. Bundle ID: `com.sanghel.expensemanager` (debe coincidir con el `bundleIdentifier` en `app.json`)
5. Click **CREATE**
6. **Guardar el Client ID** (formato: `XXXXXXXXXX.apps.googleusercontent.com`)

- [ ] **Paso 5.4: Actualizar `app.json` con el Bundle ID**

```json
{
  "expo": {
    "scheme": "expensemanager",
    "ios": {
      "bundleIdentifier": "com.sanghel.expensemanager"
    },
    "android": {
      "package": "com.sanghel.expensemanager"
    }
  }
}
```

- [ ] **Paso 5.5: Agregar el Client ID a `.env.local`**

```bash
EXPO_PUBLIC_GOOGLE_CLIENT_ID=XXXXXXXXXX.apps.googleusercontent.com
```

- [ ] **Paso 5.6: Habilitar Google auth en InsForge dashboard**

1. Abrir el dashboard de InsForge
2. Ir a **Authentication → Providers**
3. Habilitar **Google**
4. Ingresar el mismo Client ID y Client Secret del proyecto web de Google Cloud Console
5. Guardar

---

### Task 6: Implementar AuthContext y cliente InsForge con sesión

- [ ] **Paso 6.1: Crear issue de tarea**

```bash
gh issue create \
  --title "Implementar AuthContext y gestión de sesión" \
  --body "## Objetivo
Contexto global de autenticación que persiste la sesión en SecureStore y la inyecta en el cliente InsForge.

## Archivos Afectados
- context/AuthContext.tsx (nuevo)
- lib/insforge.ts (modificar)

## Related
Parte de #5"
# Anotar número (ejemplo: #6)
```

- [ ] **Paso 6.2: Crear rama**

```bash
git checkout develop && git pull origin develop
git checkout -b feature/6-auth-context
```

- [ ] **Paso 6.3: Crear `context/AuthContext.tsx`**

```tsx
// context/AuthContext.tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import * as SecureStore from 'expo-secure-store'
import { insforge } from '@/lib/insforge'
import type { User } from '@/types/database.types'

const SESSION_KEY = 'insforge_session'

interface AuthState {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    restoreSession()

    const { data: { subscription } } = insforge.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session))
          await loadUserProfile(session.user.email!)
        } else {
          await SecureStore.deleteItemAsync(SESSION_KEY)
          setUser(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function restoreSession() {
    try {
      const raw = await SecureStore.getItemAsync(SESSION_KEY)
      if (!raw) { setLoading(false); return }

      const session = JSON.parse(raw)
      const { error } = await insforge.auth.setSession(session)
      if (error) {
        await SecureStore.deleteItemAsync(SESSION_KEY)
        setLoading(false)
        return
      }
      await loadUserProfile(session.user.email)
    } catch {
      setLoading(false)
    }
  }

  async function loadUserProfile(email: string) {
    const { data } = await insforge.database
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle()

    if (data) {
      setUser(data as User)
    } else {
      // Usuario autenticado en InsForge pero no existe en nuestra tabla aún
      // Se creará en la pantalla de login después de autenticar
      setUser(null)
    }
    setLoading(false)
  }

  async function signOut() {
    await insforge.auth.signOut()
    await SecureStore.deleteItemAsync(SESSION_KEY)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
```

- [ ] **Paso 6.4: Envolver la app con `AuthProvider` en `app/_layout.tsx`**

```tsx
// app/_layout.tsx
import { Stack } from 'expo-router'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AuthProvider } from '@/context/AuthContext'
import '../global.css'

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </AuthProvider>
    </SafeAreaProvider>
  )
}
```

- [ ] **Paso 6.5: Commit y PR**

```bash
git add .
git commit -m "feat: add AuthContext with SecureStore session persistence"
git push -u origin feature/6-auth-context

gh pr create \
  --base develop \
  --title "feat: add AuthContext with session persistence" \
  --body "## Cambios
- context/AuthContext.tsx: gestión de sesión con SecureStore
- app/_layout.tsx: envuelto con AuthProvider

Closes #6
Related to #5"

gh pr merge --squash --delete-branch
git checkout develop && git pull origin develop
```

---

### Task 7: Implementar pantalla de login

- [ ] **Paso 7.1: Crear issue de tarea**

```bash
gh issue create \
  --title "Implementar pantalla de login con Google OAuth" \
  --body "## Objetivo
Pantalla de login con botón de Google que inicia el flujo OAuth y crea el usuario en InsForge si no existe.

## Archivos Afectados
- app/(auth)/_layout.tsx (nuevo)
- app/(auth)/login.tsx (nuevo)
- components/ui/PrimaryButton.tsx (nuevo)

## Related
Parte de #5"
# Anotar número (ejemplo: #7)
```

- [ ] **Paso 7.2: Crear rama**

```bash
git checkout -b feature/7-login-screen
```

- [ ] **Paso 7.3: Crear `components/ui/PrimaryButton.tsx`**

```tsx
// components/ui/PrimaryButton.tsx
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native'

interface Props {
  onPress: () => void
  children: string
  loading?: boolean
  disabled?: boolean
  variant?: 'primary' | 'outline'
}

export function PrimaryButton({
  onPress,
  children,
  loading = false,
  disabled = false,
  variant = 'primary',
}: Props) {
  const isPrimary = variant === 'primary'

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      className={`h-12 rounded-xl items-center justify-center px-6 ${
        isPrimary ? 'bg-primary' : 'border border-border bg-transparent'
      } ${disabled || loading ? 'opacity-50' : ''}`}
    >
      {loading ? (
        <ActivityIndicator color="white" size="small" />
      ) : (
        <Text className={`font-semibold text-base ${isPrimary ? 'text-white' : 'text-white'}`}>
          {children}
        </Text>
      )}
    </TouchableOpacity>
  )
}
```

- [ ] **Paso 7.4: Crear `app/(auth)/_layout.tsx`**

```tsx
// app/(auth)/_layout.tsx
import { Stack } from 'expo-router'

export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />
}
```

- [ ] **Paso 7.5: Crear `app/(auth)/login.tsx`**

```tsx
// app/(auth)/login.tsx
import { View, Text, Image } from 'react-native'
import { useState } from 'react'
import { router } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import * as Google from 'expo-auth-session/providers/google'
import { makeRedirectUri } from 'expo-auth-session'
import { insforge } from '@/lib/insforge'
import { PrimaryButton } from '@/components/ui/PrimaryButton'

WebBrowser.maybeCompleteAuthSession()

export default function LoginScreen() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [, response, promptAsync] = Google.useAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
    redirectUri: makeRedirectUri({ scheme: 'expensemanager' }),
  })

  async function handleGoogleLogin() {
    setLoading(true)
    setError(null)

    try {
      const result = await promptAsync()

      if (result.type !== 'success') {
        setLoading(false)
        return
      }

      const { id_token } = result.params

      // Autenticar en InsForge con el id_token de Google
      const { data: authData, error: authError } = await insforge.auth.signInWithIdToken({
        provider: 'google',
        token: id_token,
      })

      if (authError) throw authError

      const email = authData.user?.email
      if (!email) throw new Error('No se obtuvo email de Google')

      // Buscar o crear usuario en nuestra tabla users
      const { data: existingUser } = await insforge.database
        .from('users')
        .select('*')
        .eq('email', email)
        .maybeSingle()

      if (!existingUser) {
        await insforge.database.from('users').insert([{
          email,
          name: authData.user?.user_metadata?.full_name ?? null,
          avatar_url: authData.user?.user_metadata?.avatar_url ?? null,
          preferred_currency: 'COP',
        }])
      }

      router.replace('/(dashboard)')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al iniciar sesión'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className="flex-1 bg-bg items-center justify-center px-8 gap-8">
      <View className="items-center gap-3">
        <Text className="text-white text-3xl font-bold">Expense Manager</Text>
        <Text className="text-muted text-base text-center">
          Controla tus finanzas personales
        </Text>
      </View>

      <View className="w-full gap-4">
        <PrimaryButton onPress={handleGoogleLogin} loading={loading}>
          Iniciar sesión con Google
        </PrimaryButton>

        {error && (
          <Text className="text-red-400 text-sm text-center">{error}</Text>
        )}
      </View>
    </View>
  )
}
```

- [ ] **Paso 7.6: Probar el login**

```bash
npx expo start
# Abrir simulador iOS con 'i'
# Debe aparecer la pantalla de login con fondo oscuro y botón de Google
# Tocar el botón → debe abrirse el navegador con el flujo de Google
# Completar el login → debe redirigir al dashboard (placeholder por ahora)
```

- [ ] **Paso 7.7: Commit y PR**

```bash
git add .
git commit -m "feat: add Google OAuth login screen"
git push -u origin feature/7-login-screen

gh pr create \
  --base develop \
  --title "feat: add Google OAuth login screen" \
  --body "## Cambios
- app/(auth)/login.tsx: pantalla de login con Google OAuth
- app/(auth)/_layout.tsx: layout de autenticación
- components/ui/PrimaryButton.tsx: botón reutilizable

## Testing
- ✅ Pantalla de login renderiza correctamente
- ✅ Flujo Google OAuth abre el navegador del sistema

Closes #7
Related to #5"

gh pr merge --squash --delete-branch
git checkout develop && git pull origin develop
```

---

## FASE 2: Navegación base

### Task 8: Implementar Tab Navigator y pantallas placeholder

- [ ] **Paso 8.1: Crear issue maestro FASE 2**

```bash
gh issue create \
  --title "FASE 2: Navegación base con Tab Navigator y protección de rutas" \
  --body "## Objetivo
Tab Navigator con 4 tabs (Dashboard, Transacciones, Cuentas, Más), protección de rutas y redirección automática a login si no hay sesión.

## Tareas
- [ ] Tab Navigator con pantallas placeholder
- [ ] Protección de rutas (redirect si no hay sesión)

## Criterios de Aceptación
- Usuario autenticado ve el Tab Navigator
- Usuario sin sesión es redirigido a login automáticamente"
# Anotar número (ejemplo: #8)
```

- [ ] **Paso 8.2: Crear issue de tarea**

```bash
gh issue create \
  --title "Implementar Tab Navigator y pantallas placeholder" \
  --body "## Objetivo
Tab Navigator con 4 tabs y verificación de sesión en el layout del dashboard.

## Archivos Afectados
- app/(dashboard)/_layout.tsx (nuevo)
- app/(dashboard)/index.tsx (nuevo)
- app/(dashboard)/transactions.tsx (nuevo)
- app/(dashboard)/accounts.tsx (nuevo)
- app/(dashboard)/more.tsx (nuevo)

## Related
Parte de #8"
# Anotar número (ejemplo: #9)
```

- [ ] **Paso 8.3: Crear rama**

```bash
git checkout -b feature/9-tab-navigator
```

- [ ] **Paso 8.4: Crear `app/(dashboard)/_layout.tsx`**

```tsx
// app/(dashboard)/_layout.tsx
import { Tabs, router } from 'expo-router'
import { useEffect } from 'react'
import { Text } from 'react-native'
import { useAuth } from '@/context/AuthContext'
import { colors } from '@/constants/theme'

export default function DashboardLayout() {
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/(auth)/login')
    }
  }, [user, loading])

  if (loading || !user) return null

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>📊</Text>,
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Transacciones',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>💸</Text>,
        }}
      />
      <Tabs.Screen
        name="accounts"
        options={{
          title: 'Cuentas',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🏦</Text>,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'Más',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>☰</Text>,
        }}
      />
    </Tabs>
  )
}
```

- [ ] **Paso 8.5: Crear pantallas placeholder**

```tsx
// app/(dashboard)/index.tsx
import { View, Text } from 'react-native'
import { useAuth } from '@/context/AuthContext'

export default function DashboardScreen() {
  const { user } = useAuth()
  return (
    <View className="flex-1 bg-bg items-center justify-center">
      <Text className="text-white text-xl font-bold">Dashboard</Text>
      <Text className="text-muted mt-2">Hola, {user?.name ?? user?.email}</Text>
    </View>
  )
}
```

```tsx
// app/(dashboard)/transactions.tsx
import { View, Text } from 'react-native'

export default function TransactionsScreen() {
  return (
    <View className="flex-1 bg-bg items-center justify-center">
      <Text className="text-white text-xl font-bold">Transacciones</Text>
      <Text className="text-muted mt-2">Próximamente — Plan 2</Text>
    </View>
  )
}
```

```tsx
// app/(dashboard)/accounts.tsx
import { View, Text } from 'react-native'

export default function AccountsScreen() {
  return (
    <View className="flex-1 bg-bg items-center justify-center">
      <Text className="text-white text-xl font-bold">Cuentas</Text>
      <Text className="text-muted mt-2">Próximamente — Plan 2</Text>
    </View>
  )
}
```

```tsx
// app/(dashboard)/more.tsx
import { View, Text, TouchableOpacity } from 'react-native'
import { useAuth } from '@/context/AuthContext'

export default function MoreScreen() {
  const { signOut } = useAuth()
  return (
    <View className="flex-1 bg-bg items-center justify-center gap-4">
      <Text className="text-white text-xl font-bold">Más opciones</Text>
      <Text className="text-muted">Presupuestos, Metas, Reportes...</Text>
      <TouchableOpacity
        onPress={signOut}
        className="mt-8 border border-red-500 rounded-xl px-6 py-3"
        activeOpacity={0.8}
      >
        <Text className="text-red-400 font-semibold">Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  )
}
```

- [ ] **Paso 8.6: Probar la navegación completa**

```bash
npx expo start
# Abrir simulador iOS con 'i'
# Sin sesión → debe aparecer pantalla de login
# Iniciar sesión con Google → debe aparecer Tab Navigator con 4 tabs
# Navegar entre tabs → debe funcionar correctamente
# Tap en "Cerrar sesión" → debe volver al login
```

- [ ] **Paso 8.7: Commit y PR**

```bash
git add .
git commit -m "feat: add Tab Navigator with route protection and placeholder screens"
git push -u origin feature/9-tab-navigator

gh pr create \
  --base develop \
  --title "feat: add Tab Navigator with route protection" \
  --body "## Cambios
- app/(dashboard)/_layout.tsx: Tab Navigator con 4 tabs + verificación de sesión
- app/(dashboard)/index.tsx: Dashboard placeholder
- app/(dashboard)/transactions.tsx: Transacciones placeholder
- app/(dashboard)/accounts.tsx: Cuentas placeholder
- app/(dashboard)/more.tsx: Más con botón de cerrar sesión

## Testing
- ✅ Sin sesión → redirect a login
- ✅ Con sesión → Tab Navigator funcional
- ✅ Cerrar sesión → vuelve al login

Closes #9
Related to #8"

gh pr merge --squash --delete-branch
git checkout develop && git pull origin develop
```

- [ ] **Paso 8.8: Crear PR FASE 1+2 a main**

```bash
gh pr create \
  --base main \
  --head develop \
  --title "FASE 1+2: Autenticación Google OAuth y navegación base" \
  --body "## Resumen
Autenticación completa con Google OAuth, sesión persistente en SecureStore, Tab Navigator con 4 tabs y protección de rutas.

## Tareas completadas
- [x] Google OAuth configurado en Google Cloud Console
- [x] InsForge Google auth habilitado
- [x] AuthContext con SecureStore (#6)
- [x] Pantalla de login (#7)
- [x] Tab Navigator con protección de rutas (#9)

## Testing
- ✅ Login con Google funcional en simulador iOS
- ✅ Sesión persiste al cerrar y reabrir la app
- ✅ Cerrar sesión redirige al login
- ✅ Tab Navigator navega entre pantallas

Closes #5, #8"
```

⚠️ **DETENER — esperar aprobación del PR antes de continuar con Plan 2**

---

## RLS en InsForge — Configurar en Fase 1 (antes de Task 6)

Ejecutar en el panel SQL de InsForge antes de implementar las actions de datos. Hacerlo después de implementar el login pero antes del Plan 2:

```sql
-- 1. Habilitar RLS en todas las tablas
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 2. Políticas por tabla (usuario solo ve sus propios datos)
CREATE POLICY "users_own" ON users FOR ALL USING (auth.uid()::text = id::text);
CREATE POLICY "transactions_own" ON transactions FOR ALL USING (user_id::text = (SELECT id::text FROM users WHERE email = auth.jwt()->>'email'));
CREATE POLICY "accounts_own" ON accounts FOR ALL USING (user_id::text = (SELECT id::text FROM users WHERE email = auth.jwt()->>'email'));
CREATE POLICY "account_movements_own" ON account_movements FOR ALL USING (user_id::text = (SELECT id::text FROM users WHERE email = auth.jwt()->>'email'));
CREATE POLICY "categories_own" ON categories FOR ALL USING (user_id IS NULL OR user_id::text = (SELECT id::text FROM users WHERE email = auth.jwt()->>'email'));
CREATE POLICY "budgets_own" ON budgets FOR ALL USING (user_id::text = (SELECT id::text FROM users WHERE email = auth.jwt()->>'email'));
CREATE POLICY "savings_goals_own" ON savings_goals FOR ALL USING (user_id::text = (SELECT id::text FROM users WHERE email = auth.jwt()->>'email'));
CREATE POLICY "recurring_own" ON recurring_transactions FOR ALL USING (user_id::text = (SELECT id::text FROM users WHERE email = auth.jwt()->>'email'));
CREATE POLICY "tags_own" ON tags FOR ALL USING (user_id::text = (SELECT id::text FROM users WHERE email = auth.jwt()->>'email'));

-- 3. exchange_rates es compartida (todos los usuarios autenticados pueden leer)
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "exchange_rates_read" ON exchange_rates FOR SELECT USING (auth.role() = 'authenticated');
```

---

## Verificación end-to-end

Al completar las 3 fases del Plan 1, el comportamiento esperado es:

1. Abrir la app en simulador iOS → pantalla de login
2. Tocar "Iniciar sesión con Google" → navegador del sistema con OAuth de Google
3. Completar el login → Tab Navigator con 4 tabs
4. Cerrar y volver a abrir la app → entra directo al dashboard (sesión persistente)
5. Tocar "Cerrar sesión" en "Más" → vuelve a pantalla de login
