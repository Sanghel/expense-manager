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

interface ChartDataPoint {
  date: string
  balance: number
}

interface Props {
  userId: string
}

export function AccumulatedBalanceChart({ userId }: Props) {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const result = await getTransactions(userId, 500)

      if (result.success && result.data) {
        const transactions = result.data as TransactionWithCategory[]

        // Ordenar por fecha
        const sorted = [...transactions].sort((a, b) =>
          a.date.localeCompare(b.date)
        )

        // Calcular balance acumulado
        let accumulatedBalance = 0
        const data: ChartDataPoint[] = sorted.map((t) => {
          const amount = Number(t.amount)
          if (t.type === 'income') {
            accumulatedBalance += amount
          } else {
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
          ${currentBalance.toFixed(2)}
        </Text>
      </Box>
      <Box h="400px">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              interval={Math.floor(chartData.length / 5)}
            />
            <YAxis />
            <Tooltip
              formatter={(value) => `$${Number(value).toFixed(2)}`}
              contentStyle={{
                backgroundColor: '#1a1a1a',
                border: '1px solid #333',
                borderRadius: '4px',
              }}
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
