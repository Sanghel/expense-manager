import { createClient } from '@insforge/sdk'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const url = process.env.NEXT_PUBLIC_INSFORGE_URL
const key = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY

if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_INSFORGE_URL or NEXT_PUBLIC_INSFORGE_ANON_KEY')
  process.exit(1)
}

const insforge = createClient({ baseUrl: url, anonKey: key })

async function testTable(name: string) {
  const { error } = await insforge.database.from(name).select('*').limit(0)

  if (error) {
    console.error(`  ❌ ${name}: ${(error as { message?: string }).message ?? String(error)}`)
    return false
  }

  console.log(`  ✅ ${name}: accessible`)
  return true
}

async function main() {
  console.log('🔍 Testing database tables...\n')

  const tables = [
    'whitelist',
    'users',
    'categories',
    'transactions',
    'budgets',
    'exchange_rates',
  ]

  let allPassed = true
  for (const table of tables) {
    const ok = await testTable(table)
    if (!ok) allPassed = false
  }

  console.log('\n📊 Checking seed data...')

  const { data: whitelist } = await insforge.database.from('whitelist').select('email')
  const wList = whitelist as Array<{ email: string }> | null
  console.log(`  whitelist emails: ${wList?.map((w) => w.email).join(', ') || 'none'}`)

  const { data: categories } = await insforge.database.from('categories').select('*')
  const cats = categories as Array<{ type: string }> | null
  console.log(`  predefined categories: ${cats?.length ?? 0}`)
  if (cats?.length) {
    const incomeCount = cats.filter((c) => c.type === 'income').length
    const expenseCount = cats.filter((c) => c.type === 'expense').length
    console.log(`    - income: ${incomeCount}, expense: ${expenseCount}`)
  }

  console.log(`\n${allPassed ? '✅ All tables accessible' : '❌ Some tables failed'}`)
  process.exit(allPassed ? 0 : 1)
}

main().catch((err) => {
  console.error('Unexpected error:', err)
  process.exit(1)
})
