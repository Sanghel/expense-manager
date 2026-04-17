'use client'

import {
  HStack,
  Button,
  Badge,
  MenuRoot,
  MenuContent,
  MenuItem,
  MenuTrigger,
  IconButton,
} from '@chakra-ui/react'
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
        <Badge variant={t.is_active ? 'solid' : 'outline'}>
          {t.is_active ? 'Activo' : 'Pausado'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (t) => (
        <HStack gap="2">
          <Button size="sm" onClick={() => handleToggle(t.id, t.is_active)}>
            {t.is_active ? 'Pausar' : 'Activar'}
          </Button>
          <MenuRoot>
            <MenuTrigger asChild>
              <IconButton aria-label="Opciones" variant="ghost" size="sm" />
            </MenuTrigger>
            <MenuContent>
              <MenuItem value="edit" onClick={() => onEdit(t)}>
                Editar
              </MenuItem>
              <MenuItem value="delete" onClick={() => setDeletingId(t.id)}>
                Eliminar
              </MenuItem>
            </MenuContent>
          </MenuRoot>
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
