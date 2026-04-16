import * as z from 'zod'

export const createTagSchema = z.object({
  name: z.string().min(1, 'Tag name required'),
  color: z.string().default('#3182CE'),
})

export const addTagToTransactionSchema = z.object({
  tag_id: z.string().uuid(),
})

export type CreateTagInput = z.infer<typeof createTagSchema>
export type AddTagToTransactionInput = z.infer<typeof addTagToTransactionSchema>
