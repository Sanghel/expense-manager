'use client'

import { FieldRoot, FieldLabel, Input, Box, IconButton } from '@chakra-ui/react'
import { FiX, FiCalendar } from 'react-icons/fi'
import { useState, useEffect, useRef } from 'react'

function isoToDisplay(iso: string): string {
  if (!iso || iso.length < 10) return ''
  const [year, month, day] = iso.split('-')
  if (!year || !month || !day) return ''
  return `${day}/${month}/${year}`
}

function displayToIso(display: string): string {
  const match = display.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!match) return ''
  const [, day, month, year] = match
  return `${year}-${month}-${day}`
}

function autoFormatDate(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  let result = ''
  if (digits.length > 0) result += digits.substring(0, 2)
  if (digits.length >= 3) result += '/' + digits.substring(2, 4)
  if (digits.length >= 5) result += '/' + digits.substring(4, 8)
  return result
}

interface Props {
  label: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  disabled?: boolean
  optional?: boolean
  showClear?: boolean
}

export function DateInput({ label, value, onChange, required, disabled, optional, showClear = true }: Props) {
  const [displayValue, setDisplayValue] = useState(() => isoToDisplay(value))
  const hiddenDateRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setDisplayValue(isoToDisplay(value))
  }, [value])

  const handleChange = (raw: string) => {
    const formatted = autoFormatDate(raw)
    setDisplayValue(formatted)
    const iso = displayToIso(formatted)
    if (iso) {
      onChange(iso)
    } else if (!formatted) {
      onChange('')
    }
  }

  const handleClear = () => {
    setDisplayValue('')
    onChange('')
  }

  const handlePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const iso = e.target.value
    if (iso) {
      setDisplayValue(isoToDisplay(iso))
      onChange(iso)
    }
  }

  const openPicker = () => {
    const input = hiddenDateRef.current
    if (!input) return
    if (typeof input.showPicker === 'function') {
      input.showPicker()
    } else {
      input.click()
    }
  }

  const showClearBtn = showClear && displayValue && !disabled
  const rightPadding = showClearBtn ? '16' : '10'

  return (
    <FieldRoot required={required} w="full">
      <FieldLabel>
        {label}
        {optional && <span style={{ color: '#B0B0B0', fontSize: '0.85em', marginLeft: '4px' }}>(opcional)</span>}
      </FieldLabel>
      <Box position="relative" w="full">
        <Input
          type="text"
          value={displayValue}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="DD/MM/YYYY"
          disabled={disabled}
          opacity={disabled ? 0.6 : 1}
          cursor={disabled ? 'not-allowed' : undefined}
          pr={rightPadding}
          maxLength={10}
        />
        <input
          ref={hiddenDateRef}
          type="date"
          value={value || ''}
          onChange={handlePickerChange}
          disabled={disabled}
          aria-hidden="true"
          tabIndex={-1}
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            width: 1,
            height: 1,
            opacity: 0,
            pointerEvents: 'none',
          }}
        />
        <IconButton
          aria-label="Abrir calendario"
          variant="ghost"
          size="xs"
          position="absolute"
          right={showClearBtn ? '8' : '1'}
          top="50%"
          transform="translateY(-50%)"
          zIndex={2}
          color="#B0B0B0"
          _hover={{ color: 'white', bg: '#26262f' }}
          onClick={openPicker}
          disabled={disabled}
          minW="auto"
          h="auto"
          p="1"
        >
          <FiCalendar />
        </IconButton>
        {showClearBtn && (
          <IconButton
            aria-label="Limpiar fecha"
            variant="ghost"
            size="xs"
            position="absolute"
            right="1"
            top="50%"
            transform="translateY(-50%)"
            zIndex={2}
            color="#B0B0B0"
            _hover={{ color: 'white', bg: '#26262f' }}
            onClick={handleClear}
            minW="auto"
            h="auto"
            p="1"
          >
            <FiX />
          </IconButton>
        )}
      </Box>
    </FieldRoot>
  )
}
