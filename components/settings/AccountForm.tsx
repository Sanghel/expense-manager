'use client'

import { VStack, HStack, FieldRoot, FieldLabel, Switch, Text } from '@chakra-ui/react'
import { useState, useEffect } from 'react'
import { createAccount, updateAccount } from '@/lib/actions/accounts.actions'
import { toaster } from '@/lib/toaster'
import { FormDialog } from '@/components/ui/FormDialog'
import { FormInput } from '@/components/ui/FormInput'
import { InputAmount } from '@/components/ui/InputAmount'
import { SelectField } from '@/components/ui/SelectField'
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
  { value: 'card', label: 'Tarjeta de Crédito' },
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
  type: 'bank' as 'bank' | 'digital' | 'crypto' | 'cash' | 'card',
  currency: 'COP' as Currency,
  balance: 0 as number | undefined,
  credit_limit: undefined as number | undefined,
  icon: '💳',
  color: '#6366f1',
  last_four: '',
  card_number: '',
  is_default: false,
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
        credit_limit: editingAccount.credit_limit != null ? Number(editingAccount.credit_limit) : undefined,
        icon: editingAccount.icon ?? '💳',
        color: editingAccount.color ?? '#6366f1',
        last_four: editingAccount.last_four ?? '',
        card_number: editingAccount.card_number ?? '',
        is_default: editingAccount.is_default ?? false,
      })
    } else {
      setFormData(defaultForm)
    }
  }, [editingAccount, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const isCard = formData.type === 'card'
    const trimmedLastFour = formData.last_four.trim()
    if (trimmedLastFour && !/^[0-9]{4}$/.test(trimmedLastFour)) {
      toaster.create({
        title: 'Últimos 4 dígitos inválidos',
        description: 'Debe ser exactamente 4 dígitos numéricos',
        type: 'error',
        duration: 4000,
      })
      setLoading(false)
      return
    }
    // Card number only applies to non-card accounts (a card that shares the
    // account's fund). Card-type accounts use last_four for their own card.
    const trimmedCardNumber = isCard ? '' : formData.card_number.trim()
    if (trimmedCardNumber && !/^[0-9]{4}$/.test(trimmedCardNumber)) {
      toaster.create({
        title: 'Número de tarjeta inválido',
        description: 'Debe ser exactamente 4 dígitos numéricos',
        type: 'error',
        duration: 4000,
      })
      setLoading(false)
      return
    }
    const data = {
      name: formData.name,
      type: formData.type,
      currency: formData.currency,
      balance: isCard ? (formData.credit_limit ?? 0) : (formData.balance ?? 0),
      credit_limit: isCard ? (formData.credit_limit ?? null) : null,
      icon: formData.icon || null,
      color: formData.color || null,
      last_four: trimmedLastFour || null,
      card_number: trimmedCardNumber || null,
      is_default: formData.is_default,
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

  const isCard = formData.type === 'card'

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

          <SelectField
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

          {isCard ? (
            <InputAmount
              label="Cupo total"
              value={formData.credit_limit}
              onChange={(v) => setFormData({ ...formData, credit_limit: v })}
              isRequired
            />
          ) : (
            <InputAmount
              label={editingAccount ? 'Balance actual' : 'Balance inicial'}
              value={formData.balance}
              onChange={(v) => setFormData({ ...formData, balance: v })}
            />
          )}

          <FormInput
            label="Últimos 4 dígitos (para integración Gmail)"
            value={formData.last_four}
            onChange={(v) => setFormData({ ...formData, last_four: v.replace(/[^0-9]/g, '').slice(0, 4) })}
            placeholder="1234"
          />

          {!isCard && (
            <FormInput
              label="Número de tarjeta asociada (para integración Gmail)"
              value={formData.card_number}
              onChange={(v) => setFormData({ ...formData, card_number: v.replace(/[^0-9]/g, '').slice(0, 4) })}
              placeholder="5678"
            />
          )}

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

          <HStack w="full" justify="space-between" align="center">
            <VStack align="flex-start" gap={0}>
              <Text fontSize="sm" color="white">Cuenta por defecto</Text>
              <Text fontSize="xs" color="#B0B0B0">Se usará al pagar recordatorios sin cuenta asignada</Text>
            </VStack>
            <Switch.Root
              checked={formData.is_default}
              onCheckedChange={({ checked }) => setFormData({ ...formData, is_default: checked })}
              colorPalette="brand"
            >
              <Switch.HiddenInput />
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
            </Switch.Root>
          </HStack>

          <PrimaryButton type="submit" width="full" loading={loading}>
            {editingAccount ? 'Guardar cambios' : 'Crear Cuenta'}
          </PrimaryButton>
        </VStack>
      </form>
    </FormDialog>
  )
}
