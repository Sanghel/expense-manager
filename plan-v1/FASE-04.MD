# FASE 04: Backend API (Server Actions)

## 🎯 Objetivo

Implementar Server Actions de Next.js para todas las operaciones CRUD: transacciones, categorías, presupuestos, y tasas de cambio.

**Resultado:** API completa funcionando con validación Zod y manejo de errores.

---

## ⚠️ Pre-requisitos

- ✅ FASE 03 completada
- ✅ Schema de BD funcional

---

## 📋 Inicio

```bash
git checkout develop && git pull
gh issue create --title "FASE 04: Backend API (Server Actions)"
```

📝 Issue #27

---

## 📝 Tareas

### Tarea 4.1: Crear esquemas de validación

**Issue:** "Crear esquemas Zod para validación"

```bash
git checkout -b feature/28-zod-schemas
```

Crear `lib/validations/transaction.ts`:

```typescript
import { z } from 'zod'

export const createTransactionSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  currency: z.enum(['COP', 'USD', 'BOB']),
  type: z.enum(['income', 'expense']),
  category_id: z.string().uuid(),
  description: z.string().min(1, 'Description is required'),
  date: z.string(), // ISO date
  notes: z.string().optional(),
})

export const updateTransactionSchema = createTransactionSchema.partial()

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>
```

Crear `lib/validations/category.ts`:

```typescript
import { z } from 'zod'

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['income', 'expense']),
  icon: z.string().optional(),
  color: z.string().optional(),
})

export type CreateCategoryInput = z.infer<typeof createCategorySchema>
```

Crear `lib/validations/budget.ts`:

```typescript
import { z } from 'zod'

export const createBudgetSchema = z.object({
  category_id: z.string().uuid(),
  amount: z.number().positive(),
  currency: z.enum(['COP', 'USD', 'BOB']),
  period: z.enum(['monthly', 'yearly']),
  start_date: z.string(),
})

export type CreateBudgetInput = z.infer<typeof createBudgetSchema>
```

```bash
git add . && git commit -m "feat: create Zod validation schemas"
git push -u origin feature/28-zod-schemas
gh pr create --base develop --title "Create Zod validation schemas" --body "Closes #28"
gh pr merge --squash && git checkout develop && git pull && git branch -d feature/28-zod-schemas
```

---

### Tarea 4.2: Server Actions de Transacciones

**Issue:** "Implementar CRUD de transacciones con Server Actions"

```bash
git checkout -b feature/29-transaction-actions
```

Crear `lib/actions/transactions.actions.ts`:

```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { insforge } from '@/lib/insforge'
import {
  createTransactionSchema,
  type CreateTransactionInput,
} from '@/lib/validations/transaction'

export async function createTransaction(
  userId: string,
  data: CreateTransactionInput
) {
  try {
    const validated = createTransactionSchema.parse(data)

    const { data: transaction, error } = await insforge
      .from('transactions')
      .insert({
        ...validated,
        user_id: userId,
        source: 'manual',
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath('/dashboard')
    return { success: true, data: transaction }
  } catch (error) {
    console.error('Create transaction error:', error)
    return { success: false, error: 'Failed to create transaction' }
  }
}

export async function getTransactions(userId: string, limit = 50) {
  try {
    const { data, error } = await insforge
      .from('transactions')
      .select('*, category:categories(*)')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(limit)

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    return { success: false, error: 'Failed to fetch transactions' }
  }
}

export async function deleteTransaction(id: string, userId: string) {
  try {
    const { error } = await insforge
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw error

    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    return { success: false, error: 'Failed to delete transaction' }
  }
}

// ... agregar updateTransaction similar
```

```bash
git add . && git commit -m "feat: implement transaction server actions"
git push -u origin feature/29-transaction-actions
gh pr create --base develop --title "Implement transaction server actions" --body "Closes #29"
gh pr merge --squash && git checkout develop && git pull && git branch -d feature/29-transaction-actions
```

---

### Tarea 4.3: Server Actions de Categorías

**Issue:** "Implementar CRUD de categorías"

```bash
git checkout -b feature/30-category-actions
```

Crear `lib/actions/categories.actions.ts`:

```typescript
'use server'

import { insforge } from '@/lib/insforge'
import {
  createCategorySchema,
  type CreateCategoryInput,
} from '@/lib/validations/category'

export async function getCategories(userId: string) {
  try {
    // Obtener predefinidas + del usuario
    const { data, error } = await insforge
      .from('categories')
      .select('*')
      .or(`user_id.is.null,user_id.eq.${userId}`)
      .order('name')

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    return { success: false, error: 'Failed to fetch categories' }
  }
}

export async function createCategory(
  userId: string,
  data: CreateCategoryInput
) {
  try {
    const validated = createCategorySchema.parse(data)

    const { data: category, error } = await insforge
      .from('categories')
      .insert({
        ...validated,
        user_id: userId,
      })
      .select()
      .single()

    if (error) throw error
    return { success: true, data: category }
  } catch (error) {
    return { success: false, error: 'Failed to create category' }
  }
}
```

