'use client'

import { useState } from 'react'
import { Box, Button, Flex, Grid, Icon, Input, Text, Textarea } from '@chakra-ui/react'
import { LuArrowDownLeft, LuArrowUpRight, LuTrash2 } from 'react-icons/lu'
import { createLoan, updateLoan } from '@/lib/actions/loans.actions'
import { toaster } from '@/lib/toaster'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { AccountChips, AmountBlock, Field, FormModal, FormModalContent } from '@/components/ui/pulso'
import { formatCurrency } from '@/lib/utils/currency'
import { decimalsFor } from '@/lib/utils/amount-input'
import type { Account, Currency, LoanWithAccount } from '@/types/database.types'

type LoanType = 'lent' | 'borrowed'

const TYPES = [
  { value: 'lent', label: 'Yo presté', hint: 'Me lo deben', icon: LuArrowUpRight, color: 'pos' },
  { value: 'borrowed', label: 'Me prestaron', hint: 'Lo debo', icon: LuArrowDownLeft, color: 'neg' },
] as const

interface Props {
  isOpen: boolean
  onClose: () => void
  userId: string
  accounts: Account[]
  onSuccess: () => void
  loan?: LoanWithAccount
  /** Type preselected for a new loan. */
  defaultType?: LoanType
  /** People from existing loans, most recent first. */
  recentPeople?: string[]
  /** Edit mode actions; the modal closes before running them. */
  onPayment?: (loan: LoanWithAccount) => void
  onSettle?: (loan: LoanWithAccount) => void
  onDelete?: (loan: LoanWithAccount) => void
}

type BodyProps = Omit<Props, 'isOpen'>

