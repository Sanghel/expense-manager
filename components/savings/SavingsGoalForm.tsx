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
  HStack,
} from '@chakra-ui/react'
import { useState } from 'react'
import { createSavingsGoal } from '@/lib/actions/savings.actions'
import { toaster } from '@/lib/toaster'

interface Props {
  isOpen: boolean
  onClose: () => void
  userId: string
  onSuccess: () => void
}

export function SavingsGoalForm({ isOpen, onClose, userId, onSuccess }: Props) {
  const [form, setForm] = useState({
    name: '',
    target_amount: '',
    currency: 'COP' as 'COP' | 'USD' | 'VES',
    deadline: '',
  })
  const [loading, setLoading] = useState(false)

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    if (!form.name || !form.target_amount) {
      toaster.error('Please fill in required fields')
      return
    }

    setLoading(true)
    const result = await createSavingsGoal(userId, {
      name: form.name,
      target_amount: parseFloat(form.target_amount),
      currency: form.currency,
      deadline: form.deadline || undefined,
    })

    setLoading(false)

    if (result.success) {
      toaster.success('Savings goal created')
      setForm({ name: '', target_amount: '', currency: 'COP', deadline: '' })
      onClose()
      onSuccess()
    } else {
      toaster.error(result.error)
    }
  }

  return (
    <DialogRoot isOpen={isOpen} onOpenChange={{ onOpenChange: onClose }}>
      <DialogBackdrop />
      <DialogPositioner>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Savings Goal</DialogTitle>
            <DialogCloseTrigger />
          </DialogHeader>
          <DialogBody>
            <VStack gap="4">
              <FieldRoot>
                <FieldLabel>Goal Name</FieldLabel>
                <Input
                  placeholder="e.g., Vacation Fund"
                  value={form.name}
                  onChange={e => handleChange('name', e.target.value)}
                />
              </FieldRoot>

              <FieldRoot>
                <FieldLabel>Target Amount</FieldLabel>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={form.target_amount}
                  onChange={e => handleChange('target_amount', e.target.value)}
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
                <FieldLabel>Deadline (Optional)</FieldLabel>
                <Input
                  type="date"
                  value={form.deadline}
                  onChange={e => handleChange('deadline', e.target.value)}
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
