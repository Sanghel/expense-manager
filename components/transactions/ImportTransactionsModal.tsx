'use client'

import {
  VStack,
  HStack,
  Text,
  Button,
  Box,
  Badge,
  Checkbox,
  Spinner,
  Table,
  Icon,
  Separator,
} from '@chakra-ui/react'
import { useRef, useState, type RefObject } from 'react'
import { FiUpload, FiDownload, FiCheckCircle, FiXCircle, FiAlertCircle } from 'react-icons/fi'
import { FormDialog } from '@/components/ui/FormDialog'
import { PrimaryButton } from '@/components/ui/PrimaryButton'
import { parseImportFile } from '@/lib/utils/import-parser'
import {
  downloadImportTemplate,
  resolveImportRows,
  bulkImportTransactions,
} from '@/lib/actions/import.actions'
import { toaster } from '@/lib/toaster'
import type { ResolvedImportRow } from '@/types/import.types'
import type { CreateTransactionInput } from '@/lib/validations/transaction'

type Step = 1 | 2 | 3

interface ImportResult {
  imported: number
  failedRows: ResolvedImportRow[]
}

interface Props {
  isOpen: boolean
  onClose: () => void
  userId: string
  onSuccess: () => void
}

// ─── Stepper ──────────────────────────────────────────────────────────────────

