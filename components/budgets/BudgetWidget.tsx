'use client'

import { VStack, HStack, Heading, Text, Button, Box, Link } from '@chakra-ui/react'
import { BudgetProgress } from './BudgetProgress'
import { formatCurrency } from '@/lib/utils/currency'
import { safeRatio } from '@/lib/utils/numbers'
import type { BudgetWithSpent } from '@/types/database.types'

interface Props {
  budgets: BudgetWithSpent[]
}

export function BudgetWidget({ budgets }: Props) {
  const topBudgets = [...budgets]
    .sort((a, b) => safeRatio(b.spent, b.limit_amount) - safeRatio(a.spent, a.limit_amount))
    .slice(0, 3)

  return (
    <Box borderWidth="1px" borderRadius="lg" p={6} bg="#0F0F0F">
      <VStack gap={4} align="stretch">
        <HStack justify="space-between">
          <Heading size="md">Presupuestos del Mes</Heading>
          <Link href="/planificacion?tab=presupuestos" _hover={{ textDecoration: 'none' }}>
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
                  <Heading size="sm">
                    {budget.scope === 'total'
                      ? 'Todos los gastos'
                      : budget.scope === 'group'
                        ? (budget.group?.name ?? 'Grupo')
                        : (budget.category?.name ?? 'Sin categoría')}
                  </Heading>
                  <Text fontSize="sm" fontWeight="medium">
                    {formatCurrency(budget.limit_amount, budget.currency)}
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
