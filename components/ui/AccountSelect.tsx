'use client'

import { SearchableSelect } from '@/components/ui/SearchableSelect'
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

  const options = filtered.map((acc) => ({
    value: acc.id,
    label: `${acc.icon ?? '💳'} ${acc.name} (${acc.currency})`,
  }))

  return (
    <SearchableSelect
      label={label}
      value={value}
      onChange={onChange}
      options={options}
      placeholder={placeholder}
      required={required}
      optional={optional}
    />
  )
}
