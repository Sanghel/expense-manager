'use client'

import { Box, Heading, Spinner, Center, Text } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import {
  AreaChart,
  Area,
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
  date: string
  balance: number
}

interface Props {
  userId: string
  filters?: ReportFiltersState
}

export function AccumulatedBalanceChart({ userId, filters }: Props) {
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

        // Ordenar por fecha
        const sorted = [...transactions].sort((a, b) =>
          a.date.localeCompare(b.date)
        )

        // Calcular balance acumulado
        let accumulatedBalance = 0
        const data: ChartDataPoint[] = sorted.map((t) => {
          const amount = Number(t.amount)

          if (filters?.transactionType === 'all' || !filters?.transactionType) {
            // Mostrar balance real: ingresos - gastos
            if (t.type === 'income') {
              accumulatedBalance += amount
            } else {
              accumulatedBalance -= amount
            }
          } else if (filters.transactionType === 'income') {
            // Solo ingresos acumulados
            accumulatedBalance += amount
          } else if (filters.transactionType === 'expense') {
            // Solo gastos acumulados (como negativo)
            accumulatedBalance -= amount
          }

          return {
            date: t.date,
            balance: accumulatedBalance,
          }
        })

        // Tomar últimas 30 transacciones para gráfico más legible
        setChartData(data.slice(-30))
      }
      setLoading(false)
    }
    fetchData()
  }, [userId, filters])

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
          Balance Acumulado
        </Heading>
        <Text color="#B0B0B0">No hay datos para mostrar.</Text>
      </Card>
    )
  }

  const currentBalance = chartData[chartData.length - 1]?.balance || 0

  return (
    <Card>
      <Box mb={4}>
        <Heading size="md" mb={2}>
          Balance Acumulado
        </Heading>
        <Text fontSize="2xl" fontWeight="bold" color={currentBalance >= 0 ? '#2ECC71' : '#E74C3C'}>
          {formatCurrency(currentBalance, 'COP')}
        </Text>
      </Box>
      <Box h="400px">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 60, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              interval={Math.floor(chartData.length / 5)}
            />
            <YAxis tickFormatter={(value) => formatCurrency(Number(value), 'COP')} width={110} />
            <Tooltip
              formatter={(value) => [formatCurrency(Number(value), 'COP'), 'Balance']}
              contentStyle={{
                backgroundColor: '#1a1a23',
                border: '1px solid #2d2d35',
                borderRadius: '8px',
                color: '#ffffff',
              }}
              labelStyle={{ color: '#B0B0B0' }}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="balance"
              stroke="#3498DB"
              fill="#3498DB"
              fillOpacity={0.3}
              name="Balance"
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </Box>
    </Card>
  )
}
