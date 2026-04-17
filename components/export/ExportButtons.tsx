'use client'

import { Button, HStack, Text } from '@chakra-ui/react'
import { useState } from 'react'
import { exportTransactions } from '@/lib/actions/export.actions'
import { toaster } from '@/lib/toaster'

interface Props {
  userId: string
}

export function ExportButtons({ userId }: Props) {
  const [loading, setLoading] = useState<'csv' | 'json' | null>(null)

  const handleExport = async (format: 'csv' | 'json') => {
    setLoading(format)
    const result = await exportTransactions(userId, format)
    setLoading(null)

    if (result.success && result.data && result.filename) {
      downloadFile(result.data, result.filename, format === 'json' ? 'application/json' : 'text/csv')
      toaster.create({ title: `Datos exportados como ${format.toUpperCase()}`, type: 'success', duration: 3000 })
    } else {
      toaster.create({ title: result.error || 'Error al exportar', type: 'error', duration: 3000 })
    }
  }

  return (
    <HStack gap="4">
      <div>
        <Text fontWeight="bold" mb="2">
          Exportar datos
        </Text>
        <HStack gap="2">
          <Button onClick={() => handleExport('csv')} loading={loading === 'csv'}>
            Exportar como CSV
          </Button>
          <Button onClick={() => handleExport('json')} loading={loading === 'json'}>
            Exportar como JSON
          </Button>
        </HStack>
      </div>
    </HStack>
  )
}

function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
