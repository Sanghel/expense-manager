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
