'use client'

import {
  Box, Button, HStack, VStack, Text, Table, IconButton, Badge, Stack,
} from '@chakra-ui/react'
import { useState, useMemo } from 'react'
import { FiEdit2, FiTrash2, FiCheck, FiX } from 'react-icons/fi'
import { FormDialog } from '@/components/ui/FormDialog'
import { CategorySelect } from '@/components/ui/CategorySelect'
import { AccountSelect } from '@/components/ui/AccountSelect'
import { TransactionEditForm } from './TransactionEditForm'
import { commitGmailTransactions } from '@/lib/actions/gmail.actions'
import { toaster } from '@/lib/toaster'
import { formatCurrency } from '@/lib/utils/currency'
import type { Account, Category, Currency, TransactionType, TransactionWithCategory } from '@/types/database.types'
import type { ParsedItem } from '@/lib/gmail/process'

interface ReviewItem {
  parsed: ParsedItem
  edited: {
    type: TransactionType
    amount: number
    currency: Currency
    category_id: string
    account_id: string | null
    description: string
    date: string
    notes: string
  }
  excluded: boolean
}

function initialEdited(p: ParsedItem): ReviewItem['edited'] {
  return {
    type: p.type,
    amount: p.amount,
    currency: p.currency,
    category_id: '',
    account_id: null,
    description: p.description,
    date: p.date,
    notes: '',
  }
}

interface Props {
  isOpen: boolean
  onClose: () => void
  userId: string
  items: ParsedItem[]
  categories: Category[]
  accounts: Account[]
  onDone: () => void
}

