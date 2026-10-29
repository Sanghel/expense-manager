'use client'

import { Box, Button, Flex, Grid, Text } from '@chakra-ui/react'
import { ActionIconButton } from '@/components/ui/ActionIconButton'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { sortByConsumption } from '@/lib/utils/budget-grouping'
import { safeRatio } from '@/lib/utils/numbers'
import { budgetMeta, hasNoBasis, remainingLabel } from './budget-labels'
import type { BudgetWithSpent } from '@/types/database.types'

interface Props {
  budgets: BudgetWithSpent[]
  onEdit: (budget: BudgetWithSpent) => void
  onDelete: (budgetId: string) => void
  onCreate?: () => void
}

/** Grid of category budget cards: %, a thin bar and what's left. */
export function BudgetCategoryCards({ budgets, onEdit, onDelete, onCreate }: Props) {
  const ordered = sortByConsumption(budgets)

  if (ordered.length === 0) {
    return (
      <Flex direction="column" align="center" gap={3} bg="surface" borderRadius="card" py={10} px={6} textAlign="center">
        <Text color="text2" fontSize="14px">
          No hay presupuestos por categoría. Crea uno para empezar.
        </Text>
        {onCreate && (
          <Button size="sm" bg="brandSoft" color="brand" onClick={onCreate}>
            Nuevo presupuesto
          </Button>
        )}
      </Flex>
    )
  }

  return (
    <Grid templateColumns="repeat(auto-fill, minmax(min(250px, 100%), 1fr))" gap={3}>
      {ordered.map((budget) => {
        const percent = safeRatio(budget.spent, budget.limit_amount) * 100
        const left = remainingLabel(budget)
        return (
          <Box
            key={budget.id}
            bg={percent >= 100 ? 'negSoft' : 'surface'}
            borderRadius="tile"
            p={4}
            minW={0}
            title={budgetMeta(budget)}
            css={{
              '@media (hover: hover)': {
                '& .card-actions': { opacity: 0, transition: 'opacity 150ms' },
                '&:hover .card-actions, &:focus-within .card-actions': { opacity: 1 },
              },
            }}
          >
            <Flex justify="space-between" align="center" gap={2} mb={3}>
              <Text fontSize="14px" fontWeight="500" color="text" truncate>
                {budget.category?.icon} {budget.category?.name ?? 'Sin categoría'}
              </Text>
              <Text fontFamily="mono" fontSize="16px" fontWeight="500" color={percent >= 100 ? 'neg' : 'text'} flexShrink={0}>
                {Math.round(percent)}%
              </Text>
            </Flex>
            <ProgressBar value={percent} size={4} label={budget.category?.name} />
            <Flex justify="space-between" align="center" mt={2.5} gap={2}>
              <Text fontSize="12px" fontFamily="mono" color={left.exceeded ? 'neg' : 'text3'} truncate>
                {hasNoBasis(budget) ? 'Sin base este periodo' : left.text}
              </Text>
              <Flex gap={0.5} className="card-actions" flexShrink={0}>
                <ActionIconButton kind="edit" label="Editar presupuesto" size="xs" variant="ghost" onClick={() => onEdit(budget)} />
                <ActionIconButton kind="delete" tone="danger" label="Eliminar presupuesto" size="xs" variant="ghost" onClick={() => onDelete(budget.id)} />
              </Flex>
            </Flex>
          </Box>
        )
      })}
    </Grid>
  )
}
