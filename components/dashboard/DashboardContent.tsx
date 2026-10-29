'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Center,
  Grid,
  Heading,
  VStack,
  Spinner,
  Text,
} from '@chakra-ui/react'
import { PageHeader } from '@/components/ui/PageHeader'
import { AccountsOverview } from './AccountsOverview'
import { BalanceHero } from './BalanceHero'
import { MonthStats } from './MonthStats'
import { BudgetTiles } from './BudgetTiles'
import { TodayYesterday } from './TodayYesterday'
import { MonthSelector } from './MonthSelector'
import { AnalysisSection } from './AnalysisSection'
import { getAnalysisDataset, type AnalysisDataset } from '@/lib/actions/reports.actions'
import { useFinancialSummary } from '@/hooks/useFinancialSummary'
import { getAccountsTotal } from '@/lib/utils/accounts'
import { todayEyebrow } from '@/lib/utils/dates'
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

/** "OCT 2026 · VS SEP" for the analysis section. */
function comparisonEyebrow(month: string): string {
  const [y, m] = month.split('-').map(Number)
  const fmt = (d: Date, opts: Intl.DateTimeFormatOptions) =>
    d.toLocaleDateString('es-CO', opts).replace('.', '').replace(' de ', ' ')
  return `${fmt(new Date(y, m - 1, 1), { month: 'short', year: 'numeric' })} · vs ${fmt(new Date(y, m - 2, 1), { month: 'short' })}`
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
  const [loaded, setLoaded] = useState<{ month: string; data: AnalysisDataset } | null>(null)
  const [error, setError] = useState<{ month: string; message: string } | null>(null)

  // One request feeds every Análisis card; it follows the month selector.
  useEffect(() => {
    let cancelled = false
    getAnalysisDataset(userId, selectedMonth).then((result) => {
      if (cancelled) return
      if (result.success && result.data) {
        setLoaded({ month: selectedMonth, data: result.data })
      } else {
        setError({
          month: selectedMonth,
          message: result.error ?? 'No se pudo cargar el análisis',
        })
      }
    })
    return () => {
      cancelled = true
    }
  }, [userId, selectedMonth])

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
          <AnalysisSection data={dataset} />
        )}
      </VStack>
    </Box>
  )
}
