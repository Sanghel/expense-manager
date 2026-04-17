'use client'

import { VStack, HStack, Heading, Text, Button, Box, Link } from '@chakra-ui/react'
import { BudgetProgress } from './BudgetProgress'
import type { Budget } from '@/types/database.types'

interface BudgetWithSpent extends Budget {
  spent: number
  category: { name: string }
}

interface Props {
  budgets: any[]
}

export function BudgetWidget({ budgets }: Props) {
  const topBudgets: BudgetWithSpent[] = (budgets as any[])
    .map((b) => ({ ...b, spent: b.spent || 0 }))
    .sort((a, b) => {
      const aPercent = (a.spent / a.amount) * 100
      const bPercent = (b.spent / b.amount) * 100
      return bPercent - aPercent
    })
    .slice(0, 3)

  return (
    <Box borderWidth="1px" borderRadius="lg" p={6} bg="#0F0F0F">
      <VStack gap={4} align="stretch">
        <HStack justify="space-between">
          <Heading size="md">Presupuestos del Mes</Heading>
          <Link href="/dashboard/budgets" _hover={{ textDecoration: 'none' }}>
            <Button size="sm" variant="ghost">
              Ver todos →
            </Button>
          </Link>
        </HStack>

        {topBudgets.length === 0 ? (
          <Text color="#B0B0B0" fontSize="sm">
            No hay presupuestos. Crea uno para empezar.
          </Text>
        ) : (
          <VStack gap={4} align="stretch">
            {topBudgets.map((budget, idx) => (
              <VStack key={budget.id} gap={2} align="stretch" borderBottomWidth={idx < topBudgets.length - 1 ? "1px" : "0"} pb={idx < topBudgets.length - 1 ? "4" : "0"}>
                <HStack justify="space-between">
                  <Heading size="sm">{budget.category?.name || 'Unknown'}</Heading>
                  <Text fontSize="sm" fontWeight="medium">
                    {budget.amount.toLocaleString('es-CO', { maximumFractionDigits: 0 })} {budget.currency}
                  </Text>
                </HStack>
                <BudgetProgress budget={budget} />
              </VStack>
            ))}
          </VStack>
        )}
      </VStack>
    </Box>
  )
}
