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
import { formatCurrency } from '@/lib/utils/currency'
import type { TransactionWithCategory } from '@/types/database.types'

interface ChartDataPoint {
  month: string
  income: number
  expense: number
}

interface Props {
  userId: string
}

const MONTH_LABELS: Record<string, string> = {
  '01': 'Ene', '02': 'Feb', '03': 'Mar', '04': 'Abr',
  '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Ago',
  '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dic',
}

function getDominantCurrency(transactions: TransactionWithCategory[]): string {
  const counts = transactions.reduce<Record<string, number>>((acc, t) => {
    acc[t.currency] = (acc[t.currency] || 0) + 1
    return acc
  }, {})
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'COP'
}

export function MonthlyComparisonChart({ userId }: Props) {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([])
  const [currency, setCurrency] = useState('COP')
  const [loading, setLoading] = useState(true)
  const currentYear = new Date().getFullYear()

  useEffect(() => {
    async function fetchData() {
      const result = await getTransactions(userId, 500)

      if (result.success && result.data) {
        const allTransactions = result.data as TransactionWithCategory[]

        // Siempre filtrar al año actual
        const yearTransactions = allTransactions.filter(
          (t) => t.date.startsWith(String(currentYear))
        )

        const dominant = getDominantCurrency(yearTransactions)
        setCurrency(dominant)

        // Solo la moneda dominante para no mezclar
        const filtered = yearTransactions.filter((t) => t.currency === dominant)

        // Inicializar los 12 meses del año
        const grouped: Record<string, ChartDataPoint> = {}
        for (let m = 1; m <= 12; m++) {
          const key = `${currentYear}-${String(m).padStart(2, '0')}`
          grouped[key] = { month: key, income: 0, expense: 0 }
        }

        filtered.forEach((t) => {
          const month = t.date.slice(0, 7)
          if (grouped[month]) {
            if (t.type === 'income') {
              grouped[month].income += Number(t.amount)
            } else {
              grouped[month].expense += Number(t.amount)
            }
          }
        })

        setChartData(Object.values(grouped))
      }
      setLoading(false)
    }
    fetchData()
  }, [userId, currentYear])

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
        <Heading size="md" mb={4}>Comparación Mensual {currentYear}</Heading>
        <Text color="#B0B0B0">No hay datos para mostrar.</Text>
      </Card>
    )
  }

  return (
    <Card>
      <Heading size="md" mb={1}>Comparación Mensual {currentYear}</Heading>
      <Text fontSize="xs" color="#B0B0B0" mb={4}>Solo moneda dominante: {currency}</Text>
      <Box h={{ base: '250px', md: '400px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="month"
              tickFormatter={(v: string) => MONTH_LABELS[v.slice(5)] ?? v}
            />
            <YAxis
              tickFormatter={(value) => formatCurrency(Number(value), currency)}
              width={110}
            />
            <Tooltip
              formatter={(value) => [formatCurrency(Number(value), currency), '']}
              contentStyle={{
                backgroundColor: '#1a1a23',
                border: '1px solid #2d2d35',
                borderRadius: '8px',
                color: '#ffffff',
              }}
              labelFormatter={(label) => {
                const str = String(label)
                const [year, month] = str.split('-')
                return `${MONTH_LABELS[month] ?? month} ${year}`
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
