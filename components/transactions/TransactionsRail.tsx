'use client'

import { Box, Button, Checkbox, Flex, NativeSelect, Stack, Text } from '@chakra-ui/react'
import { LuDownload, LuPlus, LuUpload } from 'react-icons/lu'
import type { ReactNode } from 'react'
import type { Account, Category } from '@/types/database.types'

export interface FilterState {
  search: string
  type: '' | 'income' | 'expense'
  category_id: string
  /** Empty means every account. */
  account_ids: string[]
  month: string
}

export const DEFAULT_FILTERS: FilterState = {
  search: '',
  type: '',
  category_id: '',
  account_ids: [],
  month: '',
}

const TYPES: { value: FilterState['type']; label: string }[] = [
  { value: '', label: 'Todos' },
  { value: 'expense', label: 'Gastos' },
  { value: 'income', label: 'Ingresos' },
]

interface Props {
  filters: FilterState
  onChange: (filters: FilterState) => void
  categories: Category[]
  accounts?: Account[]
  onCreate: () => void
  onImport: () => void
  onExport: () => void
  /** Gmail sync button (rendered only when the integration is enabled). */
  gmailSync?: ReactNode
}

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Box>
      <Text textStyle="sectionLabel" color="text3" mb={2.5}>
        {label}
      </Text>
      {children}
    </Box>
  )
}

function ToolButton({ icon, children, onClick }: { icon: ReactNode; children: ReactNode; onClick: () => void }) {
  return (
    <Button
      onClick={onClick}
      variant="ghost"
      justifyContent="flex-start"
      w="full"
      px={3}
      gap={2.5}
      fontSize="14px"
      fontWeight="400"
      color="text2"
      borderRadius="input"
      _hover={{ bg: 'surface2', color: 'text' }}
    >
      {icon}
      {children}
    </Button>
  )
}

/** Left rail of Transacciones: new transaction, filters and tools. */
export function TransactionsRail({
  filters,
  onChange,
  categories,
  accounts = [],
  onCreate,
  onImport,
  onExport,
  gmailSync,
}: Props) {
  const update = (partial: Partial<FilterState>) => onChange({ ...filters, ...partial })

  // `account_ids` empty = every account. At least one stays checked, and
  // checking all of them again goes back to "every account".
  const toggleAccount = (id: string) => {
    const current = filters.account_ids.length === 0 ? accounts.map((a) => a.id) : filters.account_ids
    const next = current.includes(id) ? current.filter((a) => a !== id) : [...current, id]
    if (next.length === 0) return
    update({ account_ids: next.length === accounts.length ? [] : next })
  }

  const typeCategories = categories.filter(
    (c) => !filters.type || c.type === filters.type || c.type === 'both'
  )

  return (
    <Stack gap={6} w={{ base: 'full', lg: '220px' }} flexShrink={0}>
      <Button
        onClick={onCreate}
        bg="brandSolid"
        color="white"
        _hover={{ bg: 'brand.600' }}
        h="44px"
        w="full"
      >
        <LuPlus />
        Nueva transacción
      </Button>

      <Flex direction={{ base: 'column', md: 'row', lg: 'column' }} gap={6}>
        <Section label="Tipo">
          <Flex gap={1.5} wrap="wrap">
            {TYPES.map((t) => {
              const active = filters.type === t.value
              return (
                <Button
                  key={t.label}
                  aria-pressed={active}
                  onClick={() => update({ type: t.value, category_id: '' })}
                  size="sm"
                  h="32px"
                  px={3}
                  bg={active ? 'text' : 'transparent'}
                  color={active ? 'bg' : 'text2'}
                  boxShadow={active ? 'none' : 'inset 0 0 0 1px var(--chakra-colors-line)'}
                  _hover={active ? undefined : { bg: 'surface2', color: 'text' }}
                >
                  {t.label}
                </Button>
              )
            })}
          </Flex>
        </Section>

        <Section label="Categoría">
          <NativeSelect.Root size="sm">
            <NativeSelect.Field
              aria-label="Categoría"
              value={filters.category_id}
              onChange={(e) => update({ category_id: e.target.value })}
              h="36px"
              borderRadius="input"
              bg="surface2"
              borderColor="transparent"
              fontSize="13px"
            >
              <option value="">Todas</option>
              {typeCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {`${c.icon ?? ''} ${c.name}`.trim()}
                </option>
              ))}
            </NativeSelect.Field>
            <NativeSelect.Indicator color="text3" />
          </NativeSelect.Root>
        </Section>
      </Flex>

      {accounts.length > 0 && (
        <Section label="Cuentas">
          <Stack gap={2}>
            {accounts.map((a) => (
              <Checkbox.Root
                key={a.id}
                checked={filters.account_ids.length === 0 || filters.account_ids.includes(a.id)}
                onCheckedChange={() => toggleAccount(a.id)}
                colorPalette="brand"
                size="sm"
                gap={2.5}
              >
                <Checkbox.HiddenInput />
                <Checkbox.Control borderRadius="6px" />
                <Checkbox.Label fontSize="13px" color="text2" fontWeight="400" truncate>
                  {a.icon ?? '💳'} {a.name}
                </Checkbox.Label>
              </Checkbox.Root>
            ))}
          </Stack>
        </Section>
      )}

      <Section label="Herramientas">
        <Stack gap={0.5} mx={-3}>
          {gmailSync}
          <ToolButton icon={<LuUpload />} onClick={onImport}>
            Importar CSV
          </ToolButton>
          <ToolButton icon={<LuDownload />} onClick={onExport}>
            Exportar
          </ToolButton>
        </Stack>
      </Section>
    </Stack>
  )
}
