'use client'

import {
  Box,
  Heading,
  Button,
  HStack,
  useDisclosure,
  Text,
} from '@chakra-ui/react'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { FiPlus } from 'react-icons/fi'
import { Card } from '@/components/ui/Card'
import { TransactionForm } from '@/components/transactions/TransactionForm'
import { TransactionEditForm } from '@/components/transactions/TransactionEditForm'
import { TransactionsTable } from '@/components/transactions/TransactionsTable'
import { TransactionsFilter, type FilterState } from '@/components/transactions/TransactionsFilter'
import { useDebounce } from '@/hooks/useDebounce'
import type { Category, TransactionWithCategory } from '@/types/database.types'

const PAGE_SIZE = 20

interface Props {
  userId: string
  categories: Category[]
  initialTransactions: TransactionWithCategory[]
}

const defaultFilters: FilterState = {
  search: '',
  type: '',
  category_id: '',
  month: '',
}

export function TransactionsPageClient({ userId, categories, initialTransactions }: Props) {
  const router = useRouter()
  const { open: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure()
  const { open: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure()

  const [transactions] = useState<TransactionWithCategory[]>(initialTransactions)
  const [editingTransaction, setEditingTransaction] = useState<TransactionWithCategory | null>(null)
  const [filters, setFilters] = useState<FilterState>(defaultFilters)
  const [page, setPage] = useState(1)

  const debouncedSearch = useDebounce(filters.search, 300)

  useEffect(() => {
    setPage(1)
  }, [filters])

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (debouncedSearch && !t.description.toLowerCase().includes(debouncedSearch.toLowerCase())) {
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
  }, [transactions, debouncedSearch, filters.type, filters.category_id, filters.month])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleEdit = useCallback((transaction: TransactionWithCategory) => {
    setEditingTransaction(transaction)
    onEditOpen()
  }, [onEditOpen])

  const handleEditClose = useCallback(() => {
    // Do NOT clear editingTransaction here. Doing so unmounts TransactionEditForm
    // in the same React commit as isOpen→false, which tears down the dialog DOM
    // before Zag can call layerStack.remove(node) — the node is already gone,
    // remove() short-circuits, and body.style.pointerEvents="none" gets stuck.
    // editingTransaction is updated on the next open, so leaving it set is safe.
    onEditClose()
  }, [onEditClose])

  return (
    <Box>
      <HStack justify="space-between" mb={{ base: 4, md: 6 }}>
        <Heading size={{ base: 'md', md: 'lg' }} color="white">Transacciones</Heading>
        <Button bg="#4F46E5" color="white" _hover={{ bg: '#4338CA' }} onClick={onCreateOpen} size={{ base: 'sm', md: 'md' }}>
          <FiPlus />
          <Text display={{ base: 'none', sm: 'inline' }}>Nueva Transacción</Text>
          <Text display={{ base: 'inline', sm: 'none' }}>Nueva</Text>
        </Button>
      </HStack>

      <TransactionsFilter
        filters={filters}
        onChange={setFilters}
        categories={categories}
      />

      <Card overflowX="auto">
        <TransactionsTable
          transactions={paginated}
          userId={userId}
          onUpdate={() => router.refresh()}
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
            <Text fontSize="sm" color="#B0B0B0">
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
      </Card>

      <TransactionForm
        isOpen={isCreateOpen}
        onClose={onCreateClose}
        userId={userId}
        categories={categories}
        onSuccess={() => router.refresh()}
      />

      {editingTransaction && (
        <TransactionEditForm
          isOpen={isEditOpen}
          onClose={handleEditClose}
          userId={userId}
          categories={categories}
          transaction={editingTransaction}
          onSuccess={() => { router.refresh(); handleEditClose() }}
        />
      )}
    </Box>
  )
}
