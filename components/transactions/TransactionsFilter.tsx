'use client'

import { Box, Flex, Input } from '@chakra-ui/react'
import { ComboboxField } from '@/components/ui/ComboboxField'
import type { Account, Category } from '@/types/database.types'

export interface FilterState {
  search: string
  type: '' | 'income' | 'expense'
  category_id: string
  account_id: string
  month: string
}

interface Props {
  filters: FilterState
  onChange: (filters: FilterState) => void
  categories: Category[]
  accounts?: Account[]
}

export function TransactionsFilter({ filters, onChange, categories, accounts = [] }: Props) {
  const update = (partial: Partial<FilterState>) =>
    onChange({ ...filters, ...partial })

  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('es-CO', { month: 'short', year: '2-digit' })
    return { value, label }
  })

  return (
    <Box mb={3}>
      {/* Stacked on mobile, single row on desktop (description + selects) */}
      <Flex direction={{ base: 'column', md: 'row' }} gap={2} align={{ md: 'center' }}>
        {/* Search: full width on mobile, constrained on desktop */}
        <Input
          placeholder="Buscar descripción..."
          w={{ base: '100%', md: '320px' }}
          flexShrink={0}
          value={filters.search}
          onChange={(e) => update({ search: e.target.value })}
          size="sm"
        />

        {/* Filters: horizontal scroll on mobile */}
        <Flex gap={2} overflowX="auto" pb={1} css={{ '&::-webkit-scrollbar': { display: 'none' } }}>
          <Box flexShrink={0} w={{ base: '130px', md: '140px' }}>
            <ComboboxField
              label="Tipo"
              hideLabel
              placeholder="Tipo"
              size="sm"
              value={filters.type}
              onChange={(v) => update({ type: v as FilterState['type'] })}
              options={[
                { value: 'income', label: 'Ingresos' },
                { value: 'expense', label: 'Gastos' },
              ]}
            />
          </Box>

          <Box flexShrink={0} w={{ base: '170px', md: '200px' }}>
            <ComboboxField
              label="Categoría"
              hideLabel
              placeholder="Categoría"
              size="sm"
              value={filters.category_id}
              onChange={(v) => update({ category_id: v })}
              options={categories.map((cat) => ({ value: cat.id, label: cat.name, icon: cat.icon }))}
            />
          </Box>

          {accounts.length > 0 && (
            <Box flexShrink={0} w={{ base: '160px', md: '190px' }}>
              <ComboboxField
                label="Cuenta"
                hideLabel
                placeholder="Cuenta"
                size="sm"
                value={filters.account_id}
                onChange={(v) => update({ account_id: v })}
                options={accounts.map((acc) => ({ value: acc.id, label: acc.name, icon: acc.icon ?? '💳' }))}
              />
            </Box>
          )}

          <Box flexShrink={0} w={{ base: '140px', md: '180px' }}>
            <ComboboxField
              label="Mes"
              hideLabel
              placeholder="Mes"
              size="sm"
              value={filters.month}
              onChange={(v) => update({ month: v })}
              options={months}
            />
          </Box>
        </Flex>
      </Flex>
    </Box>
  )
}
