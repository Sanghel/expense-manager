'use client'

import { Button, Text } from '@chakra-ui/react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FiMail } from 'react-icons/fi'
import { syncGmail } from '@/lib/actions/gmail.actions'
import { toaster } from '@/lib/toaster'

export function GmailSyncButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

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

    const { scanned, autoRegistered, drafted, skipped, errors } = result.data
    toaster.create({
      title: 'Sincronización completa',
      description: `Procesados ${scanned} · Auto ${autoRegistered} · Pendientes ${drafted} · Omitidos ${skipped}${
        errors > 0 ? ` · Errores ${errors}` : ''
      }`,
      type: errors > 0 ? 'warning' : 'success',
      duration: 6000,
    })
    router.refresh()
  }

  return (
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
  )
}
