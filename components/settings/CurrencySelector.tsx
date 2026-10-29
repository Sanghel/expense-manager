'use client'

import { Button, Flex } from '@chakra-ui/react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updatePreferredCurrency } from '@/lib/actions/users.actions'
import { toaster } from '@/lib/toaster'
import type { Currency } from '@/types/database.types'

const CURRENCIES: { value: Currency; label: string }[] = [
  { value: 'COP', label: 'COP' },
  { value: 'USD', label: 'USD' },
  { value: 'VES', label: 'VES' },
]

interface Props {
  userId: string
  current: Currency
}

/** Preferred currency as mono pill chips; saves on click. */
export function CurrencySelector({ userId, current }: Props) {
  const router = useRouter()
  const [value, setValue] = useState<Currency>(current)
  const [loading, setLoading] = useState(false)

  const handleChange = async (next: Currency) => {
    if (next === value || loading) return
    const previous = value
    setLoading(true)
    setValue(next)

    const result = await updatePreferredCurrency(userId, next)
    if (result.success) {
      toaster.create({ title: `Moneda preferida: ${next}`, type: 'success', duration: 2600 })
      router.refresh()
    } else {
      setValue(previous)
      toaster.create({ title: 'Error al actualizar', description: result.error, type: 'error', duration: 4000 })
    }
    setLoading(false)
  }

  return (
    <Flex gap={2} role="radiogroup" aria-label="Moneda preferida">
      {CURRENCIES.map((c) => {
        const active = c.value === value
        return (
          <Button
            key={c.value}
            role="radio"
            aria-checked={active}
            onClick={() => handleChange(c.value)}
            disabled={loading && !active}
            h="36px"
            px={4}
            fontFamily="mono"
            fontSize="13px"
            bg={active ? 'text' : 'transparent'}
            color={active ? 'bg' : 'text2'}
            boxShadow={active ? 'none' : 'inset 0 0 0 1px var(--chakra-colors-line)'}
            _hover={active ? undefined : { bg: 'surface2', color: 'text' }}
          >
            {c.label}
          </Button>
        )
      })}
    </Flex>
  )
}
