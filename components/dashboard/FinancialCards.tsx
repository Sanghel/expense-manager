'use client'

import { SimpleGrid } from '@chakra-ui/react'
import { StatCard } from '@/components/ui/StatCard'
import { useFinancialSummary } from '@/hooks/useFinancialSummary'
import { formatCurrency } from '@/lib/utils/currency'

interface Props {
  userId: string
  month?: string
}

export function FinancialCards({ userId, month }: Props) {
  const { summary, loading } = useFinancialSummary(userId, month)

  if (loading) {
    return (
      <SimpleGrid columns={{ base: 1, md: 3 }} gap={6}>
        <StatCard label="Cargando..." value="..." />
        <StatCard label="Cargando..." value="..." />
        <StatCard label="Cargando..." value="..." />
      </SimpleGrid>
    )
  }

  return (
    <SimpleGrid columns={{ base: 1, md: 3 }} gap={6}>
      <StatCard
        label="Balance Total"
        value={formatCurrency(summary.balance, summary.currency)}
        helpText="Este mes"
      />
      <StatCard
        label="Gastos"
        value={formatCurrency(summary.totalExpense, summary.currency)}
        helpText={`${summary.transactionCount} transacciones`}
      />
      <StatCard
        label="Ingresos"
        value={formatCurrency(summary.totalIncome, summary.currency)}
        helpText="Este mes"
      />
    </SimpleGrid>
  )
}
