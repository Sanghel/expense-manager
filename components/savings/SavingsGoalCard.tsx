'use client'

import { Box, VStack, HStack, Text, Button, Badge, IconButton } from '@chakra-ui/react'
import { FiEdit2, FiTrash2, FiCheckCircle, FiRotateCcw, FiChevronDown, FiChevronUp } from 'react-icons/fi'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteSavingsGoal, setGoalCompleted } from '@/lib/actions/savings.actions'
import { toaster } from '@/lib/toaster'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { AddFundsForm } from '@/components/savings/AddFundsForm'
import { ContributionHistory } from '@/components/savings/ContributionHistory'
import { formatCurrency } from '@/lib/utils/currency'
import { toNumber, safeRatio } from '@/lib/utils/numbers'
import { getSavingsPace, type PaceStatus } from '@/lib/utils/savings-pace'
import type { Account, SavingsGoal } from '@/types/database.types'

interface Props {
  goal: SavingsGoal
  userId: string
  accounts: Account[]
  onEdit: (goal: SavingsGoal) => void
}

function getStatusBadge(goal: SavingsGoal, current: number, target: number) {
  if (goal.is_completed) return { label: 'Completada', colorPalette: 'green' }
  if (current > target) return { label: 'Superada', colorPalette: 'purple' }
  if (current === 0) return { label: 'Sin iniciar', colorPalette: 'gray' }
  return { label: 'En Progreso', colorPalette: 'blue' }
}

const PACE_LABEL: Record<PaceStatus, { label: string; color: string }> = {
  'on-track': { label: 'Al día', color: '#10B981' },
  behind: { label: 'Atrasada', color: '#F97316' },
  overdue: { label: 'Vencida', color: '#F43F5E' },
  done: { label: 'Objetivo alcanzado', color: '#10B981' },
}

export function SavingsGoalCard({ goal, userId, accounts, onEdit }: Props) {
  const router = useRouter()
  const [isAddFundsOpen, setIsAddFundsOpen] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [statusLoading, setStatusLoading] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  const current = toNumber(goal.current_amount)
  const target = toNumber(goal.target_amount)
  const progress = safeRatio(current, target) * 100
  const status = getStatusBadge(goal, current, target)
  const pace = getSavingsPace(goal)

  const confirmDelete = async () => {
    setDeleteLoading(true)
    const result = await deleteSavingsGoal(goal.id, userId)
    setDeleteLoading(false)
    setShowDeleteConfirm(false)
    if (result.success) {
      toaster.create({ title: 'Meta eliminada', type: 'success', duration: 3000 })
      router.refresh()
    } else {
      toaster.create({ title: result.error || 'Error', type: 'error', duration: 4000 })
    }
  }

  const toggleCompleted = async () => {
    setStatusLoading(true)
    const result = await setGoalCompleted(goal.id, userId, !goal.is_completed)
    setStatusLoading(false)
    if (result.success) {
      toaster.create({
        title: goal.is_completed ? 'Meta reabierta' : 'Meta completada',
        type: 'success',
        duration: 3000,
      })
      router.refresh()
    } else {
      toaster.create({ title: result.error || 'Error', type: 'error', duration: 4000 })
    }
  }

  return (
    <>
      <Box borderWidth="1px" borderRadius="xl" p="4" bg="#1a1a23" borderColor="#2d2d35">
        <VStack alignItems="flex-start" gap="3">
          <HStack width="100%" justifyContent="space-between" gap={2}>
            <Text fontWeight="bold" fontSize="lg" color="white" lineClamp={1}>
              {goal.name}
            </Text>
            <Badge colorPalette={status.colorPalette} variant="solid" flexShrink={0}>
              {status.label}
            </Badge>
          </HStack>

          <VStack alignItems="flex-start" width="100%" gap="1">
            <HStack width="100%" justifyContent="space-between">
              <Text fontSize="sm" color="#B0B0B0">Progreso</Text>
              <Text fontSize="sm" color="white">
                {formatCurrency(current, goal.currency)} / {formatCurrency(target, goal.currency)}
              </Text>
            </HStack>
            <Box width="100%" height="2" bg="#2d2d35" borderRadius="md" overflow="hidden">
              <Box
                height="100%"
                bg={current > target ? '#10B981' : '#4F46E5'}
                width={`${Math.min(progress, 100)}%`}
                transition="width 0.3s"
              />
            </Box>
            <Text fontSize="xs" color="#B0B0B0">{progress.toFixed(1)}%</Text>
          </VStack>

          {goal.deadline && (
            <Text fontSize="sm" color="#B0B0B0">
              Fecha Límite: {new Date(goal.deadline).toLocaleDateString('es-ES')}
            </Text>
          )}

          {pace && pace.status !== 'done' && (
            <HStack gap={2} flexWrap="wrap">
              <Text fontSize="xs" color="#B0B0B0">
                Faltan {formatCurrency(pace.remaining, goal.currency)}
                {pace.monthsLeft > 0 && (
                  <>
                    {' '}· {pace.monthsLeft} {pace.monthsLeft === 1 ? 'mes' : 'meses'} →{' '}
                    {formatCurrency(pace.requiredMonthly, goal.currency)}/mes
                  </>
                )}
              </Text>
              <Badge size="sm" variant="outline" color={PACE_LABEL[pace.status].color}>
                {PACE_LABEL[pace.status].label}
              </Badge>
            </HStack>
          )}

          <HStack width="100%" justifyContent="space-between">
            <Button
              size="sm"
              bg="#4F46E5"
              color="white"
              _hover={{ bg: '#4338CA' }}
              onClick={() => setIsAddFundsOpen(true)}
              disabled={goal.is_completed}
            >
              + Añadir Fondos
            </Button>
            <HStack gap={1}>
              <IconButton
                aria-label={goal.is_completed ? 'Reabrir meta' : 'Marcar como completada'}
                title={goal.is_completed ? 'Reabrir meta' : 'Marcar como completada'}
                size="sm"
                variant="ghost"
                loading={statusLoading}
                onClick={toggleCompleted}
              >
                {goal.is_completed ? <FiRotateCcw /> : <FiCheckCircle />}
              </IconButton>
              <IconButton
                aria-label="Editar"
                size="sm"
                variant="ghost"
                onClick={() => onEdit(goal)}
              >
                <FiEdit2 />
              </IconButton>
              <IconButton
                aria-label="Eliminar"
                size="sm"
                variant="ghost"
                colorPalette="red"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <FiTrash2 />
              </IconButton>
            </HStack>
          </HStack>

          <Box w="full" borderTopWidth="1px" borderColor="#2d2d35" pt={2}>
            <Button
              size="xs"
              variant="ghost"
              color="#B0B0B0"
              onClick={() => setShowHistory((v) => !v)}
              w="full"
              justifyContent="space-between"
            >
              Aportes
              {showHistory ? <FiChevronUp /> : <FiChevronDown />}
            </Button>
            {showHistory && (
              <ContributionHistory
                userId={userId}
                goalId={goal.id}
                goalCurrency={goal.currency}
                onChange={() => router.refresh()}
              />
            )}
          </Box>
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

      <AddFundsForm
        isOpen={isAddFundsOpen}
        onClose={() => setIsAddFundsOpen(false)}
        goal={goal}
        userId={userId}
        accounts={accounts}
        onSuccess={() => router.refresh()}
      />
    </>
  )
}
