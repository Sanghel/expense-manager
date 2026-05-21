# Gmail Sync Review Modal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar el sistema actual de drafts persistentes y página `/pendientes` con (a) cron que auto-registra transacciones de Gmail con `category_id=null`, (b) sync manual que abre un modal de revisión editable en memoria, y (c) parsers nuevos para Bancolombia (compra tarjeta), Binance y Banco Mercantil.

**Architecture:** Núcleo puro de parseo (`ParsedTransaction[]`) compartido por dos paths: cron auto-commit y sync manual con modal. Drafts table y `/pendientes` se eliminan. Cron corre 00:00 hora Colombia.

**Tech Stack:** Next.js (App Router, breaking-change fork), React 19, Chakra UI v3, NextAuth.js, InsForge SDK, TypeScript, tsx para test scripts ad-hoc.

**Spec:** `docs/superpowers/specs/2026-05-21-gmail-sync-review-modal-design.md`

---

## Phase 1 — Foundation: parser unificado y dispatcher

### Task 1: Tipo unificado `ParsedTransaction`

**Files:**
- Create: `lib/gmail/parsers/types.ts`

- [ ] **Step 1: Crear el archivo de tipos**

```ts
// lib/gmail/parsers/types.ts
import type { Currency, TransactionType } from '@/types/database.types'

export type ParserSource = 'bancolombia' | 'binance' | 'mercantil'

export interface ParsedTransaction {
  type: TransactionType
  amount: number
  currency: Currency
  lastFour: string | null
  merchant: string | null
  date: string // ISO YYYY-MM-DD
  description: string
  confidence: number // 0..0.95
  matchedRule: string
  source: ParserSource
}

export interface ParseInput {
  subject: string
  bodyText: string
  bodyHtml: string
  receivedAt: Date
}

export type Parser = (input: ParseInput) => ParsedTransaction[]
```

- [ ] **Step 2: Verificar que compila**

Run: `npm run type-check`
Expected: PASS (sin errores nuevos; el tipo no se usa aún).

- [ ] **Step 3: Commit**

```bash
git add lib/gmail/parsers/types.ts
git commit -m "feat(gmail): add unified ParsedTransaction type"
```

---

### Task 2: Refactor del parser Bancolombia a contrato `ParsedTransaction[]` + nueva regla `compra_tarjeta_v2`

**Files:**
- Modify: `lib/gmail/parsers/bancolombia.ts`
- Modify: `scripts/test-bancolombia-parser.ts`

- [ ] **Step 1: Agregar nuevo fixture al script de test antes de tocar el parser**

Edit `scripts/test-bancolombia-parser.ts` para agregar al array `fixtures` (al inicio, antes del fixture existente `compra con tarjeta de crédito`):

```ts
{
  name: 'compraste con tarjeta de débito (v2)',
  subject: 'Notificación Bancolombia',
  body: 'Bancolombia: Compraste $39.380,00 en TEMEX LP con tu T.Deb *2499, el 20/05/2026 a las 13:38.',
  expect: { type: 'expense', amount: 39380, lastFour: '2499', matchedRule: 'compra_tarjeta_v2' },
},
{
  name: 'transferencia a cuenta (desde→a)',
  subject: 'Transferencia Bancolombia',
  body: 'Bancolombia: Transferiste $5,000.00 desde tu cuenta 8645 a la cuenta *3133627654 el 21/05/2026 a las 14:19.',
  expect: { type: 'expense', amount: 5000, lastFour: '8645', matchedRule: 'transferencia_a_cuenta' },
},
```

Adicionalmente: el script asume `parseBancolombia` devuelve `T | null`. Cambia el loop principal a manejar array (ver más abajo).

Edit el cuerpo principal del script (buscar `const result = parseBancolombia(...)`):

```ts
const results = parseBancolombia({
  subject: fixture.subject,
  bodyText: fixture.body,
  bodyHtml: '',
  receivedAt: new Date('2026-05-21'),
})
const result = results[0] ?? null
```

- [ ] **Step 2: Correr el test para verificar que falla con los nuevos fixtures**

Run: `npm run test:bancolombia-parser`
Expected: FAIL en los 2 fixtures nuevos (`compra_tarjeta_v2`, `transferencia_a_cuenta`) — el parser actual no los reconoce; los existentes pueden fallar también por el cambio de contrato.

- [ ] **Step 3: Refactor del parser — retornar array y agregar reglas**

Edit `lib/gmail/parsers/bancolombia.ts`. Reemplaza el archivo entero con esta versión consolidada:

