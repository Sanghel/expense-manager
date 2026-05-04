'use client'

import { VStack } from '@chakra-ui/react'
import { useState } from 'react'
import { createAccountMovement } from '@/lib/actions/account_movements.actions'
import { toaster } from '@/lib/toaster'
import { FormDialog } from '@/components/ui/FormDialog'
import { FormInput } from '@/components/ui/FormInput'
import { DateInput } from '@/components/ui/DateInput'
import { InputAmount } from '@/components/ui/InputAmount'
import { AccountSelect } from '@/components/ui/AccountSelect'
import { CurrencySelect } from '@/components/ui/CurrencySelect'
import { PrimaryButton } from '@/components/ui/PrimaryButton'
import type { Account, Currency } from '@/types/database.types'
import { getLocalDateString } from '@/lib/utils/dates'

interface Props {
  isOpen: boolean
  onClose: () => void
  userId: string
  accounts: Account[]
  onSuccess: () => void
}

const defaultForm = {
  from_account_id: '',
  from_amount: undefined as number | undefined,
  from_currency: 'COP' as Currency,
  to_account_id: '',
  to_amount: undefined as number | undefined,
  to_currency: 'COP' as Currency,
  description: '',
  date: getLocalDateString(),
}

export function AccountMovementForm({ isOpen, onClose, userId, accounts, onSuccess }: Props) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState(defaultForm)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const result = await createAccountMovement(userId, {
      from_account_id: formData.from_account_id,
      from_amount: formData.from_amount ?? 0,
      from_currency: formData.from_currency,
      to_account_id: formData.to_account_id,
      to_amount: formData.to_amount ?? 0,
      to_currency: formData.to_currency,
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
          <AccountSelect
            value={formData.from_account_id}
            onChange={(v) => setFormData({ ...formData, from_account_id: v })}
            accounts={accounts}
            label="Cuenta origen"
            required
            placeholder="Seleccionar..."
          />

          <InputAmount
            label="Monto enviado"
            value={formData.from_amount}
            onChange={(v) => setFormData({ ...formData, from_amount: v })}
            isRequired
          />

          <CurrencySelect
            value={formData.from_currency}
            onChange={(v) => setFormData({ ...formData, from_currency: v })}
            showFullLabel
            required
          />

          <AccountSelect
            value={formData.to_account_id}
            onChange={(v) => setFormData({ ...formData, to_account_id: v })}
            accounts={accounts}
            label="Cuenta destino"
            required
            placeholder="Seleccionar..."
            excludeId={formData.from_account_id}
          />

          <InputAmount
            label="Monto recibido"
            value={formData.to_amount}
            onChange={(v) => setFormData({ ...formData, to_amount: v })}
            isRequired
          />

          <CurrencySelect
            value={formData.to_currency}
            onChange={(v) => setFormData({ ...formData, to_currency: v })}
            showFullLabel
            required
          />

          <FormInput
            label="Descripción (opcional)"
            value={formData.description}
            onChange={(v) => setFormData({ ...formData, description: v })}
            placeholder="Ej: Cambio de dólares"
          />

          <DateInput
            label="Fecha"
            value={formData.date}
            onChange={(v) => setFormData({ ...formData, date: v })}
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
