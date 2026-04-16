'use client'

import {
  DialogRoot,
  DialogBackdrop,
  DialogPositioner,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogCloseTrigger,
  VStack,
  FieldRoot,
  FieldLabel,
  Input,
  NativeSelectRoot,
  NativeSelectField,
  Button,
  RadioGroupRoot,
  RadioGroupItem,
  RadioGroupItemControl,
  RadioGroupItemText,
  HStack,
} from '@chakra-ui/react'
import { useState } from 'react'
import { createRecurringTransaction } from '@/lib/actions/recurring.actions'
import { toaster } from '@/lib/toaster'
import type { Category } from '@/types/database.types'

interface Props {
  isOpen: boolean
  onClose: () => void
  userId: string
  categories: Category[]
  onSuccess: () => void
}

const defaultForm = {
  type: 'expense' as 'income' | 'expense',
  amount: '',
  currency: 'COP' as 'COP' | 'USD' | 'VES',
  category_id: '',
  description: '',
  frequency: 'monthly' as 'daily' | 'weekly' | 'monthly' | 'yearly',
  start_date: new Date().toISOString().split('T')[0],
  end_date: '',
}

export function RecurringTransactionForm({ isOpen, onClose, userId, categories, onSuccess }: Props) {
  const [form, setForm] = useState(defaultForm)
  const [loading, setLoading] = useState(false)

  const handleChange = (field: string, value: any) => {
    const actualValue = typeof value === 'object' && value?.value ? value.value : value
    setForm(prev => ({ ...prev, [field]: actualValue }))
  }

  const handleSubmit = async () => {
    if (!form.amount || !form.category_id || !form.description) {
      toaster.error({ title: 'Please fill in all required fields' })
      return
    }

    setLoading(true)
    const result = await createRecurringTransaction(userId, {
      amount: parseFloat(form.amount as string),
      currency: form.currency,
      type: form.type,
      category_id: form.category_id,
      description: form.description,
      frequency: form.frequency,
      start_date: form.start_date,
      end_date: form.end_date || undefined,
    })

    setLoading(false)

    if (result.success) {
      toaster.success({ title: 'Recurring transaction created' })
      setForm(defaultForm)
      onClose()
      onSuccess()
    } else {
      toaster.error({ title: result.error || 'Failed to create recurring transaction' })
    }
  }

  return (
    <DialogRoot open={isOpen} onOpenChange={details => !details.open && onClose()}>
      <DialogBackdrop />
      <DialogPositioner>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Recurring Transaction</DialogTitle>
            <DialogCloseTrigger />
          </DialogHeader>
          <DialogBody>
            <VStack gap="4">
              <RadioGroupRoot
                value={form.type}
                onValueChange={value => handleChange('type', value)}
              >
                <RadioGroupItem value="income">
                  <RadioGroupItemControl />
                  <RadioGroupItemText>Income</RadioGroupItemText>
                </RadioGroupItem>
                <RadioGroupItem value="expense">
                  <RadioGroupItemControl />
                  <RadioGroupItemText>Expense</RadioGroupItemText>
                </RadioGroupItem>
              </RadioGroupRoot>

              <FieldRoot>
                <FieldLabel>Amount</FieldLabel>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={form.amount}
                  onChange={e => handleChange('amount', e.target.value)}
                  step="0.01"
                />
              </FieldRoot>

              <FieldRoot>
                <FieldLabel>Currency</FieldLabel>
                <NativeSelectRoot>
                  <NativeSelectField
                    value={form.currency}
                    onChange={e => handleChange('currency', e.target.value)}
                  >
                    <option value="COP">COP</option>
                    <option value="USD">USD</option>
                    <option value="VES">VES</option>
                  </NativeSelectField>
                </NativeSelectRoot>
              </FieldRoot>

              <FieldRoot>
                <FieldLabel>Category</FieldLabel>
                <NativeSelectRoot>
                  <NativeSelectField
                    value={form.category_id}
                    onChange={e => handleChange('category_id', e.target.value)}
                  >
                    <option value="">Select category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </NativeSelectField>
                </NativeSelectRoot>
              </FieldRoot>

              <FieldRoot>
                <FieldLabel>Description</FieldLabel>
                <Input
                  placeholder="e.g., Netflix subscription"
                  value={form.description}
                  onChange={e => handleChange('description', e.target.value)}
                />
              </FieldRoot>

              <FieldRoot>
                <FieldLabel>Frequency</FieldLabel>
                <NativeSelectRoot>
                  <NativeSelectField
                    value={form.frequency}
                    onChange={e => handleChange('frequency', e.target.value)}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </NativeSelectField>
                </NativeSelectRoot>
              </FieldRoot>

              <FieldRoot>
                <FieldLabel>Start Date</FieldLabel>
                <Input
                  type="date"
                  value={form.start_date}
                  onChange={e => handleChange('start_date', e.target.value)}
                />
              </FieldRoot>

              <FieldRoot>
                <FieldLabel>End Date (Optional)</FieldLabel>
                <Input
                  type="date"
                  value={form.end_date}
                  onChange={e => handleChange('end_date', e.target.value)}
                />
              </FieldRoot>

              <HStack width="100%" justifyContent="flex-end" gap="2">
                <Button onClick={onClose} variant="outline">
                  Cancel
                </Button>
                <Button onClick={handleSubmit} loading={loading}>
                  Create
                </Button>
              </HStack>
            </VStack>
          </DialogBody>
        </DialogContent>
      </DialogPositioner>
    </DialogRoot>
  )
}
