'use client'

import { useState, useRef, useEffect } from 'react'
import { Box, Input, FieldRoot, FieldLabel, Icon, Flex } from '@chakra-ui/react'
import { FiChevronDown, FiCheck } from 'react-icons/fi'

export interface SelectOption {
  value: string
  label: string
}

interface Props {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  label?: string
  placeholder?: string
  required?: boolean
  optional?: boolean
}

export function SearchableSelect({
  value,
  onChange,
  options,
  label,
  placeholder = 'Seleccionar...',
  required,
  optional,
}: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const selected = options.find((o) => o.value === value)

  const filtered = query
    ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : options

  const open = () => {
    setIsOpen(true)
    setQuery('')
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const close = () => {
    setIsOpen(false)
    setQuery('')
  }

  const select = (val: string) => {
    onChange(val)
    close()
  }

  useEffect(() => {
    if (!isOpen) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [isOpen])

  return (
    <FieldRoot required={required} w="full">
      {label && (
        <FieldLabel>
          {label}
          {optional && (
            <span style={{ color: '#B0B0B0', fontSize: '0.85em', marginLeft: '4px' }}>(opcional)</span>
          )}
        </FieldLabel>
      )}

      <Box ref={containerRef} w="full" position="relative">
        {!isOpen ? (
          <Flex
            as="button"
            onClick={open}
            w="full"
            textAlign="left"
            px={3}
            h="10"
            borderRadius="md"
            borderWidth="1px"
            borderColor="#2d2d35"
            bg="transparent"
            color={selected ? 'white' : '#6B7280'}
            alignItems="center"
            justifyContent="space-between"
            cursor="pointer"
            _hover={{ borderColor: '#4F46E5' }}
            transition="border-color 0.2s"
            fontSize="sm"
          >
            <Box as="span" overflow="hidden" whiteSpace="nowrap" textOverflow="ellipsis" flex={1} textAlign="left">
              {selected ? selected.label : placeholder}
            </Box>
            <Icon as={FiChevronDown} color="#6B7280" flexShrink={0} ml={2} />
          </Flex>
        ) : (
          <Box
            borderWidth="1px"
            borderColor="#4F46E5"
            borderRadius="md"
            overflow="hidden"
            bg="#18181d"
            boxShadow="0 4px 12px rgba(0,0,0,0.4)"
          >
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar..."
              borderRadius={0}
              borderWidth={0}
              borderBottomWidth="1px"
              borderColor="#2d2d35"
              bg="#0f0f13"
              fontSize="sm"
              onKeyDown={(e) => {
                if (e.key === 'Escape') close()
                if (e.key === 'Enter' && filtered.length === 1) select(filtered[0].value)
              }}
            />
            <Box maxH="200px" overflowY="auto">
              {!required && (
                <Flex
                  px={3}
                  py={2}
                  cursor="pointer"
                  fontSize="sm"
                  color="#6B7280"
                  bg={!value ? '#26262f' : 'transparent'}
                  _hover={{ bg: '#26262f' }}
                  onClick={() => select('')}
                  alignItems="center"
                  gap={2}
                >
                  {!value && <Icon as={FiCheck} boxSize={3} color="#4F46E5" />}
                  <Box as="span" flex={1}>{placeholder}</Box>
                </Flex>
              )}
              {filtered.length === 0 ? (
                <Box px={3} py={2} color="#6B7280" fontSize="sm">
                  Sin resultados
                </Box>
              ) : (
                filtered.map((opt) => (
                  <Flex
                    key={opt.value}
                    px={3}
                    py={2}
                    cursor="pointer"
                    fontSize="sm"
                    color={opt.value === value ? 'white' : '#B0B0B0'}
                    bg={opt.value === value ? '#26262f' : 'transparent'}
                    _hover={{ bg: '#26262f', color: 'white' }}
                    onClick={() => select(opt.value)}
                    alignItems="center"
                    gap={2}
                  >
                    {opt.value === value && <Icon as={FiCheck} boxSize={3} color="#4F46E5" flexShrink={0} />}
                    <Box as="span" flex={1} overflow="hidden" whiteSpace="nowrap" textOverflow="ellipsis">
                      {opt.label}
                    </Box>
                  </Flex>
                ))
              )}
            </Box>
          </Box>
        )}
      </Box>
    </FieldRoot>
  )
}
