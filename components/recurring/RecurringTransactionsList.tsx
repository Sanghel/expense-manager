'use client'

import {
  Box,
  Table,
  Text,
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
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import type { RecurringTransactionWithCategory } from '@/types/database.types'

interface Props {
  userId: string
  transactions: RecurringTransactionWithCategory[]
}

export function RecurringTransactionsList({ userId, transactions }: Props) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const handleDelete = (id: string) => {
    setDeletingId(id)
  }

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

  if (transactions.length === 0) {
    return <Text color="fg.muted">Sin transacciones recurrentes</Text>
  }

  return (
    <>
    <Box overflowX="auto">
      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>Descripción</Table.ColumnHeader>
            <Table.ColumnHeader>Categoría</Table.ColumnHeader>
            <Table.ColumnHeader>Monto</Table.ColumnHeader>
            <Table.ColumnHeader>Frecuencia</Table.ColumnHeader>
            <Table.ColumnHeader>Estado</Table.ColumnHeader>
            <Table.ColumnHeader>Acciones</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {transactions.map(txn => (
            <Table.Row key={txn.id}>
              <Table.Cell>{txn.description}</Table.Cell>
              <Table.Cell>{txn.category.name}</Table.Cell>
              <Table.Cell>
                {txn.amount.toLocaleString()} {txn.currency}
              </Table.Cell>
              <Table.Cell>{txn.frequency}</Table.Cell>
              <Table.Cell>
                <Badge variant={txn.is_active ? 'solid' : 'outline'}>
                  {txn.is_active ? 'Activo' : 'Pausado'}
                </Badge>
              </Table.Cell>
              <Table.Cell>
                <HStack gap="2">
                  <Button
                    size="sm"
                    onClick={() => handleToggle(txn.id, txn.is_active)}
                  >
                    {txn.is_active ? 'Pausar' : 'Activar'}
                  </Button>
                  <MenuRoot>
                    <MenuTrigger asChild>
                      <IconButton aria-label="Options" variant="ghost" />
                    </MenuTrigger>
                    <MenuContent>
                      <MenuItem value="delete" onClick={() => handleDelete(txn.id)}>
                        Eliminar
                      </MenuItem>
                    </MenuContent>
                  </MenuRoot>
                </HStack>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Box>

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
