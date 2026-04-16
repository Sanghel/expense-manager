'use client'

import { VStack, HStack, Heading, Text, Button, Box, Link } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { getBudgets } from '@/lib/actions/budgets.actions'
import { BudgetProgress } from './BudgetProgress'
import type { Budget } from '@/types/database.types'

interface BudgetWithSpent extends Budget {
  spent: number
  category: { name: string }
}

interface Props {
  userId: string
}

export function BudgetWidget({ userId }: Props) {
  const [budgets, setBudgets] = useState<BudgetWithSpent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBudgets()
  }, [])

  const loadBudgets = async () => {
    setLoading(true)
    const result = await getBudgets(userId)
    if (result.success && result.data) {
      const budgetsData = (result.data as any[])
        .map((b) => ({ ...b, spent: b.spent || 0 }))
        .sort((a, b) => {
          const aPercent = (a.spent / a.amount) * 100
          const bPercent = (b.spent / b.amount) * 100
          return bPercent - aPercent
        })
        .slice(0, 3)
      setBudgets(budgetsData)
    }
    setLoading(false)
  }

  if (loading) {
    return <Text color="#B0B0B0" fontSize="sm">Cargando presupuestos...</Text>
  }

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

        {budgets.length === 0 ? (
          <Text color="#B0B0B0" fontSize="sm">
            No hay presupuestos. Crea uno para empezar.
          </Text>
        ) : (
          <VStack gap={4} align="stretch">
            {budgets.map((budget, idx) => (
              <VStack key={budget.id} gap={2} align="stretch" borderBottomWidth={idx < budgets.length - 1 ? "1px" : "0"} pb={idx < budgets.length - 1 ? "4" : "0"}>
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
