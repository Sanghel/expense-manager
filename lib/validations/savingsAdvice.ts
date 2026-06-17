import * as z from 'zod'

// Shape the AI must return. Validated before persisting so a malformed model
// response is rejected instead of cached.
export const savingsInsightSchema = z.object({
  title: z.string().min(1),
  detail: z.string().min(1),
  severity: z.enum(['info', 'warning', 'critical']),
  category_id: z.string().nullish(),
})

export const savingsBudgetSuggestionSchema = z.object({
  category_id: z.string().min(1),
  category_name: z.string().min(1),
  suggested_amount: z.number().positive(),
  rationale: z.string().min(1),
  current_budget_amount: z.number().nullish(),
})

export const savingsGoalSuggestionSchema = z.object({
  name: z.string().min(1),
  target_amount: z.number().positive(),
  monthly_contribution: z.number().positive().nullish(),
  deadline: z.string().nullish(),
  rationale: z.string().min(1),
})

export const savingsAdvicePayloadSchema = z.object({
  insights: z.array(savingsInsightSchema),
  budget_suggestions: z.array(savingsBudgetSuggestionSchema),
  goal_suggestions: z.array(savingsGoalSuggestionSchema).default([]),
})

export type SavingsAdvicePayload = z.infer<typeof savingsAdvicePayloadSchema>
