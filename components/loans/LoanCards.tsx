'use client'

import { useState } from 'react'
import {
  Box,
  Flex,
  Grid,
  VStack,
  HStack,
  Text,
  Button,
  Spinner,
} from '@chakra-ui/react'
import { LuCircleCheck, LuCirclePlus, LuChevronDown, LuChevronUp } from 'react-icons/lu'
import { formatCurrency } from '@/lib/utils/currency'
import { getLoanPayments, deleteLoanPayment } from '@/lib/actions/loans.actions'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { ActionIconButton } from '@/components/ui/ActionIconButton'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { toaster } from '@/lib/toaster'
import type { LoanWithAccount, LoanPayment } from '@/types/database.types'

interface Props {
  loans: LoanWithAccount[]
  userId: string
  onEdit: (loan: LoanWithAccount) => void
  onSettle: (loan: LoanWithAccount) => void
  onDelete: (loan: LoanWithAccount) => void
  onPayment: (loan: LoanWithAccount) => void
  onRefresh: () => void
}

/** COP has no cents in practice; USD/VES keep them. */
const decimalsFor = (currency: string) => (currency === 'COP' ? 0 : 2)

/** "12 sep" */
const shortDate = (iso: string) =>
  new Date(iso.length === 10 ? `${iso}T12:00:00` : iso)
    .toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
    .replace(' de ', ' ')
    .replace('.', '')

function settleLabel(loan: LoanWithAccount) {
  return loan.type === 'lent' ? '¡Ya me pagaron!' : '¡Ya pagué!'
}

function PaymentHistory({
  loan,
  userId,
  onRefresh,
}: {
  loan: LoanWithAccount
  userId: string
  onRefresh: () => void
}) {
  const [payments, setPayments] = useState<LoanPayment[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmPayment, setConfirmPayment] = useState<LoanPayment | null>(null)

  const load = async () => {
    setLoading(true)
    const result = await getLoanPayments(userId, loan.id)
    setLoading(false)
    if (result.success) setPayments(result.data as LoanPayment[])
  }

  if (payments === null && !loading) {
    // Trigger load on mount of this component
    load()
  }

  const handleDeletePayment = async () => {
    if (!confirmPayment) return
    setDeletingId(confirmPayment.id)
    const result = await deleteLoanPayment(userId, confirmPayment.id)
    setDeletingId(null)
    if (result.success) {
      toaster.create({ title: 'Abono eliminado', type: 'success', duration: 2500 })
      setConfirmPayment(null)
      onRefresh()
      load()
    } else {
      toaster.create({ title: result.error ?? 'Error al eliminar', type: 'error', duration: 4000 })
    }
  }

  const legacyPaid = Number(loan.paid_amount ?? 0)
  const hasLegacy = legacyPaid > 0 && payments !== null && payments.length === 0

  if (loading) {
    return (
      <HStack justify="center" py={3}>
        <Spinner size="sm" color="brand" />
      </HStack>
    )
  }

  if (!payments || (payments.length === 0 && !hasLegacy)) {
    return (
      <Text fontSize="xs" color="text3" py={2} textAlign="center">
        Sin historial de abonos registrados.
      </Text>
    )
  }

  return (
    <>
      <VStack gap={1} align="stretch" pt={1}>
        {hasLegacy && (
          <HStack
            justify="space-between"
            bg="bg"
            borderRadius="input"
            px={3}
            py={2}
            opacity={0.7}
          >
            <Text fontSize="xs" color="text2">Historial previo (sin fecha)</Text>
            <Text fontSize="xs" fontFamily="mono" color="text">
              {formatCurrency(legacyPaid, loan.currency)}
            </Text>
          </HStack>
        )}
        {payments.map((p) => (
          <HStack
            key={p.id}
            justify="space-between"
            bg="bg"
            borderRadius="input"
            px={3}
            py={2}
          >
            <Box>
              <Text fontSize="xs" color="text" fontFamily="mono">
                {formatCurrency(Number(p.amount), p.currency)}
              </Text>
              {p.notes && (
                <Text fontSize="xs" color="text3">{p.notes}</Text>
              )}
            </Box>
            <HStack gap={2}>
              <Text fontSize="xs" fontFamily="mono" color="text2">{p.date}</Text>
              {loan.status === 'active' && (
                <ActionIconButton
                  kind="delete"
                  tone="danger"
                  label="Eliminar abono"
                  size="xs"
                  variant="ghost"
                  loading={deletingId === p.id}
                  onClick={() => setConfirmPayment(p)}
                />
              )}
            </HStack>
          </HStack>
        ))}
      </VStack>

      <ConfirmDialog
        isOpen={confirmPayment !== null}
        onClose={() => setConfirmPayment(null)}
        onConfirm={handleDeletePayment}
        title="Eliminar abono"
        description={`¿Eliminar el abono de ${confirmPayment ? formatCurrency(Number(confirmPayment.amount), confirmPayment.currency) : ''}? El saldo de la cuenta será revertido.`}
        confirmLabel="Eliminar"
      />
    </>
  )
}

