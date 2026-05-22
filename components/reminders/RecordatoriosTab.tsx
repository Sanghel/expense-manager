'use client'

import { VStack, HStack, Heading, Button, Box, Text, Badge } from '@chakra-ui/react'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FiPlus, FiCheckCircle } from 'react-icons/fi'
import { ReminderForm } from '@/components/reminders/ReminderForm'
import { RemindersList } from '@/components/reminders/RemindersList'
import { TransactionForm } from '@/components/transactions/TransactionForm'
import { remindersForDate } from '@/lib/reminders/matches-date'
import { getLocalDateString } from '@/lib/utils/dates'
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
  const todayStr = getLocalDateString(today)

  const pinnedToday = useMemo(() => {
    const matches = remindersForDate(initialReminders, today)
    return matches.filter(
      (r) =>
        !todaysTransactions.some(
          (tx) => tx.description === r.description && tx.category_id === r.category_id,
        ),
    )
  }, [initialReminders, today, todaysTransactions])

  return (
    <VStack alignItems="flex-start" gap={{ base: 4, md: 6 }} w="full">
      <HStack justifyContent="space-between" width="100%">
        <Heading size={{ base: 'md', md: 'lg' }}>Recordatorios</Heading>
        <Button
          bg="#4F46E5"
          color="white"
          _hover={{ bg: '#4338CA' }}
          onClick={() => setIsFormOpen(true)}
          size={{ base: 'sm', md: 'md' }}
        >
          <FiPlus />
          Nuevo recordatorio
        </Button>
      </HStack>

      {pinnedToday.length > 0 && (
        <VStack gap={2} align="stretch" w="full">
          <Text fontSize="sm" color="#B0B0B0">
            📌 Para hoy
          </Text>
          {pinnedToday.map((r) => (
            <Box
              key={r.id}
              borderWidth="1px"
              borderRadius="xl"
              borderColor="#4F46E5"
              bg="#1a1a2e"
              px={4}
              py={3}
            >
              <HStack justify="space-between" align="center" flexWrap="wrap" gap={3}>
                <VStack align="start" gap={1} flex={1} minW={0}>
                  <Text fontWeight="semibold" color="white">
                    {r.category?.icon ?? '🔔'} {r.description}
                  </Text>
                  <HStack gap={2} flexWrap="wrap">
                    <Badge size="sm" variant="outline" colorPalette="purple">Hoy</Badge>
                    {r.category && (
                      <Text fontSize="xs" color="#B0B0B0">{r.category.name}</Text>
                    )}
                  </HStack>
                </VStack>
                <Button
                  size="sm"
                  bg="#10B981"
                  color="white"
                  _hover={{ bg: '#059669' }}
                  onClick={() => setPayingReminder(r)}
                  flexShrink={0}
                >
                  <FiCheckCircle />
                  Pagar
                </Button>
              </HStack>
            </Box>
          ))}
        </VStack>
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
        <TransactionForm
          isOpen
          onClose={() => setPayingReminder(null)}
          userId={userId}
          categories={categories}
          accounts={accounts}
          initialDate={todayStr}
          lockedDate
          prefillDescription={payingReminder.description}
          prefillCategoryId={payingReminder.category_id ?? undefined}
          onSuccess={() => {
            setPayingReminder(null)
            refresh()
          }}
        />
      )}
    </VStack>
  )
}
