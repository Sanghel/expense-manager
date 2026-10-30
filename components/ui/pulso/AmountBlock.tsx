'use client'

import { useState } from 'react'
import { Button, Flex, Input, Stack, Text } from '@chakra-ui/react'
import { CurrencyPreview } from '@/components/transactions/CurrencyPreview'
import { CURRENCIES, CURRENCY_SYMBOL, formatTyping, parseTyping, toTypingText } from '@/lib/utils/amount-input'
import type { Currency } from '@/types/database.types'

interface Props {
  amount: number | undefined
  currency: Currency
  onAmountChange: (amount: number | undefined) => void
  /** Without it the currency pills are hidden. */
  onCurrencyChange?: (currency: Currency) => void
  /** E.g. an account was picked: only its currency can be used. */
  currencyLocked?: boolean
  currencies?: Currency[]
  /** "−" / "+" before the symbol. */
  sign?: string
  /** Figure color (`pos` in Añadir fondos). */
  color?: string
  /** Line under the figure; defaults to the conversion preview. Pass null to hide it. */
  footer?: React.ReactNode
  /** `bg` card (handoff); `bare` keeps the larger figure of Nueva transacción. */
  variant?: 'card' | 'bare'
  autoFocus?: boolean
  label?: string
}

/**
 * Pulso amount block: currency pills → symbol + mono figure as wide as its
 * digits, with live thousands formatting → conversion line.
 */
export function AmountBlock({
  amount,
  currency,
  onAmountChange,
  onCurrencyChange,
  currencyLocked = false,
  currencies = CURRENCIES,
  sign = '',
  color = 'text',
  footer,
  variant = 'card',
  autoFocus,
  label = 'Monto',
}: Props) {
  const [text, setText] = useState(() => toTypingText(amount))
  // The amount can also change from outside (quick chips): resync the text
  // when it no longer matches what was typed.
  const [syncedAmount, setSyncedAmount] = useState(amount)
  if (amount !== syncedAmount) {
    setSyncedAmount(amount)
    if (parseTyping(text) !== amount) setText(toTypingText(amount))
  }

  const card = variant === 'card'

  return (
    <Stack
      align="center"
      gap={3}
      bg={card ? 'bg' : undefined}
      borderRadius={card ? '20px' : undefined}
      px={card ? 3 : 0}
      py={card ? '18px' : 0}
    >
      {onCurrencyChange && (
        <Flex gap={1} role="radiogroup" aria-label="Moneda">
          {currencies.map((c) => {
            const active = currency === c
            return (
              <Button
                key={c}
                role="radio"
                aria-checked={active}
                onClick={() => onCurrencyChange(c)}
                disabled={currencyLocked && !active}
                title={currencyLocked && !active ? 'La moneda la define la cuenta' : undefined}
                size="2xs"
                px={2.5}
                fontFamily="mono"
                fontSize="11px"
                bg={active ? 'text' : 'transparent'}
                color={active ? 'bg' : 'text3'}
                _hover={{ color: active ? 'bg' : 'text' }}
              >
                {c}
              </Button>
            )
          })}
        </Flex>
      )}
      <Flex align="baseline" justify="center" maxW="full">
        <Text
          as="span"
          fontFamily="mono"
          fontSize={card ? '18px' : '20px'}
          color="text3"
          me={1.5}
          whiteSpace="nowrap"
        >
          {sign}
          {CURRENCY_SYMBOL[currency]}
        </Text>
        <Input
          value={text}
          onChange={(e) => {
            const next = formatTyping(e.target.value)
            setText(next)
            onAmountChange(parseTyping(next))
          }}
          inputMode="decimal"
          placeholder="0"
          aria-label={label}
          autoFocus={autoFocus}
          variant="flushed"
          bg="transparent"
          borderBottomWidth="0"
          _focusVisible={{ boxShadow: 'none' }}
          // Width follows the digits so symbol and figure read as one unit.
          w={`${Math.max(text.length, 1) + 0.5}ch`}
          maxW="11ch"
          h="auto"
          px={0}
          fontFamily="mono"
          fontSize={card ? '44px' : { base: '44px', md: '52px' }}
          fontWeight="500"
          letterSpacing="-0.04em"
          lineHeight="1"
          color={amount ? color : 'text'}
          _placeholder={{ color: 'text3' }}
        />
      </Flex>
      {footer === undefined ? <CurrencyPreview variant="inline" amount={amount ?? 0} fromCurrency={currency} /> : footer}
    </Stack>
  )
}
