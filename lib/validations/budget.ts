import * as z from 'zod'

export const createBudgetSchema = z
  .object({
    scope: z.enum(['category', 'group', 'total']).default('category'),
    category_id: z.string().uuid().nullable().optional(),
    group_id: z.string().uuid().nullable().optional(),
    amount_type: z.enum(['fixed', 'percent_income', 'percent_expense']).default('fixed'),
    amount: z.number().positive().nullable().optional(),
    percent: z.number().positive().max(100).nullable().optional(),
    currency: z.enum(['COP', 'USD', 'VES']),
    period: z.enum(['monthly', 'yearly']),
    start_date: z.string(),
  })
  // Mirrors the CHECK constraints on the table, so an invalid combination
  // fails here with a Spanish message instead of as an opaque database error.
  .superRefine((v, ctx) => {
    if (v.scope === 'category' && !v.category_id) {
      ctx.addIssue({ code: 'custom', path: ['category_id'], message: 'Debes seleccionar una categoría' })
    }
    if (v.scope === 'group' && !v.group_id) {
      ctx.addIssue({ code: 'custom', path: ['group_id'], message: 'Debes seleccionar un grupo' })
    }
    if (v.scope !== 'category' && v.category_id) {
      ctx.addIssue({ code: 'custom', path: ['category_id'], message: 'Este ámbito no lleva categoría' })
    }
    if (v.scope !== 'group' && v.group_id) {
      ctx.addIssue({ code: 'custom', path: ['group_id'], message: 'Este ámbito no lleva grupo' })
    }

    if (v.amount_type === 'fixed') {
      if (!v.amount) {
        ctx.addIssue({ code: 'custom', path: ['amount'], message: 'Ingresa el monto del presupuesto' })
      }
      if (v.percent != null) {
        ctx.addIssue({ code: 'custom', path: ['percent'], message: 'Un presupuesto fijo no lleva porcentaje' })
      }
    } else {
      if (!v.percent) {
        ctx.addIssue({ code: 'custom', path: ['percent'], message: 'Ingresa el porcentaje' })
      }
      if (v.amount != null) {
        ctx.addIssue({ code: 'custom', path: ['amount'], message: 'Un presupuesto por porcentaje no lleva monto' })
      }
    }

    // A percentage of total spend, measured against total spend, is always 100%.
    if (v.scope === 'total' && v.amount_type === 'percent_expense') {
      ctx.addIssue({
        code: 'custom',
        path: ['amount_type'],
        message: 'Un presupuesto general no puede medirse como porcentaje del gasto total',
      })
    }
  })

export type CreateBudgetInput = z.infer<typeof createBudgetSchema>
