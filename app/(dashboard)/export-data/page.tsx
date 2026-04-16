'use client'

import { VStack, Heading, Text, Box } from '@chakra-ui/react'
import { useSession } from 'next-auth/react'
import { ExportButtons } from '@/components/export/ExportButtons'

export default function ExportDataPage() {
  const { data: session } = useSession()

  if (!session?.user?.id) return null

  return (
    <VStack alignItems="flex-start" gap={6}>
      <Heading size="lg">Exportar Datos</Heading>

      <Box p={4} borderWidth="1px" borderRadius="md" bg="bg.muted" width="100%">
        <Text mb={4}>
          Descarga todas tus transacciones en tu formato preferido:
        </Text>
        <ExportButtons userId={session.user.id} />
      </Box>

      <Box p={4} borderWidth="1px" borderRadius="md" bg="bg.muted" width="100%">
        <Text fontWeight="bold" mb={2}>
          Formatos disponibles:
        </Text>
        <Text color="fg.muted" fontSize="sm">
          • <strong>CSV:</strong> Compatible con Excel, Google Sheets y otros programas de hojas de cálculo
        </Text>
        <Text color="fg.muted" fontSize="sm">
          • <strong>JSON:</strong> Formato estructurado ideal para importación en otros sistemas
        </Text>
      </Box>
    </VStack>
  )
}
