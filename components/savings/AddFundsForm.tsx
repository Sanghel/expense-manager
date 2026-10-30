'use client'

import { useEffect, useState } from 'react'
import { Box, Flex, Text } from '@chakra-ui/react'
import { LuTarget } from 'react-icons/lu'
import {
  AccountChips,
  AmountBlock,
  Chip,
  Field,
  FormModal,
  FormModalContent,
  SummaryBox,
} from '@/components/ui/pulso'
import { addFundsToGoal, previewGoalContribution } from '@/lib/actions/savings.actions'
import { toaster } from '@/lib/toaster'
import { formatCurrency } from '@/lib/utils/currency'
import { decimalsFor } from '@/lib/utils/amount-input'
import { toNumber } from '@/lib/utils/numbers'
import { getSavingsPace } from '@/lib/utils/savings-pace'
import type { Account, Currency, SavingsGoal } from '@/types/database.types'

interface Props {
  isOpen: boolean
  onClose: () => void
  goal: SavingsGoal
  userId: string
  accounts: Account[]
  onSuccess: () => void
}

/** "21,6M" for the "Completar" chip. */
const compact = (n: number) =>
  n >= 1_000_000
    ? `${(n / 1_000_000).toLocaleString('es-CO', { maximumFractionDigits: 1 })}M`
    : n.toLocaleString('es-CO', { maximumFractionDigits: 0 })

