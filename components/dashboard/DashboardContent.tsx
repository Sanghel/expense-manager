'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { Box, Heading, VStack, HStack, Spinner } from '@chakra-ui/react'
import { FinancialCards } from './FinancialCards'
import { RecentTransactions } from './RecentTransactions'
import { BudgetWidget } from '@/components/budgets/BudgetWidget'
import { MonthSelector } from './MonthSelector'
import type { TransactionWithCategory, Currency } from '@/types/database.types'

const MonthlyTrendChart = dynamic(
  () => import('./MonthlyTrendChart').then((m) => m.MonthlyTrendChart),
  { loading: () => <Spinner />, ssr: false }
)

interface Props {
  userId: string
  initialTransactions: TransactionWithCategory[]
  initialBudgets: any[]
  initialPreferredCurrency: Currency
  initialExchangeRates: any[]
}

export function DashboardContent({
  initialTransactions,
  initialBudgets,
  initialPreferredCurrency,
  initialExchangeRates,
}: Props) {
  const currentMonth = new Date().toISOString().slice(0, 7)
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)

  return (
    <Box>
      <HStack justify="space-between" align="center" mb={{ base: 4, md: 8 }}>
        <Heading size={{ base: 'lg', md: 'xl' }}>Dashboard</Heading>
        <MonthSelector value={selectedMonth} onChange={setSelectedMonth} />
      </HStack>

      <VStack gap={{ base: 4, md: 8 }} align="stretch">
        <FinancialCards
          transactions={initialTransactions}
          month={selectedMonth}
          preferredCurrency={initialPreferredCurrency}
          exchangeRates={initialExchangeRates}
        />

        <MonthlyTrendChart transactions={initialTransactions} />

        <RecentTransactions transactions={initialTransactions} limit={10} />

        <BudgetWidget budgets={initialBudgets} />
      </VStack>
    </Box>
  )
}
