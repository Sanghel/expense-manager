# Presupuestos por grupo y por categoría — Plan de implementación

> **Para agentes:** SUB-SKILL REQUERIDA: usa `superpowers:subagent-driven-development` (recomendado) o `superpowers:executing-plans` para implementar este plan tarea por tarea. Los pasos usan checkbox (`- [ ]`) para seguimiento.

**Goal:** Separar los presupuestos en dos vistas (por grupo y por categoría) dentro de la pestaña Presupuestos, con layouts densos en desktop y mobile, y convertir el widget del dashboard en un resumen compacto de los presupuestos de grupo.

**Architecture:** No cambia la capa de datos. `getBudgets` ya devuelve todos los presupuestos con `spent` y `limit_amount` calculados para los tres scopes; toda la feature es presentación. La aritmética (split por scope, orden por consumo, residual del grupo) se extrae a un módulo de funciones puras (`lib/utils/budget-grouping.ts`) que es la única pieza con pruebas reales. Los dos layouts responsive se resuelven con CSS (`display` por breakpoint), no con JS, para evitar desajustes de hidratación.

**Tech Stack:** Next.js 16.2.3 (App Router, Server Components), React 19, Chakra UI v3.34, TypeScript, pnpm, InsForge SDK.

**Spec:** `docs/specs/2026-09-15-presupuestos-por-grupo-y-categoria-design.md`

## Global Constraints

- **Next.js 16.2.3** tiene cambios incompatibles con conocimiento previo. Antes de escribir código, leer la guía correspondiente en `node_modules/next/dist/docs/`, en particular lo relativo a `searchParams` en Server Components (en este repo ya se usa como `Promise` y se hace `await`; ver `app/(dashboard)/planificacion/page.tsx`).
- **Chakra UI v3**: la API de Tabs es `Tabs.Root` / `Tabs.List` / `Tabs.Trigger` / `Tabs.Content`. No usar la API de v2.
- **No modificar** `lib/actions/budgets.actions.ts`, `lib/validations/budget.ts`, `components/budgets/BudgetForm.tsx` (salvo lo indicado en la Tarea 5) ni el esquema de base de datos.
- **Paleta oscura obligatoria:** fondos `#0F0F0F` y `#1A1A1A`, bordes `#2d2d35`, texto secundario `#B0B0B0`, acento `#4F46E5` / `#6366f1`.
- **Umbrales de color de progreso** (idénticos a `BudgetProgress` actual): verde `#16A34A` hasta 80%, amarillo `#EAB308` por encima de 80%, rojo `#DC2626` por encima de 100%.
- **Montos siempre con `formatCurrency`** de `lib/utils/currency.ts`. Nunca `toLocaleString` a mano.
- **Números desde la base siempre con `toNumber`** de `lib/utils/numbers.ts`: las columnas `numeric` de Postgres llegan como string por el SDK de InsForge, y sumarlas sin coerción concatena en vez de sumar.
- **Sin framework de tests.** La verificación de UI es `pnpm type-check`, `pnpm lint`, `pnpm build` y revisión visual. Solo la Tarea 1 lleva pruebas automatizadas, con la convención `scripts/test-*.ts` ejecutada por `npx tsx`.
- **Idioma de la interfaz:** español.
- **Commits:** convención del repo, `tipo(scope): descripción en español`. Sin atribución a Claude.

---

### Task 1: Módulo de agrupación (funciones puras)

**Files:**
- Create: `lib/utils/budget-grouping.ts`
- Create: `scripts/test-budget-grouping.ts`

**Interfaces:**
- Consumes: `toNumber`, `safeRatio` de `lib/utils/numbers.ts`; tipos `BudgetWithSpent`, `CategoryGroupWithMembers` de `types/database.types.ts`.
- Produces:
  - `splitBudgetsByScope(budgets: BudgetWithSpent[]): { total: BudgetWithSpent[]; groups: BudgetWithSpent[]; categories: BudgetWithSpent[] }`
  - `sortByConsumption(budgets: BudgetWithSpent[]): BudgetWithSpent[]`
  - `buildGroupBreakdown(groupBudget: BudgetWithSpent, categoryBudgets: BudgetWithSpent[], groups: CategoryGroupWithMembers[]): GroupBreakdown`
  - tipos `GroupBreakdownMember` y `GroupBreakdown`

- [ ] **Step 1: Escribir el script de pruebas que falla**

Crear `scripts/test-budget-grouping.ts`:

