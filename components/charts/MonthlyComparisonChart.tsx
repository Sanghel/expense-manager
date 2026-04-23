'use client'

import { Box, Heading, Spinner, Center, Text } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import {
  BarChart,
  Bar,
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
import type { ReportFiltersState } from '@/components/ReportFilters'
import { formatCurrency } from '@/lib/utils/currency'

interface ChartDataPoint {
  month: string
  income: number
  expense: number
}

interface Props {
  userId: string
  months?: number
  filters?: ReportFiltersState
}

export function MonthlyComparisonChart({ userId, months = 12, filters }: Props) {
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
        }

        // Aplicar filtro de categoría
        if (filters?.categoryIds && filters.categoryIds.length > 0) {
          transactions = transactions.filter((t) => filters.categoryIds.includes(t.category_id || ''))
        }

        // Agrupar por mes
        const grouped = transactions.reduce<Record<string, ChartDataPoint>>(
          (acc, t) => {
            const month = t.date.slice(0, 7) // YYYY-MM
            if (!acc[month]) {
              acc[month] = { month, income: 0, expense: 0 }
            }
            // Solo contar el tipo de transacción correspondiente
            if (filters?.transactionType === 'all' || !filters?.transactionType) {
              // Mostrar ambos tipos
              if (t.type === 'income') {
                acc[month].income += Number(t.amount)
              } else {
                acc[month].expense += Number(t.amount)
              }
            } else if (filters.transactionType === 'income') {
              // Solo ingresos, gastos = 0
              acc[month].income += Number(t.amount)
            } else if (filters.transactionType === 'expense') {
              // Solo gastos, ingresos = 0
              acc[month].expense += Number(t.amount)
            }
            return acc
          },
          {}
        )

        // Convertir a array, ordenar y tomar últimos N meses
        const data = Object.values(grouped)
          .sort((a, b) => a.month.localeCompare(b.month))
          .slice(-months)

        setChartData(data)
      }
      setLoading(false)
    }
    fetchData()
  }, [userId, months, filters])

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
          Comparación Mensual
        </Heading>
        <Text color="#B0B0B0">No hay datos para mostrar.</Text>
      </Card>
    )
  }

  return (
    <Card>
      <Heading size="md" mb={4}>
        Comparación Mensual
      </Heading>
      <Box h={{ base: '250px', md: '400px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip
              formatter={(value) => [formatCurrency(Number(value), 'COP'), '']}
              contentStyle={{
                backgroundColor: '#1a1a23',
                border: '1px solid #2d2d35',
                borderRadius: '8px',
                color: '#ffffff',
              }}
              labelStyle={{ color: '#B0B0B0' }}
              cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }}
            />
            <Legend />
            <Bar dataKey="income" fill="#2ECC71" name="Ingresos" />
            <Bar dataKey="expense" fill="#E74C3C" name="Gastos" />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Card>
  )
}
