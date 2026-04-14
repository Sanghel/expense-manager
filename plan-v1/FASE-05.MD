# FASE 05: UI Base con Chakra UI

## 🎯 Objetivo

Configurar Chakra UI, crear el sistema de tema, implementar el layout principal con Header, Sidebar, y componentes base reutilizables.

**Resultado:** UI completa con tema personalizado, navegación funcional, y componentes base listos para usar.

---

## ⚠️ Pre-requisitos

- ✅ FASE 04 completada
- ✅ Chakra UI instalado (FASE 01)

---

## 📋 Inicio

```bash
git checkout develop && git pull
gh issue create --title "FASE 05: UI Base con Chakra UI"
```

📝 Issue #35

---

## 📝 Tareas

### Tarea 5.1: Configurar Chakra UI Provider

**Issue:** "Configurar ChakraProvider en la app"

```bash
git checkout -b feature/36-chakra-provider
```

Crear `components/providers/ChakraProvider.tsx`:

```typescript
'use client'

import { ChakraProvider as ChakraUIProvider } from '@chakra-ui/react'
import { theme } from '@/theme'
import { ReactNode } from 'react'

export function ChakraProvider({ children }: { children: ReactNode }) {
  return <ChakraUIProvider theme={theme}>{children}</ChakraUIProvider>
}
```

Actualizar `app/layout.tsx`:

```typescript
import { SessionProvider } from '@/components/providers/SessionProvider'
import { ChakraProvider } from '@/components/providers/ChakraProvider'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <SessionProvider>
          <ChakraProvider>{children}</ChakraProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
```

```bash
git add . && git commit -m "feat: configure Chakra UI provider"
git push -u origin feature/36-chakra-provider
gh pr create --base develop --title "Configure Chakra UI provider" --body "Closes #36"
gh pr merge --squash && git checkout develop && git pull && git branch -d feature/36-chakra-provider
```

---

### Tarea 5.2: Crear tema personalizado

**Issue:** "Crear tema personalizado de Chakra UI"

```bash
git checkout -b feature/37-custom-theme
```

Crear `theme/index.ts`:

```typescript
import { extendTheme, type ThemeConfig } from "@chakra-ui/react";

const config: ThemeConfig = {
  initialColorMode: "light",
  useSystemColorMode: false,
};

export const theme = extendTheme({
  config,
  colors: {
    brand: {
      50: "#E6F6FF",
      100: "#BAE3FF",
      200: "#7CC4FA",
      300: "#47A3F3",
      400: "#2186EB",
      500: "#0967D2",
      600: "#0552B5",
      700: "#03449E",
      800: "#01337D",
      900: "#002159",
    },
    income: {
      50: "#E6FAF5",
      500: "#2ECC71",
      600: "#27AE60",
    },
    expense: {
      50: "#FFE6E6",
      500: "#E74C3C",
      600: "#C0392B",
    },
  },
  fonts: {
    heading: "var(--font-inter)",
    body: "var(--font-inter)",
  },
  styles: {
    global: {
      body: {
        bg: "gray.50",
      },
    },
  },
  components: {
    Button: {
      defaultProps: {
        colorScheme: "brand",
      },
    },
  },
});
```

```bash
git add . && git commit -m "feat: create custom Chakra UI theme"
git push -u origin feature/37-custom-theme
gh pr create --base develop --title "Create custom theme" --body "Closes #37"
gh pr merge --squash && git checkout develop && git pull && git branch -d feature/37-custom-theme
```

---

### Tarea 5.3: Crear componente Header

**Issue:** "Crear Header component"

```bash
git checkout -b feature/38-header-component
```

Crear `components/dashboard/Header.tsx`:

```typescript
'use client'

import {
  Box,
  Flex,
  Heading,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Button,
  useColorModeValue,
} from '@chakra-ui/react'
import { signOut, useSession } from 'next-auth/react'
import { FiLogOut, FiSettings } from 'react-icons/fi'

export function Header() {
  const { data: session } = useSession()
  const bgColor = useColorModeValue('white', 'gray.800')

  return (
    <Box
      as="header"
      bg={bgColor}
      borderBottomWidth="1px"
      borderColor="gray.200"
      px={8}
      py={4}
    >
      <Flex justify="space-between" align="center">
        <Heading size="md" color="brand.600">
          Expense Manager
        </Heading>

        {session?.user && (
          <Menu>
            <MenuButton as={Button} variant="ghost" rounded="full" p={0}>
              <Avatar
                size="sm"
                name={session.user.name || ''}
                src={session.user.image || ''}
              />
            </MenuButton>
            <MenuList>
              <MenuItem icon={<FiSettings />}>Configuración</MenuItem>
              <MenuItem
                icon={<FiLogOut />}
                onClick={() => signOut()}
              >
                Cerrar Sesión
              </MenuItem>
            </MenuList>
          </Menu>
        )}
      </Flex>
    </Box>
  )
}
```