```ts
import {
  splitBudgetsByScope,
  sortByConsumption,
  buildGroupBreakdown,
} from '../lib/utils/budget-grouping'
import type { BudgetWithSpent, CategoryGroupWithMembers } from '../types/database.types'

/** Construye un BudgetWithSpent mínimo; solo importan los campos que el módulo lee. */
function budget(partial: Partial<BudgetWithSpent>): BudgetWithSpent {
  return {
    id: 'b',
    user_id: 'u',
    scope: 'category',
    category_id: null,
    group_id: null,
    amount_type: 'fixed',
    amount: 0,
    percent: null,
    currency: 'COP',
    period: 'monthly',
    start_date: '2026-10-01',
    created_at: '2026-09-15T00:00:00Z',
    category: null,
    group: null,
    spent: 0,
    limit_amount: 0,
    periodIncome: 0,
    periodExpense: 0,
    periodStart: '2026-10-01',
    periodEnd: '2026-10-31',
    ...partial,
  } as BudgetWithSpent
}

const grupoOcio: CategoryGroupWithMembers = {
  id: 'g1',
  user_id: 'u',
  name: 'Estilo de Vida',
  icon: '🎈',
  color: null,
  created_at: '2026-09-15T00:00:00Z',
  category_ids: ['c1', 'c2', 'c3'],
}

let passed = 0
let failed = 0

function check(name: string, ok: boolean, extra?: unknown) {
  if (ok) {
    passed++
    console.log(`  ✅ ${name}`)
  } else {
    failed++
    console.error(`  ❌ ${name}`)
    if (extra !== undefined) console.error('     got', extra)
  }
}

// --- splitBudgetsByScope ---
{
  const all = [
    budget({ id: 'g', scope: 'group', group_id: 'g1' }),
    budget({ id: 'c', scope: 'category', category_id: 'c1' }),
    budget({ id: 't', scope: 'total' }),
  ]
  const r = splitBudgetsByScope(all)
  check('split: separa los tres scopes',
    r.groups.length === 1 && r.categories.length === 1 && r.total.length === 1, r)
}

// --- sortByConsumption ---
{
  const r = sortByConsumption([
    budget({ id: 'bajo', spent: 10, limit_amount: 100 }),
    budget({ id: 'alto', spent: 90, limit_amount: 100 }),
    budget({ id: 'medio', spent: 50, limit_amount: 100 }),
  ])
  check('orden: descendente por consumo',
    r.map((b) => b.id).join(',') === 'alto,medio,bajo', r.map((b) => b.id))
}
{
  // limit_amount 0 no debe producir NaN ni romper el orden
  const r = sortByConsumption([
    budget({ id: 'cero', spent: 10, limit_amount: 0 }),
    budget({ id: 'alto', spent: 90, limit_amount: 100 }),
  ])
  check('orden: límite cero va al final sin NaN',
    r.map((b) => b.id).join(',') === 'alto,cero', r.map((b) => b.id))
}

// --- buildGroupBreakdown ---
{
  const g = budget({ id: 'g', scope: 'group', group_id: 'g1', spent: 1000, limit_amount: 1500 })
  const cats = [
    budget({ id: 'c1', category_id: 'c1', spent: 400, limit_amount: 500 }), // 80%
    budget({ id: 'c2', category_id: 'c2', spent: 300, limit_amount: 1000 }), // 30%
  ]
  const r = buildGroupBreakdown(g, cats, [grupoOcio])
  check('breakdown: residual positivo = 1000 - 700', r.residual === 300, r.residual)
  check('breakdown: miembros ordenados por consumo desc',
    r.members.map((m) => m.budget.id).join(',') === 'c1,c2', r.members.map((m) => m.budget.id))
  check('breakdown: ratio calculado', Math.abs(r.members[0].ratio - 0.8) < 1e-9, r.members[0]?.ratio)
}
{
  const g = budget({ id: 'g', scope: 'group', group_id: 'g1', spent: 700, limit_amount: 1500 })
  const cats = [budget({ id: 'c1', category_id: 'c1', spent: 700, limit_amount: 1000 })]
  const r = buildGroupBreakdown(g, cats, [grupoOcio])
  check('breakdown: residual cero cuando los miembros cubren el total', r.residual === 0, r.residual)
}
{
  // Periodos desalineados pueden dar residual negativo: debe quedar en 0, nunca negativo.
  const g = budget({ id: 'g', scope: 'group', group_id: 'g1', spent: 500, limit_amount: 1500 })
  const cats = [budget({ id: 'c1', category_id: 'c1', spent: 900, limit_amount: 1000 })]
  const r = buildGroupBreakdown(g, cats, [grupoOcio])
  check('breakdown: residual negativo se normaliza a 0', r.residual === 0, r.residual)
}
{
  // Categorías que NO pertenecen al grupo no entran ni en miembros ni en el residual.
  const g = budget({ id: 'g', scope: 'group', group_id: 'g1', spent: 1000, limit_amount: 1500 })
  const cats = [
    budget({ id: 'dentro', category_id: 'c1', spent: 400, limit_amount: 500 }),
    budget({ id: 'fuera', category_id: 'zzz', spent: 999, limit_amount: 999 }),
  ]
  const r = buildGroupBreakdown(g, cats, [grupoOcio])
  check('breakdown: ignora categorías ajenas al grupo',
    r.members.length === 1 && r.members[0].budget.id === 'dentro' && r.residual === 600, r)
}
{
  const g = budget({ id: 'g', scope: 'group', group_id: 'inexistente', spent: 300, limit_amount: 500 })
  const r = buildGroupBreakdown(g, [], [grupoOcio])
  check('breakdown: grupo sin miembros -> residual = gasto del grupo',
    r.members.length === 0 && r.residual === 300, r)
}
{
  // El SDK de InsForge entrega numeric como string: no debe concatenar.
  const g = budget({ id: 'g', scope: 'group', group_id: 'g1', spent: '1000' as unknown as number, limit_amount: 1500 })
  const cats = [budget({ id: 'c1', category_id: 'c1', spent: '400' as unknown as number, limit_amount: 500 })]
  const r = buildGroupBreakdown(g, cats, [grupoOcio])
  check('breakdown: coerciona strings numéricos', r.residual === 600, r.residual)
}

console.log(`\n${passed}/${passed + failed} checks passed`)
if (failed > 0) process.exit(1)
```

- [ ] **Step 2: Correr el script y verificar que falla**

Run: `npx tsx scripts/test-budget-grouping.ts`
Expected: FAIL — no resuelve el módulo `../lib/utils/budget-grouping`.

- [ ] **Step 3: Implementar el módulo**

Crear `lib/utils/budget-grouping.ts`:

```ts
import { safeRatio, toNumber } from './numbers'
import type { BudgetWithSpent, CategoryGroupWithMembers } from '@/types/database.types'

export interface GroupBreakdownMember {
  budget: BudgetWithSpent
  /** Proporción consumida (0-1+). 0 cuando el límite es 0. */
  ratio: number
}

export interface GroupBreakdown {
  /** El presupuesto de grupo. */
  group: BudgetWithSpent
  /** Categorías miembro CON presupuesto propio, ordenadas por consumo desc. */
  members: GroupBreakdownMember[]
  /**
   * Gasto del grupo que no cubre ninguna categoría con presupuesto propio.
   * Normalizado a 0: un presupuesto de categoría con periodo distinto al del
   * grupo compara ventanas de tiempo diferentes y puede dar negativo.
   */
  residual: number
}

export function splitBudgetsByScope(budgets: BudgetWithSpent[]): {
  total: BudgetWithSpent[]
  groups: BudgetWithSpent[]
  categories: BudgetWithSpent[]
} {
  return {
    total: budgets.filter((b) => b.scope === 'total'),
    groups: budgets.filter((b) => b.scope === 'group'),
    categories: budgets.filter((b) => b.scope === 'category'),
  }
}

/** Orden descendente por proporción consumida. No muta la entrada. */
export function sortByConsumption(budgets: BudgetWithSpent[]): BudgetWithSpent[] {
  return [...budgets].sort(
    (a, b) => safeRatio(b.spent, b.limit_amount) - safeRatio(a.spent, a.limit_amount)
  )
}

export function buildGroupBreakdown(
  groupBudget: BudgetWithSpent,
  categoryBudgets: BudgetWithSpent[],
  groups: CategoryGroupWithMembers[]
): GroupBreakdown {
  const memberIds = new Set(
    groups.find((g) => g.id === groupBudget.group_id)?.category_ids ?? []
  )
  const members = categoryBudgets.filter(
    (b) => b.category_id !== null && memberIds.has(b.category_id)
  )
  const membersSpent = members.reduce((acc, b) => acc + toNumber(b.spent), 0)
  const residual = toNumber(groupBudget.spent) - membersSpent

  return {
    group: groupBudget,
    members: sortByConsumption(members).map((b) => ({
      budget: b,
      ratio: safeRatio(b.spent, b.limit_amount),
    })),
    residual: residual > 0 ? residual : 0,
  }
}
```

- [ ] **Step 4: Correr el script y verificar que pasa**

Run: `npx tsx scripts/test-budget-grouping.ts`
Expected: PASS — `11/11 checks passed`.

- [ ] **Step 5: Verificar tipos y formato**

Run: `pnpm type-check && pnpm lint`
Expected: sin errores.

- [ ] **Step 6: Commit**

```bash
git add lib/utils/budget-grouping.ts scripts/test-budget-grouping.ts
git commit -m "feat(budgets): agregar utilidades puras de agrupación y residual"
```

---

### Task 2: Variante compacta en BudgetProgress

**Files:**
- Modify: `components/budgets/BudgetProgress.tsx`

**Interfaces:**
- Consumes: nada de tareas previas.
- Produces: `BudgetProgress` acepta `variant?: 'full' | 'bar'`. `'full'` es el valor por defecto y es exactamente el render actual (no debe cambiar ni un píxel). `'bar'` renderiza solo la barra, sin encabezado de porcentaje ni pie de gastado/restante. También exporta `progressColor(percentage: number): string`.

- [ ] **Step 1: Extraer el color y agregar la variante**

Reemplazar el contenido de `components/budgets/BudgetProgress.tsx` por:

```tsx
'use client'

import { HStack, Text, Box, Badge } from '@chakra-ui/react'
import { formatCurrency } from '@/lib/utils/currency'
import { safeRatio, toNumber } from '@/lib/utils/numbers'
import type { BudgetWithSpent } from '@/types/database.types'

interface Props {
  budget: Pick<BudgetWithSpent, 'limit_amount' | 'spent' | 'currency' | 'amount_type'>
  /** 'full' (por defecto) = barra con encabezado y pie. 'bar' = solo la barra. */
  variant?: 'full' | 'bar'
}

/** Umbrales compartidos: verde ≤80%, amarillo >80%, rojo >100%. */
export function progressColor(percentage: number): string {
  if (percentage > 100) return '#DC2626'
  if (percentage > 80) return '#EAB308'
  return '#16A34A'
}

export function BudgetProgress({ budget, variant = 'full' }: Props) {
  const limit = toNumber(budget.limit_amount)
  const spent = toNumber(budget.spent)
  const percentage = safeRatio(spent, limit) * 100
  const remaining = limit - spent

  // A percentage budget resolves to 0 in a period with no income/expense yet.
  if (limit <= 0 && budget.amount_type !== 'fixed') {
    return (
      <Text fontSize="xs" color="#B0B0B0">
        Sin movimientos suficientes en este periodo para calcular el límite.
      </Text>
    )
  }

  const bgColor = progressColor(percentage)

  const bar = (
    <Box w="full" h="2" bg="#2A2A2A" borderRadius="md" overflow="hidden">
      <Box h="full" w={`${Math.min(percentage, 100)}%`} bg={bgColor} transition="width 0.3s" />
    </Box>
  )

  if (variant === 'bar') return bar

  return (
    <Box>
      <HStack justify="space-between" mb={2}>
        <Text fontSize="sm" fontWeight="medium">
          {percentage.toFixed(1)}%
        </Text>
        {percentage > 100 && <Badge colorPalette="red">Excedido</Badge>}
      </HStack>
      {bar}
      <HStack fontSize="xs" color="#B0B0B0" justify="space-between" mt={2}>
        <Text>Gastado: {formatCurrency(spent, budget.currency)}</Text>
        <Text>Restante: {formatCurrency(Math.max(remaining, 0), budget.currency)}</Text>
      </HStack>
    </Box>
  )
}
```

- [ ] **Step 2: Verificar que compila y no rompe consumidores**

