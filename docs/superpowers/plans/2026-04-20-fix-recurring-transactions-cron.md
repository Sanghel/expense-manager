# Fix Recurring Transactions Cron Job

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hacer que el cron job `generate-recurring` registre correctamente los pagos/ingresos recurrentes al día correcto, con idempotencia para evitar duplicados si el cron corre más de una vez por día.

**Architecture:** Extraemos la lógica de generación a un archivo utilitario puro (`lib/utils/recurring-generator.ts`) sin `'use server'` ni `revalidatePath`, lo que elimina el bug principal. Añadimos filtro `start_date <= today` en la query, comprobación de idempotencia antes de insertar (via `last_generated`), y logging detallado en cada paso del cron route.

**Tech Stack:** Next.js App Router (Route Handler), Supabase (insforgeAdmin), TypeScript

---

## Bugs identificados

### Bug 1 (crítico): `revalidatePath` falla en contexto de GET Route Handler

`generateRecurringTransactions` vive en `lib/actions/recurring.actions.ts` que tiene `'use server'` a nivel de archivo. Dentro llama a `revalidatePath('/recurring-transactions')`. En Next.js 15+, `revalidatePath` en el contexto de un GET Route Handler lanza un error de invariant interno (necesita el contexto de una Server Action o POST route). Ese error es capturado por el `try/catch` de la función, que retorna `{ success: false }` silenciosamente. El cron log muestra `failures=1` pero el response final es `ok: true, transactionsGenerated: 0`.

### Bug 2: No hay idempotencia en primera ejecución

Cuando `last_generated` es `null`, si el cron corre dos veces en el mismo día (por reintento de Vercel o ejecución manual), inserta el transaction dos veces. `last_generated` solo se actualiza DESPUÉS del insert, así que una segunda carrera concurrente también ve `null` y vuelve a insertar.

### Bug 3: No hay filtro `start_date <= today` en la query

La query trae todos los recurring activos sin importar si su `start_date` ya llegó. Pasa el filtro de `nextDate <= today` más adelante, pero es ineficiente y propenso a errores si se cambia la lógica.

---

## File Structure

| Acción | Archivo | Responsabilidad |
|--------|---------|-----------------|
| **Crear** | `lib/utils/recurring-generator.ts` | Lógica pura de generación: query, comprobación de fechas, insert, update `last_generated`. Sin `'use server'`, sin `revalidatePath`. |
| **Modificar** | `app/api/cron/generate-recurring/route.ts` | Importar desde el nuevo utilitario; logging detallado por usuario/error. |
| **Modificar** | `lib/actions/recurring.actions.ts` | Eliminar la función `generateRecurringTransactions` exportada (o dejarla como wrapper que llama al utilitario si UI la necesita). |

---

## Task 1: Crear `lib/utils/recurring-generator.ts`

**Files:**
- Create: `lib/utils/recurring-generator.ts`

Este archivo contiene la lógica pura sin `'use server'` ni `revalidatePath`.

- [ ] **Step 1: Crear el archivo**

```typescript
// lib/utils/recurring-generator.ts
import { insforgeAdmin } from '@/lib/insforge-admin'

function getNextDate(lastDate: Date, frequency: string): Date {
  const date = new Date(lastDate)
  switch (frequency) {
    case 'daily':  date.setDate(date.getDate() + 1); break
    case 'weekly': date.setDate(date.getDate() + 7); break
    case 'monthly': date.setMonth(date.getMonth() + 1); break
    case 'yearly': date.setFullYear(date.getFullYear() + 1); break
  }
  return date
}

export async function generateRecurringForUser(userId: string): Promise<{
  generated: number
  skipped: number
  errors: string[]
}> {
  const today = new Date().toISOString().split('T')[0]
  const errors: string[] = []
  let generated = 0
  let skipped = 0

  // Fetch: active, no end_date, start_date <= today
  const { data: noEndDate, error: err1 } = await insforgeAdmin.database
    .from('recurring_transactions')
    .select()
    .eq('user_id', userId)
    .eq('is_active', true)
    .is('end_date', null)
    .lte('start_date', today)

  // Fetch: active, end_date >= today, start_date <= today
  const { data: withEndDate, error: err2 } = await insforgeAdmin.database
    .from('recurring_transactions')
    .select()
    .eq('user_id', userId)
    .eq('is_active', true)
    .gte('end_date', today)
    .lte('start_date', today)

  if (err1) { errors.push(`fetch-no-end-date: ${JSON.stringify(err1)}`); return { generated, skipped, errors } }
  if (err2) { errors.push(`fetch-with-end-date: ${JSON.stringify(err2)}`); return { generated, skipped, errors } }

  const recurringList = [...(noEndDate ?? []), ...(withEndDate ?? [])]

  for (const recurring of recurringList) {
    // Idempotency: if already generated today, skip
    if (recurring.last_generated === today) {
      skipped++
      console.log(`[recurring-gen] skip id=${recurring.id} already generated today`)
      continue
    }

    const nextDate = recurring.last_generated
      ? getNextDate(new Date(recurring.last_generated), recurring.frequency)
      : new Date(recurring.start_date)

    const nextDateStr = nextDate.toISOString().split('T')[0]

    if (nextDateStr > today) {
      skipped++
      console.log(`[recurring-gen] skip id=${recurring.id} nextDate=${nextDateStr} is in the future`)
      continue
    }

    console.log(`[recurring-gen] inserting id=${recurring.id} date=${nextDateStr}`)

    const { error: insertError } = await insforgeAdmin.database
      .from('transactions')
      .insert([{
        user_id: userId,
        amount: recurring.amount,
        currency: recurring.currency,
        type: recurring.type,
        category_id: recurring.category_id,
        account_id: recurring.account_id ?? null,
        description: recurring.description,
        date: nextDateStr,
        source: 'manual',
      }])

    if (insertError) {
      const msg = `insert-error id=${recurring.id}: ${JSON.stringify(insertError)}`
      console.error(`[recurring-gen] ${msg}`)
      errors.push(msg)
      continue
    }

    const { error: updateError } = await insforgeAdmin.database
      .from('recurring_transactions')
      .update({ last_generated: today })
      .eq('id', recurring.id)

    if (updateError) {
      const msg = `update-last-generated id=${recurring.id}: ${JSON.stringify(updateError)}`
      console.error(`[recurring-gen] ${msg}`)
      errors.push(msg)
    }

    generated++
  }

  return { generated, skipped, errors }
}
```

