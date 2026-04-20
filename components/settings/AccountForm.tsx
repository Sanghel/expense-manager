'use client'

import { VStack, HStack, FieldRoot, FieldLabel } from '@chakra-ui/react'
import { useState, useEffect } from 'react'
import { createAccount, updateAccount } from '@/lib/actions/accounts.actions'
import { toaster } from '@/lib/toaster'
import { FormDialog } from '@/components/ui/FormDialog'
import { FormInput } from '@/components/ui/FormInput'
import { InputAmount } from '@/components/ui/InputAmount'
import { RadioSelect } from '@/components/ui/RadioSelect'
import { CurrencySelect } from '@/components/ui/CurrencySelect'
import { PrimaryButton } from '@/components/ui/PrimaryButton'
import { IconPicker } from '@/components/categories/IconPicker'
import { ColorPicker } from '@/components/categories/ColorPicker'
import type { Account, Currency } from '@/types/database.types'

const TYPE_OPTIONS = [
  { value: 'bank', label: 'Banco' },
  { value: 'digital', label: 'Digital' },
  { value: 'crypto', label: 'Crypto' },
  { value: 'cash', label: 'Efectivo' },
]

interface Props {
  isOpen: boolean
  onClose: () => void
  userId: string
  editingAccount?: Account | null
  onSuccess: () => void
}

const defaultForm = {
  name: '',
  type: 'bank' as 'bank' | 'digital' | 'crypto' | 'cash',
  currency: 'COP' as Currency,
  balance: 0 as number | undefined,
  icon: '💳',
  color: '#6366f1',
}

export function AccountForm({ isOpen, onClose, userId, editingAccount, onSuccess }: Props) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState(defaultForm)

  useEffect(() => {
    if (editingAccount) {
      setFormData({
        name: editingAccount.name,
        type: editingAccount.type,
        currency: editingAccount.currency as Currency,
        balance: Number(editingAccount.balance) as number | undefined,
        icon: editingAccount.icon ?? '💳',
        color: editingAccount.color ?? '#6366f1',
      })
    } else {
      setFormData(defaultForm)
    }
  }, [editingAccount, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const data = {
      name: formData.name,
      type: formData.type,
      currency: formData.currency,
      balance: formData.balance ?? 0,
      icon: formData.icon || null,
      color: formData.color || null,
    }

    const result = editingAccount
      ? await updateAccount(editingAccount.id, userId, data)
      : await createAccount(userId, data)

    if (result.success) {
      toaster.create({
        title: editingAccount ? 'Cuenta actualizada' : 'Cuenta creada',
        type: 'success',
        duration: 3000,
      })
      onSuccess()
      onClose()
    } else {
      toaster.create({ title: 'Error', description: result.error, type: 'error', duration: 4000 })
    }
    setLoading(false)
  }

  return (
    <FormDialog
      isOpen={isOpen}
      onClose={onClose}
      title={editingAccount ? 'Editar Cuenta' : 'Nueva Cuenta'}
    >
      <form onSubmit={handleSubmit}>
        <VStack gap={4}>
          <FormInput
            label="Nombre"
            value={formData.name}
            onChange={(v) => setFormData({ ...formData, name: v })}
            placeholder="Ej: Bancolombia Ahorros"
            required
          />

          <RadioSelect
            label="Tipo"
            value={formData.type}
            onChange={(v) => setFormData({ ...formData, type: v as typeof formData.type })}
            options={TYPE_OPTIONS}
            required
          />

          <CurrencySelect
            value={formData.currency}
            onChange={(v) => setFormData({ ...formData, currency: v })}
            showFullLabel
            required
          />

          <InputAmount
            label={editingAccount ? 'Balance actual' : 'Balance inicial'}
            value={formData.balance}
            onChange={(v) => setFormData({ ...formData, balance: v })}
          />

          <HStack gap={4} w="full">
            <FieldRoot>
              <FieldLabel>Icono</FieldLabel>
              <IconPicker
                value={formData.icon}
                onChange={(icon) => setFormData({ ...formData, icon })}
              />
            </FieldRoot>

            <FieldRoot>
              <FieldLabel>Color</FieldLabel>
              <ColorPicker
                value={formData.color}
                onChange={(color) => setFormData({ ...formData, color })}
              />
            </FieldRoot>
          </HStack>

          <PrimaryButton type="submit" width="full" loading={loading}>
            {editingAccount ? 'Guardar cambios' : 'Crear Cuenta'}
          </PrimaryButton>
        </VStack>
      </form>
    </FormDialog>
  )
}