Run: `pnpm type-check && pnpm lint`
Expected: sin errores. `BudgetList.tsx` y `BudgetWidget.tsx` siguen usando `BudgetProgress` sin `variant` y deben mantener su render actual.

- [ ] **Step 3: Commit**

```bash
git add components/budgets/BudgetProgress.tsx
git commit -m "feat(budgets): agregar variante de solo barra a BudgetProgress"
```

---

### Task 3: Vista de categorías — tabla en desktop, filas en mobile

**Files:**
- Create: `components/budgets/BudgetCategoryTable.tsx`

**Interfaces:**
- Consumes: `sortByConsumption` (Tarea 1); `BudgetProgress` con `variant="bar"` y `progressColor` (Tarea 2).
- Produces: componente `BudgetCategoryTable` con props `{ budgets: BudgetWithSpent[]; onEdit: (b: BudgetWithSpent) => void; onDelete: (id: string) => void }`.

Notas de implementación:
- Los dos layouts se eligen con CSS por breakpoint (`display={{ base: 'block', lg: 'none' }}` y su inverso), **no** con `useBreakpointValue`: así el HTML del servidor y el del cliente coinciden.
- El corte es `lg` (1024px).
- En mobile, tocar una fila alterna un panel inline con detalle y acciones (no un modal).
- El componente no maneja el diálogo de confirmación: llama a `onDelete(id)` y el padre decide.

- [ ] **Step 1: Crear el componente**

Crear `components/budgets/BudgetCategoryTable.tsx`:

```tsx
'use client'

import { Box, HStack, VStack, Text, Button, Grid } from '@chakra-ui/react'
import { useState } from 'react'
import { BudgetProgress, progressColor } from './BudgetProgress'
import { sortByConsumption } from '@/lib/utils/budget-grouping'
import { formatCurrency } from '@/lib/utils/currency'
import { safeRatio, toNumber } from '@/lib/utils/numbers'
import type { BudgetWithSpent } from '@/types/database.types'

interface Props {
  budgets: BudgetWithSpent[]
  onEdit: (budget: BudgetWithSpent) => void
  onDelete: (budgetId: string) => void
}

const COLS = '1.6fr 1fr 2.2fr 64px'

function label(budget: BudgetWithSpent): string {
  const icon = budget.category?.icon ? `${budget.category.icon} ` : ''
  return `${icon}${budget.category?.name ?? 'Sin categoría'}`
}

function pct(budget: BudgetWithSpent): number {
  return safeRatio(budget.spent, budget.limit_amount) * 100
}

export function BudgetCategoryTable({ budgets, onEdit, onDelete }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const ordered = sortByConsumption(budgets)

  if (ordered.length === 0) {
    return (
      <Text color="#B0B0B0">
        No hay presupuestos por categoría. Crea uno para empezar.
      </Text>
    )
  }

  return (
    <>
      {/* ---------- Desktop: tabla densa ---------- */}
      <Box display={{ base: 'none', lg: 'block' }}>
        <Grid
          templateColumns={COLS}
          gap={3}
          px={3}
          pb={2}
          borderBottomWidth="1px"
          borderColor="#2d2d35"
        >
          <Text fontSize="10px" fontWeight="600" letterSpacing="0.09em" textTransform="uppercase" color="#6f6f78">
            Categoría
          </Text>
          <Text fontSize="10px" fontWeight="600" letterSpacing="0.09em" textTransform="uppercase" color="#6f6f78" textAlign="right">
            Tope
          </Text>
          <Text fontSize="10px" fontWeight="600" letterSpacing="0.09em" textTransform="uppercase" color="#6f6f78">
            Consumo
          </Text>
          <Text fontSize="10px" fontWeight="600" letterSpacing="0.09em" textTransform="uppercase" color="#6f6f78" textAlign="right">
            %
          </Text>
        </Grid>

        {ordered.map((budget) => (
          <Grid
            key={budget.id}
            templateColumns={COLS}
            gap={3}
            px={3}
            py={2}
            alignItems="center"
            borderBottomWidth="1px"
            borderColor="#212128"
            role="group"
            _hover={{ bg: '#17171c' }}
            transition="background 0.15s"
          >
            <Text fontSize="sm" color="#e8e8ec" truncate>
              {label(budget)}
            </Text>
            <Text fontSize="xs" color="#B0B0B0" textAlign="right">
              {formatCurrency(toNumber(budget.limit_amount), budget.currency)}
            </Text>
            <BudgetProgress budget={budget} variant="bar" />
            <HStack justify="flex-end" gap={1}>
              {/* Acciones al hover; el % cede el lugar */}
              <Text
                fontSize="xs"
                fontWeight="600"
                color={progressColor(pct(budget))}
                _groupHover={{ display: 'none' }}
              >
                {pct(budget).toFixed(0)}%
              </Text>
              <HStack gap={1} display="none" _groupHover={{ display: 'flex' }}>
                <Button size="xs" variant="ghost" aria-label="Editar" onClick={() => onEdit(budget)}>
                  ✎
                </Button>
                <Button
                  size="xs"
                  variant="ghost"
                  colorPalette="red"
                  aria-label="Eliminar"
                  onClick={() => onDelete(budget.id)}
                >
                  🗑
                </Button>
              </HStack>
            </HStack>
          </Grid>
        ))}
      </Box>

      {/* ---------- Mobile: filas de dos líneas ---------- */}
      <VStack display={{ base: 'stretch', lg: 'none' }} gap={0} align="stretch">
        {ordered.map((budget) => {
          const isOpen = expandedId === budget.id
          const percentage = pct(budget)
          return (
            <Box key={budget.id} borderBottomWidth="1px" borderColor="#212128" py={2}>
              <Box
                as="button"
                w="full"
                textAlign="left"
                onClick={() => setExpandedId(isOpen ? null : budget.id)}
              >
                <HStack justify="space-between" align="baseline" mb={1.5}>
                  <Text fontSize="sm" fontWeight="600" color="white" truncate>
                    {label(budget)}
                  </Text>
                  <Text fontSize="sm" fontWeight="700" color={progressColor(percentage)}>
                    {percentage.toFixed(0)}%
                  </Text>
                </HStack>
                <BudgetProgress budget={budget} variant="bar" />
                <HStack justify="space-between" mt={1.5} fontSize="10px" color="#6f6f78">
                  <Text>{formatCurrency(toNumber(budget.spent), budget.currency)}</Text>
                  <Text>de {formatCurrency(toNumber(budget.limit_amount), budget.currency)}</Text>
                </HStack>
              </Box>

              {isOpen && (
                <VStack align="stretch" gap={2} mt={3} pt={3} borderTopWidth="1px" borderColor="#212128">
                  <Text fontSize="xs" color="#B0B0B0">
                    {budget.period === 'monthly' ? 'Mensual' : 'Anual'} · desde {budget.start_date}
                  </Text>
                  <HStack gap={2}>
                    <Button size="sm" variant="outline" onClick={() => onEdit(budget)}>
                      Editar
                    </Button>
                    <Button size="sm" variant="ghost" colorPalette="red" onClick={() => onDelete(budget.id)}>
                      Eliminar
                    </Button>
                  </HStack>
                </VStack>
              )}
            </Box>
          )
        })}
      </VStack>
    </>
  )
}
```

