'use client'

import { VStack, FieldRoot, FieldLabel, NativeSelectRoot, NativeSelectField } from '@chakra-ui/react'
import { useState } from 'react'
import { createLoan, updateLoan } from '@/lib/actions/loans.actions'
import { toaster } from '@/lib/toaster'
import { FormDialog } from '@/components/ui/FormDialog'
import { FormInput } from '@/components/ui/FormInput'
import { InputAmount } from '@/components/ui/InputAmount'
import { RadioSelect } from '@/components/ui/RadioSelect'
import { CurrencySelect } from '@/components/ui/CurrencySelect'
import { PrimaryButton } from '@/components/ui/PrimaryButton'
import type { Account, Currency, LoanWithAccount } from '@/types/database.types'

const TYPE_OPTIONS = [
  { value: 'lent', label: 'Yo presté (me lo deben)' },
  { value: 'borrowed', label: 'Me prestaron (lo debo)' },
]

interface Props {
  isOpen: boolean
  onClose: () => void
  userId: string
  accounts: Account[]
  onSuccess: () => void
  loan?: LoanWithAccount
}

export function LoanForm({ isOpen, onClose, userId, accounts, onSuccess, loan }: Props) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    type: (loan?.type ?? 'lent') as 'lent' | 'borrowed',
    person_name: loan?.person_name ?? '',
    amount: loan?.amount as number | undefined,
    currency: (loan?.currency ?? 'COP') as Currency,
    account_id: loan?.account_id ?? '',
    notes: loan?.notes ?? '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.amount || formData.amount <= 0) {
      toaster.create({ title: 'Ingresa un monto válido', type: 'error', duration: 3000 })
      return
    }
    setLoading(true)
    try {
      const input = {
        type: formData.type,
        person_name: formData.person_name,
        amount: formData.amount,
        currency: formData.currency,
        account_id: formData.account_id || null,
        notes: formData.notes || null,
      }
      const result = loan
        ? await updateLoan(userId, loan.id, input)
        : await createLoan(userId, input)

      if (result.success) {
        toaster.create({ title: loan ? 'Préstamo actualizado' : 'Préstamo registrado', type: 'success', duration: 3000 })
        onSuccess()
        onClose()
      } else {
        toaster.create({ title: result.error ?? 'Error al guardar', type: 'error', duration: 4000 })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <FormDialog isOpen={isOpen} onClose={onClose} title={loan ? 'Editar Préstamo' : 'Registrar Préstamo'}>
      <form onSubmit={handleSubmit}>
        <VStack gap={4}>
          <RadioSelect
            label="Tipo"
            options={TYPE_OPTIONS}
            value={formData.type}
            onChange={(v) => setFormData((p) => ({ ...p, type: v as 'lent' | 'borrowed' }))}
          />
          <FormInput
            label="Nombre de la persona"
            placeholder="Ej: Juan Pérez"
            value={formData.person_name}
            onChange={(v) => setFormData((p) => ({ ...p, person_name: v }))}
            required
          />
          <InputAmount
            label="Monto"
            value={formData.amount}
            onChange={(v) => setFormData((p) => ({ ...p, amount: v }))}
          />
          <CurrencySelect
            value={formData.currency}
            onChange={(v) => setFormData((p) => ({ ...p, currency: v }))}
          />
          {accounts.length > 0 && (
            <FieldRoot>
              <FieldLabel>Cuenta</FieldLabel>
              <NativeSelectRoot>
                <NativeSelectField
                  value={formData.account_id}
                  onChange={(e) => setFormData((p) => ({ ...p, account_id: e.target.value }))}
                >
                  <option value="">Sin cuenta</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.icon} {a.name} ({a.currency})
                    </option>
                  ))}
                </NativeSelectField>
              </NativeSelectRoot>
            </FieldRoot>
          )}
          <FormInput
            label="Notas (opcional)"
            placeholder="Motivo del préstamo..."
            value={formData.notes}
            onChange={(v) => setFormData((p) => ({ ...p, notes: v }))}
          />
          <PrimaryButton type="submit" loading={loading} width="100%">
            {loan ? 'Guardar Cambios' : 'Registrar Préstamo'}
          </PrimaryButton>
        </VStack>
      </form>
    </FormDialog>
  )
}
