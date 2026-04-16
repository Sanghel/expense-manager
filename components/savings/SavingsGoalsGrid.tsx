'use client'

import { Grid, Text } from '@chakra-ui/react'
import { useCallback, useEffect, useState } from 'react'
import { getSavingsGoals } from '@/lib/actions/savings.actions'
import { toaster } from '@/lib/toaster'
import { SavingsGoalCard } from './SavingsGoalCard'
import type { SavingsGoal } from '@/types/database.types'

interface Props {
  userId: string
  refresh: number
}

export function SavingsGoalsGrid({ userId, refresh }: Props) {
  const [goals, setGoals] = useState<SavingsGoal[]>([])
  const [loading, setLoading] = useState(true)

  const loadGoals = useCallback(async () => {
    setLoading(true)
    const result = await getSavingsGoals(userId)
    if (result.success) {
      setGoals(result.data || [])
    } else {
      toaster.error({ title: result.error || 'Error' })
    }
    setLoading(false)
  }, [userId])

  useEffect(() => {
    loadGoals()
  }, [loadGoals, refresh])

  if (loading) return <Text>Loading...</Text>

  if (goals.length === 0) {
    return <Text color="fg.muted">No savings goals yet. Create one to get started!</Text>
  }

  return (
    <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }} gap="4">
      {goals.map(goal => (
        <SavingsGoalCard key={goal.id} goal={goal} userId={userId} onRefresh={loadGoals} />
      ))}
    </Grid>
  )
}
