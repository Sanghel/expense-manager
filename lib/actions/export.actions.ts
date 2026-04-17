'use server'

import { insforgeAdmin } from '@/lib/insforge-admin'
import type { TransactionWithCategory } from '@/types/database.types'

export async function exportTransactions(userId: string, format: 'csv' | 'json') {
  if (!userId) {
    console.error('exportTransactions: userId is missing')
    return { success: false, error: 'User ID is required' }
  }
  try {
    const { data, error } = await insforgeAdmin.database
      .from('transactions')
      .select('*, category:categories(*)')
      .eq('user_id', userId)
      .order('date', { ascending: false })

    if (error) throw error

    const transactions = data as TransactionWithCategory[]

    if (format === 'csv') {
      return { success: true, data: convertToCSV(transactions), filename: 'transactions.csv' }
    }

    return { success: true, data: JSON.stringify(transactions, null, 2), filename: 'transactions.json' }
  } catch (error) {
    console.error('Export error:', error)
    return { success: false, error: 'Failed to export transactions' }
  }
}

function convertToCSV(transactions: TransactionWithCategory[]): string {
  const headers = ['Date', 'Description', 'Category', 'Type', 'Amount', 'Currency', 'Notes']
  const rows = transactions.map(t => [
    t.date,
    t.description,
    t.category?.name ?? '',
    t.type,
    t.amount,
    t.currency,
    t.notes || '',
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ].join('\n')

  return csvContent
}
