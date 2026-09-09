'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { Box, Heading, VStack, HStack, Spinner, Icon } from '@chakra-ui/react'
import { FiHome } from 'react-icons/fi'
import { FinancialCards } from './FinancialCards'
import { AccountsOverview } from './AccountsOverview'
import { MonthSelector } from './MonthSelector'
import type { TransactionWithCategory, Currency, Account, ExchangeRate } from '@/types/database.types'

const MonthlyTrendChart = dynamic(
  () => import('./MonthlyTrendChart').then((m) => m.MonthlyTrendChart),
  { loading: () => <Spinner />, ssr: false }
)

interface Props {
  userId: string
  initialTransactions: TransactionWithCategory[]
  initialPreferredCurrency: Currency
  initialExchangeRates: ExchangeRate[]
  initialAccounts?: Account[]
}

export function DashboardContent({
  initialTransactions,
  initialPreferredCurrency,
  initialExchangeRates,
  initialAccounts = [],
}: Props) {
  const currentMonth = new Date().toISOString().slice(0, 7)
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)

  return (
    <Box>
      <HStack justify="space-between" align="center" mb={{ base: 4, md: 8 }}>
        <HStack gap={2}>
          <Icon as={FiHome} color="#6366f1" boxSize={6} />
          <Heading size={{ base: 'lg', md: 'xl' }}>Dashboard</Heading>
        </HStack>
        <MonthSelector value={selectedMonth} onChange={setSelectedMonth} />
      </HStack>

      <VStack gap={{ base: 4, md: 8 }} align="stretch">
        <FinancialCards
          transactions={initialTransactions}
          month={selectedMonth}
          preferredCurrency={initialPreferredCurrency}
          exchangeRates={initialExchangeRates}
          accounts={initialAccounts}
        />

        <AccountsOverview accounts={initialAccounts} />

        <MonthlyTrendChart transactions={initialTransactions} currency={initialPreferredCurrency} />
      </VStack>
    </Box>
  )
}
