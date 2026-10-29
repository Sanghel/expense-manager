'use client'

import { Box, Button, Flex, Grid, Text } from '@chakra-ui/react'
import { ActionIconButton } from '@/components/ui/ActionIconButton'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { buildGroupBreakdown, sortByConsumption } from '@/lib/utils/budget-grouping'
import { formatCompactCurrency } from '@/lib/utils/currency'
import { safeRatio } from '@/lib/utils/numbers'
import { budgetMeta, hasNoBasis, remainingLabel } from './budget-labels'
import type { BudgetWithSpent, CategoryGroupWithMembers } from '@/types/database.types'

interface Props {
  groupBudgets: BudgetWithSpent[]
  categoryBudgets: BudgetWithSpent[]
  groups: CategoryGroupWithMembers[]
  onEdit: (budget: BudgetWithSpent) => void
  onDelete: (budgetId: string) => void
  onCreate?: () => void
}

/** One tile per group budget: %, bar, what's left and its categories as chips. */
export function BudgetGroupTiles({ groupBudgets, categoryBudgets, groups, onEdit, onDelete, onCreate }: Props) {
  const ordered = sortByConsumption(groupBudgets)

  if (ordered.length === 0) {
    return (
      <Flex direction="column" align="center" gap={3} bg="surface" borderRadius="card" py={10} px={6} textAlign="center">
        <Text color="text2" fontSize="14px">
          No hay presupuestos por grupo. Crea uno para ver tus gastos en bloques.
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
    <Grid templateColumns="repeat(auto-fill, minmax(min(340px, 100%), 1fr))" gap={4}>
      {ordered.map((budget) => {
        const percent = safeRatio(budget.spent, budget.limit_amount) * 100
        const breakdown = buildGroupBreakdown(budget, categoryBudgets, groups)
        const left = remainingLabel(budget)
        const exceeded = percent >= 100
        return (
          <Box key={budget.id} bg={exceeded ? 'negSoft' : 'surface'} borderRadius="card" p={5} minW={0}>
            <Flex justify="space-between" align="flex-start" gap={3}>
              <Box minW={0}>
                <Text textStyle="cardTitle" color="text" truncate>
                  {budget.group?.icon ?? '📦'} {budget.group?.name ?? 'Grupo eliminado'}
                </Text>
                <Text fontSize="12px" color={left.exceeded ? 'neg' : 'text3'} fontFamily="mono">
                  {left.text}
                </Text>
              </Box>
              <Text fontFamily="mono" fontSize="32px" fontWeight="500" lineHeight="1" color={exceeded ? 'neg' : 'text'}>
                {Math.round(percent)}%
              </Text>
            </Flex>

            <ProgressBar value={percent} size={6} my={4} label={budget.group?.name} />

            {hasNoBasis(budget) && (
              <Text fontSize="12px" color="text3" mb={3}>
                Sin movimientos suficientes en este periodo para calcular el límite.
              </Text>
            )}

            {breakdown.members.length > 0 && (
              <Flex wrap="wrap" gap={1.5} mb={3}>
                {breakdown.members.map(({ budget: member, ratio }) => (
                  <Text
                    key={member.id}
                    as="span"
                    fontSize="12px"
                    bg={exceeded ? 'bg' : 'surface2'}
                    borderRadius="pill"
                    px={2.5}
                    py={1}
                    color="text2"
                  >
                    {member.category?.icon} {member.category?.name ?? 'Sin categoría'}{' '}
                    <Text as="span" fontFamily="mono" color={ratio >= 1 ? 'neg' : ratio >= 0.8 ? 'warn' : 'text3'}>
                      {Math.round(ratio * 100)}%
                    </Text>
                  </Text>
                ))}
                {breakdown.residual >= 1 && (
                  <Text as="span" fontSize="12px" color="text3" px={1} py={1}>
                    + otras {formatCompactCurrency(breakdown.residual, budget.currency)}
                  </Text>
                )}
              </Flex>
            )}

            <Flex justify="space-between" align="center" gap={2}>
              <Text fontSize="11px" color="text3" truncate>
                {formatCompactCurrency(Number(budget.spent), budget.currency)} de{' '}
                {formatCompactCurrency(Number(budget.limit_amount), budget.currency)} · {budgetMeta(budget)}
              </Text>
              <Flex gap={0.5} flexShrink={0}>
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

