# FASE 06: Dashboard Principal

## 🎯 Objetivo

Implementar el dashboard principal con widgets de resumen financiero, gráfico de tendencia, y últimas transacciones usando datos reales de InsForge.

**Resultado:** Dashboard funcional mostrando balance, gastos, ingresos, tendencia mensual y últimas transacciones.

---

## ⚠️ Pre-requisitos

- ✅ FASE 05 completada
- ✅ Server Actions funcionando
- ✅ Chakra UI configurado

---

## 📋 Inicio

```bash
git checkout develop && git pull
gh issue create --title "FASE 06: Dashboard Principal"
```

📝 Issue #43

---

## 📝 Tareas

### Tarea 6.1: Crear hook para obtener resumen financiero

**Issue:** "Crear hook useFinancialSummary"

```bash
git checkout -b feature/44-financial-summary-hook
```

Crear `hooks/useFinancialSummary.ts`:

```typescript
'use client'

import { useEffect, useState } from 'react'
import { getTransactions } from '@/lib/actions/transactions.actions'
import type { TransactionWithCategory } from '@/types/database.types'

interface FinancialSummary {
  totalIncome: number
  totalExpense: number
  balance: number
  currency: string
  transactionCount: number
}

export function useFinancialSummary(userId: string, month?: string) {
  const [summary, setSummary] = useState<FinancialSummary>({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    currency: 'COP',
    transactionCount: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSummary() {
      setLoading(true)
      const result = await getTransactions(userId, 100)

      if (result.success && result.data) {
        const transactions = result.data as TransactionWithCategory[]

        // Filtrar por mes si se proporciona
        const filtered = month
          ? transactions.filter((t) => t.date.startsWith(month))
          : transactions

        const income = filtered
          .filter((t) => t.type === 'income')
          .reduce((sum, t) => sum + Number(t.amount), 0)

        const expense = filtered
          .filter((t) => t.type === 'expense')
          .reduce((sum, t) => sum + Number(t.amount), 0)

        setSummary({
          totalIncome: income,
          totalExpense: expense,
          balance: income - expense,
          currency: 'COP', // TODO: obtener de user preferences
          transactionCount: filtered.length,
        })
      }
      setLoading(false)
    }

    fetchSummary()
  }, [userId, month])

  return { summary, loading }
}
```

```bash
git add . && git commit -m "feat: create useFinancialSummary hook"
git push -u origin feature/44-financial-summary-hook
gh pr create --base develop --title "Create useFinancialSummary hook" --body "Closes #44"
gh pr merge --squash && git checkout develop && git pull && git branch -d feature/44-financial-summary-hook
```

---

### Tarea 6.2: Crear componente de tarjetas de resumen

**Issue:** "Crear FinancialCards component"

```bash
git checkout -b feature/45-financial-cards
```

Crear `components/dashboard/FinancialCards.tsx`:

```typescript
'use client'

import { SimpleGrid } from '@chakra-ui/react'
import { StatCard } from '@/components/ui/StatCard'
import { useFinancialSummary } from '@/hooks/useFinancialSummary'
import { formatCurrency } from '@/lib/utils/currency'

interface Props {
  userId: string
}

export function FinancialCards({ userId }: Props) {
  const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM
  const { summary, loading } = useFinancialSummary(userId, currentMonth)

  if (loading) {
    return <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
      <StatCard label="Cargando..." value="..." />
      <StatCard label="Cargando..." value="..." />
      <StatCard label="Cargando..." value="..." />
    </SimpleGrid>
  }

  return (
    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
      <StatCard
        label="Balance Total"
        value={formatCurrency(summary.balance, summary.currency)}
        helpText="Este mes"
      />
      <StatCard
        label="Gastos"
        value={formatCurrency(summary.totalExpense, summary.currency)}
        helpText={`${summary.transactionCount} transacciones`}
      />
      <StatCard
        label="Ingresos"
        value={formatCurrency(summary.totalIncome, summary.currency)}
        helpText="Este mes"
      />
    </SimpleGrid>
  )
}
```

Crear `lib/utils/currency.ts`:

```typescript
export function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}
```

```bash
git add . && git commit -m "feat: create FinancialCards component"
git push -u origin feature/45-financial-cards
gh pr create --base develop --title "Create FinancialCards component" --body "Closes #45"
gh pr merge --squash && git checkout develop && git pull && git branch -d feature/45-financial-cards
```

---

### Tarea 6.3: Crear componente de últimas transacciones

**Issue:** "Crear RecentTransactions component"

```bash
git checkout -b feature/46-recent-transactions
```

Crear `components/dashboard/RecentTransactions.tsx`:

