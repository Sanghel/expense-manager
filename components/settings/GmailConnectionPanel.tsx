'use client'

import { Box, Button, HStack, Text, Badge } from '@chakra-ui/react'
import { useState } from 'react'
import { signIn, signOut } from 'next-auth/react'
import { FiMail } from 'react-icons/fi'
import { disconnectGmail } from '@/lib/actions/gmail.actions'
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
  const [disconnecting, setDisconnecting] = useState(false)

  const handleDisconnect = async () => {
    setDisconnecting(true)
    const result = await disconnectGmail()
    setDisconnecting(false)
    if (!result.success) {
      toaster.create({ title: 'Error', description: result.error, type: 'error', duration: 4000 })
      return
    }
    await signOut({ callbackUrl: '/login' })
  }

  const handleConnect = () => {
    signIn('google', { callbackUrl: '/settings' })
  }

  return (
    <Box>
      <HStack mb={1} gap={2}>
        <FiMail color="#B0B0B0" />
        <Text fontWeight="semibold" color="white">
          Gmail (auto-registro de transacciones)
        </Text>
        {connected ? (
          <Badge colorPalette="green">Conectado</Badge>
        ) : (
          <Badge colorPalette="gray">Desconectado</Badge>
        )}
      </HStack>
      <Text fontSize="sm" color="#B0B0B0" mb={3}>
        Lee tus correos bancarios y registra automáticamente las transacciones.
        Para sincronizar manualmente, usa el botón en Movimientos.
      </Text>

      {connected && (
        <Box fontSize="sm" color="#B0B0B0" mb={3}>
          <Text>Conectado: {formatTimestamp(connectedAt)}</Text>
          <Text>Última sincronización: {formatTimestamp(lastSyncedAt)}</Text>
        </Box>
      )}

      <HStack gap={2}>
        {connected ? (
          <Button onClick={handleDisconnect} loading={disconnecting} variant="outline">
            Desconectar
          </Button>
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
