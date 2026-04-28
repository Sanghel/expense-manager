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

const PICKER_WIDTH = 200

interface Props {
  value: string
  onChange: (color: string) => void
}

export function ColorPicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const wrapperRef = useRef<HTMLDivElement>(null)
  const pickerRef = useRef<HTMLDivElement>(null)

  const handleToggle = () => {
    if (!open && wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect()
      const left = Math.min(rect.right - PICKER_WIDTH, window.innerWidth - PICKER_WIDTH - 8)
      setPos({ top: rect.bottom + 4, left: Math.max(left, 8) })
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
          </Box>
        </Box>
      )}
    </Box>
  )
}
