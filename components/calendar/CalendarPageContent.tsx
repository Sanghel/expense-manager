'use client'

import { VStack, HStack, Heading, Box, Text, Button } from '@chakra-ui/react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TransactionCalendar } from '@/components/calendar/TransactionCalendar'
import { RemindersCalendar } from '@/components/calendar/RemindersCalendar'
import { RemindersList } from '@/components/reminders/RemindersList'
import type { TransactionWithCategory, Account, Category, ReminderWithCategory } from '@/types/database.types'

interface Props {
  userId: string
  initialTransactions: TransactionWithCategory[]
  categories: Category[]
  accounts: Account[]
  reminders: ReminderWithCategory[]
}

type Tab = 'transactions' | 'scheduled'

export function CalendarPageContent({ userId, initialTransactions, categories, accounts, reminders }: Props) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('transactions')

  return (
    <VStack alignItems="flex-start" gap={6} w="full">
      <Heading size="lg">Calendario</Heading>

      {/* Tab bar */}
      <HStack gap={0} borderWidth="1px" borderRadius="lg" borderColor="#2d2d35" overflow="hidden" w="fit-content">
        <Button
          size="sm"
          variant="ghost"
          px={5}
          py={2}
          borderRadius="0"
          bg={activeTab === 'transactions' ? '#4F46E5' : 'transparent'}
          color={activeTab === 'transactions' ? 'white' : '#B0B0B0'}
          _hover={{ bg: activeTab === 'transactions' ? '#4338CA' : '#1a1a23' }}
          onClick={() => setActiveTab('transactions')}
        >
          📅 Transacciones
        </Button>
        <Box w="1px" bg="#2d2d35" h="full" />
        <Button
          size="sm"
          variant="ghost"
          px={5}
          py={2}
          borderRadius="0"
          bg={activeTab === 'scheduled' ? '#4F46E5' : 'transparent'}
          color={activeTab === 'scheduled' ? 'white' : '#B0B0B0'}
          _hover={{ bg: activeTab === 'scheduled' ? '#4338CA' : '#1a1a23' }}
          onClick={() => setActiveTab('scheduled')}
        >
          🔔 Programado
        </Button>
      </HStack>

      {activeTab === 'transactions' && (
        <TransactionCalendar
          userId={userId}
          initialTransactions={initialTransactions}
          categories={categories}
          accounts={accounts}
          onTransactionCreated={() => router.refresh()}
        />
      )}

      {activeTab === 'scheduled' && (
        <VStack gap={6} align="stretch" w="full">
          <Text fontSize="sm" color="#B0B0B0">
            Haz clic en un día para ver detalles, registrar un pago de un recordatorio o crear uno nuevo.
          </Text>

          <RemindersCalendar
            userId={userId}
            reminders={reminders}
            categories={categories}
            accounts={accounts}
            onRefresh={() => router.refresh()}
          />

          <RemindersList
            userId={userId}
            reminders={reminders}
            categories={categories}
            accounts={accounts}
            onRefresh={() => router.refresh()}
          />
        </VStack>
      )}
    </VStack>
  )
}
