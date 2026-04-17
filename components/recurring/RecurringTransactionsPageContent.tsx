'use client'

import { VStack, Heading, Button, HStack } from '@chakra-ui/react'
import { useState } from 'react'
import { FiPlus } from 'react-icons/fi'
import { RecurringTransactionForm } from '@/components/recurring/RecurringTransactionForm'
import { RecurringTransactionsList } from '@/components/recurring/RecurringTransactionsList'
import type { Category } from '@/types/database.types'

interface Props {
  userId: string
  categories: Category[]
}

export function RecurringTransactionsPageContent({ userId, categories }: Props) {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [refresh, setRefresh] = useState(0)

  return (
    <VStack alignItems="flex-start" gap={6}>
      <HStack justifyContent="space-between" width="100%">
        <Heading size="lg">Gastos Recurrentes</Heading>
        <Button bg="#4F46E5" color="white" _hover={{ bg: '#4338CA' }} onClick={() => setIsFormOpen(true)}>
          <FiPlus />
          Nueva Recurrente
        </Button>
      </HStack>

      <RecurringTransactionForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        userId={userId}
        categories={categories}
        onSuccess={() => {
          setRefresh((prev) => prev + 1)
          setIsFormOpen(false)
        }}
      />

      <RecurringTransactionsList userId={userId} refresh={refresh} />
    </VStack>
  )
}
