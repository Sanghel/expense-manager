'use client'

import {
  HStack,
  Text,
  NativeSelectRoot,
  NativeSelectField,
} from '@chakra-ui/react'
import { useState } from 'react'
import { updatePreferredCurrency } from '@/lib/actions/users.actions'
import { toaster } from '@/lib/toaster'
import type { Currency } from '@/types/database.types'

const CURRENCIES: { value: Currency; label: string }[] = [
  { value: 'COP', label: 'COP — Peso Colombiano' },
  { value: 'USD', label: 'USD — Dólar Americano' },
  { value: 'VES', label: 'VES — Bolívar Venezolano (Bs)' },
]

interface Props {
  userId: string
  current: Currency
}

export function CurrencySelector({ userId, current }: Props) {
  const [value, setValue] = useState<Currency>(current)
  const [loading, setLoading] = useState(false)

  const handleChange = async (newCurrency: Currency) => {
    if (newCurrency === value) return
    setLoading(true)
    setValue(newCurrency)

    const result = await updatePreferredCurrency(userId, newCurrency)

    if (result.success) {
      toaster.create({ title: 'Moneda preferida actualizada', type: 'success', duration: 3000 })
    } else {
      setValue(value)
      toaster.create({ title: 'Error al actualizar', description: result.error, type: 'error', duration: 4000 })
    }
    setLoading(false)
  }

  return (
    <HStack gap={4}>
      <Text fontSize="sm" color="gray.600" minW="32">
        Moneda preferida
      </Text>
      <NativeSelectRoot w="56" disabled={loading}>
        <NativeSelectField
          value={value}
          onChange={(e) => handleChange(e.target.value as Currency)}
        >
          {CURRENCIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </NativeSelectField>
      </NativeSelectRoot>
    </HStack>
  )
}
