'use client'

import { HStack, Text, Box, Badge } from '@chakra-ui/react'
import { formatCurrency } from '@/lib/utils/currency'
import { safeRatio, toNumber } from '@/lib/utils/numbers'
import type { BudgetWithSpent } from '@/types/database.types'

interface Props {
  budget: Pick<BudgetWithSpent, 'limit_amount' | 'spent' | 'currency' | 'amount_type'>
}

export function BudgetProgress({ budget }: Props) {
  const limit = toNumber(budget.limit_amount)
  const spent = toNumber(budget.spent)
  const percentage = safeRatio(spent, limit) * 100
  const remaining = limit - spent

  // A percentage budget resolves to 0 in a period with no income/expense yet.
  if (limit <= 0 && budget.amount_type !== 'fixed') {
    return (
      <Text fontSize="xs" color="#B0B0B0">
        Sin movimientos suficientes en este periodo para calcular el límite.
      </Text>
    )
  }

  let bgColor = '#16A34A'
  if (percentage > 100) bgColor = '#DC2626'
  else if (percentage > 80) bgColor = '#EAB308'

  return (
    <Box>
      <HStack justify="space-between" mb={2}>
        <Text fontSize="sm" fontWeight="medium">
          {percentage.toFixed(1)}%
        </Text>
        {percentage > 100 && <Badge colorPalette="red">Excedido</Badge>}
      </HStack>
      <Box
        w="full"
        h="2"
        bg="#2A2A2A"
        borderRadius="md"
        overflow="hidden"
      >
        <Box
          h="full"
          w={`${Math.min(percentage, 100)}%`}
          bg={bgColor}
          transition="width 0.3s"
        />
      </Box>
      <HStack fontSize="xs" color="#B0B0B0" justify="space-between" mt={2}>
        <Text>Gastado: {formatCurrency(spent, budget.currency)}</Text>
        <Text>Restante: {formatCurrency(Math.max(remaining, 0), budget.currency)}</Text>
      </HStack>
    </Box>
  )
}
