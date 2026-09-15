'use client'

import { VStack, HStack, Heading, Text, Button, Box, Link, Grid } from '@chakra-ui/react'
import { BudgetProgress, progressColor } from './BudgetProgress'
import { splitBudgetsByScope, sortByConsumption } from '@/lib/utils/budget-grouping'
import { safeRatio } from '@/lib/utils/numbers'
import type { BudgetWithSpent } from '@/types/database.types'

interface Props {
  budgets: BudgetWithSpent[]
}

function rowLabel(budget: BudgetWithSpent): string {
  if (budget.scope === 'total') return '🧾 Todos los gastos'
  if (budget.scope === 'group') return `${budget.group?.icon ?? '📦'} ${budget.group?.name ?? 'Grupo'}`
  return `${budget.category?.icon ?? ''} ${budget.category?.name ?? 'Sin categoría'}`
}

export function BudgetWidget({ budgets }: Props) {
  const { groups } = splitBudgetsByScope(budgets)

  // Con presupuestos de grupo, el widget son sus cifras (todas, no top 3).
  // Sin ellos, se conserva el comportamiento anterior para no dejarlo vacío.
  const rows =
    groups.length > 0 ? sortByConsumption(groups) : sortByConsumption(budgets).slice(0, 3)

  return (
    <Box borderWidth="1px" borderRadius="lg" p={6} bg="#0F0F0F">
      <VStack gap={4} align="stretch">
        <HStack justify="space-between">
          <Heading size="md">{groups.length > 0 ? 'Presupuestos por Grupo' : 'Presupuestos del Mes'}</Heading>
          <Link href="/planificacion?tab=presupuestos&vista=grupos" _hover={{ textDecoration: 'none' }}>
            <Button size="sm" variant="ghost">
              Ver todos →
            </Button>
          </Link>
        </HStack>

        {rows.length === 0 ? (
          <Text color="#B0B0B0" fontSize="sm">
            No hay presupuestos. Crea uno para empezar.
          </Text>
        ) : (
          <VStack gap={2.5} align="stretch">
            {rows.map((budget) => {
              const percentage = safeRatio(budget.spent, budget.limit_amount) * 100
              return (
                <Grid key={budget.id} templateColumns="1.3fr 2fr 42px" gap={3} alignItems="center">
                  <Text fontSize="xs" color="#e8e8ec" truncate minW={0}>
                    {rowLabel(budget)}
                  </Text>
                  <BudgetProgress budget={budget} variant="bar" />
                  <Text fontSize="xs" fontWeight="600" textAlign="right" color={progressColor(percentage)}>
                    {percentage.toFixed(0)}%
                  </Text>
                </Grid>
              )
            })}
          </VStack>
        )}
      </VStack>
    </Box>
  )
}