```ts
import type { ParsedTransaction, ParseInput, Parser } from './types'
import type { Currency, TransactionType } from '@/types/database.types'

const BANCOLOMBIA_SENDERS = [
  'notificacionesbancolombia@bancolombia.com.co',
  'alertasynotificaciones@notificacionesbancolombia.com',
  'alertasynotificaciones@bancolombia.com.co',
  'alertasynotificaciones@an.notificacionesbancolombia.com',
]

export function isBancolombiaSender(fromHeader: string): boolean {
  const lower = fromHeader.toLowerCase()
  return BANCOLOMBIA_SENDERS.some((s) => lower.includes(s))
}

function parseAmount(raw: string): number | null {
  const cleaned = raw.replace(/\s/g, '').replace(/^\$/, '')
  if (!cleaned) return null
  const commaDecimal = /,\d{2}$/.test(cleaned)
  const dotDecimal = /\.\d{2}$/.test(cleaned)
  let normalized: string
  if (commaDecimal) normalized = cleaned.replace(/\./g, '').replace(',', '.')
  else if (dotDecimal && cleaned.split('.').length === 2) normalized = cleaned.replace(/,/g, '')
  else normalized = cleaned.replace(/[.,]/g, '')
  const num = Number(normalized)
  return Number.isFinite(num) && num > 0 ? num : null
}

function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
}

function detectCurrency(text: string): Currency {
  if (/\bUSD\b|US\$/i.test(text)) return 'USD'
  return 'COP'
}

function todayIsoFrom(d: Date): string {
  return d.toISOString().split('T')[0]
}

interface RuleResult {
  type: TransactionType
  amountRaw: string
  merchant: string | null
  lastFour: string | null
  description: string
  matchedRule: string
}

const RULES: Array<{
  name: string
  pattern: RegExp
  build: (m: RegExpMatchArray) => RuleResult
}> = [
  {
    name: 'compra_tarjeta_v2',
    pattern:
      /compraste\s+\$?\s*([\d.,]+)\s+en\s+([A-Z0-9 .,&'\-/]+?)\s+con\s+tu\s+t\.?\s*(?:deb|cred)\s*\*?(\d{4})/i,
    build: (m) => ({
      type: 'expense',
      amountRaw: m[1],
      merchant: m[2].trim().replace(/\s+/g, ' '),
      lastFour: m[3],
      description: `Compra en ${m[2].trim().replace(/\s+/g, ' ')}`,
      matchedRule: 'compra_tarjeta_v2',
    }),
  },
  {
    name: 'transferencia_a_cuenta',
    pattern:
      /transferiste\s+\$?\s*([\d.,]+)\s+desde\s+(?:tu\s+)?cuenta\s+\*?(\d{4,})\s+a\s+(?:la\s+)?cuenta\s+\*?(\d+)/i,
    build: (m) => {
      const lastFour = m[2].slice(-4)
      const destAccount = `*${m[3].slice(-4)}`
      return {
        type: 'expense',
        amountRaw: m[1],
        merchant: destAccount,
        lastFour,
        description: `Transferencia a cuenta ${destAccount}`,
        matchedRule: 'transferencia_a_cuenta',
      }
    },
  },
  {
    name: 'compra_tarjeta',
    pattern:
      /compra(?:ste)?\s+por\s+\$?\s*([\d.,]+)\s+(?:con\s+tarjeta\s+)?(?:de\s+cr[eé]dito|de\s+d[eé]bito|t\.?\s*(?:cred|deb))?[^.]*?en\s+([A-Z0-9 .,&'\-/*]+?)(?:\s+el\s|\s+\.|\.|\s+t\.?\s*(?:cred|deb)\b|\s+tarjeta\b)/i,
    build: (m) => {
      const lastFourMatch = m.input?.match(/\*+\s*(\d{4})\b|tarjeta[^\d]{0,15}(\d{4})\b/i)
      const lastFour = lastFourMatch?.[1] ?? lastFourMatch?.[2] ?? null
      const merchant = m[2].trim().replace(/\s+/g, ' ')
      return {
        type: 'expense',
        amountRaw: m[1],
        merchant,
        lastFour,
        description: `Compra en ${merchant}`,
        matchedRule: 'compra_tarjeta',
      }
    },
  },
  {
    name: 'transferencia_enviada',
    pattern:
      /transfer(?:iste|encia)\s+(?:exitosa\s+de\s+)?\$?\s*([\d.,]+)\s+(?:a|para)\s+([A-Z0-9 .,&'\-/]+?)(?:\s+desde|\s+de\s+(?:tu\s+)?cuenta|\s+el\b|\.|\sa\s+las\b)/i,
    build: (m) => {
      const lastFourMatch = m.input?.match(/cuenta[^\d]{0,20}(\d{4})\b|cta[^\d]{0,10}\*?(\d{4})\b/i)
      const lastFour = lastFourMatch?.[1] ?? lastFourMatch?.[2] ?? null
      const merchant = m[2].trim().replace(/\s+/g, ' ')
      return {
        type: 'expense',
        amountRaw: m[1],
        merchant,
        lastFour,
        description: `Transferencia a ${merchant}`,
        matchedRule: 'transferencia_enviada',
      }
    },
  },
  {
    name: 'pago_servicio',
    pattern:
      /(?:realizaste\s+un\s+)?pago\s+(?:por|de)\s+\$?\s*([\d.,]+)\s+(?:a|para)\s+([A-Z0-9 .,&'\-/]+?)(?:\s+desde|\s+con|\.|\sa\s+las\b)/i,
    build: (m) => {
      const lastFourMatch = m.input?.match(/cuenta[^\d]{0,20}(\d{4})\b|tarjeta[^\d]{0,15}(\d{4})\b/i)
      const lastFour = lastFourMatch?.[1] ?? lastFourMatch?.[2] ?? null
      const merchant = m[2].trim().replace(/\s+/g, ' ')
      return {
        type: 'expense',
        amountRaw: m[1],
        merchant,
        lastFour,
        description: `Pago a ${merchant}`,
        matchedRule: 'pago_servicio',
      }
    },
  },
  {
    name: 'recepcion',
    pattern:
      /recib(?:iste|ido)\s+(?:una\s+)?(?:transferencia|consignaci[oó]n|abono)\s+(?:por|de)\s+\$?\s*([\d.,]+)\s+de\s+([A-Z0-9 .,&'\-/]+?)(?:\s+en\b|\s+a\b|\.|\sa\s+las\b)/i,
    build: (m) => {
      const lastFourMatch = m.input?.match(/cuenta[^\d]{0,20}(\d{4})\b|cta[^\d]{0,10}\*?(\d{4})\b/i)
      const lastFour = lastFourMatch?.[1] ?? lastFourMatch?.[2] ?? null
      const sender = m[2].trim().replace(/\s+/g, ' ')
      return {
        type: 'income',
        amountRaw: m[1],
        merchant: sender,
        lastFour,
        description: `Transferencia recibida de ${sender}`,
        matchedRule: 'recepcion',
      }
    },
  },
]

export const parseBancolombia: Parser = (input: ParseInput): ParsedTransaction[] => {
  const subject = (input.subject ?? '').replace(/\s+/g, ' ').trim()
  const bodyFromText = (input.bodyText ?? '').replace(/\s+/g, ' ').trim()
  const bodyFromHtml = input.bodyHtml ? htmlToText(input.bodyHtml) : ''
  const haystack = [subject, bodyFromText, bodyFromHtml].filter(Boolean).join(' \n ')
  if (!haystack) return []

  for (const rule of RULES) {
    const match = haystack.match(rule.pattern)
    if (!match) continue
    const result = rule.build(match)
    const amount = parseAmount(result.amountRaw)
    if (!amount) continue
    const currency = detectCurrency(haystack)
    const date = todayIsoFrom(input.receivedAt)
    let confidence = 0.6
    if (result.lastFour) confidence += 0.3
    if (result.merchant && result.merchant.length >= 3) confidence += 0.05
    confidence = Math.min(confidence, 0.95)
    return [{
      type: result.type,
      amount,
      currency,
      lastFour: result.lastFour,
      merchant: result.merchant,
      date,
      description: result.description,
      confidence,
      matchedRule: result.matchedRule,
      source: 'bancolombia',
    }]
  }

  return []
}
```

- [ ] **Step 4: Correr el test y verificar que pasa**

Run: `npm run test:bancolombia-parser`
Expected: PASS en todos los fixtures.

- [ ] **Step 5: Verificar type-check**

Run: `npm run type-check`
Expected: errores en `lib/gmail/process.ts` (espera el contrato viejo) y en otros lugares — eso es esperado, lo arreglamos en tasks siguientes. **No commitear aún** si hay errores fuera de gmail/process.ts; lo arreglamos al final del Phase 2.

- [ ] **Step 6: Commit (aunque process.ts esté roto, este commit aísla el cambio del parser)**

```bash
git add lib/gmail/parsers/bancolombia.ts scripts/test-bancolombia-parser.ts
git commit -m "refactor(gmail): bancolombia parser returns ParsedTransaction[] + add compra_tarjeta_v2 and transferencia_a_cuenta rules"
```

---

### Task 3: Parser de Binance

**Files:**
- Create: `lib/gmail/parsers/binance.ts`
- Create: `scripts/test-binance-parser.ts`
- Modify: `package.json` (agregar script)

- [ ] **Step 1: Crear script de test con fixtures**

Create `scripts/test-binance-parser.ts`:

```ts
import { parseBinance } from '../lib/gmail/parsers/binance'

interface Fixture {
  name: string
  body: string
  expect: { amount: number; currency: 'USD' | 'COP' | 'VES'; matchedRule: string } | null
}

const fixtures: Fixture[] = [
  {
    name: 'payment USDT',
    body: `Payment Transaction Detail
You made the following payment:
Time: 2026-05-17 16:36:40(UTC)
Amount: 26 USDT
View Transaction History`,
    expect: { amount: 26, currency: 'USD', matchedRule: 'payment' },
  },
  {
    name: 'payment con decimales',
    body: 'Time: 2026-05-17 16:36:40(UTC)\nAmount: 1,234.50 USDT',
    expect: { amount: 1234.5, currency: 'USD', matchedRule: 'payment' },
  },
  {
    name: 'BTC (no soportado, devuelve vacío)',
    body: 'Time: 2026-05-17 16:36:40(UTC)\nAmount: 0.001 BTC',
    expect: null,
  },
]

let failed = 0
for (const f of fixtures) {
  const results = parseBinance({ subject: '', bodyText: f.body, bodyHtml: '', receivedAt: new Date('2026-05-17') })
  if (f.expect === null) {
    if (results.length === 0) console.log(`✅ ${f.name}`)
    else { console.log(`❌ ${f.name}: expected empty, got`, results); failed++ }
    continue
  }
  const got = results[0]
  const ok = got && got.amount === f.expect.amount && got.currency === f.expect.currency && got.matchedRule === f.expect.matchedRule
  if (ok) console.log(`✅ ${f.name}`)
  else { console.log(`❌ ${f.name}: expected`, f.expect, 'got', got); failed++ }
}
if (failed) { console.error(`\n${failed} fallaron`); process.exit(1) }
```

- [ ] **Step 2: Agregar el script al `package.json`**

Edit `package.json` `scripts` (después de `test:bancolombia-parser`):

```json
"test:binance-parser": "npx tsx scripts/test-binance-parser.ts",
```

- [ ] **Step 3: Correr y verificar que falla**

Run: `npm run test:binance-parser`
Expected: FAIL — `parseBinance` no existe.

- [ ] **Step 4: Implementar el parser**

Create `lib/gmail/parsers/binance.ts`:

