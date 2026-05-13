import * as z from 'zod'

// Raw row from an import file — uses human-readable names instead of UUIDs
export const importRowSchema = z.object({
  amount: z.coerce.number().positive('El monto debe ser positivo'),
  currency: z.enum(['COP', 'USD', 'VES'], { error: 'Moneda debe ser COP, USD o VES' }),
  type: z
    .string()
    .transform((v: string) => {
      const lower = v.toLowerCase().trim()
      if (lower === 'ingreso' || lower === 'income') return 'income'
      if (lower === 'gasto' || lower === 'expense') return 'expense'
      return lower
    })
    .pipe(z.enum(['income', 'expense'], { error: 'Tipo debe ser income/expense o Ingreso/Gasto' })),
  category: z.string().min(1, 'La categoría es requerida'),
  account: z.string().optional(),
  description: z.string().min(1, 'La descripción es requerida'),
  date: z.string().min(1, 'La fecha es requerida'),
  notes: z.string().optional(),
})

export type ImportRowInput = z.infer<typeof importRowSchema>

export const createTransactionSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  currency: z.enum(['COP', 'USD', 'VES']),
  type: z.enum(['income', 'expense']),
  category_id: z.string().uuid(),
  account_id: z.string().uuid().nullable().optional(),
  description: z.string().min(1, 'Description is required'),
  date: z.string(),
  notes: z.string().optional(),
})

export const updateTransactionSchema = createTransactionSchema.partial()

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>
