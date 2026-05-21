'use client'

import {
  Box,
  Heading,
  HStack,
  VStack,
  Text,
  Button,
  Badge,
  Stack,
} from '@chakra-ui/react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FiCheck, FiX } from 'react-icons/fi'
import { Card } from '@/components/ui/Card'
import { FormInput } from '@/components/ui/FormInput'
import { InputAmount } from '@/components/ui/InputAmount'
import { CategorySelect } from '@/components/ui/CategorySelect'
import { AccountSelect } from '@/components/ui/AccountSelect'
import { DateInput } from '@/components/ui/DateInput'
import { confirmDraft, rejectDraft } from '@/lib/actions/gmail.actions'
import { toaster } from '@/lib/toaster'
import { formatCurrency } from '@/lib/utils/currency'
import type {
  Account,
  Category,
  Currency,
  TransactionDraft,
  TransactionType,
} from '@/types/database.types'

interface Props {
  userId: string
  initialDrafts: TransactionDraft[]
  categories: Category[]
  accounts: Account[]
}

interface DraftFormState {
  amount: number | undefined
  currency: Currency
  type: TransactionType
  category_id: string
  account_id: string
  description: string
  date: string
}

function draftToForm(d: TransactionDraft): DraftFormState {
  return {
    amount: d.amount != null ? Number(d.amount) : undefined,
    currency: (d.currency ?? 'COP') as Currency,
    type: (d.type ?? 'expense') as TransactionType,
    category_id: d.category_id ?? '',
    account_id: d.account_id ?? '',
    description: d.description ?? '',
    date: d.date ?? new Date().toISOString().split('T')[0],
  }
}

export function PendientesPageClient({
  initialDrafts,
  categories,
  accounts,
}: Props) {
  const router = useRouter()
  const [drafts] = useState(initialDrafts)
  const [forms, setForms] = useState<Record<string, DraftFormState>>(
    Object.fromEntries(initialDrafts.map((d) => [d.id, draftToForm(d)]))
  )
  const [pendingId, setPendingId] = useState<string | null>(null)

  const updateForm = (id: string, patch: Partial<DraftFormState>) => {
    setForms((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }))
  }

  const handleConfirm = async (draft: TransactionDraft) => {
    const form = forms[draft.id]
    if (!form.amount || !form.category_id || !form.description || !form.date) {
      toaster.create({
        title: 'Faltan campos',
        description: 'Monto, categoría, descripción y fecha son obligatorios',
        type: 'error',
        duration: 4000,
      })
      return
    }
    setPendingId(draft.id)
    const result = await confirmDraft(draft.id, {
      amount: form.amount,
      currency: form.currency,
      type: form.type,
      category_id: form.category_id,
      account_id: form.account_id || null,
      description: form.description,
      date: form.date,
    })
    setPendingId(null)
    if (result.success) {
      toaster.create({ title: 'Confirmado', type: 'success', duration: 3000 })
      router.refresh()
    } else {
      toaster.create({
        title: 'Error',
        description: result.error,
        type: 'error',
        duration: 4000,
      })
    }
  }

  const handleReject = async (draft: TransactionDraft) => {
    setPendingId(draft.id)
    const result = await rejectDraft(draft.id)
    setPendingId(null)
    if (result.success) {
      toaster.create({ title: 'Rechazado', type: 'success', duration: 3000 })
      router.refresh()
    } else {
      toaster.create({
        title: 'Error',
        description: result.error,
        type: 'error',
        duration: 4000,
      })
    }
  }

  return (
    <Box>
      <Heading size="lg" mb={2} color="white">
        Pendientes de Gmail
      </Heading>
      <Text color="#B0B0B0" mb={6}>
        Transacciones detectadas en tu correo que necesitan revisión antes de
        registrarse.
      </Text>

      {drafts.length === 0 ? (
        <Card>
          <Text color="#B0B0B0" textAlign="center" py={8}>
            No hay pendientes. Pulsa &ldquo;Sincronizar correos&rdquo; en
            Movimientos para buscar nuevos correos.
          </Text>
        </Card>
      ) : (
        <VStack gap={4} align="stretch">
          {drafts.map((draft) => {
            const form = forms[draft.id]
            return (
              <Card key={draft.id}>
                <VStack align="stretch" gap={3}>
                  <HStack justify="space-between" wrap="wrap" gap={2}>
                    <VStack align="start" gap={0}>
                      <Text fontSize="sm" color="#B0B0B0">
                        {draft.raw_from}
                      </Text>
                      <Text fontWeight="600" color="white">
                        {draft.raw_subject}
                      </Text>
                    </VStack>
                    <Badge
                      colorPalette={draft.confidence >= 0.85 ? 'yellow' : 'orange'}
                    >
                      Confianza {Math.round(draft.confidence * 100)}%
                    </Badge>
                  </HStack>

                  <Text fontSize="sm" color="#B0B0B0" fontStyle="italic">
                    {draft.raw_snippet}
                  </Text>

                  <Text fontSize="xs" color="#B0B0B0">
                    Motivo: {draft.parse_reason}
                  </Text>

                  <Stack
                    direction={{ base: 'column', md: 'row' }}
                    gap={3}
                    w="full"
                  >
                    <InputAmount
                      label="Monto"
                      value={form.amount}
                      onChange={(v) => updateForm(draft.id, { amount: v })}
                      isRequired
                    />
                    <Box flex="1">
                      <Text fontSize="sm" color="#B0B0B0" mb={1}>
                        Detectado:{' '}
                        {draft.amount != null
                          ? formatCurrency(Number(draft.amount), form.currency)
                          : '—'}{' '}
                        · {form.type === 'income' ? 'Ingreso' : 'Gasto'}
                      </Text>
                    </Box>
                  </Stack>

                  <Stack
                    direction={{ base: 'column', md: 'row' }}
                    gap={3}
                    w="full"
                  >
                    <CategorySelect
                      value={form.category_id}
                      onChange={(v) =>
                        updateForm(draft.id, { category_id: v })
                      }
                      categories={categories}
                      filterByType={form.type}
                      required
                    />
                    <AccountSelect
                      value={form.account_id}
                      onChange={(v) => updateForm(draft.id, { account_id: v })}
                      accounts={accounts}
                      optional
                      placeholder="Sin cuenta específica"
                    />
                  </Stack>

                  <Stack
                    direction={{ base: 'column', md: 'row' }}
                    gap={3}
                    w="full"
                  >
                    <FormInput
                      label="Descripción"
                      value={form.description}
                      onChange={(v) => updateForm(draft.id, { description: v })}
                      required
                    />
                    <DateInput
                      label="Fecha"
                      value={form.date}
                      onChange={(v) => updateForm(draft.id, { date: v })}
                      required
                    />
                  </Stack>

                  <HStack justify="flex-end" gap={2} pt={2}>
                    <Button
                      variant="outline"
                      onClick={() => handleReject(draft)}
                      loading={pendingId === draft.id}
                    >
                      <FiX /> Rechazar
                    </Button>
                    <Button
                      bg="#4F46E5"
                      color="white"
                      _hover={{ bg: '#4338CA' }}
                      onClick={() => handleConfirm(draft)}
                      loading={pendingId === draft.id}
                    >
                      <FiCheck /> Confirmar
                    </Button>
                  </HStack>
                </VStack>
              </Card>
            )
          })}
        </VStack>
      )}
    </Box>
  )
}
