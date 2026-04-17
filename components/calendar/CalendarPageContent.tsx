'use client'

import { VStack, Heading } from '@chakra-ui/react'
import { TransactionCalendar } from '@/components/calendar/TransactionCalendar'
import type { TransactionWithCategory } from '@/types/database.types'

interface Props {
  userId: string
  initialTransactions: TransactionWithCategory[]
}

export function CalendarPageContent({ userId, initialTransactions }: Props) {
  return (
    <VStack alignItems="flex-start" gap={6}>
      <Heading size="lg">Calendario de Transacciones</Heading>
      <TransactionCalendar userId={userId} initialTransactions={initialTransactions} />
    </VStack>
  )
}