```bash
git add . && git commit -m "feat: create Header component"
git push -u origin feature/38-header-component
gh pr create --base develop --title "Create Header component" --body "Closes #38"
gh pr merge --squash && git checkout develop && git pull && git branch -d feature/38-header-component
```

---

### Tarea 5.4: Crear componente Sidebar

**Issue:** "Crear Sidebar con navegación"

```bash
git checkout -b feature/39-sidebar-component
```

Crear `components/dashboard/Sidebar.tsx`:

```typescript
'use client'

import { Box, VStack, Button, Icon } from '@chakra-ui/react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  FiHome,
  FiDollarSign,
  FiTag,
  FiTrendingUp,
  FiMessageSquare,
} from 'react-icons/fi'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: FiHome },
  { href: '/transactions', label: 'Transacciones', icon: FiDollarSign },
  { href: '/categories', label: 'Categorías', icon: FiTag },
  { href: '/budgets', label: 'Presupuestos', icon: FiTrendingUp },
  { href: '/chat', label: 'Chat IA', icon: FiMessageSquare },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <Box
      as="nav"
      w="64"
      bg="white"
      borderRightWidth="1px"
      borderColor="gray.200"
      h="full"
      p={4}
    >
      <VStack spacing={2} align="stretch">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Button
              key={item.href}
              as={Link}
              href={item.href}
              leftIcon={<Icon as={item.icon} />}
              variant={isActive ? 'solid' : 'ghost'}
              colorScheme={isActive ? 'brand' : 'gray'}
              justifyContent="flex-start"
            >
              {item.label}
            </Button>
          )
        })}
      </VStack>
    </Box>
  )
}
```

```bash
git add . && git commit -m "feat: create Sidebar component with navigation"
git push -u origin feature/39-sidebar-component
gh pr create --base develop --title "Create Sidebar component" --body "Closes #39"
gh pr merge --squash && git checkout develop && git pull && git branch -d feature/39-sidebar-component
```

---

### Tarea 5.5: Crear Dashboard Layout

**Issue:** "Crear layout principal del dashboard"

```bash
git checkout -b feature/40-dashboard-layout
```

Crear `app/(dashboard)/layout.tsx`:

```typescript
import { Flex, Box } from '@chakra-ui/react'
import { Header } from '@/components/dashboard/Header'
import { Sidebar } from '@/components/dashboard/Sidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Flex direction="column" h="100vh">
      <Header />
      <Flex flex="1" overflow="hidden">
        <Sidebar />
        <Box as="main" flex="1" overflow="auto" p={8}>
          {children}
        </Box>
      </Flex>
    </Flex>
  )
}
```

Mover `app/page.tsx` a `app/(dashboard)/dashboard/page.tsx`

```bash
git add . && git commit -m "feat: create dashboard layout"
git push -u origin feature/40-dashboard-layout
gh pr create --base develop --title "Create dashboard layout" --body "Closes #40"
gh pr merge --squash && git checkout develop && git pull && git branch -d feature/40-dashboard-layout
```

---

### Tarea 5.6: Crear componentes UI base

**Issue:** "Crear componentes UI reutilizables"

```bash
git checkout -b feature/41-ui-components
```

Crear `components/ui/Card.tsx`:

```typescript
import { Box, useColorModeValue, BoxProps } from '@chakra-ui/react'

export function Card({ children, ...props }: BoxProps) {
  const bgColor = useColorModeValue('white', 'gray.800')

  return (
    <Box
      bg={bgColor}
      borderRadius="lg"
      borderWidth="1px"
      borderColor="gray.200"
      p={6}
      shadow="sm"
      {...props}
    >
      {children}
    </Box>
  )
}
```

Crear `components/ui/StatCard.tsx`:

```typescript
import { Card } from './Card'
import { Stat, StatLabel, StatNumber, StatHelpText } from '@chakra-ui/react'

interface StatCardProps {
  label: string
  value: string | number
  helpText?: string
}

export function StatCard({ label, value, helpText }: StatCardProps) {
  return (
    <Card>
      <Stat>
        <StatLabel>{label}</StatLabel>
        <StatNumber>{value}</StatNumber>
        {helpText && <StatHelpText>{helpText}</StatHelpText>}
      </Stat>
    </Card>
  )
}
```

