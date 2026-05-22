'use client'

import { VStack, HStack, Box, Text, Badge, IconButton } from '@chakra-ui/react'
import { useState } from 'react'
import { FiEdit2, FiTrash2 } from 'react-icons/fi'
import { deleteReminder } from '@/lib/actions/reminders.actions'
import { toaster } from '@/lib/toaster'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { ReminderForm } from './ReminderForm'
import type { Account, Category, ReminderWithCategory } from '@/types/database.types'

const FREQUENCY_LABELS: Record<string, string> = {
  once: 'Una vez',
  weekly: 'Semanal',
  monthly: 'Mensual',
  yearly: 'Anual',
}

const WEEKDAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const MONTH_NAMES = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

function getReminderScheduleLabel(r: ReminderWithCategory): string {
  switch (r.frequency) {
    case 'once':
      return r.specific_date ? `El ${r.specific_date}` : '—'
    case 'weekly':
      return `Cada ${r.day_of_week != null ? WEEKDAY_NAMES[r.day_of_week] : '—'}`
    case 'monthly':
      return `Día ${r.day_of_month} de cada mes`
    case 'yearly':
      return `${r.day_of_month} de ${r.month_of_year != null ? MONTH_NAMES[r.month_of_year] : '—'} de cada año`
    default:
      return '—'
  }
}

interface Props {
  userId: string
  reminders: ReminderWithCategory[]
  categories: Category[]
  accounts?: Account[]
  onRefresh: () => void
}

export function RemindersList({ userId, reminders, categories, accounts = [], onRefresh }: Props) {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingReminder, setEditingReminder] = useState<ReminderWithCategory | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const handleDelete = async () => {
    if (!deletingId) return
    setDeleteLoading(true)
    const result = await deleteReminder(userId, deletingId)
    setDeleteLoading(false)
    setDeletingId(null)
    if (result.success) {
      toaster.create({ title: 'Recordatorio eliminado', type: 'success', duration: 3000 })
      onRefresh()
    } else {
      toaster.create({ title: result.error ?? 'Error', type: 'error', duration: 4000 })
    }
  }

  return (
    <VStack gap={4} align="stretch">
      <Text fontWeight="semibold" color="white">Mis Recordatorios</Text>

      {reminders.length === 0 ? (
        <Text color="#B0B0B0" fontSize="sm">No tienes recordatorios. Crea uno para verlo en el calendario.</Text>
      ) : (
        <VStack gap={2} align="stretch">
          {reminders.map((r) => (
            <Box
              key={r.id}
              borderWidth="1px"
              borderRadius="xl"
              px={4}
              py={3}
              bg="#1a1a23"
              borderColor="#2d2d35"
              _hover={{ borderColor: '#4F46E5' }}
              transition="border-color 0.2s"
            >
              <HStack justify="space-between" align="flex-start">
                <VStack align="start" gap={1} flex={1}>
                  <Text fontWeight="semibold" fontSize="sm" color="white">
                    {r.category?.icon ?? '🔔'} {r.description}
                  </Text>
                  <HStack gap={2} flexWrap="wrap">
                    <Badge size="sm" variant="outline" colorPalette="purple">
                      {FREQUENCY_LABELS[r.frequency]}
                    </Badge>
                    <Text fontSize="xs" color="#B0B0B0">{getReminderScheduleLabel(r)}</Text>
                    {r.category && (
                      <Text fontSize="xs" color="#B0B0B0">· {r.category.name}</Text>
                    )}
                  </HStack>
                </VStack>
                <HStack gap={1} flexShrink={0}>
                  <IconButton
                    aria-label="Editar"
                    size="xs"
                    variant="ghost"
                    color="#B0B0B0"
                    onClick={() => { setEditingReminder(r); setIsFormOpen(true) }}
                  >
                    <FiEdit2 />
                  </IconButton>
                  <IconButton
                    aria-label="Eliminar"
                    size="xs"
                    variant="ghost"
                    color="#ef4444"
                    onClick={() => setDeletingId(r.id)}
                  >
                    <FiTrash2 />
                  </IconButton>
                </HStack>
              </HStack>
            </Box>
          ))}
        </VStack>
      )}

      <ReminderForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        userId={userId}
        categories={categories}
        accounts={accounts}
        editingReminder={editingReminder}
        onSuccess={onRefresh}
      />

      <ConfirmDialog
        isOpen={deletingId !== null}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Eliminar recordatorio"
        description="¿Estás seguro? Esta acción no se puede deshacer."
        isLoading={deleteLoading}
      />
    </VStack>
  )
}
