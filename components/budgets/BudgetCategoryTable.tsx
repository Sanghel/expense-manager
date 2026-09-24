'use client'

import { Box, HStack, VStack, Text, Button, Grid } from '@chakra-ui/react'
import { useState } from 'react'
import { BudgetProgress, progressColor } from './BudgetProgress'
import { ActionIconButton } from '@/components/ui/ActionIconButton'
import { sortByConsumption } from '@/lib/utils/budget-grouping'
import { formatCurrency } from '@/lib/utils/currency'
import { safeRatio, toNumber } from '@/lib/utils/numbers'
import type { BudgetWithSpent } from '@/types/database.types'

interface Props {
  budgets: BudgetWithSpent[]
  onEdit: (budget: BudgetWithSpent) => void
  onDelete: (budgetId: string) => void
  onCreate?: () => void
}

// Última columna: dos Button size="xs" (minW 2rem c/u) + gap 1 (0.25rem) = 68px.
const COLS = '1.6fr 1fr 2.2fr 72px'

function label(budget: BudgetWithSpent): string {
  const icon = budget.category?.icon ? `${budget.category.icon} ` : ''
  return `${icon}${budget.category?.name ?? 'Sin categoría'}`
}

function pct(budget: BudgetWithSpent): number {
  return safeRatio(budget.spent, budget.limit_amount) * 100
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

export function BudgetCategoryTable({ budgets, onEdit, onDelete, onCreate }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const ordered = sortByConsumption(budgets)

  if (ordered.length === 0) {
    return (
      <VStack align="start" gap={3}>
        <Text color="#B0B0B0">
          No hay presupuestos por categoría. Crea uno para empezar.
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
    <>
      {/* ---------- Desktop: tabla densa ---------- */}
      <Box display={{ base: 'none', lg: 'block' }}>
        <Grid
          templateColumns={COLS}
          gap={3}
          px={3}
          pb={2}
          borderBottomWidth="1px"
          borderColor="#2d2d35"
        >
          <Text fontSize="10px" fontWeight="600" letterSpacing="0.09em" textTransform="uppercase" color="#6f6f78">
            Categoría
          </Text>
          <Text fontSize="10px" fontWeight="600" letterSpacing="0.09em" textTransform="uppercase" color="#6f6f78" textAlign="right">
            Tope
          </Text>
          <Text fontSize="10px" fontWeight="600" letterSpacing="0.09em" textTransform="uppercase" color="#6f6f78">
            Consumo
          </Text>
          <Text fontSize="10px" fontWeight="600" letterSpacing="0.09em" textTransform="uppercase" color="#6f6f78" textAlign="right">
            %
          </Text>
        </Grid>

        {ordered.map((budget) => (
          <Grid
            key={budget.id}
            templateColumns={COLS}
            gap={3}
            px={3}
            py={2}
            alignItems="center"
            borderBottomWidth="1px"
            borderColor="#212128"
            className="group"
            _hover={{ bg: '#17171c' }}
            transition="background 0.15s"
          >
            <Text fontSize="sm" color="#e8e8ec" truncate minW={0}>
              {label(budget)}
            </Text>
            <Text fontSize="xs" color="#B0B0B0" textAlign="right">
              {formatCurrency(toNumber(budget.limit_amount), budget.currency)}
            </Text>
            <BudgetProgress budget={budget} variant="bar" />
            <HStack justify="flex-end" gap={1} position="relative">
              {/* Acciones al hover o al enfocarlas con el teclado; el % cede el lugar.
                  Las acciones van superpuestas (no en flujo) para que el % quede
                  alineado a la derecha y la columna no tenga que sumar ambos anchos. */}
              <Text
                fontSize="xs"
                fontWeight="600"
                color={progressColor(pct(budget))}
                _groupHover={{ visibility: 'hidden' }}
                _groupFocusWithin={{ visibility: 'hidden' }}
              >
                {pct(budget).toFixed(0)}%
              </Text>
              <HStack
                gap={1}
                position="absolute"
                right={0}
                top="50%"
                transform="translateY(-50%)"
                opacity={0}
                pointerEvents="none"
                _groupHover={{ opacity: 1, pointerEvents: 'auto' }}
                _groupFocusWithin={{ opacity: 1, pointerEvents: 'auto' }}
              >
                <ActionIconButton
                  kind="edit"
                  label="Editar presupuesto"
                  size="xs"
                  onClick={() => onEdit(budget)}
                />
                <ActionIconButton
                  kind="delete"
                  tone="danger"
                  label="Eliminar presupuesto"
                  size="xs"
                  onClick={() => onDelete(budget.id)}
                />
              </HStack>
            </HStack>
          </Grid>
        ))}
      </Box>

      {/* ---------- Mobile: filas de dos líneas ---------- */}
      <VStack display={{ base: 'flex', lg: 'none' }} gap={0} align="stretch">
        {ordered.map((budget) => {
          const isOpen = expandedId === budget.id
          const percentage = pct(budget)
          return (
            <Box key={budget.id} borderBottomWidth="1px" borderColor="#212128" py={2}>
              <Box
                as="button"
                w="full"
                textAlign="left"
                aria-expanded={isOpen}
                onClick={() => setExpandedId(isOpen ? null : budget.id)}
              >
                <HStack justify="space-between" align="baseline" mb={1.5}>
                  <Text fontSize="sm" fontWeight="600" color="white" truncate minW={0}>
                    {label(budget)}
                  </Text>
                  <Text fontSize="sm" fontWeight="700" color={progressColor(percentage)}>
                    {percentage.toFixed(0)}%
                  </Text>
                </HStack>
                <BudgetProgress budget={budget} variant="bar" />
                <HStack justify="space-between" mt={1.5} fontSize="10px" color="#6f6f78">
                  <Text>{formatCurrency(toNumber(budget.spent), budget.currency)}</Text>
                  <Text>de {formatCurrency(toNumber(budget.limit_amount), budget.currency)}</Text>
                </HStack>
              </Box>

              {isOpen && (
                <VStack align="stretch" gap={2} mt={3} pt={3} borderTopWidth="1px" borderColor="#212128">
                  <Text fontSize="xs" color="#B0B0B0">
                    {budget.period === 'monthly' ? 'Mensual' : 'Anual'} · desde {budget.start_date}
                    {percentBase(budget) ? ` · ${percentBase(budget)}` : ''}
                  </Text>
                  {hasNoBasis(budget) && (
                    <Text fontSize="xs" color="#B0B0B0">
                      Sin movimientos suficientes en este periodo para calcular el límite.
                    </Text>
                  )}
                  <HStack gap={2}>
                    <ActionIconButton
                      kind="edit"
                      label="Editar presupuesto"
                      onClick={() => onEdit(budget)}
                    />
                    <ActionIconButton
                      kind="delete"
                      tone="danger"
                      label="Eliminar presupuesto"
                      onClick={() => onDelete(budget.id)}
                    />
                  </HStack>
                </VStack>
              )}
            </Box>
          )
        })}
      </VStack>
    </>
  )
}
