import { parseBancolombia } from '../lib/gmail/parsers/bancolombia'

interface Fixture {
  name: string
  subject: string
  body: string
  expect: {
    type: 'income' | 'expense'
    amount: number
    lastFour: string | null
    matchedRule: string
  }
}

const fixtures: Fixture[] = [
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
  {
    name: 'compra con tarjeta de crédito',
    subject: 'Bancolombia: Notificación de compra',
    body: 'Bancolombia te informa Compra por $185.000 en EXITO BOGOTA. T.Cred *1234.',
    expect: { type: 'expense', amount: 185000, lastFour: '1234', matchedRule: 'compra_tarjeta' },
  },
  {
    name: 'compra con débito',
    subject: 'Compra realizada',
    body: 'Compraste por $45.500 con tarjeta de débito en RAPPI. T.Deb *5678 el 21/05/2026.',
    expect: { type: 'expense', amount: 45500, lastFour: '5678', matchedRule: 'compra_tarjeta' },
  },
  {
    name: 'transferencia enviada',
    subject: 'Transferencia exitosa',
    body: 'Transferiste $1.250.000 a JUAN PEREZ desde tu cuenta *9876.',
    expect: { type: 'expense', amount: 1250000, lastFour: '9876', matchedRule: 'transferencia_enviada' },
  },
  {
    name: 'pago de servicio',
    subject: 'Pago PSE',
    body: 'Realizaste un pago por $320.000 a CLARO COLOMBIA desde cuenta 4321.',
    expect: { type: 'expense', amount: 320000, lastFour: '4321', matchedRule: 'pago_servicio' },
  },
  {
    name: 'transferencia recibida',
    subject: 'Notificación de ingreso',
    body: 'Recibiste una transferencia por $500.000 de MARIA GOMEZ en cuenta 1111.',
    expect: { type: 'income', amount: 500000, lastFour: '1111', matchedRule: 'recepcion' },
  },
  {
    name: 'compra sin last four (baja confianza)',
    subject: 'Compra',
    body: 'Compra por $25.000 en TIENDA OXXO.',
    expect: { type: 'expense', amount: 25000, lastFour: null, matchedRule: 'compra_tarjeta' },
  },
]

let passed = 0
let failed = 0

for (const f of fixtures) {
  const results = parseBancolombia({
    subject: f.subject,
    bodyText: f.body,
    bodyHtml: '',
    receivedAt: new Date('2026-05-21T12:00:00Z'),
  })
  const result = results[0] ?? null

  const ok =
    result !== null &&
    result.type === f.expect.type &&
    result.amount === f.expect.amount &&
    result.lastFour === f.expect.lastFour &&
    result.matchedRule === f.expect.matchedRule

  if (ok) {
    passed++
    console.log(`  ✅ ${f.name}`)
  } else {
    failed++
    console.error(`  ❌ ${f.name}`)
    console.error('     expected', f.expect)
    console.error('     got     ', result)
  }
}

console.log(`\n${passed}/${fixtures.length} fixtures passed`)
if (failed > 0) process.exit(1)
