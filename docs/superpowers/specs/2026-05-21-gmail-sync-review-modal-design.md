# Gmail Sync Review Modal — Design

**Date:** 2026-05-21
**Status:** Approved (pending spec review)

## Goal

Reemplazar el flujo actual de Gmail sync (drafts persistentes + página `/pendientes`) con un flujo dual:
1. **Cron diario** que auto-registra todas las transacciones detectadas (con `category_id=null` cuando el parser no lo provee).
2. **Sync manual** desde `/movimientos` que abre un modal de revisión, permite editar en memoria y solo persiste al confirmar.

Adicionalmente: agregar soporte para nuevos remitentes (Bancolombia compra con tarjeta, Binance, Banco Mercantil).

## Non-goals

- Sugerencia automática de categoría basada en merchant (futuro).
- Soporte para correos de depósito de Binance (solo pagos por ahora).
- Conversión USDT → USD vía tasa real (mapeo 1:1 fijo).
- Manejo de Daylight Saving (Colombia no aplica DST hoy).

## Architecture

```
Correo Gmail
     │
     ▼
[Dispatcher por sender] ── elige parser según el header `from`
     │
     ▼
ParsedTransaction[]   ← núcleo puro, sin side effects, respeta alreadyProcessed
     │
     ├──► [CRON 00:00 Colombia]  → auto-registra en `transactions`
     │                            → marca `processed_emails`
     │
     └──► [SYNC MANUAL]          → devuelve la lista al cliente sin tocar DB
                                  → modal con tabla/cards editables en memoria
                                  → al confirmar: crea `transactions` + marca processed
                                  → si cierra sin confirmar: nada se persiste
                                    (correos quedan disponibles para el siguiente cron)
```

## Parsers

### Estructura de archivos

```
lib/gmail/parsers/
  ├── types.ts        (nuevo: ParsedTransaction unificado)
  ├── index.ts        (nuevo: dispatcher por sender)
  ├── bancolombia.ts  (existente, agregar regla compra_tarjeta_v2 + retornar array)
  ├── binance.ts      (nuevo)
  └── mercantil.ts    (nuevo)
```

### Contrato unificado (`types.ts`)

```ts
export interface ParsedTransaction {
  type: TransactionType
  amount: number
  currency: Currency
  lastFour: string | null
  merchant: string | null
  date: string                // ISO YYYY-MM-DD
  description: string
  confidence: number          // 0..0.95
  matchedRule: string         // p.ej. 'bancolombia:compra_tarjeta_v2'
  source: 'bancolombia' | 'binance' | 'mercantil'
}

export type Parser = (input: ParseInput) => ParsedTransaction[]
```

Todos los parsers devuelven `ParsedTransaction[]` (vacío si no matchea). Mercantil aprovecha el array para multi-operación; los demás devuelven 0 o 1 ítem.

### Bancolombia — nueva regla `compra_tarjeta_v2`

Formato observado:
> `Compraste $39.380,00 en TEMEX LP con tu T.Deb *2499, el 20/05/2026 a las 13:38`

```ts
{
  name: 'compra_tarjeta_v2',
  pattern: /compraste\s+\$?\s*([\d.,]+)\s+en\s+([A-Z0-9 .,&'\-/]+?)\s+con\s+tu\s+t\.?\s*(?:deb|cred)\s*\*?(\d{4})/i,
  build: (m) => ({
    type: 'expense',
    amountRaw: m[1],
    merchant: m[2].trim(),
    lastFour: m[3],
    description: `Compra en ${m[2].trim()}`,
    matchedRule: 'compra_tarjeta_v2',
  }),
}
```

Confianza: 0.95 (monto + merchant + last_four). También intenta parsear fecha del texto `el DD/MM/YYYY` con fallback a `receivedAt`.

### Binance — `binance.ts`

Sender: `do-not-reply@ses.binance.com` (match relajado: cualquier `binance.com`).

Formato:
> `Time: 2026-05-17 16:36:40(UTC)` … `Amount: 26 USDT`

