'use client'

import { VStack, Heading } from '@chakra-ui/react'
import { useSession } from 'next-auth/react'
import { TransactionCalendar } from '@/components/calendar/TransactionCalendar'

export default function CalendarPage() {
  const { data: session } = useSession()

  if (!session?.user?.id) return null

  return (
    <VStack alignItems="flex-start" gap={6}>
      <Heading size="lg">Calendario de Transacciones</Heading>
      <TransactionCalendar userId={session.user.id} />
    </VStack>
  )
}
