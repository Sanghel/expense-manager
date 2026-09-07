'use client'

import { FieldRoot, FieldLabel, FieldHelperText, NativeSelectRoot, NativeSelectField } from '@chakra-ui/react'
import type { CategoryGroupWithMembers } from '@/types/database.types'

interface Props {
  value: string
  onChange: (value: string) => void
  groups: CategoryGroupWithMembers[]
  required?: boolean
}

export function CategoryGroupSelect({ value, onChange, groups, required }: Props) {
  return (
    <FieldRoot required={required} w="full">
      <FieldLabel>Grupo de categorías</FieldLabel>
      <NativeSelectRoot>
        <NativeSelectField value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="">Seleccionar grupo...</option>
          {groups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.icon ?? '📦'} {group.name} ({group.category_ids.length})
            </option>
          ))}
        </NativeSelectField>
      </NativeSelectRoot>
      {groups.length === 0 && (
        <FieldHelperText>
          Aún no tienes grupos. Créalos en Configuración → Categorías.
        </FieldHelperText>
      )}
    </FieldRoot>
  )
}
