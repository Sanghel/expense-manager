'use client'

import { NativeSelectField, NativeSelectRoot } from '@chakra-ui/react'

interface Props {
  value: string
  onChange: (month: string) => void
}

export function MonthSelector({ value, onChange }: Props) {
  const months: { value: string; label: string }[] = []
  const now = new Date()

  // Últimos 12 meses
  for (let i = 0; i < 12; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthStr = date.toISOString().slice(0, 7)
    const label = date.toLocaleDateString('es', {
      year: 'numeric',
      month: 'long',
    })
    months.push({ value: monthStr, label })
  }

  return (
    <NativeSelectRoot maxW="250px">
      <NativeSelectField
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {months.map((month) => (
          <option key={month.value} value={month.value}>
            {month.label}
          </option>
        ))}
      </NativeSelectField>
    </NativeSelectRoot>
  )
}
