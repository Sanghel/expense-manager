'use client'

import { ComboboxField } from './ComboboxField'
import type { CategoryGroupWithMembers } from '@/types/database.types'

interface Props {
  value: string
  onChange: (value: string) => void
  groups: CategoryGroupWithMembers[]
  required?: boolean
}

export function CategoryGroupSelect({ value, onChange, groups, required }: Props) {
  return (
    <ComboboxField
      label="Grupo de categorías"
      value={value}
      onChange={onChange}
      options={groups.map((group) => ({
        value: group.id,
        label: `${group.name} (${group.category_ids.length})`,
        icon: group.icon ?? '📦',
      }))}
      placeholder="Seleccionar grupo..."
      required={required}
      helperText={
        groups.length === 0 ? 'Aún no tienes grupos. Créalos en Configuración → Categorías.' : undefined
      }
    />
  )
}