```typescript
'use client'

import {
  Box,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Text,
  Spinner,
  Center,
} from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { getTransactions } from '@/lib/actions/transactions.actions'
import { formatCurrency } from '@/lib/utils/currency'
import { Card } from '@/components/ui/Card'
import type { TransactionWithCategory } from '@/types/database.types'

interface Props {
  userId: string
  limit?: number
}

export function RecentTransactions({ userId, limit = 10 }: Props) {
  const [transactions, setTransactions] = useState<TransactionWithCategory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchTransactions() {
      const result = await getTransactions(userId, limit)
      if (result.success && result.data) {
        setTransactions(result.data as TransactionWithCategory[])
      }
      setLoading(false)
    }
    fetchTransactions()
  }, [userId, limit])

  if (loading) {
    return (
      <Card>
        <Center py={10}>
          <Spinner />
        </Center>
      </Card>
    )
  }

  if (transactions.length === 0) {
    return (
      <Card>
        <Heading size="md" mb={4}>Últimas Transacciones</Heading>
        <Text color="gray.500">No hay transacciones registradas.</Text>
      </Card>
    )
  }

  return (
    <Card>
      <Heading size="md" mb={4}>Últimas Transacciones</Heading>
      <Box overflowX="auto">
        <Table variant="simple" size="sm">
          <Thead>
            <Tr>
              <Th>Fecha</Th>
              <Th>Descripción</Th>
              <Th>Categoría</Th>
              <Th isNumeric>Monto</Th>
            </Tr>
          </Thead>
          <Tbody>
            {transactions.map((transaction) => (
              <Tr key={transaction.id}>
                <Td>{new Date(transaction.date).toLocaleDateString()}</Td>
                <Td>{transaction.description}</Td>
                <Td>
                  <Badge
                    colorScheme={
                      transaction.type === 'income' ? 'green' : 'red'
                    }
                  >
                    {transaction.category.name}
                  </Badge>
                </Td>
                <Td isNumeric fontWeight="semibold">
                  {transaction.type === 'income' ? '+' : '-'}
                  {formatCurrency(Number(transaction.amount), transaction.currency)}
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>
    </Card>
  )
}
```

```bash
git add . && git commit -m "feat: create RecentTransactions component"
git push -u origin feature/46-recent-transactions
gh pr create --base develop --title "Create RecentTransactions component" --body "Closes #46"
gh pr merge --squash && git checkout develop && git pull && git branch -d feature/46-recent-transactions
```

---

### Tarea 6.4: Crear gráfico de tendencia mensual

**Issue:** "Crear MonthlyTrendChart component"

```bash
git checkout -b feature/47-monthly-trend-chart
```

Crear `components/dashboard/MonthlyTrendChart.tsx`:

```typescript
'use client'

import { Box, Heading, Spinner, Center, Text } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { getTransactions } from '@/lib/actions/transactions.actions'
import { Card } from '@/components/ui/Card'
import type { TransactionWithCategory } from '@/types/database.types'

interface Props {
  userId: string
}

export function MonthlyTrendChart({ userId }: Props) {
  const [chartData, setChartData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const result = await getTransactions(userId, 500)

      if (result.success && result.data) {
        const transactions = result.data as TransactionWithCategory[]

        // Agrupar por mes
        const grouped = transactions.reduce((acc: any, t) => {
          const month = t.date.slice(0, 7) // YYYY-MM
          if (!acc[month]) {
            acc[month] = { month, income: 0, expense: 0 }
          }
          if (t.type === 'income') {
            acc[month].income += Number(t.amount)
          } else {
            acc[month].expense += Number(t.amount)
          }
          return acc
        }, {})

        // Convertir a array y ordenar
        const data = Object.values(grouped)
          .sort((a: any, b: any) => a.month.localeCompare(b.month))
          .slice(-6) // Últimos 6 meses

        setChartData(data)
      }
      setLoading(false)
    }
    fetchData()
  }, [userId])

  if (loading) {
    return (
      <Card>
        <Center py={10}>
          <Spinner />
        </Center>
      </Card>
    )
  }

  if (chartData.length === 0) {
    return (
      <Card>
        <Heading size="md" mb={4}>Tendencia Mensual</Heading>
        <Text color="gray.500">No hay suficientes datos para mostrar.</Text>
      </Card>
    )
  }

  return (
    <Card>
      <Heading size="md" mb={4}>Tendencia Mensual</Heading>
      <Box h="300px">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="income"
              stroke="#2ECC71"
              name="Ingresos"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="expense"
              stroke="#E74C3C"
              name="Gastos"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </Card>
  )
}
```

