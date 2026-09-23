'use client'

import { Box, VStack, Text } from '@chakra-ui/react'
import { useState } from 'react'
import { deleteTransaction } from '@/lib/actions/transactions.actions'
import { toaster } from '@/lib/toaster'
import { DataTable, type ColumnDef } from '@/components/ui/DataTable'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { TransactionCardMobile } from './TransactionCardMobile'
import { formatCurrency } from '@/lib/utils/currency'
import { Badge, HStack } from '@chakra-ui/react'
import { ActionIconButton } from '@/components/ui/ActionIconButton'
import type { Account, TransactionWithCategory } from '@/types/database.types'

interface Props {
  transactions: TransactionWithCategory[]
  userId: string
  onUpdate: () => void
  onEdit: (transaction: TransactionWithCategory) => void
  accounts?: Account[]
}

export function TransactionsTable({ transactions, userId, onUpdate, onEdit, accounts = [] }: Props) {
  const accountById = new Map(accounts.map((a) => [a.id, a]))
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!selectedId) return
    setIsDeleting(true)
    const result = await deleteTransaction(selectedId, userId)
    setIsDeleting(false)

    if (result.success) {
      toaster.create({ title: 'Transacción eliminada', type: 'success', duration: 3000 })
      onUpdate()
    } else {
      toaster.create({ title: 'Error al eliminar', description: result.error, type: 'error', duration: 4000 })
    }
    setSelectedId(null)
  }

  const columns: ColumnDef<TransactionWithCategory>[] = [
    {
      key: 'date',
      header: 'Fecha',
      whiteSpace: 'nowrap',
      render: (t) => new Date(t.date + 'T00:00:00').toLocaleDateString('es-CO'),
    },
    {
      key: 'description',
      header: 'Descripción',
      render: (t) => t.description,
    },
    {
      key: 'category',
      header: 'Categoría',
      render: (t) => <>{t.category?.icon ?? '🏷️'} {t.category?.name ?? 'Sin categoría'}</>,
    },
    {
      key: 'account',
      header: 'Cuenta',
      render: (t) => {
        const account = t.account_id ? accountById.get(t.account_id) : null
        if (!account) return <Text as="span" color="#6b7280">—</Text>
        return <>{account.icon ?? '💳'} {account.name}</>
      },
    },
    {
      key: 'type',
      header: 'Tipo',
      render: (t) => (
        <Badge colorPalette={t.type === 'income' ? 'green' : 'red'}>
          {t.type === 'income' ? 'Ingreso' : 'Gasto'}
        </Badge>
      ),
    },
    {
      key: 'amount',
      header: 'Monto',
      textAlign: 'right',
      render: (t) => (
        <span style={{ fontWeight: 600, color: t.type === 'income' ? '#4ade80' : '#f87171' }}>
          {t.type === 'income' ? '+' : '-'}{formatCurrency(Number(t.amount), t.currency)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (t) => (
        <HStack gap={1}>
          <ActionIconButton kind="edit" label="Editar transacción" size="sm" onClick={() => onEdit(t)} />
          <ActionIconButton
            kind="delete"
            label="Eliminar transacción"
            size="sm"
            tone="danger"
            onClick={() => setSelectedId(t.id)}
          />
        </HStack>
      ),
    },
  ]

  return (
    <>
      {/* Mobile: card list */}
      <Box display={{ base: 'block', md: 'none' }} w="full">
        {transactions.length === 0 ? (
          <Text color="#6b7280" textAlign="center" py={8} fontSize="sm">
            No hay transacciones. ¡Crea una nueva!
          </Text>
        ) : (
          <VStack gap={2} align="stretch">
            {transactions.map((t) => (
              <TransactionCardMobile
                key={t.id}
                transaction={t}
                account={t.account_id ? (accountById.get(t.account_id) ?? null) : null}
                onEdit={onEdit}
                onDelete={setSelectedId}
              />
            ))}
          </VStack>
        )}
      </Box>

      {/* Desktop: data table */}
      <Box display={{ base: 'none', md: 'block' }}>
        <DataTable
          data={transactions}
          columns={columns}
          emptyMessage="No hay transacciones. ¡Crea una nueva!"
        />
      </Box>

      <ConfirmDialog
        isOpen={selectedId !== null}
        onClose={() => setSelectedId(null)}
        onConfirm={handleDelete}
        title="Eliminar Transacción"
        description="¿Estás seguro? Esta acción no se puede deshacer."
        isLoading={isDeleting}
      />
    </>
  )
}