function Stepper({ current }: { current: Step }) {
  const steps = ['Subir archivo', 'Revisar', 'Resultado']
  return (
    <HStack justify="center" gap={0} mb={5}>
      {steps.map((label, idx) => {
        const num = (idx + 1) as Step
        const isActive = num === current
        const isDone = num < current
        return (
          <HStack key={num} gap={0}>
            <VStack gap={1}>
              <Box
                w={7}
                h={7}
                borderRadius="full"
                bg={isDone ? '#4F46E5' : isActive ? '#4F46E5' : '#2d2d35'}
                border="2px solid"
                borderColor={isActive || isDone ? '#4F46E5' : '#444'}
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Text fontSize="xs" color="white" fontWeight="bold">
                  {isDone ? '✓' : num}
                </Text>
              </Box>
              <Text fontSize="xs" color={isActive ? 'white' : '#888'} whiteSpace="nowrap">
                {label}
              </Text>
            </VStack>
            {idx < steps.length - 1 && (
              <Box w={12} h="2px" bg={isDone ? '#4F46E5' : '#2d2d35'} mb={4} mx={1} />
            )}
          </HStack>
        )
      })}
    </HStack>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ImportTransactionsModal({ isOpen, onClose, userId, onSuccess }: Props) {
  const [step, setStep] = useState<Step>(1)
  const [file, setFile] = useState<File | null>(null)
  const [resolvedRows, setResolvedRows] = useState<ResolvedImportRow[]>([])
  const [importPartial, setImportPartial] = useState(true)
  const [loading, setLoading] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleClose() {
    setStep(1)
    setFile(null)
    setResolvedRows([])
    setImportPartial(true)
    setLoading(false)
    setParseError(null)
    setImportResult(null)
    onClose()
  }

  // ── Step 1: file handling ──────────────────────────────────────────────────

  async function handleFileSelect(selected: File) {
    setFile(selected)
    setParseError(null)
    setLoading(true)

    try {
      const { rows, error } = await parseImportFile(selected)

      if (error || rows.length === 0) {
        setParseError(error ?? 'No se encontraron filas con datos')
        setLoading(false)
        return
      }

      const resolved = await resolveImportRows(userId, rows)
      setResolvedRows(resolved)
      setStep(2)
    } catch {
      setParseError('Error inesperado al procesar el archivo. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDownloadTemplate() {
    const result = await downloadImportTemplate()
    if (!result.success || !result.data) {
      toaster.error({ title: 'Error', description: 'No se pudo generar la plantilla' })
      return
    }
    const byteChars = atob(result.data as string)
    const byteNumbers = Array.from(byteChars, (c) => c.charCodeAt(0))
    const blob = new Blob([new Uint8Array(byteNumbers)], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = result.filename as string
    link.click()
    URL.revokeObjectURL(url)
  }

  // ── Step 2: import ─────────────────────────────────────────────────────────

  const validRows = resolvedRows.filter((r: ResolvedImportRow) => r.status === 'valid')
  const errorRows = resolvedRows.filter((r: ResolvedImportRow) => r.status === 'error')
  const rowsToImport = importPartial ? validRows : resolvedRows
  const canImport = rowsToImport.some((r: ResolvedImportRow) => r.status === 'valid')

  async function handleImport() {
    const toInsert = rowsToImport
      .filter((r: ResolvedImportRow) => r.status === 'valid')
      .map((r: ResolvedImportRow) => r.data as CreateTransactionInput)
    if (toInsert.length === 0) return

    setLoading(true)
    try {
      const result = await bulkImportTransactions(userId, toInsert)
      if (!result.success) {
        toaster.error({ title: 'Error al importar', description: result.error })
        return
      }
      setImportResult({
        imported: result.imported ?? 0,
        failedRows: importPartial ? errorRows : [],
      })
      setStep(3)
    } catch {
      toaster.error({ title: 'Error inesperado', description: 'No se pudo completar la importación' })
    } finally {
      setLoading(false)
    }
  }

  // ── Step 3: success ────────────────────────────────────────────────────────

  function handleFinish() {
    onSuccess()
    handleClose()
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <FormDialog isOpen={isOpen} onClose={handleClose} title="Importar Transacciones" size="xl">
      <Stepper current={step} />

      {step === 1 && (
        <Step1
          file={file}
          loading={loading}
          parseError={parseError}
          fileInputRef={fileInputRef}
          onFileSelect={handleFileSelect}
          onDownloadTemplate={handleDownloadTemplate}
        />
      )}

      {step === 2 && (
        <Step2
          resolvedRows={resolvedRows}
          validRows={validRows}
          errorRows={errorRows}
          importPartial={importPartial}
          canImport={canImport}
          loading={loading}
          onImportPartialChange={setImportPartial}
          onBack={() => { setStep(1); setFile(null); setParseError(null) }}
          onImport={handleImport}
        />
      )}

      {step === 3 && importResult && (
        <Step3 result={importResult} onClose={handleFinish} />
      )}
    </FormDialog>
  )
}

// ─── Step 1 Component ─────────────────────────────────────────────────────────

interface Step1Props {
  file: File | null
  loading: boolean
  parseError: string | null
  fileInputRef: RefObject<HTMLInputElement | null>
  onFileSelect: (file: File) => void
  onDownloadTemplate: () => void
}

function Step1({ file, loading, parseError, fileInputRef, onFileSelect, onDownloadTemplate }: Step1Props) {
  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    const dropped = e.dataTransfer.files[0]
    if (dropped) onFileSelect(dropped)
  }

  return (
    <VStack gap={5} align="stretch">
      {/* Template download */}
      <HStack justify="space-between" align="center" p={3} bg="#1a1a24" borderRadius="md" borderWidth="1px" borderColor="#2d2d35">
        <VStack align="start" gap={0}>
          <Text fontSize="sm" color="white" fontWeight="medium">¿Primera vez?</Text>
          <Text fontSize="xs" color="#888">Descarga la plantilla y rellénala con tus datos</Text>
        </VStack>
        <Button size="sm" variant="outline" onClick={onDownloadTemplate} flexShrink={0}>
          <FiDownload />
          Plantilla
        </Button>
      </HStack>

      {/* Column reference */}
      <Box p={3} bg="#1a1a24" borderRadius="md" borderWidth="1px" borderColor="#2d2d35">
        <Text fontSize="xs" color="#888" mb={1}>Columnas esperadas:</Text>
        <Text fontSize="xs" color="#B0B0B0" fontFamily="mono">
          fecha · descripcion · categoria · cuenta · tipo · monto · moneda · notas
        </Text>
        <Text fontSize="xs" color="#666" mt={1}>
          <strong>tipo:</strong> Ingreso / Gasto &nbsp;·&nbsp; <strong>moneda:</strong> COP / USD / VES &nbsp;·&nbsp; cuenta y notas son opcionales
        </Text>
      </Box>

      {/* Dropzone */}
      <Box
        border="2px dashed"
        borderColor={parseError ? 'red.500' : '#2d2d35'}
        borderRadius="lg"
        p={8}
        textAlign="center"
        cursor="pointer"
        _hover={{ borderColor: '#4F46E5', bg: '#1a1a2e' }}
        transition="all 0.2s"
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e: React.DragEvent<HTMLDivElement>) => e.preventDefault()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.csv"
          style={{ display: 'none' }}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) onFileSelect(f) }}
        />

        {loading ? (
          <VStack gap={3}>
            <Spinner color="#4F46E5" size="lg" />
            <Text color="#888" fontSize="sm">Analizando archivo...</Text>
          </VStack>
        ) : (
          <VStack gap={2}>
            <Icon as={FiUpload} color={file ? '#4F46E5' : '#888'} boxSize={8} />
            {file ? (
              <>
                <Text color="white" fontWeight="medium">{file.name}</Text>
                <Text color="#888" fontSize="sm">{(file.size / 1024).toFixed(1)} KB · Haz clic para cambiar</Text>
              </>
            ) : (
              <>
                <Text color="#B0B0B0" fontWeight="medium">Arrastra tu archivo aquí o haz clic para seleccionar</Text>
                <Text color="#888" fontSize="sm">Formatos soportados: .xlsx, .csv</Text>
              </>
            )}
          </VStack>
        )}
      </Box>

      {parseError && (
        <HStack p={3} bg="red.900" borderRadius="md" borderWidth="1px" borderColor="red.600" align="start">
          <Icon as={FiAlertCircle} color="red.300" mt={0.5} flexShrink={0} />
          <Text fontSize="sm" color="red.200">{parseError}</Text>
        </HStack>
      )}
    </VStack>
  )
}

