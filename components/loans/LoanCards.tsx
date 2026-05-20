'use client'

import { useState } from 'react'
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Button,
  IconButton,
  Spinner,
} from '@chakra-ui/react'
import { FiEdit2, FiTrash2, FiCheckCircle, FiPlusCircle, FiChevronDown, FiChevronUp } from 'react-icons/fi'
import { formatCurrency } from '@/lib/utils/currency'
import { getLoanPayments, deleteLoanPayment } from '@/lib/actions/loans.actions'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
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
        <Spinner size="sm" color="#6366f1" />
      </HStack>
    )
  }

  if (!payments || (payments.length === 0 && !hasLegacy)) {
    return (
      <Text fontSize="xs" color="#808080" py={2} textAlign="center">
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
            bg="#26262f"
            borderRadius="md"
            px={3}
            py={2}
            opacity={0.7}
          >
            <Text fontSize="xs" color="#B0B0B0">Historial previo (sin fecha)</Text>
            <Text fontSize="xs" fontWeight="600" color="white">
              {formatCurrency(legacyPaid, loan.currency)}
            </Text>
          </HStack>
        )}
        {payments.map((p) => (
          <HStack
            key={p.id}
            justify="space-between"
            bg="#26262f"
            borderRadius="md"
            px={3}
            py={2}
          >
            <Box>
              <Text fontSize="xs" color="white" fontWeight="500">
                {formatCurrency(Number(p.amount), p.currency)}
              </Text>
              {p.notes && (
                <Text fontSize="xs" color="#808080">{p.notes}</Text>
              )}
            </Box>
            <HStack gap={2}>
              <Text fontSize="xs" color="#B0B0B0">{p.date}</Text>
              {loan.status === 'active' && (
                <IconButton
                  aria-label="Eliminar abono"
                  size="2xs"
                  variant="ghost"
                  color="#F43F5E"
                  loading={deletingId === p.id}
                  onClick={() => setConfirmPayment(p)}
                >
                  <FiTrash2 />
                </IconButton>
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

  return (
    <Box
      bg="#1a1a23"
      borderRadius="xl"
      borderWidth="1px"
      borderColor={isSettled ? '#2d2d35' : '#3a3a42'}
      overflow="hidden"
      opacity={isSettled ? 0.75 : 1}
      transition="opacity 0.15s"
    >
      {/* Header */}
      <Box px={4} pt={4} pb={3}>
        <HStack justify="space-between" align="start" mb={2}>
          <Box>
            <Text fontWeight="700" color="white" fontSize="md">{loan.person_name}</Text>
            <HStack gap={2} mt={1} flexWrap="wrap">
              <Badge colorPalette={loan.type === 'lent' ? 'blue' : 'orange'} size="sm">
                {loan.type === 'lent' ? 'Presté' : 'Me prestaron'}
              </Badge>
              {loan.account && (
                <Text fontSize="xs" color="#808080">
                  {loan.account.icon ?? ''} {loan.account.name}
                </Text>
              )}
            </HStack>
          </Box>
          <Box textAlign="right">
            <Text fontWeight="700" fontSize="lg" color={loan.type === 'lent' ? '#F43F5E' : '#10B981'}>
              {formatCurrency(total, loan.currency)}
            </Text>
            {paid > 0 && (
              <Text fontSize="xs" color="#B0B0B0">
                Pendiente: {formatCurrency(remaining, loan.currency)}
              </Text>
            )}
          </Box>
        </HStack>

        {/* Progress bar */}
        {paid > 0 && (
          <Box mt={1} mb={2}>
            <Box bg="#2d2d35" borderRadius="full" h="4px">
              <Box
                bg={paidPercent >= 100 ? '#10B981' : '#6366f1'}
                borderRadius="full"
                h="4px"
                w={`${paidPercent}%`}
                transition="width 0.3s"
              />
            </Box>
            <Text fontSize="xs" color="#B0B0B0" mt={1}>
              Abonado: {formatCurrency(paid, loan.currency)} ({Math.round(paidPercent)}%)
            </Text>
          </Box>
        )}

        {loan.notes && (
          <Text fontSize="xs" color="#808080" mb={2}>{loan.notes}</Text>
        )}

        {/* Actions */}
        <HStack gap={2} mt={2} flexWrap="wrap">
          {!isSettled && (
            <>
              <Button
                size="xs"
                bg="#F97316"
                color="white"
                _hover={{ bg: '#EA580C' }}
                onClick={onPayment}
              >
                <FiPlusCircle />
                Abono
              </Button>
              <Button
                size="xs"
                bg="#4F46E5"
                color="white"
                _hover={{ bg: '#4338CA' }}
                onClick={onSettle}
              >
                <FiCheckCircle />
                {settleLabel(loan)}
              </Button>
              <IconButton
                aria-label="Editar"
                size="xs"
                variant="ghost"
                onClick={onEdit}
              >
                <FiEdit2 />
              </IconButton>
            </>
          )}
          <IconButton
            aria-label="Eliminar"
            size="xs"
            variant="ghost"
            color="#F43F5E"
            onClick={() => setConfirmDelete(true)}
          >
            <FiTrash2 />
          </IconButton>
        </HStack>
      </Box>

      {/* Toggle historial */}
      <Button
        w="full"
        variant="ghost"
        size="xs"
        color="#B0B0B0"
        borderTop="1px solid"
        borderColor="#2d2d35"
        borderRadius="0"
        py={2}
        h="auto"
        _hover={{ bg: '#26262f', color: 'white' }}
        onClick={() => setExpanded((v) => !v)}
      >
        <HStack gap={1}>
          {expanded ? <FiChevronUp /> : <FiChevronDown />}
          <Text fontSize="xs">{expanded ? 'Ocultar historial' : 'Ver historial de abonos'}</Text>
        </HStack>
      </Button>

      {/* Historial */}
      {expanded && (
        <Box px={4} pb={3} borderTop="1px solid" borderColor="#2d2d35" bg="#18181d">
          <Text fontSize="xs" fontWeight="600" color="#B0B0B0" pt={3} pb={2} textTransform="uppercase">
            Historial
          </Text>
          <PaymentHistory loan={loan} userId={userId} onRefresh={onRefresh} />
        </Box>
      )}

      <ConfirmDialog
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => { onDelete(); setConfirmDelete(false) }}
        title="Eliminar préstamo"
        description={`¿Eliminar el préstamo de ${loan.person_name}?${loan.status === 'active' ? ' El saldo de la cuenta será revertido.' : ''}`}
        confirmLabel="Eliminar"
      />
    </Box>
  )
}

export function LoanCards({ loans, userId, onEdit, onSettle, onDelete, onPayment, onRefresh }: Props) {
  if (loans.length === 0) {
    return (
      <Box py={6} textAlign="center">
        <Text color="#B0B0B0">No hay registros.</Text>
      </Box>
    )
  }

  return (
    <VStack gap={3} align="stretch">
      {loans.map((loan) => (
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
      ))}
    </VStack>
  )
}
