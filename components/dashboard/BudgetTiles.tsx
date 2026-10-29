'use client'

import NextLink from 'next/link'
import { Box, Flex, Grid, Link, Text } from '@chakra-ui/react'
import { Card } from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { formatCompactCurrency } from '@/lib/utils/currency'
import { splitBudgetsByScope, sortByConsumption } from '@/lib/utils/budget-grouping'
import { safeRatio, toNumber } from '@/lib/utils/numbers'
import type { BudgetWithSpent } from '@/types/database.types'

function label(budget: BudgetWithSpent): string {
  if (budget.scope === 'total') return '🧾 Todos los gastos'
  if (budget.scope === 'group') return `${budget.group?.icon ?? '📦'} ${budget.group?.name ?? 'Grupo'}`
  return `${budget.category?.icon ?? ''} ${budget.category?.name ?? 'Sin categoría'}`.trim()
}

/** One tile per group budget (or the most consumed budgets when there are no groups). */
export function BudgetTiles({ budgets }: { budgets: BudgetWithSpent[] }) {
  const { groups } = splitBudgetsByScope(budgets)
  const rows = groups.length > 0 ? sortByConsumption(groups) : sortByConsumption(budgets).slice(0, 4)

  return (
    <Card minW={0}>
      <Flex justify="space-between" align="center" mb={4}>
        <Text textStyle="cardTitle" color="text">
          Presupuestos
        </Text>
        <Link asChild fontSize="13px" color="brand" _hover={{ textDecoration: 'none', opacity: 0.8 }}>
          <NextLink href="/planificacion?tab=presupuestos&vista=grupos">Ver todos</NextLink>
        </Link>
      </Flex>

      {rows.length === 0 ? (
        <Text color="text3" fontSize="sm">
          Aún no tienes presupuestos. Crea uno en Planificación.
        </Text>
      ) : (
        <Grid templateColumns="repeat(auto-fill, minmax(150px, 1fr))" gap={3}>
          {rows.map((b) => {
            const percent = safeRatio(b.spent, b.limit_amount) * 100
            const left = toNumber(b.limit_amount) - toNumber(b.spent)
            const exceeded = percent >= 100
            return (
              <Box key={b.id} bg={exceeded ? 'negSoft' : 'surface2'} borderRadius="tile" p={4} minW={0}>
                <Text fontSize="13px" color="text2" truncate>
                  {label(b)}
                </Text>
                <Text fontFamily="mono" fontSize="24px" fontWeight="500" color={exceeded ? 'neg' : 'text'} my={2}>
                  {Math.round(percent)}%
                </Text>
                <ProgressBar value={percent} label={label(b)} />
                <Text fontSize="12px" color={exceeded ? 'neg' : 'text3'} mt={2}>
                  {exceeded ? 'Excedido ' : 'Quedan '}
                  <Text as="span" fontFamily="mono">
                    {formatCompactCurrency(Math.abs(left), b.currency)}
                  </Text>
                </Text>
              </Box>
            )
          })}
        </Grid>
      )}
    </Card>
  )
}
