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
