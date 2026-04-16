'use client'

import { HStack, Text, Box, Badge } from '@chakra-ui/react'
import type { Budget } from '@/types/database.types'

interface Props {
  budget: Budget & { spent: number }
}

export function BudgetProgress({ budget }: Props) {
  const percentage = (budget.spent / budget.amount) * 100
  const remaining = budget.amount - budget.spent

  let bgColor = '#16A34A'
  if (percentage > 100) bgColor = '#DC2626'
  else if (percentage > 80) bgColor = '#EAB308'

  return (
    <div className="space-y-2">
      <HStack justify="space-between">
        <Text fontSize="sm" fontWeight="medium">
          {percentage.toFixed(1)}%
        </Text>
        {percentage > 100 && <Badge colorScheme="red">Excedido</Badge>}
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
      <HStack fontSize="xs" color="#B0B0B0" justify="space-between">
        <Text>Gastado: {budget.spent.toLocaleString('es-CO', { maximumFractionDigits: 2 })} {budget.currency}</Text>
        <Text>Restante: {Math.max(remaining, 0).toLocaleString('es-CO', { maximumFractionDigits: 2 })} {budget.currency}</Text>
      </HStack>
    </div>
  )
}
