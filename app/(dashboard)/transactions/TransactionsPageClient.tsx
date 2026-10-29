'use client'

import { Box, Flex, Input, NativeSelect, Text, useDisclosure } from '@chakra-ui/react'
import { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { LuSearch } from 'react-icons/lu'
import { Card } from '@/components/ui/Card'
import { ActionIconButton } from '@/components/ui/ActionIconButton'
import { TransactionForm } from '@/components/transactions/TransactionForm'
import { TransactionEditForm } from '@/components/transactions/TransactionEditForm'
import { TransactionsTable } from '@/components/transactions/TransactionsTable'
import {
  TransactionsRail,
  DEFAULT_FILTERS,
  type FilterState,
} from '@/components/transactions/TransactionsRail'
import { ExportTransactionsModal } from '@/components/transactions/ExportTransactionsModal'
import { ImportTransactionsModal } from '@/components/transactions/ImportTransactionsModal'
import { GmailSyncButton } from '@/components/transactions/GmailSyncButton'
import { useDebounce } from '@/hooks/useDebounce'
import type {
  Account,
  Category,
  TransactionWithCategory,
} from '@/types/database.types'

const PAGE_SIZE = 20

interface Props {
  userId: string
  categories: Category[]
  initialTransactions: TransactionWithCategory[]
  accounts?: Account[]
  gmailSyncEnabled?: boolean
}

/** The last 12 months as `YYYY-MM`, built from day 1 so short months don't repeat. */
function lastTwelveMonths(): { value: string; label: string }[] {
  const now = new Date()
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    return {
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleDateString('es-CO', { month: 'short', year: 'numeric' }).replace('.', '').replace(' de ', ' '),
    }
  })
}

export function TransactionsPageClient({
  userId,
  categories,
  initialTransactions: transactions,
  accounts = [],
  gmailSyncEnabled = false,
}: Props) {
  const router = useRouter()
  const { open: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure()
  const { open: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure()
  const { open: isExportOpen, onOpen: onExportOpen, onClose: onExportClose } = useDisclosure()
  const { open: isImportOpen, onOpen: onImportOpen, onClose: onImportClose } = useDisclosure()

  const [editingTransaction, setEditingTransaction] = useState<TransactionWithCategory | null>(null)
  const [filters, setFiltersState] = useState<FilterState>(DEFAULT_FILTERS)
  const [page, setPage] = useState(1)
  const months = useMemo(() => lastTwelveMonths(), [])

  // Any filter change goes back to the first page.
  const setFilters = useCallback((next: FilterState) => {
    setFiltersState(next)
    setPage(1)
  }, [])

  const debouncedSearch = useDebounce(filters.search, 300)

  const filtered = useMemo(() => {
    const search = debouncedSearch.toLowerCase()
    return transactions.filter((t) => {
      if (search && !t.description.toLowerCase().includes(search)) return false
      if (filters.type && t.type !== filters.type) return false
      if (filters.category_id && t.category_id !== filters.category_id) return false
      if (filters.account_ids.length > 0 && !filters.account_ids.includes(t.account_id ?? '')) return false
      if (filters.month && t.date.slice(0, 7) !== filters.month) return false
      return true
    })
  }, [transactions, debouncedSearch, filters.type, filters.category_id, filters.account_ids, filters.month])

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

  const gmailButton = (variant: 'icon' | 'rail') =>
    gmailSyncEnabled ? (
      <GmailSyncButton userId={userId} categories={categories} accounts={accounts} variant={variant} />
    ) : null

  return (
    <Box>
      <Flex direction={{ base: 'column', lg: 'row' }} gap={{ base: 6, lg: 8 }} align="flex-start">
        <TransactionsRail
          filters={filters}
          onChange={setFilters}
          categories={categories}
          accounts={accounts}
          onCreate={onCreateOpen}
          onImport={onImportOpen}
          onExport={onExportOpen}
          gmailSync={gmailButton('rail')}
        />

        <Box flex="1" minW={0} w="full">
          {/* Search pill with the month filter and a Gmail shortcut */}
          <Flex align="center" gap={2} h="44px" bg="surface" borderRadius="pill" ps={4} pe={1.5} mb={4}>
            <LuSearch color="var(--chakra-colors-text3)" />
            <Input
              placeholder="Buscar descripción…"
              aria-label="Buscar descripción"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              variant="flushed"
              borderBottomWidth="0"
              _focusVisible={{ boxShadow: 'none' }}
              flex="1"
              minW={0}
              h="full"
              px={0}
              bg="transparent"
              fontSize="14px"
            />
            <NativeSelect.Root size="sm" w="auto" flexShrink={0}>
              <NativeSelect.Field
                aria-label="Mes"
                value={filters.month}
                onChange={(e) => setFilters({ ...filters, month: e.target.value })}
                h="32px"
                borderRadius="pill"
                bg="surface2"
                borderColor="transparent"
                fontFamily="mono"
                fontSize="12px"
                ps={3}
                pe={7}
              >
                <option value="">Todos los meses</option>
                {months.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </NativeSelect.Field>
              <NativeSelect.Indicator color="text3" />
            </NativeSelect.Root>
            {gmailButton('icon')}
          </Flex>

          <Card px={{ base: 3, md: 2 }} py={3}>
            <TransactionsTable
              transactions={paginated}
              accounts={accounts}
              userId={userId}
              onUpdate={() => router.refresh()}
              onEdit={handleEdit}
            />

            {totalPages > 1 && (
              <Flex justify="center" align="center" mt={4} gap={2}>
                <ActionIconButton
                  kind="prev"
                  label="Página anterior"
                  size="sm"
                  variant="ghost"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                />
                <Text fontFamily="mono" fontSize="12px" color="text3">
                  {page} / {totalPages}
                </Text>
                <ActionIconButton
                  kind="next"
                  label="Página siguiente"
                  size="sm"
                  variant="ghost"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                />
              </Flex>
            )}
          </Card>
        </Box>
      </Flex>

      <TransactionForm
        isOpen={isCreateOpen}
        onClose={onCreateClose}
        userId={userId}
        categories={categories}
        accounts={accounts}
        history={transactions}
        onSuccess={() => router.refresh()}
      />

      <ExportTransactionsModal
        isOpen={isExportOpen}
        onClose={onExportClose}
        userId={userId}
      />

      <ImportTransactionsModal
        isOpen={isImportOpen}
        onClose={onImportClose}
        userId={userId}
        onSuccess={() => router.refresh()}
      />

      {editingTransaction && (
        <TransactionEditForm
          isOpen={isEditOpen}
          onClose={handleEditClose}
          userId={userId}
          categories={categories}
          accounts={accounts}
          transaction={editingTransaction}
          onSuccess={() => { router.refresh(); handleEditClose() }}
        />
      )}
    </Box>
  )
}