```bash
git add . && git commit -m "feat: implement category server actions"
git push -u origin feature/30-category-actions
gh pr create --base develop --title "Implement category server actions" --body "Closes #30"
gh pr merge --squash && git checkout develop && git pull && git branch -d feature/30-category-actions
```

---

### Tarea 4.4: Server Actions de Presupuestos

**Issue:** "Implementar CRUD de presupuestos"

Similar a las anteriores, crear `lib/actions/budgets.actions.ts` con:

- `getBudgets(userId)`
- `createBudget(userId, data)`
- `updateBudget(id, userId, data)`
- `deleteBudget(id, userId)`

```bash
git checkout -b feature/31-budget-actions
# ... implementar ...
git add . && git commit -m "feat: implement budget server actions"
git push -u origin feature/31-budget-actions
gh pr create --base develop --title "Implement budget server actions" --body "Closes #31"
gh pr merge --squash && git checkout develop && git pull && git branch -d feature/31-budget-actions
```

---

### Tarea 4.5: Server Actions de Tasas de Cambio

**Issue:** "Implementar gestión de tasas de cambio"

```bash
git checkout -b feature/32-exchange-rate-actions
```

Crear `lib/actions/exchangeRates.actions.ts`:

```typescript
'use server'

import { insforge } from '@/lib/insforge'

export async function getLatestRates() {
  try {
    const { data, error } = await insforge
      .from('exchange_rates')
      .select('*')
      .order('date', { ascending: false })
      .limit(10)

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    return { success: false, error: 'Failed to fetch rates' }
  }
}

export async function convertCurrency(
  amount: number,
  from: string,
  to: string
) {
  if (from === to) return amount

  try {
    const { data, error } = await insforge
      .from('exchange_rates')
      .select('rate')
      .eq('from_currency', from)
      .eq('to_currency', to)
      .order('date', { ascending: false })
      .limit(1)
      .single()

    if (error || !data) return amount // Fallback

    return amount * data.rate
  } catch (error) {
    return amount
  }
}
```

```bash
git add . && git commit -m "feat: implement exchange rate server actions"
git push -u origin feature/32-exchange-rate-actions
gh pr create --base develop --title "Implement exchange rate actions" --body "Closes #32"
gh pr merge --squash && git checkout develop && git pull && git branch -d feature/32-exchange-rate-actions
```

---

### Tarea 4.6: Utilidad para obtener user ID

**Issue:** "Crear helper para obtener user ID de sesión"

```bash
git checkout -b feature/33-auth-helpers
```

Crear `lib/utils/auth.ts`:

```typescript
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  return session?.user
}

export async function getCurrentUserId() {
  const user = await getCurrentUser()
  if (!user?.email) return null

  // Obtener ID del user desde BD
  const { data } = await insforge
    .from('users')
    .select('id')
    .eq('email', user.email)
    .single()

  return data?.id || null
}
```

```bash
git add . && git commit -m "feat: add auth helper utilities"
git push -u origin feature/33-auth-helpers
gh pr create --base develop --title "Add auth helper utilities" --body "Closes #33"
gh pr merge --squash && git checkout develop && git pull && git branch -d feature/33-auth-helpers
```

---

### Tarea 4.7: Testing de Server Actions

**Issue:** "Crear tests para Server Actions"

Crear `scripts/test-actions.ts`:

```typescript
import { getCategories } from '@/lib/actions/categories.actions'

async function testActions() {
  console.log('Testing Server Actions...\n')

  // Test categories
  const categoriesResult = await getCategories('test-user-id')
  console.log('Categories:', categoriesResult.success ? '✅' : '❌')
  console.log('Count:', categoriesResult.data?.length || 0)

  console.log('\n✅ Actions test complete')
}

testActions()
```

```bash
git checkout -b feature/34-test-actions
git add . && git commit -m "test: add server actions testing script"
git push -u origin feature/34-test-actions
gh pr create --base develop --title "Add server actions testing" --body "Closes #34"
gh pr merge --squash && git checkout develop && git pull && git branch -d feature/34-test-actions
```

---

## 🎯 Fin de Fase 4

### Verificación

```bash
pnpm build
pnpm type-check
```

**Checklist:**

- [ ] ✅ Esquemas Zod creados
- [ ] ✅ Server Actions de transacciones
- [ ] ✅ Server Actions de categorías
- [ ] ✅ Server Actions de presupuestos
- [ ] ✅ Server Actions de tasas de cambio
- [ ] ✅ Helper de autenticación
- [ ] ✅ Build exitoso

---

### PR Final

```bash
gh pr create \
  --base main \
  --head develop \
  --title "FASE 04: Backend API (Server Actions)" \
  --body "Server Actions completas con validación Zod

Closes #27"
```

**🛑 DETENER - 📢 NOTIFICAR - ⏸️ ESPERAR**

---

**¡FASE 04 COMPLETADA! 🎉**

Continuar con: **FASE-05.md**
