'use client'

import { Box, Flex, Grid, Heading, HStack, Text, Button } from '@chakra-ui/react'
import { LuPlus } from 'react-icons/lu'
import { ActionIconButton } from '@/components/ui/ActionIconButton'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteSavingsGoal, setGoalCompleted } from '@/lib/actions/savings.actions'
import { toaster } from '@/lib/toaster'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { AddFundsForm } from '@/components/savings/AddFundsForm'
import { ContributionHistory } from '@/components/savings/ContributionHistory'
import { formatCurrency } from '@/lib/utils/currency'
import { toNumber, safeRatio } from '@/lib/utils/numbers'
import { getExpectedProgress, getSavingsPace } from '@/lib/utils/savings-pace'
import type { Account, SavingsGoal } from '@/types/database.types'

interface Props {
  goal: SavingsGoal
  userId: string
  accounts: Account[]
  onEdit: (goal: SavingsGoal) => void
  /** Shows "Nueva meta" among the actions (first card only). */
  onCreate?: () => void
}

/** COP has no cents in practice; USD/VES keep them. */
const decimalsFor = (currency: string) => (currency === 'COP' ? 0 : 2)

/** Badge next to the deadline: completion, overdue or how far behind it is. */
function statusBadge(
  goal: SavingsGoal,
  pace: ReturnType<typeof getSavingsPace>,
  monthsBehind: number
): { label: string; fg: string; bg: string } | null {
  if (goal.is_completed || pace?.status === 'done') return { label: 'Completada', fg: 'pos', bg: 'posSoft' }
  if (!pace) return null
  if (pace.status === 'overdue') return { label: 'Vencida', fg: 'neg', bg: 'negSoft' }
  if (pace.status === 'behind' && monthsBehind > 0) {
    return { label: `Atrasada ${monthsBehind} ${monthsBehind === 1 ? 'mes' : 'meses'}`, fg: 'warn', bg: 'warnSoft' }
  }
  if (pace.status === 'behind') return { label: 'Atrasada', fg: 'warn', bg: 'warnSoft' }
  return { label: 'Al día', fg: 'pos', bg: 'posSoft' }
}

function MiniStat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <Box bg="surface2" borderRadius="tile" p={4} minW={0}>
      <Text textStyle="sectionLabel" color="text3" mb={1.5}>
        {label}
      </Text>
      <Text fontFamily="mono" fontSize={{ base: '15px', md: '18px' }} fontWeight="500" color={color ?? 'text'} truncate>
        {value}
      </Text>
    </Box>
  )
}

export function SavingsGoalCard({ goal, userId, accounts, onEdit, onCreate }: Props) {
  const router = useRouter()
  const [isAddFundsOpen, setIsAddFundsOpen] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [statusLoading, setStatusLoading] = useState(false)

  const current = toNumber(goal.current_amount)
  const target = toNumber(goal.target_amount)
  const progress = safeRatio(current, target) * 100
  const pace = getSavingsPace(goal)
  const expected = getExpectedProgress(goal)
  const badge = statusBadge(goal, pace, expected?.monthsBehind ?? 0)
  const fmt = (n: number) => formatCurrency(n, goal.currency, decimalsFor(goal.currency))

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

  const deadline = goal.deadline
    ? new Date(`${goal.deadline.slice(0, 10)}T12:00:00`).toLocaleDateString('es-CO', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).replace(/ de /g, ' ').replace('.', '')
    : null

  return (
    <>
      <Box bg="surface" borderRadius="hero" p={{ base: 6, md: 8 }}>
        <Flex align="center" gap={2.5} wrap="wrap" mb={3}>
          {deadline && (
            <Text textStyle="eyebrow" color="text3">
              Fecha límite · {deadline}
            </Text>
          )}
          {badge && (
            <Text as="span" fontSize="12px" fontWeight="500" color={badge.fg} bg={badge.bg} px={2.5} py={0.5} borderRadius="pill">
              {badge.label}
            </Text>
          )}
        </Flex>

        <Flex justify="space-between" align="flex-end" gap={6} wrap="wrap" mb={6}>
          <Box minW={0}>
            <Heading as="h2" textStyle="pageTitle" color="text">
              {goal.name}
            </Heading>
            <Text fontFamily="mono" fontSize="14px" color="text2" mt={2}>
              {fmt(current)} / {fmt(target)}
            </Text>
          </Box>
          <Text fontFamily="mono" fontSize={{ base: '44px', md: '64px' }} fontWeight="500" letterSpacing="-0.04em" lineHeight="1" color="brand">
            {Math.round(progress)}%
          </Text>
        </Flex>

        {/* Progress with a marker for where an even pace would be today */}
        <Box position="relative" mb={2}>
          <Box h="14px" bg="track" borderRadius="pill" overflow="hidden">
            <Box h="full" w={`${Math.min(progress, 100)}%`} bg={current >= target ? 'pos' : 'brandSolid'} borderRadius="pill" transition="width 300ms" />
          </Box>
          {expected && !goal.is_completed && current < target && (
            <Box
              position="absolute"
              top="-4px"
              bottom="-4px"
              left={`${expected.percent}%`}
              w="3px"
              ml="-1.5px"
              bg="warn"
              borderRadius="pill"
              title={`Deberías ir en ${Math.round(expected.percent)}%`}
            />
          )}
        </Box>
        {expected && !goal.is_completed && current < target && (
          <Text fontSize="12px" color="text3" mb={6}>
            <Text as="span" color="warn">▍</Text> Deberías ir en {Math.round(expected.percent)}%
          </Text>
        )}

        {pace && pace.status !== 'done' && (
          <Grid templateColumns="repeat(3, minmax(0, 1fr))" gap={3} mb={6}>
            <MiniStat label="Faltan" value={fmt(pace.remaining)} />
            <MiniStat label="Meses restantes" value={String(Math.max(pace.monthsLeft, 0))} />
            <MiniStat
              label="Aporte necesario"
              value={`${fmt(pace.requiredMonthly)}/mes`}
              color={pace.status === 'on-track' ? undefined : 'warn'}
            />
          </Grid>
        )}

        <Flex gap={2} wrap="wrap" align="center">
          <Button bg="brandSolid" color="white" _hover={{ bg: 'brand.600' }} onClick={() => setIsAddFundsOpen(true)} disabled={goal.is_completed}>
            <LuPlus />
            Añadir fondos
          </Button>
          <Button variant="ghost" color="text2" boxShadow="inset 0 0 0 1px var(--chakra-colors-line)" onClick={() => onEdit(goal)}>
            Editar
          </Button>
          {onCreate && (
            <Button variant="ghost" color="text2" boxShadow="inset 0 0 0 1px var(--chakra-colors-line)" onClick={onCreate}>
              Nueva meta
            </Button>
          )}
          <HStack gap={0.5} ms="auto">
            <ActionIconButton
              kind={goal.is_completed ? 'reopen' : 'pay'}
              label={goal.is_completed ? 'Reabrir meta' : 'Marcar como completada'}
              size="sm"
              variant="ghost"
              loading={statusLoading}
              onClick={toggleCompleted}
            />
            <ActionIconButton kind="delete" tone="danger" label="Eliminar" size="sm" variant="ghost" onClick={() => setShowDeleteConfirm(true)} />
          </HStack>
        </Flex>

        <Box mt={8}>
          <Text textStyle="sectionLabel" color="text3" mb={2}>
            Aportes
          </Text>
          <ContributionHistory
            userId={userId}
            goalId={goal.id}
            goalCurrency={goal.currency}
            onChange={() => router.refresh()}
          />
        </Box>
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
