'use client'

import {
  Box,
  Heading,
  Text,
  HStack,
  VStack,
  SimpleGrid,
  Grid,
  GridItem,
  Flex,
  Icon,
  Spinner,
} from '@chakra-ui/react'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { FiZap, FiInbox } from 'react-icons/fi'
import { Card } from '@/components/ui/Card'
import { StatCard } from '@/components/ui/StatCard'
import { PrimaryButton } from '@/components/ui/PrimaryButton'
import { InsightsList } from '@/components/savings/InsightsList'
import { BudgetSuggestionsList, type ExistingBudget } from '@/components/savings/BudgetSuggestionsList'
import { SavingsGoalSuggestions } from '@/components/savings/SavingsGoalSuggestions'
import { generateSavingsAdvice } from '@/lib/actions/savingsAdvice.actions'
import { formatCurrency } from '@/lib/utils/currency'
import { toaster } from '@/lib/toaster'
import type { AiSavingsAdvice, Category, SavingsGoal } from '@/types/database.types'
import type { SpendingSummary } from '@/lib/actions/savingsAdvice.actions'

interface Props {
  userId: string
  period: string
  advice: AiSavingsAdvice | null
  summary: SpendingSummary
  budgets: ExistingBudget[]
  categories: Category[]
  goals: SavingsGoal[]
}

// Fixed height for each scrollable column on desktop.
const COLUMN_HEIGHT = '600px'

function periodLabel(period: string): string {
  const [y, m] = period.split('-').map(Number)
  const date = new Date(y, m - 1, 1)
  const label = date.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function ConsejosAhorroPageClient({ userId, period, advice, summary, budgets, categories, goals }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [generating, setGenerating] = useState(false)
  const { currency } = summary

  const handleGenerate = async () => {
    setGenerating(true)
    const result = await generateSavingsAdvice(userId, period)
    setGenerating(false)

    if (!result.success) {
      toaster.create({ title: 'Error', description: result.error, type: 'error', duration: 4000 })
      return
    }
    if (result.skipped) {
      toaster.create({
        title: 'Sin movimientos',
        description: 'No hay gastos este mes para analizar.',
        type: 'info',
        duration: 4000,
      })
      return
    }
    toaster.create({ title: 'Consejos actualizados', type: 'success', duration: 3000 })
    startTransition(() => router.refresh())
  }

  const loading = generating || isPending
  const hasAdvice = advice != null && (advice.insights.length > 0 || advice.budget_suggestions.length > 0)

  return (
    <Box>
      <HStack justify="space-between" align="start" mb={6} flexWrap="wrap" gap={3}>
        <Box>
          <HStack gap={2}>
            <Icon as={FiZap} color="#6366f1" boxSize={6} />
            <Heading size="lg" color="white">
              Consejos de Ahorro
            </Heading>
          </HStack>
          <Text color="#B0B0B0" mt={1}>
            {periodLabel(period)}
            {advice?.generated_at && (
              <> · actualizado {new Date(advice.generated_at).toLocaleDateString('es-CO')}</>
            )}
          </Text>
        </Box>
      </HStack>

      {!summary.hasData ? (
        <Card>
          <VStack gap={3} py={6} color="#B0B0B0">
            <Icon as={FiInbox} boxSize={8} />
            <Text textAlign="center">
              No hay movimientos registrados este mes para analizar. Registra tus gastos y vuelve para
              obtener consejos personalizados.
            </Text>
          </VStack>
        </Card>
      ) : (
        <Box>
          <SimpleGrid columns={{ base: 1, sm: 3 }} gap={4} mb={6}>
            <StatCard label="Ingresos" value={formatCurrency(summary.totals.income, currency)} />
            <StatCard label="Gastos" value={formatCurrency(summary.totals.expense, currency)} />
            <StatCard label="Balance" value={formatCurrency(summary.totals.net, currency)} />
          </SimpleGrid>

          {!hasAdvice ? (
            <Card>
              <VStack gap={4} py={6}>
                <Icon as={FiZap} boxSize={8} color="#6366f1" />
                <Text textAlign="center" color="#B0B0B0">
                  Aún no has generado consejos para este mes. Genera un análisis de tus gastos con IA.
                </Text>
                <PrimaryButton onClick={handleGenerate} loading={loading}>
                  Generar consejos
                </PrimaryButton>
              </VStack>
            </Card>
          ) : (
            <VStack gap={8} align="stretch">
              <Grid templateColumns={{ base: '1fr', lg: '2fr 3fr' }} gap={6}>
                {/* Diagnóstico — 40% */}
                <GridItem>
                  <Flex direction="column" h={{ base: 'auto', lg: COLUMN_HEIGHT }}>
                    <Heading size="md" color="white" mb={4} flexShrink={0}>
                      Diagnóstico
                    </Heading>
                    <Box flex="1" minH={0} overflowY={{ base: 'visible', lg: 'auto' }} pr={{ lg: 2 }}>
                      <InsightsList insights={advice.insights} categories={categories} />
                    </Box>
                  </Flex>
                </GridItem>

                {/* Sugerencias de presupuesto — 60% */}
                <GridItem>
                  <Flex direction="column" h={{ base: 'auto', lg: COLUMN_HEIGHT }}>
                    <Heading size="md" color="white" mb={4} flexShrink={0}>
                      Sugerencias de presupuesto
                    </Heading>
                    <Box flex="1" minH={0} overflowY={{ base: 'visible', lg: 'auto' }} pr={{ lg: 2 }}>
                      <BudgetSuggestionsList
                        userId={userId}
                        period={period}
                        suggestions={advice.budget_suggestions}
                        budgets={budgets}
                        categories={categories}
                        currency={currency}
                      />
                    </Box>
                  </Flex>
                </GridItem>
              </Grid>

              {/* Metas de ahorro (sección inferior, full width) */}
              <Box>
                <Heading size="md" color="white" mb={4}>
                  Metas de ahorro
                </Heading>
                <SavingsGoalSuggestions
                  userId={userId}
                  period={period}
                  suggestions={advice.goal_suggestions ?? []}
                  goals={goals}
                  capacity={{
                    avgMonthlyIncome: summary.avgMonthlyIncome,
                    avgMonthlyExpense: summary.avgMonthlyExpense,
                    monthlySavingsCapacity: summary.monthlySavingsCapacity,
                    monthsAnalyzed: summary.monthsAnalyzed,
                  }}
                  currency={currency}
                />
              </Box>
            </VStack>
          )}

          {loading && (
            <HStack justify="center" mt={6} color="#B0B0B0" gap={2}>
              <Spinner size="sm" />
              <Text fontSize="sm">Analizando tus gastos…</Text>
            </HStack>
          )}
        </Box>
      )}
    </Box>
  )
}
