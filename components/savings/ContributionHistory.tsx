'use client'

import { useEffect, useState } from 'react'
import { Box, Flex, Text, Spinner } from '@chakra-ui/react'
import { ActionIconButton } from '@/components/ui/ActionIconButton'
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
      <Flex justify="center" py={3}>
        <Spinner size="sm" color="brand" />
      </Flex>
    )
  }

  if (contributions.length === 0) {
    return (
      <Text fontSize="13px" color="text3" py={2}>
        Todavía no hay aportes registrados.
      </Text>
    )
  }

  return (
    <>
      <Box w="full">
        {contributions.map((c) => (
          <Flex
            key={c.id}
            justify="space-between"
            align="center"
            gap={3}
            py={3}
            borderBottomWidth="1px"
            borderColor="line"
            _last={{ borderBottomWidth: 0 }}
          >
            <Text fontFamily="mono" fontSize="12px" color="text3" w="72px" flexShrink={0}>
              {new Date(c.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: '2-digit' }).replace(/ de /g, ' ').replace('.', '')}
            </Text>
            <Text flex="1" minW={0} fontFamily="mono" fontSize="14px" color="text" textAlign="right">
              +{formatCurrency(c.amount, c.currency, c.currency === 'COP' ? 0 : 2)}
              {c.currency !== goalCurrency && (
                <Text as="span" color="text3" fontSize="12px">
                  {' '}→ {formatCurrency(c.converted_amount, goalCurrency)}
                </Text>
              )}
            </Text>
            <ActionIconButton
              kind="delete"
              tone="danger"
              label="Eliminar aporte"
              size="xs"
              variant="ghost"
              onClick={() => setPendingDelete(c)}
            />
          </Flex>
        ))}
      </Box>

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
