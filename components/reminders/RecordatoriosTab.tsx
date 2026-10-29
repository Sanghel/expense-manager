'use client'

import { VStack, Button, Box, Flex, Text } from '@chakra-ui/react'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LuCircleCheck, LuPlus } from 'react-icons/lu'
import { ReminderForm } from '@/components/reminders/ReminderForm'
import { RemindersList } from '@/components/reminders/RemindersList'
import { PayReminderDialog } from '@/components/reminders/PayReminderDialog'
import { remindersForDate } from '@/lib/reminders/matches-date'
import { Card } from '@/components/ui/Card'
import type { Account, Category, ReminderWithCategory } from '@/types/database.types'

interface Props {
  userId: string
  categories: Category[]
  accounts: Account[]
  initialReminders: ReminderWithCategory[]
  todaysTransactions: { description: string; category_id: string | null }[]
}

export function RecordatoriosTab({
  userId,
  categories,
  accounts,
  initialReminders,
  todaysTransactions,
}: Props) {
  const router = useRouter()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [payingReminder, setPayingReminder] = useState<ReminderWithCategory | null>(null)

  const refresh = () => router.refresh()
  const today = useMemo(() => new Date(), [])

  const pinnedToday = useMemo(() => {
    const matches = remindersForDate(initialReminders, today)
    return matches.filter(
      (r) =>
        !todaysTransactions.some(
          (tx) => tx.description === r.description && tx.category_id === r.category_id,
        ),
    )
  }, [initialReminders, today, todaysTransactions])

  // One bar per day for the next 30 days: height = payments due that day;
  // amber when it falls within the next 5 days.
  const strip = useMemo(
    () =>
      Array.from({ length: 30 }, (_, i) => {
        const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i)
        return { date, count: remindersForDate(initialReminders, date).length, soon: i <= 5 }
      }),
    [initialReminders, today]
  )
  const maxCount = Math.max(1, ...strip.map((d) => d.count))
  const dueCount = strip.reduce((sum, d) => sum + d.count, 0)
  const dayLabel = (d: Date) =>
    d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }).replace(' de ', ' ').replace('.', '')

  return (
    <VStack alignItems="stretch" gap={6} w="full">
      <Card>
        <Flex justify="space-between" align="flex-start" gap={4} mb={5}>
          <Box>
            <Text textStyle="cardTitle" color="text">
              Próximos 30 días
            </Text>
            <Text fontSize="12px" color="text3">
              {dueCount === 0
                ? 'Sin pagos programados'
                : `${dueCount} ${dueCount === 1 ? 'pago programado' : 'pagos programados'}`}
            </Text>
          </Box>
          <Button
            bg="brandSolid"
            color="white"
            _hover={{ bg: 'brand.600' }}
            onClick={() => setIsFormOpen(true)}
            size="sm"
            aria-label="Nuevo recordatorio"
          >
            <LuPlus />
            Nuevo
          </Button>
        </Flex>

        <Flex align="flex-end" gap="3px" h="56px" aria-hidden>
          {strip.map((d) => (
            <Box
              key={d.date.toISOString()}
              flex="1"
              title={`${dayLabel(d.date)}: ${d.count} ${d.count === 1 ? 'pago' : 'pagos'}`}
              h={d.count === 0 ? '4px' : `${Math.max(18, (d.count / maxCount) * 100)}%`}
              borderRadius="3px"
              bg={d.count === 0 ? 'track' : d.soon ? 'warn' : 'brand'}
            />
          ))}
        </Flex>
        <Flex justify="space-between" mt={2} fontFamily="mono" fontSize="11px" color="text3">
          <Text color="text">Hoy</Text>
          <Text>{dayLabel(strip[strip.length - 1].date)}</Text>
        </Flex>
      </Card>

      {pinnedToday.length > 0 && (
        <Box>
          <Text textStyle="sectionLabel" color="text3" mb={2.5}>
            Para hoy
          </Text>
          <VStack gap={2} align="stretch">
            {pinnedToday.map((r) => (
              <Flex
                key={r.id}
                align="center"
                justify="space-between"
                gap={3}
                bg="warnSoft"
                borderRadius="tile"
                px={4}
                py={3}
              >
                <Box minW={0}>
                  <Text fontSize="14px" fontWeight="500" color="text" truncate>
                    {r.category?.icon ?? '🔔'} {r.description}
                  </Text>
                  <Text fontSize="12px" color="warn">
                    Vence hoy{r.category ? ` · ${r.category.name}` : ''}
                  </Text>
                </Box>
                <Button
                  size="sm"
                  bg="text"
                  color="bg"
                  _hover={{ opacity: 0.9 }}
                  onClick={() => setPayingReminder(r)}
                  flexShrink={0}
                >
                  <LuCircleCheck />
                  Pagar
                </Button>
              </Flex>
            ))}
          </VStack>
        </Box>
      )}

      <RemindersList
        userId={userId}
        reminders={initialReminders}
        categories={categories}
        accounts={accounts}
        onRefresh={refresh}
      />

      <ReminderForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        userId={userId}
        categories={categories}
        accounts={accounts}
        onSuccess={() => {
          setIsFormOpen(false)
          refresh()
        }}
      />

      {payingReminder && (
        <PayReminderDialog
          isOpen
          onClose={() => setPayingReminder(null)}
          userId={userId}
          accounts={accounts}
          reminder={payingReminder}
          onSuccess={() => {
            setPayingReminder(null)
            refresh()
          }}
        />
      )}
    </VStack>
  )
}