// ─── Step 2 Component ─────────────────────────────────────────────────────────

interface Step2Props {
  resolvedRows: ResolvedImportRow[]
  validRows: ResolvedImportRow[]
  errorRows: ResolvedImportRow[]
  importPartial: boolean
  canImport: boolean
  loading: boolean
  onImportPartialChange: (v: boolean) => void
  onBack: () => void
  onImport: () => void
}

function Step2({ resolvedRows, validRows, errorRows, importPartial, canImport, loading, onImportPartialChange, onBack, onImport }: Step2Props) {
  const rowsToProcess = importPartial ? validRows.length : validRows.length

  return (
    <VStack gap={4} align="stretch">
      {/* Summary bar */}
      <HStack gap={3} flexWrap="wrap">
        <Badge colorPalette="green" px={3} py={1} borderRadius="full" fontSize="sm">
          {validRows.length} válidas
        </Badge>
        {errorRows.length > 0 && (
          <Badge colorPalette="red" px={3} py={1} borderRadius="full" fontSize="sm">
            {errorRows.length} con errores
          </Badge>
        )}
        <Text fontSize="sm" color="#888">de {resolvedRows.length} filas totales</Text>
      </HStack>

      {/* Partial import toggle */}
      {errorRows.length > 0 && (
        <HStack p={3} bg="#1a1a24" borderRadius="md" borderWidth="1px" borderColor="#2d2d35">
          <Checkbox.Root
            checked={importPartial}
            onCheckedChange={({ checked }: { checked: boolean | 'indeterminate' }) => onImportPartialChange(Boolean(checked))}
          >
            <Checkbox.HiddenInput />
            <Checkbox.Control />
            <Checkbox.Label>
              <Text fontSize="sm" color="#B0B0B0">
                Importar solo las filas válidas (ignorar las {errorRows.length} con errores)
              </Text>
            </Checkbox.Label>
          </Checkbox.Root>
        </HStack>
      )}

      {/* Preview table */}
      <Box overflowX="auto" overflowY="auto" maxH="350px" borderWidth="1px" borderColor="#2d2d35" borderRadius="md">
        <Table.Root size="sm" variant="outline">
          <Table.Header bg="#1a1a24" position="sticky" top={0} zIndex={1}>
            <Table.Row borderColor="#2d2d35">
              {['#', 'Fecha', 'Descripción', 'Categoría', 'Cuenta', 'Tipo', 'Monto', 'Moneda', ''].map((h) => (
                <Table.ColumnHeader key={h} color="#888" fontSize="xs" px={3} py={2} whiteSpace="nowrap">
                  {h}
                </Table.ColumnHeader>
              ))}
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {resolvedRows.map((row) => {
              const isError = row.status === 'error'
              return (
                <Table.Row
                  key={row.rowIndex}
                  bg={isError ? 'rgba(220,38,38,0.08)' : undefined}
                  borderColor="#2d2d35"
                  _hover={{ bg: isError ? 'rgba(220,38,38,0.12)' : '#1a1a2e' }}
                >
                  <Table.Cell px={3} py={2} color="#888" fontSize="xs">{row.rowIndex}</Table.Cell>
                  <Table.Cell px={3} py={2} color="white" fontSize="xs" whiteSpace="nowrap">{row.displayData.date}</Table.Cell>
                  <Table.Cell px={3} py={2} color="white" fontSize="xs" maxW="150px">
                    <Text truncate>{row.displayData.description}</Text>
                  </Table.Cell>
                  <Table.Cell px={3} py={2} color="white" fontSize="xs">{row.displayData.category}</Table.Cell>
                  <Table.Cell px={3} py={2} color="#B0B0B0" fontSize="xs">{row.displayData.account || '—'}</Table.Cell>
                  <Table.Cell px={3} py={2} fontSize="xs">
                    <Badge
                      colorPalette={row.displayData.type === 'income' ? 'green' : 'red'}
                      size="sm"
                    >
                      {row.displayData.type === 'income' ? 'Ingreso' : 'Gasto'}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell px={3} py={2} color="white" fontSize="xs" whiteSpace="nowrap">
                    {Number(row.displayData.amount).toLocaleString()}
                  </Table.Cell>
                  <Table.Cell px={3} py={2} color="#B0B0B0" fontSize="xs">{row.displayData.currency}</Table.Cell>
                  <Table.Cell px={3} py={2}>
                    {isError ? (
                      <Box title={row.errors.join(' | ')}>
                        <Icon as={FiXCircle} color="red.400" boxSize={4} cursor="help" />
                      </Box>
                    ) : (
                      <Icon as={FiCheckCircle} color="green.400" boxSize={4} />
                    )}
                  </Table.Cell>
                </Table.Row>
              )
            })}
          </Table.Body>
        </Table.Root>
      </Box>

      {/* Error details */}
      {errorRows.length > 0 && (
        <Box p={3} bg="#1a1a24" borderRadius="md" borderWidth="1px" borderColor="#2d2d35">
          <Text fontSize="xs" color="red.300" fontWeight="medium" mb={2}>Errores encontrados:</Text>
          <VStack align="start" gap={1}>
            {errorRows.slice(0, 5).map((row) =>
              row.errors.map((err, i) => (
                <Text key={`${row.rowIndex}-${i}`} fontSize="xs" color="#B0B0B0">{err}</Text>
              ))
            )}
            {errorRows.length > 5 && (
              <Text fontSize="xs" color="#666">... y {errorRows.length - 5} filas más con errores</Text>
            )}
          </VStack>
        </Box>
      )}

      <Separator />

      {/* Actions */}
      <HStack justify="space-between">
        <Button variant="outline" size="sm" onClick={onBack} disabled={loading}>
          Volver
        </Button>
        <PrimaryButton
          loading={loading}
          disabled={!canImport}
          onClick={onImport}
        >
          Importar {rowsToProcess} transacci{rowsToProcess === 1 ? 'ón' : 'ones'}
        </PrimaryButton>
      </HStack>
    </VStack>
  )
}

