'use client'

import { Grid, Text } from '@chakra-ui/react'
import { SavingsGoalCard } from './SavingsGoalCard'
import type { Account, SavingsGoal } from '@/types/database.types'

interface Props {
  userId: string
  goals: SavingsGoal[]
  accounts: Account[]
  onEdit: (goal: SavingsGoal) => void
}

export function SavingsGoalsGrid({ userId, goals, accounts, onEdit }: Props) {
  if (goals.length === 0) {
    return <Text color="fg.muted">Sin metas de ahorro. ¡Crea una para comenzar!</Text>
  }

  return (
    <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }} gap="4">
      {goals.map(goal => (
        <SavingsGoalCard key={goal.id} goal={goal} userId={userId} accounts={accounts} onEdit={onEdit} />
      ))}
    </Grid>
  )
}
