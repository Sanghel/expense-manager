'use client'

import { Box, Heading, Spinner, Center, Text } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { getTransactions } from '@/lib/actions/transactions.actions'
import { Card } from '@/components/ui/Card'
import type { TransactionWithCategory } from '@/types/database.types'
import type { ReportFiltersState } from '@/components/ReportFilters'

interface ChartDataPoint {
  name: string
  value: number
}

interface Props {
  userId: string
  type?: 'expense' | 'income'
  filters?: ReportFiltersState
}

// Colores para ingresos (tonos positivos: verdes y azules)
const INCOME_COLORS = [
  '#2ECC71', // Verde brillante
  '#27AE60', // Verde oscuro
  '#16A085', // Verde azulado
  '#1ABC9C', // Turquesa
  '#3498DB', // Azul brillante
  '#2980B9', // Azul oscuro
  '#8E44AD', // Púrpura (positivo)
  '#9B59B6', // Púrpura claro
  '#48C9B0', // Verde agua
  '#17A589', // Verde agua oscuro
  '#6C5CE7', // Azul púrpura
  '#74B9FF', // Azul claro
]

// Colores para gastos (tonos negativos: amarillos, naranjas y rojos)
const EXPENSE_COLORS = [
  '#E74C3C', // Rojo brillante
  '#C0392B', // Rojo oscuro
  '#E67E22', // Naranja oscuro
  '#D35400', // Naranja más oscuro
  '#F39C12', // Amarillo naranja
  '#F1C40F', // Amarillo brillante
  '#E59866', // Naranja claro
  '#DC7633', // Naranja medio
  '#CB4335', // Rojo medio
  '#A93226', // Rojo muy oscuro
  '#F4D03F', // Amarillo claro
  '#E8DAEF', // Rosa claro (negativo suave)
]

export function ExpensesByCategoryChart({ userId, type = 'expense', filters }: Props) {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const result = await getTransactions(userId, 500)

      if (result.success && result.data) {
        let transactions = result.data as TransactionWithCategory[]

        // Filtrar por el tipo del componente (expense o income)
        transactions = transactions.filter((t) => t.type === type)

        // Si el filtro de tipo es específico y NO coincide con el type prop, devolver vacío
        if (filters?.transactionType && filters.transactionType !== 'all' && filters.transactionType !== type) {
          setChartData([])
          setLoading(false)
          return
        }

        // Aplicar filtros de fecha
        if (filters?.startDate) {
          transactions = transactions.filter((t) => t.date >= filters.startDate)
        }
        if (filters?.endDate) {
          transactions = transactions.filter((t) => t.date <= filters.endDate)
        }

        // Aplicar filtro de categoría
        if (filters?.categoryIds && filters.categoryIds.length > 0) {
          transactions = transactions.filter((t) => filters.categoryIds.includes(t.category_id || ''))
        }

        // Agrupar por categoría
        const grouped = transactions.reduce<Record<string, number>>((acc, t) => {
          const categoryName = t.category?.name || 'Sin categoría'
          acc[categoryName] = (acc[categoryName] || 0) + Number(t.amount)
          return acc
        }, {})

        // Convertir a array y ordenar por valor descendente
        const data = Object.entries(grouped)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)

        setChartData(data)
      }
      setLoading(false)
    }
    fetchData()
  }, [userId, type, filters])

  const title = type === 'expense' ? 'Gastos por Categoría' : 'Ingresos por Categoría'

  if (loading) {
    return (
      <Card>
        <Center py={10}>
          <Spinner />
        </Center>
      </Card>
    )
  }

  if (chartData.length === 0) {
    return (
      <Card>
        <Heading size="md" mb={4}>
          {title}
        </Heading>
        <Text color="#B0B0B0">No hay datos para mostrar.</Text>
      </Card>
    )
  }

  return (
    <Card>
      <Heading size="md" mb={4}>
        {title}
      </Heading>
      <Box h={{ base: '280px', md: '400px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius="40%"
              label={({ name, percent = 0 }) =>
                `${name} ${(percent * 100).toFixed(0)}%`
              }
            >
              {chartData.map((_, index) => {
                const colorPalette = type === 'income' ? INCOME_COLORS : EXPENSE_COLORS
                return (
                  <Cell key={`cell-${index}`} fill={colorPalette[index % colorPalette.length]} />
                )
              })}
            </Pie>
            <Tooltip
              formatter={(value) => `$${Number(value).toFixed(2)}`}
              contentStyle={{
                backgroundColor: '#1a1a1a',
                border: '1px solid #333',
                borderRadius: '4px',
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </Box>
    </Card>
  )
}
