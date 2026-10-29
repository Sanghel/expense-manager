'use client'

import { useMemo } from 'react'
import { Box, Flex, Grid, Stack, Text } from '@chakra-ui/react'
import { Card } from '@/components/ui/Card'
import { useFinancialSummary } from '@/hooks/useFinancialSummary'
import { buildConverter } from '@/lib/utils/currency-converter'
import { formatCompactCurrency, formatCurrency } from '@/lib/utils/currency'
import type { Currency, ExchangeRate, TransactionWithCategory } from '@/types/database.types'

const MONTHS = 6
/** COP has no cents in practice; USD/VES keep them. */
const decimalsFor = (currency: Currency) => (currency === 'COP' ? 0 : 2)

interface Props {
  transactions: TransactionWithCategory[]
  /** `YYYY-MM` */
  month: string
  currency: Currency
  exchangeRates: ExchangeRate[]
}

/** The `count` months ending at `month`, oldest first. */
function lastMonths(month: string, count: number): string[] {
  const [y, m] = month.split('-').map(Number)
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(y, m - 1 - (count - 1 - i), 1)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <Box minW={0}>
      <Text textStyle="sectionLabel" color="text3" mb={1.5}>
        {label}
      </Text>
      <Text textStyle="stat" color={color ?? 'text'} truncate>
        {value}
      </Text>
    </Box>
  )
}

/** Income, expense and savings rate for the month, plus the last 6 months as grouped bars. */
export function MonthStats({ transactions, month, currency, exchangeRates }: Props) {
  const { summary } = useFinancialSummary(transactions, month, currency, exchangeRates)
  const savingsRate = summary.totalIncome > 0 ? (summary.balance / summary.totalIncome) * 100 : null

  const months = useMemo(() => {
    const convert = buildConverter(exchangeRates)
    const keys = lastMonths(month, MONTHS)
    const totals = new Map(keys.map((k) => [k, { income: 0, expense: 0 }]))
    for (const t of transactions) {
      const bucket = totals.get(t.date.slice(0, 7))
      if (!bucket) continue
      bucket[t.type] += convert(Number(t.amount), t.currency, currency)
    }
    return keys.map((k) => ({ month: k, ...totals.get(k)! }))
  }, [transactions, month, currency, exchangeRates])

  const max = Math.max(1, ...months.flatMap((m) => [m.income, m.expense]))
  const fmt = (n: number) => formatCurrency(n, currency, decimalsFor(currency))

  return (
    <Card display="flex" flexDirection="column" gap={6} minW={0}>
      <Grid templateColumns="repeat(3, minmax(0, 1fr))" gap={4}>
        <Stat label="Ingresos" value={formatCompactCurrency(summary.totalIncome, currency)} color="pos" />
        <Stat label="Gastos" value={formatCompactCurrency(summary.totalExpense, currency)} />
        <Stat
          label="Ahorro"
          value={savingsRate === null ? '—' : `${Math.round(savingsRate)}%`}
          color={savingsRate !== null && savingsRate < 0 ? 'neg' : undefined}
        />
      </Grid>

      <Stack gap={3} flex="1">
        <Flex justify="space-between" align="center">
          <Text textStyle="cardTitle" color="text">
            Últimos 6 meses
          </Text>
          <Flex gap={3} fontSize="12px" color="text3">
            <Flex align="center" gap={1.5}>
              <Box boxSize="8px" borderRadius="full" bg="brand" />
              Ingresos
            </Flex>
            <Flex align="center" gap={1.5}>
              <Box boxSize="8px" borderRadius="full" bg="text3" />
              Gastos
            </Flex>
          </Flex>
        </Flex>
        <Grid templateColumns={`repeat(${MONTHS}, 1fr)`} gap={3} flex="1" minH="120px" alignItems="end">
          {months.map((m) => {
            const current = m.month === month
            const label = new Date(`${m.month}-01T12:00:00`)
              .toLocaleDateString('es-CO', { month: 'short' })
              .replace('.', '')
            return (
              <Stack
                key={m.month}
                gap={2}
                h="full"
                justify="flex-end"
                opacity={current ? 1 : 0.55}
                title={`${label}: ingresos ${fmt(m.income)} · gastos ${fmt(m.expense)}`}
              >
                <Flex align="flex-end" justify="center" gap={1} flex="1">
                  <Box w="40%" maxW="14px" h={`${(m.income / max) * 100}%`} minH="2px" bg="brand" borderRadius="4px 4px 2px 2px" />
                  <Box w="40%" maxW="14px" h={`${(m.expense / max) * 100}%`} minH="2px" bg="text3" borderRadius="4px 4px 2px 2px" />
                </Flex>
                <Text fontFamily="mono" fontSize="11px" color={current ? 'text' : 'text3'} textAlign="center">
                  {label}
                </Text>
              </Stack>
            )
          })}
        </Grid>
      </Stack>
    </Card>
  )
}
