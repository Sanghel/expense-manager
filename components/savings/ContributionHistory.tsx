'use client'

import { useEffect, useState } from 'react'
import { HStack, VStack, Text, IconButton, Spinner } from '@chakra-ui/react'
import { FiTrash2 } from 'react-icons/fi'
import { getGoalContributions, deleteGoalContribution } from '@/lib/actions/savings.actions'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { toaster } from '@/lib/toaster'
import { formatCurrency } from '@/lib/utils/currency'
import type { Currency, SavingsContribution } from '@/types/database.types'

interface Props {
  userId: string
  goalId: string
  goalCurrency: Currency
  onChange: () => void
}

export function ContributionHistory({ userId, goalId, goalCurrency, onChange }: Props) {
  const [contributions, setContributions] = useState<SavingsContribution[]>([])
  const [loading, setLoading] = useState(true)
  const [pendingDelete, setPendingDelete] = useState<SavingsContribution | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    getGoalContributions(userId, goalId).then((result) => {
      if (cancelled) return
      setContributions(result.success ? (result.data ?? []) : [])
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [userId, goalId, reloadKey])

  const confirmDelete = async () => {
    if (!pendingDelete) return
    setDeleting(true)
    const result = await deleteGoalContribution(userId, pendingDelete.id)
    setDeleting(false)
    setPendingDelete(null)

    if (result.success) {
      toaster.create({ title: 'Aporte eliminado', type: 'success', duration: 3000 })
      setReloadKey((k) => k + 1)
      onChange()
    } else {
      toaster.create({ title: result.error || 'Error', type: 'error', duration: 4000 })
    }
  }

  if (loading) {
    return (
      <HStack justify="center" py={3}>
        <Spinner size="sm" color="#4F46E5" />
      </HStack>
    )
  }

  if (contributions.length === 0) {
    return (
      <Text fontSize="xs" color="#B0B0B0" py={2}>
        Todavía no hay aportes registrados.
      </Text>
    )
  }

  return (
    <>
      <VStack align="stretch" gap={1} w="full" pt={1}>
        {contributions.map((c) => (
          <HStack
            key={c.id}
            justify="space-between"
            align="center"
            bg="#15151c"
            borderRadius="md"
            px={3}
            py={2}
            gap={2}
          >
            <VStack align="start" gap={0} minW={0}>
              <Text fontSize="sm" color="white">
                {formatCurrency(c.amount, c.currency)}
                {c.currency !== goalCurrency && (
                  <Text as="span" color="#B0B0B0">
                    {' '}→ {formatCurrency(c.converted_amount, goalCurrency)}
                  </Text>
                )}
              </Text>
              <Text fontSize="xs" color="#6b7280">
                {new Date(c.created_at).toLocaleDateString('es-ES')}
              </Text>
            </VStack>
            <IconButton
              aria-label="Eliminar aporte"
              size="xs"
              variant="ghost"
              colorPalette="red"
              onClick={() => setPendingDelete(c)}
            >
              <FiTrash2 />
            </IconButton>
          </HStack>
        ))}
      </VStack>

      <ConfirmDialog
        isOpen={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        title="Eliminar aporte"
        description="Se descontará de la meta y se reintegrará el saldo a la cuenta de origen."
        isLoading={deleting}
      />
    </>
  )
}
