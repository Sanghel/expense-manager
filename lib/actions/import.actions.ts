'use server'

import { insforgeAdmin } from '@/lib/insforge-admin'
import { createTransactionSchema } from '@/lib/validations/transaction'
import { importRowSchema } from '@/lib/validations/transaction'
import { applyBalanceDelta } from '@/lib/utils/balance-updater'
import { revalidatePath } from 'next/cache'
import type { ParsedImportRow, ResolvedImportRow } from '@/types/import.types'
import type { CreateTransactionInput } from '@/lib/validations/transaction'

// ─── Template ────────────────────────────────────────────────────────────────

export async function downloadImportTemplate() {
  try {
    const XLSX = await import('xlsx')

    const headers = ['fecha', 'descripcion', 'categoria', 'cuenta', 'tipo', 'monto', 'moneda', 'notas']

    const sampleRows = [
      ['2026-05-01', 'Mercado semanal', 'Alimentación', 'Efectivo', 'Gasto', 150000, 'COP', 'Compras del mes'],
      ['2026-05-05', 'Salario', 'Salario', 'Bancolombia', 'Ingreso', 3500, 'USD', ''],
    ]

    // Build worksheet manually to support cell styles
    const wsData = [headers, ...sampleRows]
    const ws = XLSX.utils.aoa_to_sheet(wsData)

    // Column widths
    ws['!cols'] = [
      { wch: 14 }, // fecha
      { wch: 32 }, // descripcion
      { wch: 22 }, // categoria
      { wch: 22 }, // cuenta
      { wch: 10 }, // tipo
      { wch: 12 }, // monto
      { wch: 10 }, // moneda
      { wch: 28 }, // notas
    ]

    // Header cell styles: bold + indigo background + white text
    const headerStyle = {
      font: { bold: true, color: { rgb: 'FFFFFF' } },
      fill: { patternType: 'solid', fgColor: { rgb: '4F46E5' } },
      alignment: { horizontal: 'center' },
    }
    headers.forEach((_, col) => {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: col })
      if (ws[cellRef]) ws[cellRef].s = headerStyle
    })

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Plantilla')

    const base64 = XLSX.write(wb, { type: 'base64', bookType: 'xlsx', cellStyles: true }) as string
    return { success: true, data: base64, filename: 'plantilla-importacion.xlsx' }
  } catch (error) {
    console.error('Template generation error:', error)
    return { success: false, error: 'No se pudo generar la plantilla' }
  }
}

// ─── Row Resolution ───────────────────────────────────────────────────────────

export async function resolveImportRows(
  userId: string,
  rawRows: ParsedImportRow[]
): Promise<ResolvedImportRow[]> {
  // Fetch user's categories (predefined + custom)
  const { data: categories } = await insforgeAdmin.database
    .from('categories')
    .select('id, name, type')
    .or(`user_id.eq.${userId},user_id.is.null`)

  // Fetch user's accounts
  const { data: accounts } = await insforgeAdmin.database
    .from('accounts')
    .select('id, name')
    .eq('user_id', userId)
    .eq('is_active', true)

  const categoryByName = new Map<string, { id: string; type: string }>()
  for (const cat of categories ?? []) {
    categoryByName.set(cat.name.toLowerCase().trim(), { id: cat.id, type: cat.type })
  }

  const accountByName = new Map<string, string>()
  for (const acc of accounts ?? []) {
    accountByName.set(acc.name.toLowerCase().trim(), acc.id)
  }

  return rawRows.map((row) => {
    const errors: string[] = []
    const prefix = `Fila ${row.rowIndex}:`

    const parsed = importRowSchema.safeParse(row.raw)

    if (!parsed.success) {
      const messages = parsed.error.issues.map((i: { message: string }) => `${prefix} ${i.message}`)
      return {
        rowIndex: row.rowIndex,
        status: 'error',
        errors: messages,
        displayData: buildDisplayData(row.raw),
      }
    }

    const { category, account, ...rest } = parsed.data

    // Resolve category name → UUID
    const categoryEntry = categoryByName.get(category.toLowerCase().trim())
    if (!categoryEntry) {
      errors.push(`${prefix} Categoría '${category}' no encontrada`)
    } else if (categoryEntry.type !== rest.type) {
      errors.push(
        `${prefix} La categoría '${category}' es de tipo ${categoryEntry.type === 'expense' ? 'gasto' : 'ingreso'}, no ${rest.type === 'expense' ? 'gasto' : 'ingreso'}`
      )
    }

    // Resolve account name → UUID (optional)
    let account_id: string | null = null
    if (account && account.trim() !== '') {
      const resolvedAccountId = accountByName.get(account.toLowerCase().trim())
      if (!resolvedAccountId) {
        errors.push(`${prefix} Cuenta '${account}' no encontrada`)
      } else {
        account_id = resolvedAccountId
      }
    }

    if (errors.length > 0) {
      return {
        rowIndex: row.rowIndex,
        status: 'error',
        errors,
        displayData: buildDisplayData(row.raw),
      }
    }

    const data: CreateTransactionInput = {
      ...rest,
      category_id: categoryEntry!.id,
      account_id,
    }

    return {
      rowIndex: row.rowIndex,
      status: 'valid',
      errors: [],
      data,
      displayData: {
        amount: rest.amount,
        currency: rest.currency,
        type: rest.type,
        category,
        account: account ?? '',
        description: rest.description,
        date: rest.date,
        notes: rest.notes,
      },
    }
  })
}

function buildDisplayData(raw: Record<string, unknown>) {
  return {
    amount: String(raw.amount ?? ''),
    currency: String(raw.currency ?? ''),
    type: String(raw.type ?? ''),
    category: String(raw.category ?? ''),
    account: String(raw.account ?? ''),
    description: String(raw.description ?? ''),
    date: String(raw.date ?? ''),
    notes: raw.notes != null ? String(raw.notes) : undefined,
  }
}

// ─── Bulk Insert ──────────────────────────────────────────────────────────────

export async function bulkImportTransactions(
  userId: string,
  rows: CreateTransactionInput[]
): Promise<{ success: boolean; imported?: number; error?: string }> {
  if (!rows.length) return { success: false, error: 'No hay filas para importar' }

  try {
    // Defense in depth: re-validate every row before insert
    const validated = rows.map((r) => createTransactionSchema.parse(r))

    const toInsert = validated.map((r) => ({ ...r, user_id: userId, source: 'import' as const }))

    const { error } = await insforgeAdmin.database.from('transactions').insert(toInsert)
    if (error) throw error

    // Update account balances sequentially to avoid race conditions on same account
    for (const row of validated) {
      if (row.account_id) {
        const direction = row.type === 'income' ? 'add' : 'subtract'
        await applyBalanceDelta(row.account_id, row.amount, row.currency, direction)
      }
    }

    revalidatePath('/transactions')
    revalidatePath('/movimientos')
    revalidatePath('/dashboard')
    revalidatePath('/settings')
    revalidatePath('/calendar')

    return { success: true, imported: validated.length }
  } catch (error) {
    console.error('Bulk import error:', error)
    return { success: false, error: 'Error al importar las transacciones' }
  }
}
