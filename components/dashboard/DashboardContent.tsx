'use client'

import { useState, useEffect } from 'react'
import { Box, Heading, VStack, HStack } from '@chakra-ui/react'
import { FinancialCards } from './FinancialCards'
import { MonthlyTrendChart } from './MonthlyTrendChart'
import { RecentTransactions } from './RecentTransactions'
import { BudgetWidget } from '@/components/budgets/BudgetWidget'
import { MonthSelector } from './MonthSelector'
import { getUserProfile } from '@/lib/actions/users.actions'
import type { Currency } from '@/types/database.types'

interface Props {
  userId: string
}

export function DashboardContent({ userId }: Props) {
  const currentMonth = new Date().toISOString().slice(0, 7)
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)
  const [preferredCurrency, setPreferredCurrency] = useState<Currency>('COP')

  useEffect(() => {
    getUserProfile(userId).then((result) => {
      if (result.success && result.data) {
        setPreferredCurrency(result.data.preferred_currency)
      }
    })
  }, [userId])

  return (
    <Box>
      <HStack justify="space-between" align="center" mb={8}>
        <Heading>Dashboard</Heading>
        <MonthSelector value={selectedMonth} onChange={setSelectedMonth} />
      </HStack>

      <VStack gap={8} align="stretch">
        <FinancialCards
          userId={userId}
          month={selectedMonth}
          preferredCurrency={preferredCurrency}
        />

        <MonthlyTrendChart userId={userId} />

        <RecentTransactions userId={userId} limit={10} />

        <BudgetWidget userId={userId} />
      </VStack>
    </Box>
  )
}
