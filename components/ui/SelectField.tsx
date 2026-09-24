'use client'

import { ComboboxField } from './ComboboxField'

interface Option {
  value: string
  label: string
}

interface Props {
  label: string
  value: string
  onChange: (value: string) => void
  options: Option[]
  required?: boolean
}

/**
 * Labeled dropdown built on the searchable ComboboxField. Reusable across
 * forms (reminder type/frequency, account type, …).
 */
export function SelectField({ label, value, onChange, options, required }: Props) {
  return (
    <ComboboxField
      label={label}
      value={value}
      onChange={onChange}
      options={options}
      required={required}
      clearable={false}
    />
  )
}
