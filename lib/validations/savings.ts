import * as z from 'zod'

export const createSavingsGoalSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  target_amount: z.number().positive('El monto objetivo debe ser mayor que cero'),
  currency: z.enum(['COP', 'USD', 'VES']),
  deadline: z.string().min(1).nullable().optional(),
})

// `deadline` is re-declared explicitly: `.partial()` alone makes the key
// optional, so sending `undefined` drops it from the PATCH body and the old
// date survives. It has to accept `null` for the user to be able to clear it.
export const updateSavingsGoalSchema = createSavingsGoalSchema.partial().extend({
  deadline: z.string().min(1).nullable().optional(),
})

export const addFundsSchema = z.object({
  amount: z.number().positive('El monto debe ser mayor que cero'),
  account_id: z.string().uuid().optional(),
  currency: z.enum(['COP', 'USD', 'VES']).optional(),
  notes: z.string().max(200).optional(),
})

export type CreateSavingsGoalInput = z.infer<typeof createSavingsGoalSchema>
export type UpdateSavingsGoalInput = z.infer<typeof updateSavingsGoalSchema>
export type AddFundsInput = z.infer<typeof addFundsSchema>