```ts
import type { ParsedTransaction, ParseInput, Parser } from './types'
import type { Currency } from '@/types/database.types'

const BINANCE_SENDERS = ['binance.com']

export function isBinanceSender(fromHeader: string): boolean {
  return fromHeader.toLowerCase().includes('binance.com')
}

const STABLE_TO_USD: Record<string, Currency> = {
  USDT: 'USD',
  USDC: 'USD',
  BUSD: 'USD',
}

function parseAmount(raw: string): number | null {
  const cleaned = raw.replace(/\s/g, '').replace(/,/g, '')
  const num = Number(cleaned)
  return Number.isFinite(num) && num > 0 ? num : null
}

export const parseBinance: Parser = (input: ParseInput): ParsedTransaction[] => {
  const body = `${input.subject ?? ''}\n${input.bodyText ?? ''}\n${input.bodyHtml ?? ''}`
  const amountMatch = body.match(/Amount:\s*([\d.,]+)\s*([A-Z]{3,5})/i)
  if (!amountMatch) return []

  const symbol = amountMatch[2].toUpperCase()
  const currency = STABLE_TO_USD[symbol]
  if (!currency) return [] // BTC/ETH/etc — no soportados por ahora

  const amount = parseAmount(amountMatch[1])
  if (!amount) return []

  const timeMatch = body.match(/Time:\s*(\d{4}-\d{2}-\d{2})/)
  const date = timeMatch ? timeMatch[1] : input.receivedAt.toISOString().split('T')[0]

  return [{
    type: 'expense',
    amount,
    currency,
    lastFour: null,
    merchant: null,
    date,
    description: `Pago Binance ${symbol}`,
    confidence: 0.7,
    matchedRule: 'payment',
    source: 'binance',
  }]
}

void BINANCE_SENDERS // referenced from index dispatcher
```

- [ ] **Step 5: Correr y verificar PASS**

Run: `npm run test:binance-parser`
Expected: PASS en los 3 fixtures.

- [ ] **Step 6: Commit**

```bash
git add lib/gmail/parsers/binance.ts scripts/test-binance-parser.ts package.json
git commit -m "feat(gmail): add Binance parser for stablecoin payments"
```

---

### Task 4: Parser de Banco Mercantil (multi-operación)

**Files:**
- Create: `lib/gmail/parsers/mercantil.ts`
- Create: `scripts/test-mercantil-parser.ts`
- Modify: `package.json`

- [ ] **Step 1: Crear script de test**

Create `scripts/test-mercantil-parser.ts`:

```ts
import { parseMercantil } from '../lib/gmail/parsers/mercantil'

const body = `Mercantil informa las operaciones realizadas en puntos de venta con tus Tarjetas Mercantil.

OPERACION 01
CANAL: PUNTO DE VENTA MAESTRO
OPERACION: CONSUMO
NOMBRE DEL COMERCIO: EMPRESA CINES UNIDOS API CCS VE
NUMERO DE TARJETA DE DEBITO: -*****1551
CUENTA DEBITO: CUENTA CORRIENTE -**** 8389
MONTO: BS. 12.483,53
FECHA DE LA OPERACION: 02/05/2026
HORA DE LA OPERACION: 13:15:11 PM
NRO. DE AUTORIZACION:067388
NRO. DE OPERACION:220592418397
------------------------------------------------

OPERACION 02
CANAL: PUNTO DE VENTA PLATCO
OPERACION: CONSUMO
NOMBRE DEL COMERCIO: CINES UNIDOS SAMBIL SAN CTACHIRA VE
NUMERO DE TARJETA DE DEBITO: -*****1551
CUENTA DEBITO: CUENTA CORRIENTE -**** 8389
MONTO: BS. 21.980,84
FECHA DE LA OPERACION: 02/05/2026
HORA DE LA OPERACION: 18:02:49 PM
NRO. DE AUTORIZACION:059390
NRO. DE OPERACION:055326`

const results = parseMercantil({ subject: 'Notificación Mercantil', bodyText: body, bodyHtml: '', receivedAt: new Date('2026-05-02') })

let failed = 0
function assert(cond: unknown, msg: string) {
  if (cond) console.log(`✅ ${msg}`); else { console.log(`❌ ${msg}`); failed++ }
}

assert(results.length === 2, 'detecta 2 operaciones')
assert(results[0]?.amount === 12483.53, 'op1 monto 12483.53')
assert(results[0]?.currency === 'VES', 'op1 currency VES')
assert(results[0]?.lastFour === '8389', 'op1 lastFour 8389 (cuenta, no tarjeta)')
assert(results[0]?.merchant?.includes('CINES UNIDOS'), 'op1 merchant contiene CINES UNIDOS')
assert(results[0]?.date === '2026-05-02', 'op1 fecha 2026-05-02')
assert(results[0]?.type === 'expense', 'op1 tipo expense')
assert(results[1]?.amount === 21980.84, 'op2 monto 21980.84')
assert(results[1]?.merchant?.includes('SAMBIL'), 'op2 merchant contiene SAMBIL')

if (failed) { console.error(`\n${failed} fallaron`); process.exit(1) }
```

- [ ] **Step 2: Agregar al `package.json`**

Edit `package.json` scripts:

```json
"test:mercantil-parser": "npx tsx scripts/test-mercantil-parser.ts",
```

- [ ] **Step 3: Correr para verificar que falla**

Run: `npm run test:mercantil-parser`
Expected: FAIL (no existe el parser).

- [ ] **Step 4: Implementar parser**

Create `lib/gmail/parsers/mercantil.ts`:

```ts
import type { ParsedTransaction, ParseInput, Parser } from './types'

export function isMercantilSender(fromHeader: string): boolean {
  return fromHeader.toLowerCase().includes('bancomercantil.com')
}

function parseAmountVES(raw: string): number | null {
  // BS. 12.483,53 → 12483.53 (formato VE: punto miles, coma decimal)
  const cleaned = raw.replace(/\s/g, '')
  const commaDecimal = /,\d{2}$/.test(cleaned)
  const normalized = commaDecimal
    ? cleaned.replace(/\./g, '').replace(',', '.')
    : cleaned.replace(/[.,]/g, '')
  const num = Number(normalized)
  return Number.isFinite(num) && num > 0 ? num : null
}

function parseDate(raw: string): string | null {
  // DD/MM/YYYY → YYYY-MM-DD
  const m = raw.match(/(\d{2})\/(\d{2})\/(\d{4})/)
  if (!m) return null
  return `${m[3]}-${m[2]}-${m[1]}`
}

interface BlockMatch {
  amount: number
  lastFour: string | null
  merchant: string | null
  date: string
  type: 'expense' | 'income'
}

function parseBlock(block: string, fallbackDate: string): BlockMatch | null {
  const montoM = block.match(/MONTO:\s*BS\.\s*([\d.,]+)/i)
  if (!montoM) return null
  const amount = parseAmountVES(montoM[1])
  if (!amount) return null

  // Preferir cuenta sobre tarjeta
  const cuentaM = block.match(/CUENTA\s+DEBITO[^\d]*\*+\s*(\d{4})/i)
  const tarjetaM = block.match(/NUMERO\s+DE\s+TARJETA\s+DE\s+DEBITO[^\d]*\*+\s*(\d{4})/i)
  const lastFour = cuentaM?.[1] ?? tarjetaM?.[1] ?? null

  const merchantM = block.match(/NOMBRE\s+DEL\s+COMERCIO:\s*([^\n\r]+)/i)
  const merchant = merchantM?.[1]?.trim() ?? null

  const fechaM = block.match(/FECHA\s+DE\s+LA\s+OPERACION:\s*([\d/]+)/i)
  const date = (fechaM && parseDate(fechaM[1])) || fallbackDate

  const opM = block.match(/^\s*OPERACION:\s*(\w+)/im)
  const opCode = opM?.[1]?.toUpperCase() ?? 'CONSUMO'
  const type: 'expense' | 'income' = ['ABONO', 'DEPOSITO', 'CREDITO'].includes(opCode) ? 'income' : 'expense'

  return { amount, lastFour, merchant, date, type }
}

export const parseMercantil: Parser = (input: ParseInput): ParsedTransaction[] => {
  const body = [input.subject, input.bodyText, input.bodyHtml].filter(Boolean).join('\n')
  if (!body) return []

  const fallbackDate = input.receivedAt.toISOString().split('T')[0]

  // Split por "OPERACION NN" — la primera parte es el preámbulo, la descartamos
  const parts = body.split(/OPERACION\s+\d+/i)
  const blocks = parts.slice(1)
  if (blocks.length === 0) return []

  const results: ParsedTransaction[] = []
  for (const block of blocks) {
    const parsed = parseBlock(block, fallbackDate)
    if (!parsed) continue
    results.push({
      type: parsed.type,
      amount: parsed.amount,
      currency: 'VES',
      lastFour: parsed.lastFour,
      merchant: parsed.merchant,
      date: parsed.date,
      description: parsed.merchant ? `Consumo en ${parsed.merchant}` : 'Operación Mercantil',
      confidence: parsed.lastFour && parsed.merchant ? 0.95 : 0.7,
      matchedRule: 'mercantil:consumo',
      source: 'mercantil',
    })
  }
  return results
}
```

- [ ] **Step 5: Correr y verificar PASS**

Run: `npm run test:mercantil-parser`
Expected: PASS en todas las aserciones.

