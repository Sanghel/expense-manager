import * as z from 'zod'

export const createBudgetSchema = z.object({
  category_id: z.string().uuid(),
  amount: z.number().positive(),
  currency: z.enum(['COP', 'USD', 'BOB']),
  period: z.enum(['monthly', 'yearly']),
  start_date: z.string(),
})

export type CreateBudgetInput = z.infer<typeof createBudgetSchema>
