'use client'

import { memo } from 'react'
import { SimpleGrid, Box } from '@chakra-ui/react'
import { StatCard } from '@/components/ui/StatCard'
import { MultiCurrencyBalance } from './MultiCurrencyBalance'
import { useFinancialSummary } from '@/hooks/useFinancialSummary'
import { formatCurrency } from '@/lib/utils/currency'
import type { TransactionWithCategory, Currency } from '@/types/database.types'

interface Props {
  transactions: TransactionWithCategory[]
  month?: string
  preferredCurrency?: Currency
  exchangeRates?: any[]
}

export const FinancialCards = memo(function FinancialCards({
  transactions,
  month,
  preferredCurrency = 'COP',
  exchangeRates = [],
}: Props) {
  const { summary } = useFinancialSummary(transactions, month, preferredCurrency, exchangeRates)

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
})
