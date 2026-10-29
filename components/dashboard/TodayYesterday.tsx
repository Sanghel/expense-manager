'use client'

import NextLink from 'next/link'
import { Box, Flex, Link, Stack, Text } from '@chakra-ui/react'
import { Card } from '@/components/ui/Card'
import { Money } from '@/components/ui/Money'
import { getLocalDateString } from '@/lib/utils/dates'
import type { TransactionWithCategory } from '@/types/database.types'

/** COP has no cents in practice; USD/VES keep them. */
const decimalsFor = (currency: string) => (currency === 'COP' ? 0 : 2)

/** Compact list of today's and yesterday's transactions. */
export function TodayYesterday({ transactions }: { transactions: TransactionWithCategory[] }) {
  const today = getLocalDateString()
  const y = new Date()
  y.setDate(y.getDate() - 1)
  const yesterday = getLocalDateString(y)

  const days = [
    { label: 'Hoy', date: today },
    { label: 'Ayer', date: yesterday },
  ].map((d) => ({ ...d, rows: transactions.filter((t) => t.date === d.date) }))

  return (
    <Card minW={0}>
      <Flex justify="space-between" align="center" mb={4}>
        <Text textStyle="cardTitle" color="text">
          Hoy y ayer
        </Text>
        <Link asChild fontSize="13px" color="brand" _hover={{ textDecoration: 'none', opacity: 0.8 }}>
          <NextLink href="/movimientos">Ver movimientos</NextLink>
        </Link>
      </Flex>

      {days.every((d) => d.rows.length === 0) ? (
        <Text color="text3" fontSize="sm">
          Sin movimientos hoy ni ayer.
        </Text>
      ) : (
        <Stack gap={4}>
          {days
            .filter((d) => d.rows.length > 0)
            .map((d) => (
              <Box key={d.date}>
                <Text textStyle="sectionLabel" color="text3" mb={1}>
                  {d.label}
                </Text>
                {d.rows.map((t) => (
                  <Flex key={t.id} align="center" gap={3} py={2.5} borderBottomWidth="1px" borderColor="line" _last={{ borderBottomWidth: 0 }}>
                    <Text fontSize="18px" w="24px" textAlign="center" flexShrink={0}>
                      {t.category?.icon ?? '🏷️'}
                    </Text>
                    <Box flex="1" minW={0}>
                      <Text fontSize="14px" fontWeight="500" color="text" truncate>
                        {t.description}
                      </Text>
                      <Text fontSize="12px" color="text3" truncate>
                        {t.category?.name ?? 'Sin categoría'}
                      </Text>
                    </Box>
                    <Money
                      amount={Number(t.amount)}
                      currency={t.currency}
                      kind={t.type}
                      fractionDigits={decimalsFor(t.currency)}
                      fontSize="14px"
                      fontWeight="500"
                    />
                  </Flex>
                ))}
              </Box>
            ))}
        </Stack>
      )}
    </Card>
  )
}
