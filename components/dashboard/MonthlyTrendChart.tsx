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

interface ChartDataPoint {
  month: string
  income: number
  expense: number
}

interface Props {
  userId: string
}

export function MonthlyTrendChart({ userId }: Props) {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const result = await getTransactions(userId, 500)

      if (result.success && result.data) {
        const transactions = result.data as TransactionWithCategory[]

        // Agrupar por mes
        const grouped = transactions.reduce<Record<string, ChartDataPoint>>(
          (acc, t) => {
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
          },
          {}
        )

        // Convertir a array, ordenar y tomar últimos 6 meses
        const data = Object.values(grouped)
          .sort((a, b) => a.month.localeCompare(b.month))
          .slice(-6)

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
        <Text color="#B0B0B0">No hay suficientes datos para mostrar.</Text>
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
