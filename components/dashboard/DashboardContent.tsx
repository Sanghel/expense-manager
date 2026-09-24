'use client'

import { useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import {
  Box,
  Button,
  Center,
  Heading,
  VStack,
  HStack,
  SimpleGrid,
  Spinner,
  Icon,
  Text,
} from '@chakra-ui/react'
import { FiHome } from 'react-icons/fi'
import { LuChevronDown, LuChevronUp } from 'react-icons/lu'
import { FinancialCards } from './FinancialCards'
import { AccountsOverview } from './AccountsOverview'
import { MonthSelector } from './MonthSelector'
import { SpendShareWaffle } from '@/components/charts/SpendShareWaffle'
import { BudgetUsagePolarChart } from '@/components/charts/BudgetUsagePolarChart'
import { SavingsRateChart } from '@/components/charts/SavingsRateChart'
import { AntExpensesCard } from '@/components/charts/AntExpensesCard'
import { ExpensesByCategoryChart } from '@/components/charts/ExpensesByCategoryChart'
import { SpendProfileRadar } from '@/components/charts/SpendProfileRadar'
import { RecurringSplitChart } from '@/components/charts/RecurringSplitChart'
import { BreakdownBarChart } from '@/components/charts/BreakdownBarChart'
import { AccumulatedBalanceChart } from '@/components/charts/AccumulatedBalanceChart'
import { DailySpendCalendar } from '@/components/charts/DailySpendCalendar'
import { getReportDataset, type ReportDataset } from '@/lib/actions/reports.actions'
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

/** `2026-09` → the first and last day of that month, as YYYY-MM-DD. */
function monthRange(month: string): { startDate: string; endDate: string } {
  const [year, m] = month.split('-').map(Number)
  const last = new Date(year, m, 0).getDate()
  return {
    startDate: `${month}-01`,
    endDate: `${month}-${String(last).padStart(2, '0')}`,
  }
}

export function DashboardContent({
  userId,
  initialTransactions,
  initialPreferredCurrency,
  initialExchangeRates,
  initialAccounts = [],
}: Props) {
  const currentMonth = new Date().toISOString().slice(0, 7)
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)
  // The dataset is tagged with the month it belongs to, so a stale month can be
  // told apart at render time. Resetting it inside the effect instead would be a
  // synchronous setState in an effect body — a cascading render.
  const [loaded, setLoaded] = useState<{ month: string; data: ReportDataset } | null>(null)
  const [error, setError] = useState<{ month: string; message: string } | null>(null)
  const [showMore, setShowMore] = useState(false)

  const { startDate, endDate } = useMemo(() => monthRange(selectedMonth), [selectedMonth])

  // One request feeds every chart below. The month selector is the only filter:
  // the dedicated Reports page (with its category and type filters) folded into
  // this view, so the charts follow the same month as the cards.
  useEffect(() => {
    let cancelled = false
    getReportDataset(userId, {
      startDate,
      endDate,
      transactionType: 'all',
      categoryIds: [],
    }).then((result) => {
      if (cancelled) return
      if (result.success && result.data) {
        setLoaded({ month: selectedMonth, data: result.data })
      } else {
        setError({
          month: selectedMonth,
          message: result.error ?? 'No se pudieron cargar las gráficas',
        })
      }
    })
    return () => {
      cancelled = true
    }
  }, [userId, selectedMonth, startDate, endDate])

  const dataset = loaded?.month === selectedMonth ? loaded.data : null
  const errorMessage = error?.month === selectedMonth ? error.message : null

  return (
    <Box>
      <HStack justify="space-between" align="center" mb={{ base: 4, md: 6 }}>
        <HStack gap={2}>
          <Icon as={FiHome} color="#6366f1" boxSize={6} />
          <Heading size={{ base: 'lg', md: 'xl' }}>Dashboard</Heading>
        </HStack>
        <MonthSelector value={selectedMonth} onChange={setSelectedMonth} />
      </HStack>

      <VStack gap={{ base: 3, md: 4 }} align="stretch">
        <FinancialCards
          transactions={initialTransactions}
          month={selectedMonth}
          preferredCurrency={initialPreferredCurrency}
          exchangeRates={initialExchangeRates}
          accounts={initialAccounts}
          variant="compact"
        />

        <AccountsOverview accounts={initialAccounts} variant="compact" />

        {/* Fed by the full transaction list rather than the selected month, so
            it stays a real trend instead of collapsing to a single bar. */}
        <MonthlyTrendChart
          transactions={initialTransactions}
          currency={initialPreferredCurrency}
        />

        {errorMessage && (
          <Text color="#F43F5E" fontSize="sm">
            {errorMessage}
          </Text>
        )}

        {!dataset ? (
          errorMessage ? null : (
            <Center py={16}>
              <Spinner color="#4F46E5" />
            </Center>
          )
        ) : (
          <>
            <SimpleGrid columns={{ base: 1, md: 2 }} gap={{ base: 3, md: 4 }}>
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

              <ExpensesByCategoryChart
                type="expense"
                data={dataset.expenseByCategory}
                currency={dataset.currency}
              />

              <SpendProfileRadar data={dataset.profile} currency={dataset.currency} />
            </SimpleGrid>

            <Button
              alignSelf="center"
              size="sm"
              variant="ghost"
              color="#B0B0B0"
              onClick={() => setShowMore((v) => !v)}
            >
              <Icon as={showMore ? LuChevronUp : LuChevronDown} />
              {showMore ? 'Ocultar análisis adicional' : 'Ver más análisis'}
            </Button>

            {showMore && (
              <SimpleGrid columns={{ base: 1, md: 2 }} gap={{ base: 3, md: 4 }}>
                <ExpensesByCategoryChart
                  type="income"
                  data={dataset.incomeByCategory}
                  currency={dataset.currency}
                />

                <RecurringSplitChart
                  data={dataset.recurringSplit}
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
                  <AccumulatedBalanceChart
                    data={dataset.cumulative}
                    currency={dataset.currency}
                  />
                </Box>

                <Box gridColumn={{ base: 'auto', md: '1 / -1' }}>
                  <DailySpendCalendar
                    data={dataset.daily}
                    currency={dataset.currency}
                    from={startDate}
                    to={endDate}
                  />
                </Box>
              </SimpleGrid>
            )}
          </>
        )}
      </VStack>
    </Box>
  )
}
