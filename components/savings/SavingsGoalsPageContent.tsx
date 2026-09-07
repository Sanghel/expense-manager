'use client'

import { VStack, Heading, Button, HStack, Icon } from '@chakra-ui/react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FiPlus, FiTarget } from 'react-icons/fi'
import { SavingsGoalForm } from '@/components/savings/SavingsGoalForm'
import { SavingsGoalsGrid } from '@/components/savings/SavingsGoalsGrid'
import { SavingsSummaryStrip } from '@/components/savings/SavingsSummaryStrip'
import type { Account, Currency, ExchangeRate, SavingsGoal } from '@/types/database.types'

interface Props {
  userId: string
  initialGoals: SavingsGoal[]
  accounts?: Account[]
  preferredCurrency: Currency
  exchangeRates: ExchangeRate[]
}

export function SavingsGoalsPageContent({
  userId,
  initialGoals,
  accounts = [],
  preferredCurrency,
  exchangeRates,
}: Props) {
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
        <HStack gap={2}>
          <Icon as={FiTarget} color="#6366f1" boxSize={6} />
          <Heading size={{ base: 'md', md: 'lg' }}>Metas de Ahorro</Heading>
        </HStack>
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

      <SavingsSummaryStrip
        goals={initialGoals}
        preferredCurrency={preferredCurrency}
        exchangeRates={exchangeRates}
      />

      <SavingsGoalsGrid userId={userId} goals={initialGoals} accounts={accounts} onEdit={setEditingGoal} />
    </VStack>
  )
}
