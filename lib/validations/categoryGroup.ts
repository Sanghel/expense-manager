import * as z from 'zod'

export const createCategoryGroupSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio').max(60),
  icon: z.string().max(8).nullable().optional(),
  color: z.string().max(20).nullable().optional(),
})

export const updateCategoryGroupSchema = createCategoryGroupSchema.partial()

export const setGroupMembersSchema = z.object({
  category_ids: z.array(z.string().uuid()),
})

export type CreateCategoryGroupInput = z.infer<typeof createCategoryGroupSchema>
export type UpdateCategoryGroupInput = z.infer<typeof updateCategoryGroupSchema>
