'use client'

import { memo, useMemo } from 'react'
import { SimpleGrid, Box } from '@chakra-ui/react'
import { StatCard } from '@/components/ui/StatCard'
import { MultiCurrencyBalance } from './MultiCurrencyBalance'
import { useFinancialSummary } from '@/hooks/useFinancialSummary'
import { formatCurrency } from '@/lib/utils/currency'
import type { TransactionWithCategory, Currency, Account } from '@/types/database.types'

interface Props {
  transactions: TransactionWithCategory[]
  month?: string
  preferredCurrency?: Currency
  exchangeRates?: any[]
  accounts?: Account[]
}

export const FinancialCards = memo(function FinancialCards({
  transactions,
  month,
  preferredCurrency = 'COP',
  exchangeRates = [],
  accounts = [],
}: Props) {
  const { summary } = useFinancialSummary(transactions, month, preferredCurrency, exchangeRates)

  const accountsTotal = useMemo(() => {
    if (accounts.length === 0) return null
    return accounts.reduce((sum, acc) => {
      if (acc.currency === preferredCurrency) return sum + acc.balance
      const rate = exchangeRates.find(
        (r: any) => r.from_currency === acc.currency && r.to_currency === preferredCurrency
      )
      return sum + acc.balance * (rate ? rate.rate : 1)
    }, 0)
  }, [accounts, preferredCurrency, exchangeRates])

  const displayBalance = accountsTotal ?? summary.balance

  return (
    <SimpleGrid columns={{ base: 1, md: 3 }} gap={6}>
      <StatCard
        label="Balance Total"
        value={formatCurrency(displayBalance, preferredCurrency)}
        helpText={
          <Box mt={1}>
            <MultiCurrencyBalance balance={displayBalance} fromCurrency={preferredCurrency} />
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
