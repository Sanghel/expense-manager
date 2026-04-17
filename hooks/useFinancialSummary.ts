'use client'

import { useMemo } from 'react'
import type { TransactionWithCategory, Currency } from '@/types/database.types'

interface FinancialSummary {
  totalIncome: number
  totalExpense: number
  balance: number
  currency: Currency
  transactionCount: number
}

export function useFinancialSummary(
  transactions: TransactionWithCategory[],
  month?: string,
  preferredCurrency: Currency = 'COP',
  exchangeRates: any[] = []
) {
  const summary = useMemo<FinancialSummary>(() => {
    const filtered = month
      ? transactions.filter((t) => t.date.startsWith(month))
      : transactions

    const getRateMultiplier = (from: Currency, to: Currency): number => {
      if (from === to) return 1
      const rate = exchangeRates.find(
        (r: any) => r.from_currency === from && r.to_currency === to
      )
      return rate ? rate.rate : 1
    }

    const income = filtered
      .filter((t) => t.type === 'income')
      .reduce(
        (sum, t) =>
          sum + Number(t.amount) * getRateMultiplier(t.currency as Currency, preferredCurrency),
        0
      )

    const expense = filtered
      .filter((t) => t.type === 'expense')
      .reduce(
        (sum, t) =>
          sum + Number(t.amount) * getRateMultiplier(t.currency as Currency, preferredCurrency),
        0
      )

    return {
      totalIncome: income,
      totalExpense: expense,
      balance: income - expense,
      currency: preferredCurrency,
      transactionCount: filtered.length,
    }
  }, [transactions, month, preferredCurrency, exchangeRates])

  return { summary, loading: false }
}
