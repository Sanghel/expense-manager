'use client'

import { Box, Heading, Spinner, Center, Text } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { getTransactions } from '@/lib/actions/transactions.actions'
import { Card } from '@/components/ui/Card'
import { formatCurrency } from '@/lib/utils/currency'
import type { TransactionWithCategory } from '@/types/database.types'
import type { ReportFiltersState } from '@/components/ReportFilters'

interface ChartDataPoint {
  name: string
  value: number
  currency: string
}

interface Props {
  userId: string
  type?: 'expense' | 'income'
  filters?: ReportFiltersState
}

const INCOME_COLORS = [
  '#2ECC71', '#27AE60', '#16A085', '#1ABC9C',
  '#3498DB', '#2980B9', '#8E44AD', '#9B59B6',
  '#48C9B0', '#17A589', '#6C5CE7', '#74B9FF',
]

const EXPENSE_COLORS = [
  '#E74C3C', '#C0392B', '#E67E22', '#D35400',
  '#F39C12', '#F1C40F', '#E59866', '#DC7633',
  '#CB4335', '#A93226', '#F4D03F', '#E8DAEF',
]

function getDominantCurrency(transactions: TransactionWithCategory[]): string {
  const counts = transactions.reduce<Record<string, number>>((acc, t) => {
    acc[t.currency] = (acc[t.currency] || 0) + 1
    return acc
  }, {})
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'COP'
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const { name, value, currency } = payload[0].payload as ChartDataPoint
  return (
    <Box bg="#1a1a23" border="1px solid #2d2d35" borderRadius="8px" px={3} py={2}>
      <Text fontSize="sm" color="#B0B0B0">{name}</Text>
      <Text fontSize="sm" fontWeight="bold" color="white">{formatCurrency(value, currency)}</Text>
    </Box>
  )
}

export function ExpensesByCategoryChart({ userId, type = 'expense', filters }: Props) {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const result = await getTransactions(userId, 500)

      if (result.success && result.data) {
        let transactions = result.data as TransactionWithCategory[]

        transactions = transactions.filter((t) => t.type === type)

        if (filters?.transactionType && filters.transactionType !== 'all' && filters.transactionType !== type) {
          setChartData([])
          setLoading(false)
          return
        }

        if (filters?.startDate) {
          transactions = transactions.filter((t) => t.date >= filters.startDate)
        }
        if (filters?.endDate) {
          transactions = transactions.filter((t) => t.date <= filters.endDate)
        }
        if (filters?.categoryIds && filters.categoryIds.length > 0) {
          transactions = transactions.filter((t) => filters.categoryIds.includes(t.category_id || ''))
        }

        // Agrupar por (categoría, moneda) para no mezclar divisas
        const dominated = getDominantCurrency(transactions)
        const sameCurrency = transactions.filter((t) => t.currency === dominated)

        const grouped = sameCurrency.reduce<Record<string, number>>((acc, t) => {
          const categoryName = t.category?.name || 'Sin categoría'
          acc[categoryName] = (acc[categoryName] || 0) + Number(t.amount)
          return acc
        }, {})

        const data = Object.entries(grouped)
          .map(([name, value]) => ({ name, value, currency: dominated }))
          .sort((a, b) => b.value - a.value)

        setChartData(data)
      }
      setLoading(false)
    }
    fetchData()
  }, [userId, type, filters])

  const title = type === 'expense' ? 'Gastos por Categoría' : 'Ingresos por Categoría'
  const currency = chartData[0]?.currency ?? 'COP'

  if (loading) {
    return (
      <Card>
        <Center py={10}><Spinner /></Center>
      </Card>
    )
  }

  if (chartData.length === 0) {
    return (
      <Card>
        <Heading size="md" mb={4}>{title}</Heading>
        <Text color="#B0B0B0">No hay datos para mostrar.</Text>
      </Card>
    )
  }

  return (
    <Card>
      <Heading size="md" mb={1}>{title}</Heading>
      <Text fontSize="xs" color="#B0B0B0" mb={4}>Solo moneda dominante: {currency}</Text>
      <Box h={{ base: '280px', md: '400px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius="40%"
              label={({ name, percent = 0 }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {chartData.map((_, index) => {
                const colorPalette = type === 'income' ? INCOME_COLORS : EXPENSE_COLORS
                return <Cell key={`cell-${index}`} fill={colorPalette[index % colorPalette.length]} />
              })}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </Box>
    </Card>
  )
}
