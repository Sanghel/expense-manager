'use server'

import { insforgeAdmin } from '@/lib/insforge-admin'
import type { TransactionWithCategory } from '@/types/database.types'

interface ExportFilters {
  month?: number  // 1-12
  year?: number
}

export async function exportTransactions(
  userId: string,
  format: 'csv' | 'json' | 'xlsx',
  filters?: ExportFilters
) {
  if (!userId) {
    return { success: false, error: 'User ID is required' }
  }
  try {
    let query = insforgeAdmin.database
      .from('transactions')
      .select('*, category:categories(*)')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })

    if (filters?.year && filters?.month) {
      const y = filters.year
      const m = String(filters.month).padStart(2, '0')
      const firstDay = `${y}-${m}-01`
      const lastDay = new Date(y, filters.month, 0).toISOString().slice(0, 10)
      query = query.gte('date', firstDay).lte('date', lastDay)
    } else if (filters?.year) {
      query = query.gte('date', `${filters.year}-01-01`).lte('date', `${filters.year}-12-31`)
    }

    const { data, error } = await query
    if (error) throw error

    const transactions = data as TransactionWithCategory[]
    const suffix = buildSuffix(filters)

    if (format === 'csv') {
      return { success: true, data: convertToCSV(transactions), filename: `transactions${suffix}.csv` }
    }

    if (format === 'xlsx') {
      const base64 = await convertToXLSX(transactions)
      return { success: true, data: base64, filename: `transactions${suffix}.xlsx`, encoding: 'base64' }
    }

    return { success: true, data: JSON.stringify(transactions, null, 2), filename: `transactions${suffix}.json` }
  } catch (error) {
    console.error('Export error:', error)
    return { success: false, error: 'Failed to export transactions' }
  }
}

function buildSuffix(filters?: ExportFilters): string {
  if (!filters) return ''
  if (filters.year && filters.month) {
    return `_${filters.year}-${String(filters.month).padStart(2, '0')}`
  }
  if (filters.year) return `_${filters.year}`
  return ''
}

function convertToCSV(transactions: TransactionWithCategory[]): string {
  const headers = ['Date', 'Description', 'Category', 'Type', 'Amount', 'Currency', 'Notes']
  const rows = transactions.map((t) => [
    t.date,
    t.description,
    t.category?.name ?? '',
    t.type,
    t.amount,
    t.currency,
    t.notes || '',
  ])

  return [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ].join('\n')
}

async function convertToXLSX(transactions: TransactionWithCategory[]): Promise<string> {
  // Dynamic import to avoid bundling xlsx on the client
  const XLSX = await import('xlsx')

  const rows = transactions.map((t) => ({
    Fecha: t.date,
    Descripción: t.description,
    Categoría: t.category?.name ?? '',
    Tipo: t.type === 'income' ? 'Ingreso' : 'Gasto',
    Monto: Number(t.amount),
    Moneda: t.currency,
    Notas: t.notes || '',
  }))

  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Transacciones')

  return XLSX.write(wb, { type: 'base64', bookType: 'xlsx' }) as string
}
