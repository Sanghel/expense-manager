'use client'

import { Box, Flex, Input, NativeSelectRoot, NativeSelectField } from '@chakra-ui/react'
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
          <NativeSelectRoot flexShrink={0} w={{ base: '120px', md: '140px' }} size="sm">
            <NativeSelectField
              value={filters.type}
              onChange={(e) => update({ type: e.target.value as FilterState['type'] })}
            >
              <option value="">Tipo</option>
              <option value="income">Ingresos</option>
              <option value="expense">Gastos</option>
            </NativeSelectField>
          </NativeSelectRoot>

          <NativeSelectRoot flexShrink={0} w={{ base: '150px', md: '190px' }} size="sm">
            <NativeSelectField
              value={filters.category_id}
              onChange={(e) => update({ category_id: e.target.value })}
            >
              <option value="">Categoría</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </NativeSelectField>
          </NativeSelectRoot>

          {accounts.length > 0 && (
            <NativeSelectRoot flexShrink={0} w={{ base: '140px', md: '180px' }} size="sm">
              <NativeSelectField
                value={filters.account_id}
                onChange={(e) => update({ account_id: e.target.value })}
              >
                <option value="">Cuenta</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.icon ?? '💳'} {acc.name}
                  </option>
                ))}
              </NativeSelectField>
            </NativeSelectRoot>
          )}

          <NativeSelectRoot flexShrink={0} w={{ base: '130px', md: '180px' }} size="sm">
            <NativeSelectField
              value={filters.month}
              onChange={(e) => update({ month: e.target.value })}
            >
              <option value="">Mes</option>
              {months.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </NativeSelectField>
          </NativeSelectRoot>
        </Flex>
      </Flex>
    </Box>
  )
}
