'use client'

import { useState } from 'react'
import { Box, Flex, Text } from '@chakra-ui/react'
import { LuCalendarClock, LuTarget } from 'react-icons/lu'
import { addMonths } from 'date-fns'
import { createSavingsGoal, updateSavingsGoal } from '@/lib/actions/savings.actions'
import { toaster } from '@/lib/toaster'
import { InlineCalendar } from '@/components/ui/InlineCalendar'
import {
  AmountBlock,
  Chip,
  Field,
  FormModal,
  FormModalContent,
  SummaryBox,
  TitleInput,
} from '@/components/ui/pulso'
import { toNumber } from '@/lib/utils/numbers'
import { getSavingsPace } from '@/lib/utils/savings-pace'
import { formatCurrency } from '@/lib/utils/currency'
import { decimalsFor } from '@/lib/utils/amount-input'
import { getLocalDateString } from '@/lib/utils/dates'
import type { Currency, SavingsGoal } from '@/types/database.types'

const PRESETS = [
  { key: '6m', label: '6 meses', months: 6 },
  { key: '1y', label: '1 año', months: 12 },
  { key: '2y', label: '2 años', months: 24 },
] as const

type DeadlineChoice = (typeof PRESETS)[number]['key'] | 'none' | 'custom'

/** "oct 2027" */
const monthYear = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString('es-CO', { month: 'short', year: 'numeric' }).replace('.', '').replace(' de ', ' ')

/** "24 oct 2027" */
const fullDate = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }).replace('.', '').replace(/ de /g, ' ')

const presetDate = (months: number) => getLocalDateString(addMonths(new Date(), months))

interface Props {
  isOpen: boolean
  onClose: () => void
  userId: string
  onSuccess: () => void
  initialData?: SavingsGoal
  goalId?: string
}

