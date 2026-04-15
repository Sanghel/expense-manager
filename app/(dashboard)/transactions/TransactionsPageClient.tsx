'use client'

import {
  Box,
  Heading,
  Button,
  HStack,
  useDisclosure,
  Spinner,
  Center,
} from '@chakra-ui/react'
import { useState, useEffect, useCallback } from 'react'
import { FiPlus } from 'react-icons/fi'
import { Card } from '@/components/ui/Card'
import { TransactionForm } from '@/components/transactions/TransactionForm'
import { TransactionsTable } from '@/components/transactions/TransactionsTable'
import { getTransactions } from '@/lib/actions/transactions.actions'
import type { Category, TransactionWithCategory } from '@/types/database.types'

interface Props {
  userId: string
  categories: Category[]
}

export function TransactionsPageClient({ userId, categories }: Props) {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [transactions, setTransactions] = useState<TransactionWithCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [editingTransaction, setEditingTransaction] = useState<TransactionWithCategory | null>(null)

  const fetchTransactions = useCallback(async () => {
    setLoading(true)
    const result = await getTransactions(userId, 100)
    if (result.success && result.data) {
      setTransactions(result.data as TransactionWithCategory[])
    }
    setLoading(false)
  }, [userId])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  const handleEdit = (transaction: TransactionWithCategory) => {
    setEditingTransaction(transaction)
    onOpen()
  }

  const handleClose = () => {
    setEditingTransaction(null)
    onClose()
  }

  return (
    <Box>
      <HStack justify="space-between" mb={8}>
        <Heading size="lg">Transacciones</Heading>
        <Button leftIcon={<FiPlus />} colorScheme="brand" onClick={onOpen}>
          Nueva Transacción
        </Button>
      </HStack>

      <Card overflowX="auto">
        {loading ? (
          <Center py={10}>
            <Spinner size="lg" />
          </Center>
        ) : (
          <TransactionsTable
            transactions={transactions}
            userId={userId}
            onUpdate={fetchTransactions}
            onEdit={handleEdit}
          />
        )}
      </Card>

      <TransactionForm
        isOpen={isOpen && !editingTransaction}
        onClose={handleClose}
        userId={userId}
        categories={categories}
        onSuccess={fetchTransactions}
      />
    </Box>
  )
}
