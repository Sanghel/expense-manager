'use client'

import { VStack, Heading, Button, HStack, Box } from '@chakra-ui/react'
import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { BudgetForm } from '@/components/budgets/BudgetForm'
import { BudgetList } from '@/components/budgets/BudgetList'
import type { Category } from '@/types/database.types'

interface Budget {
  id: string
  category_id: string
  amount: number
  currency: 'COP' | 'USD' | 'VES'
  period: 'monthly' | 'yearly'
  start_date: string
}

interface Props {
  userId: string
  categories: Category[]
  initialBudgets: any[]
}

export function BudgetsPageClient({ userId, categories, initialBudgets }: Props) {
  const router = useRouter()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null)

  const handleFormSuccess = useCallback(() => {
    router.refresh()
    setEditingBudget(null)
  }, [router])

  const handleEdit = (budget: any) => {
    setEditingBudget(budget)
    setIsFormOpen(true)
  }

  const handleClose = () => {
    setIsFormOpen(false)
    setEditingBudget(null)
  }

  return (
    <VStack gap={6} align="stretch">
      <HStack justify="space-between">
        <Heading size="lg">Presupuestos</Heading>
        <Button
          bg="#4F46E5"
          color="white"
          _hover={{ bg: '#4338CA' }}
          onClick={() => {
            setEditingBudget(null)
            setIsFormOpen(true)
          }}
        >
          Nuevo Presupuesto
        </Button>
      </HStack>

      <Box borderBottomWidth="1px" />

      <BudgetList initialBudgets={initialBudgets} userId={userId} onEdit={handleEdit} />

      <BudgetForm
        isOpen={isFormOpen}
        onClose={handleClose}
        userId={userId}
        categories={categories}
        onSuccess={handleFormSuccess}
        editingBudget={editingBudget}
      />
    </VStack>
  )
}