- [ ] **Step 6: Commit**

```bash
git add lib/gmail/parsers/mercantil.ts scripts/test-mercantil-parser.ts package.json
git commit -m "feat(gmail): add Banco Mercantil multi-operation parser"
```

---

### Task 5: Dispatcher `parsers/index.ts`

**Files:**
- Create: `lib/gmail/parsers/index.ts`

- [ ] **Step 1: Crear dispatcher**

Create `lib/gmail/parsers/index.ts`:

```ts
import type { Parser } from './types'
import { parseBancolombia, isBancolombiaSender } from './bancolombia'
import { parseBinance, isBinanceSender } from './binance'
import { parseMercantil, isMercantilSender } from './mercantil'

export type { ParsedTransaction, ParseInput, Parser, ParserSource } from './types'
export { isBancolombiaSender, isBinanceSender, isMercantilSender }

export function getParserForSender(fromHeader: string): Parser | null {
  if (isBancolombiaSender(fromHeader)) return parseBancolombia
  if (isBinanceSender(fromHeader)) return parseBinance
  if (isMercantilSender(fromHeader)) return parseMercantil
  return null
}
```

- [ ] **Step 2: Verificar type-check (errores en process.ts esperados)**

Run: `npm run type-check`
Expected: errores solo en `lib/gmail/process.ts` y `lib/actions/gmail.actions.ts`. Si hay errores en otros archivos, revisar.

- [ ] **Step 3: Commit**

```bash
git add lib/gmail/parsers/index.ts
git commit -m "feat(gmail): add parser dispatcher"
```

---

## Phase 2 — Process layer refactor

### Task 6: Refactor de `lib/gmail/process.ts` — split parse + commit

**Files:**
- Modify: `lib/gmail/process.ts` (rewrite completo)

- [ ] **Step 1: Reemplazar el archivo completo**

Replace `lib/gmail/process.ts` con:

```ts
import { insforgeAdmin } from '../insforge-admin'
import { applyBalanceDelta } from '../utils/balance-updater'
import { getAccessToken, listMessages, getMessage } from './client'
import { getParserForSender, type ParsedTransaction } from './parsers'

const DEFAULT_LOOKBACK_DAYS = 7

// Query Gmail amplia: filtramos por sender en el dispatcher
const COMBINED_QUERY =
  'from:(notificacionesbancolombia@bancolombia.com.co OR alertasynotificaciones@notificacionesbancolombia.com OR alertasynotificaciones@bancolombia.com.co OR alertasynotificaciones@an.notificacionesbancolombia.com OR do-not-reply@ses.binance.com OR notificaciones@bancomercantil.com)'

export interface ParsedItem extends ParsedTransaction {
  gmailMessageId: string
  rawFrom: string
  rawSubject: string
  rawSnippet: string
}

export interface ParseResult {
  items: ParsedItem[]
  scanned: number
  skipped: number
  errors: number
  errorMessages: string[]
}

export interface CommitInput extends ParsedTransaction {
  gmailMessageId: string
}

export interface CommitResult {
  created: number
  errors: string[]
}

interface AccountRow {
  id: string
  currency: string
  last_four: string | null
}

async function findAccountByLastFour(userId: string, lastFour: string): Promise<AccountRow | null> {
  const { data } = await insforgeAdmin.database
    .from('accounts')
    .select('id, currency, last_four')
    .eq('user_id', userId)
    .eq('last_four', lastFour)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle()
  return (data as AccountRow | null) ?? null
}

async function alreadyProcessed(messageId: string): Promise<boolean> {
  const { data } = await insforgeAdmin.database
    .from('processed_emails')
    .select('gmail_message_id')
    .eq('gmail_message_id', messageId)
    .maybeSingle()
  return !!data
}

function buildQuery(sinceIso: string | null): string {
  if (sinceIso) {
    const epoch = Math.floor(new Date(sinceIso).getTime() / 1000)
    if (Number.isFinite(epoch) && epoch > 0) return `${COMBINED_QUERY} after:${epoch}`
  }
  return `${COMBINED_QUERY} newer_than:${DEFAULT_LOOKBACK_DAYS}d`
}

/**
 * Solo parsea. No toca DB de transactions/processed_emails.
 * Respeta alreadyProcessed para no devolver correos ya registrados.
 * Actualiza gmail_last_synced_at SOLO si encuentra >=1 mensaje.
 */
export async function parseGmailForUser(userId: string): Promise<ParseResult> {
  const result: ParseResult = { items: [], scanned: 0, skipped: 0, errors: 0, errorMessages: [] }

  const { data: user, error: userError } = await insforgeAdmin.database
    .from('users')
    .select('gmail_refresh_token, gmail_last_synced_at')
    .eq('id', userId)
    .single()
  if (userError || !user) throw new Error(`User not found: ${userId}`)
  if (!user.gmail_refresh_token) throw new Error('GMAIL_NOT_CONNECTED')

  const accessToken = await getAccessToken(userId)
  const query = buildQuery(user.gmail_last_synced_at)
  const refs = await listMessages(accessToken, query)
  result.scanned = refs.length

  for (const ref of refs) {
    try {
      if (await alreadyProcessed(ref.id)) { result.skipped++; continue }
      const msg = await getMessage(accessToken, ref.id)
      const fromHeader = msg.headers['from'] ?? ''
      const parser = getParserForSender(fromHeader)
      if (!parser) { result.skipped++; continue }

      const parsed = parser({
        subject: msg.headers['subject'] ?? '',
        bodyText: msg.bodyText,
        bodyHtml: msg.bodyHtml,
        receivedAt: new Date(Number(msg.internalDate)),
      })
      if (parsed.length === 0) { result.skipped++; continue }

      for (const p of parsed) {
        result.items.push({
          ...p,
          gmailMessageId: ref.id,
          rawFrom: fromHeader,
          rawSubject: msg.headers['subject'] ?? '',
          rawSnippet: msg.snippet,
        })
      }
    } catch (err) {
      result.errors++
      const m = err instanceof Error ? err.message : String(err)
      result.errorMessages.push(`${ref.id}: ${m}`)
    }
  }

  if (result.items.length > 0) {
    await insforgeAdmin.database
      .from('users')
      .update({ gmail_last_synced_at: new Date().toISOString() })
      .eq('id', userId)
  }
  return result
}

/**
 * Inserta transacciones + marca processed_emails. Best-effort por item.
 * Para cada item: resuelve account_id por last_four (si está presente),
 * inserta transaction, aplica balance delta, marca processed.
 */
export async function commitParsedTransactions(userId: string, items: CommitInput[]): Promise<CommitResult> {
  const result: CommitResult = { created: 0, errors: [] }

  for (const item of items) {
    try {
      const account = item.lastFour ? await findAccountByLastFour(userId, item.lastFour) : null

      const { data: created, error: insertError } = await insforgeAdmin.database
        .from('transactions')
        .insert([
          {
            user_id: userId,
            amount: item.amount,
            currency: item.currency,
            type: item.type,
            category_id: null,
            account_id: account?.id ?? null,
            description: item.description,
            date: item.date,
            source: 'gmail',
            notes: `Gmail: ${item.matchedRule} (msg ${item.gmailMessageId})`,
          },
        ])
        .select('id')
        .single()

      if (insertError || !created) {
        throw new Error(`insert tx failed: ${JSON.stringify(insertError)}`)
      }

      if (account) {
        const direction = item.type === 'income' ? 'add' : 'subtract'
        await applyBalanceDelta(account.id, item.amount, item.currency, direction)
      }

      await insforgeAdmin.database.from('processed_emails').insert([
        {
          gmail_message_id: item.gmailMessageId,
          user_id: userId,
          outcome: 'auto_registered',
          transaction_id: created.id,
        },
      ])

      result.created++
    } catch (err) {
      const m = err instanceof Error ? err.message : String(err)
      result.errors.push(`${item.gmailMessageId}: ${m}`)
      // Best-effort: marcar processed con outcome=error para no reintentar
      await insforgeAdmin.database
        .from('processed_emails')
        .insert([{ gmail_message_id: item.gmailMessageId, user_id: userId, outcome: 'error', error_message: m.slice(0, 500) }])
        .then(() => undefined, () => undefined)
    }
  }

  return result
}

/**
 * Helper para el cron: parse + commit en una pasada.
 */
export async function autoCommitGmailForUser(userId: string): Promise<{ parse: ParseResult; commit: CommitResult }> {
  const parse = await parseGmailForUser(userId)
  const commit = await commitParsedTransactions(userId, parse.items)
  return { parse, commit }
}
```

