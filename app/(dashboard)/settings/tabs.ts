import type {
  Account,
  AccountMovementWithAccounts,
  Category,
  CategoryGroupWithMembers,
} from '@/types/database.types'

export type SettingsTab = 'general' | 'accounts' | 'categorias'

export function parseSettingsTab(raw: string | null | undefined): SettingsTab {
  return raw === 'accounts' || raw === 'categorias' ? raw : 'general'
}

export interface CuentasData {
  accounts: Account[]
  movements: AccountMovementWithAccounts[]
}

export interface CategoriasData {
  categories: Category[]
  groups: CategoryGroupWithMembers[]
}
