import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const url = process.env.NEXT_PUBLIC_INSFORGE_URL
const key = process.env.INSFORGE_API_KEY

if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_INSFORGE_URL or INSFORGE_API_KEY')
  process.exit(1)
}

const insforge = createClient(url, key, { auth: { persistSession: false } })

async function testTable(name: string) {
  const { error, count } = await insforge
    .from(name)
    .select('*', { count: 'exact', head: true })

  if (error) {
    console.error(`  ❌ ${name}: ${error.message}`)
    return false
  }

  console.log(`  ✅ ${name}: accessible (${count ?? 0} rows)`)
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

  const { data: whitelist } = await insforge.from('whitelist').select('email')
  console.log(
    `  whitelist emails: ${whitelist?.map((w) => w.email).join(', ') || 'none'}`
  )

  const { data: categories, count: catCount } = await insforge
    .from('categories')
    .select('*', { count: 'exact' })
  console.log(`  predefined categories: ${catCount ?? 0}`)
  if (categories?.length) {
    const incomeCount = categories.filter((c) => c.type === 'income').length
    const expenseCount = categories.filter((c) => c.type === 'expense').length
    console.log(`    - income: ${incomeCount}, expense: ${expenseCount}`)
  }

  console.log(`\n${allPassed ? '✅ All tables accessible' : '❌ Some tables failed'}`)
  process.exit(allPassed ? 0 : 1)
}

main().catch((err) => {
  console.error('Unexpected error:', err)
  process.exit(1)
})
