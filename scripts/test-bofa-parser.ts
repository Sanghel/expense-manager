import { parseBofa, isBofaSender } from '../lib/gmail/parsers/bofa'

interface Fixture {
  name: string
  body: string
  expect: { amount: number; merchant: string; matchedRule: string; type: 'income' } | null
}

const fixtures: Fixture[] = [
  {
    name: 'Zelle español — usuario',
    body: `Bank of America.

Yelitza Morela Guillen De Moreno le envió $22.16
Consultar su saldo
Por favor, espere hasta 5 minutos para que el
dinero se deposite en su cuenta.`,
    expect: { amount: 22.16, merchant: 'Yelitza Morela Guillen De Moreno', matchedRule: 'zelle_received', type: 'income' },
  },
  {
    name: 'Zelle con miles',
    body: 'John Smith le envió $1,234.50',
    expect: { amount: 1234.5, merchant: 'John Smith', matchedRule: 'zelle_received', type: 'income' },
  },
  {
    name: 'Zelle inglés',
    body: 'Jane Doe sent you $50.00',
    expect: { amount: 50, merchant: 'Jane Doe', matchedRule: 'zelle_received', type: 'income' },
  },
  {
    name: 'sin match',
    body: 'Your account balance is $0.00',
    expect: null,
  },
]

let failed = 0

// Sender sanity
const senders = [
  'reply-5MLGTFLRUEIEFLTE4MSTXUITA4.50111@ealerts.bankofamerica.com',
  'alerts@bankofamerica.com',
  'noreply@otherbank.com',
]
console.log('Sender detection:')
for (const s of senders) {
  const got = isBofaSender(s)
  const expected = s.includes('bankofamerica.com')
  if (got === expected) console.log(`✅ ${s} → ${got}`)
  else { console.log(`❌ ${s} expected ${expected} got ${got}`); failed++ }
}

console.log('\nBody parsing:')
for (const f of fixtures) {
  const results = parseBofa({ subject: '', bodyText: f.body, bodyHtml: '', receivedAt: new Date('2026-05-20') })
  if (f.expect === null) {
    if (results.length === 0) console.log(`✅ ${f.name}`)
    else { console.log(`❌ ${f.name}: expected empty, got`, results); failed++ }
    continue
  }
  const got = results[0]
  const ok =
    got &&
    got.amount === f.expect.amount &&
    got.merchant === f.expect.merchant &&
    got.matchedRule === f.expect.matchedRule &&
    got.type === f.expect.type &&
    got.currency === 'USD'
  if (ok) console.log(`✅ ${f.name}`)
  else { console.log(`❌ ${f.name}: expected`, f.expect, 'got', got); failed++ }
}

if (failed) {
  console.error(`\n${failed} fallaron`)
  process.exit(1)
}
console.log('\nAll BofA fixtures passed.')
