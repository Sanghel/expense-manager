import { cache } from 'react'
import { getCategories } from '@/lib/actions/categories.actions'
import { getAccounts } from '@/lib/actions/accounts.actions'

/**
 * Per-request memoized reads for data that both the dashboard layout and the
 * pages need. Server components only; client code keeps calling the actions.
 */
export const getCategoriesCached = cache(getCategories)
export const getAccountsCached = cache(getAccounts)
