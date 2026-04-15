'use client'

import { HStack, Input, NativeSelectRoot, NativeSelectField } from '@chakra-ui/react'
import type { Category } from '@/types/database.types'

export interface FilterState {
  search: string
  type: '' | 'income' | 'expense'
  category_id: string
  month: string
}

interface Props {
  filters: FilterState
  onChange: (filters: FilterState) => void
  categories: Category[]
}

export function TransactionsFilter({ filters, onChange, categories }: Props) {
  const update = (partial: Partial<FilterState>) =>
    onChange({ ...filters, ...partial })

  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })
    return { value, label }
  })

  return (
    <HStack gap={3} mb={4} flexWrap="wrap">
      <Input
        placeholder="Buscar descripción..."
        maxW="220px"
        value={filters.search}
        onChange={(e) => update({ search: e.target.value })}
      />

      <NativeSelectRoot maxW="160px">
        <NativeSelectField
          value={filters.type}
          onChange={(e) => update({ type: e.target.value as FilterState['type'] })}
        >
          <option value="">Todos los tipos</option>
          <option value="income">Ingresos</option>
          <option value="expense">Gastos</option>
        </NativeSelectField>
      </NativeSelectRoot>

      <NativeSelectRoot maxW="200px">
        <NativeSelectField
          value={filters.category_id}
          onChange={(e) => update({ category_id: e.target.value })}
        >
          <option value="">Todas las categorías</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.icon} {cat.name}
            </option>
          ))}
        </NativeSelectField>
      </NativeSelectRoot>

      <NativeSelectRoot maxW="200px">
        <NativeSelectField
          value={filters.month}
          onChange={(e) => update({ month: e.target.value })}
        >
          <option value="">Todos los meses</option>
          {months.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </NativeSelectField>
      </NativeSelectRoot>
    </HStack>
  )
}
