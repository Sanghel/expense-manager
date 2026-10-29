'use client'

import { Button, Flex, Text, VStack } from '@chakra-ui/react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LuPlus } from 'react-icons/lu'
import { SavingsGoalForm } from '@/components/savings/SavingsGoalForm'
import { SavingsGoalCard } from '@/components/savings/SavingsGoalCard'
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

  const openCreate = () => setIsFormOpen(true)

  return (
    <VStack align="stretch" gap={4}>
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

      {initialGoals.length > 1 && (
        <SavingsSummaryStrip
          goals={initialGoals}
          preferredCurrency={preferredCurrency}
          exchangeRates={exchangeRates}
        />
      )}

      {initialGoals.length === 0 ? (
        <Flex direction="column" align="center" gap={3} bg="surface" borderRadius="hero" py={14} px={6} textAlign="center">
          <Text fontSize="15px" color="text2">
            Aún no tienes metas de ahorro.
          </Text>
          <Button bg="brandSolid" color="white" _hover={{ bg: 'brand.600' }} onClick={openCreate}>
            <LuPlus />
            Nueva meta
          </Button>
        </Flex>
      ) : (
        initialGoals.map((goal, i) => (
          <SavingsGoalCard
            key={goal.id}
            goal={goal}
            userId={userId}
            accounts={accounts}
            onEdit={setEditingGoal}
            onCreate={i === 0 ? openCreate : undefined}
          />
        ))
      )}
    </VStack>
  )
}
