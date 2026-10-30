'use client'

import { useState } from 'react'
import { Text, Textarea } from '@chakra-ui/react'
import { LuInfo } from 'react-icons/lu'
import { AmountBlock, DateField, Field, FormModal, FormModalContent, SummaryBox } from '@/components/ui/pulso'
import { addLoanPayment } from '@/lib/actions/loans.actions'
import { toaster } from '@/lib/toaster'
import { formatCurrency } from '@/lib/utils/currency'
import { decimalsFor } from '@/lib/utils/amount-input'
import { getLocalDateString } from '@/lib/utils/dates'
import type { LoanWithAccount } from '@/types/database.types'

interface Props {
  isOpen: boolean
  onClose: () => void
  loan: LoanWithAccount
  userId: string
  onSuccess: () => void
}

function LoanPaymentFormBody({ onClose, loan, userId, onSuccess }: Omit<Props, 'isOpen'>) {
  const [amount, setAmount] = useState<number | undefined>(undefined)
  const [date, setDate] = useState(getLocalDateString())
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const fmt = (n: number) => formatCurrency(n, loan.currency, decimalsFor(loan.currency))
  const remaining = Number(loan.amount) - Number(loan.paid_amount ?? 0)
  const overRemaining = !!amount && amount > remaining
  const isLent = loan.type === 'lent'

  const handleSubmit = async () => {
    if (!amount || overRemaining) return
    setLoading(true)
    const result = await addLoanPayment(userId, loan.id, amount, date || undefined, notes || undefined)
    setLoading(false)

    if (result.success) {
      const msg = result.settled ? 'Préstamo saldado completamente' : isLent ? 'Cobro registrado' : 'Abono registrado'
      toaster.create({ title: `${msg} · ${fmt(amount)}`, type: 'success', duration: 2600 })
      onClose()
      onSuccess()
    } else {
      toaster.create({ title: 'Error al registrar abono', description: result.error, type: 'error', duration: 4000 })
    }
  }

  return (
    <FormModalContent
      title={isLent ? 'Registrar cobro parcial' : 'Registrar abono'}
      subtitle={loan.person_name}
      onClose={onClose}
      onSubmit={handleSubmit}
      canSubmit={!!amount && !overRemaining}
      loading={loading}
      submitLabel={
        <>
          Registrar
          {amount && (
            <Text as="span" fontFamily="mono" fontWeight="500">
              · {fmt(amount)}
            </Text>
          )}
        </>
      }
    >
      <AmountBlock
        amount={amount}
        currency={loan.currency}
        onAmountChange={setAmount}
        color="pos"
        label={isLent ? 'Monto recibido' : 'Monto abonado'}
        autoFocus
        footer={
          <Text fontFamily="mono" fontSize="12px" color={overRemaining ? 'neg' : 'text3'}>
            Pendiente · {fmt(remaining)}
          </Text>
        }
      />

      <Field label="Fecha">
        <DateField value={date} onChange={setDate} />
      </Field>

      <Field label="Notas" optional>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          resize="none"
          placeholder="Ej: Transferencia Bancolombia"
        />
      </Field>

      {amount && !overRemaining && (
        <SummaryBox icon={LuInfo} tone="brand">
          {amount === remaining
            ? 'Con este pago el préstamo queda saldado.'
            : `Después de este pago faltarán ${fmt(remaining - amount)}.`}
        </SummaryBox>
      )}
    </FormModalContent>
  )
}

/** Pulso partial payment of a loan: "Registrar abono" / "Registrar cobro parcial". */
export function LoanPaymentForm({ isOpen, ...props }: Props) {
  return (
    <FormModal
      isOpen={isOpen}
      onClose={props.onClose}
      title={props.loan.type === 'lent' ? 'Registrar cobro parcial' : 'Registrar abono'}
    >
      <LoanPaymentFormBody {...props} />
    </FormModal>
  )
}
