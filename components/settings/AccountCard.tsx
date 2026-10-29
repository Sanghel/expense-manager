'use client'

import type { ReactNode } from 'react'
import { Box, Flex, HStack, Text, VStack } from '@chakra-ui/react'
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

  const decimals = account.currency === 'COP' ? 0 : 2

  return (
    <Box
      bg="surface"
      borderRadius="card"
      p={5}
      minW={0}
      // The default account is outlined in brand.
      boxShadow={account.is_default ? 'inset 0 0 0 1.5px var(--chakra-colors-brand)' : 'none'}
    >
      <VStack align="stretch" gap={4}>
        <HStack gap={3} align="center">
          <Flex
            align="center"
            justify="center"
            boxSize="36px"
            borderRadius="11px"
            flexShrink={0}
            fontSize="17px"
            style={{
              background: `color-mix(in oklab, ${account.color ?? 'var(--chakra-colors-brand)'} 22%, transparent)`,
            }}
          >
            {account.icon ?? '💳'}
          </Flex>
          <VStack align="start" gap={0} flex="1" minW={0}>
            <TruncatedText fontWeight="600" fontSize="14px" color="text" w="full">
              {account.name}
            </TruncatedText>
            <Text fontSize="12px" color="text3">
              {ACCOUNT_TYPE_LABELS[account.type] ?? account.type} · {account.currency}
              {account.is_default && (
                <Text as="span" color="brand">
                  {' '}· Por defecto
                </Text>
              )}
            </Text>
          </VStack>
          <HStack gap={0} flexShrink={0}>
            <ActionIconButton kind="edit" size="xs" variant="ghost" label={`Editar cuenta ${account.name}`} onClick={() => onEdit(account)} />
            <ActionIconButton kind="delete" size="xs" variant="ghost" tone="danger" label={`Eliminar cuenta ${account.name}`} onClick={() => onDelete(account.id)} />
          </HStack>
        </HStack>

        {isCreditCard ? (
          <VStack align="stretch" gap={1}>
            <HStack justify="space-between" gap={2}>
              <Text fontSize="12px" color="text3" flexShrink={0}>Cupo disponible</Text>
              <TruncatedText fontFamily="mono" fontWeight="500" fontSize="18px" color="text">
                {formatCurrency(account.balance, account.currency, decimals)}
              </TruncatedText>
            </HStack>
            <HStack justify="space-between" gap={2}>
              <Text fontSize="12px" color="text3" flexShrink={0}>Cupo total</Text>
              <TruncatedText fontFamily="mono" fontSize="13px" color="text2">
                {formatCurrency(account.credit_limit ?? 0, account.currency, decimals)}
              </TruncatedText>
            </HStack>
          </VStack>
        ) : (
          <TruncatedText fontFamily="mono" fontWeight="500" fontSize="22px" color={account.balance < 0 ? 'neg' : 'text'}>
            {formatCurrency(account.balance, account.currency, decimals)}
          </TruncatedText>
        )}

        {extraAction}
      </VStack>
    </Box>
  )
}
