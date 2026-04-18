# Expense Manager Native — Design Spec

**Fecha:** 2026-04-18
**Proyecto:** `expense-manager-native`
**Ubicación:** `/Users/sanghelgonzalez/Documents/projects/expense-manager-native`

---

## Contexto

Aplicación móvil iOS + Android que replica la funcionalidad completa del proyecto web `expense-manager`, compartiendo la misma base de datos InsForge. El objetivo es tener paridad total de features con la versión web, usando React Native + Expo para que el desarrollador pueda aplicar el conocimiento de React/TypeScript ya adquirido.

---

## Decisiones de arquitectura

| Decisión | Elección | Razón |
|----------|----------|-------|
| Framework | Expo (React Native) | TypeScript/React familiar, iOS + Android desde un codebase |
| Routing | Expo Router | File-based routing idéntico a Next.js App Router |
| Estilos | NativeWind | Clases Tailwind en React Native, mismo lenguaje visual que el web |
| Autenticación | expo-auth-session + Google OAuth | Consistencia con el web, gratuito, sin vendor lock-in |
| Base de datos | InsForge SDK (anon key) | Misma BD, acceso directo con RLS para seguridad |
| Repositorio | Independiente | `/projects/expense-manager-native` — repo separado |
| Git flow | GitHub Flow (mismo que el web) | Issues → feature branches → PRs a develop → PR a main |

---

## Estructura del proyecto

```
expense-manager-native/
├── app/
│   ├── (auth)/
│   │   └── login.tsx                  # Pantalla de login con Google
│   ├── (dashboard)/
│   │   ├── _layout.tsx                # Tab Navigator + verificación de sesión
│   │   ├── index.tsx                  # Dashboard principal
│   │   ├── transactions/
│   │   │   ├── index.tsx              # Lista de transacciones
│   │   │   └── [id].tsx               # Crear/editar transacción
│   │   ├── accounts/
│   │   │   ├── index.tsx              # Lista de cuentas + movimientos
│   │   │   └── [id].tsx               # Crear/editar cuenta
│   │   ├── budgets/
│   │   ├── goals/
│   │   ├── recurring/
│   │   ├── reports/
│   │   ├── calendar/
│   │   ├── tags/
│   │   ├── chat/
│   │   │   └── index.tsx              # Chat IA (modal fullscreen desde FAB)
│   │   ├── export/
│   │   └── settings/
│   └── _layout.tsx                    # Root layout (fonts, providers)
├── components/
│   ├── ui/                            # Primitivos reutilizables
│   │   ├── PrimaryButton.tsx
│   │   ├── FormInput.tsx
│   │   ├── FormModal.tsx              # Equivalente a FormDialog del web
│   │   ├── ConfirmModal.tsx
│   │   ├── CurrencySelect.tsx
│   │   └── Card.tsx
│   ├── transactions/
│   ├── accounts/
│   ├── dashboard/
│   └── shared/
│       └── ChatFAB.tsx                # Botón flotante del chat IA
├── lib/
│   ├── insforge.ts                    # Cliente InsForge con anon key
│   ├── auth.ts                        # Google OAuth + SecureStore
│   ├── jwt.ts                         # Generación de JWT para InsForge RLS
│   └── actions/                       # Queries directas a InsForge
│       ├── transactions.actions.ts
│       ├── accounts.actions.ts
│       ├── account_movements.actions.ts
│       ├── categories.actions.ts
│       ├── budgets.actions.ts
│       ├── goals.actions.ts
│       ├── recurring.actions.ts
│       ├── tags.actions.ts
│       ├── exchangeRates.actions.ts
│       └── users.actions.ts
├── types/
│   └── database.types.ts              # Copia exacta del web — sin cambios
├── constants/
│   └── theme.ts                       # Colores y tipografía dark mode
├── context/
│   └── AuthContext.tsx                # Sesión del usuario (React Context)
└── .env.local                         # Variables de entorno
```

---

## Autenticación

### Flujo Google OAuth

```
1. Usuario toca "Iniciar sesión con Google"
2. expo-auth-session abre el navegador del sistema con flujo OAuth de Google
3. Google redirige a la app con un authorization_code
4. La app intercambia el code por access_token + id_token
5. Se decodifica el id_token para obtener email, nombre, avatar
6. Se busca el usuario en InsForge por email (tabla `users`)
7. Si no existe → se crea el registro
8. Se genera un JWT firmado con el INSFORGE_JWT_SECRET (para RLS)
9. El JWT se guarda en expo-secure-store (cifrado en el dispositivo)
10. El cliente InsForge se configura con el JWT en Authorization header
```

### Variables de entorno

```
EXPO_PUBLIC_INSFORGE_URL=<igual al web>
EXPO_PUBLIC_INSFORGE_ANON_KEY=<igual al web>
EXPO_PUBLIC_GOOGLE_CLIENT_ID=<nuevo — tipo "iOS" en Google Cloud Console>
INSFORGE_JWT_SECRET=<secret del proyecto InsForge>
```

### Sesión persistente

Al iniciar la app, `AuthContext` lee el JWT de `SecureStore`. Si existe y no expiró → acceso directo al dashboard. Si no → pantalla de login.

---

## RLS (Row Level Security) en InsForge

El web usa la admin key que bypasea RLS. La app móvil usa la anon key, por lo que RLS debe estar configurado.

### Configuración necesaria en InsForge (panel SQL)

Ejecutar en su momento, tabla por tabla:

