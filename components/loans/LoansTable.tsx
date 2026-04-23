'use client'

import { useState } from 'react'
import { Box, VStack, HStack, Text, Badge, Button, IconButton } from '@chakra-ui/react'
import { FiEdit2, FiTrash2, FiCheckCircle } from 'react-icons/fi'
import { formatCurrency } from '@/lib/utils/currency'
import { DataTable, type ColumnDef } from '@/components/ui/DataTable'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import type { LoanWithAccount } from '@/types/database.types'

interface Props {
  loans: LoanWithAccount[]
  onEdit: (loan: LoanWithAccount) => void
  onSettle: (loan: LoanWithAccount) => void
  onDelete: (loan: LoanWithAccount) => void
}

function settleLabel(loan: LoanWithAccount) {
  return loan.type === 'lent' ? '¡Ya me pagaron!' : '¡Ya pagué!'
}

export function LoansTable({ loans, onEdit, onSettle, onDelete }: Props) {
  const [confirmLoan, setConfirmLoan] = useState<LoanWithAccount | null>(null)

  if (loans.length === 0) {
    return (
      <Box py={6} textAlign="center">
        <Text color="#B0B0B0">No hay registros.</Text>
      </Box>
    )
  }

  const columns: ColumnDef<LoanWithAccount>[] = [
    {
      key: 'person_name',
      header: 'Persona',
      render: (l) => <Text fontWeight="500">{l.person_name}</Text>,
    },
    {
      key: 'type',
      header: 'Tipo',
      render: (l) => (
        <Badge colorPalette={l.type === 'lent' ? 'blue' : 'orange'}>
          {l.type === 'lent' ? 'Presté' : 'Me prestaron'}
        </Badge>
      ),
    },
    {
      key: 'amount',
      header: 'Monto',
      textAlign: 'right',
      render: (l) => (
        <Text fontWeight="600" color={l.type === 'lent' ? '#F43F5E' : '#10B981'}>
          {formatCurrency(Number(l.amount), l.currency)}
        </Text>
      ),
    },
    {
      key: 'account',
      header: 'Cuenta',
      render: (l) => (
        <Text color="#B0B0B0" fontSize="sm">
          {l.account ? `${l.account.icon ?? ''} ${l.account.name}` : '—'}
        </Text>
      ),
    },
    {
      key: 'notes',
      header: 'Notas',
      render: (l) => (
        <Text color="#B0B0B0" fontSize="sm">{l.notes ?? '—'}</Text>
      ),
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (l) => (
        <HStack gap={1}>
          {l.status === 'active' && (
            <>
              <Button
                size="xs"
                bg="#4F46E5"
                color="white"
                _hover={{ bg: '#4338CA' }}
                onClick={() => onSettle(l)}
                title={settleLabel(l)}
              >
                <FiCheckCircle />
                <Text display={{ base: 'none', lg: 'inline' }} ml={1}>{settleLabel(l)}</Text>
              </Button>
              <IconButton
                aria-label="Editar"
                size="xs"
                variant="ghost"
                onClick={() => onEdit(l)}
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
            onClick={() => setConfirmLoan(l)}
          >
            <FiTrash2 />
          </IconButton>
        </HStack>
      ),
    },
  ]

  return (
    <>
      {/* Desktop table */}
      <Box display={{ base: 'none', md: 'block' }}>
        <DataTable data={loans} columns={columns} emptyMessage="No hay registros." size="sm" />
      </Box>

      {/* Mobile cards */}
      <VStack gap={3} align="stretch" display={{ base: 'flex', md: 'none' }}>
        {loans.map((loan) => (
          <Box
            key={loan.id}
            bg="#1a1a23"
            borderRadius="lg"
            borderWidth="1px"
            borderColor="#2d2d35"
            p={4}
            opacity={loan.status === 'settled' ? 0.6 : 1}
          >
            <HStack justify="space-between" mb={2}>
              <Text fontWeight="600" color="white">{loan.person_name}</Text>
              <Text fontWeight="700" color={loan.type === 'lent' ? '#F43F5E' : '#10B981'}>
                {formatCurrency(Number(loan.amount), loan.currency)}
              </Text>
            </HStack>
            <HStack gap={2} mb={3} flexWrap="wrap">
              <Badge colorPalette={loan.type === 'lent' ? 'blue' : 'orange'} fontSize="xs">
                {loan.type === 'lent' ? 'Presté' : 'Me prestaron'}
              </Badge>
              {loan.account && (
                <Text fontSize="xs" color="#B0B0B0">
                  {loan.account.icon ?? ''} {loan.account.name}
                </Text>
              )}
              {loan.notes && (
                <Text fontSize="xs" color="#808080">{loan.notes}</Text>
              )}
            </HStack>
            <HStack gap={2}>
              {loan.status === 'active' && (
                <>
                  <Button
                    size="sm"
                    bg="#4F46E5"
                    color="white"
                    _hover={{ bg: '#4338CA' }}
                    flex={1}
                    onClick={() => onSettle(loan)}
                  >
                    <FiCheckCircle />
                    {settleLabel(loan)}
                  </Button>
                  <IconButton
                    aria-label="Editar"
                    size="sm"
                    variant="outline"
                    onClick={() => onEdit(loan)}
                  >
                    <FiEdit2 />
                  </IconButton>
                </>
              )}
              <IconButton
                aria-label="Eliminar"
                size="sm"
                variant="ghost"
                color="#F43F5E"
                onClick={() => setConfirmLoan(loan)}
              >
                <FiTrash2 />
              </IconButton>
            </HStack>
          </Box>
        ))}
      </VStack>

      <ConfirmDialog
        isOpen={confirmLoan !== null}
        onClose={() => setConfirmLoan(null)}
        onConfirm={() => {
          if (confirmLoan) {
            onDelete(confirmLoan)
            setConfirmLoan(null)
          }
        }}
        title="Eliminar préstamo"
        description={`¿Eliminar el préstamo de ${confirmLoan?.person_name ?? ''}? ${confirmLoan?.status === 'active' ? 'El saldo de la cuenta será revertido.' : ''}`}
        confirmLabel="Eliminar"
      />
    </>
  )
}
