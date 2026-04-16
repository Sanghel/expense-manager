'use client'

import { VStack, Heading, Button, HStack } from '@chakra-ui/react'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { RecurringTransactionForm } from '@/components/recurring/RecurringTransactionForm'
import { RecurringTransactionsList } from '@/components/recurring/RecurringTransactionsList'
import { getCategories } from '@/lib/actions/categories.actions'
import { useEffect } from 'react'
import type { Category } from '@/types/database.types'

export default function RecurringTransactionsPage() {
  const { data: session } = useSession()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    const loadCategories = async () => {
      if (session?.user?.email) {
        const result = await getCategories(session.user.id as string)
        if (result.success) {
          setCategories(result.data || [])
        }
      }
    }
    loadCategories()
  }, [session])

  if (!session?.user?.id) return null

  return (
    <VStack alignItems="flex-start" gap={6}>
      <HStack justifyContent="space-between" width="100%">
        <Heading size="lg">Gastos Recurrentes</Heading>
        <Button onClick={() => setIsFormOpen(true)}>+ Crear Recurrente</Button>
      </HStack>

      <RecurringTransactionForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        userId={session.user.id}
        categories={categories}
        onSuccess={() => {
          setRefresh(prev => prev + 1)
          setIsFormOpen(false)
        }}
      />

      <RecurringTransactionsList userId={session.user.id} refresh={refresh} />
    </VStack>
  )
}
