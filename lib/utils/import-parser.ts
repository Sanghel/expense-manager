import type { ParsedImportRow } from '@/types/import.types'

const REQUIRED_COLUMNS = ['fecha', 'descripcion', 'categoria', 'tipo', 'monto', 'moneda']
const MAX_ROWS = 500

// Column aliases to support both Spanish and English headers
const COLUMN_ALIASES: Record<string, string> = {
  fecha: 'fecha',
  date: 'fecha',
  descripcion: 'descripcion',
  descripción: 'descripcion',
  description: 'descripcion',
  categoria: 'categoria',
  categoría: 'categoria',
  category: 'categoria',
  cuenta: 'cuenta',
  account: 'cuenta',
  tipo: 'tipo',
  type: 'tipo',
  monto: 'monto',
  amount: 'monto',
  moneda: 'moneda',
  currency: 'moneda',
  notas: 'notas',
  notes: 'notas',
}

export async function parseImportFile(
  file: File
): Promise<{ rows: ParsedImportRow[]; error?: string }> {
  try {
    const XLSX = await import('xlsx')
    const buffer = await file.arrayBuffer()

    // cellDates: false so we can handle serial numbers explicitly
    const wb = XLSX.read(buffer, { type: 'array', cellDates: false })
    const ws = wb.Sheets[wb.SheetNames[0]]

    if (!ws) return { rows: [], error: 'El archivo está vacío o no contiene hojas' }

    const raw: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })

    if (raw.length < 2) return { rows: [], error: 'El archivo no contiene filas de datos' }

    // Normalize headers
    const rawHeaders = (raw[0] as unknown[]).map((h) =>
      String(h).toLowerCase().trim().replace(/\s+/g, '_')
    )
    const headers = rawHeaders.map((h) => COLUMN_ALIASES[h] ?? h)

    // Validate required columns
    const missing = REQUIRED_COLUMNS.filter((col) => !headers.includes(col))
    if (missing.length > 0) {
      return {
        rows: [],
        error: `Faltan columnas requeridas: ${missing.join(', ')}. Descarga la plantilla para ver el formato correcto.`,
      }
    }

    const dataRows = raw.slice(1)

    if (dataRows.length > MAX_ROWS) {
      return {
        rows: [],
        error: `El archivo contiene ${dataRows.length} filas. El máximo permitido es ${MAX_ROWS}. Divide el archivo en partes más pequeñas.`,
      }
    }

    const rows: ParsedImportRow[] = []

    for (let i = 0; i < dataRows.length; i++) {
      const cells = dataRows[i] as unknown[]

      // Skip completely empty rows
      if (cells.every((c) => c === '' || c === null || c === undefined)) continue

      const raw: Record<string, unknown> = {}
      headers.forEach((header, idx) => {
        raw[header] = cells[idx] ?? ''
      })

      // Normalize date: Excel serial numbers → YYYY-MM-DD
      if (typeof raw.fecha === 'number') {
        const parsed = XLSX.SSF.parse_date_code(raw.fecha as number)
        if (parsed) {
          const month = String(parsed.m).padStart(2, '0')
          const day = String(parsed.d).padStart(2, '0')
          raw.fecha = `${parsed.y}-${month}-${day}`
        }
      }

      // Normalize amount: ensure it's a number string for coerce
      if (typeof raw.monto === 'string') {
        raw.monto = raw.monto.replace(/[,\s]/g, '')
      }

      rows.push({ rowIndex: i + 1, raw })
    }

    if (rows.length === 0) {
      return { rows: [], error: 'No se encontraron filas con datos' }
    }

    return { rows }
  } catch (err) {
    console.error('Import parse error:', err)
    return { rows: [], error: 'No se pudo leer el archivo. Asegúrate de que sea un .xlsx o .csv válido.' }
  }
}
