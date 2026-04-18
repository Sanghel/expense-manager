'use client'

import { memo } from 'react'
import { Box, Heading, SimpleGrid, VStack, Text, HStack } from '@chakra-ui/react'
import { Card } from '@/components/ui/Card'
import { formatCurrency } from '@/lib/utils/currency'
import type { Account } from '@/types/database.types'

interface Props {
  accounts: Account[]
}

export const AccountsOverview = memo(function AccountsOverview({ accounts }: Props) {
  if (accounts.length === 0) return null

  return (
    <Card>
      <Heading size="md" mb={4}>Mis Cuentas</Heading>
      <SimpleGrid minChildWidth="160px" gap={3}>
        {accounts.map((acc) => (
          <Box
            key={acc.id}
            borderWidth="1px"
            borderRadius="xl"
            p={3}
            bg="#1a1a23"
            borderColor="#2d2d35"
          >
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
                <Text fontSize="xs" color="#B0B0B0" lineClamp={1}>{acc.name}</Text>
              </HStack>
              <Text fontWeight="bold" fontSize="sm" color="white">
                {formatCurrency(acc.balance, acc.currency as any)}
              </Text>
              <Text fontSize="10px" color="#6b7280">{acc.currency}</Text>
            </VStack>
          </Box>
        ))}
      </SimpleGrid>
    </Card>
  )
})
