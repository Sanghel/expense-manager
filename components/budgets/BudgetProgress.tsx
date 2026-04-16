'use client'

import { HStack, Text, Progress, Badge } from '@chakra-ui/react'
import type { Budget } from '@/types/database.types'

interface Props {
  budget: Budget & { spent: number }
}

export function BudgetProgress({ budget }: Props) {
  const percentage = (budget.spent / budget.amount) * 100
  const remaining = budget.amount - budget.spent

  let colorScheme: 'red' | 'yellow' | 'green' = 'green'
  if (percentage > 100) colorScheme = 'red'
  else if (percentage > 80) colorScheme = 'yellow'

  return (
    <div className="space-y-2">
      <HStack justify="space-between">
        <Text fontSize="sm" fontWeight="medium">
          {percentage.toFixed(1)}%
        </Text>
        {percentage > 100 && <Badge colorScheme="red">Excedido</Badge>}
      </HStack>
      <Progress
        value={Math.min(percentage, 100)}
        colorScheme={colorScheme}
        size="sm"
        borderRadius="md"
      />
      <HStack fontSize="xs" color="#B0B0B0" justify="space-between">
        <Text>Gastado: {budget.spent.toLocaleString('es-CO', { maximumFractionDigits: 2 })} {budget.currency}</Text>
        <Text>Restante: {Math.max(remaining, 0).toLocaleString('es-CO', { maximumFractionDigits: 2 })} {budget.currency}</Text>
      </HStack>
    </div>
  )
}
