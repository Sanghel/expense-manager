'use client'

import { Box, Input, SimpleGrid, Text, chakra } from '@chakra-ui/react'
import { useState, useRef, useEffect, useCallback } from 'react'

const StyledButton = chakra('button')

const ICONS = [
  '🍔', '🍕', '🍜', '🍣', '☕', '🛒', '🏠', '🚗', '✈️', '🚌',
  '💊', '🏋️', '🎮', '🎬', '📚', '👗', '👟', '💄', '🐾', '🎁',
  '💼', '💻', '📱', '🔧', '⚡', '💡', '🌊', '🌿', '🏖️', '🎵',
  '💰', '💳', '🏦', '📈', '💸', '🎓', '🏥', '🏋', '🛍️', '🍷',
  '🧾', '🔑', '🏡', '🚿', '🧹', '📦', '🧺', '🎨', '✂️', '🖥️',
]

const PICKER_WIDTH = 288

interface Props {
  value: string
  onChange: (icon: string) => void
}

export function IconPicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const wrapperRef = useRef<HTMLDivElement>(null)
  const pickerRef = useRef<HTMLDivElement>(null)

  const filtered = ICONS.filter((i) => i.includes(search) || search === '')

  const handleToggle = () => {
    if (!open && wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect()
      const left = Math.min(rect.left, window.innerWidth - PICKER_WIDTH - 12)
      setPos({ top: rect.bottom + 4, left: Math.max(left, 8) })
    }
    setOpen((v) => !v)
  }

  const handleSelectIcon = useCallback((icon: string) => {
    onChange(icon)
    setOpen(false)
    setSearch('')
  }, [onChange])

  useEffect(() => {
    if (!open) return

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element
      if (
        pickerRef.current?.contains(target) ||
        wrapperRef.current?.contains(target)
      ) {
        return
      }
      setOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <Box ref={wrapperRef} display="inline-block" position="relative">
      <StyledButton
        type="button"
        onClick={handleToggle}
        px={3}
        py={2}
        borderRadius="md"
        border="1px solid"
        borderColor={open ? 'brand.500' : '#2d2d35'}
        bg="#18181d"
        color="white"
        fontSize="xl"
        cursor="pointer"
        minW="10"
        _hover={{ borderColor: '#3a3a42' }}
        transition="border-color 0.15s"
      >
        {value || '🏷️'}
      </StyledButton>

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
          <Input
            size="sm"
            placeholder="Buscar emoji..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            mb={2}
            bg="#18181d"
            borderColor="#2d2d35"
            color="white"
          />
          <SimpleGrid columns={8} gap={1} maxH="200px" overflowY="auto">
            {filtered.map((icon) => (
              <StyledButton
                key={icon}
                type="button"
                onClick={() => handleSelectIcon(icon)}
                p={1}
                borderRadius="md"
                fontSize="xl"
                cursor="pointer"
                bg={value === icon ? '#4F46E5' : 'transparent'}
                _hover={{ bg: '#2d2d35' }}
                textAlign="center"
              >
                <Text pointerEvents="none">{icon}</Text>
              </StyledButton>
            ))}
          </SimpleGrid>
        </Box>
      )}
    </Box>
  )
}
