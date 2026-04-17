'use client'

import { FieldRoot, FieldLabel, NativeSelectRoot, NativeSelectField } from '@chakra-ui/react'
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

  return (
    <FieldRoot required={required}>
      <FieldLabel>Categoría</FieldLabel>
      <NativeSelectRoot>
        <NativeSelectField
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">Seleccionar...</option>
          {filtered.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.icon} {cat.name}
            </option>
          ))}
        </NativeSelectField>
      </NativeSelectRoot>
    </FieldRoot>
  )
}
