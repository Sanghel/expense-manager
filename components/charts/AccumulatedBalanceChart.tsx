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
import { formatCurrency } from '@/lib/utils/currency'
import type { TransactionWithCategory } from '@/types/database.types'
import type { ReportFiltersState } from '@/components/ReportFilters'

interface ChartDataPoint {
  date: string
  balance: number
}

interface Props {
  userId: string
  filters?: ReportFiltersState
}

function getDominantCurrency(transactions: TransactionWithCategory[]): string {
  const counts = transactions.reduce<Record<string, number>>((acc, t) => {
    acc[t.currency] = (acc[t.currency] || 0) + 1
    return acc
  }, {})
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'COP'
}

export function AccumulatedBalanceChart({ userId, filters }: Props) {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([])
  const [currency, setCurrency] = useState('COP')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const result = await getTransactions(userId, 500)

      if (result.success && result.data) {
        let transactions = result.data as TransactionWithCategory[]

        if (filters?.startDate) {
          transactions = transactions.filter((t) => t.date >= filters.startDate)
        }
        if (filters?.endDate) {
          transactions = transactions.filter((t) => t.date <= filters.endDate)
        }
        if (filters?.transactionType && filters.transactionType !== 'all') {
          transactions = transactions.filter((t) => t.type === filters.transactionType)
        }
        if (filters?.categoryIds && filters.categoryIds.length > 0) {
          transactions = transactions.filter((t) => filters.categoryIds.includes(t.category_id || ''))
        }

        const dominant = getDominantCurrency(transactions)
        setCurrency(dominant)

        // Solo moneda dominante para el balance acumulado
        const filtered = transactions.filter((t) => t.currency === dominant)
        const sorted = [...filtered].sort((a, b) => a.date.localeCompare(b.date))

        let accumulatedBalance = 0
        const data: ChartDataPoint[] = sorted.map((t) => {
          const amount = Number(t.amount)
          if (filters?.transactionType === 'income') {
            accumulatedBalance += amount
          } else if (filters?.transactionType === 'expense') {
            accumulatedBalance -= amount
          } else {
            accumulatedBalance += t.type === 'income' ? amount : -amount
          }
          return { date: t.date, balance: accumulatedBalance }
        })

        setChartData(data.slice(-30))
      }
      setLoading(false)
    }
    fetchData()
  }, [userId, filters])

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
        <Heading size="md" mb={4}>Balance Acumulado</Heading>
        <Text color="#B0B0B0">No hay datos para mostrar.</Text>
      </Card>
    )
  }

  const currentBalance = chartData[chartData.length - 1]?.balance ?? 0

  return (
    <Card>
      <Box mb={4}>
        <Heading size="md" mb={2}>Balance Acumulado</Heading>
        <Text fontSize="2xl" fontWeight="bold" color={currentBalance >= 0 ? '#2ECC71' : '#E74C3C'}>
          {formatCurrency(currentBalance, currency)}
        </Text>
        <Text fontSize="xs" color="#B0B0B0">Solo moneda dominante: {currency}</Text>
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
            <YAxis tickFormatter={(value) => formatCurrency(Number(value), currency)} width={110} />
            <Tooltip
              formatter={(value) => [formatCurrency(Number(value), currency), 'Balance']}
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
