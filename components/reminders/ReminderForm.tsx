'use client'

import { useMemo, useState } from 'react'
import { Box, Button, Flex, Grid, Text } from '@chakra-ui/react'
import { LuArrowDownLeft, LuArrowUpRight, LuBell } from 'react-icons/lu'
import { createReminder, updateReminder } from '@/lib/actions/reminders.actions'
import { toaster } from '@/lib/toaster'
import {
  AccountChips,
  Chip,
  DateField,
  Field,
  FormModal,
  FormModalContent,
  SegmentedControl,
  SummaryBox,
  TitleInput,
} from '@/components/ui/pulso'
import { nextOccurrence } from '@/lib/reminders/matches-date'
import type { Account, Category, Reminder, ReminderFrequency, ReminderType } from '@/types/database.types'
import { getLocalDateString } from '@/lib/utils/dates'

const TOP_CATEGORIES = 10
/** Days ahead that an occurrence shows up as pending (see getPendingReminders). */
const LOOKAHEAD_DAYS = 7

const FREQUENCIES: { value: ReminderFrequency; label: string }[] = [
  { value: 'once', label: 'Una vez' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'monthly', label: 'Mensual' },
  { value: 'yearly', label: 'Anual' },
]

// Monday first, as in the handoff; values are Date#getDay().
const WEEKDAYS = [
  { value: 1, short: 'L', name: 'lunes' },
  { value: 2, short: 'M', name: 'martes' },
  { value: 3, short: 'X', name: 'miércoles' },
  { value: 4, short: 'J', name: 'jueves' },
  { value: 5, short: 'V', name: 'viernes' },
  { value: 6, short: 'S', name: 'sábado' },
  { value: 0, short: 'D', name: 'domingo' },
]

const pad = (n: number) => String(n).padStart(2, '0')

/** "5 nov" */
const shortDate = (d: Date) =>
  d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }).replace(' de ', ' ').replace('.', '')

interface Props {
  isOpen: boolean
  onClose: () => void
  userId: string
  categories: Category[]
  accounts?: Account[]
  editingReminder?: Reminder | null
  onSuccess: () => void
  prefillDate?: string
}

function initialForm(editing?: Reminder | null, prefillDate?: string) {
  if (editing) {
    return {
      description: editing.description,
      type: editing.type ?? 'expense',
      category_id: editing.category_id ?? '',
      account_id: editing.account_id ?? '',
      frequency: editing.frequency,
      day_of_week: editing.day_of_week ?? 1,
      day_of_month: editing.day_of_month ?? 1,
      month_of_year: editing.month_of_year ?? 1,
      specific_date: editing.specific_date ?? getLocalDateString(),
    }
  }
  const date = prefillDate ?? getLocalDateString()
  const d = new Date(`${date}T12:00:00`)
  return {
    description: '',
    type: 'expense' as ReminderType,
    category_id: '',
    account_id: '',
    frequency: (prefillDate ? 'once' : 'monthly') as ReminderFrequency,
    day_of_week: d.getDay(),
    day_of_month: d.getDate(),
    month_of_year: d.getMonth() + 1,
    specific_date: date,
  }
}

type BodyProps = Omit<Props, 'isOpen'>