function AddFundsBody({ onClose, goal, userId, accounts, onSuccess }: Omit<Props, 'isOpen'>) {
  const [amount, setAmount] = useState<number | undefined>(undefined)
  const [accountId, setAccountId] = useState<string>('')
  const [currency, setCurrency] = useState<Currency>(goal.currency)
  const [loading, setLoading] = useState(false)
  const [conversion, setConversion] = useState<
    { key: string; ok: true; amount: number } | { key: string; ok: false; error: string } | null
  >(null)

  const activeAccounts = accounts.filter((a) => a.is_active)
  const current = toNumber(goal.current_amount)
  const target = toNumber(goal.target_amount)
  const remaining = Math.max(target - current, 0)
  const fmtGoal = (n: number) => formatCurrency(n, goal.currency, decimalsFor(goal.currency))

  const needsConversion = !!amount && amount > 0 && currency !== goal.currency
  const conversionKey = `${amount ?? ''}|${currency}`

  // Show what will actually be credited to the goal when the contribution is
  // in a different currency — the mismatch used to be silent.
  useEffect(() => {
    if (!needsConversion || !amount) return

    let cancelled = false
    previewGoalContribution(amount, currency, goal.currency).then((result) => {
      if (!cancelled) setConversion({ key: conversionKey, ...result })
    })

    return () => {
      cancelled = true
    }
  }, [needsConversion, amount, currency, goal.currency, conversionKey])

  // Keyed so a result from a previous amount/currency is never shown.
  const preview = needsConversion && conversion?.key === conversionKey ? conversion : null
  // What lands in the goal, in its currency (null while the conversion loads).
  const credited = !amount ? 0 : !needsConversion ? amount : preview?.ok ? preview.amount : null

  const currentPct = target > 0 ? Math.min(100, (current / target) * 100) : 0
  const ghostPct = target > 0 && credited ? Math.min(100 - currentPct, (credited / target) * 100) : 0
  const totalPct = Math.round(currentPct + ghostPct)

  // Quick amounts, in the goal's currency.
  const suggested = getSavingsPace(goal)?.requiredMonthly
  const quick = currency === goal.currency
    ? [
        ...(suggested && suggested < remaining
          ? [{ label: `Sugerido · ${Math.round(suggested).toLocaleString('es-CO')}`, value: Math.round(suggested) }]
          : []),
        ...(goal.currency === 'COP'
          ? [500_000, 1_000_000].filter((v) => v < remaining).map((v) => ({ label: compact(v), value: v }))
          : []),
        ...(remaining > 0 ? [{ label: `Completar · ${compact(remaining)}`, value: remaining }] : []),
      ]
    : []

  const handleAccountChange = (id: string) => {
    setAccountId(id)
    const account = activeAccounts.find((a) => a.id === id)
    setCurrency(account ? account.currency : goal.currency)
  }

  const handleSubmit = async () => {
    if (!amount) return
    setLoading(true)
    const result = await addFundsToGoal(goal.id, userId, {
      amount,
      account_id: accountId || undefined,
      currency,
    })
    setLoading(false)

    if (result.success) {
      toaster.create({
        title: `Fondos añadidos · ${goal.name} · ${formatCurrency(amount, currency, decimalsFor(currency))}`,
        type: 'success',
        duration: 2600,
      })
      onClose()
      onSuccess()
    } else {
      toaster.create({ title: result.error || 'Error al añadir fondos', type: 'error', duration: 5000 })
    }
  }

  const after = credited != null ? remaining - credited : null

  return (
    <FormModalContent
      title={goal.name}
      header={
        <>
          <Text fontSize="13px" color="text3">
            Añadir fondos a
          </Text>
          <Text as="h2" fontSize="18px" fontWeight="600" letterSpacing="-0.01em" color="text">
            {goal.name}
          </Text>
        </>
      }
      onClose={onClose}
      onSubmit={handleSubmit}
      canSubmit={!!amount && preview?.ok !== false}
      loading={loading}
      submitLabel={
        <>
          Añadir
          {amount && (
            <Text as="span" fontFamily="mono" fontWeight="500">
              {formatCurrency(amount, currency, decimalsFor(currency))}
            </Text>
          )}
        </>
      }
    >
      <Box>
        <Flex justify="space-between" align="flex-end" mb={2.5}>
          <Text fontFamily="mono" fontSize="13px" color="text2">
            {fmtGoal(current)} / {fmtGoal(target)}
          </Text>
          <Text
            fontFamily="mono"
            fontSize="28px"
            fontWeight="500"
            letterSpacing="-0.03em"
            lineHeight="1"
            color={ghostPct > 0 ? 'brand' : 'text'}
          >
            {totalPct}%
          </Text>
        </Flex>
        <Flex
          h="10px"
          bg="track"
          borderRadius="pill"
          overflow="hidden"
          role="progressbar"
          aria-valuenow={totalPct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progreso de la meta"
        >
          <Box w={`${currentPct}%`} bg="brandSolid" />
          {/* Ghost segment: the contribution being typed. */}
          <Box w={`${ghostPct}%`} bg="brand" opacity={0.55} transition="width .2s" />
        </Flex>
      </Box>

      <Box>
        <AmountBlock
          amount={amount}
          currency={currency}
          onAmountChange={setAmount}
          onCurrencyChange={setCurrency}
          currencyLocked={!!accountId}
          color="pos"
          autoFocus
          footer={
            preview ? (
              <Text fontFamily="mono" fontSize="12px" color={preview.ok ? 'text3' : 'neg'}>
                {preview.ok ? `≈ ${fmtGoal(preview.amount)} en la meta` : preview.error}
              </Text>
            ) : undefined
          }
        />
        {quick.length > 0 && (
          <Flex wrap="wrap" gap={2} mt={3} justify="center">
            {quick.map((q) => (
              <Chip
                key={q.label}
                selected={amount === q.value}
                onClick={() => setAmount(q.value)}
                h="32px"
                fontFamily="mono"
                fontSize="12px"
              >
                {q.label}
              </Chip>
            ))}
          </Flex>
        )}
      </Box>

      {activeAccounts.length > 0 && (
        <Field label="Sale de">
          <AccountChips
            accounts={activeAccounts}
            value={accountId}
            onChange={handleAccountChange}
            leading={{ value: '', label: '∅ Sin cuenta', hint: 'No mueve saldo' }}
          />
        </Field>
      )}

      <SummaryBox icon={LuTarget}>
        {after == null || !amount
          ? `Te faltan ${fmtGoal(remaining)} para completar la meta.`
          : after <= 0
            ? `¡Con este aporte completas ${goal.name}!`
            : `Después de este aporte te faltarán ${fmtGoal(after)}.`}
      </SummaryBox>
    </FormModalContent>
  )
}

/** Pulso "Añadir fondos a <meta>". */
export function AddFundsForm({ isOpen, ...props }: Props) {
  return (
    <FormModal isOpen={isOpen} onClose={props.onClose} title={`Añadir fondos a ${props.goal.name}`}>
      <AddFundsBody {...props} />
    </FormModal>
  )
}
