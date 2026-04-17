'use client'

import { Table, Text, Box } from '@chakra-ui/react'

export interface ColumnDef<T> {
  key: string
  header: string
  render: (row: T) => React.ReactNode
  textAlign?: 'left' | 'right' | 'center'
  whiteSpace?: 'nowrap' | 'normal'
}

interface Props<T> {
  data: T[]
  columns: ColumnDef<T>[]
  emptyMessage?: string
  size?: 'sm' | 'md' | 'lg'
}

export function DataTable<T extends { id: string }>({
  data,
  columns,
  emptyMessage = 'No hay datos.',
  size = 'md',
}: Props<T>) {
  if (data.length === 0) {
    return (
      <Text color="#B0B0B0" textAlign="center" py={8}>
        {emptyMessage}
      </Text>
    )
  }

  return (
    <Box overflowX="auto" w="full">
      <Table.Root variant="line" size={size}>
        <Table.Header>
          <Table.Row>
            {columns.map((col) => (
              <Table.ColumnHeader
                key={col.key}
                textAlign={col.textAlign}
              >
                {col.header}
              </Table.ColumnHeader>
            ))}
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {data.map((row) => (
            <Table.Row key={row.id}>
              {columns.map((col) => (
                <Table.Cell
                  key={col.key}
                  textAlign={col.textAlign}
                  whiteSpace={col.whiteSpace}
                >
                  {col.render(row)}
                </Table.Cell>
              ))}
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Box>
  )
}
