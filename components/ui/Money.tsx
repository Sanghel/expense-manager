import { Text, TextProps } from '@chakra-ui/react'
import { formatCurrency } from '@/lib/utils/currency'

interface Props extends Omit<TextProps, 'children'> {
  amount: number
  currency: string
  /**
   * `expense` shows "−" in the neutral text color, `income` shows "+" in green.
   * `balance` (default) shows the sign as-is and negatives in red.
   */
  kind?: 'expense' | 'income' | 'balance'
  /** Decimals to show; whole amounts read better in lists and heroes. */
  fractionDigits?: number
}

/** Pulso figure: Geist Mono with tabular digits. */
export function Money({ amount, currency, kind = 'balance', fractionDigits = 2, ...props }: Props) {
  const formatted = formatCurrency(Math.abs(amount), currency, fractionDigits)
  const sign = kind === 'expense' ? '−' : kind === 'income' ? '+' : amount < 0 ? '−' : ''
  const color = kind === 'income' ? 'pos' : kind === 'balance' && amount < 0 ? 'neg' : undefined

  return (
    <Text as="span" fontFamily="mono" fontVariantNumeric="tabular-nums" whiteSpace="nowrap" color={color} {...props}>
      {sign}
      {formatted}
    </Text>
  )
}
