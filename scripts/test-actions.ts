import { getCategories } from '@/lib/actions/categories.actions'
import { getTransactions } from '@/lib/actions/transactions.actions'
import { getBudgets } from '@/lib/actions/budgets.actions'
import { getLatestRates } from '@/lib/actions/exchangeRates.actions'

async function testActions() {
  console.log('Testing Server Actions...\n')

  const testUserId = 'test-user-id'

  // Test categories
  const categoriesResult = await getCategories(testUserId)
  console.log('Categories:', categoriesResult.success ? '✅' : '❌')
  console.log('Count:', categoriesResult.data?.length ?? 0)

  // Test transactions
  const transactionsResult = await getTransactions(testUserId)
  console.log('\nTransactions:', transactionsResult.success ? '✅' : '❌')
  console.log('Count:', transactionsResult.data?.length ?? 0)

  // Test budgets
  const budgetsResult = await getBudgets(testUserId)
  console.log('\nBudgets:', budgetsResult.success ? '✅' : '❌')
  console.log('Count:', budgetsResult.data?.length ?? 0)

  // Test exchange rates
  const ratesResult = await getLatestRates()
  console.log('\nExchange Rates:', ratesResult.success ? '✅' : '❌')
  console.log('Count:', ratesResult.data?.length ?? 0)

  console.log('\n✅ Actions test complete')
}

testActions()
