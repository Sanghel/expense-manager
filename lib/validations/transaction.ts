import * as z from 'zod'

export const createTransactionSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  currency: z.enum(['COP', 'USD', 'BOB']),
  type: z.enum(['income', 'expense']),
  category_id: z.string().uuid(),
  description: z.string().min(1, 'Description is required'),
  date: z.string(),
  notes: z.string().optional(),
})

export const updateTransactionSchema = createTransactionSchema.partial()

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>
