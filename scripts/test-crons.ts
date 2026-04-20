/**
 * Script para probar los cron jobs localmente.
 * Requiere que `next dev` esté corriendo en otra terminal.
 *
 * Uso: npm run test:crons
 * Opcional: BASE_URL=https://tu-app.vercel.app npm run test:crons
 */
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000'
const CRON_SECRET = process.env.CRON_SECRET ?? ''

const headers: Record<string, string> = {
  'Content-Type': 'application/json',
}
if (CRON_SECRET) {
  headers['Authorization'] = `Bearer ${CRON_SECRET}`
}

async function testCron(name: string, path: string) {
  console.log(`\n${'─'.repeat(60)}`)
  console.log(`Testing: ${name}`)
  console.log(`URL: ${BASE_URL}${path}`)
  console.log(`Auth: ${CRON_SECRET ? 'Bearer ****' + CRON_SECRET.slice(-4) : '(none)'}`)
  console.log('─'.repeat(60))

  const start = Date.now()
  try {
    const res = await fetch(`${BASE_URL}${path}`, { headers })
    const elapsed = Date.now() - start
    const body = await res.json()

    if (res.ok) {
      console.log(`✅ Status: ${res.status} (${elapsed}ms)`)
      console.log('Response:', JSON.stringify(body, null, 2))
    } else {
      console.error(`❌ Status: ${res.status} (${elapsed}ms)`)
      console.error('Response:', JSON.stringify(body, null, 2))
    }
  } catch (err) {
    const elapsed = Date.now() - start
    console.error(`❌ Network error (${elapsed}ms):`, err)
    console.error('Is `next dev` running on', BASE_URL, '?')
  }
}

async function main() {
  console.log('='.repeat(60))
  console.log('Cron Job Local Test Runner')
  console.log('='.repeat(60))

  if (!CRON_SECRET) {
    console.warn('⚠️  CRON_SECRET not set — running without auth (endpoint will accept if CRON_SECRET not configured)')
  }

  await testCron('update-exchange-rates', '/api/cron/update-exchange-rates')
  await testCron('generate-recurring', '/api/cron/generate-recurring')

  console.log('\n' + '='.repeat(60))
  console.log('Done. Check the terminal running `next dev` for server-side logs.')
  console.log('='.repeat(60))
}

main()
