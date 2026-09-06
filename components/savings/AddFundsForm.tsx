'use client'

import { useEffect, useState } from 'react'
import { VStack, Button, Text, Box } from '@chakra-ui/react'
import { FormDialog } from '@/components/ui/FormDialog'
import { InputAmount } from '@/components/ui/InputAmount'
import { CurrencySelect } from '@/components/ui/CurrencySelect'
import { AccountSelect } from '@/components/ui/AccountSelect'
import { addFundsToGoal, previewGoalContribution } from '@/lib/actions/savings.actions'
import { toaster } from '@/lib/toaster'
import { formatCurrency } from '@/lib/utils/currency'
import { toNumber } from '@/lib/utils/numbers'
import type { Account, Currency, SavingsGoal } from '@/types/database.types'

interface Props {
  isOpen: boolean
  onClose: () => void
  goal: SavingsGoal
  userId: string
  accounts: Account[]
  onSuccess: () => void
}

export function AddFundsForm({ isOpen, onClose, goal, userId, accounts, onSuccess }: Props) {
  const [amount, setAmount] = useState<number | undefined>(undefined)
  const [accountId, setAccountId] = useState<string>('')
  const [currency, setCurrency] = useState<Currency>(goal.currency)
  const [loading, setLoading] = useState(false)
  const [conversion, setConversion] = useState<{ key: string; ok: boolean; text: string } | null>(null)

  const activeAccounts = accounts.filter((a) => a.is_active)
  const current = toNumber(goal.current_amount)
  const target = toNumber(goal.target_amount)

  const needsConversion = !!amount && amount > 0 && currency !== goal.currency
  const conversionKey = `${amount ?? ''}|${currency}`

  // Show what will actually be credited to the goal when the contribution is
  // in a different currency — the mismatch used to be silent.
  useEffect(() => {
    if (!needsConversion || !amount) return

    let cancelled = false
    previewGoalContribution(amount, currency, goal.currency).then((result) => {
      if (cancelled) return
      setConversion({
        key: conversionKey,
        ok: result.ok,
        text: result.ok
          ? `≈ ${formatCurrency(result.amount, goal.currency)} en la meta`
          : result.error,
      })
    })

    return () => {
      cancelled = true
    }
  }, [needsConversion, amount, currency, goal.currency, conversionKey])

  // Keyed so a result from a previous amount/currency is never shown.
  const preview = needsConversion && conversion?.key === conversionKey ? conversion : null

  const handleAccountChange = (id: string) => {
    setAccountId(id)
    if (id) {
      const account = activeAccounts.find((a) => a.id === id)
      if (account) setCurrency(account.currency)
    } else {
      setCurrency(goal.currency)
    }
  }

  const handleSubmit = async () => {
    if (!amount || amount <= 0) {
      toaster.create({ title: 'Ingresa un monto válido', type: 'error', duration: 3000 })
      return
    }

    setLoading(true)
    const result = await addFundsToGoal(goal.id, userId, {
      amount,
      account_id: accountId || undefined,
      currency,
    })
    setLoading(false)

    if (result.success) {
      toaster.create({ title: 'Fondos añadidos', type: 'success', duration: 3000 })
      setAmount(undefined)
      setAccountId('')
      setCurrency(goal.currency)
      onClose()
      onSuccess()
    } else {
      toaster.create({ title: result.error || 'Error al añadir fondos', type: 'error', duration: 5000 })
    }
  }

  return (
    <FormDialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Añadir fondos — ${goal.name}`}
    >
      <VStack gap={4} align="stretch">
        <Text fontSize="sm" color="#B0B0B0">
          Meta: <Text as="span" color="white" fontWeight="600">
            {formatCurrency(current, goal.currency)} / {formatCurrency(target, goal.currency)}
          </Text>
        </Text>

        {activeAccounts.length > 0 && (
          <AccountSelect
            value={accountId}
            onChange={handleAccountChange}
            accounts={activeAccounts}
            label="Cuenta de origen"
            optional
          />
        )}

        <CurrencySelect
          value={currency}
          onChange={setCurrency}
          showFullLabel
        />

        <InputAmount
          label="Monto"
          value={amount}
          onChange={setAmount}
          isRequired
        />

        {preview && (
          <Box
            bg="#26262f"
            borderRadius="md"
            borderWidth="1px"
            borderColor={preview.ok ? '#2d2d35' : '#F43F5E'}
            px={3}
            py={2}
          >
            <Text fontSize="sm" color={preview.ok ? 'white' : '#F43F5E'}>
              {preview.text}
            </Text>
          </Box>
        )}

        <Button
          bg="#4F46E5"
          color="white"
          _hover={{ bg: '#4338CA' }}
          onClick={handleSubmit}
          loading={loading}
          loadingText="Añadiendo..."
          disabled={preview?.ok === false}
          w="full"
          mt={2}
        >
          Añadir Fondos
        </Button>
      </VStack>
    </FormDialog>
  )
}
