import { z } from 'zod'

export const loanSchema = z.object({
  person_name: z.string().min(1, 'El nombre es requerido'),
  amount: z.number().positive('El monto debe ser mayor a 0'),
  currency: z.enum(['COP', 'USD', 'VES']),
  account_id: z.string().uuid().nullable(),
  type: z.enum(['lent', 'borrowed']),
  notes: z.string().optional().nullable(),
})

export type LoanFormData = z.infer<typeof loanSchema>
