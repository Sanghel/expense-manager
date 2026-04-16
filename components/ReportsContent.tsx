'use client'

import { useState } from 'react'
import { Box, Heading, SimpleGrid } from '@chakra-ui/react'
import { ExpensesByCategoryChart } from '@/components/charts/ExpensesByCategoryChart'
import { MonthlyComparisonChart } from '@/components/charts/MonthlyComparisonChart'
import { AccumulatedBalanceChart } from '@/components/charts/AccumulatedBalanceChart'
import { ReportFilters, type ReportFiltersState } from '@/components/ReportFilters'

interface Props {
  userId: string
}

export function ReportsContent({ userId }: Props) {
  const [filters, setFilters] = useState<ReportFiltersState>({
    startDate: '',
    endDate: '',
    categoryIds: [],
    transactionType: 'all',
  })

  return (
    <Box p={4}>
      <Heading mb={8} size="lg">
        Reportes
      </Heading>

      <ReportFilters userId={userId} onFilterChange={setFilters} />

      <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
        <Box gridColumn={{ base: 'auto', md: '1 / -1' }}>
          <AccumulatedBalanceChart userId={userId} filters={filters} />
        </Box>
        <Box gridColumn={{ base: 'auto', md: '1 / -1' }}>
          <MonthlyComparisonChart userId={userId} months={12} filters={filters} />
        </Box>
        <ExpensesByCategoryChart userId={userId} type="expense" filters={filters} />
        <ExpensesByCategoryChart userId={userId} type="income" filters={filters} />
      </SimpleGrid>
    </Box>
  )
}
