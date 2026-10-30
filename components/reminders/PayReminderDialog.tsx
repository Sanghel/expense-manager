'use client'

import { useMemo, useState } from 'react'
import { Box, Flex, Text } from '@chakra-ui/react'
import { AccountChips, AmountBlock, Field, FormModal, FormModalContent } from '@/components/ui/pulso'
import { createTransaction } from '@/lib/actions/transactions.actions'
import { toaster } from '@/lib/toaster'
import { getLocalDateString } from '@/lib/utils/dates'
import { formatCurrency } from '@/lib/utils/currency'
import { decimalsFor } from '@/lib/utils/amount-input'
import type { Account, Currency, ReminderWithCategory } from '@/types/database.types'

interface Props {
  isOpen: boolean
  onClose: () => void
  userId: string
  accounts: Account[]
  reminder: ReminderWithCategory
  onSuccess: () => void
  /** Occurrence being settled. Defaults to today; an overdue one is recorded
   *  on its own date rather than today's. */
  date?: string
}

function pickInitialAccount(reminder: ReminderWithCategory, accounts: Account[]): Account | null {
  if (reminder.account_id) {
    const exact = accounts.find((a) => a.id === reminder.account_id)
    if (exact) return exact
  }
  const def = accounts.find((a) => a.is_default)
  if (def) return def
  return accounts[0] ?? null
}

function PayReminderBody({ onClose, userId, accounts, reminder, onSuccess, date }: Omit<Props, 'isOpen'>) {
  const initialAccount = useMemo(() => pickInitialAccount(reminder, accounts), [reminder, accounts])
  const [accountId, setAccountId] = useState<string>(initialAccount?.id ?? '')
  const [amount, setAmount] = useState<number | undefined>(undefined)
  const [loading, setLoading] = useState(false)

  const selectedAccount = accounts.find((a) => a.id === accountId) ?? null
  const currency = (selectedAccount?.currency ?? 'COP') as Currency
  const isIncome = reminder.type === 'income'
  const occurrenceDate = date ?? getLocalDateString()
  const dateLabel = new Date(occurrenceDate + 'T12:00:00').toLocaleDateString('es-CO', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
  const amountLabel = amount ? formatCurrency(amount, currency, decimalsFor(currency)) : null

  const handleSubmit = async () => {
    if (!reminder.category_id) {
      toaster.create({ title: 'Recordatorio sin categoría', description: 'Asigna una categoría al recordatorio antes de pagarlo.', type: 'error', duration: 4000 })
      return
    }
    if (!amount) return
    setLoading(true)
    const result = await createTransaction(userId, {
      amount,
      currency,
      type: reminder.type,
      category_id: reminder.category_id,
      account_id: accountId || null,
      description: reminder.description,
      date: occurrenceDate,
    })
    setLoading(false)
    if (result.success) {
      toaster.create({
        title: `${isIncome ? 'Ingreso registrado' : 'Pago registrado'} · ${reminder.description} · ${amountLabel}`,
        type: 'success',
        duration: 2600,
      })
      onSuccess()
      onClose()
    } else {
      toaster.create({ title: 'Error', description: result.error, type: 'error', duration: 4000 })
    }
  }

  return (
    <FormModalContent
      title={isIncome ? 'Registrar ingreso' : 'Pagar recordatorio'}
      onClose={onClose}
      onSubmit={handleSubmit}
      canSubmit={!!accountId && !!amount}
      loading={loading}
      submitLabel={
        <>
          {isIncome ? 'Registrar ingreso' : 'Registrar pago'}
          {amountLabel && (
            <Text as="span" fontFamily="mono" fontWeight="500">
              · {amountLabel}
            </Text>
          )}
        </>
      }
    >
      <Flex align="center" gap={3} bg="bg" borderRadius="tile" px={4} py={3}>
        <Text fontSize="22px">{reminder.category?.icon ?? '🔔'}</Text>
        <Box minW={0}>
          <Text fontSize="14px" fontWeight="500" color="text">
            {reminder.description}
          </Text>
          <Text fontFamily="mono" fontSize="11px" color="text3" mt={0.5}>
            {[reminder.category?.name, dateLabel].filter(Boolean).join(' · ')}
          </Text>
        </Box>
      </Flex>

      <AmountBlock
        amount={amount}
        currency={currency}
        onAmountChange={setAmount}
        sign={isIncome ? '+' : '−'}
        autoFocus
      />

      <Field label={isIncome ? 'Entra a' : 'Se paga con'}>
        <AccountChips accounts={accounts} value={accountId} onChange={setAccountId} />
      </Field>
    </FormModalContent>
  )
}

/** Pulso "Pagar recordatorio" / "Registrar ingreso": records the occurrence as a transaction. */
export function PayReminderDialog({ isOpen, ...props }: Props) {
  return (
    <FormModal
      isOpen={isOpen}
      onClose={props.onClose}
      title={props.reminder.type === 'income' ? 'Registrar ingreso' : 'Pagar recordatorio'}
    >
      <PayReminderBody {...props} />
    </FormModal>
  )
}
