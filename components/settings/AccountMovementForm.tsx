'use client'

import { VStack, FieldRoot, FieldLabel, NativeSelectRoot, NativeSelectField } from '@chakra-ui/react'
import { useState } from 'react'
import { createAccountMovement } from '@/lib/actions/account_movements.actions'
import { toaster } from '@/lib/toaster'
import { FormDialog } from '@/components/ui/FormDialog'
import { FormInput } from '@/components/ui/FormInput'
import { CurrencySelect } from '@/components/ui/CurrencySelect'
import { PrimaryButton } from '@/components/ui/PrimaryButton'
import type { Account, Currency } from '@/types/database.types'

interface Props {
  isOpen: boolean
  onClose: () => void
  userId: string
  accounts: Account[]
  onSuccess: () => void
}

const defaultForm = {
  from_account_id: '',
  to_account_id: '',
  amount: '',
  currency: 'COP' as Currency,
  description: '',
  date: new Date().toISOString().split('T')[0],
}

export function AccountMovementForm({ isOpen, onClose, userId, accounts, onSuccess }: Props) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState(defaultForm)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const result = await createAccountMovement(userId, {
      from_account_id: formData.from_account_id,
      to_account_id: formData.to_account_id,
      amount: parseFloat(formData.amount),
      currency: formData.currency,
      description: formData.description || null,
      date: formData.date,
    })

    if (result.success) {
      toaster.create({ title: 'Movimiento registrado', type: 'success', duration: 3000 })
      onSuccess()
      onClose()
      setFormData(defaultForm)
    } else {
      toaster.create({ title: 'Error', description: result.error, type: 'error', duration: 4000 })
    }
    setLoading(false)
  }

  return (
    <FormDialog isOpen={isOpen} onClose={onClose} title="Nuevo Movimiento entre Cuentas">
      <form onSubmit={handleSubmit}>
        <VStack gap={4}>
          <FieldRoot required>
            <FieldLabel>Cuenta origen</FieldLabel>
            <NativeSelectRoot>
              <NativeSelectField
                value={formData.from_account_id}
                onChange={(e) => setFormData({ ...formData, from_account_id: e.target.value })}
              >
                <option value="">Seleccionar...</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.icon ?? '💳'} {acc.name} ({acc.currency})
                  </option>
                ))}
              </NativeSelectField>
            </NativeSelectRoot>
          </FieldRoot>

          <FieldRoot required>
            <FieldLabel>Cuenta destino</FieldLabel>
            <NativeSelectRoot>
              <NativeSelectField
                value={formData.to_account_id}
                onChange={(e) => setFormData({ ...formData, to_account_id: e.target.value })}
              >
                <option value="">Seleccionar...</option>
                {accounts
                  .filter((acc) => acc.id !== formData.from_account_id)
                  .map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.icon ?? '💳'} {acc.name} ({acc.currency})
                    </option>
                  ))}
              </NativeSelectField>
            </NativeSelectRoot>
          </FieldRoot>

          <FormInput
            label="Monto"
            value={formData.amount}
            onChange={(v) => setFormData({ ...formData, amount: v })}
            type="number"
            step="0.01"
            min="0.01"
            required
          />

          <CurrencySelect
            value={formData.currency}
            onChange={(v) => setFormData({ ...formData, currency: v })}
            showFullLabel
            required
          />

          <FormInput
            label="Descripción (opcional)"
            value={formData.description}
            onChange={(v) => setFormData({ ...formData, description: v })}
            placeholder="Ej: Transferencia mensual"
          />

          <FormInput
            label="Fecha"
            value={formData.date}
            onChange={(v) => setFormData({ ...formData, date: v })}
            type="date"
            required
          />

          <PrimaryButton type="submit" width="full" loading={loading}>
            Registrar Movimiento
          </PrimaryButton>
        </VStack>
      </form>
    </FormDialog>
  )
}
