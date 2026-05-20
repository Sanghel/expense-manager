import { z } from 'zod'

export const reminderSchema = z.object({
  description: z.string().min(1, 'La descripción es requerida'),
  category_id: z.string().uuid().nullable().optional(),
  frequency: z.enum(['once', 'weekly', 'monthly', 'yearly']),
  day_of_week: z.number().int().min(0).max(6).nullable().optional(),
  day_of_month: z.number().int().min(1).max(31).nullable().optional(),
  month_of_year: z.number().int().min(1).max(12).nullable().optional(),
  specific_date: z.string().nullable().optional(),
  is_active: z.boolean().optional().default(true),
})

export type ReminderFormData = z.infer<typeof reminderSchema>
