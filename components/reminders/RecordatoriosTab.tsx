'use client'

import { VStack, HStack, Heading, Button } from '@chakra-ui/react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FiPlus } from 'react-icons/fi'
import { ReminderForm } from '@/components/reminders/ReminderForm'
import { RemindersList } from '@/components/reminders/RemindersList'
import type { Category, ReminderWithCategory } from '@/types/database.types'

interface Props {
  userId: string
  categories: Category[]
  initialReminders: ReminderWithCategory[]
}

export function RecordatoriosTab({ userId, categories, initialReminders }: Props) {
  const router = useRouter()
  const [isFormOpen, setIsFormOpen] = useState(false)

  const refresh = () => router.refresh()

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

      <RemindersList
        userId={userId}
        reminders={initialReminders}
        categories={categories}
        onRefresh={refresh}
      />

      <ReminderForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        userId={userId}
        categories={categories}
        onSuccess={() => {
          setIsFormOpen(false)
          refresh()
        }}
      />
    </VStack>
  )
}
