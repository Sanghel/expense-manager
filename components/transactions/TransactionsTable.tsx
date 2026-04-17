'use client'

import { Badge, IconButton, HStack } from '@chakra-ui/react'
import { FiEdit2, FiTrash2 } from 'react-icons/fi'
import { useState } from 'react'
import { deleteTransaction } from '@/lib/actions/transactions.actions'
import { formatCurrency } from '@/lib/utils/currency'
import { toaster } from '@/lib/toaster'
import { DataTable, type ColumnDef } from '@/components/ui/DataTable'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import type { TransactionWithCategory } from '@/types/database.types'

interface Props {
  transactions: TransactionWithCategory[]
  userId: string
  onUpdate: () => void
  onEdit: (transaction: TransactionWithCategory) => void
}

export function TransactionsTable({ transactions, userId, onUpdate, onEdit }: Props) {
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
      render: (t) => <>{t.category.icon} {t.category.name}</>,
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
        <span style={{ fontWeight: 600, color: t.type === 'income' ? 'var(--chakra-colors-green-600)' : 'var(--chakra-colors-red-600)' }}>
          {t.type === 'income' ? '+' : '-'}{formatCurrency(Number(t.amount), t.currency)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (t) => (
        <HStack gap={1}>
          <IconButton aria-label="Editar" size="sm" variant="ghost" onClick={() => onEdit(t)}>
            <FiEdit2 />
          </IconButton>
          <IconButton
            aria-label="Eliminar"
            size="sm"
            variant="ghost"
            colorPalette="red"
            onClick={() => setSelectedId(t.id)}
          >
            <FiTrash2 />
          </IconButton>
        </HStack>
      ),
    },
  ]

  return (
    <>
      <DataTable
        data={transactions}
        columns={columns}
        emptyMessage="No hay transacciones. ¡Crea una nueva!"
      />

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