export function GmailSyncReviewModal({ isOpen, onClose, userId, items, categories, accounts, onDone }: Props) {
  const [reviews, setReviews] = useState<ReviewItem[]>(
    items.map((p) => ({ parsed: p, edited: initialEdited(p), excluded: false }))
  )
  const [editing, setEditing] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  const activeReviews = useMemo(() => reviews.filter((r) => !r.excluded), [reviews])
  const missingCategory = useMemo(
    () => activeReviews.some((r) => !r.edited.category_id),
    [activeReviews]
  )

  const updateRow = (idx: number, patch: Partial<ReviewItem['edited']>) => {
    setReviews((prev) => prev.map((r, i) => i === idx ? { ...r, edited: { ...r.edited, ...patch } } : r))
  }
  const toggleExclude = (idx: number) => {
    setReviews((prev) => prev.map((r, i) => i === idx ? { ...r, excluded: !r.excluded } : r))
  }

  const handleSave = async () => {
    if (missingCategory) {
      toaster.create({ title: 'Asigna categoría a todas las transacciones', type: 'error' })
      return
    }
    setSaving(true)
    const payload = activeReviews.map((r) => ({
      ...r.parsed,
      type: r.edited.type,
      amount: r.edited.amount,
      currency: r.edited.currency,
      description: r.edited.description,
      date: r.edited.date,
      category_id: r.edited.category_id,
      account_id: r.edited.account_id,
    }))
    const result = await commitGmailTransactions(payload)
    setSaving(false)
    if (!result.success) {
      toaster.create({ title: 'Error', description: result.error, type: 'error' })
      return
    }
    toaster.create({
      title: `${result.created} transacciones registradas`,
      description: result.errors.length > 0 ? `${result.errors.length} con error` : undefined,
      type: result.errors.length > 0 ? 'warning' : 'success',
    })
    onDone()
    onClose()
  }

  const handleDiscard = () => {
    toaster.create({ title: 'No se registró ninguna transacción', type: 'info' })
    onClose()
  }

  const editingReview = editing != null ? reviews[editing] : null
  const editingAsTransaction: TransactionWithCategory | null = editingReview
    ? ({
        id: `staging-${editing}`,
        user_id: userId,
        amount: editingReview.edited.amount,
        currency: editingReview.edited.currency,
        type: editingReview.edited.type,
        category_id: editingReview.edited.category_id || null,
        account_id: editingReview.edited.account_id,
        description: editingReview.edited.description,
        date: editingReview.edited.date,
        notes: editingReview.edited.notes,
        source: 'gmail',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        category: null,
      } as unknown as TransactionWithCategory)
    : null

  return (
    <>
      <FormDialog isOpen={isOpen} onClose={handleDiscard} title={`Revisar ${reviews.length} transacciones detectadas`} size="xl">
        <VStack align="stretch" gap={4}>
          <Text fontSize="sm" color="#B0B0B0">
            Edita categoría, cuenta y otros campos antes de guardar. Las transacciones no se registran hasta que confirmes.
          </Text>

          {/* Desktop: tabla */}
          <Box display={{ base: 'none', md: 'block' }} overflowX="auto">
            <Table.Root size="sm">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader>Fecha</Table.ColumnHeader>
                  <Table.ColumnHeader>Origen</Table.ColumnHeader>
                  <Table.ColumnHeader>Descripción</Table.ColumnHeader>
                  <Table.ColumnHeader>Monto</Table.ColumnHeader>
                  <Table.ColumnHeader>Categoría</Table.ColumnHeader>
                  <Table.ColumnHeader>Cuenta</Table.ColumnHeader>
                  <Table.ColumnHeader>Acciones</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {reviews.map((r, idx) => (
                  <Table.Row key={idx} opacity={r.excluded ? 0.4 : 1}>
                    <Table.Cell>{r.edited.date}</Table.Cell>
                    <Table.Cell><Badge>{r.parsed.source}</Badge></Table.Cell>
                    <Table.Cell maxW="200px" truncate>{r.edited.description}</Table.Cell>
                    <Table.Cell>{formatCurrency(r.edited.amount, r.edited.currency)}</Table.Cell>
                    <Table.Cell>
                      <CategorySelect
                        value={r.edited.category_id}
                        onChange={(v) => updateRow(idx, { category_id: v })}
                        categories={categories}
                        filterByType={r.edited.type}
                        required
                      />
                    </Table.Cell>
                    <Table.Cell>
                      <AccountSelect
                        value={r.edited.account_id ?? ''}
                        onChange={(v) => updateRow(idx, { account_id: v || null })}
                        accounts={accounts}
                        optional
                        placeholder="—"
                      />
                    </Table.Cell>
                    <Table.Cell>
                      <HStack gap={1}>
                        <IconButton aria-label="Editar" size="xs" variant="ghost" onClick={() => setEditing(idx)}><FiEdit2 /></IconButton>
                        <IconButton aria-label={r.excluded ? 'Incluir' : 'Excluir'} size="xs" variant="ghost" color={r.excluded ? '#4ade80' : '#ef4444'} onClick={() => toggleExclude(idx)}>
                          {r.excluded ? <FiCheck /> : <FiTrash2 />}
                        </IconButton>
                      </HStack>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </Box>

          {/* Mobile: cards */}
          <VStack display={{ base: 'flex', md: 'none' }} gap={3} align="stretch">
            {reviews.map((r, idx) => (
              <Box key={idx} borderWidth="1px" borderColor="#2d2d35" borderRadius="md" p={3} bg="#18181d" opacity={r.excluded ? 0.4 : 1}>
                <Stack gap={2}>
                  <HStack justify="space-between">
                    <Badge>{r.parsed.source}</Badge>
                    <Text fontWeight="600">{formatCurrency(r.edited.amount, r.edited.currency)}</Text>
                  </HStack>
                  <Text fontSize="sm">{r.edited.description}</Text>
                  <Text fontSize="xs" color="#B0B0B0">{r.edited.date}</Text>
                  <CategorySelect value={r.edited.category_id} onChange={(v) => updateRow(idx, { category_id: v })} categories={categories} filterByType={r.edited.type} required />
                  <AccountSelect value={r.edited.account_id ?? ''} onChange={(v) => updateRow(idx, { account_id: v || null })} accounts={accounts} optional placeholder="Sin cuenta" />
                  <HStack justify="flex-end" gap={2}>
                    <Button size="sm" variant="outline" onClick={() => setEditing(idx)}><FiEdit2 /> Editar</Button>
                    <Button size="sm" variant="outline" colorPalette={r.excluded ? 'green' : 'red'} onClick={() => toggleExclude(idx)}>
                      {r.excluded ? <><FiCheck /> Incluir</> : <><FiX /> Excluir</>}
                    </Button>
                  </HStack>
                </Stack>
              </Box>
            ))}
          </VStack>

          <HStack justify="space-between" pt={4} borderTopWidth="1px" borderColor="#2d2d35">
            <Text fontSize="sm" color="#B0B0B0">
              {activeReviews.length} de {reviews.length} se registrarán
            </Text>
            <HStack gap={2}>
              <Button variant="outline" onClick={handleDiscard} disabled={saving}>Descartar</Button>
              <Button bg="#4F46E5" color="white" _hover={{ bg: '#4338CA' }} onClick={handleSave} loading={saving} disabled={activeReviews.length === 0}>
                Guardar todas
              </Button>
            </HStack>
          </HStack>
        </VStack>
      </FormDialog>

      {editingAsTransaction && editing != null && (
        <TransactionEditForm
          isOpen={true}
          onClose={() => setEditing(null)}
          userId={userId}
          categories={categories}
          accounts={accounts}
          transaction={editingAsTransaction}
          onSuccess={() => setEditing(null)}
          onSubmitOverride={(values) => updateRow(editing, values)}
        />
      )}
    </>
  )
}
