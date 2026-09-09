'use client'

import { useEffect, useState } from 'react'
import {
  Box,
  Heading,
  SimpleGrid,
  HStack,
  Icon,
  Center,
  Spinner,
  Text,
} from '@chakra-ui/react'
import { FiBarChart2 } from 'react-icons/fi'
import { ExpensesByCategoryChart } from '@/components/charts/ExpensesByCategoryChart'
import { MonthlyComparisonChart } from '@/components/charts/MonthlyComparisonChart'
import { AccumulatedBalanceChart } from '@/components/charts/AccumulatedBalanceChart'
import { SpendShareWaffle } from '@/components/charts/SpendShareWaffle'
import { BudgetUsagePolarChart } from '@/components/charts/BudgetUsagePolarChart'
import { SpendProfileRadar } from '@/components/charts/SpendProfileRadar'
import { SavingsRateChart } from '@/components/charts/SavingsRateChart'
import { DailySpendCalendar } from '@/components/charts/DailySpendCalendar'
import { RecurringSplitChart } from '@/components/charts/RecurringSplitChart'
import { BreakdownBarChart } from '@/components/charts/BreakdownBarChart'
import { AntExpensesCard } from '@/components/charts/AntExpensesCard'
import {
  ReportFilters,
  getCurrentMonthRange,
  type ReportFiltersState,
} from '@/components/ReportFilters'
import { ReportStatistics } from '@/components/ReportStatistics'
import { getReportDataset, type ReportDataset } from '@/lib/actions/reports.actions'

interface Props {
  userId: string
}

export function ReportsContent({ userId }: Props) {
  const [filters, setFilters] = useState<ReportFiltersState>(() => {
    const { firstDay, lastDay } = getCurrentMonthRange()
    return { startDate: firstDay, endDate: lastDay, categoryIds: [], transactionType: 'all' }
  })

  const [dataset, setDataset] = useState<ReportDataset | null>(null)
  const [error, setError] = useState<string | null>(null)

  // One request for the whole page: every chart used to fetch its own 500 rows.
  // The primitive dependencies (rather than the `filters` object, which is a new
  // identity on every parent render) keep this from refetching on every render.
  const { startDate, endDate, transactionType } = filters
  const categoryKey = filters.categoryIds.join(',')

  useEffect(() => {
    let cancelled = false
    getReportDataset(userId, {
      startDate,
      endDate,
      transactionType,
      categoryIds: categoryKey ? categoryKey.split(',') : [],
    }).then((result) => {
      if (cancelled) return
      if (result.success && result.data) {
        setDataset(result.data)
        setError(null)
      } else {
        setError(result.error ?? 'No se pudo cargar el reporte')
      }
    })
    return () => {
      cancelled = true
    }
  }, [userId, startDate, endDate, transactionType, categoryKey])

  return (
    <Box>
      <HStack gap={2} mb={{ base: 4, md: 6 }}>
        <Icon as={FiBarChart2} color="#6366f1" boxSize={6} />
        <Heading size={{ base: 'lg', md: 'xl' }}>Reportes</Heading>
      </HStack>

      <ReportFilters userId={userId} onFilterChange={setFilters} />

      {error && (
        <Text color="#F43F5E" fontSize="sm" mb={4}>{error}</Text>
      )}

      {!dataset ? (
        <Center py={20}>
          <Spinner color="#4F46E5" />
        </Center>
      ) : (
        <>
          <ReportStatistics totals={dataset.totals} currency={dataset.currency} />

          <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
            <SpendShareWaffle
              title="Reparto del Gasto"
              subtitle={
                dataset.expenseByGroup.length > 0
                  ? 'De cada 100 que gastaste, cuánto se fue a cada grupo de categorías'
                  : 'De cada 100 que gastaste, cuánto se fue a cada categoría'
              }
              data={
                dataset.expenseByGroup.length > 0
                  ? dataset.expenseByGroup
                  : dataset.expenseByCategory
              }
              total={dataset.totals.expense}
              currency={dataset.currency}
            />

            <BudgetUsagePolarChart data={dataset.budgetUsage} />

            <SavingsRateChart data={dataset.savingsRate} />

            <AntExpensesCard
              data={dataset.antExpenses}
              totalExpense={dataset.totals.expense}
              currency={dataset.currency}
            />

            <SpendProfileRadar data={dataset.profile} currency={dataset.currency} />

            <RecurringSplitChart data={dataset.recurringSplit} currency={dataset.currency} />

            <ExpensesByCategoryChart
              type="expense"
              data={dataset.expenseByCategory}
              currency={dataset.currency}
            />
            <ExpensesByCategoryChart
              type="income"
              data={dataset.incomeByCategory}
              currency={dataset.currency}
            />

            <BreakdownBarChart
              title="Gasto por Cuenta"
              data={dataset.expenseByAccount}
              currency={dataset.currency}
              colorIndex={2}
            />
            <BreakdownBarChart
              title="Gasto por Día de la Semana"
              subtitle="Dónde se concentra el gasto a lo largo de la semana"
              data={dataset.expenseByWeekday.map((d) => ({
                id: String(d.weekday),
                label: d.label,
                value: d.value,
              }))}
              currency={dataset.currency}
              colorIndex={3}
            />

            <BreakdownBarChart
              title="Gasto por Origen"
              subtitle="Cómo entró cada transacción al sistema"
              data={dataset.expenseBySource}
              currency={dataset.currency}
              colorIndex={4}
            />

            <Box gridColumn={{ base: 'auto', md: '1 / -1' }}>
              <MonthlyComparisonChart data={dataset.monthly} currency={dataset.currency} />
            </Box>

            <Box gridColumn={{ base: 'auto', md: '1 / -1' }}>
              <AccumulatedBalanceChart data={dataset.cumulative} currency={dataset.currency} />
            </Box>

            <Box gridColumn={{ base: 'auto', md: '1 / -1' }}>
              <DailySpendCalendar
                data={dataset.daily}
                currency={dataset.currency}
                from={filters.startDate}
                to={filters.endDate}
              />
            </Box>
          </SimpleGrid>
        </>
      )}
    </Box>
  )
}
