'use client'

import { memo } from 'react'
import { Box, Flex, Text } from '@chakra-ui/react'
import { Card } from '@/components/ui/Card'
import { formatCurrency } from '@/lib/utils/currency'
import type { Account } from '@/types/database.types'

interface Props {
  accounts: Account[]
}

/** COP has no cents in practice; USD/VES keep them. */
const decimalsFor = (currency: string) => (currency === 'COP' ? 0 : 2)

/** Horizontal, scrollable row of account cards with a tinted icon and the balance in mono. */
export const AccountsOverview = memo(function AccountsOverview({ accounts }: Props) {
  if (accounts.length === 0) return null

  return (
    <Card minW={0}>
      <Text textStyle="cardTitle" color="text" mb={4}>
        Cuentas
      </Text>
      <Flex gap={3} overflowX="auto" mx={-1} px={1} pb={1} css={{ scrollbarWidth: 'thin' }}>
        {accounts.map((acc) => (
          <Box key={acc.id} flex="1 0 190px" bg="surface2" borderRadius="tile" p={4} minW={0}>
            <Flex align="center" gap={2.5} mb={3} minW={0}>
              <Flex
                align="center"
                justify="center"
                boxSize="30px"
                borderRadius="10px"
                fontSize="15px"
                flexShrink={0}
                // Account color as a soft tint behind the emoji.
                style={{
                  background: `color-mix(in oklab, ${acc.color ?? 'var(--chakra-colors-brand)'} 22%, transparent)`,
                }}
              >
                {acc.icon ?? '💳'}
              </Flex>
              <Text fontSize="13px" color="text2" truncate>
                {acc.name}
              </Text>
            </Flex>
            <Text
              fontFamily="mono"
              fontSize="17px"
              fontWeight="500"
              color={acc.balance < 0 ? 'neg' : 'text'}
              whiteSpace="nowrap"
            >
              {formatCurrency(acc.balance, acc.currency, decimalsFor(acc.currency))}
            </Text>
          </Box>
        ))}
      </Flex>
    </Card>
  )
})
