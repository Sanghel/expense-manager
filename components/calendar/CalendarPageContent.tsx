'use client'

import { VStack, Heading } from '@chakra-ui/react'
import { useRouter } from 'next/navigation'
import { TransactionCalendar } from '@/components/calendar/TransactionCalendar'
import type { TransactionWithCategory, Account, Category } from '@/types/database.types'

interface Props {
  userId: string
  initialTransactions: TransactionWithCategory[]
  categories: Category[]
  accounts: Account[]
}

export function CalendarPageContent({ userId, initialTransactions, categories, accounts }: Props) {
  const router = useRouter()

  return (
    <VStack alignItems="flex-start" gap={6}>
      <Heading size="lg">Calendario de Transacciones</Heading>
      <TransactionCalendar
        userId={userId}
        initialTransactions={initialTransactions}
        categories={categories}
        accounts={accounts}
        onTransactionCreated={() => router.refresh()}
      />
    </VStack>
  )
}
