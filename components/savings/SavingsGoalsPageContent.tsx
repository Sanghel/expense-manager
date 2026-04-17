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
  const router = useRouter()

  return (
    <VStack alignItems="flex-start" gap={6}>
      <HStack justifyContent="space-between" width="100%">
        <Heading size="lg">Metas de Ahorro</Heading>
        <Button bg="#4F46E5" color="white" _hover={{ bg: '#4338CA' }} onClick={() => setIsFormOpen(true)}>
          <FiPlus />
          Nueva Meta
        </Button>
      </HStack>

      <SavingsGoalForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        userId={userId}
        onSuccess={() => {
          router.refresh()
          setIsFormOpen(false)
        }}
      />

      <SavingsGoalsGrid userId={userId} goals={initialGoals} />
    </VStack>
  )
}
