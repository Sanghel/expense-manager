import * as z from 'zod'

export const createRecurringTransactionSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  currency: z.enum(['COP', 'USD', 'VES']),
  type: z.enum(['income', 'expense']),
  category_id: z.string().uuid(),
  description: z.string().min(1, 'Description is required'),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  start_date: z.string(),
  end_date: z.string().optional(),
})

export const updateRecurringTransactionSchema = createRecurringTransactionSchema.partial()

export type CreateRecurringTransactionInput = z.infer<typeof createRecurringTransactionSchema>
export type UpdateRecurringTransactionInput = z.infer<typeof updateRecurringTransactionSchema>