- [ ] **Step 2: Verificar tipos y lint**

Run: `pnpm type-check && pnpm lint`
Expected: sin errores. El componente todavía no está montado en ninguna página; eso ocurre en la Tarea 5.

- [ ] **Step 3: Commit**

```bash
git add components/budgets/BudgetCategoryTable.tsx
git commit -m "feat(budgets): agregar tabla densa de presupuestos por categoría"
```

---

### Task 4: Vista de grupos — acordeón con desglose y residual

**Files:**
- Create: `components/budgets/BudgetGroupAccordion.tsx`

**Interfaces:**
- Consumes: `buildGroupBreakdown`, `sortByConsumption` (Tarea 1); `BudgetProgress` con `variant="bar"` y `progressColor` (Tarea 2).
- Produces: componente `BudgetGroupAccordion` con props `{ groupBudgets: BudgetWithSpent[]; categoryBudgets: BudgetWithSpent[]; groups: CategoryGroupWithMembers[]; onEdit: (b: BudgetWithSpent) => void; onDelete: (id: string) => void }`.

Notas de implementación:
- Filas a ancho completo que se expanden hacia abajo. **No** usar grid de cards: expandir dentro de un grid desplaza las columnas vecinas.
- Estado de expansión local con `useState<string | null>` (una sola abierta a la vez).
- La fila residual se renderiza solo si `residual > 0`.

- [ ] **Step 1: Crear el componente**

Crear `components/budgets/BudgetGroupAccordion.tsx`:

```tsx
'use client'

import { Box, HStack, VStack, Text, Button, Grid } from '@chakra-ui/react'
import { useState } from 'react'
import { FiChevronDown, FiChevronRight } from 'react-icons/fi'
import { BudgetProgress, progressColor } from './BudgetProgress'
import { buildGroupBreakdown, sortByConsumption } from '@/lib/utils/budget-grouping'
import { formatCurrency } from '@/lib/utils/currency'
import { safeRatio, toNumber } from '@/lib/utils/numbers'
import type { BudgetWithSpent, CategoryGroupWithMembers } from '@/types/database.types'

interface Props {
  groupBudgets: BudgetWithSpent[]
  categoryBudgets: BudgetWithSpent[]
  groups: CategoryGroupWithMembers[]
  onEdit: (budget: BudgetWithSpent) => void
  onDelete: (budgetId: string) => void
}

export function BudgetGroupAccordion({
  groupBudgets,
  categoryBudgets,
  groups,
  onEdit,
  onDelete,
}: Props) {
  const [openId, setOpenId] = useState<string | null>(null)
  const ordered = sortByConsumption(groupBudgets)

  if (ordered.length === 0) {
    return (
      <Text color="#B0B0B0">
        No hay presupuestos por grupo. Crea uno para ver tus gastos en bloques.
      </Text>
    )
  }

  return (
    <VStack gap={2} align="stretch">
      {ordered.map((groupBudget) => {
        const isOpen = openId === groupBudget.id
        const percentage = safeRatio(groupBudget.spent, groupBudget.limit_amount) * 100
        const breakdown = buildGroupBreakdown(groupBudget, categoryBudgets, groups)

        return (
          <Box
            key={groupBudget.id}
            borderWidth="1px"
            borderColor={percentage > 100 ? '#DC2626' : '#2d2d35'}
            borderRadius="lg"
            bg="#1A1A1A"
            overflow="hidden"
          >
            <Box
              as="button"
              w="full"
              textAlign="left"
              px={4}
              py={3}
              _hover={{ bg: '#1f1f26' }}
              transition="background 0.15s"
              onClick={() => setOpenId(isOpen ? null : groupBudget.id)}
            >
              <HStack justify="space-between" mb={2}>
                <HStack gap={2}>
                  <Box color="#6f6f78" display="flex">
                    {isOpen ? <FiChevronDown /> : <FiChevronRight />}
                  </Box>
                  <Text fontSize="sm" fontWeight="600" color="white">
                    {groupBudget.group?.icon ?? '📦'} {groupBudget.group?.name ?? 'Grupo eliminado'}
                  </Text>
                </HStack>
                <HStack gap={3}>
                  <Text fontSize="xs" color="#B0B0B0">
                    {formatCurrency(toNumber(groupBudget.spent), groupBudget.currency)} de{' '}
                    {formatCurrency(toNumber(groupBudget.limit_amount), groupBudget.currency)}
                  </Text>
                  <Text fontSize="sm" fontWeight="700" color={progressColor(percentage)}>
                    {percentage.toFixed(0)}%
                  </Text>
                </HStack>
              </HStack>
              <BudgetProgress budget={groupBudget} variant="bar" />
            </Box>

            {isOpen && (
              <VStack
                align="stretch"
                gap={2}
                px={4}
                py={3}
                borderTopWidth="1px"
                borderColor="#26262e"
                bg="#141418"
              >
                {breakdown.members.map(({ budget, ratio }) => (
                  <Grid key={budget.id} templateColumns="1.4fr 2fr 48px" gap={3} alignItems="center">
                    <Text fontSize="xs" color="#e8e8ec" truncate>
                      {budget.category?.icon ?? ''} {budget.category?.name ?? 'Sin categoría'}
                    </Text>
                    <BudgetProgress budget={budget} variant="bar" />
                    <Text fontSize="xs" fontWeight="600" textAlign="right" color={progressColor(ratio * 100)}>
                      {(ratio * 100).toFixed(0)}%
                    </Text>
                  </Grid>
                ))}

                {breakdown.residual > 0 && (
                  <Grid templateColumns="1.4fr 2fr 48px" gap={3} alignItems="center" pt={1}>
                    <Text fontSize="xs" color="#6f6f78" fontStyle="italic" truncate>
                      Otras categorías del grupo
                    </Text>
                    <Text fontSize="xs" color="#6f6f78">
                      {formatCurrency(breakdown.residual, groupBudget.currency)}
                    </Text>
                    <Box />
                  </Grid>
                )}

                {breakdown.members.length === 0 && breakdown.residual === 0 && (
                  <Text fontSize="xs" color="#6f6f78">
                    Sin gasto registrado en este periodo.
                  </Text>
                )}

                <HStack gap={2} pt={2} borderTopWidth="1px" borderColor="#26262e" mt={1}>
                  <Button size="xs" variant="outline" onClick={() => onEdit(groupBudget)}>
                    Editar
                  </Button>
                  <Button size="xs" variant="ghost" colorPalette="red" onClick={() => onDelete(groupBudget.id)}>
                    Eliminar
                  </Button>
                </HStack>
              </VStack>
            )}
          </Box>
        )
      })}
    </VStack>
  )
}
```

