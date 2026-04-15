'use client'

import {
  Box,
  Heading,
  Button,
  HStack,
  useDisclosure,
  Spinner,
  Center,
  Text,
} from '@chakra-ui/react'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { FiPlus } from 'react-icons/fi'
import { Card } from '@/components/ui/Card'
import { TransactionForm } from '@/components/transactions/TransactionForm'
import { TransactionEditForm } from '@/components/transactions/TransactionEditForm'
import { TransactionsTable } from '@/components/transactions/TransactionsTable'
import { TransactionsFilter, type FilterState } from '@/components/transactions/TransactionsFilter'
import { getTransactions } from '@/lib/actions/transactions.actions'
import type { Category, TransactionWithCategory } from '@/types/database.types'

const PAGE_SIZE = 20

interface Props {
  userId: string
  categories: Category[]
}

const defaultFilters: FilterState = {
  search: '',
  type: '',
  category_id: '',
  month: '',
}

export function TransactionsPageClient({ userId, categories }: Props) {
  const { open: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure()
  const { open: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure()

  const [transactions, setTransactions] = useState<TransactionWithCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [editingTransaction, setEditingTransaction] = useState<TransactionWithCategory | null>(null)
  const [filters, setFilters] = useState<FilterState>(defaultFilters)
  const [page, setPage] = useState(1)

  const fetchTransactions = useCallback(async () => {
    setLoading(true)
    const result = await getTransactions(userId, 500)
    if (result.success && result.data) {
      setTransactions(result.data as TransactionWithCategory[])
    }
    setLoading(false)
  }, [userId])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  useEffect(() => {
    setPage(1)
  }, [filters])

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (filters.search && !t.description.toLowerCase().includes(filters.search.toLowerCase())) {
        return false
      }
      if (filters.type && t.type !== filters.type) return false
      if (filters.category_id && t.category_id !== filters.category_id) return false
      if (filters.month) {
        const txMonth = t.date.slice(0, 7)
        if (txMonth !== filters.month) return false
      }
      return true
    })
  }, [transactions, filters])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleEdit = (transaction: TransactionWithCategory) => {
    setEditingTransaction(transaction)
    onEditOpen()
  }

  const handleEditClose = () => {
    // Do NOT clear editingTransaction here. Doing so unmounts TransactionEditForm
    // in the same React commit as isOpen→false, which tears down the dialog DOM
    // before Zag can call layerStack.remove(node) — the node is already gone,
    // remove() short-circuits, and body.style.pointerEvents="none" gets stuck.
    // editingTransaction is updated on the next open, so leaving it set is safe.
    onEditClose()
  }

  return (
    <Box>
      <HStack justify="space-between" mb={6}>
        <Heading size="lg">Transacciones</Heading>
        <Button colorPalette="brand" onClick={onCreateOpen}>
          <FiPlus />
          Nueva Transacción
        </Button>
      </HStack>

      <TransactionsFilter
        filters={filters}
        onChange={setFilters}
        categories={categories}
      />

      <Card overflowX="auto">
        {loading ? (
          <Center py={10}>
            <Spinner size="lg" />
          </Center>
        ) : (
          <>
            <TransactionsTable
              transactions={paginated}
              userId={userId}
              onUpdate={fetchTransactions}
              onEdit={handleEdit}
            />

            {totalPages > 1 && (
              <HStack justify="center" mt={4} gap={2}>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Anterior
                </Button>
                <Text fontSize="sm" color="gray.600">
                  Página {page} de {totalPages}
                </Text>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Siguiente
                </Button>
              </HStack>
            )}
          </>
        )}
      </Card>

      <TransactionForm
        isOpen={isCreateOpen}
        onClose={onCreateClose}
        userId={userId}
        categories={categories}
        onSuccess={fetchTransactions}
      />

      {editingTransaction && (
        <TransactionEditForm
          isOpen={isEditOpen}
          onClose={handleEditClose}
          userId={userId}
          categories={categories}
          transaction={editingTransaction}
          onSuccess={fetchTransactions}
        />
      )}
    </Box>
  )
}
