'use client'

import { memo } from 'react'
import { Box, Heading, SimpleGrid, VStack, Text, HStack } from '@chakra-ui/react'
import { Card } from '@/components/ui/Card'
import { formatCurrency } from '@/lib/utils/currency'
import type { Account } from '@/types/database.types'

interface Props {
  accounts: Account[]
  /**
   * `compact` fits more accounts per row with tighter chrome — used where the
   * accounts are context for something else rather than the main content.
   */
  variant?: 'default' | 'compact'
}

export const AccountsOverview = memo(function AccountsOverview({
  accounts,
  variant = 'default',
}: Props) {
  if (accounts.length === 0) return null

  const compact = variant === 'compact'

  return (
    <Card p={compact ? { base: 3, md: 4 } : undefined}>
      <Heading size={compact ? 'sm' : 'md'} mb={compact ? 3 : 4}>
        Mis Cuentas
      </Heading>
      <SimpleGrid minChildWidth={compact ? '132px' : '160px'} gap={compact ? 2 : 3}>
        {accounts.map((acc) => (
          <Box
            key={acc.id}
            borderWidth="1px"
            borderRadius={compact ? 'lg' : 'xl'}
            p={compact ? 2 : 3}
            bg="#1a1a23"
            borderColor="#2d2d35"
          >
            {compact ? (
              <HStack gap={2} align="center">
                <Box
                  w="6"
                  h="6"
                  borderRadius="full"
                  bg={acc.color ?? '#6366f1'}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  fontSize="xs"
                  flexShrink={0}
                >
                  {acc.icon ?? '💳'}
                </Box>
                <VStack align="start" gap={0} minW={0}>
                  <Text fontSize="10px" color="#B0B0B0" lineClamp={1}>
                    {acc.name}
                  </Text>
                  <Text fontWeight="bold" fontSize="xs" color="white" lineClamp={1}>
                    {formatCurrency(acc.balance, acc.currency)}
                  </Text>
                </VStack>
              </HStack>
            ) : (
              <VStack align="start" gap={1}>
                <HStack gap={2}>
                  <Box
                    w="7"
                    h="7"
                    borderRadius="full"
                    bg={acc.color ?? '#6366f1'}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    fontSize="sm"
                    flexShrink={0}
                  >
                    {acc.icon ?? '💳'}
                  </Box>
                  <Text fontSize="xs" color="#B0B0B0" lineClamp={1}>
                    {acc.name}
                  </Text>
                </HStack>
                <Text fontWeight="bold" fontSize="sm" color="white">
                  {formatCurrency(acc.balance, acc.currency)}
                </Text>
                <Text fontSize="10px" color="#6b7280">
                  {acc.currency}
                </Text>
              </VStack>
            )}
          </Box>
        ))}
      </SimpleGrid>
    </Card>
  )
})
