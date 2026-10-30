'use client'

import { useState } from 'react'
import { Box, Flex, Grid, Icon, Input, Text } from '@chakra-ui/react'
import { LuMail } from 'react-icons/lu'
import { createAccount, updateAccount } from '@/lib/actions/accounts.actions'
import { toaster } from '@/lib/toaster'
import {
  ChipGroup,
  ColorSwatches,
  EmojiGrid,
  Field,
  FormModal,
  FormModalContent,
  SegmentedControl,
  SwitchRow,
} from '@/components/ui/pulso'
import { formatCurrency } from '@/lib/utils/currency'
import { CURRENCIES, CURRENCY_SYMBOL, decimalsFor, formatTyping } from '@/lib/utils/amount-input'
import type { Account, AccountType, Currency } from '@/types/database.types'

const TYPES: { value: AccountType; label: string; emoji: string }[] = [
  { value: 'bank', label: 'Banco', emoji: '🏦' },
  { value: 'cash', label: 'Efectivo', emoji: '💵' },
  { value: 'digital', label: 'Billetera digital', emoji: '📱' },
  { value: 'crypto', label: 'Cripto', emoji: '🪙' },
  { value: 'card', label: 'Tarjeta de crédito', emoji: '💳' },
]

const ICONS = ['💳', '🏦', '💵', '💲', '📱', '🪙', '📈', '🐷', '💼', '🏠']

/** Signed amount typing: "-307.933" → -307933. */
function parseSigned(text: string): number | undefined {
  const negative = text.trim().startsWith('-')
  const n = Number(text.replace(/[^0-9,]/g, '').replace(',', '.'))
  if (!text.replace(/[^0-9]/g, '') || !Number.isFinite(n)) return undefined
  return negative ? -n : n
}

function toSignedText(n: number | undefined): string {
  if (n == null) return ''
  const [int, dec = ''] = Math.abs(n).toFixed(2).split('.')
  const decimals = dec.replace(/0+$/, '')
  return `${n < 0 ? '-' : ''}${formatTyping(decimals ? `${int},${decimals}` : int)}`
}

interface Props {
  isOpen: boolean
  onClose: () => void
  userId: string
  editingAccount?: Account | null
  onSuccess: () => void
}

