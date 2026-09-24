'use client'

import {
  VStack,
  HStack,
  Text,
  Button,
  Separator,
} from '@chakra-ui/react'
import { useState } from 'react'
import { LuFileJson, LuFileSpreadsheet, LuFileText } from 'react-icons/lu'
import { ComboboxField } from '@/components/ui/ComboboxField'
import { FormDialog } from '@/components/ui/FormDialog'
import { exportTransactions } from '@/lib/actions/export.actions'
import { toaster } from '@/lib/toaster'

const MONTHS = [
  { value: 1, label: 'Enero' },
  { value: 2, label: 'Febrero' },
  { value: 3, label: 'Marzo' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Mayo' },
  { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Septiembre' },
  { value: 10, label: 'Octubre' },
  { value: 11, label: 'Noviembre' },
  { value: 12, label: 'Diciembre' },
]

const currentYear = new Date().getFullYear()
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - i)

interface Props {
  isOpen: boolean
  onClose: () => void
  userId: string
}

type Format = 'csv' | 'xlsx' | 'json'

export function ExportTransactionsModal({ isOpen, onClose, userId }: Props) {
  const [month, setMonth] = useState<string>('')
  const [year, setYear] = useState<string>(String(currentYear))
  const [loading, setLoading] = useState<Format | null>(null)

  async function handleExport(format: Format) {
    setLoading(format)
    try {
      const filters = {
        year: year ? Number(year) : undefined,
        month: month ? Number(month) : undefined,
      }

      const result = await exportTransactions(userId, format, filters)

      if (!result.success || !result.data) {
        toaster.error({ title: 'Error al exportar', description: result.error ?? 'Intenta de nuevo' })
        return
      }

      let blob: Blob
      const filename = result.filename ?? `transactions.${format}`

      if (format === 'xlsx' && result.encoding === 'base64') {
        const byteChars = atob(result.data as string)
        const byteNumbers = Array.from(byteChars, (c) => c.charCodeAt(0))
        blob = new Blob([new Uint8Array(byteNumbers)], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        })
      } else {
        const mimeTypes: Record<Format, string> = {
          csv: 'text/csv;charset=utf-8;',
          json: 'application/json',
          xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        }
        blob = new Blob([result.data as string], { type: mimeTypes[format] })
      }

      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      link.click()
      URL.revokeObjectURL(url)

      toaster.success({ title: 'Exportación exitosa', description: `Descargado como ${filename}` })
    } catch {
      toaster.error({ title: 'Error al exportar', description: 'Ocurrió un error inesperado' })
    } finally {
      setLoading(null)
    }
  }

  return (
    <FormDialog isOpen={isOpen} onClose={onClose} title="Exportar Transacciones" size="sm">
      <VStack gap={5} align="stretch">
        <Text fontSize="sm" color="#B0B0B0">
          Selecciona el período y el formato de exportación.
        </Text>

        <HStack gap={3} align="flex-end">
          <ComboboxField
            label="Mes"
            placeholder="Todos"
            value={month}
            onChange={setMonth}
            options={MONTHS.map((m) => ({ value: String(m.value), label: m.label }))}
          />
          <ComboboxField
            label="Año"
            placeholder="Todos"
            value={year}
            onChange={setYear}
            options={YEARS.map((y) => ({ value: String(y), label: String(y) }))}
          />
        </HStack>

        <Separator />

        <VStack gap={2}>
          <Button
            w="full"
            variant="outline"
            loading={loading === 'csv'}
            disabled={loading !== null && loading !== 'csv'}
            onClick={() => handleExport('csv')}
          >
            <LuFileText />
            Exportar como CSV
          </Button>

          <Button
            w="full"
            variant="outline"
            loading={loading === 'xlsx'}
            disabled={loading !== null && loading !== 'xlsx'}
            onClick={() => handleExport('xlsx')}
          >
            <LuFileSpreadsheet />
            Exportar como Excel (.xlsx)
          </Button>

          <Button
            w="full"
            variant="outline"
            loading={loading === 'json'}
            disabled={loading !== null && loading !== 'json'}
            onClick={() => handleExport('json')}
          >
            <LuFileJson />
            Exportar como JSON
          </Button>
        </VStack>
      </VStack>
    </FormDialog>
  )
}