Reglas (solo una por ahora):
- `payment`: `/Amount:\s*([\d.,]+)\s*(USDT|BTC|ETH|BUSD|USDC)/i` + `/Time:\s*(\d{4}-\d{2}-\d{2})/`
- `type: 'expense'`, `lastFour: null`, `merchant: null`
- Currency mapping: `USDT|BUSD|USDC → USD` (1:1). `BTC|ETH` → no se crea item (parser devuelve array vacío para esos casos — se agregan más adelante si surgen).
- Confianza: 0.7

### Mercantil — `mercantil.ts`

Sender: `notificaciones@bancomercantil.com`.

Formato multi-operación con bloques separados por `OPERACION NN`. Parser:
1. Split por regex `/OPERACION\s+\d+/i` (descarta el primer split, que es preámbulo).
2. Cada bloque parseado independientemente:
   - `MONTO:\s*BS\.\s*([\d.,]+)` → amount, `currency='VES'`
   - `CUENTA DEBITO:[^\d]*\*+\s*(\d{4})` (preferir cuenta) o `NUMERO DE TARJETA DE DEBITO:[^\d]*\*+(\d{4})` (fallback) → `lastFour`
   - `NOMBRE DEL COMERCIO:\s*(.+)` (hasta fin de línea) → `merchant`
   - `FECHA DE LA OPERACION:\s*(\d{2})\/(\d{2})\/(\d{4})` → `date` ISO
   - `OPERACION:\s*(\w+)` → mapear `CONSUMO|COMPRA` → `expense`, `ABONO|DEPOSITO` → `income`, default expense
3. Devuelve `ParsedTransaction[]` con N items.

Confianza por item: 0.95 (siempre tiene monto + comercio + last_four).

### Dispatcher (`index.ts`)

```ts
function getParser(from: string): Parser | null {
  if (isBancolombiaSender(from)) return parseBancolombia
  if (isBinanceSender(from))     return parseBinance
  if (isMercantilSender(from))   return parseMercantil
  return null
}
```

## process.ts refactor

Divide la función monolítica actual:

```ts
// Solo parsea. Idempotente. Respeta alreadyProcessed.
async function parseGmailForUser(userId: string): Promise<{
  items: Array<ParsedTransaction & { gmailMessageId: string; rawFrom: string; rawSubject: string; rawSnippet: string }>
  scanned: number
  skipped: number
}>

// Auto-registra todos los items en una sola pasada (para cron).
async function commitParsedTransactions(
  userId: string,
  items: Array<ParsedTransaction & { gmailMessageId: string }>
): Promise<{ created: number; errors: string[] }>
```

El cron llama ambas; el sync manual solo la primera y delega el commit al modal.

## Server actions (`lib/actions/gmail.actions.ts`)

**Nuevos:**
```ts
syncGmail(): Promise<{ success: true; items: ParsedItem[] } | { success: false; error: string }>
commitGmailTransactions(items: ParsedItemWithEdits[]):
  Promise<{ success: true; created: number } | { success: false; error: string }>
```

**Eliminados:** `confirmDraft`, `rejectDraft`, `listPendingDrafts`.

`commitGmailTransactions` recibe items con `edited` ya aplicado (el modal envía el merge `{ ...parsed, ...edited }` filtrando `excluded`). Es best-effort por item: si uno falla, continúa con los demás y reporta el conteo parcial. Cada item exitoso:
1. INSERT en `transactions`
2. `applyBalanceDelta` si `account_id` no es null
3. INSERT en `processed_emails` con `outcome='auto_registered'`

## UI

### `GmailSyncButton` (modificado)

Al recibir respuesta del sync:
- `items.length === 0` → toast "Sin correos nuevos".
- `items.length > 0` → abre `<GmailSyncReviewModal items={items} />`.

### `GmailSyncReviewModal` (nuevo)

**State interno:**
```ts
type ReviewItem = ParsedItem & {
  edited: Partial<ParsedTransaction>  // overrides editados por usuario
  excluded: boolean                    // marca para no persistir
}
```

**Layout:**
- *Desktop (md+):* tabla con columnas `Fecha | Origen | Descripción | Monto | Categoría (dropdown) | Cuenta (dropdown) | [Excluir] [Editar]`. Edición inline para categoría y cuenta. "Editar" abre form modal completo.
- *Mobile:* lista de cards verticales con los mismos campos y acciones.