function LoanFormBody({
  onClose,
  userId,
  accounts,
  onSuccess,
  loan,
  defaultType = 'lent',
  recentPeople = [],
  onPayment,
  onSettle,
  onDelete,
}: BodyProps) {
  const [loading, setLoading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [formData, setFormData] = useState({
    type: (loan?.type ?? defaultType) as LoanType,
    person_name: loan?.person_name ?? '',
    amount: loan ? Number(loan.amount) || undefined : undefined,
    currency: (loan?.currency ?? 'COP') as Currency,
    account_id: loan?.account_id ?? '',
    notes: loan?.notes ?? '',
  })

  const canSave = !!formData.person_name.trim() && !!formData.amount && formData.amount > 0
  const amountLabel = formData.amount
    ? formatCurrency(formData.amount, formData.currency, decimalsFor(formData.currency))
    : null
  const people = recentPeople.filter((p) => p !== formData.person_name).slice(0, 5)

  const handleSubmit = async () => {
    if (!formData.amount) return
    setLoading(true)
    try {
      const input = {
        type: formData.type,
        person_name: formData.person_name.trim(),
        amount: formData.amount,
        currency: formData.currency,
        account_id: formData.account_id || null,
        notes: formData.notes || null,
      }
      const result = loan ? await updateLoan(userId, loan.id, input) : await createLoan(userId, input)

      if (result.success) {
        toaster.create({
          title: [loan ? 'Préstamo actualizado' : 'Préstamo registrado', input.person_name, amountLabel].join(' · '),
          type: 'success',
          duration: 2600,
        })
        onSuccess()
        onClose()
      } else {
        toaster.create({ title: result.error ?? 'Error al guardar', type: 'error', duration: 4000 })
      }
    } finally {
      setLoading(false)
    }
  }

  const runAndClose = (action?: (loan: LoanWithAccount) => void) => {
    if (!loan || !action) return
    onClose()
    action(loan)
  }

  const total = Number(loan?.amount ?? 0)
  const paid = Number(loan?.paid_amount ?? 0)
  const paidPercent = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0
  const fmt = (n: number) => formatCurrency(n, loan?.currency ?? 'COP', decimalsFor(loan?.currency ?? 'COP'))

  return (
    <FormModalContent
      title={loan ? 'Editar préstamo' : 'Registrar préstamo'}
      subtitle={loan ? loan.person_name : 'Dinero que prestaste o que te prestaron'}
      onClose={onClose}
      onSubmit={handleSubmit}
      canSubmit={canSave}
      loading={loading}
      submitLabel={
        loan ? (
          'Guardar cambios'
        ) : (
          <>
            Registrar préstamo
            {amountLabel && (
              <Text as="span" fontFamily="mono" fontWeight="500">
                · {amountLabel}
              </Text>
            )}
          </>
        )
      }
      footerStart={
        loan &&
        onDelete && (
          <Button variant="ghost" color="neg" px={2} gap={1.5} onClick={() => setConfirmDelete(true)}>
            <LuTrash2 />
            Eliminar
          </Button>
        )
      }
      overlays={
        loan && (
          <ConfirmDialog
            isOpen={confirmDelete}
            onClose={() => setConfirmDelete(false)}
            onConfirm={() => {
              setConfirmDelete(false)
              runAndClose(onDelete)
            }}
            title="Eliminar préstamo"
            description={`¿Eliminar el préstamo de ${loan.person_name}?${
              loan.status === 'active' ? ' El saldo de la cuenta será revertido.' : ''
            }`}
            confirmLabel="Eliminar"
          />
        )
      }
    >
      <Grid templateColumns="1fr 1fr" gap={2} role="radiogroup" aria-label="Tipo">
        {TYPES.map((t) => {
          const selected = formData.type === t.value
          return (
            <Button
              key={t.value}
              role="radio"
              aria-checked={selected}
              onClick={() => setFormData((p) => ({ ...p, type: t.value }))}
              h="auto"
              p="14px"
              borderRadius="tile"
              justifyContent="flex-start"
              gap={3}
              bg={selected ? 'brandSoft' : 'surface2'}
              boxShadow={selected ? 'inset 0 0 0 1.5px var(--chakra-colors-brand)' : 'none'}
              _hover={{ bg: selected ? 'brandSoft' : 'line' }}
            >
              <Flex boxSize="34px" borderRadius="full" bg="bg" align="center" justify="center" flexShrink={0}>
                <Icon as={t.icon} boxSize="17px" color={t.color} />
              </Flex>
              <Box textAlign="left" minW={0}>
                <Text fontSize="14px" fontWeight="500" color="text">
                  {t.label}
                </Text>
                <Text fontSize="12px" color="text3" fontWeight="400">
                  {t.hint}
                </Text>
              </Box>
            </Button>
          )
        })}
      </Grid>

      {loan && (
        <Box bg="bg" borderRadius="tile" p={4}>
          <Flex justify="space-between" align="baseline" gap={3} mb={2.5}>
            <Text fontSize="13px" color="text2">
              <Text as="span" fontFamily="mono" color="text">
                {fmt(paid)}
              </Text>{' '}
              {loan.type === 'lent' ? 'cobrados' : 'abonados'} de{' '}
              <Text as="span" fontFamily="mono">
                {fmt(total)}
              </Text>
            </Text>
            <Text fontFamily="mono" fontSize="13px" color="pos">
              {paidPercent}%
            </Text>
          </Flex>
          <ProgressBar value={paidPercent} tone="pos" size={6} label="Pagado" />
          {loan.status === 'active' && (
            <Flex align="center" justify="space-between" gap={2} mt={3} wrap="wrap">
              <Text fontSize="13px" color="text3">
                Faltan{' '}
                <Text as="span" fontFamily="mono" color="text">
                  {fmt(Math.max(0, total - paid))}
                </Text>
              </Text>
              <Flex gap={2}>
                {onPayment && (
                  <Button size="sm" bg="posSoft" color="pos" onClick={() => runAndClose(onPayment)}>
                    {loan.type === 'lent' ? 'Registrar cobro' : 'Registrar abono'}
                  </Button>
                )}
                {onSettle && (
                  <Button
                    size="sm"
                    variant="ghost"
                    color="text2"
                    boxShadow="inset 0 0 0 1px var(--chakra-colors-line)"
                    onClick={() => runAndClose(onSettle)}
                  >
                    Marcar saldado
                  </Button>
                )}
              </Flex>
            </Flex>
          )}
        </Box>
      )}

      <Field label="Persona">
        <Input
          value={formData.person_name}
          onChange={(e) => setFormData((p) => ({ ...p, person_name: e.target.value }))}
          placeholder="Ej: Juan Pérez"
          h="44px"
        />
        {people.length > 0 && (
          <Flex align="center" gap={2} mt={2.5} wrap="wrap">
            <Text fontSize="12px" color="text3">
              Recientes
            </Text>
            {people.map((name) => (
              <Button
                key={name}
                h="30px"
                ps={1}
                pe={3}
                gap={1.5}
                fontSize="13px"
                fontWeight="500"
                bg="surface2"
                color="text2"
                _hover={{ color: 'text', bg: 'line' }}
                onClick={() => setFormData((p) => ({ ...p, person_name: name }))}
              >
                <Flex
                  boxSize="22px"
                  borderRadius="full"
                  bg="brandSoft"
                  color="brand"
                  align="center"
                  justify="center"
                  fontSize="11px"
                  fontWeight="600"
                >
                  {name.charAt(0).toUpperCase()}
                </Flex>
                {name}
              </Button>
            ))}
          </Flex>
        )}
      </Field>

      <AmountBlock
        amount={formData.amount}
        currency={formData.currency}
        onAmountChange={(amount) => setFormData((p) => ({ ...p, amount }))}
        onCurrencyChange={(currency) => setFormData((p) => ({ ...p, currency }))}
      />

      {accounts.length > 0 && (
        <Field label="Cuenta">
          <AccountChips
            accounts={accounts}
            value={formData.account_id}
            onChange={(account_id) => setFormData((p) => ({ ...p, account_id }))}
            leading={{ value: '', label: '∅ Sin cuenta', hint: 'No mueve saldo' }}
          />
        </Field>
      )}

      <Field label="Notas" optional>
        <Textarea
          value={formData.notes}
          onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
          rows={2}
          resize="none"
          placeholder="Motivo del préstamo"
        />
      </Field>
    </FormModalContent>
  )
}

/** Pulso "Registrar préstamo" / "Editar préstamo" (same modal, `loan` for edit). */
export function LoanForm({ isOpen, ...props }: Props) {
  return (
    <FormModal
      isOpen={isOpen}
      onClose={props.onClose}
      title={props.loan ? 'Editar préstamo' : 'Registrar préstamo'}
    >
      <LoanFormBody {...props} />
    </FormModal>
  )
}
