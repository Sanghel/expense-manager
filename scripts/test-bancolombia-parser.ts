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
    merchant?: string
    date?: string
  }
  receivedAt?: string
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
  {
    name: 'transferencia Bre-b por llave (nombre del destinatario)',
    subject: 'Alertas y Notificaciones',
    body: 'Bancolombia: SANGHEL, transferiste $20,000.00 a la llave 88264184 desde tu cuenta *8645 a JESUS ALIRIO IBARRA CASADIEGOS el 13/10/26 a las 19:06. Con Bre-b es de una y gratis.',
    expect: {
      type: 'expense',
      amount: 20000,
      lastFour: '8645',
      matchedRule: 'transferencia_breb',
      merchant: 'JESUS ALIRIO IBARRA CASADIEGOS',
      date: '2026-10-13',
    },
    receivedAt: '2026-10-14T00:06:15Z',
  },
  {
    name: 'fecha del correo (año de 2 dígitos) aunque llegue el día siguiente en UTC',
    subject: 'Alertas y Notificaciones',
    body: 'Bancolombia: Transferiste $30000.00 desde tu cuenta *8645 a la cuenta *3114526162 el 13/10/26 a las 21:03.',
    expect: { type: 'expense', amount: 30000, lastFour: '8645', matchedRule: 'transferencia_a_cuenta', date: '2026-10-13' },
    receivedAt: '2026-10-14T02:03:49Z',
  },
  {
    name: 'fecha del correo (año de 4 dígitos)',
    subject: 'Alertas y Notificaciones',
    body: 'Bancolombia: Compraste $40.000,00 en BOLD SA*ANDRES G con tu T.Deb *2499, el 13/10/2026 a las 18:48.',
    expect: { type: 'expense', amount: 40000, lastFour: '2499', matchedRule: 'compra_tarjeta_v2', date: '2026-10-13' },
    receivedAt: '2026-10-13T23:48:12Z',
  },
  {
    name: 'sin fecha en el texto: recepción en hora de Colombia',
    subject: 'Compra',
    body: 'Compra por $25.000 en TIENDA OXXO.',
    expect: { type: 'expense', amount: 25000, lastFour: null, matchedRule: 'compra_tarjeta', date: '2026-10-13' },
    receivedAt: '2026-10-14T02:30:00Z',
  },
]

let passed = 0
let failed = 0

for (const f of fixtures) {
  const results = parseBancolombia({
    subject: f.subject,
    bodyText: f.body,
    bodyHtml: '',
    receivedAt: new Date(f.receivedAt ?? '2026-05-21T12:00:00Z'),
  })
  const result = results[0] ?? null

  const ok =
    result !== null &&
    result.type === f.expect.type &&
    result.amount === f.expect.amount &&
    result.lastFour === f.expect.lastFour &&
    result.matchedRule === f.expect.matchedRule &&
    (f.expect.merchant === undefined || result.merchant === f.expect.merchant) &&
    (f.expect.date === undefined || result.date === f.expect.date)

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
