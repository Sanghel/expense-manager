import * as z from 'zod'

export const createSavingsGoalSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  target_amount: z.number().positive('Target amount must be positive'),
  currency: z.enum(['COP', 'USD', 'VES']),
  deadline: z.string().optional(),
})

export const updateSavingsGoalSchema = createSavingsGoalSchema.partial()

export const addFundsSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
})

export type CreateSavingsGoalInput = z.infer<typeof createSavingsGoalSchema>
export type UpdateSavingsGoalInput = z.infer<typeof updateSavingsGoalSchema>
export type AddFundsInput = z.infer<typeof addFundsSchema>