- [ ] **Step 2: Verificar tipos y lint**

Run: `pnpm type-check && pnpm lint`
Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
git add components/budgets/BudgetGroupAccordion.tsx
git commit -m "feat(budgets): agregar acordeón de presupuestos por grupo con desglose"
```

---

### Task 5: Cablear sub-tabs y retirar BudgetList

**Files:**
- Modify: `app/(dashboard)/planificacion/page.tsx`
- Modify: `app/(dashboard)/planificacion/PlanificacionPageClient.tsx`
- Modify: `app/(dashboard)/budgets/BudgetsPageClient.tsx`
- Modify: `components/budgets/BudgetForm.tsx`
- Delete: `components/budgets/BudgetList.tsx`

**Interfaces:**
- Consumes: `splitBudgetsByScope` (Tarea 1), `BudgetCategoryTable` (Tarea 3), `BudgetGroupAccordion` (Tarea 4).
- Produces: la ruta `?tab=presupuestos&vista=grupos|categorias` funcionando de punta a punta.

- [ ] **Step 1: Leer `vista` en el Server Component**

En `app/(dashboard)/planificacion/page.tsx`:

1. Junto a `type Tab = 'metas' | 'presupuestos'`, agregar:

```ts
type Vista = 'grupos' | 'categorias'
```

2. Cambiar la firma de `searchParams` a:

```ts
searchParams: Promise<{ tab?: string; vista?: string }>
```

3. Después de `const tab = (params.tab as Tab) || 'metas'`, agregar:

```ts
const vista: Vista = params.vista === 'categorias' ? 'categorias' : 'grupos'
```

4. Pasar `vista={vista}` a `<PlanificacionPageClient />`.

- [ ] **Step 2: Propagar `vista` en el cliente**

En `app/(dashboard)/planificacion/PlanificacionPageClient.tsx`:

1. Agregar `vista: 'grupos' | 'categorias'` a `Props` y desestructurarlo.
2. Pasarlo a `<BudgetsPageClient ... vista={vista} />`.
3. En `handleTabChange`, conservar la vista al cambiar de pestaña:

```ts
const handleTabChange = (tab: string) => {
  setPendingTab(tab)
  startTransition(() => {
    const qs = tab === 'presupuestos' ? `?tab=${tab}&vista=${vista}` : `?tab=${tab}`
    router.push(`/planificacion${qs}`)
  })
}
```

- [ ] **Step 3: Reescribir BudgetsPageClient con sub-tabs**

Reemplazar el contenido de `app/(dashboard)/budgets/BudgetsPageClient.tsx` por:

```tsx
'use client'

import { VStack, Heading, Button, HStack, Box, Icon, Text } from '@chakra-ui/react'
import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { FiPieChart } from 'react-icons/fi'
import { BudgetForm } from '@/components/budgets/BudgetForm'
import { BudgetGroupAccordion } from '@/components/budgets/BudgetGroupAccordion'
import { BudgetCategoryTable } from '@/components/budgets/BudgetCategoryTable'
import { BudgetProgress } from '@/components/budgets/BudgetProgress'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { deleteBudget } from '@/lib/actions/budgets.actions'
import { splitBudgetsByScope } from '@/lib/utils/budget-grouping'
import { formatCurrency } from '@/lib/utils/currency'
import { toaster } from '@/lib/toaster'
import type { BudgetWithSpent, Category, CategoryGroupWithMembers } from '@/types/database.types'