function AccountFormBody({ onClose, userId, editingAccount, onSuccess }: Omit<Props, 'isOpen'>) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState(() => ({
    name: editingAccount?.name ?? '',
    type: (editingAccount?.type ?? 'bank') as AccountType,
    currency: (editingAccount?.currency ?? 'COP') as Currency,
    icon: editingAccount?.icon ?? '💳',
    color: editingAccount?.color ?? '#6366f1',
    last_four: editingAccount?.last_four ?? '',
    card_number: editingAccount?.card_number ?? '',
    is_default: editingAccount?.is_default ?? false,
  }))
  // Balance for regular accounts, total credit for cards.
  const [balanceText, setBalanceText] = useState(() => toSignedText(editingAccount ? Number(editingAccount.balance) : 0))
  const [limitText, setLimitText] = useState(() =>
    editingAccount?.credit_limit != null ? toSignedText(Number(editingAccount.credit_limit)) : ''
  )
  const set = (patch: Partial<typeof formData>) => setFormData((prev) => ({ ...prev, ...patch }))

  const isCard = formData.type === 'card'
  const balance = parseSigned(balanceText)
  const creditLimit = parseSigned(limitText)
  const typeInfo = TYPES.find((t) => t.value === formData.type)
  const digitsOk = (v: string) => !v || /^[0-9]{4}$/.test(v)
  const canSave =
    !!formData.name.trim() &&
    digitsOk(formData.last_four) &&
    (isCard || digitsOk(formData.card_number)) &&
    (!isCard || (!!creditLimit && creditLimit > 0))

  const handleSubmit = async () => {
    setLoading(true)
    const data = {
      name: formData.name.trim(),
      type: formData.type,
      currency: formData.currency,
      balance: isCard ? (creditLimit ?? 0) : (balance ?? 0),
      credit_limit: isCard ? (creditLimit ?? null) : null,
      icon: formData.icon || null,
      color: formData.color || null,
      last_four: formData.last_four || null,
      // Card number only applies to non-card accounts (a card that shares the
      // account's fund). Card-type accounts use last_four for their own card.
      card_number: isCard ? null : formData.card_number || null,
      is_default: formData.is_default,
    }

    const result = editingAccount
      ? await updateAccount(editingAccount.id, userId, data)
      : await createAccount(userId, data)

    if (result.success) {
      toaster.create({
        title: `${editingAccount ? 'Cuenta actualizada' : 'Cuenta creada'} · ${data.name}`,
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

  const previewMeta = [
    typeInfo?.label,
    formData.currency,
    formData.last_four.length === 4 ? `•••• ${formData.last_four}` : null,
    formData.is_default ? 'Por defecto' : null,
  ]
    .filter(Boolean)
    .join(' · ')
  const previewAmount = isCard ? creditLimit : balance

  const digitsInput = (value: string, onChange: (v: string) => void, label: string) => (
    <Flex align="center" bg="surface2" borderRadius="input" h="44px" px={3.5} gap={2}>
      <Text fontFamily="mono" fontSize="14px" color="text3">
        ••••
      </Text>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
        inputMode="numeric"
        placeholder="1234"
        aria-label={label}
        h="full"
        px={0}
        bg="transparent"
        fontFamily="mono"
        _focusVisible={{ boxShadow: 'none' }}
      />
    </Flex>
  )

  const amountInput = (text: string, onChange: (v: string) => void, label: string) => (
    <Flex align="center" bg="surface2" borderRadius="input" h="44px" px={3.5} gap={2}>
      <Text fontFamily="mono" fontSize="13px" color="text3" whiteSpace="nowrap">
        {CURRENCY_SYMBOL[formData.currency]}
      </Text>
      <Input
        value={text}
        onChange={(e) => {
          const raw = e.target.value
          onChange(`${raw.trim().startsWith('-') && !isCard ? '-' : ''}${formatTyping(raw)}`)
        }}
        inputMode="decimal"
        placeholder="0"
        aria-label={label}
        h="full"
        px={0}
        bg="transparent"
        fontFamily="mono"
        _focusVisible={{ boxShadow: 'none' }}
      />
    </Flex>
  )

  return (
    <FormModalContent
      title={editingAccount ? 'Editar cuenta' : 'Nueva cuenta'}
      onClose={onClose}
      onSubmit={handleSubmit}
      canSubmit={canSave}
      loading={loading}
      submitLabel={editingAccount ? 'Guardar cambios' : 'Crear cuenta'}
    >
      {/* Live preview */}
      <Flex align="center" gap={3.5} bg="bg" borderRadius="20px" p={4}>
        <Flex
          boxSize="48px"
          borderRadius="input"
          align="center"
          justify="center"
          fontSize="22px"
          flexShrink={0}
          style={{ background: `color-mix(in oklab, ${formData.color} 26%, transparent)` }}
        >
          {formData.icon}
        </Flex>
        <Box minW={0} flex="1">
          <Text fontSize="15px" fontWeight="600" color="text" truncate>
            {formData.name.trim() || 'Nueva cuenta'}
          </Text>
          <Text fontFamily="mono" fontSize="11px" color="text3" mt={0.5} truncate>
            {previewMeta}
          </Text>
        </Box>
        <Text fontFamily="mono" fontSize="17px" fontWeight="500" color={(previewAmount ?? 0) < 0 ? 'neg' : 'text'}>
          {formatCurrency(previewAmount ?? 0, formData.currency, decimalsFor(formData.currency))}
        </Text>
      </Flex>

      <Field label="Nombre">
        <Input
          value={formData.name}
          onChange={(e) => set({ name: e.target.value })}
          placeholder="Ej: Bancolombia Ahorros"
          h="44px"
          autoFocus={!editingAccount}
        />
      </Field>

      <Field label="Tipo">
        <ChipGroup
          value={formData.type}
          onChange={(type) => set({ type })}
          options={TYPES.map((t) => ({ value: t.value, label: t.label, icon: t.emoji }))}
        />
      </Field>

      <Grid templateColumns={{ base: '1fr', sm: '1fr 1fr' }} gap={4}>
        <Field label="Moneda">
          <SegmentedControl
            label="Moneda"
            value={formData.currency}
            onChange={(currency) => set({ currency })}
            options={CURRENCIES.map((c) => ({ value: c, label: c }))}
            variant="field"
            fullWidth
          />
        </Field>
        {isCard ? (
          <Field label="Cupo total">{amountInput(limitText, setLimitText, 'Cupo total')}</Field>
        ) : (
          <Field label={editingAccount ? 'Saldo actual' : 'Saldo inicial'}>
            {amountInput(balanceText, setBalanceText, editingAccount ? 'Saldo actual' : 'Saldo inicial')}
          </Field>
        )}
      </Grid>

      <Box bg="bg" borderRadius="tile" p={4}>
        <Flex gap={3} align="flex-start" mb={3.5}>
          <Icon as={LuMail} boxSize="18px" color="brand" mt="2px" flexShrink={0} />
          <Box>
            <Text fontSize="14px" fontWeight="500" color="text">
              Integración con Gmail · opcional
            </Text>
            <Text fontSize="12px" color="text3" mt={0.5}>
              Con los últimos 4 dígitos reconocemos los correos del banco y los asignamos a esta cuenta.
            </Text>
          </Box>
        </Flex>
        <Grid templateColumns={{ base: '1fr', sm: isCard ? '1fr' : '1fr 1fr' }} gap={3}>
          <Field label={isCard ? 'Últimos 4 de la tarjeta' : 'Últimos 4 de la cuenta'}>
            {digitsInput(formData.last_four, (last_four) => set({ last_four }), 'Últimos 4 dígitos')}
          </Field>
          {!isCard && (
            <Field label="Últimos 4 de la tarjeta">
              {digitsInput(formData.card_number, (card_number) => set({ card_number }), 'Tarjeta asociada')}
            </Field>
          )}
        </Grid>
      </Box>

      <Field label="Ícono y color">
        <EmojiGrid
          value={formData.icon}
          onChange={(icon) => set({ icon })}
          emojis={ICONS.includes(formData.icon) ? ICONS : [formData.icon, ...ICONS]}
        />
        <Box mt={4}>
          <ColorSwatches value={formData.color} onChange={(color) => set({ color })} />
        </Box>
      </Field>

      <SwitchRow
        title="Cuenta por defecto"
        description="Se usa al pagar recordatorios sin cuenta asignada"
        checked={formData.is_default}
        onChange={(is_default) => set({ is_default })}
      />
    </FormModalContent>
  )
}

/** Pulso "Nueva cuenta" / "Editar cuenta" (same modal, `editingAccount` for edit). */
export function AccountForm({ isOpen, ...props }: Props) {
  return (
    <FormModal isOpen={isOpen} onClose={props.onClose} title={props.editingAccount ? 'Editar cuenta' : 'Nueva cuenta'}>
      <AccountFormBody {...props} />
    </FormModal>
  )
}