**Edición vía `TransactionEditForm` existente:**
- Agregar prop opcional `onSubmitOverride?: (values: TransactionFormValues) => void`.
- Si está presente, el form invoca el override en vez de llamar al server action de update. El modal padre actualiza la fila correspondiente en memoria.
- Si está ausente, comportamiento actual del form intacto (backwards-compatible).

**Footer:**
- `[Descartar]` → cierra sin persistir. Toast: "No se registró ninguna transacción".
- `[Guardar todas]` → llama `commitGmailTransactions(items.filter(i => !i.excluded))`. Loading state. Al terminar: toast "N transacciones registradas", cierra modal, `router.refresh()`.

**Validación al confirmar:**
- Cada fila no-excluida debe tener `category_id` no-null.
- Si falta categoría en alguna: bloquear "Guardar todas", resaltar filas inválidas en rojo, toast "Asigna categoría a todas las transacciones".

**Lo que NO incluye:**
- Preview del email crudo (subject/from/snippet) — ruido innecesario.
- Persistencia parcial automática — todo o nada (excepto exclusión explícita por fila).

## Cron

Actualizar el cron de `sync-gmail` a:

```
schedule: "0 5 * * *"   # 00:00 Colombia (UTC-5)
```

El handler en `app/api/cron/sync-gmail/route.ts` cambia a llamar `parseGmailForUser` + `commitParsedTransactions` para cada usuario conectado. Comportamiento equivalente al actual pero ahora siempre crea transacciones (con `category_id=null`), nunca drafts.

## Schema changes

```sql
DROP TABLE transaction_drafts;
```

Decisión: drafts existentes con `status='pending'` se **pierden**. Justificación: son pocos, mejor empezar limpio. Si en el futuro hay muchos, se puede hacer una migración previa que los convierta a `transactions` con `category_id=null` antes del DROP.

Tablas que se mantienen:
- `processed_emails` (fuente de verdad de qué correos se procesaron — sigue siendo crítica para idempotencia).
- `transactions`, `accounts`, `categories`, `users` (sin cambios).

Tipo TypeScript `TransactionDraft` en `types/database.types.ts` se elimina junto con todas sus referencias.

## Files

**Nuevos:**
- `lib/gmail/parsers/types.ts`
- `lib/gmail/parsers/index.ts`
- `lib/gmail/parsers/binance.ts`
- `lib/gmail/parsers/mercantil.ts`
- `components/transactions/GmailSyncReviewModal.tsx`

**Modificados:**
- `lib/gmail/parsers/bancolombia.ts` (nueva regla + retornar array)
- `lib/gmail/process.ts` (split en parse + commit)
- `lib/actions/gmail.actions.ts` (nuevos server actions, eliminar los de drafts)
- `app/api/cron/sync-gmail/route.ts` (usar autoCommit + nuevo schedule)
- `components/transactions/GmailSyncButton.tsx` (abrir modal)
- `components/transactions/TransactionEditForm.tsx` (prop `onSubmitOverride` opcional)
- `components/settings/GmailConnectionPanel.tsx` (quitar botón sync si existe)
- `vercel.json` o `vercel.ts` (cron schedule a `0 5 * * *`)
- `types/database.types.ts` (eliminar `TransactionDraft`)

**Eliminados:**
- `app/(dashboard)/pendientes/page.tsx`
- `app/(dashboard)/pendientes/PendientesPageClient.tsx`
- Link a `/pendientes` en el menú/navegación (si existe)

## Risks

1. **Drafts existentes pendientes se pierden** al hacer DROP. Aceptado.
2. **Contrato del parser de Bancolombia cambia** de `ParsedBancolombiaTx | null` a `ParsedTransaction[]`. Cualquier test existente requiere actualización (`scripts/test-bancolombia-parser.ts`).
3. **Estado del modal se pierde** si el usuario navega — diseño consciente, no se requiere persistencia.
4. **Sync manual + cron pueden competir**: si el usuario abre el modal y antes de confirmar corre el cron, el cron auto-registra los mismos correos. Mitigación: poco probable porque cron corre solo a las 00:00 Colombia; aún si pasa, `alreadyProcessed` en el commit del modal evita duplicados (el commit fallaría al insertar processed_emails por unique constraint; cada item es best-effort).
5. **USDT mapeado a USD 1:1** — divergencia de valor real es marginal hoy pero podría crecer. Decisión consciente, fácil de revisar.