```bash
git add . && git commit -m "feat: create MonthlyTrendChart component"
git push -u origin feature/47-monthly-trend-chart
gh pr create --base develop --title "Create MonthlyTrendChart component" --body "Closes #47"
gh pr merge --squash && git checkout develop && git pull && git branch -d feature/47-monthly-trend-chart
```

---

### Tarea 6.5: Integrar todo en la página del dashboard

**Issue:** "Integrar componentes en dashboard page"

```bash
git checkout -b feature/48-integrate-dashboard
```

Actualizar `app/(dashboard)/dashboard/page.tsx`:

```typescript
import { Box, Heading, VStack } from '@chakra-ui/react'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { insforge } from '@/lib/insforge'
import { FinancialCards } from '@/components/dashboard/FinancialCards'
import { MonthlyTrendChart } from '@/components/dashboard/MonthlyTrendChart'
import { RecentTransactions } from '@/components/dashboard/RecentTransactions'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    redirect('/login')
  }

  // Obtener user ID de la BD
  const { data: user } = await insforge
    .from('users')
    .select('id')
    .eq('email', session.user.email)
    .single()

  if (!user) {
    redirect('/login')
  }

  return (
    <Box>
      <Heading mb={8}>Dashboard</Heading>

      <VStack spacing={8} align="stretch">
        <FinancialCards userId={user.id} />

        <MonthlyTrendChart userId={user.id} />

        <RecentTransactions userId={user.id} limit={10} />
      </VStack>
    </Box>
  )
}
```

```bash
git add . && git commit -m "feat: integrate all dashboard components"
git push -u origin feature/48-integrate-dashboard
gh pr create --base develop --title "Integrate all dashboard components" --body "Closes #48"
gh pr merge --squash && git checkout develop && git pull && git branch -d feature/48-integrate-dashboard
```

---

### Tarea 6.6: Agregar filtro de mes

**Issue:** "Agregar selector de mes en dashboard"

```bash
git checkout -b feature/49-month-filter
```

Crear `components/dashboard/MonthSelector.tsx`:

```typescript
'use client'

import { Select } from '@chakra-ui/react'

interface Props {
  value: string
  onChange: (month: string) => void
}

export function MonthSelector({ value, onChange }: Props) {
  const months = []
  const now = new Date()

  // Últimos 12 meses
  for (let i = 0; i < 12; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthStr = date.toISOString().slice(0, 7)
    const label = date.toLocaleDateString('es', {
      year: 'numeric',
      month: 'long'
    })
    months.push({ value: monthStr, label })
  }

  return (
    <Select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      maxW="250px"
    >
      {months.map((month) => (
        <option key={month.value} value={month.value}>
          {month.label}
        </option>
      ))}
    </Select>
  )
}
```

Actualizar dashboard para usar el selector (modificar componentes para aceptar prop `month`)

```bash
git add . && git commit -m "feat: add month selector to dashboard"
git push -u origin feature/49-month-filter
gh pr create --base develop --title "Add month selector" --body "Closes #49"
gh pr merge --squash && git checkout develop && git pull && git branch -d feature/49-month-filter
```

---

### Tarea 6.7: Testing del dashboard

**Issue:** "Verificar dashboard completo"

**Checklist manual:**

```bash
pnpm dev
```

- [ ] Dashboard carga sin errores
- [ ] Tarjetas de resumen muestran datos correctos
- [ ] Gráfico de tendencia se renderiza
- [ ] Tabla de últimas transacciones muestra datos
- [ ] Selector de mes funciona
- [ ] Si no hay transacciones, muestra mensaje apropiado
- [ ] Loading states funcionan
- [ ] Responsive en móvil

---

## 🎯 Fin de Fase 6

### Verificación

```bash
pnpm build
pnpm type-check
```

**Checklist:**

- [ ] ✅ Hook useFinancialSummary creado
- [ ] ✅ FinancialCards funcionando
- [ ] ✅ RecentTransactions mostrando datos
- [ ] ✅ MonthlyTrendChart renderizando
- [ ] ✅ Dashboard integrado
- [ ] ✅ Selector de mes implementado
- [ ] ✅ Responsive
- [ ] ✅ Build exitoso

---

### PR Final

```bash
gh pr create \
  --base main \
  --head develop \
  --title "FASE 06: Dashboard Principal" \
  --body "Dashboard completo con resumen financiero, gráficos y últimas transacciones

Closes #43"
```

**🛑 DETENER - 📢 NOTIFICAR - ⏸️ ESPERAR**

---

**¡FASE 06 COMPLETADA! 🎉**

Continuar con: **FASE-07.md**
