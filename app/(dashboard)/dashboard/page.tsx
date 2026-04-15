'use client'

import { Box, Heading, SimpleGrid } from '@chakra-ui/react'
import { StatCard } from '@/components/ui/StatCard'

export default function DashboardPage() {
  return (
    <Box>
      <Heading mb={8}>Dashboard</Heading>

      <SimpleGrid columns={{ base: 1, md: 3 }} gap={6} mb={8}>
        <StatCard
          label="Balance Total"
          value="$0.00 COP"
          helpText="Este mes"
        />
        <StatCard
          label="Gastos"
          value="$0.00"
          helpText="Este mes"
        />
        <StatCard
          label="Ingresos"
          value="$0.00"
          helpText="Este mes"
        />
      </SimpleGrid>

      <Box
        bg="blue.50"
        p={6}
        borderRadius="lg"
        borderLeftWidth="4px"
        borderLeftColor="blue.500"
      >
        <Heading size="sm" mb={2}>
          ✅ FASE 05 Completada
        </Heading>
        <Box fontSize="sm" color="blue.800">
          • Layout principal configurado
          <br />
          • Header y Sidebar funcionales
          <br />
          • Tema de Chakra UI v3 aplicado
          <br />
          • Componentes base creados
        </Box>
      </Box>
    </Box>
  )
}
