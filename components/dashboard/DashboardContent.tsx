'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Button,
  Center,
  Grid,
  Heading,
  VStack,
  SimpleGrid,
  Spinner,
  Icon,
  Text,
} from '@chakra-ui/react'
import { LuChevronDown, LuChevronUp } from 'react-icons/lu'
import { PageHeader } from '@/components/ui/PageHeader'
import { AccountsOverview } from './AccountsOverview'
import { BalanceHero } from './BalanceHero'
import { MonthStats } from './MonthStats'
import { BudgetTiles } from './BudgetTiles'
import { TodayYesterday } from './TodayYesterday'
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
import { useFinancialSummary } from '@/hooks/useFinancialSummary'
import { getAccountsTotal } from '@/lib/utils/accounts'
import type {
  TransactionWithCategory,
  Currency,
  Account,
  ExchangeRate,
  BudgetWithSpent,
} from '@/types/database.types'

interface Props {
  userId: string
  initialTransactions: TransactionWithCategory[]
  initialPreferredCurrency: Currency
  initialExchangeRates: ExchangeRate[]
  initialAccounts?: Account[]
  budgets?: BudgetWithSpent[]
}

/** "JUE 29 OCT 2026" */
function todayEyebrow(): string {
  return new Date()
    .toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
    .replace(/[.,]/g, '')
    .replace(/ de /g, ' ')
}

/** "OCT 2026 · VS SEP" for the analysis section. */
function comparisonEyebrow(month: string): string {
  const [y, m] = month.split('-').map(Number)
  const fmt = (d: Date, opts: Intl.DateTimeFormatOptions) =>
    d.toLocaleDateString('es-CO', opts).replace('.', '').replace(' de ', ' ')
  return `${fmt(new Date(y, m - 1, 1), { month: 'short', year: 'numeric' })} · vs ${fmt(new Date(y, m - 2, 1), { month: 'short' })}`
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
  budgets = [],
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

  const { summary } = useFinancialSummary(
    initialTransactions,
    selectedMonth,
    initialPreferredCurrency,
    initialExchangeRates
  )
  const accountsTotal = useMemo(
    () => getAccountsTotal(initialAccounts, initialPreferredCurrency, initialExchangeRates),
    [initialAccounts, initialPreferredCurrency, initialExchangeRates]
  )

  const dataset = loaded?.month === selectedMonth ? loaded.data : null
  const errorMessage = error?.month === selectedMonth ? error.message : null

  return (
    <Box>
      <PageHeader
        eyebrow={todayEyebrow()}
        title="Resumen"
        actions={<MonthSelector value={selectedMonth} onChange={setSelectedMonth} />}
      />

      <VStack gap={4} align="stretch">
        <Grid templateColumns="repeat(auto-fit, minmax(min(460px, 100%), 1fr))" gap={4}>
          <BalanceHero
            balance={accountsTotal ?? summary.balance}
            currency={initialPreferredCurrency}
            exchangeRates={initialExchangeRates}
            budgets={budgets}
            month={selectedMonth}
            isCurrentMonth={selectedMonth === currentMonth}
          />
          <MonthStats
            transactions={initialTransactions}
            month={selectedMonth}
            currency={initialPreferredCurrency}
            exchangeRates={initialExchangeRates}
          />
        </Grid>

        <AccountsOverview accounts={initialAccounts} />

        <Grid templateColumns="repeat(auto-fit, minmax(min(340px, 100%), 1fr))" gap={4}>
          <BudgetTiles budgets={budgets} />
          <TodayYesterday transactions={initialTransactions} />
        </Grid>

        {/* Análisis: the current charts, redesigned in #563. */}
        <Box mt={7}>
          <Text textStyle="eyebrow" color="text3" mb={1.5}>
            {comparisonEyebrow(selectedMonth)}
          </Text>
          <Heading as="h2" fontSize="22px" fontWeight="600" color="text">
            Análisis
          </Heading>
        </Box>

        {errorMessage && (
          <Text color="neg" fontSize="sm">
            {errorMessage}
          </Text>
        )}

        {!dataset ? (
          errorMessage ? null : (
            <Center py={16}>
              <Spinner color="brand" />
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
              color="text2"
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