- [ ] **Step 2: Verificar type-check (solo gmail.actions.ts y el cron route deberían seguir rotos)**

Run: `npm run type-check`
Expected: errores limitados a `lib/actions/gmail.actions.ts` y `app/api/cron/sync-gmail/route.ts`.

- [ ] **Step 3: Commit**

```bash
git add lib/gmail/process.ts
git commit -m "refactor(gmail): split process into parseGmailForUser + commitParsedTransactions"
```

---

### Task 7: Actualizar el cron route a usar `autoCommitGmailForUser`

**Files:**
- Modify: `app/api/cron/sync-gmail/route.ts`

- [ ] **Step 1: Reemplazar el handler**

Replace `app/api/cron/sync-gmail/route.ts` con:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { insforgeAdmin } from '@/lib/insforge-admin'
import { autoCommitGmailForUser } from '@/lib/gmail/process'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const start = new Date().toISOString()
  console.log(`[cron:sync-gmail] start=${start}`)

  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    console.error('[cron:sync-gmail] Unauthorized')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { data: users, error } = await insforgeAdmin.database
      .from('users')
      .select('id, email')
      .not('gmail_refresh_token', 'is', null)
    if (error) throw error

    const connected = (users ?? []) as Array<{ id: string; email: string }>
    let totalScanned = 0, totalCreated = 0, totalSkipped = 0
    const allErrors: string[] = []

    for (const user of connected) {
      try {
        const { parse, commit } = await autoCommitGmailForUser(user.id)
        totalScanned += parse.scanned
        totalCreated += commit.created
        totalSkipped += parse.skipped
        allErrors.push(...parse.errorMessages.map((e) => `${user.id}: parse: ${e}`))
        allErrors.push(...commit.errors.map((e) => `${user.id}: commit: ${e}`))
        console.log(`[cron:sync-gmail] user=${user.id} scanned=${parse.scanned} created=${commit.created} skipped=${parse.skipped}`)
      } catch (err) {
        const m = err instanceof Error ? err.message : String(err)
        console.error(`[cron:sync-gmail] user=${user.id} fatal=`, m)
        allErrors.push(`${user.id}: fatal: ${m}`)
      }
    }

    console.log(`[cron:sync-gmail] done users=${connected.length} scanned=${totalScanned} created=${totalCreated} skipped=${totalSkipped} errors=${allErrors.length}`)
    return NextResponse.json({
      ok: true,
      usersProcessed: connected.length,
      scanned: totalScanned,
      created: totalCreated,
      skipped: totalSkipped,
      errors: allErrors.length > 0 ? allErrors : undefined,
    })
  } catch (error) {
    console.error('[cron:sync-gmail] unhandled', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Verificar type-check**

Run: `npm run type-check`
Expected: errores solo en `lib/actions/gmail.actions.ts`.

- [ ] **Step 3: Commit**

```bash
git add app/api/cron/sync-gmail/route.ts
git commit -m "feat(cron): use autoCommitGmailForUser (auto-register with category=null)"
```

---

## Phase 3 — Server actions

### Task 8: Reescribir `lib/actions/gmail.actions.ts`

**Files:**
- Modify: `lib/actions/gmail.actions.ts` (rewrite)

- [ ] **Step 1: Reemplazar el archivo**

Replace `lib/actions/gmail.actions.ts` con:

```ts
'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { insforgeAdmin } from '@/lib/insforge-admin'
import {
  parseGmailForUser,
  commitParsedTransactions,
  type ParsedItem,
  type CommitInput,
} from '@/lib/gmail/process'

async function requireUserId(): Promise<string> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Not authenticated')
  return session.user.id
}

function revalidateAfterMutation() {
  revalidatePath('/transactions')
  revalidatePath('/movimientos')
  revalidatePath('/dashboard')
  revalidatePath('/settings')
}

export interface SyncGmailSuccess {
  success: true
  items: ParsedItem[]
  scanned: number
  skipped: number
  errors: number
}

export async function syncGmail(): Promise<
  SyncGmailSuccess | { success: false; error: string }
> {
  try {
    const userId = await requireUserId()
    const result = await parseGmailForUser(userId)
    return {
      success: true,
      items: result.items,
      scanned: result.scanned,
      skipped: result.skipped,
      errors: result.errors,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (message === 'GMAIL_NOT_CONNECTED') {
      return { success: false, error: 'Gmail no conectado. Inicia sesión de nuevo otorgando permiso de Gmail.' }
    }
    console.error('syncGmail error:', err)
    return { success: false, error: 'No se pudo sincronizar con Gmail' }
  }
}

export async function commitGmailTransactions(
  items: CommitInput[]
): Promise<
  | { success: true; created: number; errors: string[] }
  | { success: false; error: string }
> {
  try {
    const userId = await requireUserId()
    if (!Array.isArray(items) || items.length === 0) {
      return { success: false, error: 'No hay transacciones para registrar' }
    }
    // Validación de seguridad: cada item debe tener categoría
    for (const item of items) {
      if (!('category_id' in item) || !(item as unknown as { category_id?: string }).category_id) {
        return { success: false, error: 'Cada transacción debe tener categoría asignada' }
      }
    }
    const result = await commitParsedTransactions(userId, items)
    revalidateAfterMutation()
    return { success: true, created: result.created, errors: result.errors }
  } catch (err) {
    console.error('commitGmailTransactions error:', err)
    return { success: false, error: 'Error al registrar transacciones' }
  }
}

export async function disconnectGmail(): Promise<
  { success: true } | { success: false; error: string }
> {
  try {
    const userId = await requireUserId()
    const { error } = await insforgeAdmin.database
      .from('users')
      .update({ gmail_refresh_token: null, gmail_connected_at: null, gmail_last_synced_at: null })
      .eq('id', userId)
    if (error) throw error
    revalidatePath('/settings')
    return { success: true }
  } catch (err) {
    console.error('disconnectGmail error:', err)
    return { success: false, error: 'No se pudo desconectar Gmail' }
  }
}

export async function getGmailStatus(): Promise<{
  connected: boolean
  connectedAt: string | null
  lastSyncedAt: string | null
}> {
  const userId = await requireUserId()
  const { data } = await insforgeAdmin.database
    .from('users')
    .select('gmail_refresh_token, gmail_connected_at, gmail_last_synced_at')
    .eq('id', userId)
    .single()
  return {
    connected: !!data?.gmail_refresh_token,
    connectedAt: data?.gmail_connected_at ?? null,
    lastSyncedAt: data?.gmail_last_synced_at ?? null,
  }
}
```

Nota importante: en `commitParsedTransactions` (process.ts) hoy inserta con `category_id: null` siempre — para el flujo del modal, necesitamos pasar la categoría editada. Esto se ajusta en el Step 2.

- [ ] **Step 2: Ajustar `commitParsedTransactions` para aceptar `category_id` y `account_id` desde el item**

Edit `lib/gmail/process.ts`. Cambiar `CommitInput`:

```ts
export interface CommitInput extends ParsedTransaction {
  gmailMessageId: string
  category_id: string | null
  account_id?: string | null
}
```

Y dentro de `commitParsedTransactions`, reemplazar la lógica de resolución de cuenta y la inserción para usar lo que viene en `item`:

```ts
for (const item of items) {
  try {
    // Si el caller pasó account_id explícitamente úsalo; si no, resuelve por last_four
    let accountId: string | null = item.account_id ?? null
    if (accountId === undefined || accountId === null) {
      const account = item.lastFour ? await findAccountByLastFour(userId, item.lastFour) : null
      accountId = account?.id ?? null
    }

    const { data: created, error: insertError } = await insforgeAdmin.database
      .from('transactions')
      .insert([
        {
          user_id: userId,
          amount: item.amount,
          currency: item.currency,
          type: item.type,
          category_id: item.category_id,
          account_id: accountId,
          description: item.description,
          date: item.date,
          source: 'gmail',
          notes: `Gmail: ${item.matchedRule} (msg ${item.gmailMessageId})`,
        },
      ])
      .select('id')
      .single()

    if (insertError || !created) throw new Error(`insert tx failed: ${JSON.stringify(insertError)}`)

    if (accountId) {
      // Necesitamos currency real de la cuenta para applyBalanceDelta? Sí, para conversión.
      const { data: acc } = await insforgeAdmin.database
        .from('accounts')
        .select('currency')
        .eq('id', accountId)
        .maybeSingle()
      const direction = item.type === 'income' ? 'add' : 'subtract'
      await applyBalanceDelta(accountId, item.amount, (acc?.currency ?? item.currency) as typeof item.currency, direction)
    }

    await insforgeAdmin.database.from('processed_emails').insert([
      { gmail_message_id: item.gmailMessageId, user_id: userId, outcome: 'auto_registered', transaction_id: created.id },
    ])
    result.created++
  } catch (err) {
    const m = err instanceof Error ? err.message : String(err)
    result.errors.push(`${item.gmailMessageId}: ${m}`)
    await insforgeAdmin.database
      .from('processed_emails')
      .insert([{ gmail_message_id: item.gmailMessageId, user_id: userId, outcome: 'error', error_message: m.slice(0, 500) }])
      .then(() => undefined, () => undefined)
  }
}
```

Y `autoCommitGmailForUser` debe pasar `category_id: null` para el cron:

```ts
export async function autoCommitGmailForUser(userId: string): Promise<{ parse: ParseResult; commit: CommitResult }> {
  const parse = await parseGmailForUser(userId)
  const commitItems: CommitInput[] = parse.items.map((it) => ({ ...it, category_id: null }))
  const commit = await commitParsedTransactions(userId, commitItems)
  return { parse, commit }
}
```

- [ ] **Step 3: Verificar type-check**

Run: `npm run type-check`
Expected: errores en `app/(dashboard)/pendientes/*` (los que importan `confirmDraft`, `rejectDraft`, etc.) — eso se limpia en Task 13. También en `components/settings/GmailConnectionPanel.tsx` por el cambio de signature de `syncGmail` (devuelve `items` en vez de `data`) — se limpia en Task 12.

- [ ] **Step 4: Commit**

```bash
git add lib/actions/gmail.actions.ts lib/gmail/process.ts
git commit -m "feat(gmail): new server actions syncGmail (parse-only) + commitGmailTransactions"
```

---

## Phase 4 — UI: modal y wiring

### Task 9: Agregar prop `onSubmitOverride` a `TransactionEditForm`

**Files:**
- Modify: `components/transactions/TransactionEditForm.tsx`

- [ ] **Step 1: Leer el archivo completo para entender el handleSubmit actual**

Run: `cat components/transactions/TransactionEditForm.tsx`

- [ ] **Step 2: Agregar prop opcional `onSubmitOverride` y usarla**

Editar la interfaz `Props` (línea ~31):

```ts
interface Props {
  isOpen: boolean
  onClose: () => void
  userId: string
  categories: Category[]
  accounts?: Account[]
  transaction: TransactionWithCategory
  onSuccess: () => void
  /** Si está presente, se invoca con los valores en vez de llamar a updateTransaction. */
  onSubmitOverride?: (values: {
    type: TransactionType
    amount: number
    currency: Currency
    category_id: string
    account_id: string | null
    description: string
    date: string
    notes: string
  }) => void
}
```

Importar `TransactionType` arriba si no está:

```ts
import type { Account, Category, Currency, TransactionType, TransactionWithCategory } from '@/types/database.types'
```

Buscar el `handleSubmit` (busca `const handleSubmit`) y modificarlo:

```ts
const handleSubmit = async () => {
  if (!formData.amount || !formData.category_id || !formData.description || !formData.date) {
    toaster.create({ title: 'Faltan campos', type: 'error' })
    return
  }

  // Modo override: el caller maneja la persistencia
  if (onSubmitOverride) {
    onSubmitOverride({
      type: formData.type,
      amount: formData.amount,
      currency: formData.currency,
      category_id: formData.category_id,
      account_id: formData.account_id || null,
      description: formData.description,
      date: formData.date,
      notes: formData.notes,
    })
    onSuccess()
    onClose()
    return
  }

  setLoading(true)
  // ... resto del handler existente (llama updateTransaction)
}
```

- [ ] **Step 3: Verificar type-check**

Run: `npm run type-check`
Expected: PASS para este archivo.

- [ ] **Step 4: Commit**

```bash
git add components/transactions/TransactionEditForm.tsx
git commit -m "feat(transactions): add onSubmitOverride prop to TransactionEditForm"
```

---

### Task 10: Crear `GmailSyncReviewModal`

**Files:**
- Create: `components/transactions/GmailSyncReviewModal.tsx`

- [ ] **Step 1: Crear el componente**

Create `components/transactions/GmailSyncReviewModal.tsx`:

```tsx
'use client'

import {
  Box, Button, HStack, VStack, Text, Table, IconButton, Badge, Stack,
} from '@chakra-ui/react'
import { useState, useMemo } from 'react'
import { FiEdit2, FiTrash2, FiCheck, FiX } from 'react-icons/fi'
import { FormDialog } from '@/components/ui/FormDialog'
import { CategorySelect } from '@/components/ui/CategorySelect'
import { AccountSelect } from '@/components/ui/AccountSelect'
import { TransactionEditForm } from './TransactionEditForm'
import { commitGmailTransactions } from '@/lib/actions/gmail.actions'
import { toaster } from '@/lib/toaster'
import { formatCurrency } from '@/lib/utils/currency'
import type { Account, Category, Currency, TransactionType, TransactionWithCategory } from '@/types/database.types'
import type { ParsedItem } from '@/lib/gmail/process'

interface ReviewItem {
  parsed: ParsedItem
  edited: {
    type: TransactionType
    amount: number
    currency: Currency
    category_id: string
    account_id: string | null
    description: string
    date: string
    notes: string
  }
  excluded: boolean
}

function initialEdited(p: ParsedItem): ReviewItem['edited'] {
  return {
    type: p.type,
    amount: p.amount,
    currency: p.currency,
    category_id: '',
    account_id: null,
    description: p.description,
    date: p.date,
    notes: '',
  }
}

interface Props {
  isOpen: boolean
  onClose: () => void
  userId: string
  items: ParsedItem[]
  categories: Category[]
  accounts: Account[]
  onDone: () => void
}

export function GmailSyncReviewModal({ isOpen, onClose, userId, items, categories, accounts, onDone }: Props) {
  const [reviews, setReviews] = useState<ReviewItem[]>(
    items.map((p) => ({ parsed: p, edited: initialEdited(p), excluded: false }))
  )
  const [editing, setEditing] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  const activeReviews = useMemo(() => reviews.filter((r) => !r.excluded), [reviews])
  const missingCategory = useMemo(
    () => activeReviews.some((r) => !r.edited.category_id),
    [activeReviews]
  )

  const updateRow = (idx: number, patch: Partial<ReviewItem['edited']>) => {
    setReviews((prev) => prev.map((r, i) => i === idx ? { ...r, edited: { ...r.edited, ...patch } } : r))
  }
  const toggleExclude = (idx: number) => {
    setReviews((prev) => prev.map((r, i) => i === idx ? { ...r, excluded: !r.excluded } : r))
  }

  const handleSave = async () => {
    if (missingCategory) {
      toaster.create({ title: 'Asigna categoría a todas las transacciones', type: 'error' })
      return
    }
    setSaving(true)
    const payload = activeReviews.map((r) => ({
      ...r.parsed,
      type: r.edited.type,
      amount: r.edited.amount,
      currency: r.edited.currency,
      description: r.edited.description,
      date: r.edited.date,
      category_id: r.edited.category_id,
      account_id: r.edited.account_id,
    }))
    const result = await commitGmailTransactions(payload)
    setSaving(false)
    if (!result.success) {
      toaster.create({ title: 'Error', description: result.error, type: 'error' })
      return
    }
    toaster.create({
      title: `${result.created} transacciones registradas`,
      description: result.errors.length > 0 ? `${result.errors.length} con error` : undefined,
      type: result.errors.length > 0 ? 'warning' : 'success',
    })
    onDone()
    onClose()
  }

  const handleDiscard = () => {
    toaster.create({ title: 'No se registró ninguna transacción', type: 'info' })
    onClose()
  }

  const editingReview = editing != null ? reviews[editing] : null
  const editingAsTransaction: TransactionWithCategory | null = editingReview
    ? {
        id: `staging-${editing}`,
        user_id: userId,
        amount: editingReview.edited.amount,
        currency: editingReview.edited.currency,
        type: editingReview.edited.type,
        category_id: editingReview.edited.category_id || null,
        account_id: editingReview.edited.account_id,
        description: editingReview.edited.description,
        date: editingReview.edited.date,
        notes: editingReview.edited.notes,
        source: 'gmail',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        category: null,
      } as TransactionWithCategory
    : null

  return (
    <>
      <FormDialog isOpen={isOpen} onClose={handleDiscard} title={`Revisar ${reviews.length} transacciones detectadas`}>
        <VStack align="stretch" gap={4}>
          <Text fontSize="sm" color="#B0B0B0">
            Edita categoría, cuenta y otros campos antes de guardar. Las transacciones no se registran hasta que confirmes.
          </Text>

          {/* Desktop: tabla */}
          <Box display={{ base: 'none', md: 'block' }} overflowX="auto">
            <Table.Root size="sm">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader>Fecha</Table.ColumnHeader>
                  <Table.ColumnHeader>Origen</Table.ColumnHeader>
                  <Table.ColumnHeader>Descripción</Table.ColumnHeader>
                  <Table.ColumnHeader>Monto</Table.ColumnHeader>
                  <Table.ColumnHeader>Categoría</Table.ColumnHeader>
                  <Table.ColumnHeader>Cuenta</Table.ColumnHeader>
                  <Table.ColumnHeader>Acciones</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {reviews.map((r, idx) => (
                  <Table.Row key={idx} opacity={r.excluded ? 0.4 : 1}>
                    <Table.Cell>{r.edited.date}</Table.Cell>
                    <Table.Cell><Badge>{r.parsed.source}</Badge></Table.Cell>
                    <Table.Cell maxW="200px" truncate>{r.edited.description}</Table.Cell>
                    <Table.Cell>{formatCurrency(r.edited.amount, r.edited.currency)}</Table.Cell>
                    <Table.Cell>
                      <CategorySelect
                        value={r.edited.category_id}
                        onChange={(v) => updateRow(idx, { category_id: v })}
                        categories={categories}
                        filterByType={r.edited.type}
                        required
                      />
                    </Table.Cell>
                    <Table.Cell>
                      <AccountSelect
                        value={r.edited.account_id ?? ''}
                        onChange={(v) => updateRow(idx, { account_id: v || null })}
                        accounts={accounts}
                        optional
                        placeholder="—"
                      />
                    </Table.Cell>
                    <Table.Cell>
                      <HStack gap={1}>
                        <IconButton aria-label="Editar" size="xs" variant="ghost" onClick={() => setEditing(idx)}><FiEdit2 /></IconButton>
                        <IconButton aria-label={r.excluded ? 'Incluir' : 'Excluir'} size="xs" variant="ghost" color={r.excluded ? '#4ade80' : '#ef4444'} onClick={() => toggleExclude(idx)}>
                          {r.excluded ? <FiCheck /> : <FiTrash2 />}
                        </IconButton>
                      </HStack>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </Box>

          {/* Mobile: cards */}
          <VStack display={{ base: 'flex', md: 'none' }} gap={3} align="stretch">
            {reviews.map((r, idx) => (
              <Box key={idx} borderWidth="1px" borderColor="#2d2d35" borderRadius="md" p={3} bg="#18181d" opacity={r.excluded ? 0.4 : 1}>
                <Stack gap={2}>
                  <HStack justify="space-between">
                    <Badge>{r.parsed.source}</Badge>
                    <Text fontWeight="600">{formatCurrency(r.edited.amount, r.edited.currency)}</Text>
                  </HStack>
                  <Text fontSize="sm">{r.edited.description}</Text>
                  <Text fontSize="xs" color="#B0B0B0">{r.edited.date}</Text>
                  <CategorySelect value={r.edited.category_id} onChange={(v) => updateRow(idx, { category_id: v })} categories={categories} filterByType={r.edited.type} required />
                  <AccountSelect value={r.edited.account_id ?? ''} onChange={(v) => updateRow(idx, { account_id: v || null })} accounts={accounts} optional placeholder="Sin cuenta" />
                  <HStack justify="flex-end" gap={2}>
                    <Button size="sm" variant="outline" onClick={() => setEditing(idx)}><FiEdit2 /> Editar</Button>
                    <Button size="sm" variant="outline" colorPalette={r.excluded ? 'green' : 'red'} onClick={() => toggleExclude(idx)}>
                      {r.excluded ? <><FiCheck /> Incluir</> : <><FiX /> Excluir</>}
                    </Button>
                  </HStack>
                </Stack>
              </Box>
            ))}
          </VStack>

          <HStack justify="space-between" pt={4} borderTopWidth="1px" borderColor="#2d2d35">
            <Text fontSize="sm" color="#B0B0B0">
              {activeReviews.length} de {reviews.length} se registrarán
            </Text>
            <HStack gap={2}>
              <Button variant="outline" onClick={handleDiscard} disabled={saving}>Descartar</Button>
              <Button bg="#4F46E5" color="white" _hover={{ bg: '#4338CA' }} onClick={handleSave} loading={saving} disabled={activeReviews.length === 0}>
                Guardar todas
              </Button>
            </HStack>
          </HStack>
        </VStack>
      </FormDialog>

      {editingAsTransaction && editing != null && (
        <TransactionEditForm
          isOpen={true}
          onClose={() => setEditing(null)}
          userId={userId}
          categories={categories}
          accounts={accounts}
          transaction={editingAsTransaction}
          onSuccess={() => setEditing(null)}
          onSubmitOverride={(values) => updateRow(editing, values)}
        />
      )}
    </>
  )
}
```

- [ ] **Step 2: Verificar type-check**

Run: `npm run type-check`
Expected: PASS para el modal. Si `FormDialog` o `Table.Root` no exportan lo esperado, ajustar imports según los componentes UI existentes (chequea `components/ui/FormDialog.tsx` para confirmar la API).

- [ ] **Step 3: Commit**

```bash
git add components/transactions/GmailSyncReviewModal.tsx
git commit -m "feat(gmail): add GmailSyncReviewModal for manual sync review"
```

---

### Task 11: Wire `GmailSyncButton` para abrir el modal

**Files:**
- Modify: `components/transactions/GmailSyncButton.tsx`
- Verify: cómo se pasan `categories`, `accounts`, `userId` al botón (puede requerir cambio en el padre)

- [ ] **Step 1: Identificar el padre del botón**

Run: `grep -rn "GmailSyncButton" app components --include='*.tsx' | grep -v node_modules`
Esperado: encontrar dónde se usa (probablemente `app/(dashboard)/movimientos/...` o `TransactionsPageClient.tsx`).

- [ ] **Step 2: Cambiar la signature del botón para aceptar lo necesario**

Replace `components/transactions/GmailSyncButton.tsx` con:

```tsx
'use client'

import { Button, Text } from '@chakra-ui/react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FiMail } from 'react-icons/fi'
import { syncGmail } from '@/lib/actions/gmail.actions'
import { toaster } from '@/lib/toaster'
import { GmailSyncReviewModal } from './GmailSyncReviewModal'
import type { Account, Category } from '@/types/database.types'
import type { ParsedItem } from '@/lib/gmail/process'

interface Props {
  userId: string
  categories: Category[]
  accounts: Account[]
}

export function GmailSyncButton({ userId, categories, accounts }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<ParsedItem[] | null>(null)

  const handleClick = async () => {
    setLoading(true)
    const result = await syncGmail()
    setLoading(false)

    if (!result.success) {
      toaster.create({ title: 'No se pudo sincronizar', description: result.error, type: 'error', duration: 5000 })
      return
    }
    if (result.items.length === 0) {
      toaster.create({
        title: 'Sin correos nuevos',
        description: `Procesados ${result.scanned} · Omitidos ${result.skipped}${result.errors > 0 ? ` · Errores ${result.errors}` : ''}`,
        type: 'info',
        duration: 4000,
      })
      return
    }
    setItems(result.items)
  }

  return (
    <>
      <Button variant="outline" onClick={handleClick} size={{ base: 'sm', md: 'md' }} loading={loading}>
        <FiMail />
        <Text display={{ base: 'none', sm: 'inline' }}>Sincronizar correos</Text>
        <Text display={{ base: 'inline', sm: 'none' }}>Gmail</Text>
      </Button>

      {items && (
        <GmailSyncReviewModal
          isOpen={true}
          onClose={() => setItems(null)}
          userId={userId}
          items={items}
          categories={categories}
          accounts={accounts}
          onDone={() => router.refresh()}
        />
      )}
    </>
  )
}
```

- [ ] **Step 3: Ajustar el padre para pasar las props nuevas**

En el padre identificado en Step 1 (probablemente `app/(dashboard)/transactions/TransactionsPageClient.tsx` o similar). Buscar `<GmailSyncButton />` y reemplazar con `<GmailSyncButton userId={userId} categories={categories} accounts={accounts} />`.

Si el padre no recibe `userId`/`categories`/`accounts`, cargarlos en el server component padre y propagarlos. Verificar el page.tsx correspondiente.

- [ ] **Step 4: Type-check**

Run: `npm run type-check`
Expected: PASS.

- [ ] **Step 5: Probar en dev**

Run: `npm run dev`
Abrir `/movimientos` en el browser, click "Sincronizar correos":
- Si no hay correos: toast "Sin correos nuevos".
- Si hay correos: se abre modal con la lista.
- Editar categoría inline en una fila.
- Click "Editar" abre el form completo, modifica monto, "Guardar" actualiza la fila sin tocar DB.
- Click "Guardar todas" registra las transacciones, modal cierra, página refresca.
- Verificar las nuevas transacciones aparecen en `/movimientos`.

- [ ] **Step 6: Commit**

```bash
git add components/transactions/GmailSyncButton.tsx app/\(dashboard\)/
git commit -m "feat(gmail): wire GmailSyncButton to open review modal"
```

---

### Task 12: Quitar el botón de sincronizar del panel de settings

**Files:**
- Modify: `components/settings/GmailConnectionPanel.tsx`

- [ ] **Step 1: Leer el archivo completo**

Run: `cat components/settings/GmailConnectionPanel.tsx`

- [ ] **Step 2: Quitar imports, state y JSX del sync**

Eliminar:
- Import de `syncGmail` (línea ~8).
- State `syncing` y `setSyncing`.
- Función `handleSync` completa.
- Botón "Sincronizar" en el JSX (busca `handleSync`).

Mantener solo: conexión/desconexión Gmail, status de última sincronización.

- [ ] **Step 3: Type-check + build**

Run: `npm run type-check`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add components/settings/GmailConnectionPanel.tsx
git commit -m "refactor(settings): remove sync button from GmailConnectionPanel (now only in movimientos)"
```

---

## Phase 5 — Cleanup

### Task 13: Eliminar `/pendientes` y el tipo `TransactionDraft`

**Files:**
- Delete: `app/(dashboard)/pendientes/page.tsx`
- Delete: `app/(dashboard)/pendientes/PendientesPageClient.tsx`
- Delete: directorio `app/(dashboard)/pendientes/`
- Modify: `types/database.types.ts` (eliminar `TransactionDraft`, `TransactionDraftStatus`)

- [ ] **Step 1: Borrar la carpeta `pendientes`**

Run: `rm -rf "app/(dashboard)/pendientes"`

- [ ] **Step 2: Eliminar tipo TransactionDraft**

Edit `types/database.types.ts`. Borrar las líneas 219 a ~245 (el bloque completo de `TransactionDraftStatus` e `interface TransactionDraft`). Si hay un re-export en otro archivo, también limpiarlo.

- [ ] **Step 3: Buscar referencias residuales**

Run: `grep -rn "TransactionDraft\|transaction_drafts\|/pendientes" --include='*.ts' --include='*.tsx' app components hooks lib types`
Expected: cero resultados.

- [ ] **Step 4: Quitar `revalidatePath('/pendientes')` si quedó en alguna parte**

Ya fue limpiado por la reescritura de `gmail.actions.ts` en Task 8. Confirmar:

Run: `grep -n "/pendientes" lib/actions/gmail.actions.ts`
Expected: cero resultados.

- [ ] **Step 5: Type-check**

Run: `npm run type-check`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: remove /pendientes page and TransactionDraft type"
```

---

### Task 14: DROP TABLE `transaction_drafts`

**Files:**
- (no archivos del repo — operación de DB)

- [ ] **Step 1: Conectarse a la DB de InsForge y ejecutar**

Usar el CLI de InsForge o el dashboard para correr:

```sql
DROP TABLE IF EXISTS transaction_drafts;
```

Si usas `npx insforge sql` o equivalente, confirmar la sintaxis exacta en el dashboard de InsForge antes de ejecutar en producción. **Hacer backup primero si la tabla tiene filas con `status='pending'` que te importen.** Conforme al spec, esos drafts se pierden intencionalmente.

- [ ] **Step 2: Verificar que la app sigue funcionando**

Run: `npm run dev` y abrir `/movimientos`. No debe haber errores en consola relacionados con `transaction_drafts`.

- [ ] **Step 3: Sin commit (cambio de DB, no de código)**

---

### Task 15: Actualizar el cron schedule en `vercel.json`

**Files:**
- Modify: `vercel.json`

- [ ] **Step 1: Cambiar el schedule del cron `sync-gmail`**

Edit `vercel.json`. Cambiar:

```json
{
  "path": "/api/cron/sync-gmail",
  "schedule": "0 11 * * *"
}
```

a:

```json
{
  "path": "/api/cron/sync-gmail",
  "schedule": "0 5 * * *"
}
```

(00:00 hora Colombia = UTC-5 = 05:00 UTC)

- [ ] **Step 2: Commit**

```bash
git add vercel.json
git commit -m "chore(cron): sync-gmail runs at midnight Colombia (05:00 UTC)"
```

---

### Task 16: Borrar manualmente la transacción huérfana sin categoría

**Files:** (operación manual UI)

- [ ] **Step 1: En el browser, ir a `/movimientos`**

- [ ] **Step 2: Buscar la transacción "Transferencia a cuenta *3133" (Bancolombia, sin categoría) y borrarla usando el botón de eliminar de la fila.**

(Esta es la transacción que se creó durante el debugging anterior, cuando el auto-register estaba activo. Una vez borrada, si quieres que vuelva a aparecer en el próximo sync manual, también borra la fila correspondiente de `processed_emails` desde el dashboard de InsForge.)

---

### Task 17: Verificación end-to-end

- [ ] **Step 1: Type-check + lint completo**

Run: `npm run type-check && npm run lint`
Expected: PASS sin errores.

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 3: Test parsers completos**

Run: `npm run test:bancolombia-parser && npm run test:binance-parser && npm run test:mercantil-parser`
Expected: PASS en los tres.

- [ ] **Step 4: Test E2E manual**

En `npm run dev`:
1. Login con cuenta Gmail conectada.
2. Ir a `/movimientos`, click "Sincronizar correos".
3. Si no hay correos: toast info.
4. Si hay correos: verificar que el modal abre, edita una fila inline, abre el form completo en otra, excluye una tercera, click "Guardar todas".
5. Verificar que las transacciones registradas aparecen en `/movimientos` con su categoría asignada.
6. Verificar que la transacción excluida NO aparece y que `processed_emails` no la tiene marcada (próximo sync la mostrará otra vez).
7. Ir a `/settings`: verificar que NO hay botón de sincronizar, solo conexión/desconexión.
8. Verificar que `/pendientes` da 404.

- [ ] **Step 5: Probar el cron localmente**

Run: `curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/sync-gmail`
Expected: JSON con `ok: true` y conteo de tx creadas/scanneadas. Si hay correos no procesados, deben quedar como transacciones con `category_id=null`.

- [ ] **Step 6: Commit final si quedó algún ajuste**

```bash
git add -A
git commit -m "chore: e2e verification fixes" --allow-empty
```

---

## Self-Review Notes

- **Spec coverage check:**
  - Arquitectura dual cron/manual → Tasks 6, 7, 8, 11 ✓
  - Parsers (Bancolombia v2, Binance, Mercantil) → Tasks 2, 3, 4 ✓
  - Dispatcher → Task 5 ✓
  - Modal con tabla/cards + onSubmitOverride → Tasks 9, 10 ✓
  - Cleanup (/pendientes, drafts table, type) → Tasks 13, 14 ✓
  - Cron schedule 00:00 Colombia → Task 15 ✓
  - Validación categoría obligatoria en commit → Task 8 (commitGmailTransactions valida) y Task 10 (modal bloquea con missingCategory) ✓
  - Exclusión por fila → Task 10 ✓
  - Sender Bancolombia `an.notificacionesbancolombia.com` → ya está en bancolombia.ts (incluido en Task 2) ✓
  - Borrar tx huérfana → Task 16 ✓

- **Type consistency:** `ParsedItem` definido en `process.ts` extiende `ParsedTransaction` (en `parsers/types.ts`). `CommitInput` extiende `ParsedTransaction` + `gmailMessageId` + `category_id` + `account_id` opcional. El modal envía `ParsedItem` + overrides → cast a `CommitInput`.

- **Risk: ParsedItem y CommitInput pueden duplicar/diverger.** Aceptado — son tipos relacionados pero con propósito distinto (uno es output de parse, otro es input de commit).
