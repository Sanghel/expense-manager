'use client'

import { Box, Button, HStack, Text, Badge } from '@chakra-ui/react'
import { useState, useTransition } from 'react'
import { signIn, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { FiMail, FiRefreshCw } from 'react-icons/fi'
import { disconnectGmail, syncGmail } from '@/lib/actions/gmail.actions'
import { toaster } from '@/lib/toaster'

interface Props {
  connected: boolean
  connectedAt: string | null
  lastSyncedAt: string | null
}

function formatTimestamp(iso: string | null): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

export function GmailConnectionPanel({ connected, connectedAt, lastSyncedAt }: Props) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [syncing, setSyncing] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)

  const handleSync = async () => {
    setSyncing(true)
    const result = await syncGmail()
    setSyncing(false)
    if (!result.success) {
      toaster.create({ title: 'Error', description: result.error, type: 'error', duration: 5000 })
      return
    }
    const { scanned, autoRegistered, drafted, skipped, errors } = result.data
    toaster.create({
      title: 'Sincronización completa',
      description: `${scanned} procesados · ${autoRegistered} auto · ${drafted} pendientes · ${skipped} omitidos${
        errors > 0 ? ` · ${errors} errores` : ''
      }`,
      type: errors > 0 ? 'warning' : 'success',
      duration: 6000,
    })
    startTransition(() => router.refresh())
  }

  const handleDisconnect = async () => {
    setDisconnecting(true)
    const result = await disconnectGmail()
    setDisconnecting(false)
    if (!result.success) {
      toaster.create({ title: 'Error', description: result.error, type: 'error', duration: 4000 })
      return
    }
    // Force a full Google sign-out so the next login re-prompts for Gmail consent
    await signOut({ callbackUrl: '/login' })
  }

  const handleConnect = () => {
    // Forces Google to show the consent screen and return a fresh refresh_token
    signIn('google', { callbackUrl: '/settings' })
  }

  return (
    <Box>
      <HStack mb={1} gap={2}>
        <FiMail color="#B0B0B0" />
        <Text fontWeight="semibold" color="white">
          Gmail (auto-registro Bancolombia)
        </Text>
        {connected ? (
          <Badge colorPalette="green">Conectado</Badge>
        ) : (
          <Badge colorPalette="gray">Desconectado</Badge>
        )}
      </HStack>
      <Text fontSize="sm" color="#B0B0B0" mb={3}>
        Lee tus correos de Bancolombia y registra automáticamente compras y
        transferencias. Las transacciones con confianza baja quedan en
        Pendientes para que las revises.
      </Text>

      {connected && (
        <Box fontSize="sm" color="#B0B0B0" mb={3}>
          <Text>Conectado: {formatTimestamp(connectedAt)}</Text>
          <Text>Última sincronización: {formatTimestamp(lastSyncedAt)}</Text>
        </Box>
      )}

      <HStack gap={2}>
        {connected ? (
          <>
            <Button onClick={handleSync} loading={syncing} bg="#4F46E5" color="white" _hover={{ bg: '#4338CA' }}>
              <FiRefreshCw />
              Sincronizar ahora
            </Button>
            <Button onClick={handleDisconnect} loading={disconnecting} variant="outline">
              Desconectar
            </Button>
          </>
        ) : (
          <Button onClick={handleConnect} bg="#4F46E5" color="white" _hover={{ bg: '#4338CA' }}>
            <FiMail />
            Conectar Gmail
          </Button>
        )}
      </HStack>
    </Box>
  )
}
