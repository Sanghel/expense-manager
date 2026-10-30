'use client'

import { useState } from 'react'
import { Input, Text } from '@chakra-ui/react'
import { createAccountMovement } from '@/lib/actions/account_movements.actions'
import { toaster } from '@/lib/toaster'
import { AccountChips, AmountBlock, DateField, Field, FormModal, FormModalContent } from '@/components/ui/pulso'
import { formatCurrency } from '@/lib/utils/currency'
import { decimalsFor } from '@/lib/utils/amount-input'
import type { Account, Currency } from '@/types/database.types'
import { getLocalDateString } from '@/lib/utils/dates'

interface Props {
  isOpen: boolean
  onClose: () => void
  userId: string
  accounts: Account[]
  onSuccess: () => void
  preselectedToAccountId?: string
}

function AccountMovementBody({ onClose, userId, accounts, onSuccess, preselectedToAccountId }: Omit<Props, 'isOpen'>) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState(() => {
    const toAccount = accounts.find((a) => a.id === preselectedToAccountId)
    return {
      from_account_id: '',
      from_amount: undefined as number | undefined,
      from_currency: 'COP' as Currency,
      to_account_id: preselectedToAccountId ?? '',
      to_amount: undefined as number | undefined,
      to_currency: (toAccount?.currency ?? 'COP') as Currency,
      description: '',
      date: getLocalDateString(),
    }
  })
  // While the received amount isn't typed and the currencies match, it mirrors the sent one.
  const [toAmountTouched, setToAmountTouched] = useState(false)
  const set = (patch: Partial<typeof formData>) => setFormData((prev) => ({ ...prev, ...patch }))

  const toAccount = accounts.find((a) => a.id === formData.to_account_id)
  const isCardPayment = toAccount?.type === 'card'
  const mirrors = !toAmountTouched && formData.from_currency === formData.to_currency
  const toAmount = mirrors ? formData.from_amount : formData.to_amount

  const canSave =
    !!formData.from_account_id &&
    !!formData.to_account_id &&
    formData.from_account_id !== formData.to_account_id &&
    !!formData.from_amount &&
    !!toAmount

  const handleSubmit = async () => {
    setLoading(true)
    const result = await createAccountMovement(userId, {
      from_account_id: formData.from_account_id,
      from_amount: formData.from_amount ?? 0,
      from_currency: formData.from_currency,
      to_account_id: formData.to_account_id,
      to_amount: toAmount ?? 0,
      to_currency: formData.to_currency,
      description: formData.description || null,
      date: formData.date,
    })

    if (result.success) {
      toaster.create({
        title: `${isCardPayment ? 'Pago de tarjeta registrado' : 'Movimiento registrado'} · ${formatCurrency(
          formData.from_amount ?? 0,
          formData.from_currency,
          decimalsFor(formData.from_currency)
        )}`,
        type: 'success',
        duration: 2600,
      })
      onSuccess()
      onClose()
    } else {
      toaster.create({ title: 'Error', description: result.error, type: 'error', duration: 4000 })
    }
    setLoading(false)
  }

  const pickAccount = (side: 'from' | 'to', id: string) => {
    const account = accounts.find((a) => a.id === id)
    set(
      side === 'from'
        ? { from_account_id: id, from_currency: account?.currency ?? formData.from_currency }
        : { to_account_id: id, to_currency: account?.currency ?? formData.to_currency }
    )
  }

  return (
    <FormModalContent
      title={isCardPayment ? 'Pago de tarjeta' : 'Movimiento entre cuentas'}
      subtitle={isCardPayment ? 'Paga la tarjeta desde otra cuenta' : 'Pasa dinero de una cuenta a otra'}
      onClose={onClose}
      onSubmit={handleSubmit}
      canSubmit={canSave}
      loading={loading}
      submitLabel={
        <>
          {isCardPayment ? 'Registrar pago' : 'Registrar movimiento'}
          {formData.from_amount && (
            <Text as="span" fontFamily="mono" fontWeight="500">
              · {formatCurrency(formData.from_amount, formData.from_currency, decimalsFor(formData.from_currency))}
            </Text>
          )}
        </>
      }
    >
      <Field label="Sale de">
        <AccountChips
          accounts={accounts.filter((a) => a.id !== formData.to_account_id)}
          value={formData.from_account_id}
          onChange={(id) => pickAccount('from', id)}
        />
      </Field>

      <AmountBlock
        amount={formData.from_amount}
        currency={formData.from_currency}
        onAmountChange={(from_amount) => set({ from_amount })}
        onCurrencyChange={(from_currency) => set({ from_currency })}
        sign="−"
        label="Monto enviado"
      />

      <Field label={isCardPayment ? 'Tarjeta a pagar' : 'Va a'}>
        <AccountChips
          accounts={accounts.filter((a) => a.id !== formData.from_account_id)}
          value={formData.to_account_id}
          onChange={(id) => pickAccount('to', id)}
        />
      </Field>

      <AmountBlock
        amount={toAmount}
        currency={formData.to_currency}
        onAmountChange={(to_amount) => {
          setToAmountTouched(true)
          set({ to_amount })
        }}
        onCurrencyChange={(to_currency) => set({ to_currency })}
        sign="+"
        color="pos"
        label={isCardPayment ? 'Monto del pago' : 'Monto recibido'}
        footer={
          mirrors ? (
            <Text fontFamily="mono" fontSize="12px" color="text3">
              Mismo monto que sale · edítalo si hubo comisión
            </Text>
          ) : undefined
        }
      />

      <Field label="Descripción" optional>
        <Input
          value={formData.description}
          onChange={(e) => set({ description: e.target.value })}
          placeholder={isCardPayment ? 'Ej: Pago mensual tarjeta' : 'Ej: Cambio de dólares'}
          h="44px"
        />
      </Field>

      <Field label="Fecha">
        <DateField value={formData.date} onChange={(date) => set({ date })} />
      </Field>
    </FormModalContent>
  )
}

/** Pulso transfer between accounts / credit card payment. */
export function AccountMovementForm({ isOpen, ...props }: Props) {
  return (
    <FormModal isOpen={isOpen} onClose={props.onClose} title="Movimiento entre cuentas">
      <AccountMovementBody {...props} />
    </FormModal>
  )
}
