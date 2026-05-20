'use client'

import { VStack, HStack, Text, Box } from '@chakra-ui/react'
import { useState, useEffect } from 'react'
import { createReminder, updateReminder } from '@/lib/actions/reminders.actions'
import { toaster } from '@/lib/toaster'
import { FormDialog } from '@/components/ui/FormDialog'
import { FormInput } from '@/components/ui/FormInput'
import { DateInput } from '@/components/ui/DateInput'
import { RadioSelect } from '@/components/ui/RadioSelect'
import { PrimaryButton } from '@/components/ui/PrimaryButton'
import { CategorySelect } from '@/components/ui/CategorySelect'
import type { Category, Reminder } from '@/types/database.types'
import { getLocalDateString } from '@/lib/utils/dates'

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
  { value: '1', label: 'Enero' }, { value: '2', label: 'Febrero' },
  { value: '3', label: 'Marzo' }, { value: '4', label: 'Abril' },
  { value: '5', label: 'Mayo' }, { value: '6', label: 'Junio' },
  { value: '7', label: 'Julio' }, { value: '8', label: 'Agosto' },
  { value: '9', label: 'Septiembre' }, { value: '10', label: 'Octubre' },
  { value: '11', label: 'Noviembre' }, { value: '12', label: 'Diciembre' },
]

interface Props {
  isOpen: boolean
  onClose: () => void
  userId: string
  categories: Category[]
  editingReminder?: Reminder | null
  onSuccess: () => void
}

const defaultForm = {
  description: '',
  category_id: '',
  frequency: 'monthly' as 'once' | 'weekly' | 'monthly' | 'yearly',
  day_of_week: 1,
  day_of_month: 1,
  month_of_year: 1,
  specific_date: getLocalDateString(),
}

export function ReminderForm({ isOpen, onClose, userId, categories, editingReminder, onSuccess }: Props) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState(defaultForm)

  useEffect(() => {
    if (editingReminder) {
      setFormData({
        description: editingReminder.description,
        category_id: editingReminder.category_id ?? '',
        frequency: editingReminder.frequency,
        day_of_week: editingReminder.day_of_week ?? 1,
        day_of_month: editingReminder.day_of_month ?? 1,
        month_of_year: editingReminder.month_of_year ?? 1,
        specific_date: editingReminder.specific_date ?? getLocalDateString(),
      })
    } else {
      setFormData(defaultForm)
    }
  }, [editingReminder, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const payload = {
      description: formData.description,
      category_id: formData.category_id || null,
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

          <Box w="full">
            <CategorySelect
              value={formData.category_id}
              onChange={(v) => setFormData({ ...formData, category_id: v })}
              categories={categories}
            />
          </Box>

          <RadioSelect
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
            <RadioSelect
              label="Día de la semana"
              value={String(formData.day_of_week)}
              onChange={(v) => setFormData({ ...formData, day_of_week: Number(v) })}
              options={WEEKDAY_OPTIONS}
              required
            />
          )}

          {(formData.frequency === 'monthly' || formData.frequency === 'yearly') && (
            <HStack gap={3} w="full" align="flex-end">
              <Box flex={1}>
                <Text fontSize="sm" color="#B0B0B0" mb={1}>Día del mes</Text>
                <input
                  type="number"
                  min={1}
                  max={31}
                  value={formData.day_of_month}
                  onChange={(e) => setFormData({ ...formData, day_of_month: Number(e.target.value) })}
                  style={{
                    width: '100%',
                    background: '#18181d',
                    border: '1px solid #2d2d35',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: 'white',
                    fontSize: '14px',
                  }}
                  required
                />
              </Box>
              {formData.frequency === 'yearly' && (
                <Box flex={2}>
                  <RadioSelect
                    label="Mes"
                    value={String(formData.month_of_year)}
                    onChange={(v) => setFormData({ ...formData, month_of_year: Number(v) })}
                    options={MONTH_OPTIONS}
                    required
                  />
                </Box>
              )}
            </HStack>
          )}

          <PrimaryButton type="submit" width="full" loading={loading}>
            {editingReminder ? 'Guardar cambios' : 'Crear Recordatorio'}
          </PrimaryButton>
        </VStack>
      </form>
    </FormDialog>
  )
}
