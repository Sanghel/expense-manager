'use client'

import { VStack, HStack, Text, Box, NativeSelectRoot, NativeSelectField, FieldRoot, FieldLabel } from '@chakra-ui/react'
import { useState, useEffect } from 'react'
import { createReminder, updateReminder } from '@/lib/actions/reminders.actions'
import { toaster } from '@/lib/toaster'
import { FormDialog } from '@/components/ui/FormDialog'
import { FormInput } from '@/components/ui/FormInput'
import { DateInput } from '@/components/ui/DateInput'
import { SelectField } from '@/components/ui/SelectField'
import { PrimaryButton } from '@/components/ui/PrimaryButton'
import { CategorySelect } from '@/components/ui/CategorySelect'
import { AccountSelect } from '@/components/ui/AccountSelect'
import type { Account, Category, Reminder, ReminderType } from '@/types/database.types'
import { getLocalDateString } from '@/lib/utils/dates'

const TYPE_OPTIONS = [
  { value: 'expense', label: 'Gasto' },
  { value: 'income', label: 'Ingreso' },
]

const FREQUENCY_OPTIONS = [
  { value: 'once', label: 'Una vez' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'monthly', label: 'Mensual' },
  { value: 'yearly', label: 'Anual' },
]

const WEEKDAY_OPTIONS = [
  { value: '0', label: 'Domingo' },
  { value: '1', label: 'Lunes' },
  { value: '2', label: 'Martes' },
  { value: '3', label: 'Miércoles' },
  { value: '4', label: 'Jueves' },
  { value: '5', label: 'Viernes' },
  { value: '6', label: 'Sábado' },
]

