import { z } from 'zod'

export const createAccountSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  type: z.enum(['bank', 'digital', 'crypto', 'cash', 'card']),
  currency: z.enum(['COP', 'USD', 'VES']),
  balance: z.number().default(0),
  credit_limit: z.number().positive().nullable().optional(),
  color: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
  last_four: z
    .string()
    .regex(/^[0-9]{4}$/, 'Deben ser 4 dígitos')
    .nullable()
    .optional(),
  card_number: z
    .string()
    .regex(/^[0-9]{4}$/, 'Deben ser 4 dígitos')
    .nullable()
    .optional(),
  is_default: z.boolean().optional(),
})

export const updateAccountSchema = createAccountSchema.partial()

export const createAccountMovementSchema = z.object({
  from_account_id: z.string().uuid(),
  from_amount: z.number().positive('El monto enviado debe ser mayor a 0'),
  from_currency: z.enum(['COP', 'USD', 'VES']),
  to_account_id: z.string().uuid(),
  to_amount: z.number().positive('El monto recibido debe ser mayor a 0'),
  to_currency: z.enum(['COP', 'USD', 'VES']),
  description: z.string().nullable().optional(),
  date: z.string(),
})

export type CreateAccountInput = z.infer<typeof createAccountSchema>
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>
export type CreateAccountMovementInput = z.infer<typeof createAccountMovementSchema>
