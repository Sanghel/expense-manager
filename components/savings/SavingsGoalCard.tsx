'use client'

import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Badge,
  Input,
  IconButton,
  MenuRoot,
  MenuContent,
  MenuItem,
  MenuTrigger,
  DialogRoot,
  DialogBackdrop,
  DialogPositioner,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogCloseTrigger,
} from '@chakra-ui/react'
import { useState } from 'react'
import { addFundsToGoal, deleteSavingsGoal } from '@/lib/actions/savings.actions'
import { toaster } from '@/lib/toaster'
import type { SavingsGoal } from '@/types/database.types'

interface Props {
  goal: SavingsGoal
  userId: string
  onRefresh: () => void
}

export function SavingsGoalCard({ goal, userId, onRefresh }: Props) {
  const [isAddFundsOpen, setIsAddFundsOpen] = useState(false)
  const [fundsAmount, setFundsAmount] = useState('')
  const [loading, setLoading] = useState(false)

  const progress = (goal.current_amount / goal.target_amount) * 100

  const handleAddFunds = async () => {
    if (!fundsAmount) {
      toaster.error({ title: 'Please enter amount' })
      return
    }

    setLoading(true)
    const result = await addFundsToGoal(goal.id, userId, {
      amount: parseFloat(fundsAmount),
    })

    setLoading(false)

    if (result.success) {
      toaster.success({ title: 'Funds added' })
      setFundsAmount('')
      setIsAddFundsOpen(false)
      onRefresh()
    } else {
      toaster.error({ title: result.error || 'Error' })
    }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this goal?')) return
    const result = await deleteSavingsGoal(goal.id, userId)
    if (result.success) {
      toaster.success({ title: 'Deleted' })
      onRefresh()
    } else {
      toaster.error({ title: result.error || 'Error' })
    }
  }

  return (
    <>
      <Box borderWidth="1px" borderRadius="md" p="4" bg="bg.muted">
        <VStack alignItems="flex-start" gap="3">
          <HStack width="100%" justifyContent="space-between">
            <Text fontWeight="bold" fontSize="lg">
              {goal.name}
            </Text>
            <Badge variant={goal.is_completed ? 'solid' : 'outline'}>
              {goal.is_completed ? 'Completed' : 'In Progress'}
            </Badge>
          </HStack>

          <VStack alignItems="flex-start" width="100%" gap="1">
            <HStack width="100%" justifyContent="space-between">
              <Text fontSize="sm" color="fg.muted">
                Progress
              </Text>
              <Text fontSize="sm">
                {goal.current_amount.toLocaleString()} / {goal.target_amount.toLocaleString()} {goal.currency}
              </Text>
            </HStack>
            <Box width="100%" height="2" bg="gray.200" borderRadius="md" overflow="hidden">
              <Box height="100%" bg="blue.500" width={`${progress}%`} transition="width 0.3s" />
            </Box>
            <Text fontSize="xs" color="fg.muted">
              {progress.toFixed(1)}%
            </Text>
          </VStack>

          {goal.deadline && (
            <Text fontSize="sm" color="fg.muted">
              Deadline: {new Date(goal.deadline).toLocaleDateString()}
            </Text>
          )}

          <HStack width="100%" gap="2">
            <Button size="sm" onClick={() => setIsAddFundsOpen(true)} disabled={goal.is_completed}>
              Add Funds
            </Button>
            <MenuRoot>
              <MenuTrigger asChild>
                <IconButton aria-label="Options" variant="ghost" size="sm" />
              </MenuTrigger>
              <MenuContent>
                <MenuItem value="delete" onClick={handleDelete}>
                  Delete
                </MenuItem>
              </MenuContent>
            </MenuRoot>
          </HStack>
        </VStack>
      </Box>

      <DialogRoot open={isAddFundsOpen} onOpenChange={details => setIsAddFundsOpen(details.open)}>
        <DialogBackdrop />
        <DialogPositioner>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Funds</DialogTitle>
              <DialogCloseTrigger />
            </DialogHeader>
            <DialogBody>
              <VStack gap="4">
                <Input
                  type="number"
                  placeholder="Amount"
                  value={fundsAmount}
                  onChange={e => setFundsAmount(e.target.value)}
                  step="0.01"
                />
                <Button width="100%" onClick={handleAddFunds} loading={loading}>
                  Add
                </Button>
              </VStack>
            </DialogBody>
          </DialogContent>
        </DialogPositioner>
      </DialogRoot>
    </>
  )
}
