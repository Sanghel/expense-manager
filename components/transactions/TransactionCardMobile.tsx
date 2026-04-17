'use client'

import { Box, Flex, Text, HStack, IconButton } from '@chakra-ui/react'
import { FiEdit2, FiTrash2 } from 'react-icons/fi'
import { formatCurrency } from '@/lib/utils/currency'
import type { TransactionWithCategory } from '@/types/database.types'

interface Props {
  transaction: TransactionWithCategory
  onEdit: (t: TransactionWithCategory) => void
  onDelete: (id: string) => void
}

export function TransactionCardMobile({ transaction: t, onEdit, onDelete }: Props) {
  const isIncome = t.type === 'income'
  const amountColor = isIncome ? '#4ade80' : '#f87171'
  const amountPrefix = isIncome ? '+' : '-'

  return (
    <Box
      borderWidth="1px"
      borderColor="#2d2d35"
      borderRadius="xl"
      p={3}
      bg="#18181d"
      _active={{ bg: '#1e1e26' }}
    >
      <Flex justify="space-between" align="flex-start" gap={2}>
        <Flex flex={1} direction="column" gap="2px" minW={0}>
          <Text fontWeight="600" fontSize="sm" color="white" lineClamp={1}>
            {t.description}
          </Text>
          <HStack gap={2} flexWrap="wrap">
            <Text fontSize="xs" color="#6b7280">
              {t.category.icon} {t.category.name}
            </Text>
            <Text fontSize="xs" color="#4b5563">·</Text>
            <Text fontSize="xs" color="#6b7280">
              {new Date(t.date + 'T00:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
            </Text>
          </HStack>
        </Flex>

        <Flex direction="column" align="flex-end" gap={1} flexShrink={0}>
          <Text fontWeight="700" fontSize="sm" color={amountColor}>
            {amountPrefix}{formatCurrency(Number(t.amount), t.currency)}
          </Text>
          <HStack gap={0}>
            <IconButton
              aria-label="Editar"
              size="xs"
              variant="ghost"
              color="#6b7280"
              onClick={() => onEdit(t)}
            >
              <FiEdit2 />
            </IconButton>
            <IconButton
              aria-label="Eliminar"
              size="xs"
              variant="ghost"
              color="#ef4444"
              onClick={() => onDelete(t.id)}
            >
              <FiTrash2 />
            </IconButton>
          </HStack>
        </Flex>
      </Flex>
    </Box>
  )
}
