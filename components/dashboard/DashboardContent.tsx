'use client'

import { useState } from 'react'
import { Box, Heading, VStack, HStack } from '@chakra-ui/react'
import { FinancialCards } from './FinancialCards'
import { MonthlyTrendChart } from './MonthlyTrendChart'
import { RecentTransactions } from './RecentTransactions'
import { MonthSelector } from './MonthSelector'

interface Props {
  userId: string
}

export function DashboardContent({ userId }: Props) {
  const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)

  return (
    <Box>
      <HStack justify="space-between" align="center" mb={8}>
        <Heading>Dashboard</Heading>
        <MonthSelector value={selectedMonth} onChange={setSelectedMonth} />
      </HStack>

      <VStack gap={8} align="stretch">
        <FinancialCards userId={userId} month={selectedMonth} />

        <MonthlyTrendChart userId={userId} />

        <RecentTransactions userId={userId} limit={10} />
      </VStack>
    </Box>
  )
}
