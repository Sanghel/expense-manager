'use client'

import { Box, chakra } from '@chakra-ui/react'
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

interface Props {
  value: string
  onChange: (color: string) => void
}

export function ColorPicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <Box position="relative" ref={ref}>
      <StyledButton
        type="button"
        onClick={() => setOpen((v) => !v)}
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
          position="absolute"
          top="calc(100% + 4px)"
          right={0}
          zIndex={50}
          bg="#1a1a23"
          borderRadius="lg"
          border="1px solid"
          borderColor="#2d2d35"
          boxShadow="lg"
          p={3}
          w="50"
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
          </Box>
        </Box>
      )}
    </Box>
  )
}
