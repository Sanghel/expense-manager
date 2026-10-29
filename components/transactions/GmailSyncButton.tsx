'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@chakra-ui/react'
import { LuMail } from 'react-icons/lu'
import { ActionIconButton } from '@/components/ui/ActionIconButton'
import { syncGmail } from '@/lib/actions/gmail.actions'
import { toaster } from '@/lib/toaster'
import { GmailSyncReviewModal } from './GmailSyncReviewModal'
import type { Account, Category } from '@/types/database.types'
import type { ParsedItem } from '@/lib/gmail/process'

interface Props {
  userId: string
  categories: Category[]
  accounts: Account[]
  /** `rail`: full-width labeled button for the Transacciones side rail. */
  variant?: 'icon' | 'rail'
}

export function GmailSyncButton({ userId, categories, accounts, variant = 'icon' }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [sync, setSync] = useState<{ items: ParsedItem[]; syncedAt: string } | null>(null)

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
    setSync({ items: result.items, syncedAt: result.syncedAt })
  }

  return (
    <>
      {variant === 'rail' ? (
        <Button
          onClick={handleClick}
          loading={loading}
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
          <LuMail />
          Sincronizar Gmail
        </Button>
      ) : (
        <ActionIconButton
          kind="syncMail"
          label="Sincronizar correos"
          variant="ghost"
          size="md"
          onClick={handleClick}
          loading={loading}
        />
      )}

      {sync && (
        <GmailSyncReviewModal
          isOpen={true}
          onClose={() => setSync(null)}
          userId={userId}
          items={sync.items}
          syncedAt={sync.syncedAt}
          categories={categories}
          accounts={accounts}
          onDone={() => router.refresh()}
        />
      )}
    </>
  )
}
