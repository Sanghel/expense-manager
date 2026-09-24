'use client'

import { ComboboxField } from './ComboboxField'
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
    <ComboboxField
      label={label}
      value={value}
      onChange={onChange}
      options={filtered.map((acc) => ({
        value: acc.id,
        label: `${acc.name} (${acc.currency})`,
        icon: acc.icon ?? '💳',
      }))}
      placeholder={placeholder}
      optional={optional}
      required={required}
    />
  )
}
