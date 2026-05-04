'use client'

import { SearchableSelect } from '@/components/ui/SearchableSelect'
import type { Category } from '@/types/database.types'

interface Props {
  value: string
  onChange: (value: string) => void
  categories: Category[]
  filterByType?: 'income' | 'expense'
  required?: boolean
}

export function CategorySelect({ value, onChange, categories, filterByType, required }: Props) {
  const filtered = filterByType ? categories.filter((c) => c.type === filterByType) : categories

  const options = filtered.map((cat) => ({
    value: cat.id,
    label: `${cat.icon} ${cat.name}`,
  }))

  return (
    <SearchableSelect
      label="Categoría"
      value={value}
      onChange={onChange}
      options={options}
      placeholder="Seleccionar categoría..."
      required={required}
    />
  )
}
