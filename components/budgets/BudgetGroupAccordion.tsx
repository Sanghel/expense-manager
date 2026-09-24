'use client'

import { Box, HStack, VStack, Text, Button, Grid } from '@chakra-ui/react'
import { useState } from 'react'
import { FiChevronDown, FiChevronRight } from 'react-icons/fi'
import { BudgetProgress, progressColor } from './BudgetProgress'
import { ActionIconButton } from '@/components/ui/ActionIconButton'
import { buildGroupBreakdown, sortByConsumption } from '@/lib/utils/budget-grouping'
import { formatCurrency } from '@/lib/utils/currency'
import { safeRatio, toNumber } from '@/lib/utils/numbers'
import type { BudgetWithSpent, CategoryGroupWithMembers } from '@/types/database.types'

interface Props {
  groupBudgets: BudgetWithSpent[]
  categoryBudgets: BudgetWithSpent[]
  groups: CategoryGroupWithMembers[]
  onEdit: (budget: BudgetWithSpent) => void
  onDelete: (budgetId: string) => void
  onCreate?: () => void
}

/** Base porcentual del tope, o null si el presupuesto es de monto fijo. */
function percentBase(budget: BudgetWithSpent): string | null {
  if (budget.amount_type === 'percent_income') return `${toNumber(budget.percent)}% de ingresos`
  if (budget.amount_type === 'percent_expense') return `${toNumber(budget.percent)}% del gasto`
  return null
}

/** Un presupuesto porcentual resuelve a 0 en un periodo sin movimientos. */
function hasNoBasis(budget: BudgetWithSpent): boolean {
  return budget.amount_type !== 'fixed' && toNumber(budget.limit_amount) <= 0
}

export function BudgetGroupAccordion({
  groupBudgets,
  categoryBudgets,
  groups,
  onEdit,
  onDelete,
  onCreate,
}: Props) {
  const [openId, setOpenId] = useState<string | null>(null)
  const ordered = sortByConsumption(groupBudgets)

  if (ordered.length === 0) {
    return (
      <VStack align="start" gap={3}>
        <Text color="#B0B0B0">
          No hay presupuestos por grupo. Crea uno para ver tus gastos en bloques.
        </Text>
        {onCreate && (
          <Button size="sm" bg="#4F46E5" color="white" _hover={{ bg: '#4338CA' }} onClick={onCreate}>
            Nuevo Presupuesto
          </Button>
        )}
      </VStack>
    )
  }

  return (
    <VStack gap={2} align="stretch">
      {ordered.map((groupBudget) => {
        const isOpen = openId === groupBudget.id
        const percentage = safeRatio(groupBudget.spent, groupBudget.limit_amount) * 100
        const breakdown = buildGroupBreakdown(groupBudget, categoryBudgets, groups)

        return (
          <Box
            key={groupBudget.id}
            borderWidth="1px"
            borderColor={percentage > 100 ? '#DC2626' : '#2d2d35'}
            borderRadius="lg"
            bg="#1A1A1A"
            overflow="hidden"
          >
            <Box
              as="button"
              w="full"
              textAlign="left"
              px={4}
              py={3}
              _hover={{ bg: '#1f1f26' }}
              transition="background 0.15s"
              onClick={() => setOpenId(isOpen ? null : groupBudget.id)}
              aria-expanded={isOpen}
            >
              <HStack justify="space-between" mb={2} gap={2}>
                <HStack gap={2} minW={0}>
                  <Box color="#6f6f78" display="flex">
                    {isOpen ? <FiChevronDown /> : <FiChevronRight />}
                  </Box>
                  <Text fontSize="sm" fontWeight="600" color="white" truncate minW={0}>
                    {groupBudget.group?.icon ?? '📦'} {groupBudget.group?.name ?? 'Grupo eliminado'}
                  </Text>
                </HStack>
                <HStack gap={3} flexShrink={0}>
                  {/* A ~390px las cifras COP no caben junto al nombre: el bloque
                      "X de Y" baja de línea (se repite bajo la barra, ver abajo). */}
                  <Text
                    fontSize="xs"
                    color="#B0B0B0"
                    display={{ base: 'none', md: 'block' }}
                  >
                    {formatCurrency(toNumber(groupBudget.spent), groupBudget.currency)} de{' '}
                    {formatCurrency(toNumber(groupBudget.limit_amount), groupBudget.currency)}
                  </Text>
                  <Text fontSize="sm" fontWeight="700" color={progressColor(percentage)}>
                    {percentage.toFixed(0)}%
                  </Text>
                </HStack>
              </HStack>
              <BudgetProgress budget={groupBudget} variant="bar" />
              <Text
                display={{ base: 'block', md: 'none' }}
                mt={1.5}
                fontSize="10px"
                color="#6f6f78"
              >
                {formatCurrency(toNumber(groupBudget.spent), groupBudget.currency)} de{' '}
                {formatCurrency(toNumber(groupBudget.limit_amount), groupBudget.currency)}
              </Text>
            </Box>

            {isOpen && (
              <VStack
                align="stretch"
                gap={2}
                px={4}
                py={3}
                borderTopWidth="1px"
                borderColor="#26262e"
                bg="#141418"
              >
                <Text fontSize="xs" color="#B0B0B0">
                  {groupBudget.period === 'monthly' ? 'Mensual' : 'Anual'} · desde{' '}
                  {groupBudget.start_date}
                  {percentBase(groupBudget) ? ` · ${percentBase(groupBudget)}` : ''}
                </Text>
                {hasNoBasis(groupBudget) && (
                  <Text fontSize="xs" color="#B0B0B0">
                    Sin movimientos suficientes en este periodo para calcular el límite.
                  </Text>
                )}

                {breakdown.members.map(({ budget, ratio }) => (
                  <Grid key={budget.id} templateColumns="1.4fr 2fr 48px" gap={3} alignItems="center">
                    <Text fontSize="xs" color="#e8e8ec" truncate minW={0}>
                      {budget.category?.icon ?? ''} {budget.category?.name ?? 'Sin categoría'}
                    </Text>
                    <BudgetProgress budget={budget} variant="bar" />
                    <Text fontSize="xs" fontWeight="600" textAlign="right" color={progressColor(ratio * 100)}>
                      {(ratio * 100).toFixed(0)}%
                    </Text>
                  </Grid>
                ))}

                {breakdown.residual > 0 && (
                  <Grid templateColumns="1.4fr 2fr 48px" gap={3} alignItems="center" pt={1}>
                    <Text fontSize="xs" color="#6f6f78" fontStyle="italic" truncate minW={0}>
                      Otras categorías del grupo
                    </Text>
                    <Text fontSize="xs" color="#6f6f78">
                      {formatCurrency(breakdown.residual, groupBudget.currency)}
                    </Text>
                    <Box />
                  </Grid>
                )}

                {breakdown.members.length === 0 && breakdown.residual === 0 && (
                  <Text fontSize="xs" color="#6f6f78">
                    Sin gasto registrado en este periodo.
                  </Text>
                )}

                <HStack gap={2} pt={2} borderTopWidth="1px" borderColor="#26262e" mt={1}>
                  <ActionIconButton
                    kind="edit"
                    label="Editar grupo"
                    size="xs"
                    onClick={() => onEdit(groupBudget)}
                  />
                  <ActionIconButton
                    kind="delete"
                    tone="danger"
                    label="Eliminar grupo"
                    size="xs"
                    onClick={() => onDelete(groupBudget.id)}
                  />
                </HStack>
              </VStack>
            )}
          </Box>
        )
      })}
    </VStack>
  )
}
