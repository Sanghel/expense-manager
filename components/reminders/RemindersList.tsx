'use client'

import { Box, Flex, Grid, IconButton, Menu, Portal, Text } from '@chakra-ui/react'
import { useMemo, useState } from 'react'
import { LuEllipsisVertical, LuPencil, LuTrash2 } from 'react-icons/lu'
import { deleteReminder } from '@/lib/actions/reminders.actions'
import { nextOccurrence } from '@/lib/reminders/matches-date'
import { toaster } from '@/lib/toaster'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { ReminderForm } from './ReminderForm'
import type { Account, Category, ReminderWithCategory } from '@/types/database.types'

const FREQUENCY_LABELS: Record<string, string> = {
  once: 'una vez',
  weekly: 'semanal',
  monthly: 'mensual',
  yearly: 'anual',
}

const DAY_MS = 24 * 60 * 60 * 1000

interface Props {
  userId: string
  reminders: ReminderWithCategory[]
  categories: Category[]
  accounts?: Account[]
  onRefresh: () => void
}

/** Grid of reminder cards, soonest first, with the next due date as a mono block. */
export function RemindersList({ userId, reminders, categories, accounts = [], onRefresh }: Props) {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingReminder, setEditingReminder] = useState<ReminderWithCategory | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const sorted = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return reminders
      .map((r) => {
        const next = nextOccurrence(r, today)
        return { reminder: r, next, daysAway: next ? Math.round((next.getTime() - today.getTime()) / DAY_MS) : null }
      })
      .sort((a, b) => (a.daysAway ?? Infinity) - (b.daysAway ?? Infinity))
  }, [reminders])

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
    <Box w="full">
      {reminders.length === 0 ? (
        <Text color="text3" fontSize="sm">
          No tienes recordatorios. Crea uno para verlo en el calendario.
        </Text>
      ) : (
        <Grid templateColumns="repeat(auto-fill, minmax(260px, 1fr))" gap={3}>
          {sorted.map(({ reminder: r, next, daysAway }) => {
            const thisWeek = daysAway !== null && daysAway <= 7
            return (
              <Flex
                key={r.id}
                align="center"
                gap={3.5}
                bg="surface"
                borderRadius="tile"
                p={4}
                opacity={r.is_active ? 1 : 0.5}
              >
                <Flex
                  direction="column"
                  align="center"
                  justify="center"
                  boxSize="48px"
                  borderRadius="14px"
                  flexShrink={0}
                  fontFamily="mono"
                  bg={thisWeek ? 'warn' : 'surface2'}
                  color={thisWeek ? 'bg' : 'text'}
                >
                  {next ? (
                    <>
                      <Text fontSize="17px" fontWeight="600" lineHeight="1">
                        {next.getDate()}
                      </Text>
                      <Text fontSize="10px" textTransform="uppercase" mt={0.5} opacity={0.8}>
                        {next.toLocaleDateString('es-CO', { month: 'short' }).replace('.', '')}
                      </Text>
                    </>
                  ) : (
                    <Text fontSize="12px">—</Text>
                  )}
                </Flex>

                <Box flex="1" minW={0}>
                  <Text fontSize="14px" fontWeight="500" color="text" truncate>
                    {r.category?.icon ?? '🔔'} {r.description}
                  </Text>
                  <Text fontSize="12px" color="text3" truncate>
                    {[r.category?.name, FREQUENCY_LABELS[r.frequency], r.type === 'income' ? 'ingreso' : null]
                      .filter(Boolean)
                      .join(' · ')}
                    {daysAway === 0 && ' · hoy'}
                    {daysAway === 1 && ' · mañana'}
                  </Text>
                </Box>

                <Menu.Root positioning={{ placement: 'bottom-end' }}>
                  <Menu.Trigger asChild>
                    <IconButton aria-label={`Opciones de ${r.description}`} size="xs" variant="ghost" color="text3" _hover={{ color: 'text', bg: 'surface2' }}>
                      <LuEllipsisVertical />
                    </IconButton>
                  </Menu.Trigger>
                  <Portal>
                    <Menu.Positioner>
                      <Menu.Content bg="surface" borderRadius="tile" boxShadow="overlay" minW="36">
                        <Menu.Item value="edit" onClick={() => { setEditingReminder(r); setIsFormOpen(true) }}>
                          <LuPencil />
                          Editar
                        </Menu.Item>
                        <Menu.Item value="delete" color="neg" onClick={() => setDeletingId(r.id)}>
                          <LuTrash2 />
                          Eliminar
                        </Menu.Item>
                      </Menu.Content>
                    </Menu.Positioner>
                  </Portal>
                </Menu.Root>
              </Flex>
            )
          })}
        </Grid>
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
    </Box>
  )
}
