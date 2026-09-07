'use client'

import { SimpleGrid } from '@chakra-ui/react'
import { StatCard } from '@/components/ui/StatCard'
import { formatCurrency } from '@/lib/utils/currency'
import { safeRatio } from '@/lib/utils/numbers'
import type { ReportDataset } from '@/lib/actions/reports.actions'

interface Props {
  totals: ReportDataset['totals']
  currency: ReportDataset['currency']
}

export function ReportStatistics({ totals, currency }: Props) {
  const savingsRate = safeRatio(totals.net, totals.income) * 100

  return (
    <SimpleGrid columns={{ base: 1, md: 3 }} gap={4} mb={6}>
      <StatCard
        label="Ingresos Totales"
        value={formatCurrency(totals.income, currency)}
        helpText={`${totals.incomeCount} transacciones`}
      />
      <StatCard
        label="Gastos Totales"
        value={formatCurrency(totals.expense, currency)}
        helpText={`${totals.expenseCount} transacciones`}
      />
      <StatCard
        label="Balance Neto"
        value={formatCurrency(totals.net, currency)}
        helpText={
          totals.income > 0
            ? `Tasa de ahorro ${savingsRate.toFixed(0)}%`
            : 'Sin ingresos en el periodo'
        }
      />
    </SimpleGrid>
  )
}
