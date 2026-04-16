'use client'

import { SimpleGrid, Box } from '@chakra-ui/react'
import { StatCard } from '@/components/ui/StatCard'
import { MultiCurrencyBalance } from './MultiCurrencyBalance'
import { useFinancialSummary } from '@/hooks/useFinancialSummary'
import { formatCurrency } from '@/lib/utils/currency'
import type { Currency } from '@/types/database.types'

interface Props {
  userId: string
  month?: string
  preferredCurrency?: Currency
}

export function FinancialCards({ userId, month, preferredCurrency = 'COP' }: Props) {
  const { summary, loading } = useFinancialSummary(userId, month, preferredCurrency)

  if (loading) {
    return (
      <SimpleGrid columns={{ base: 1, md: 3 }} gap={6}>
        <StatCard label="Cargando..." value="..." />
        <StatCard label="Cargando..." value="..." />
        <StatCard label="Cargando..." value="..." />
      </SimpleGrid>
    )
  }

  return (
    <SimpleGrid columns={{ base: 1, md: 3 }} gap={6}>
      <StatCard
        label="Balance Total"
        value={formatCurrency(summary.balance, preferredCurrency)}
        helpText={
          <Box mt={1}>
            <MultiCurrencyBalance balance={summary.balance} fromCurrency={preferredCurrency} />
          </Box>
        }
      />
      <StatCard
        label="Gastos"
        value={formatCurrency(summary.totalExpense, preferredCurrency)}
        helpText={`${summary.transactionCount} transacciones`}
      />
      <StatCard
        label="Ingresos"
        value={formatCurrency(summary.totalIncome, preferredCurrency)}
        helpText="Este mes"
      />
    </SimpleGrid>
  )
}