function SavingsGoalFormBody({ onClose, userId, onSuccess, initialData, goalId }: Omit<Props, 'isOpen'>) {
  const [form, setForm] = useState({
    name: initialData?.name ?? '',
    target_amount: initialData ? toNumber(initialData.target_amount) || undefined : undefined,
    currency: (initialData?.currency ?? 'COP') as Currency,
    deadline: initialData?.deadline?.slice(0, 10) ?? '',
  })
  // A new goal starts with the "1 año" preset; an existing one keeps its date.
  const [choice, setChoice] = useState<DeadlineChoice>(initialData?.deadline ? 'custom' : initialData ? 'none' : '1y')
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const preset = PRESETS.find((p) => p.key === choice)
  const deadline = preset ? presetDate(preset.months) : choice === 'custom' ? form.deadline : ''

  const fmt = (n: number) => formatCurrency(n, form.currency, decimalsFor(form.currency))

  // The plan: what has to be set aside per month to reach the target in time.
  const pace =
    form.target_amount && deadline
      ? getSavingsPace({
          id: '',
          user_id: '',
          name: form.name,
          target_amount: form.target_amount,
          current_amount: toNumber(initialData?.current_amount ?? 0),
          currency: form.currency,
          deadline,
          is_completed: false,
          created_at: new Date().toISOString(),
        })
      : null

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.target_amount) return
    setLoading(true)
    const payload = {
      name: form.name.trim(),
      target_amount: form.target_amount,
      currency: form.currency,
      // `null`, not `undefined`: an undefined key is dropped from the PATCH
      // body, which would silently keep the previous deadline.
      deadline: deadline || null,
    }

    const result = goalId
      ? await updateSavingsGoal(goalId, userId, payload)
      : await createSavingsGoal(userId, payload)

    setLoading(false)

    if (result.success) {
      toaster.create({
        title: `${goalId ? 'Meta actualizada' : 'Meta de ahorro creada'} · ${payload.name}`,
        type: 'success',
        duration: 2600,
      })
      onClose()
      onSuccess()
    } else {
      toaster.create({ title: 'Error al guardar', description: result.error, type: 'error', duration: 4000 })
    }
  }

  return (
    <FormModalContent
      title={goalId ? 'Editar meta' : 'Nueva meta de ahorro'}
      onClose={onClose}
      onSubmit={handleSubmit}
      canSubmit={!!form.name.trim() && !!form.target_amount}
      loading={loading}
      submitLabel={goalId ? 'Guardar cambios' : 'Crear meta'}
    >
      <TitleInput
        value={form.name}
        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        placeholder="¿Para qué ahorras? Ej: Vacaciones"
        aria-label="Nombre de la meta"
        autoFocus={!goalId}
      />

      <Field label="Monto objetivo">
        <AmountBlock
          amount={form.target_amount}
          currency={form.currency}
          onAmountChange={(target_amount) => setForm((f) => ({ ...f, target_amount }))}
          onCurrencyChange={(currency) => setForm((f) => ({ ...f, currency }))}
          label="Monto objetivo"
        />
      </Field>

      <Field label="¿Para cuándo?">
        <Flex wrap="wrap" gap={2}>
          {PRESETS.map((p) => (
            <Chip
              key={p.key}
              selected={choice === p.key}
              onClick={() => {
                setChoice(p.key)
                setCalendarOpen(false)
              }}
            >
              {p.label}
            </Chip>
          ))}
          <Chip
            selected={choice === 'none'}
            onClick={() => {
              setChoice('none')
              setCalendarOpen(false)
            }}
          >
            Sin fecha
          </Chip>
          <Chip
            selected={choice === 'custom'}
            onClick={() => {
              setChoice('custom')
              setCalendarOpen((open) => choice !== 'custom' || !open)
              if (!form.deadline) setForm((f) => ({ ...f, deadline: presetDate(12) }))
            }}
          >
            📅 {choice === 'custom' && form.deadline ? fullDate(form.deadline) : 'Elegir fecha'}
          </Chip>
        </Flex>
        {calendarOpen && choice === 'custom' && (
          <Box mt={3}>
            <InlineCalendar
              value={form.deadline}
              disableFuture={false}
              onChange={(date) => {
                setForm((f) => ({ ...f, deadline: date }))
                setCalendarOpen(false)
              }}
            />
          </Box>
        )}
      </Field>

      {pace && pace.status !== 'done' && pace.status !== 'overdue' ? (
        <Box bg="brandSoft" borderRadius="input" px={4} py={3.5}>
          <Text fontSize="13px" color="text2">
            Necesitas apartar
          </Text>
          <Text fontFamily="mono" fontSize="24px" fontWeight="500" color="text" letterSpacing="-0.02em" mt={1}>
            {fmt(pace.requiredMonthly)}
          </Text>
          <Text fontSize="13px" color="text2" mt={1}>
            al mes hasta {monthYear(deadline)} ·{' '}
            <Text as="span" fontFamily="mono">
              ≈ {fmt((pace.requiredMonthly * 12) / 52)}
            </Text>{' '}
            / semana
          </Text>
        </Box>
      ) : (
        <SummaryBox icon={pace?.status === 'overdue' ? LuCalendarClock : LuTarget}>
          {pace?.status === 'overdue'
            ? 'La fecha ya pasó: elige una nueva para calcular el plan.'
            : pace?.status === 'done'
              ? 'Ya tienes ahorrado el monto objetivo.'
              : !form.target_amount
                ? 'Escribe el monto objetivo y te decimos cuánto apartar cada mes.'
                : 'Sin fecha límite: elige un plazo para ver cuánto apartar cada mes.'}
        </SummaryBox>
      )}
    </FormModalContent>
  )
}

/** Pulso "Nueva meta de ahorro" / "Editar meta" (same modal, `goalId` for edit). */
export function SavingsGoalForm({ isOpen, ...props }: Props) {
  return (
    <FormModal isOpen={isOpen} onClose={props.onClose} title={props.goalId ? 'Editar meta' : 'Nueva meta de ahorro'}>
      <SavingsGoalFormBody {...props} />
    </FormModal>
  )
}
