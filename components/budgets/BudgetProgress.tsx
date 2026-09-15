'use client'

import { HStack, Text, Box, Badge } from '@chakra-ui/react'
import { formatCurrency } from '@/lib/utils/currency'
import { safeRatio, toNumber } from '@/lib/utils/numbers'
import type { BudgetWithSpent } from '@/types/database.types'

interface Props {
  budget: Pick<BudgetWithSpent, 'limit_amount' | 'spent' | 'currency' | 'amount_type'>
  /** 'full' (por defecto) = barra con encabezado y pie. 'bar' = solo la barra. */
  variant?: 'full' | 'bar'
}

/** Umbrales compartidos: verde ≤80%, amarillo >80%, rojo >100%. */
export function progressColor(percentage: number): string {
  if (percentage > 100) return '#DC2626'
  if (percentage > 80) return '#EAB308'
  return '#16A34A'
}

export function BudgetProgress({ budget, variant = 'full' }: Props) {
  const limit = toNumber(budget.limit_amount)
  const spent = toNumber(budget.spent)
  const percentage = safeRatio(spent, limit) * 100
  const remaining = limit - spent
  const bgColor = progressColor(percentage)

  const bar = (
    <Box w="full" h="2" bg="#2A2A2A" borderRadius="md" overflow="hidden">
      <Box h="full" w={`${Math.min(percentage, 100)}%`} bg={bgColor} transition="width 0.3s" />
    </Box>
  )

  if (variant === 'bar') return bar

  // A percentage budget resolves to 0 in a period with no income/expense yet.
  if (limit <= 0 && budget.amount_type !== 'fixed') {
    return (
      <Text fontSize="xs" color="#B0B0B0">
        Sin movimientos suficientes en este periodo para calcular el límite.
      </Text>
    )
  }

  return (
    <Box>
      <HStack justify="space-between" mb={2}>
        <Text fontSize="sm" fontWeight="medium">
          {percentage.toFixed(1)}%
        </Text>
        {percentage > 100 && <Badge colorPalette="red">Excedido</Badge>}
      </HStack>
      {bar}
      <HStack fontSize="xs" color="#B0B0B0" justify="space-between" mt={2}>
        <Text>Gastado: {formatCurrency(spent, budget.currency)}</Text>
        <Text>Restante: {formatCurrency(Math.max(remaining, 0), budget.currency)}</Text>
      </HStack>
    </Box>
  )
}
