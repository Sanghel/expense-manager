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
import type { TransactionWithCategory } from '@/types/database.types'
import type { ReportFiltersState } from '@/components/ReportFilters'

interface ChartDataPoint {
  name: string
  value: number
}

interface Props {
  userId: string
  type?: 'expense' | 'income'
  filters?: ReportFiltersState
}

const COLORS = [
  '#E74C3C',
  '#3498DB',
  '#2ECC71',
  '#F39C12',
  '#9B59B6',
  '#1ABC9C',
  '#E67E22',
  '#C0392B',
  '#27AE60',
  '#2980B9',
  '#8E44AD',
  '#D35400',
]

export function ExpensesByCategoryChart({ userId, type = 'expense', filters }: Props) {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const result = await getTransactions(userId, 500)

      if (result.success && result.data) {
        let transactions = result.data as TransactionWithCategory[]

        // Aplicar filtros de fecha
        if (filters?.startDate) {
          transactions = transactions.filter((t) => t.date >= filters.startDate)
        }
        if (filters?.endDate) {
          transactions = transactions.filter((t) => t.date <= filters.endDate)
        }

        // Aplicar filtro de tipo
        if (filters?.transactionType && filters.transactionType !== 'all') {
          transactions = transactions.filter((t) => t.type === filters.transactionType)
        } else {
          // Si no hay filtro de tipo específico, usar el type prop
          transactions =
            type === 'expense'
              ? transactions.filter((t) => t.type === 'expense')
              : transactions.filter((t) => t.type === 'income')
        }

        // Aplicar filtro de categoría
        if (filters?.categoryIds && filters.categoryIds.length > 0) {
          transactions = transactions.filter((t) => filters.categoryIds.includes(t.category_id || ''))
        }

        // Agrupar por categoría
        const grouped = transactions.reduce<Record<string, number>>((acc, t) => {
          const categoryName = t.category?.name || 'Sin categoría'
          acc[categoryName] = (acc[categoryName] || 0) + Number(t.amount)
          return acc
        }, {})

        // Convertir a array y ordenar por valor descendente
        const data = Object.entries(grouped)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)

        setChartData(data)
      }
      setLoading(false)
    }
    fetchData()
  }, [userId, type, filters])

  const title = type === 'expense' ? 'Gastos por Categoría' : 'Ingresos por Categoría'

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
        <Heading size="md" mb={4}>
          {title}
        </Heading>
        <Text color="#B0B0B0">No hay datos para mostrar.</Text>
      </Card>
    )
  }

  return (
    <Card>
      <Heading size="md" mb={4}>
        {title}
      </Heading>
      <Box h="400px">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={120}
              label={({ name, percent = 0 }) =>
                `${name} ${(percent * 100).toFixed(0)}%`
              }
            >
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => `$${Number(value).toFixed(2)}`}
              contentStyle={{
                backgroundColor: '#1a1a1a',
                border: '1px solid #333',
                borderRadius: '4px',
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </Box>
    </Card>
  )
}
