'use client'

import { Box, Button, Flex, Grid, IconButton, Text, useDisclosure } from '@chakra-ui/react'
import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { LuPlus } from 'react-icons/lu'
import { Card } from '@/components/ui/Card'
import { LoanForm } from '@/components/loans/LoanForm'
import { LoanPaymentForm } from '@/components/loans/LoanPaymentForm'
import { LoanCards } from '@/components/loans/LoanCards'
import { deleteLoan, settleLoan } from '@/lib/actions/loans.actions'
import { toaster } from '@/lib/toaster'
import { formatCurrency } from '@/lib/utils/currency'
import type { Account, LoanWithAccount } from '@/types/database.types'

type LoanType = 'lent' | 'borrowed'

const LANES: { type: LoanType; title: string; empty: string; cta: string }[] = [
  { type: 'lent', title: 'Me deben', empty: 'Nadie te debe dinero.', cta: 'Presté dinero' },
  { type: 'borrowed', title: 'Debo', empty: 'No tienes deudas pendientes.', cta: 'Me prestaron' },
]

/** Pending amount per currency: "COP 120.000 · US$ 50,00". */
function pendingTotal(loans: LoanWithAccount[]): string {
  const byCurrency = new Map<string, number>()
  for (const l of loans) {
    byCurrency.set(l.currency, (byCurrency.get(l.currency) ?? 0) + Number(l.amount) - Number(l.paid_amount ?? 0))
  }
  if (byCurrency.size === 0) return formatCurrency(0, 'COP', 0)
  return [...byCurrency]
    .map(([currency, amount]) => formatCurrency(amount, currency, currency === 'COP' ? 0 : 2))
    .join(' · ')
}

interface Props {
  userId: string
  initialLoans: LoanWithAccount[]
  accounts: Account[]
}

export function LoansPageClient({ userId, initialLoans, accounts }: Props) {
  const router = useRouter()
  const { open: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure()
  const { open: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure()
  const { open: isPaymentOpen, onOpen: onPaymentOpen, onClose: onPaymentClose } = useDisclosure()
  const [editingLoan, setEditingLoan] = useState<LoanWithAccount | null>(null)
  const [payingLoan, setPayingLoan] = useState<LoanWithAccount | null>(null)
  // Kept after closing so the form keeps its type during the exit animation.
  const [createType, setCreateType] = useState<LoanType>('lent')

  const openCreate = useCallback((type: LoanType) => {
    setCreateType(type)
    onCreateOpen()
  }, [onCreateOpen])

  const refresh = useCallback(() => router.refresh(), [router])

  const handleEdit = useCallback((loan: LoanWithAccount) => {
    setEditingLoan(loan)
    onEditOpen()
  }, [onEditOpen])

  const handlePayment = useCallback((loan: LoanWithAccount) => {
    setPayingLoan(loan)
    onPaymentOpen()
  }, [onPaymentOpen])

  const handleSettle = useCallback(async (loan: LoanWithAccount) => {
    const result = await settleLoan(userId, loan.id)
    if (result.success) {
      toaster.create({
        title: loan.type === 'lent' ? '¡Ya te pagaron! Saldo actualizado.' : '¡Deuda saldada! Saldo actualizado.',
        type: 'success',
        duration: 3000,
      })
      refresh()
    } else {
      toaster.create({ title: result.error ?? 'Error al saldar', type: 'error', duration: 4000 })
    }
  }, [userId, refresh])

  const handleDelete = useCallback(async (loan: LoanWithAccount) => {
    const result = await deleteLoan(userId, loan.id)
    if (result.success) {
      toaster.create({ title: 'Préstamo eliminado', type: 'success', duration: 3000 })
      refresh()
    } else {
      toaster.create({ title: result.error ?? 'Error al eliminar', type: 'error', duration: 4000 })
    }
  }, [userId, refresh])

  const handleEditClose = useCallback(() => {
    onEditClose()
    setEditingLoan(null)
  }, [onEditClose])

  const handlePaymentClose = useCallback(() => {
    onPaymentClose()
    setPayingLoan(null)
  }, [onPaymentClose])

  const activeLoans = initialLoans.filter((l) => l.status === 'active')
  const settledLoans = initialLoans.filter((l) => l.status === 'settled')

  const cardProps = {
    userId,
    onEdit: handleEdit,
    onSettle: handleSettle,
    onDelete: handleDelete,
    onPayment: handlePayment,
    onRefresh: refresh,
  }

  return (
    <Box>
      <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={4} mb={8}>
        {LANES.map((lane) => {
          const loans = activeLoans.filter((l) => l.type === lane.type)
          return (
            <Card key={lane.type} minW={0}>
              <Flex justify="space-between" align="flex-start" mb={4} gap={3}>
                <Box minW={0}>
                  <Text textStyle="cardTitle" color="text">
                    {lane.title}
                  </Text>
                  <Text fontFamily="mono" fontSize="20px" fontWeight="500" color="text" mt={1}>
                    {pendingTotal(loans)}
                  </Text>
                </Box>
                <IconButton
                  aria-label={lane.cta}
                  title={lane.cta}
                  size="sm"
                  bg="surface2"
                  color="text2"
                  _hover={{ color: 'text' }}
                  onClick={() => openCreate(lane.type)}
                >
                  <LuPlus />
                </IconButton>
              </Flex>

              {loans.length === 0 ? (
                <Flex
                  direction="column"
                  align="center"
                  gap={3}
                  bg="bg"
                  borderRadius="tile"
                  py={8}
                  px={4}
                  textAlign="center"
                >
                  <Text fontSize="14px" color="text3">
                    {lane.empty}
                  </Text>
                  <Button
                    size="sm"
                    bg="brandSoft"
                    color="brand"
                    _hover={{ opacity: 0.85 }}
                    onClick={() => openCreate(lane.type)}
                  >
                    <LuPlus />
                    {lane.cta}
                  </Button>
                </Flex>
              ) : (
                <LoanCards loans={loans} {...cardProps} />
              )}
            </Card>
          )
        })}
      </Grid>

      {settledLoans.length > 0 && (
        <Box>
          <Text textStyle="sectionLabel" color="text3" mb={3}>
            Saldados
          </Text>
          <LoanCards loans={settledLoans} {...cardProps} />
        </Box>
      )}

      <LoanForm
        key={createType}
        isOpen={isCreateOpen}
        onClose={onCreateClose}
        defaultType={createType}
        userId={userId}
        accounts={accounts}
        onSuccess={refresh}
      />

      {editingLoan && (
        <LoanForm
          isOpen={isEditOpen}
          onClose={handleEditClose}
          userId={userId}
          accounts={accounts}
          loan={editingLoan}
          onSuccess={() => { refresh(); handleEditClose() }}
        />
      )}

      {payingLoan && (
        <LoanPaymentForm
          isOpen={isPaymentOpen}
          onClose={handlePaymentClose}
          loan={payingLoan}
          userId={userId}
          onSuccess={refresh}
        />
      )}
    </Box>
  )
}
