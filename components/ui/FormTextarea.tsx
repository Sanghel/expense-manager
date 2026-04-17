'use client'

import { FieldRoot, FieldLabel, Textarea } from '@chakra-ui/react'

interface Props {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
}

export function FormTextarea({ label, value, onChange, placeholder, required }: Props) {
  return (
    <FieldRoot required={required}>
      <FieldLabel>{label}</FieldLabel>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </FieldRoot>
  )
}