- [ ] **Step 2: Verificar que TypeScript no arroje errores**

```bash
cd /Users/sanghelgonzalez/Documents/projects/expense-manager
npx tsc --noEmit 2>&1 | head -40
```

Esperado: sin errores relacionados a `lib/utils/recurring-generator.ts`.

- [ ] **Step 3: Commit**

```bash
git add lib/utils/recurring-generator.ts
git commit -m "feat: add pure recurring-generator utility without 'use server' or revalidatePath"
```

---

## Task 2: Actualizar el cron route para usar el nuevo utilitario

**Files:**
- Modify: `app/api/cron/generate-recurring/route.ts`

- [ ] **Step 1: Reemplazar el contenido del route**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { insforgeAdmin } from '@/lib/insforge-admin'
import { generateRecurringForUser } from '@/lib/utils/recurring-generator'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const start = new Date().toISOString()
  console.log(`[cron:generate-recurring] start=${start}`)

  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    console.error('[cron:generate-recurring] Unauthorized — invalid or missing CRON_SECRET')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const today = new Date().toISOString().split('T')[0]
    console.log(`[cron:generate-recurring] today=${today}`)

    const { data: users, error } = await insforgeAdmin.database
      .from('recurring_transactions')
      .select('user_id')
      .eq('is_active', true)
      .lte('start_date', today)

    if (error) {
      console.error('[cron:generate-recurring] DB fetch users error:', JSON.stringify(error))
      throw error
    }

    const uniqueUserIds = [...new Set((users ?? []).map((r: { user_id: string }) => r.user_id))]
    console.log(`[cron:generate-recurring] activeUsers=${uniqueUserIds.length} userIds=${JSON.stringify(uniqueUserIds)}`)

    let totalGenerated = 0
    let totalSkipped = 0
    const allErrors: string[] = []

    for (const userId of uniqueUserIds) {
      console.log(`[cron:generate-recurring] processing userId=${userId}`)
      const result = await generateRecurringForUser(userId as string)
      totalGenerated += result.generated
      totalSkipped += result.skipped
      if (result.errors.length > 0) {
        console.error(`[cron:generate-recurring] userId=${userId} errors=`, result.errors)
        allErrors.push(...result.errors.map(e => `${userId}: ${e}`))
      }
      console.log(`[cron:generate-recurring] userId=${userId} generated=${result.generated} skipped=${result.skipped}`)
    }

    console.log(`[cron:generate-recurring] done usersProcessed=${uniqueUserIds.length} totalGenerated=${totalGenerated} totalSkipped=${totalSkipped} errors=${allErrors.length}`)

    return NextResponse.json({
      ok: true,
      usersProcessed: uniqueUserIds.length,
      transactionsGenerated: totalGenerated,
      transactionsSkipped: totalSkipped,
      errors: allErrors.length > 0 ? allErrors : undefined,
    })
  } catch (error) {
    console.error(`[cron:generate-recurring] unhandled error=`, error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Verificar TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -40
```

Esperado: sin errores.

- [ ] **Step 3: Commit**

```bash
git add app/api/cron/generate-recurring/route.ts
git commit -m "fix: update cron route to use pure recurring-generator, add detailed logging"
```

---

## Task 3: Limpiar la función antigua en `recurring.actions.ts`

**Files:**
- Modify: `lib/actions/recurring.actions.ts`

Eliminar `generateRecurringTransactions` y `getNextDate` del archivo de server actions. Si en algún componente de UI se llama a esta función, reemplazar por la nueva.

- [ ] **Step 1: Verificar si algún componente UI importa `generateRecurringTransactions`**

```bash
grep -r "generateRecurringTransactions" /Users/sanghelgonzalez/Documents/projects/expense-manager --include="*.ts" --include="*.tsx" -l
```

Resultado esperado:
```
lib/actions/recurring.actions.ts
app/api/cron/generate-recurring/route.ts   ← ya no lo usa tras Task 2
```

Si aparece algún componente UI que lo importa, **no** borrar todavía — primero actualizar ese componente para que ya no lo llame (esta función nunca debió ser llamada desde UI directamente, el cron es quien la ejecuta).

- [ ] **Step 2: Eliminar `generateRecurringTransactions` y `getNextDate` de `recurring.actions.ts`**

Borrar desde la línea `export async function generateRecurringTransactions` hasta el final del archivo (incluyendo `getNextDate`). El archivo debe terminar en `deleteRecurringTransaction` y `toggleRecurringTransaction`.

El archivo resultante debe terminar así:

```typescript
export async function toggleRecurringTransaction(id: string, userId: string, isActive: boolean) {
  try {
    const { data, error } = await insforgeAdmin.database
      .from('recurring_transactions')
      .update({ is_active: isActive })
      .eq('id', id)
      .eq('user_id', userId)
      .select('*, category:categories(*)')
      .single()

    if (error) throw error

    revalidatePath('/recurring-transactions')
    return { success: true, data: data as RecurringTransactionWithCategory }
  } catch (error) {
    console.error('Toggle recurring transaction error:', error)
    return { success: false, error: 'Failed to toggle recurring transaction' }
  }
}
```

- [ ] **Step 3: Verificar TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -40
```

Esperado: sin errores.

- [ ] **Step 4: Commit**

```bash
git add lib/actions/recurring.actions.ts
git commit -m "refactor: remove generateRecurringTransactions from server actions (moved to utils)"
```

---

## Task 4: Test manual del cron

- [ ] **Step 1: Arrancar el servidor de desarrollo**

```bash
npm run dev
```

Dejar corriendo en terminal separada.

- [ ] **Step 2: Ejecutar el cron manualmente (sin CRON_SECRET en dev)**

```bash
curl -s http://localhost:3000/api/cron/generate-recurring | jq .
```

Si `CRON_SECRET` está en `.env.local`, pasar el header:

```bash
curl -s -H "Authorization: Bearer $(grep CRON_SECRET .env.local | cut -d= -f2)" \
  http://localhost:3000/api/cron/generate-recurring | jq .
```

Respuesta esperada (con el recurring del usuario de fecha 2026-04-20):
```json
{
  "ok": true,
  "usersProcessed": 1,
  "transactionsGenerated": 1,
  "transactionsSkipped": 0
}
```

- [ ] **Step 3: Verificar en la base de datos**

Ir a Supabase → Table Editor → `transactions` y confirmar que la nueva fila aparece con:
- `date = '2026-04-20'`
- `source = 'manual'`
- `description` y `amount` del recurring correcto

- [ ] **Step 4: Ejecutar el cron una segunda vez (probar idempotencia)**

```bash
curl -s http://localhost:3000/api/cron/generate-recurring | jq .
```

Respuesta esperada:
```json
{
  "ok": true,
  "usersProcessed": 1,
  "transactionsGenerated": 0,
  "transactionsSkipped": 1
}
```

Confirmar que en la tabla `transactions` **no** aparece una segunda fila duplicada.

- [ ] **Step 5: Verificar en los logs del servidor**

En los logs de `npm run dev` deben aparecer líneas como:
```
[cron:generate-recurring] today=2026-04-20
[cron:generate-recurring] activeUsers=1
[recurring-gen] inserting id=<uuid> date=2026-04-20
[cron:generate-recurring] userId=<uuid> generated=1 skipped=0
[cron:generate-recurring] done usersProcessed=1 totalGenerated=1 totalSkipped=0 errors=0
```

Y en la segunda ejecución:
```
[recurring-gen] skip id=<uuid> already generated today
```

---

## Self-Review

**Spec coverage:**
- ✅ Recorrer todos los usuarios con recurring activos → `uniqueUserIds` loop
- ✅ Por cada usuario ver qué pagos recurrentes hay → `generateRecurringForUser` query
- ✅ Si el pago es mensual y hoy es el día correcto, registrar → `nextDateStr <= today` check
- ✅ No registrar dos veces en el mismo día → `last_generated === today` check (Task 1, Step 1)
- ✅ No registraba nada la primera vez → Bug 1 resuelto al eliminar `revalidatePath` del contexto de cron
- ✅ Filtrar por `start_date <= today` → `.lte('start_date', today)` en ambos queries

**Placeholder scan:** Ninguno encontrado.

**Type consistency:** `generateRecurringForUser` retorna `{ generated, skipped, errors }` y el cron route usa exactamente esos campos.

**Edge cases cubiertos:**
- Recurring con `end_date` ya pasado: excluido por `.gte('end_date', today)`
- Recurring con `start_date` en el futuro: excluido por `.lte('start_date', today)`
- Recurring inactivo: excluido por `.eq('is_active', true)`
- Insert DB falla: se loggea el error, se continúa con el siguiente, no se actualiza `last_generated`
- Cron corre dos veces el mismo día: segundo run ve `last_generated === today`, hace skip
