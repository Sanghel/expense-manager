'use client'

import { useState } from 'react'
import { VStack, Button, Text, FieldRoot, FieldLabel, NativeSelectRoot, NativeSelectField } from '@chakra-ui/react'
import { FormDialog } from '@/components/ui/FormDialog'
import { InputAmount } from '@/components/ui/InputAmount'
import { CurrencySelect } from '@/components/ui/CurrencySelect'
import { addFundsToGoal } from '@/lib/actions/savings.actions'
import { toaster } from '@/lib/toaster'
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

  const activeAccounts = accounts.filter((a) => a.is_active)

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
      toaster.create({ title: result.error || 'Error al añadir fondos', type: 'error', duration: 4000 })
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
            {goal.current_amount.toLocaleString()} / {goal.target_amount.toLocaleString()} {goal.currency}
          </Text>
        </Text>

        {activeAccounts.length > 0 && (
          <FieldRoot>
            <FieldLabel>Cuenta de origen <Text as="span" color="#B0B0B0" fontSize="xs">(opcional)</Text></FieldLabel>
            <NativeSelectRoot>
              <NativeSelectField
                value={accountId}
                onChange={(e) => handleAccountChange(e.target.value)}
              >
                <option value="">Sin cuenta</option>
                {activeAccounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.icon ?? ''} {a.name} — {a.currency}
                  </option>
                ))}
              </NativeSelectField>
            </NativeSelectRoot>
          </FieldRoot>
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

        <Button
          bg="#4F46E5"
          color="white"
          _hover={{ bg: '#4338CA' }}
          onClick={handleSubmit}
          loading={loading}
          loadingText="Añadiendo..."
          w="full"
          mt={2}
        >
          Añadir Fondos
        </Button>
      </VStack>
    </FormDialog>
  )
}