function LoanCard({
  loan,
  userId,
  onEdit,
  onSettle,
  onDelete,
  onPayment,
  onRefresh,
}: {
  loan: LoanWithAccount
  userId: string
  onEdit: () => void
  onSettle: () => void
  onDelete: () => void
  onPayment: () => void
  onRefresh: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const total = Number(loan.amount)
  const paid = Number(loan.paid_amount ?? 0)
  const remaining = total - paid
  const paidPercent = total > 0 ? Math.min(100, (paid / total) * 100) : 0
  const isSettled = loan.status === 'settled'

  const confirmDeleteDialog = (
    <ConfirmDialog
      isOpen={confirmDelete}
      onClose={() => setConfirmDelete(false)}
      onConfirm={() => { onDelete(); setConfirmDelete(false) }}
      title="Eliminar préstamo"
      description={`¿Eliminar el préstamo de ${loan.person_name}?${loan.status === 'active' ? ' El saldo de la cuenta será revertido.' : ''}`}
      confirmLabel="Eliminar"
    />
  )

  if (isSettled) {
    return (
      <Box bg="surface2" borderRadius="tile" p={4} minW={0}>
        <Flex justify="space-between" align="baseline" gap={3} mb={3}>
          <Text fontWeight="600" color="text" truncate>{loan.person_name}</Text>
          <Text fontFamily="mono" fontSize="14px" color="text">{formatCurrency(total, loan.currency, decimalsFor(loan.currency))}</Text>
        </Flex>
        <ProgressBar value={100} tone="pos" size={4} label="Saldado" />
        <Flex justify="space-between" gap={3} mt={3} fontSize="12px" color="text3">
          <Text truncate>
            {[loan.type === 'lent' ? 'Presté' : 'Me prestaron', loan.notes, loan.account?.name].filter(Boolean).join(' · ')}
          </Text>
          <Flex align="center" gap={1} flexShrink={0}>
            {loan.settled_at && <Text>Saldado {shortDate(loan.settled_at)}</Text>}
            <ActionIconButton kind="delete" tone="danger" label="Eliminar" size="xs" variant="ghost" onClick={() => setConfirmDelete(true)} />
          </Flex>
        </Flex>
        {confirmDeleteDialog}
      </Box>
    )
  }

  return (
    <Box bg="surface2" borderRadius="tile" overflow="hidden">
      <Box p={4}>
        <Flex justify="space-between" align="flex-start" gap={3} mb={3}>
          <Box minW={0}>
            <Text fontWeight="600" color="text" truncate>{loan.person_name}</Text>
            <Text fontSize="12px" color="text3" truncate>
              {[loan.notes, loan.account && `${loan.account.icon ?? ''} ${loan.account.name}`.trim()].filter(Boolean).join(' · ') || (loan.type === 'lent' ? 'Presté' : 'Me prestaron')}
            </Text>
          </Box>
          <Box textAlign="right" flexShrink={0}>
            <Text fontFamily="mono" fontSize="16px" fontWeight="500" color="text">
              {formatCurrency(remaining, loan.currency, decimalsFor(loan.currency))}
            </Text>
            {paid > 0 && (
              <Text fontFamily="mono" fontSize="11px" color="text3">
                de {formatCurrency(total, loan.currency, decimalsFor(loan.currency))}
              </Text>
            )}
          </Box>
        </Flex>

        <ProgressBar value={paidPercent} tone="brand" size={4} label="Abonado" />
        <Text fontSize="11px" fontFamily="mono" color="text3" mt={1.5}>
          {Math.round(paidPercent)}% abonado
        </Text>

        <Flex gap={2} mt={4} wrap="wrap" align="center">
          <Button size="xs" bg="brandSolid" color="white" _hover={{ bg: 'brand.600' }} onClick={onSettle}>
            <LuCircleCheck />
            {settleLabel(loan)}
          </Button>
          <Button size="xs" variant="ghost" color="text2" boxShadow="inset 0 0 0 1px var(--chakra-colors-line)" onClick={onPayment}>
            <LuCirclePlus />
            Abono
          </Button>
          <Flex ms="auto" gap={0.5}>
            <ActionIconButton kind="edit" label="Editar" size="xs" variant="ghost" onClick={onEdit} />
            <ActionIconButton kind="delete" tone="danger" label="Eliminar" size="xs" variant="ghost" onClick={() => setConfirmDelete(true)} />
          </Flex>
        </Flex>
      </Box>

      <Button
        w="full"
        variant="ghost"
        size="xs"
        color="text3"
        borderTopWidth="1px"
        borderColor="line"
        borderRadius="0"
        py={2}
        h="auto"
        _hover={{ bg: 'line', color: 'text' }}
        onClick={() => setExpanded((v) => !v)}
      >
        {expanded ? <LuChevronUp /> : <LuChevronDown />}
        {expanded ? 'Ocultar abonos' : 'Ver abonos'}
      </Button>

      {expanded && (
        <Box px={4} pb={3}>
          <Text textStyle="sectionLabel" color="text3" pt={2} pb={2}>
            Abonos
          </Text>
          <PaymentHistory loan={loan} userId={userId} onRefresh={onRefresh} />
        </Box>
      )}

      {confirmDeleteDialog}
    </Box>
  )
}

export function LoanCards({ loans, userId, onEdit, onSettle, onDelete, onPayment, onRefresh }: Props) {
  const cards = loans.map((loan) => (
    <LoanCard
      key={loan.id}
      loan={loan}
      userId={userId}
      onEdit={() => onEdit(loan)}
      onSettle={() => onSettle(loan)}
      onDelete={() => onDelete(loan)}
      onPayment={() => onPayment(loan)}
      onRefresh={onRefresh}
    />
  ))

  // Settled loans read as a grid of small cards; active ones stack in their lane.
  return loans.every((l) => l.status === 'settled') ? (
    <Grid templateColumns="repeat(auto-fill, minmax(260px, 1fr))" gap={3}>
      {cards}
    </Grid>
  ) : (
    <VStack gap={3} align="stretch">
      {cards}
    </VStack>
  )
}
