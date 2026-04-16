'use client'

import { VStack, Heading, Button, HStack, SimpleGrid, Box, Text, Divider } from '@chakra-ui/react'
import { useState, useCallback } from 'react'
import { BudgetForm } from '@/components/budgets/BudgetForm'
import { BudgetList } from '@/components/budgets/BudgetList'
import { getBudgets } from '@/lib/actions/budgets.actions'
import type { Category, Budget } from '@/types/database.types'

interface BudgetWithSpent extends Budget {
  spent: number
  category: { name: string; type: string }
}

interface Props {
  userId: string
  categories: Category[]
}

export function BudgetsPageClient({ userId, categories }: Props) {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [budgets, setBudgets] = useState<BudgetWithSpent[]>([])

  const handleFormSuccess = useCallback(() => {
    setRefreshKey((k) => k + 1)
  }, [])

  const handleLoadBudgets = useCallback(async () => {
    const result = await getBudgets(userId)
    if (result.success && result.data) {
      const budgetsData = (result.data as any[]).map((budget) => ({
        ...budget,
        spent: budget.spent || 0,
      }))
      setBudgets(budgetsData)
    }
  }, [userId])

  const totalBudgets = budgets.length
  const totalExceeded = budgets.filter((b) => b.spent > b.amount).length
  const totalAmount = budgets.reduce((sum, b) => sum + b.amount, 0)
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0)

  return (
    <VStack gap={6} align="stretch">
      <HStack justify="space-between">
        <Heading size="lg">Presupuestos</Heading>
        <Button
          bg="#4F46E5"
          color="white"
          _hover={{ bg: '#4338CA' }}
          onClick={() => setIsFormOpen(true)}
        >
          Nuevo Presupuesto
        </Button>
      </HStack>

      <Divider />

      {/* Resumen */}
      <SimpleGrid columns={[1, 2, 4]} gap={4}>
        <Box borderWidth="1px" borderRadius="lg" p={4} bg="#1A1A1A">
          <Text fontSize="xs" color="#B0B0B0" mb={2}>Total de Presupuestos</Text>
          <Heading size="md">{totalBudgets}</Heading>
        </Box>
        <Box borderWidth="1px" borderRadius="lg" p={4} bg="#1A1A1A">
          <Text fontSize="xs" color="#B0B0B0" mb={2}>Excedidos</Text>
          <Heading size="md" color={totalExceeded > 0 ? '#EF4444' : 'white'}>{totalExceeded}</Heading>
        </Box>
        <Box borderWidth="1px" borderRadius="lg" p={4} bg="#1A1A1A">
          <Text fontSize="xs" color="#B0B0B0" mb={2}>Presupuesto Total</Text>
          <Heading size="md">{totalAmount.toLocaleString('es-CO', { maximumFractionDigits: 0 })}</Heading>
        </Box>
        <Box borderWidth="1px" borderRadius="lg" p={4} bg="#1A1A1A">
          <Text fontSize="xs" color="#B0B0B0" mb={2}>Gastado Total</Text>
          <Heading size="md">{totalSpent.toLocaleString('es-CO', { maximumFractionDigits: 0 })}</Heading>
        </Box>
      </SimpleGrid>

      <Divider />

      {/* Lista de presupuestos */}
      <BudgetList key={refreshKey} userId={userId} onRefresh={handleFormSuccess} onEdit={() => {}} />

      {/* Formulario */}
      <BudgetForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        userId={userId}
        categories={categories}
        onSuccess={handleFormSuccess}
      />
    </VStack>
  )
}
