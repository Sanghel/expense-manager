'use client'

import { HStack, Badge, IconButton } from '@chakra-ui/react'
import { FiEdit2, FiTrash2, FiPlay, FiPause } from 'react-icons/fi'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteRecurringTransaction, toggleRecurringTransaction } from '@/lib/actions/recurring.actions'
import { toaster } from '@/lib/toaster'
import { DataTable, type ColumnDef } from '@/components/ui/DataTable'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import type { RecurringTransactionWithCategory } from '@/types/database.types'

const FREQUENCY_LABELS: Record<string, string> = {
  daily: 'Diario',
  weekly: 'Semanal',
  monthly: 'Mensual',
  yearly: 'Anual',
}

interface Props {
  userId: string
  transactions: RecurringTransactionWithCategory[]
  onEdit: (txn: RecurringTransactionWithCategory) => void
}

export function RecurringTransactionsList({ userId, transactions, onEdit }: Props) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const confirmDelete = async () => {
    if (!deletingId) return
    setDeleteLoading(true)
    const result = await deleteRecurringTransaction(deletingId, userId)
    setDeleteLoading(false)
    setDeletingId(null)
    if (result.success) {
      toaster.create({ title: 'Eliminada', type: 'success', duration: 3000 })
      router.refresh()
    } else {
      toaster.create({ title: result.error || 'Error', type: 'error', duration: 3000 })
    }
  }

  const handleToggle = async (id: string, isActive: boolean) => {
    const result = await toggleRecurringTransaction(id, userId, !isActive)
    if (result.success) {
      toaster.create({ title: isActive ? 'Pausada' : 'Activada', type: 'success', duration: 3000 })
      router.refresh()
    } else {
      toaster.create({ title: result.error || 'Error', type: 'error', duration: 3000 })
    }
  }

  const columns: ColumnDef<RecurringTransactionWithCategory>[] = [
    {
      key: 'description',
      header: 'Descripción',
      render: (t) => t.description,
    },
    {
      key: 'category',
      header: 'Categoría',
      render: (t) => t.category.name,
    },
    {
      key: 'amount',
      header: 'Monto',
      render: (t) => `${t.amount.toLocaleString()} ${t.currency}`,
    },
    {
      key: 'frequency',
      header: 'Frecuencia',
      render: (t) => FREQUENCY_LABELS[t.frequency] ?? t.frequency,
    },
    {
      key: 'status',
      header: 'Estado',
      render: (t) => (
        <Badge colorPalette={t.is_active ? 'green' : 'yellow'} variant="solid">
          {t.is_active ? 'Activo' : 'Pausado'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (t) => (
        <HStack gap={1}>
          <IconButton
            aria-label={t.is_active ? 'Pausar' : 'Activar'}
            size="sm"
            variant="ghost"
            title={t.is_active ? 'Pausar' : 'Activar'}
            onClick={() => handleToggle(t.id, t.is_active)}
          >
            {t.is_active ? <FiPause /> : <FiPlay />}
          </IconButton>
          <IconButton
            aria-label="Editar"
            size="sm"
            variant="ghost"
            onClick={() => onEdit(t)}
          >
            <FiEdit2 />
          </IconButton>
          <IconButton
            aria-label="Eliminar"
            size="sm"
            variant="ghost"
            colorPalette="red"
            onClick={() => setDeletingId(t.id)}
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
        emptyMessage="Sin transacciones recurrentes"
      />

      <ConfirmDialog
        isOpen={deletingId !== null}
        onClose={() => setDeletingId(null)}
        onConfirm={confirmDelete}
        title="Eliminar recurrente"
        description="¿Estás seguro? Esta acción no se puede deshacer."
        isLoading={deleteLoading}
      />
    </>
  )
}
