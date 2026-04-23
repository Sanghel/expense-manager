'use client'

import { Box, Heading, Button, HStack, Text, useDisclosure } from '@chakra-ui/react'
import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { FiPlus } from 'react-icons/fi'
import { Card } from '@/components/ui/Card'
import { LoanForm } from '@/components/loans/LoanForm'
import { LoansTable } from '@/components/loans/LoansTable'
import { deleteLoan, settleLoan } from '@/lib/actions/loans.actions'
import { toaster } from '@/lib/toaster'
import type { Account, LoanWithAccount } from '@/types/database.types'

interface Props {
  userId: string
  initialLoans: LoanWithAccount[]
  accounts: Account[]
}

export function LoansPageClient({ userId, initialLoans, accounts }: Props) {
  const router = useRouter()
  const { open: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure()
  const { open: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure()
  const [editingLoan, setEditingLoan] = useState<LoanWithAccount | null>(null)

  const handleEdit = useCallback((loan: LoanWithAccount) => {
    setEditingLoan(loan)
    onEditOpen()
  }, [onEditOpen])

  const handleSettle = useCallback(async (loan: LoanWithAccount) => {
    const result = await settleLoan(userId, loan.id)
    if (result.success) {
      toaster.create({
        title: loan.type === 'lent' ? '¡Ya te pagaron! Saldo actualizado.' : '¡Deuda saldada! Saldo actualizado.',
        type: 'success',
        duration: 3000,
      })
      router.refresh()
    } else {
      toaster.create({ title: result.error ?? 'Error al saldar', type: 'error', duration: 4000 })
    }
  }, [userId, router])

  const handleDelete = useCallback(async (loan: LoanWithAccount) => {
    const result = await deleteLoan(userId, loan.id)
    if (result.success) {
      toaster.create({ title: 'Préstamo eliminado', type: 'success', duration: 3000 })
      router.refresh()
    } else {
      toaster.create({ title: result.error ?? 'Error al eliminar', type: 'error', duration: 4000 })
    }
  }, [userId, router])

  const handleEditClose = useCallback(() => {
    onEditClose()
    setEditingLoan(null)
  }, [onEditClose])

  const activeLoans = initialLoans.filter((l) => l.status === 'active')
  const settledLoans = initialLoans.filter((l) => l.status === 'settled')

  return (
    <Box>
      <HStack justify="space-between" mb={{ base: 4, md: 6 }}>
        <Heading size={{ base: 'md', md: 'lg' }} color="white">Deudas y Préstamos</Heading>
        <Button
          bg="#4F46E5"
          color="white"
          _hover={{ bg: '#4338CA' }}
          onClick={onCreateOpen}
          size={{ base: 'sm', md: 'md' }}
        >
          <FiPlus />
          <Text display={{ base: 'none', sm: 'inline' }}>Registrar Préstamo</Text>
          <Text display={{ base: 'inline', sm: 'none' }}>Nuevo</Text>
        </Button>
      </HStack>

      <Card mb={6}>
        <Heading size="sm" mb={4} color="white">Activos</Heading>
        <LoansTable
          loans={activeLoans}
          onEdit={handleEdit}
          onSettle={handleSettle}
          onDelete={handleDelete}
        />
      </Card>

      {settledLoans.length > 0 && (
        <Card>
          <Heading size="sm" mb={4} color="#B0B0B0">Historial — Saldados</Heading>
          <LoansTable
            loans={settledLoans}
            onEdit={handleEdit}
            onSettle={handleSettle}
            onDelete={handleDelete}
          />
        </Card>
      )}

      <LoanForm
        isOpen={isCreateOpen}
        onClose={onCreateClose}
        userId={userId}
        accounts={accounts}
        onSuccess={() => router.refresh()}
      />

      {editingLoan && (
        <LoanForm
          isOpen={isEditOpen}
          onClose={handleEditClose}
          userId={userId}
          accounts={accounts}
          loan={editingLoan}
          onSuccess={() => { router.refresh(); handleEditClose() }}
        />
      )}
    </Box>
  )
}
