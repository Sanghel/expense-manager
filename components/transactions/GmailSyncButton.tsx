'use client'

import { Button, Text } from '@chakra-ui/react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FiMail } from 'react-icons/fi'
import { syncGmail } from '@/lib/actions/gmail.actions'
import { toaster } from '@/lib/toaster'
import { GmailSyncReviewModal } from './GmailSyncReviewModal'
import type { Account, Category } from '@/types/database.types'
import type { ParsedItem } from '@/lib/gmail/process'

interface Props {
  userId: string
  categories: Category[]
  accounts: Account[]
}

export function GmailSyncButton({ userId, categories, accounts }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<ParsedItem[] | null>(null)

  const handleClick = async () => {
    setLoading(true)
    const result = await syncGmail()
    setLoading(false)

    if (!result.success) {
      toaster.create({
        title: 'No se pudo sincronizar',
        description: result.error,
        type: 'error',
        duration: 5000,
      })
      return
    }
    if (result.items.length === 0) {
      toaster.create({
        title: 'Sin correos nuevos',
        description: `Procesados ${result.scanned} · Omitidos ${result.skipped}${
          result.errors > 0 ? ` · Errores ${result.errors}` : ''
        }`,
        type: 'info',
        duration: 4000,
      })
      return
    }
    setItems(result.items)
  }

  return (
    <>
      <Button
        variant="outline"
        onClick={handleClick}
        size={{ base: 'sm', md: 'md' }}
        loading={loading}
      >
        <FiMail />
        <Text display={{ base: 'none', sm: 'inline' }}>Sincronizar correos</Text>
        <Text display={{ base: 'inline', sm: 'none' }}>Gmail</Text>
      </Button>

      {items && (
        <GmailSyncReviewModal
          isOpen={true}
          onClose={() => setItems(null)}
          userId={userId}
          items={items}
          categories={categories}
          accounts={accounts}
          onDone={() => router.refresh()}
        />
      )}
    </>
  )
}
