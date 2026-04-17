'use client'

import { VStack, Heading, Button, HStack } from '@chakra-ui/react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FiPlus } from 'react-icons/fi'
import { RecurringTransactionForm } from '@/components/recurring/RecurringTransactionForm'
import { RecurringTransactionsList } from '@/components/recurring/RecurringTransactionsList'
import type { Category, RecurringTransactionWithCategory } from '@/types/database.types'

interface Props {
  userId: string
  categories: Category[]
  initialTransactions: RecurringTransactionWithCategory[]
}

export function RecurringTransactionsPageContent({ userId, categories, initialTransactions }: Props) {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<RecurringTransactionWithCategory | null>(null)
  const router = useRouter()

  const handleClose = () => {
    setIsFormOpen(false)
    setEditingTransaction(null)
  }

  return (
    <VStack alignItems="flex-start" gap={{ base: 4, md: 6 }}>
      <HStack justifyContent="space-between" width="100%">
        <Heading size={{ base: 'md', md: 'lg' }}>Gastos Recurrentes</Heading>
        <Button bg="#4F46E5" color="white" _hover={{ bg: '#4338CA' }} onClick={() => setIsFormOpen(true)} size={{ base: 'sm', md: 'md' }}>
          <FiPlus />
          Nueva Recurrente
        </Button>
      </HStack>

      <RecurringTransactionForm
        isOpen={isFormOpen || !!editingTransaction}
        onClose={handleClose}
        userId={userId}
        categories={categories}
        initialData={editingTransaction ?? undefined}
        transactionId={editingTransaction?.id}
        onSuccess={() => {
          router.refresh()
          handleClose()
        }}
      />

      <RecurringTransactionsList
        userId={userId}
        transactions={initialTransactions}
        onEdit={setEditingTransaction}
      />
    </VStack>
  )
}
