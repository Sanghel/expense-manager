'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Button,
  IconButton,
  Switch,
  Separator,
} from '@chakra-ui/react'
import { FiCheckCircle, FiClock, FiX } from 'react-icons/fi'
import { PayReminderDialog } from '@/components/reminders/PayReminderDialog'
import {
  dismissReminderOccurrence,
  snoozeReminderOccurrence,
  toggleReminderActive,
} from '@/lib/actions/reminders.actions'
import { toaster } from '@/lib/toaster'
import { getLocalDateString } from '@/lib/utils/dates'
import type {
  OccurrenceStatus,
  ReminderOccurrence,
} from '@/lib/reminders/pending'
import type { Account } from '@/types/database.types'

interface Props {
  userId: string
  accounts: Account[]
  occurrences: ReminderOccurrence[]
  onClosePanel: () => void
}

const SECTIONS: { status: OccurrenceStatus; label: string; palette: string }[] =
  [
    { status: 'overdue', label: 'Vencidos', palette: 'red' },
    { status: 'today', label: 'Hoy', palette: 'purple' },
    { status: 'upcoming', label: 'Próximos', palette: 'gray' },
  ]

function formatDate(date: string): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
  })
}

function addDays(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return getLocalDateString(d)
}

export function NotificationsPanel({
  userId,
  accounts,
  occurrences,
  onClosePanel,
}: Props) {
  const router = useRouter()
  const [settling, setSettling] = useState<ReminderOccurrence | null>(null)
  const [busyKey, setBusyKey] = useState<string | null>(null)

  const grouped = useMemo(
    () =>
      SECTIONS.map((section) => ({
        ...section,
        items: occurrences.filter((o) => o.status === section.status),
      })).filter((section) => section.items.length > 0),
    [occurrences]
  )

  const runAction = async (
    key: string,
    action: () => Promise<{ success: boolean; error?: string }>,
    successTitle: string
  ) => {
    setBusyKey(key)
    const result = await action()
    setBusyKey(null)

    if (result.success) {
      toaster.create({ title: successTitle, type: 'success', duration: 2500 })
      router.refresh()
    } else {
      toaster.create({
        title: result.error || 'Error',
        type: 'error',
        duration: 4000,
      })
    }
  }

  return (
    <>
      <Box p={4} maxH="70vh" overflowY="auto">
        <HStack justify="space-between" mb={3}>
          <Text fontWeight="semibold" color="white">
            Recordatorios
          </Text>
          <Link href="/movimientos?tab=recordatorios" onClick={onClosePanel}>
            <Text fontSize="xs" color="#8B93FF">
              Ver todos
            </Text>
          </Link>
        </HStack>

        {grouped.length === 0 ? (
          <Text fontSize="sm" color="#B0B0B0" py={4} textAlign="center">
            Nada pendiente. Todo al día. 🎉
          </Text>
        ) : (
          <VStack align="stretch" gap={4}>
            {grouped.map((section) => (
              <VStack key={section.status} align="stretch" gap={2}>
                <HStack gap={2}>
                  <Text
                    fontSize="xs"
                    color="#B0B0B0"
                    textTransform="uppercase"
                    letterSpacing="wide"
                  >
                    {section.label}
                  </Text>
                  <Badge
                    size="sm"
                    colorPalette={section.palette}
                    variant="subtle"
                  >
                    {section.items.length}
                  </Badge>
                </HStack>

                {section.items.map((occurrence) => {
                  const key = `${occurrence.reminder.id}|${occurrence.date}`
                  const isIncome = occurrence.reminder.type === 'income'

                  return (
                    <Box
                      key={key}
                      borderWidth="1px"
                      borderColor={
                        section.status === 'overdue' ? '#7f1d33' : '#2d2d35'
                      }
                      borderRadius="lg"
                      bg="#1a1a23"
                      px={3}
                      py={2}
                    >
                      <VStack align="stretch" gap={2}>
                        <HStack justify="space-between" align="start" gap={2}>
                          <VStack align="start" gap={1} minW={0}>
                            <Text fontSize="sm" color="white" lineClamp={1}>
                              {occurrence.reminder.category?.icon ?? '🔔'}{' '}
                              {occurrence.reminder.description}
                            </Text>
                            <HStack gap={2} flexWrap="wrap">
                              <Text fontSize="xs" color="#B0B0B0">
                                {formatDate(occurrence.date)}
                              </Text>
                              <Badge
                                size="sm"
                                variant="outline"
                                colorPalette={isIncome ? 'green' : 'red'}
                              >
                                {isIncome ? 'Ingreso' : 'Gasto'}
                              </Badge>
                            </HStack>
                          </VStack>

                          <HStack gap={0}>
                            <IconButton
                              aria-label="Posponer una semana"
                              title="Posponer una semana"
                              size="xs"
                              variant="ghost"
                              color="#B0B0B0"
                              loading={busyKey === `snooze-${key}`}
                              onClick={() =>
                                runAction(
                                  `snooze-${key}`,
                                  () =>
                                    snoozeReminderOccurrence(
                                      userId,
                                      occurrence.reminder.id,
                                      occurrence.date,
                                      addDays(7)
                                    ),
                                  'Recordatorio pospuesto'
                                )
                              }
                            >
                              <FiClock />
                            </IconButton>
                            <IconButton
                              aria-label="Descartar"
                              title="Descartar"
                              size="xs"
                              variant="ghost"
                              color="#B0B0B0"
                              loading={busyKey === `dismiss-${key}`}
                              onClick={() =>
                                runAction(
                                  `dismiss-${key}`,
                                  () =>
                                    dismissReminderOccurrence(
                                      userId,
                                      occurrence.reminder.id,
                                      occurrence.date
                                    ),
                                  'Recordatorio descartado'
                                )
                              }
                            >
                              <FiX />
                            </IconButton>
                          </HStack>
                        </HStack>

                        <HStack justify="space-between" gap={2}>
                          <Button
                            size="xs"
                            bg="#10B981"
                            color="white"
                            _hover={{ bg: '#059669' }}
                            onClick={() => setSettling(occurrence)}
                          >
                            <FiCheckCircle />
                            {isIncome ? 'Registrar ingreso' : 'Registrar pago'}
                          </Button>

                          <Switch.Root
                            size="sm"
                            checked={occurrence.reminder.is_active}
                            disabled={busyKey === `toggle-${key}`}
                            onCheckedChange={({ checked }) =>
                              runAction(
                                `toggle-${key}`,
                                () =>
                                  toggleReminderActive(
                                    userId,
                                    occurrence.reminder.id,
                                    checked
                                  ),
                                checked
                                  ? 'Recordatorio activado'
                                  : 'Recordatorio desactivado'
                              )
                            }
                          >
                            <Switch.HiddenInput />
                            <Switch.Control />
                            <Switch.Label fontSize="xs" color="#B0B0B0">
                              Activo
                            </Switch.Label>
                          </Switch.Root>
                        </HStack>
                      </VStack>
                    </Box>
                  )
                })}

                <Separator borderColor="#2d2d35" />
              </VStack>
            ))}
          </VStack>
        )}
      </Box>

      {settling && (
        <PayReminderDialog
          isOpen
          onClose={() => setSettling(null)}
          userId={userId}
          accounts={accounts}
          reminder={settling.reminder}
          date={settling.date}
          onSuccess={() => {
            setSettling(null)
            onClosePanel()
            router.refresh()
          }}
        />
      )}
    </>
  )
}
