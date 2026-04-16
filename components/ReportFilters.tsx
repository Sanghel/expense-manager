'use client'

import {
  Button,
  HStack,
  VStack,
  FieldRoot,
  FieldLabel,
  Input,
  NativeSelectRoot,
  NativeSelectField,
  Badge,
  Wrap,
  WrapItem,
  Text,
} from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { getCategories } from '@/lib/actions/categories.actions'
import type { Category } from '@/types/database.types'

export interface ReportFiltersState {
  startDate: string
  endDate: string
  categoryIds: string[]
  transactionType: 'all' | 'income' | 'expense'
}

interface Props {
  userId: string
  onFilterChange: (filters: ReportFiltersState) => void
}

export function ReportFilters({ userId, onFilterChange }: Props) {
  const [filters, setFilters] = useState<ReportFiltersState>({
    startDate: '',
    endDate: '',
    categoryIds: [],
    transactionType: 'all',
  })

  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    // Fetch categories on mount
    async function fetchCategories() {
      const result = await getCategories(userId)
      if (result.success && result.data) {
        setCategories(result.data as Category[])
      }
    }
    fetchCategories()
  }, [userId])

  const handleStartDateChange = (value: string) => {
    const newFilters = { ...filters, startDate: value }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const handleEndDateChange = (value: string) => {
    const newFilters = { ...filters, endDate: value }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const handleCategoryToggle = (categoryId: string) => {
    const categoryIds = filters.categoryIds.includes(categoryId)
      ? filters.categoryIds.filter((id) => id !== categoryId)
      : [...filters.categoryIds, categoryId]
    const newFilters = { ...filters, categoryIds }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const handleTypeChange = (value: string) => {
    const type = value as 'all' | 'income' | 'expense'
    const newFilters = { ...filters, transactionType: type }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const handleReset = () => {
    const newFilters: ReportFiltersState = {
      startDate: '',
      endDate: '',
      categoryIds: [],
      transactionType: 'all',
    }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  return (
    <VStack align="stretch" gap={4} bg="bg.subtle" p={6} borderRadius="lg" mb={8}>
      <Text fontWeight="bold" fontSize="lg">
        Filtros
      </Text>

      <HStack gap={4} flexWrap="wrap">
        <FieldRoot w={{ base: 'full', sm: 'auto' }}>
          <FieldLabel fontSize="sm">Desde</FieldLabel>
          <Input
            type="date"
            value={filters.startDate}
            onChange={(e) => handleStartDateChange(e.target.value)}
            size="sm"
          />
        </FieldRoot>

        <FieldRoot w={{ base: 'full', sm: 'auto' }}>
          <FieldLabel fontSize="sm">Hasta</FieldLabel>
          <Input
            type="date"
            value={filters.endDate}
            onChange={(e) => handleEndDateChange(e.target.value)}
            size="sm"
          />
        </FieldRoot>

        <FieldRoot w={{ base: 'full', sm: 'auto' }}>
          <FieldLabel fontSize="sm">Tipo</FieldLabel>
          <NativeSelectRoot>
            <NativeSelectField
              value={filters.transactionType}
              onChange={(e) => handleTypeChange(e.target.value)}
            >
              <option value="all">Todas</option>
              <option value="income">Ingresos</option>
              <option value="expense">Gastos</option>
            </NativeSelectField>
          </NativeSelectRoot>
        </FieldRoot>
      </HStack>

      {categories.length > 0 && (
        <FieldRoot>
          <FieldLabel fontSize="sm" mb={2}>
            Categorías
          </FieldLabel>
          <Wrap gap={2}>
            {categories.map((category) => (
              <WrapItem key={category.id}>
                <Badge
                  cursor="pointer"
                  variant={
                    filters.categoryIds.includes(category.id)
                      ? 'solid'
                      : 'subtle'
                  }
                  onClick={() => handleCategoryToggle(category.id)}
                  colorScheme={
                    filters.categoryIds.includes(category.id)
                      ? 'blue'
                      : 'gray'
                  }
                >
                  {category.name}
                </Badge>
              </WrapItem>
            ))}
          </Wrap>
        </FieldRoot>
      )}

      <HStack justify="flex-end">
        <Button onClick={handleReset} size="sm" variant="ghost">
          Limpiar filtros
        </Button>
      </HStack>
    </VStack>
  )
}
