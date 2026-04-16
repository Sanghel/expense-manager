'use client'

import { VStack, Heading, Button, HStack } from '@chakra-ui/react'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { SavingsGoalForm } from '@/components/savings/SavingsGoalForm'
import { SavingsGoalsGrid } from '@/components/savings/SavingsGoalsGrid'

export default function SavingsGoalsPage() {
  const { data: session } = useSession()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [refresh, setRefresh] = useState(0)

  if (!session?.user?.id) return null

  return (
    <VStack alignItems="flex-start" gap={6}>
      <HStack justifyContent="space-between" width="100%">
        <Heading size="lg">Metas de Ahorro</Heading>
        <Button onClick={() => setIsFormOpen(true)}>+ Nueva Meta</Button>
      </HStack>

      <SavingsGoalForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        userId={session.user.id}
        onSuccess={() => {
          setRefresh(prev => prev + 1)
          setIsFormOpen(false)
        }}
      />

      <SavingsGoalsGrid userId={session.user.id} refresh={refresh} />
    </VStack>
  )
}
