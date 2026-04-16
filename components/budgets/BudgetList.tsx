'use client'

import { VStack, HStack, Box, Text, Button, Heading } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { getBudgets, deleteBudget } from '@/lib/actions/budgets.actions'
import { toaster } from '@/lib/toaster'
import { BudgetProgress } from './BudgetProgress'
import type { Budget } from '@/types/database.types'

interface BudgetWithSpent extends Budget {
  spent: number
  category: { name: string; type: string }
}

interface Props {
  userId: string
  onEdit?: (budget: BudgetWithSpent) => void
  onRefresh?: () => void
}

export function BudgetList({ userId, onEdit, onRefresh }: Props) {
  const [budgets, setBudgets] = useState<BudgetWithSpent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBudgets()
  }, [])

  const loadBudgets = async () => {
    setLoading(true)
    const result = await getBudgets(userId)
    if (result.success && result.data) {
      const budgetsData = (result.data as any[]).map((budget) => ({
        ...budget,
        spent: budget.spent || 0,
      }))
      setBudgets(budgetsData)
    }
    setLoading(false)
  }

  const handleDelete = async (budgetId: string) => {
    if (!confirm('¿Estás seguro que quieres eliminar este presupuesto?')) return

    const result = await deleteBudget(budgetId, userId)
    if (result.success) {
      toaster.create({ title: 'Presupuesto eliminado', type: 'success', duration: 3000 })
      await loadBudgets()
      if (onRefresh) onRefresh()
    } else {
      toaster.create({ title: 'Error', description: result.error, type: 'error', duration: 3000 })
    }
  }

  if (loading) {
    return <Text color="#B0B0B0">Cargando presupuestos...</Text>
  }

  if (budgets.length === 0) {
    return <Text color="#B0B0B0">No hay presupuestos creados. Crea uno para empezar.</Text>
  }

  return (
    <VStack gap={4} align="stretch">
      {budgets.map((budget) => (
        <Box
          key={budget.id}
          borderWidth="1px"
          borderRadius="lg"
          p={4}
          bg="#1A1A1A"
          _hover={{ borderColor: '#4F46E5' }}
          transition="all 0.2s"
        >
          <VStack gap={3} align="stretch">
            <HStack justify="space-between">
              <div>
                <Heading size="sm">{budget.category?.name || 'Unknown'}</Heading>
                <Text fontSize="xs" color="#B0B0B0" mt={1}>
                  {budget.period === 'monthly' ? 'Mensual' : 'Anual'} • {budget.start_date}
                </Text>
              </div>
              <Text fontSize="lg" fontWeight="bold">
                {budget.amount.toLocaleString('es-CO', { maximumFractionDigits: 2 })} {budget.currency}
              </Text>
            </HStack>

            <BudgetProgress budget={budget} />

            <HStack gap={2} pt={2}>
              {onEdit && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEdit(budget)}
                >
                  Editar
                </Button>
              )}
              <Button
                size="sm"
                colorScheme="red"
                variant="ghost"
                onClick={() => handleDelete(budget.id)}
              >
                Eliminar
              </Button>
            </HStack>
          </VStack>
        </Box>
      ))}
    </VStack>
  )
}
