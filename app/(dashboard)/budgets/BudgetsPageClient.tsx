'use client'

import { VStack, Heading, Button, HStack, SimpleGrid, Box, Text } from '@chakra-ui/react'
import { useState, useCallback } from 'react'
import { BudgetForm } from '@/components/budgets/BudgetForm'
import { BudgetList } from '@/components/budgets/BudgetList'
import type { Category } from '@/types/database.types'

interface Props {
  userId: string
  categories: Category[]
}

export function BudgetsPageClient({ userId, categories }: Props) {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleFormSuccess = useCallback(() => {
    setRefreshKey((k) => k + 1)
  }, [])

  return (
    <VStack gap={6} align="stretch">
      <HStack justify="space-between">
        <Heading size="lg">Presupuestos</Heading>
        <Button
          bg="#4F46E5"
          color="white"
          _hover={{ bg: '#4338CA' }}
          onClick={() => setIsFormOpen(true)}
        >
          Nuevo Presupuesto
        </Button>
      </HStack>

      <Box borderBottomWidth="1px" />

      <SimpleGrid columns={[1, 2, 4]} gap={4}>
        <Box borderWidth="1px" borderRadius="lg" p={4} bg="#1A1A1A">
          <Text fontSize="xs" color="#B0B0B0" mb={2}>Presupuestos Activos</Text>
          <Heading size="md">—</Heading>
        </Box>
        <Box borderWidth="1px" borderRadius="lg" p={4} bg="#1A1A1A">
          <Text fontSize="xs" color="#B0B0B0" mb={2}>Excedidos</Text>
          <Heading size="md" color="white">—</Heading>
        </Box>
        <Box borderWidth="1px" borderRadius="lg" p={4} bg="#1A1A1A">
          <Text fontSize="xs" color="#B0B0B0" mb={2}>Presupuesto Total</Text>
          <Heading size="md">—</Heading>
        </Box>
        <Box borderWidth="1px" borderRadius="lg" p={4} bg="#1A1A1A">
          <Text fontSize="xs" color="#B0B0B0" mb={2}>Gastado Total</Text>
          <Heading size="md">—</Heading>
        </Box>
      </SimpleGrid>

      <Box borderBottomWidth="1px" />

      <BudgetList key={refreshKey} userId={userId} onRefresh={handleFormSuccess} onEdit={() => {}} />

      <BudgetForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        userId={userId}
        categories={categories}
        onSuccess={handleFormSuccess}
      />
    </VStack>
  )
}