```bash
git add . && git commit -m "feat: create reusable UI components"
git push -u origin feature/41-ui-components
gh pr create --base develop --title "Create reusable UI components" --body "Closes #41"
gh pr merge --squash && git checkout develop && git pull && git branch -d feature/41-ui-components
```

---

### Tarea 5.7: Actualizar página de dashboard

**Issue:** "Actualizar dashboard con nuevo layout"

```bash
git checkout -b feature/42-update-dashboard-page
```

Actualizar `app/(dashboard)/dashboard/page.tsx`:

```typescript
'use client'

import { Box, Heading, SimpleGrid } from '@chakra-ui/react'
import { StatCard } from '@/components/ui/StatCard'

export default function DashboardPage() {
  return (
    <Box>
      <Heading mb={8}>Dashboard</Heading>

      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={8}>
        <StatCard
          label="Balance Total"
          value="$0.00 COP"
          helpText="Este mes"
        />
        <StatCard
          label="Gastos"
          value="$0.00"
          helpText="Este mes"
        />
        <StatCard
          label="Ingresos"
          value="$0.00"
          helpText="Este mes"
        />
      </SimpleGrid>

      <Box
        bg="blue.50"
        p={6}
        borderRadius="lg"
        borderLeftWidth="4px"
        borderLeftColor="blue.500"
      >
        <Heading size="sm" mb={2}>
          ✅ FASE 05 Completada
        </Heading>
        <Box fontSize="sm" color="blue.800">
          • Layout principal configurado
          <br />
          • Header y Sidebar funcionales
          <br />
          • Tema de Chakra UI aplicado
          <br />
          • Componentes base creados
        </Box>
      </Box>
    </Box>
  )
}
```

```bash
git add . && git commit -m "feat: update dashboard page with new layout"
git push -u origin feature/42-update-dashboard-page
gh pr create --base develop --title "Update dashboard page" --body "Closes #42"
gh pr merge --squash && git checkout develop && git pull && git branch -d feature/42-update-dashboard-page
```

---

### Tarea 5.8: Testing de UI

**Issue:** "Verificar UI completa"

**Checklist manual:**

```bash
pnpm dev
```

- [ ] Header se muestra correctamente
- [ ] Sidebar con navegación funciona
- [ ] Links de navegación resaltan correctamente
- [ ] Avatar con menú desplegable funciona
- [ ] Cerrar sesión funciona
- [ ] Tema de colores aplicado
- [ ] Responsive en móvil
- [ ] No hay errores en consola

---

## 🎯 Fin de Fase 5

### Verificación

```bash
pnpm build
pnpm type-check
pnpm lint
```

**Checklist:**

- [ ] ✅ Chakra UI configurado
- [ ] ✅ Tema personalizado creado
- [ ] ✅ Header implementado
- [ ] ✅ Sidebar implementada
- [ ] ✅ Dashboard layout funcionando
- [ ] ✅ Componentes UI base creados
- [ ] ✅ Navegación funcional
- [ ] ✅ Responsive

---

### PR Final

```bash
gh pr create \
  --base main \
  --head develop \
  --title "FASE 05: UI Base con Chakra UI" \
  --body "UI completa con tema, layout, y componentes base

Closes #35"
```

**🛑 DETENER - 📢 NOTIFICAR - ⏸️ ESPERAR**

---

**¡FASE 05 COMPLETADA! 🎉**

**Siguiente:** FASE-06.md (Dashboard Principal) - Crear en siguientes iteraciones

---

## 📚 Resumen de Fases 1-5

**FASE 01:** ✅ Proyecto Next.js configurado
**FASE 02:** ✅ Autenticación con NextAuth + Google OAuth
**FASE 03:** ✅ Base de datos completa en InsForge
**FASE 04:** ✅ Server Actions (Backend API)
**FASE 05:** ✅ UI Base con Chakra UI

**Stack completo funcionando:**

- Frontend: Next.js + TypeScript + Chakra UI ✅
- Backend: InsForge (PostgreSQL + Auth + Storage) ✅
- API: Server Actions + Zod validation ✅
- Auth: NextAuth.js + Google OAuth + Whitelist ✅

**Listo para:** Implementar funcionalidades de negocio (FASE 06+)
