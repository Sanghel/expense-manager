'use client'

import { useState } from 'react'
import { Box, Heading, SimpleGrid, HStack, Icon } from '@chakra-ui/react'
import { FiBarChart2 } from 'react-icons/fi'
import { ExpensesByCategoryChart } from '@/components/charts/ExpensesByCategoryChart'
import { MonthlyComparisonChart } from '@/components/charts/MonthlyComparisonChart'
import { AccumulatedBalanceChart } from '@/components/charts/AccumulatedBalanceChart'
import { ReportFilters, getCurrentMonthRange, type ReportFiltersState } from '@/components/ReportFilters'
import { ReportStatistics } from '@/components/ReportStatistics'

interface Props {
  userId: string
  preferredCurrency: string
}

export function ReportsContent({ userId, preferredCurrency }: Props) {
  const [filters, setFilters] = useState<ReportFiltersState>(() => {
    const { firstDay, lastDay } = getCurrentMonthRange()
    return {
      startDate: firstDay,
      endDate: lastDay,
      categoryIds: [],
      transactionType: 'all',
    }
  })

  return (
    <Box p={4}>
      <HStack gap={2} mb={8}>
        <Icon as={FiBarChart2} color="#6366f1" boxSize={6} />
        <Heading size="lg">
          Reportes
        </Heading>
      </HStack>

      <ReportFilters userId={userId} onFilterChange={setFilters} />

      <ReportStatistics userId={userId} filters={filters} />

      <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
        <ExpensesByCategoryChart userId={userId} type="expense" filters={filters} preferredCurrency={preferredCurrency} />
        <ExpensesByCategoryChart userId={userId} type="income" filters={filters} preferredCurrency={preferredCurrency} />
        <Box gridColumn={{ base: 'auto', md: '1 / -1' }}>
          <MonthlyComparisonChart userId={userId} />
        </Box>
        <Box gridColumn={{ base: 'auto', md: '1 / -1' }}>
          <AccumulatedBalanceChart userId={userId} filters={filters} />
        </Box>
      </SimpleGrid>
    </Box>
  )
}
