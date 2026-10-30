'use client'

import { useState } from 'react'
import { Box, Button, Flex, IconButton } from '@chakra-ui/react'
import { LuCalendar } from 'react-icons/lu'
import { InlineCalendar } from '@/components/ui/InlineCalendar'
import { getLocalDateString } from '@/lib/utils/dates'

/** "Hoy · 24 oct" for today, "📅 24 oct" for any other day. */
export function dayLabel(date: string): string {
  const d = new Date(`${date}T12:00:00`)
  // es-CO formats it as "24 de oct."
  const short = d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }).replace(' de ', ' ').replace('.', '')
  return date === getLocalDateString() ? `Hoy · ${short}` : `📅 ${short}`
}

interface Props {
  /** YYYY-MM-DD */
  value: string
  onChange: (date: string) => void
  disabled?: boolean
  /** Days after today can't be picked (default true, like InlineCalendar). */
  disableFuture?: boolean
  /** Controlled calendar, for layouts that render it elsewhere (full width under a row). */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** false: only the buttons; the parent renders `InlineCalendar` itself. */
  inlineCalendar?: boolean
}

/** Date button + calendar button; the calendar opens inline below (not a popover). */
export function DateField({
  value,
  onChange,
  disabled,
  disableFuture = true,
  open: openProp,
  onOpenChange,
  inlineCalendar = true,
}: Props) {
  const [openState, setOpenState] = useState(false)
  const open = openProp ?? openState
  const setOpen = (next: boolean) => {
    setOpenState(next)
    onOpenChange?.(next)
  }

  return (
    <Box>
      <Flex gap={2}>
        <Button
          flex="1"
          h="44px"
          borderRadius="input"
          bg="surface2"
          color="text"
          fontWeight="500"
          justifyContent="flex-start"
          onClick={() => setOpen(!open)}
          disabled={disabled}
        >
          {dayLabel(value)}
        </Button>
        <IconButton
          aria-label={open ? 'Cerrar calendario' : 'Elegir fecha'}
          aria-expanded={open}
          boxSize="44px"
          borderRadius="input"
          bg={open ? 'brandSoft' : 'surface2'}
          color={open ? 'brand' : 'text2'}
          onClick={() => setOpen(!open)}
          disabled={disabled}
        >
          <LuCalendar />
        </IconButton>
      </Flex>
      {inlineCalendar && open && (
        <Box mt={3}>
          <InlineCalendar
            value={value}
            disableFuture={disableFuture}
            onChange={(date) => {
              onChange(date)
              setOpen(false)
            }}
          />
        </Box>
      )}
    </Box>
  )
}