function ReminderFormBody({
  onClose,
  userId,
  categories,
  accounts = [],
  editingReminder,
  onSuccess,
  prefillDate,
}: BodyProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState(() => initialForm(editingReminder, prefillDate))
  const [showAllCategories, setShowAllCategories] = useState(false)
  const set = (patch: Partial<typeof formData>) => setFormData((prev) => ({ ...prev, ...patch }))

  const typeCategories = useMemo(
    () =>
      categories
        .filter((c) => c.type === formData.type || c.type === 'both')
        .sort((a, b) => a.name.localeCompare(b.name)),
    [categories, formData.type]
  )
  const visibleCategories = useMemo(() => {
    if (showAllCategories) return typeCategories
    const top = typeCategories.slice(0, TOP_CATEGORIES)
    const selected = typeCategories.find((c) => c.id === formData.category_id)
    if (selected && !top.includes(selected)) top.push(selected)
    return top
  }, [typeCategories, showAllCategories, formData.category_id])

  const rule = {
    is_active: true,
    frequency: formData.frequency,
    specific_date: formData.frequency === 'once' ? formData.specific_date : null,
    day_of_week: formData.frequency === 'weekly' ? formData.day_of_week : null,
    day_of_month: formData.frequency === 'monthly' || formData.frequency === 'yearly' ? formData.day_of_month : null,
    month_of_year: formData.frequency === 'yearly' ? formData.month_of_year : null,
  }
  const next = nextOccurrence(rule)

  // Yearly is picked with the calendar: day + month of this year.
  const yearlyDate = (() => {
    const year = new Date().getFullYear()
    const last = new Date(year, formData.month_of_year, 0).getDate()
    return `${year}-${pad(formData.month_of_year)}-${pad(Math.min(formData.day_of_month, last))}`
  })()

  const ruleLabel = (() => {
    switch (formData.frequency) {
      case 'once':
        return `Una vez, el ${shortDate(new Date(`${formData.specific_date}T12:00:00`))}`
      case 'weekly':
        return `Cada semana, los ${WEEKDAYS.find((w) => w.value === formData.day_of_week)?.name}`
      case 'monthly':
        return `Cada mes, el día ${formData.day_of_month}`
      case 'yearly':
        return `Cada año, el ${shortDate(new Date(`${yearlyDate}T12:00:00`))}`
    }
  })()
  const shortMonths =
    (formData.frequency === 'monthly' || formData.frequency === 'yearly') && formData.day_of_month > 28

  const handleSubmit = async () => {
    setLoading(true)
    const payload = {
      description: formData.description.trim(),
      type: formData.type,
      category_id: formData.category_id || null,
      account_id: formData.account_id || null,
      ...rule,
    }

    const result = editingReminder
      ? await updateReminder(userId, editingReminder.id, payload)
      : await createReminder(userId, payload)

    if (result.success) {
      toaster.create({
        title: `${editingReminder ? 'Recordatorio actualizado' : 'Recordatorio creado'} · ${payload.description}`,
        type: 'success',
        duration: 2600,
      })
      onSuccess()
      onClose()
    } else {
      toaster.create({ title: 'Error', description: result.error, type: 'error', duration: 4000 })
    }
    setLoading(false)
  }

  return (
    <FormModalContent
      title={editingReminder ? 'Editar recordatorio' : 'Nuevo recordatorio'}
      onClose={onClose}
      header={
        <Flex align="center" gap={3} wrap="wrap">
          <SegmentedControl
            label="Tipo"
            value={formData.type}
            onChange={(type) => {
              const keep = categories.find((c) => c.id === formData.category_id)
              set({ type, category_id: keep && (keep.type === type || keep.type === 'both') ? keep.id : '' })
            }}
            options={[
              { value: 'expense', label: 'Gasto', icon: LuArrowUpRight, tone: 'neg' },
              { value: 'income', label: 'Ingreso', icon: LuArrowDownLeft, tone: 'pos' },
            ]}
          />
          <Text fontSize="13px" color="text3">
            {editingReminder ? 'Editar recordatorio' : 'Nuevo recordatorio'}
          </Text>
        </Flex>
      }
      onSubmit={handleSubmit}
      canSubmit={!!formData.description.trim()}
      loading={loading}
      submitLabel={editingReminder ? 'Guardar cambios' : 'Crear recordatorio'}
    >
      <TitleInput
        value={formData.description}
        onChange={(e) => set({ description: e.target.value })}
        placeholder={formData.type === 'expense' ? '¿Qué hay que pagar? Ej: Pago arriendo' : '¿Qué vas a recibir? Ej: Salario'}
        aria-label="Descripción"
        autoFocus={!editingReminder}
      />

      <Field label="Categoría" optional>
        <Flex wrap="wrap" gap={2}>
          {visibleCategories.map((c) => (
            <Chip
              key={c.id}
              selected={formData.category_id === c.id}
              onClick={() => set({ category_id: formData.category_id === c.id ? '' : c.id })}
            >
              {c.icon && <span>{c.icon}</span>}
              {c.name}
            </Chip>
          ))}
          {typeCategories.length > TOP_CATEGORIES && (
            <Button
              onClick={() => setShowAllCategories((v) => !v)}
              h="36px"
              px={3.5}
              fontSize="13px"
              variant="ghost"
              color="text2"
            >
              {showAllCategories ? 'Ver menos' : 'Ver todas'}
            </Button>
          )}
        </Flex>
      </Field>

      {accounts.length > 0 && (
        <Field label={formData.type === 'expense' ? 'Se paga con' : 'Entra a'}>
          <AccountChips
            accounts={accounts}
            value={formData.account_id}
            onChange={(account_id) => set({ account_id })}
            leading={{ value: '', label: '⭐ Cuenta por defecto', hint: 'Se decide al pagar' }}
          />
        </Field>
      )}

      <Field label="Frecuencia">
        <SegmentedControl
          label="Frecuencia"
          value={formData.frequency}
          onChange={(frequency) => set({ frequency })}
          options={FREQUENCIES}
          fullWidth
        />
        <Box mt={3}>
          {formData.frequency === 'monthly' && (
            <Grid
              templateColumns="repeat(7, 1fr)"
              gap={1.5}
              bg="surface2"
              borderRadius="tile"
              p={3}
              role="radiogroup"
              aria-label="Día del mes"
            >
              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
                const selected = formData.day_of_month === day
                return (
                  <Button
                    key={day}
                    role="radio"
                    aria-checked={selected}
                    onClick={() => set({ day_of_month: day })}
                    h="34px"
                    minW={0}
                    p={0}
                    borderRadius="10px"
                    fontFamily="mono"
                    fontSize="12px"
                    bg={selected ? 'brandSolid' : 'transparent'}
                    color={selected ? 'white' : 'text2'}
                    _hover={{ bg: selected ? 'brandSolid' : 'line' }}
                  >
                    {day}
                  </Button>
                )
              })}
            </Grid>
          )}
          {formData.frequency === 'weekly' && (
            <Grid templateColumns="repeat(7, 1fr)" gap={1.5} role="radiogroup" aria-label="Día de la semana">
              {WEEKDAYS.map((w) => (
                <Chip
                  key={w.value}
                  role="radio"
                  aria-checked={formData.day_of_week === w.value}
                  aria-label={w.name}
                  selected={formData.day_of_week === w.value}
                  onClick={() => set({ day_of_week: w.value })}
                  h="44px"
                  minW={0}
                  px={0}
                  fontFamily="mono"
                >
                  {w.short}
                </Chip>
              ))}
            </Grid>
          )}
          {formData.frequency === 'once' && (
            <DateField
              value={formData.specific_date}
              onChange={(specific_date) => set({ specific_date })}
              disableFuture={false}
            />
          )}
          {formData.frequency === 'yearly' && (
            <DateField
              value={yearlyDate}
              onChange={(date) => {
                const [, m, d] = date.split('-').map(Number)
                set({ month_of_year: m, day_of_month: d })
              }}
              disableFuture={false}
            />
          )}
        </Box>
      </Field>

      <SummaryBox icon={LuBell} tone="brand">
        <Text fontWeight="500">{ruleLabel}</Text>
        <Text color="text2" mt={0.5}>
          {next
            ? `Próximo: ${shortDate(next)} · aparece en tus pendientes ${LOOKAHEAD_DAYS} días antes`
            : 'Esta fecha ya pasó: no volverá a aparecer en tus pendientes'}
        </Text>
        {shortMonths && (
          <Text color="text3" mt={0.5}>
            En meses más cortos te avisamos el último día.
          </Text>
        )}
      </SummaryBox>
    </FormModalContent>
  )
}

/** Pulso "Nuevo recordatorio" / "Editar recordatorio": one-off and recurring in one modal. */
export function ReminderForm({ isOpen, ...props }: Props) {
  return (
    <FormModal
      isOpen={isOpen}
      onClose={props.onClose}
      title={props.editingReminder ? 'Editar recordatorio' : 'Nuevo recordatorio'}
    >
      <ReminderFormBody {...props} />
    </FormModal>
  )
}
