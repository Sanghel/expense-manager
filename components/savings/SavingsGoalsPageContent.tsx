'use client'

import { VStack, Heading, Button, HStack } from '@chakra-ui/react'
import { useState } from 'react'
import { FiPlus } from 'react-icons/fi'
import { SavingsGoalForm } from '@/components/savings/SavingsGoalForm'
import { SavingsGoalsGrid } from '@/components/savings/SavingsGoalsGrid'

interface Props {
  userId: string
}

export function SavingsGoalsPageContent({ userId }: Props) {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [refresh, setRefresh] = useState(0)

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
          setRefresh(prev => prev + 1)
          setIsFormOpen(false)
        }}
      />

      <SavingsGoalsGrid userId={userId} refresh={refresh} />
    </VStack>
  )
}
