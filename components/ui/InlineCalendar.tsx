'use client'

import { useState } from 'react'
import { Box, Button, Flex, Grid, IconButton, Text } from '@chakra-ui/react'
import { LuChevronLeft, LuChevronRight } from 'react-icons/lu'
import { getLocalDateString } from '@/lib/utils/dates'

const WEEKDAYS = ['D', 'L', 'M', 'M', 'J', 'V', 'S']

interface Props {
  /** Selected day, YYYY-MM-DD. */
  value: string
  onChange: (date: string) => void
  /** Days after today can't be picked (default true). */
  disableFuture?: boolean
}

const pad = (n: number) => String(n).padStart(2, '0')
const toIso = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`

/**
 * Month grid that renders in place (not floating), Pulso style: mono day
 * circles, selected in brandSolid, today with a brand ring, future dimmed.
 */
export function InlineCalendar({ value, onChange, disableFuture = true }: Props) {
  const today = getLocalDateString()
  const [year, month] = (value || today).split('-').map(Number)
  const [view, setView] = useState({ year, month: month - 1 })

  const first = new Date(view.year, view.month, 1)
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate()
  const monthYear = first.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })
  const title = monthYear.charAt(0).toUpperCase() + monthYear.slice(1)
  const isCurrentMonth = toIso(view.year, view.month, 1) === `${today.slice(0, 7)}-01`

  const shift = (delta: number) =>
    setView(({ year: y, month: m }) => {
      const d = new Date(y, m + delta, 1)
      return { year: d.getFullYear(), month: d.getMonth() }
    })

  return (
    <Box bg="surface2" borderRadius="18px" p={4}>
      <Flex align="center" justify="space-between" mb={3}>
        <IconButton aria-label="Mes anterior" size="xs" variant="ghost" color="text2" onClick={() => shift(-1)}>
          <LuChevronLeft />
        </IconButton>
        <Text fontSize="14px" fontWeight="600" color="text">
          {title}
        </Text>
        <IconButton
          aria-label="Mes siguiente"
          size="xs"
          variant="ghost"
          color="text2"
          onClick={() => shift(1)}
          disabled={disableFuture && isCurrentMonth}
        >
          <LuChevronRight />
        </IconButton>
      </Flex>

      <Grid templateColumns="repeat(7, 1fr)" gap={1} textAlign="center">
        {WEEKDAYS.map((d, i) => (
          <Text key={i} fontFamily="mono" fontSize="11px" color="text3" py={1}>
            {d}
          </Text>
        ))}
        {Array.from({ length: first.getDay() }, (_, i) => (
          <Box key={`pad-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const iso = toIso(view.year, view.month, i + 1)
          const selected = iso === value
          const isToday = iso === today
          const disabled = disableFuture && iso > today
          return (
            <Flex key={iso} justify="center">
              <Button
                onClick={() => onChange(iso)}
                disabled={disabled}
                aria-label={iso}
                aria-pressed={selected}
                boxSize="32px"
                minW="32px"
                p={0}
                fontFamily="mono"
                fontSize="12px"
                fontWeight={selected ? '600' : '400'}
                bg={selected ? 'brandSolid' : 'transparent'}
                color={selected ? 'white' : 'text'}
                boxShadow={isToday && !selected ? 'inset 0 0 0 1.5px var(--chakra-colors-brand)' : 'none'}
                _hover={{ bg: selected ? 'brandSolid' : 'line' }}
                _disabled={{ opacity: 0.35, cursor: 'not-allowed' }}
              >
                {i + 1}
              </Button>
            </Flex>
          )
        })}
      </Grid>
    </Box>
  )
}