// ─── Step 3 Component ─────────────────────────────────────────────────────────

interface Step3Props {
  result: ImportResult
  onClose: () => void
}

function Step3({ result, onClose }: Step3Props) {
  return (
    <VStack gap={5} align="stretch">
      <VStack gap={3} py={4}>
        <Icon as={FiCheckCircle} color="green.400" boxSize={12} />
        <Text fontSize="xl" color="white" fontWeight="semibold" textAlign="center">
          {result.imported} transacci{result.imported === 1 ? 'ón importada' : 'ones importadas'}
        </Text>
        <Text fontSize="sm" color="#888" textAlign="center">
          Las transacciones ya aparecen en tu lista
        </Text>
      </VStack>

      {result.failedRows.length > 0 && (
        <Box p={4} bg="#1a1a24" borderRadius="md" borderWidth="1px" borderColor="#2d2d35">
          <HStack mb={2}>
            <Icon as={FiAlertCircle} color="orange.400" />
            <Text fontSize="sm" color="orange.300" fontWeight="medium">
              {result.failedRows.length} fila{result.failedRows.length === 1 ? '' : 's'} omitida{result.failedRows.length === 1 ? '' : 's'} por errores
            </Text>
          </HStack>
          <VStack align="start" gap={1}>
            {result.failedRows.slice(0, 10).map((row) =>
              row.errors.map((err, i) => (
                <Text key={`${row.rowIndex}-${i}`} fontSize="xs" color="#B0B0B0">{err}</Text>
              ))
            )}
            {result.failedRows.length > 10 && (
              <Text fontSize="xs" color="#666">... y {result.failedRows.length - 10} filas más</Text>
            )}
          </VStack>
        </Box>
      )}

      <PrimaryButton onClick={onClose} width="full">
        Cerrar
      </PrimaryButton>
    </VStack>
  )
}
