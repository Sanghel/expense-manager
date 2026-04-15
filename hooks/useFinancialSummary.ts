'use client'

import { useEffect, useState } from 'react'
import { getTransactions } from '@/lib/actions/transactions.actions'
import type { TransactionWithCategory } from '@/types/database.types'

interface FinancialSummary {
  totalIncome: number
  totalExpense: number
  balance: number
  currency: string
  transactionCount: number
}

export function useFinancialSummary(userId: string, month?: string) {
  const [summary, setSummary] = useState<FinancialSummary>({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    currency: 'COP',
    transactionCount: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSummary() {
      setLoading(true)
      const result = await getTransactions(userId, 100)

      if (result.success && result.data) {
        const transactions = result.data as TransactionWithCategory[]

        // Filtrar por mes si se proporciona
        const filtered = month
          ? transactions.filter((t) => t.date.startsWith(month))
          : transactions

        const income = filtered
          .filter((t) => t.type === 'income')
          .reduce((sum, t) => sum + Number(t.amount), 0)

        const expense = filtered
          .filter((t) => t.type === 'expense')
          .reduce((sum, t) => sum + Number(t.amount), 0)

        setSummary({
          totalIncome: income,
          totalExpense: expense,
          balance: income - expense,
          currency: 'COP',
          transactionCount: filtered.length,
        })
      }
      setLoading(false)
    }

    fetchSummary()
  }, [userId, month])

  return { summary, loading }
}