```sql
-- Habilitar RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;

-- Políticas (ejemplo para transactions — repetir para cada tabla)
CREATE POLICY "Users see own transactions"
ON transactions FOR ALL
USING (user_id = auth.uid());

-- exchange_rates es compartida (todos los usuarios leen)
CREATE POLICY "All users can read exchange rates"
ON exchange_rates FOR SELECT
USING (true);
```

**Se indicará paso a paso qué ejecutar en cada fase de implementación.**

---

## Navegación

### Tab Navigator (barra inferior)

```
[Dashboard] [Transacciones] [Cuentas] [Más ...]
```

- **Dashboard** — resumen financiero, balance total, transacciones recientes, cuentas
- **Transacciones** — lista con filtros, crear/editar
- **Cuentas** — lista de cuentas, movimientos entre cuentas
- **Más** — menú con: Presupuestos, Metas, Recurrentes, Reportes, Calendario, Etiquetas, Exportar, Configuración

### Chat IA (FAB)

Botón flotante visible en todas las pantallas del dashboard. Al tocarlo abre un modal fullscreen con el chat conversacional de Claude.

### Protección de rutas

`(dashboard)/_layout.tsx` verifica la sesión al montar. Sin sesión → redirect automático a `(auth)/login`.

---

## UI y Theming

### Paleta de colores (dark mode)

```ts
export const colors = {
  bg: '#0f0f14',
  surface: '#1a1a23',
  border: '#2d2d35',
  primary: '#4F46E5',
  primaryHover: '#4338CA',
  textMuted: '#B0B0B0',
  white: '#ffffff',
}
```

### Equivalencias de componentes

| Web (Chakra UI) | Nativo (NativeWind) |
|----------------|---------------------|
| `HStack` | `View className="flex-row"` |
| `VStack` | `View className="flex-col"` |
| `PrimaryButton` | `TouchableOpacity` + clases NativeWind |
| `FormDialog` | `Modal` de React Native |
| `DataTable` | `FlatList` con filas estilizadas |
| `Input` | `TextInput` + NativeWind |
| `NativeSelect` | Modal custom con lista de opciones |

### Diferencias con el web

- Sin estados `hover` — se usa `activeOpacity` en botones
- Selectores (`currency`, `category`) usan modal custom en lugar de `<select>` nativo
- Scroll gestionado con `ScrollView` o `FlatList`

---

## Capa de datos

### Cliente InsForge

```ts
// lib/insforge.ts
import { createClient } from '@insforge/sdk'

export const insforge = createClient({
  baseUrl: process.env.EXPO_PUBLIC_INSFORGE_URL!,
  anonKey: process.env.EXPO_PUBLIC_INSFORGE_ANON_KEY!,
})
```

### Patrón de actions

Igual que el web, sin `'use server'` ni `revalidatePath`:

```ts
// lib/actions/transactions.actions.ts
export async function getTransactions(userId: string) {
  const { data, error } = await insforge.database
    .from('transactions')
    .select('*, category:categories(*)')
    .eq('user_id', userId)
    .order('date', { ascending: false })

  if (error) throw error
  return data
}
```

### Archivos reutilizables del web

| Archivo | Estado |
|---------|--------|
| `types/database.types.ts` | Copia exacta — sin cambios |
| `lib/utils/currency.ts` | Copia exacta — sin cambios |
| `lib/validations/*.ts` | Copia exacta — sin cambios |
| `lib/actions/*.ts` | Misma estructura — quitar `'use server'` y `revalidatePath` |

---

## Setup inicial y cómo correr la app

### Prerrequisitos

```bash
# Node.js 20+ y pnpm
node --version
pnpm --version

# Expo CLI
pnpm add -g expo-cli

# Simulador iOS — requiere Xcode instalado en Mac
# Abrir Xcode → Preferences → Components → instalar un simulador iOS
```

### Instalación

```bash
cd /Users/sanghelgonzalez/Documents/projects
npx create-expo-app expense-manager-native --template blank-typescript
cd expense-manager-native
pnpm install
```

### Correr en simulador iOS

```bash
pnpm expo start
# Presionar 'i' para abrir el simulador de iOS
```

### Correr en dispositivo físico

```bash
# Instalar Expo Go en el iPhone desde App Store
pnpm expo start
# Escanear el QR con la cámara del iPhone
```

---

## Git flow

Mismo flujo que el proyecto web (`rules/github-flow.md`):

```
main (producción)
  ↑ PR al final de cada FASE
develop (integración)
  ↑ PRs de cada tarea
feature/[issue-number]-[descripcion]
```

- Cada tarea = 1 issue en GitHub + 1 rama feature + 1 PR a develop
- Al finalizar cada FASE → PR develop → main → esperar aprobación
- Conventional Commits: `feat:`, `fix:`, `chore:`, `refactor:`

---

## Fases de implementación (resumen)

| Fase | Contenido |
|------|-----------|
| 0 | Setup: scaffold Expo, NativeWind, Expo Router, repo GitHub |
| 1 | Autenticación: Google OAuth, SecureStore, AuthContext, RLS en InsForge |
| 2 | Dashboard + navegación base: Tab Navigator, layout, pantalla principal |
| 3 | Transacciones: lista, crear, editar, eliminar |
| 4 | Cuentas y movimientos entre cuentas |
| 5 | Presupuestos y metas de ahorro |
| 6 | Transacciones recurrentes |
| 7 | Reportes y calendario |
| 8 | Chat IA (Claude) |
| 9 | Etiquetas, exportar datos, configuración |
| 10 | PR final a main, release v1.0.0 |
