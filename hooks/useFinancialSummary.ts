'use client'

import { useEffect, useState } from 'react'
import { getTransactions } from '@/lib/actions/transactions.actions'
import { convertCurrency } from '@/lib/actions/exchangeRates.actions'
import type { TransactionWithCategory, Currency } from '@/types/database.types'

interface FinancialSummary {
  totalIncome: number
  totalExpense: number
  balance: number
  currency: Currency
  transactionCount: number
}

export function useFinancialSummary(userId: string, month?: string, preferredCurrency: Currency = 'COP') {
  const [summary, setSummary] = useState<FinancialSummary>({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    currency: preferredCurrency,
    transactionCount: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSummary() {
      setLoading(true)
      const result = await getTransactions(userId, 200)

      if (result.success && result.data) {
        const transactions = result.data as TransactionWithCategory[]

        const filtered = month
          ? transactions.filter((t) => t.date.startsWith(month))
          : transactions

        // Convert each transaction amount to preferred currency before summing
        const converted = await Promise.all(
          filtered.map(async (t) => ({
            type: t.type,
            amount: t.currency === preferredCurrency
              ? Number(t.amount)
              : await convertCurrency(Number(t.amount), t.currency as Currency, preferredCurrency),
          }))
        )

        const income = converted
          .filter((t) => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0)

        const expense = converted
          .filter((t) => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0)

        setSummary({
          totalIncome: income,
          totalExpense: expense,
          balance: income - expense,
          currency: preferredCurrency,
          transactionCount: filtered.length,
        })
      }
      setLoading(false)
    }

    fetchSummary()
  }, [userId, month, preferredCurrency])

  return { summary, loading }
}
