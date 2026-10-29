'use client'

import { useMemo } from 'react'
import { Box, Flex, Text } from '@chakra-ui/react'
import { formatCurrency } from '@/lib/utils/currency'
import { buildConverter } from '@/lib/utils/currency-converter'
import { splitBudgetsByScope } from '@/lib/utils/budget-grouping'
import { toNumber } from '@/lib/utils/numbers'
import type { BudgetWithSpent, Currency, ExchangeRate } from '@/types/database.types'

const OTHER: Record<Currency, Currency[]> = { COP: ['USD', 'VES'], USD: ['COP', 'VES'], VES: ['USD', 'COP'] }
const SYMBOL: Record<Currency, string> = { COP: 'COP', USD: 'US$', VES: 'Bs' }

/** COP has no cents in practice; USD/VES keep them. */
const decimalsFor = (currency: Currency) => (currency === 'COP' ? 0 : 2)

interface Props {
  balance: number
  currency: Currency
  exchangeRates: ExchangeRate[]
  budgets: BudgetWithSpent[]
  /** `YYYY-MM` shown in the label. */
  month: string
  /** The allowance only makes sense for the month in progress. */
  isCurrentMonth: boolean
}

/**
 * How much can still be spent per day this month: the "total" budget if
 * there is one, otherwise the sum of the group budgets.
 */
function useAllowance(budgets: BudgetWithSpent[], currency: Currency, rates: ExchangeRate[]) {
  return useMemo(() => {
    const { total, groups } = splitBudgetsByScope(budgets)
    const source = total.length > 0 ? total : groups
    if (source.length === 0) return null

    const convert = buildConverter(rates)
    const limit = source.reduce((s, b) => s + convert(toNumber(b.limit_amount), b.currency, currency), 0)
    const spent = source.reduce((s, b) => s + convert(toNumber(b.spent), b.currency, currency), 0)
    if (limit <= 0) return null

    const now = new Date()
    const day = now.getDate()
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    const daysLeft = daysInMonth - day + 1
    return {
      perDay: Math.max(0, limit - spent) / daysLeft,
      percent: (spent / limit) * 100,
      day,
      daysInMonth,
    }
  }, [budgets, currency, rates])
}

/** Brand hero: total balance in mono with its conversions and the daily allowance. */
export function BalanceHero({ balance, currency, exchangeRates, budgets, month, isCurrentMonth }: Props) {
  const convert = useMemo(() => buildConverter(exchangeRates), [exchangeRates])
  const allowance = useAllowance(budgets, currency, exchangeRates)
  const monthName = new Date(`${month}-01T12:00:00`).toLocaleDateString('es-CO', { month: 'long' })

  const conversions = OTHER[currency]
    .map((to) => `≈ ${formatCurrency(convert(balance, currency, to), to, decimalsFor(to))}`)
    .join(' · ')

  return (
    <Box bg="brandSolid" color="white" borderRadius="hero" p={{ base: 6, md: 8 }} minW={0}>
      <Text fontSize="14px" fontWeight="500" opacity={0.85}>
        Balance total · {monthName}
      </Text>
      <Text
        textStyle="heroFigure"
        mt={4}
        fontVariantNumeric="tabular-nums"
        overflowWrap="anywhere"
      >
        {balance < 0 && '−'}
        {new Intl.NumberFormat('es-CO', {
          minimumFractionDigits: decimalsFor(currency),
          maximumFractionDigits: decimalsFor(currency),
        }).format(Math.abs(balance))}
      </Text>
      <Text fontFamily="mono" fontSize="13px" opacity={0.72} mt={3}>
        {SYMBOL[currency]} · {conversions}
      </Text>

      {isCurrentMonth && allowance && (
        <Box bg="rgba(255,255,255,.12)" borderRadius="18px" p={4} mt={6}>
          <Flex justify="space-between" align="baseline" gap={3} wrap="wrap">
            <Text fontSize="13px" opacity={0.85}>
              Puedes gastar hasta fin de mes
            </Text>
            <Text fontFamily="mono" fontSize="15px" fontWeight="500">
              {formatCurrency(allowance.perDay, currency, decimalsFor(currency))} / día
            </Text>
          </Flex>
          <Box h="6px" bg="rgba(255,255,255,.2)" borderRadius="pill" overflow="hidden" mt={3}>
            <Box h="full" w={`${Math.min(100, allowance.percent)}%`} bg="white" borderRadius="pill" />
          </Box>
          <Text fontFamily="mono" fontSize="11px" opacity={0.72} mt={2}>
            Día {allowance.day} de {allowance.daysInMonth} · {Math.round(allowance.percent)}% del presupuesto usado
          </Text>
        </Box>
      )}
    </Box>
  )
}
