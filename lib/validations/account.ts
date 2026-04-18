import { z } from 'zod'

export const createAccountSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  type: z.enum(['bank', 'digital', 'crypto', 'cash']),
  currency: z.enum(['COP', 'USD', 'VES']),
  balance: z.number().default(0),
  color: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
})

export const updateAccountSchema = createAccountSchema.partial()

export const createAccountMovementSchema = z.object({
  from_account_id: z.string().uuid(),
  to_account_id: z.string().uuid(),
  amount: z.number().positive('El monto debe ser mayor a 0'),
  currency: z.enum(['COP', 'USD', 'VES']),
  description: z.string().nullable().optional(),
  date: z.string(),
})

export type CreateAccountInput = z.infer<typeof createAccountSchema>
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>
export type CreateAccountMovementInput = z.infer<typeof createAccountMovementSchema>
