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
import { useRouter } from 'next/navigation'
import { addFundsToGoal, deleteSavingsGoal } from '@/lib/actions/savings.actions'
import { toaster } from '@/lib/toaster'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import type { SavingsGoal } from '@/types/database.types'

interface Props {
  goal: SavingsGoal
  userId: string
  onEdit: (goal: SavingsGoal) => void
}

export function SavingsGoalCard({ goal, userId, onEdit }: Props) {
  const router = useRouter()
  const [isAddFundsOpen, setIsAddFundsOpen] = useState(false)
  const [fundsAmount, setFundsAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const progress = (goal.current_amount / goal.target_amount) * 100

  const handleAddFunds = async () => {
    if (!fundsAmount) {
      toaster.create({ title: 'Por favor ingresa un monto', type: 'error', duration: 3000 })
      return
    }

    setLoading(true)
    const result = await addFundsToGoal(goal.id, userId, {
      amount: parseFloat(fundsAmount),
    })

    setLoading(false)

    if (result.success) {
      toaster.create({ title: 'Fondos añadidos', type: 'success', duration: 3000 })
      setFundsAmount('')
      setIsAddFundsOpen(false)
      router.refresh()
    } else {
      toaster.create({ title: result.error || 'Error', type: 'error', duration: 3000 })
    }
  }

  const handleDelete = () => {
    setShowDeleteConfirm(true)
  }

  const confirmDelete = async () => {
    setDeleteLoading(true)
    const result = await deleteSavingsGoal(goal.id, userId)
    setDeleteLoading(false)
    setShowDeleteConfirm(false)
    if (result.success) {
      toaster.create({ title: 'Meta eliminada', type: 'success', duration: 3000 })
      router.refresh()
    } else {
      toaster.create({ title: result.error || 'Error', type: 'error', duration: 3000 })
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
              {goal.is_completed ? 'Completada' : 'En Progreso'}
            </Badge>
          </HStack>

          <VStack alignItems="flex-start" width="100%" gap="1">
            <HStack width="100%" justifyContent="space-between">
              <Text fontSize="sm" color="fg.muted">
                Progreso
              </Text>
              <Text fontSize="sm">
                {goal.current_amount.toLocaleString()} / {goal.target_amount.toLocaleString()} {goal.currency}
              </Text>
            </HStack>
            <Box width="100%" height="2" bg="gray.200" borderRadius="md" overflow="hidden">
              <Box height="100%" bg="#4F46E5" width={`${progress}%`} transition="width 0.3s" />
            </Box>
            <Text fontSize="xs" color="fg.muted">
              {progress.toFixed(1)}%
            </Text>
          </VStack>

          {goal.deadline && (
            <Text fontSize="sm" color="fg.muted">
              Fecha Límite: {new Date(goal.deadline).toLocaleDateString('es-ES')}
            </Text>
          )}

          <HStack width="100%" gap="2">
            <Button size="sm" bg="#4F46E5" color="white" _hover={{ bg: '#4338CA' }} onClick={() => setIsAddFundsOpen(true)} disabled={goal.is_completed}>
              Añadir Fondos
            </Button>
            <MenuRoot>
              <MenuTrigger asChild>
                <IconButton aria-label="Opciones" variant="ghost" size="sm" />
              </MenuTrigger>
              <MenuContent>
                <MenuItem value="edit" onClick={() => onEdit(goal)}>
                  Editar
                </MenuItem>
                <MenuItem value="delete" onClick={handleDelete}>
                  Eliminar
                </MenuItem>
              </MenuContent>
            </MenuRoot>
          </HStack>
        </VStack>
      </Box>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDelete}
        title="Eliminar meta"
        description="¿Estás seguro? Esta acción no se puede deshacer."
        isLoading={deleteLoading}
      />

      <DialogRoot open={isAddFundsOpen} onOpenChange={details => setIsAddFundsOpen(details.open)} size="md" placement="center" lazyMount unmountOnExit>
        <DialogBackdrop />
        <DialogPositioner>
          <DialogContent tabIndex={-1}>
            <DialogHeader>
              <DialogTitle>Añadir Fondos</DialogTitle>
              <DialogCloseTrigger />
            </DialogHeader>
            <DialogBody pb={6}>
              <VStack gap="4">
                <Input
                  type="number"
                  placeholder="Monto"
                  value={fundsAmount}
                  onChange={e => setFundsAmount(e.target.value)}
                  step="0.01"
                />
                <Button type="submit" bg="#4F46E5" color="white" _hover={{ bg: '#4338CA' }} width="full" onClick={handleAddFunds} loading={loading}>
                  Añadir
                </Button>
              </VStack>
            </DialogBody>
          </DialogContent>
        </DialogPositioner>
      </DialogRoot>
    </>
  )
}
