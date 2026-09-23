'use client'

import type { ReactNode } from 'react'
import { Badge, Box, Circle, HStack, Text, VStack } from '@chakra-ui/react'
import { ActionIconButton } from '@/components/ui/ActionIconButton'
import { TruncatedText } from '@/components/ui/TruncatedText'
import { formatCurrency } from '@/lib/utils/currency'
import type { Account } from '@/types/database.types'

export const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  bank: 'Banco',
  digital: 'Digital',
  crypto: 'Crypto',
  cash: 'Efectivo',
  card: 'Tarjeta de Crédito',
}

interface Props {
  account: Account
  onEdit: (account: Account) => void
  onDelete: (accountId: string) => void
  /** Extra action under the balance (e.g. "Pagar tarjeta" for credit cards). */
  extraAction?: ReactNode
}

/**
 * Account summary card. Three-zone layout so long names never deform it:
 * fixed 1:1 icon circle · shrinkable truncated text · fixed-width actions.
 */
export function AccountCard({ account, onEdit, onDelete, extraAction }: Props) {
  const isCreditCard = account.type === 'card' && account.credit_limit != null

  return (
    <Box
      borderWidth="1px"
      borderRadius="xl"
      p={4}
      bg="bg.canvas"
      borderColor={account.is_default ? 'brand.500' : 'border.default'}
      _hover={{ borderColor: 'brand.500' }}
      transition="border-color 0.2s"
      minW={0}
    >
      <VStack align="stretch" gap={3}>
        <HStack gap={3} align="start">
          <Circle size="10" flexShrink={0} bg={account.color ?? 'brand.400'} fontSize="lg">
            {account.icon ?? '💳'}
          </Circle>
          <VStack align="start" gap={1} flex="1" minW={0}>
            <TruncatedText fontWeight="semibold" fontSize="sm" color="text.primary" w="full">
              {account.name}
            </TruncatedText>
            <HStack gap={1} flexWrap="wrap">
              <Badge size="sm" variant="outline" colorPalette="gray">
                {ACCOUNT_TYPE_LABELS[account.type] ?? account.type}
              </Badge>
              {account.is_default && (
                <Badge size="sm" colorPalette="purple">Por defecto</Badge>
              )}
            </HStack>
          </VStack>
          <HStack gap={0} flexShrink={0}>
            <ActionIconButton
              kind="edit"
              size="xs"
              label={`Editar cuenta ${account.name}`}
              onClick={() => onEdit(account)}
            />
            <ActionIconButton
              kind="delete"
              size="xs"
              tone="danger"
              label={`Eliminar cuenta ${account.name}`}
              onClick={() => onDelete(account.id)}
            />
          </HStack>
        </HStack>

        {isCreditCard ? (
          <VStack align="stretch" gap={1}>
            <HStack justify="space-between" gap={2}>
              <Text fontSize="xs" color="text.secondary" flexShrink={0}>Cupo disponible</Text>
              <TruncatedText fontWeight="bold" fontSize="md" color="text.primary">
                {formatCurrency(account.balance, account.currency)}
              </TruncatedText>
            </HStack>
            <HStack justify="space-between" gap={2}>
              <Text fontSize="xs" color="text.secondary" flexShrink={0}>Cupo total</Text>
              <TruncatedText fontSize="sm" color="text.secondary">
                {formatCurrency(account.credit_limit ?? 0, account.currency)}
              </TruncatedText>
            </HStack>
          </VStack>
        ) : (
          <TruncatedText fontWeight="bold" fontSize="lg" color="text.primary">
            {formatCurrency(account.balance, account.currency)}
          </TruncatedText>
        )}

        {extraAction}
      </VStack>
    </Box>
  )
}
