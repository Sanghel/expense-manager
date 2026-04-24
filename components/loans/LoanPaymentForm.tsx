'use client'

import { useState } from 'react'
import { VStack, Button, Text } from '@chakra-ui/react'
import { FormDialog } from '@/components/ui/FormDialog'
import { InputAmount } from '@/components/ui/InputAmount'
import { addLoanPayment } from '@/lib/actions/loans.actions'
import { toaster } from '@/lib/toaster'
import { formatCurrency } from '@/lib/utils/currency'
import type { LoanWithAccount } from '@/types/database.types'

interface Props {
  isOpen: boolean
  onClose: () => void
  loan: LoanWithAccount
  userId: string
  onSuccess: () => void
}

export function LoanPaymentForm({ isOpen, onClose, loan, userId, onSuccess }: Props) {
  const [amount, setAmount] = useState<number | undefined>(undefined)
  const [loading, setLoading] = useState(false)

  const remaining = Number(loan.amount) - Number(loan.paid_amount ?? 0)
  const label = loan.type === 'lent' ? 'Monto recibido' : 'Monto abonado'

  const handleSubmit = async () => {
    if (!amount || amount <= 0) {
      toaster.create({ title: 'Ingresa un monto válido', type: 'error', duration: 3000 })
      return
    }
    if (amount > remaining) {
      toaster.create({
        title: `El monto supera el saldo pendiente (${formatCurrency(remaining, loan.currency)})`,
        type: 'error',
        duration: 4000,
      })
      return
    }

    setLoading(true)
    const result = await addLoanPayment(userId, loan.id, amount)
    setLoading(false)

    if (result.success) {
      const msg = result.settled ? 'Préstamo saldado completamente' : 'Abono registrado'
      toaster.create({ title: msg, type: 'success', duration: 3000 })
      setAmount(undefined)
      onClose()
      onSuccess()
    } else {
      toaster.create({ title: 'Error al registrar abono', description: result.error, type: 'error', duration: 4000 })
    }
  }

  return (
    <FormDialog
      isOpen={isOpen}
      onClose={onClose}
      title={loan.type === 'lent' ? 'Registrar cobro parcial' : 'Registrar abono'}
    >
      <VStack gap={4} align="stretch">
        <Text fontSize="sm" color="#B0B0B0">
          Saldo pendiente: <Text as="span" color="white" fontWeight="600">{formatCurrency(remaining, loan.currency)}</Text>
        </Text>

        <InputAmount
          label={label}
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
          loadingText="Registrando..."
          w="full"
          mt={2}
        >
          Registrar
        </Button>
      </VStack>
    </FormDialog>
  )
}