const MONTH_OPTIONS = [
  { value: 1, label: 'Enero' }, { value: 2, label: 'Febrero' },
  { value: 3, label: 'Marzo' }, { value: 4, label: 'Abril' },
  { value: 5, label: 'Mayo' }, { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' }, { value: 8, label: 'Agosto' },
  { value: 9, label: 'Septiembre' }, { value: 10, label: 'Octubre' },
  { value: 11, label: 'Noviembre' }, { value: 12, label: 'Diciembre' },
]

const DAY_OF_MONTH_OPTIONS = Array.from({ length: 31 }, (_, i) => i + 1)

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

const defaultForm = {
  description: '',
  type: 'expense' as ReminderType,
  category_id: '',
  account_id: '',
  frequency: 'monthly' as 'once' | 'weekly' | 'monthly' | 'yearly',
  day_of_week: 1,
  day_of_month: 1,
  month_of_year: 1,
  specific_date: getLocalDateString(),
}

export function ReminderForm({ isOpen, onClose, userId, categories, accounts = [], editingReminder, onSuccess, prefillDate }: Props) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState(defaultForm)

  useEffect(() => {
    if (editingReminder) {
      setFormData({
        description: editingReminder.description,
        type: editingReminder.type ?? 'expense',
        category_id: editingReminder.category_id ?? '',
        account_id: editingReminder.account_id ?? '',
        frequency: editingReminder.frequency,
        day_of_week: editingReminder.day_of_week ?? 1,
        day_of_month: editingReminder.day_of_month ?? 1,
        month_of_year: editingReminder.month_of_year ?? 1,
        specific_date: editingReminder.specific_date ?? getLocalDateString(),
      })
    } else if (prefillDate) {
      const d = new Date(prefillDate + 'T12:00:00')
      setFormData({
        ...defaultForm,
        frequency: 'once',
        specific_date: prefillDate,
        day_of_week: d.getDay(),
        day_of_month: d.getDate(),
        month_of_year: d.getMonth() + 1,
      })
    } else {
      setFormData(defaultForm)
    }
  }, [editingReminder, isOpen, prefillDate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const payload = {
      description: formData.description,
      type: formData.type,
      category_id: formData.category_id || null,
      account_id: formData.account_id || null,
      frequency: formData.frequency,
      day_of_week: formData.frequency === 'weekly' ? formData.day_of_week : null,
      day_of_month: (formData.frequency === 'monthly' || formData.frequency === 'yearly') ? formData.day_of_month : null,
      month_of_year: formData.frequency === 'yearly' ? formData.month_of_year : null,
      specific_date: formData.frequency === 'once' ? formData.specific_date : null,
      is_active: true,
    }

    const result = editingReminder
      ? await updateReminder(userId, editingReminder.id, payload)
      : await createReminder(userId, payload)

    if (result.success) {
      toaster.create({ title: editingReminder ? 'Recordatorio actualizado' : 'Recordatorio creado', type: 'success', duration: 3000 })
      onSuccess()
      onClose()
    } else {
      toaster.create({ title: 'Error', description: result.error, type: 'error', duration: 4000 })
    }
    setLoading(false)
  }

  return (
    <FormDialog
      isOpen={isOpen}
      onClose={onClose}
      title={editingReminder ? 'Editar Recordatorio' : 'Nuevo Recordatorio'}
    >
      <form onSubmit={handleSubmit}>
        <VStack gap={4}>
          <FormInput
            label="Descripción"
            value={formData.description}
            onChange={(v) => setFormData({ ...formData, description: v })}
            placeholder="Ej: Pago arriendo"
            required
          />

          <SelectField
            label="Tipo"
            value={formData.type}
            onChange={(v) => setFormData({ ...formData, type: v as ReminderType })}
            options={TYPE_OPTIONS}
            required
          />

          <Box w="full">
            <CategorySelect
              value={formData.category_id}
              onChange={(v) => setFormData({ ...formData, category_id: v })}
              categories={categories}
            />
          </Box>

          {accounts.length > 0 && (
            <AccountSelect
              label="Cuenta"
              optional
              value={formData.account_id}
              onChange={(v) => setFormData({ ...formData, account_id: v })}
              accounts={accounts}
              placeholder="Usar cuenta por defecto al pagar"
            />
          )}

          <SelectField
            label="Frecuencia"
            value={formData.frequency}
            onChange={(v) => setFormData({ ...formData, frequency: v as typeof formData.frequency })}
            options={FREQUENCY_OPTIONS}
            required
          />

          {formData.frequency === 'once' && (
            <DateInput
              label="Fecha"
              value={formData.specific_date}
              onChange={(v) => setFormData({ ...formData, specific_date: v })}
              required
            />
          )}

          {formData.frequency === 'weekly' && (
            <FieldRoot required w="full">
              <FieldLabel>Día de la semana</FieldLabel>
              <NativeSelectRoot>
                <NativeSelectField
                  value={String(formData.day_of_week)}
                  onChange={(e) => setFormData({ ...formData, day_of_week: Number(e.target.value) })}
                >
                  {WEEKDAY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </NativeSelectField>
              </NativeSelectRoot>
            </FieldRoot>
          )}

          {(formData.frequency === 'monthly' || formData.frequency === 'yearly') && (
            <VStack w="full" gap={2} align="stretch">
              <HStack gap={3} w="full" align="flex-end">
                <FieldRoot required flex={1}>
                  <FieldLabel>Día del mes</FieldLabel>
                  <NativeSelectRoot>
                    <NativeSelectField
                      value={String(formData.day_of_month)}
                      onChange={(e) => setFormData({ ...formData, day_of_month: Number(e.target.value) })}
                    >
                      {DAY_OF_MONTH_OPTIONS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </NativeSelectField>
                  </NativeSelectRoot>
                </FieldRoot>
                {formData.frequency === 'yearly' && (
                  <FieldRoot required flex={2}>
                    <FieldLabel>Mes</FieldLabel>
                    <NativeSelectRoot>
                      <NativeSelectField
                        value={String(formData.month_of_year)}
                        onChange={(e) => setFormData({ ...formData, month_of_year: Number(e.target.value) })}
                      >
                        {MONTH_OPTIONS.map((m) => (
                          <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                      </NativeSelectField>
                    </NativeSelectRoot>
                  </FieldRoot>
                )}
              </HStack>
              {formData.day_of_month > 28 && (
                <Text fontSize="xs" color="#B0B0B0">
                  Si el mes no tiene este día, se usará el último día disponible.
                </Text>
              )}
            </VStack>
          )}

          <PrimaryButton type="submit" width="full" loading={loading}>
            {editingReminder ? 'Guardar cambios' : 'Crear Recordatorio'}
          </PrimaryButton>
        </VStack>
      </form>
    </FormDialog>
  )
}
