'use client'

import { Box, Heading, Spinner, Center, Text } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { getTransactions } from '@/lib/actions/transactions.actions'
import { getAllRatePairs } from '@/lib/actions/exchangeRates.actions'
import { Card } from '@/components/ui/Card'
import { formatCurrency } from '@/lib/utils/currency'
import type { Currency, TransactionWithCategory } from '@/types/database.types'
import type { ReportFiltersState } from '@/components/ReportFilters'

interface ChartDataPoint {
  name: string
  icon: string
  value: number
  color: string
  percent: number
}

interface Props {
  userId: string
  type?: 'expense' | 'income'
  filters?: ReportFiltersState
  preferredCurrency?: string
}

type RateMap = Record<string, number>

function buildRateMap(rates: Array<{ from_currency: string; to_currency: string; rate: number }>): RateMap {
  const map: RateMap = {}
  for (const r of rates) {
    map[`${r.from_currency}_${r.to_currency}`] = r.rate
  }
  return map
}

function convertAmount(amount: number, from: string, to: string, rateMap: RateMap): number {
  if (from === to) return amount
  const rate = rateMap[`${from}_${to}`]
  return rate ? amount * rate : amount
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function BarTooltip({ active, payload, currency }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload as ChartDataPoint
  return (
    <Box bg="#1a1a23" border="1px solid #2d2d35" borderRadius="8px" px={3} py={2} minW="140px">
      <Text fontSize="sm" color="#B0B0B0">{d.icon} {d.name}</Text>
      <Text fontSize="sm" fontWeight="bold" color="white">{formatCurrency(d.value, currency)}</Text>
      <Text fontSize="xs" color="#B0B0B0">{d.percent.toFixed(1)}% del total</Text>
    </Box>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomYAxisTick({ x, y, payload }: any) {
  const label: string = payload.value ?? ''
  const maxLen = 18
  const truncated = label.length > maxLen
  const display = truncated ? label.slice(0, maxLen) + '…' : label
  return (
    <text x={x} y={y} dy={4} textAnchor="end" fill="#B0B0B0" fontSize={12}>
      {truncated && <title>{label}</title>}
      {display}
    </text>
  )
}

export function ExpensesByCategoryChart({ userId, type = 'expense', filters, preferredCurrency = 'COP' }: Props) {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const [txResult, ratesResult] = await Promise.all([
        getTransactions(userId, 500),
        getAllRatePairs(),
      ])

      if (txResult.success && txResult.data) {
        let transactions = txResult.data as TransactionWithCategory[]
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

        const rateMap = ratesResult.success && ratesResult.data
          ? buildRateMap(ratesResult.data as Array<{ from_currency: string; to_currency: string; rate: number }>)
          : {}

        // Group by category converting to preferred currency
        const grouped: Record<string, { value: number; color: string; icon: string }> = {}

        for (const t of transactions) {
          const categoryName = t.category?.name || 'Sin categoría'
          const converted = convertAmount(Number(t.amount), t.currency as Currency, preferredCurrency as Currency, rateMap)

          if (!grouped[categoryName]) {
            grouped[categoryName] = {
              value: 0,
              color: t.category?.color || '#6366f1',
              icon: t.category?.icon || '🏷️',
            }
          }
          grouped[categoryName].value += converted
        }

        const total = Object.values(grouped).reduce((s, v) => s + v.value, 0)

        const data: ChartDataPoint[] = Object.entries(grouped)
          .map(([name, { value, color, icon }]) => ({
            name,
            icon,
            value: Math.round(value * 100) / 100,
            color: color || '#6366f1',
            percent: total > 0 ? (value / total) * 100 : 0,
          }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 12)

        setChartData(data)
      }
      setLoading(false)
    }
    fetchData()
  }, [userId, type, filters, preferredCurrency])

  const title = type === 'expense' ? 'Gastos por Categoría' : 'Ingresos por Categoría'
  const barHeight = 32
  const chartHeight = Math.max(200, chartData.length * barHeight + 40)

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
      <Text fontSize="xs" color="#B0B0B0" mb={4}>En {preferredCurrency}</Text>
      <Box h={`${chartHeight}px`}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 4, right: 16, left: 12, bottom: 4 }}
          >
            <XAxis
              type="number"
              tickFormatter={(v) => formatCurrency(v, preferredCurrency as Currency)}
              tick={{ fill: '#B0B0B0', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={160}
              tick={<CustomYAxisTick />}
              tickLine={false}
              axisLine={false}
              interval={0}
            />
            <Tooltip content={<BarTooltip currency={preferredCurrency} />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={24}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Card>
  )
}