type Vista = 'grupos' | 'categorias'

interface Props {
  userId: string
  categories: Category[]
  groups?: CategoryGroupWithMembers[]
  initialBudgets: BudgetWithSpent[]
  vista: Vista
}

export function BudgetsPageClient({
  userId,
  categories,
  groups = [],
  initialBudgets,
  vista,
}: Props) {
  const router = useRouter()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingBudget, setEditingBudget] = useState<BudgetWithSpent | null>(null)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const { total, groups: groupBudgets, categories: categoryBudgets } =
    splitBudgetsByScope(initialBudgets)

  const handleFormSuccess = useCallback(() => {
    router.refresh()
    setEditingBudget(null)
  }, [router])

  const handleEdit = (budget: BudgetWithSpent) => {
    setEditingBudget(budget)
    setIsFormOpen(true)
  }

  const handleClose = () => {
    setIsFormOpen(false)
    setEditingBudget(null)
  }

  const handleDelete = async () => {
    if (!pendingDeleteId) return
    setIsDeleting(true)
    const result = await deleteBudget(pendingDeleteId, userId)
    setIsDeleting(false)
    if (result.success) {
      toaster.create({ title: 'Presupuesto eliminado', type: 'success', duration: 3000 })
      setPendingDeleteId(null)
      router.refresh()
    } else {
      toaster.create({ title: 'Error', description: result.error, type: 'error', duration: 3000 })
    }
  }

  const switchVista = (next: Vista) => {
    router.push(`/planificacion?tab=presupuestos&vista=${next}`)
  }

  const pill = (value: Vista, text: string) => (
    <Button
      size="sm"
      borderRadius="full"
      onClick={() => switchVista(value)}
      bg={vista === value ? '#4F46E5' : '#1A1A1A'}
      color={vista === value ? 'white' : '#B0B0B0'}
      borderWidth="1px"
      borderColor={vista === value ? '#4F46E5' : '#2d2d35'}
      _hover={{ bg: vista === value ? '#4338CA' : '#22222a' }}
    >
      {text}
    </Button>
  )

  return (
    <VStack gap={6} align="stretch">
      <HStack justify="space-between">
        <HStack gap={2}>
          <Icon as={FiPieChart} color="#6366f1" boxSize={6} />
          <Heading size="lg">Presupuestos</Heading>
        </HStack>
        <Button
          bg="#4F46E5"
          color="white"
          _hover={{ bg: '#4338CA' }}
          onClick={() => {
            setEditingBudget(null)
            setIsFormOpen(true)
          }}
        >
          Nuevo Presupuesto
        </Button>
      </HStack>

      {/* Presupuestos de scope 'total': no pertenecen a ningún sub-tab. */}
      {total.map((budget) => (
        <Box key={budget.id} borderWidth="1px" borderColor="#2d2d35" borderRadius="lg" p={3} bg="#1A1A1A">
          <HStack justify="space-between" mb={2}>
            <Text fontSize="sm" fontWeight="600" color="white">
              🧾 Todos los gastos
            </Text>
            <Text fontSize="xs" color="#B0B0B0">
              {formatCurrency(budget.limit_amount, budget.currency)}
            </Text>
          </HStack>
          <BudgetProgress budget={budget} variant="bar" />
        </Box>
      ))}

      <HStack gap={2}>
        {pill('grupos', 'Grupos')}
        {pill('categorias', 'Categorías')}
      </HStack>

      {vista === 'grupos' ? (
        <BudgetGroupAccordion
          groupBudgets={groupBudgets}
          categoryBudgets={categoryBudgets}
          groups={groups}
          onEdit={handleEdit}
          onDelete={setPendingDeleteId}
        />
      ) : (
        <BudgetCategoryTable
          budgets={categoryBudgets}
          onEdit={handleEdit}
          onDelete={setPendingDeleteId}
        />
      )}

      <BudgetForm
        isOpen={isFormOpen}
        onClose={handleClose}
        userId={userId}
        categories={categories}
        groups={groups}
        onSuccess={handleFormSuccess}
        editingBudget={editingBudget}
        defaultScope={vista === 'grupos' ? 'group' : 'category'}
      />

      <ConfirmDialog
        isOpen={pendingDeleteId !== null}
        onClose={() => setPendingDeleteId(null)}
        onConfirm={handleDelete}
        title="Eliminar Presupuesto"
        description="¿Estás seguro? Esta acción no se puede deshacer."
        isLoading={isDeleting}
      />
    </VStack>
  )
}
```

- [ ] **Step 4: Agregar `defaultScope` a BudgetForm**

`BudgetForm` distingue crear de editar por `editingBudget` truthy, y su tipo `EditableBudget` exige `id`. Por eso el scope preseleccionado **no** puede pasarse como un `editingBudget` parcial: no tiparía y además metería el formulario en modo edición. Se agrega una prop dedicada.

En `components/budgets/BudgetForm.tsx`:

1. Agregar a `interface Props`, debajo de `prefill`:

```ts
  // Scope preseleccionado al CREAR (viene del sub-tab activo). Ignorado al editar.
  defaultScope?: BudgetScope
```

2. Añadir `defaultScope` a la desestructuración de props del componente.

3. En el `useEffect`, cambiar únicamente la rama `else` final:

```ts
      } else {
        setFormData({ ...defaultForm, scope: defaultScope ?? defaultForm.scope })
      }
```

4. Agregar `defaultScope` al array de dependencias del `useEffect`:

```ts
  }, [isOpen, editingBudget, prefill, categories, defaultScope])
