'use client'

import { ComboboxField } from './ComboboxField'
import type { Category } from '@/types/database.types'

interface Props {
  value: string
  onChange: (value: string) => void
  categories: Category[]
  filterByType?: 'income' | 'expense'
  required?: boolean
}

export function CategorySelect({ value, onChange, categories, filterByType, required }: Props) {
  const filtered = filterByType
    ? categories.filter((c) => c.type === filterByType || c.type === 'both')
    : categories

  return (
    <ComboboxField
      label="Categoría"
      value={value}
      onChange={onChange}
      options={filtered.map((cat) => ({ value: cat.id, label: cat.name, icon: cat.icon }))}
      placeholder="Seleccionar categoría..."
      required={required}
    />
  )
}
