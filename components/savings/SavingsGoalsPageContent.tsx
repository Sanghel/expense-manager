'use client'

import { VStack, Heading, Button, HStack } from '@chakra-ui/react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FiPlus } from 'react-icons/fi'
import { SavingsGoalForm } from '@/components/savings/SavingsGoalForm'
import { SavingsGoalsGrid } from '@/components/savings/SavingsGoalsGrid'
import type { SavingsGoal } from '@/types/database.types'

interface Props {
  userId: string
  initialGoals: SavingsGoal[]
}

export function SavingsGoalsPageContent({ userId, initialGoals }: Props) {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null)
  const router = useRouter()

  const handleClose = () => {
    setIsFormOpen(false)
    setEditingGoal(null)
  }

  return (
    <VStack alignItems="flex-start" gap={{ base: 4, md: 6 }}>
      <HStack justifyContent="space-between" width="100%">
        <Heading size={{ base: 'md', md: 'lg' }}>Metas de Ahorro</Heading>
        <Button bg="#4F46E5" color="white" _hover={{ bg: '#4338CA' }} onClick={() => setIsFormOpen(true)} size={{ base: 'sm', md: 'md' }}>
          <FiPlus />
          Nueva Meta
        </Button>
      </HStack>

      <SavingsGoalForm
        isOpen={isFormOpen || !!editingGoal}
        onClose={handleClose}
        userId={userId}
        initialData={editingGoal ?? undefined}
        goalId={editingGoal?.id}
        onSuccess={() => {
          router.refresh()
          handleClose()
        }}
      />

      <SavingsGoalsGrid userId={userId} goals={initialGoals} onEdit={setEditingGoal} />
    </VStack>
  )
}
