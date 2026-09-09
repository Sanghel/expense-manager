'use client'

import { memo, useMemo } from 'react'
import { SimpleGrid, Box } from '@chakra-ui/react'
import { StatCard } from '@/components/ui/StatCard'
import { MultiCurrencyBalance } from './MultiCurrencyBalance'
import { useFinancialSummary } from '@/hooks/useFinancialSummary'
import { formatCurrency } from '@/lib/utils/currency'
import { getAccountsTotal } from '@/lib/utils/accounts'
import type { TransactionWithCategory, Currency, Account, ExchangeRate } from '@/types/database.types'

interface Props {
  transactions: TransactionWithCategory[]
  month?: string
  preferredCurrency?: Currency
  exchangeRates?: ExchangeRate[]
  accounts?: Account[]
  variant?: 'default' | 'compact'
}

export const FinancialCards = memo(function FinancialCards({
  transactions,
  month,
  preferredCurrency = 'COP',
  exchangeRates = [],
  accounts = [],
  variant = 'default',
}: Props) {
  const { summary } = useFinancialSummary(transactions, month, preferredCurrency, exchangeRates)

  const accountsTotal = useMemo(
    () => getAccountsTotal(accounts, preferredCurrency, exchangeRates),
    [accounts, preferredCurrency, exchangeRates]
  )

  const displayBalance = accountsTotal ?? summary.balance

  return (
    <SimpleGrid columns={{ base: 1, md: 3 }} gap={variant === 'compact' ? 3 : 6}>
      <StatCard
        variant={variant}
        label="Balance Total"
        value={formatCurrency(displayBalance, preferredCurrency)}
        helpText={
          <Box mt={1}>
            <MultiCurrencyBalance balance={displayBalance} fromCurrency={preferredCurrency} />
          </Box>
        }
      />
      <StatCard
        variant={variant}
        label="Gastos"
        value={formatCurrency(summary.totalExpense, preferredCurrency)}
        helpText={`${summary.expenseCount} transacciones`}
      />
      <StatCard
        variant={variant}
        label="Ingresos"
        value={formatCurrency(summary.totalIncome, preferredCurrency)}
        helpText={`${summary.incomeCount} transacciones`}
      />
    </SimpleGrid>
  )
})
