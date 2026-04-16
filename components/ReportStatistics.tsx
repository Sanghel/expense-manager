'use client'

import { useEffect, useState } from 'react'
import { SimpleGrid, Box, Text, Spinner, Center } from '@chakra-ui/react'
import { getTransactions } from '@/lib/actions/transactions.actions'
import type { TransactionWithCategory } from '@/types/database.types'
import type { ReportFiltersState } from '@/components/ReportFilters'

interface StatCardProps {
  label: string
  value: string
  helpText?: string
  color?: string
}

function StatCard({ label, value, helpText, color = '#3498DB' }: StatCardProps) {
  return (
    <Box p={6} bg="bg.subtle" borderRadius="lg" border="1px solid" borderColor="border">
      <Text fontSize="sm" fontWeight="600" color="fg.muted" mb={2}>
        {label}
      </Text>
      <Text fontSize="2xl" fontWeight="bold" color={color}>
        {value}
      </Text>
      {helpText && <Text fontSize="xs" color="fg.muted" mt={2}>{helpText}</Text>}
    </Box>
  )
}

interface Props {
  userId: string
  filters?: ReportFiltersState
}

export function ReportStatistics({ userId, filters }: Props) {
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpense: 0,
    netBalance: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const result = await getTransactions(userId, 500)

      if (result.success && result.data) {
        let transactions = result.data as TransactionWithCategory[]

        // Aplicar filtros de fecha
        if (filters?.startDate) {
          transactions = transactions.filter((t) => t.date >= filters.startDate)
        }
        if (filters?.endDate) {
          transactions = transactions.filter((t) => t.date <= filters.endDate)
        }

        // Aplicar filtro de tipo
        if (filters?.transactionType && filters.transactionType !== 'all') {
          transactions = transactions.filter((t) => t.type === filters.transactionType)
        }

        // Aplicar filtro de categoría
        if (filters?.categoryIds && filters.categoryIds.length > 0) {
          transactions = transactions.filter((t) => filters.categoryIds.includes(t.category_id || ''))
        }

        // Calcular estadísticas
        let totalIncome = 0
        let totalExpense = 0

        transactions.forEach((t) => {
          if (t.type === 'income') {
            totalIncome += Number(t.amount)
          } else {
            totalExpense += Number(t.amount)
          }
        })

        setStats({
          totalIncome,
          totalExpense,
          netBalance: totalIncome - totalExpense,
        })
      }
      setLoading(false)
    }
    fetchData()
  }, [userId, filters])

  if (loading) {
    return (
      <Center py={10}>
        <Spinner />
      </Center>
    )
  }

  return (
    <SimpleGrid columns={{ base: 1, md: 3 }} gap={6} mb={8}>
      <StatCard
        label="Ingresos Totales"
        value={`$${stats.totalIncome.toFixed(2)}`}
        color="#2ECC71"
      />
      <StatCard
        label="Gastos Totales"
        value={`$${stats.totalExpense.toFixed(2)}`}
        color="#E74C3C"
      />
      <StatCard
        label="Balance Neto"
        value={`$${stats.netBalance.toFixed(2)}`}
        color={stats.netBalance >= 0 ? '#2ECC71' : '#E74C3C'}
      />
    </SimpleGrid>
  )
}
