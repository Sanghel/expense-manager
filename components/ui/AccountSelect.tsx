'use client'

import { FieldRoot, FieldLabel, NativeSelectRoot, NativeSelectField } from '@chakra-ui/react'
import type { Account } from '@/types/database.types'

interface Props {
  value: string
  onChange: (value: string) => void
  accounts: Account[]
  label?: string
  optional?: boolean
  required?: boolean
  placeholder?: string
  excludeId?: string
}

export function AccountSelect({
  value,
  onChange,
  accounts,
  label = 'Cuenta',
  optional,
  required,
  placeholder = 'Sin cuenta',
  excludeId,
}: Props) {
  const filtered = excludeId ? accounts.filter((a) => a.id !== excludeId) : accounts

  return (
    <FieldRoot required={required} w="full">
      <FieldLabel>
        {label}
        {optional && <span style={{ color: '#B0B0B0', fontSize: '0.85em', marginLeft: '4px' }}>(opcional)</span>}
      </FieldLabel>
      <NativeSelectRoot>
        <NativeSelectField value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="">{placeholder}</option>
          {filtered.map((acc) => (
            <option key={acc.id} value={acc.id}>
              {acc.icon ?? '💳'} {acc.name} ({acc.currency})
            </option>
          ))}
        </NativeSelectField>
      </NativeSelectRoot>
    </FieldRoot>
  )
}
