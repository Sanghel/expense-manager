'use client'

import { Box, VStack, HStack, Badge, Text, IconButton, Flex } from '@chakra-ui/react'
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
    { key: 'description', header: 'Descripción', render: (t) => t.description },
    {
      key: 'category',
      header: 'Categoría',
      render: (t) => (
        <HStack gap={1}>
          <Text>{t.category.icon ?? '🏷️'}</Text>
          <Text>{t.category.name}</Text>
        </HStack>
      ),
    },
    { key: 'amount', header: 'Monto', render: (t) => `${t.amount.toLocaleString()} ${t.currency}` },
    { key: 'frequency', header: 'Frecuencia', render: (t) => FREQUENCY_LABELS[t.frequency] ?? t.frequency },
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
          <IconButton aria-label={t.is_active ? 'Pausar' : 'Activar'} size="sm" variant="ghost" title={t.is_active ? 'Pausar' : 'Activar'} onClick={() => handleToggle(t.id, t.is_active)}>
            {t.is_active ? <FiPause /> : <FiPlay />}
          </IconButton>
          <IconButton aria-label="Editar" size="sm" variant="ghost" onClick={() => onEdit(t)}>
            <FiEdit2 />
          </IconButton>
          <IconButton aria-label="Eliminar" size="sm" variant="ghost" colorPalette="red" onClick={() => setDeletingId(t.id)}>
            <FiTrash2 />
          </IconButton>
        </HStack>
      ),
    },
  ]

  return (
    <>
      {/* Mobile: card list */}
      <Box display={{ base: 'block', md: 'none' }} w="full">
        {transactions.length === 0 ? (
          <Text color="#6b7280" textAlign="center" py={8} fontSize="sm">Sin transacciones recurrentes</Text>
        ) : (
          <VStack gap={2} align="stretch">
            {transactions.map((t) => (
              <Box key={t.id} borderWidth="1px" borderColor="#2d2d35" borderRadius="xl" p={3} bg="#18181d">
                <Flex justify="space-between" align="flex-start" gap={2}>
                  <Flex flex={1} direction="column" gap={1} minW={0}>
                    <Text fontWeight="600" fontSize="sm" color="white" lineClamp={1}>{t.description}</Text>
                    <HStack gap={2} flexWrap="wrap">
                      <Text fontSize="xs" color="#6b7280">{t.category.icon ?? '🏷️'} {t.category.name}</Text>
                      <Text fontSize="xs" color="#4b5563">·</Text>
                      <Text fontSize="xs" color="#6b7280">{FREQUENCY_LABELS[t.frequency] ?? t.frequency}</Text>
                    </HStack>
                    <HStack gap={2} mt={1}>
                      <Badge colorPalette={t.is_active ? 'green' : 'yellow'} variant="solid" fontSize="10px">
                        {t.is_active ? 'Activo' : 'Pausado'}
                      </Badge>
                    </HStack>
                  </Flex>
                  <Flex direction="column" align="flex-end" gap={1} flexShrink={0}>
                    <Text fontWeight="700" fontSize="sm" color={t.type === 'income' ? '#4ade80' : '#f87171'}>
                      {t.amount.toLocaleString()} {t.currency}
                    </Text>
                    <HStack gap={0}>
                      <IconButton aria-label={t.is_active ? 'Pausar' : 'Activar'} size="xs" variant="ghost" color="#6b7280" onClick={() => handleToggle(t.id, t.is_active)}>
                        {t.is_active ? <FiPause /> : <FiPlay />}
                      </IconButton>
                      <IconButton aria-label="Editar" size="xs" variant="ghost" color="#6b7280" onClick={() => onEdit(t)}>
                        <FiEdit2 />
                      </IconButton>
                      <IconButton aria-label="Eliminar" size="xs" variant="ghost" color="#ef4444" onClick={() => setDeletingId(t.id)}>
                        <FiTrash2 />
                      </IconButton>
                    </HStack>
                  </Flex>
                </Flex>
              </Box>
            ))}
          </VStack>
        )}
      </Box>

      {/* Desktop: data table */}
      <Box display={{ base: 'none', md: 'block' }} w="full">
        <DataTable data={transactions} columns={columns} emptyMessage="Sin transacciones recurrentes" />
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
