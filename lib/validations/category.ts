import * as z from 'zod'

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['income', 'expense']),
  icon: z.string().optional(),
  color: z.string().optional(),
})

export const updateCategorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  icon: z.string().optional(),
  color: z.string().optional(),
})

export type CreateCategoryInput = z.infer<typeof createCategorySchema>
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>
