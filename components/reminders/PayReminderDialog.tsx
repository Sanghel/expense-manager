'use client'

import { useMemo, useState } from 'react'
import { VStack, HStack, Text, Box, Badge } from '@chakra-ui/react'
import { FormDialog } from '@/components/ui/FormDialog'
import { InputAmount } from '@/components/ui/InputAmount'
import { AccountSelect } from '@/components/ui/AccountSelect'
import { PrimaryButton } from '@/components/ui/PrimaryButton'
import { createTransaction } from '@/lib/actions/transactions.actions'
import { toaster } from '@/lib/toaster'
import { getLocalDateString } from '@/lib/utils/dates'
import type { Account, ReminderWithCategory } from '@/types/database.types'

interface Props {
  isOpen: boolean
  onClose: () => void
  userId: string
  accounts: Account[]
  reminder: ReminderWithCategory
  onSuccess: () => void
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

export function PayReminderDialog({ isOpen, onClose, userId, accounts, reminder, onSuccess }: Props) {
  const initialAccount = useMemo(() => pickInitialAccount(reminder, accounts), [reminder, accounts])
  const [accountId, setAccountId] = useState<string>(initialAccount?.id ?? '')
  const [amount, setAmount] = useState<number | undefined>(undefined)
  const [loading, setLoading] = useState(false)

  const selectedAccount = accounts.find((a) => a.id === accountId) ?? null
  const currency = selectedAccount?.currency ?? 'COP'
  const isIncome = reminder.type === 'income'
  const today = getLocalDateString()
  const todayLabel = new Date(today + 'T12:00:00').toLocaleDateString('es-CO', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reminder.category_id) {
      toaster.create({ title: 'Recordatorio sin categoría', description: 'Asigna una categoría al recordatorio antes de pagarlo.', type: 'error', duration: 4000 })
      return
    }
    if (!amount || amount <= 0) {
      toaster.create({ title: 'Monto inválido', description: 'Ingresa un monto mayor a 0.', type: 'error', duration: 4000 })
      return
    }
    setLoading(true)
    const result = await createTransaction(userId, {
      amount,
      currency,
      type: reminder.type,
      category_id: reminder.category_id,
      account_id: accountId || null,
      description: reminder.description,
      date: today,
    })
    setLoading(false)
    if (result.success) {
      toaster.create({ title: isIncome ? 'Ingreso registrado' : 'Pago registrado', type: 'success', duration: 3000 })
      onSuccess()
      onClose()
    } else {
      toaster.create({ title: 'Error', description: result.error, type: 'error', duration: 4000 })
    }
  }

  return (
    <FormDialog isOpen={isOpen} onClose={onClose} title={isIncome ? 'Registrar ingreso' : 'Pagar recordatorio'}>
      <form onSubmit={handleSubmit}>
        <VStack gap={4} align="stretch">
          <Box borderWidth="1px" borderColor="#2d2d35" borderRadius="md" px={3} py={2} bg="#18181d">
            <HStack gap={2} mb={1}>
              <Text fontSize="xs" color="#B0B0B0">Descripción</Text>
            </HStack>
            <Text color="white" fontWeight="semibold">
              {reminder.category?.icon ?? '🔔'} {reminder.description}
            </Text>
            <HStack gap={2} mt={2} flexWrap="wrap">
              {reminder.category && (
                <Badge size="sm" variant="outline" colorPalette="purple">
                  {reminder.category.name}
                </Badge>
              )}
              <Badge size="sm" variant="outline" colorPalette="gray">
                {todayLabel}
              </Badge>
            </HStack>
          </Box>

          <AccountSelect
            label="Cuenta"
            required
            value={accountId}
            onChange={setAccountId}
            accounts={accounts}
            placeholder="Selecciona una cuenta"
          />

          <InputAmount
            label={`Monto (${currency})`}
            value={amount}
            onChange={setAmount}
            isRequired
          />

          <PrimaryButton type="submit" width="full" loading={loading} disabled={!accountId}>
            {isIncome ? 'Registrar ingreso' : 'Registrar pago'}
          </PrimaryButton>
        </VStack>
      </form>
    </FormDialog>
  )
}
