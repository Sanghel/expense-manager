'use client'

import { useState } from 'react'
import { Box, Heading, VStack, HStack } from '@chakra-ui/react'
import { FinancialCards } from './FinancialCards'
import { MonthlyTrendChart } from './MonthlyTrendChart'
import { RecentTransactions } from './RecentTransactions'
import { BudgetWidget } from '@/components/budgets/BudgetWidget'
import { MonthSelector } from './MonthSelector'
import type { TransactionWithCategory, Currency } from '@/types/database.types'

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
      <HStack justify="space-between" align="center" mb={8}>
        <Heading>Dashboard</Heading>
        <MonthSelector value={selectedMonth} onChange={setSelectedMonth} />
      </HStack>

      <VStack gap={8} align="stretch">
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