```

No se toca nada más del formulario: ni `handleSubmit`, ni la validación, ni los `SCOPE_OPTIONS`.

- [ ] **Step 5: Eliminar BudgetList**

```bash
git rm components/budgets/BudgetList.tsx
```

Confirmar que no quedan referencias:

Run: `grep -rn "BudgetList" app components lib`
Expected: sin resultados.

- [ ] **Step 6: Verificar**

Run: `pnpm type-check && pnpm lint && pnpm build`
Expected: sin errores.

- [ ] **Step 7: Revisión visual**

Run: `pnpm dev`

Comprobar en `http://localhost:3000/planificacion?tab=presupuestos`:
- Abre por defecto en **Grupos** con 5 acordeones.
- Expandir **Estilo de Vida**: lista sus categorías con presupuesto, ordenadas por consumo.
- Cambiar a **Categorías**: tabla densa con 17 filas ordenadas por % descendente; hover muestra ✎ y 🗑.
- Estrechar a ~390px: la tabla se reemplaza por filas de dos líneas; tocar una abre el detalle.
- Recargar con `&vista=categorias`: mantiene la vista.

- [ ] **Step 8: Commit**

```bash
git add -A app/\(dashboard\)/planificacion app/\(dashboard\)/budgets components/budgets
git commit -m "feat(budgets): separar presupuestos por grupo y por categoría en sub-pestañas"
```

---

### Task 6: Widget compacto de grupos en el dashboard

**Files:**
- Modify: `components/budgets/BudgetWidget.tsx`

**Interfaces:**
- Consumes: `splitBudgetsByScope`, `sortByConsumption` (Tarea 1); `BudgetProgress` con `variant="bar"` y `progressColor` (Tarea 2).
- Produces: nada que consuman otras tareas.

- [ ] **Step 1: Reescribir el widget**

Reemplazar el contenido de `components/budgets/BudgetWidget.tsx` por:

```tsx
'use client'

import { VStack, HStack, Heading, Text, Button, Box, Link, Grid } from '@chakra-ui/react'
import { BudgetProgress, progressColor } from './BudgetProgress'
import { splitBudgetsByScope, sortByConsumption } from '@/lib/utils/budget-grouping'
import { safeRatio } from '@/lib/utils/numbers'
import type { BudgetWithSpent } from '@/types/database.types'

interface Props {
  budgets: BudgetWithSpent[]
}

function rowLabel(budget: BudgetWithSpent): string {
  if (budget.scope === 'total') return '🧾 Todos los gastos'
  if (budget.scope === 'group') return `${budget.group?.icon ?? '📦'} ${budget.group?.name ?? 'Grupo'}`
  return `${budget.category?.icon ?? ''} ${budget.category?.name ?? 'Sin categoría'}`
}

export function BudgetWidget({ budgets }: Props) {
  const { groups } = splitBudgetsByScope(budgets)

  // Con presupuestos de grupo, el widget son sus cifras (todas, no top 3).
  // Sin ellos, se conserva el comportamiento anterior para no dejarlo vacío.
  const rows =
    groups.length > 0 ? sortByConsumption(groups) : sortByConsumption(budgets).slice(0, 3)

  return (
    <Box borderWidth="1px" borderRadius="lg" p={6} bg="#0F0F0F">
      <VStack gap={4} align="stretch">
        <HStack justify="space-between">
          <Heading size="md">{groups.length > 0 ? 'Presupuestos por Grupo' : 'Presupuestos del Mes'}</Heading>
          <Link href="/planificacion?tab=presupuestos&vista=grupos" _hover={{ textDecoration: 'none' }}>
            <Button size="sm" variant="ghost">
              Ver todos →
            </Button>
          </Link>
        </HStack>

        {rows.length === 0 ? (
          <Text color="#B0B0B0" fontSize="sm">
            No hay presupuestos. Crea uno para empezar.
          </Text>
        ) : (
          <VStack gap={2.5} align="stretch">
            {rows.map((budget) => {
              const percentage = safeRatio(budget.spent, budget.limit_amount) * 100
              return (
                <Grid key={budget.id} templateColumns="1.3fr 2fr 42px" gap={3} alignItems="center">
                  <Text fontSize="xs" color="#e8e8ec" truncate>
                    {rowLabel(budget)}
                  </Text>
                  <BudgetProgress budget={budget} variant="bar" />
                  <Text fontSize="xs" fontWeight="600" textAlign="right" color={progressColor(percentage)}>
                    {percentage.toFixed(0)}%
                  </Text>
                </Grid>
              )
            })}
          </VStack>
        )}
      </VStack>
    </Box>
  )
}
```

- [ ] **Step 2: Verificar**

Run: `pnpm type-check && pnpm lint && pnpm build`
Expected: sin errores.

- [ ] **Step 3: Revisión visual**

Run: `pnpm dev` y abrir `http://localhost:3000/dashboard`

Comprobar:
- El widget muestra los 5 grupos, una línea cada uno, sin scroll interno.
- El título dice "Presupuestos por Grupo".
- "Ver todos →" lleva a la vista de Grupos.
- A ~390px las filas siguen legibles y los nombres largos se truncan sin desbordar.

- [ ] **Step 4: Commit**

```bash
git add components/budgets/BudgetWidget.tsx
git commit -m "feat(dashboard): mostrar presupuestos de grupo compactos en el widget"
```

---

## Verificación final de la rama

- [ ] `npx tsx scripts/test-budget-grouping.ts` → `11/11 checks passed`
- [ ] `pnpm type-check` → sin errores
- [ ] `pnpm lint` → sin errores
- [ ] `pnpm build` → build exitoso
- [ ] `grep -rn "BudgetList" app components lib` → sin resultados
- [ ] Revisión visual en desktop (≥1024px) y ~390px, ambos sub-tabs, acordeón abierto y cerrado, widget del dashboard
