'use client'

import { Box, Text, chakra } from '@chakra-ui/react'
import { useState, useRef, useEffect } from 'react'

const StyledButton = chakra('button')

const COLORS = [
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#14b8a6',
  '#3b82f6',
  '#6366f1',
  '#8b5cf6',
  '#ec4899',
  '#f43f5e',
  '#64748b',
  '#78716c',
  '#84cc16',
  '#06b6d4',
  '#a855f7',
]

const PICKER_WIDTH = 200
const PICKER_HEIGHT = 180

interface Props {
  value: string
  onChange: (color: string) => void
}

export function ColorPicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const wrapperRef = useRef<HTMLDivElement>(null)
  const pickerRef = useRef<HTMLDivElement>(null)
  const nativeColorRef = useRef<HTMLInputElement>(null)

  const isCustom = value !== '' && !COLORS.includes(value)

  const handleToggle = () => {
    if (!open && wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect()
      const left = Math.min(rect.right - PICKER_WIDTH, window.innerWidth - PICKER_WIDTH - 8)
      const spaceBelow = window.innerHeight - rect.bottom
      const top = spaceBelow >= PICKER_HEIGHT + 8
        ? rect.bottom + 4
        : rect.top - PICKER_HEIGHT - 4
      setPos({ top, left: Math.max(left, 8) })
    }
    setOpen((v) => !v)
  }

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      const target = e.target as Element
      if (
        pickerRef.current?.contains(target) ||
        wrapperRef.current?.contains(target)
      ) return
      setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const openNativePicker = () => {
    const input = nativeColorRef.current
    if (!input) return
    if (typeof input.showPicker === 'function') {
      input.showPicker()
    } else {
      input.click()
    }
  }

  return (
    <Box ref={wrapperRef} display="inline-block" position="relative">
      <StyledButton
        type="button"
        onClick={handleToggle}
        w="9"
        h="9"
        borderRadius="md"
        bg={value}
        border="2px solid"
        borderColor={open ? '#4F46E5' : '#3a3a42'}
        cursor="pointer"
        _hover={{ borderColor: '#4F46E5' }}
        transition="border-color 0.15s"
      />

      {open && (
        <Box
          ref={pickerRef}
          position="fixed"
          top={`${pos.top}px`}
          left={`${pos.left}px`}
          zIndex={10000}
          bg="#1a1a23"
          borderRadius="lg"
          border="1px solid"
          borderColor="#2d2d35"
          boxShadow="0 4px 24px rgba(0,0,0,0.6)"
          p={3}
          w={`${PICKER_WIDTH}px`}
        >
          <Box display="grid" gridTemplateColumns="repeat(5, 1fr)" gap={2}>
            {COLORS.map((color) => (
              <StyledButton
                key={color}
                type="button"
                onClick={() => {
                  onChange(color)
                  setOpen(false)
                }}
                w="7"
                h="7"
                borderRadius="md"
                bg={color}
                border="2px solid"
                borderColor={value === color ? 'white' : 'transparent'}
                cursor="pointer"
                _hover={{ transform: 'scale(1.15)' }}
                transition="transform 0.1s"
              />
            ))}
            <StyledButton
              type="button"
              onClick={openNativePicker}
              w="7"
              h="7"
              borderRadius="md"
              bg={isCustom ? value : 'transparent'}
              border="2px dashed"
              borderColor={isCustom ? 'white' : '#4F46E5'}
              color="white"
              fontSize="md"
              cursor="pointer"
              _hover={{ transform: 'scale(1.15)' }}
              transition="transform 0.1s"
              display="flex"
              alignItems="center"
              justifyContent="center"
              title="Color personalizado"
            >
              🎨
            </StyledButton>
          </Box>
          <Text fontSize="xs" color="#B0B0B0" textAlign="center" mt={2}>
            {value.toUpperCase()}
          </Text>
          <input
            ref={nativeColorRef}
            type="color"
            value={value || '#000000'}
            onChange={(e) => onChange(e.target.value)}
            aria-hidden="true"
            tabIndex={-1}
            style={{
              position: 'absolute',
              opacity: 0,
              width: 1,
              height: 1,
              pointerEvents: 'none',
            }}
          />
        </Box>
      )}
    </Box>
  )
}
