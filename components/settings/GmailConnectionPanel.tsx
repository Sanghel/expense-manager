'use client'

import { Box, Button, Flex, Text } from '@chakra-ui/react'
import { useState, type ReactNode } from 'react'
import { signIn, signOut } from 'next-auth/react'
import { LuMail, LuUnplug } from 'react-icons/lu'
import { SettingsSection } from './SettingsSection'
import { disconnectGmail } from '@/lib/actions/gmail.actions'
import { toaster } from '@/lib/toaster'

interface Props {
  connected: boolean
  connectedAt: string | null
  lastSyncedAt: string | null
  /** Sync button that opens the review dialog (shown when connected). */
  syncButton?: ReactNode
}

function formatTimestamp(iso: string | null): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })
  } catch {
    return iso
  }
}

export function GmailConnectionPanel({ connected, connectedAt, lastSyncedAt, syncButton }: Props) {
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
    <SettingsSection
      title="Gmail"
      description="Lee tus correos bancarios y te propone las transacciones para que las revises."
      aside={
        <Text
          as="span"
          fontSize="12px"
          fontWeight="500"
          px={2.5}
          py={0.5}
          borderRadius="pill"
          bg={connected ? 'posSoft' : 'surface2'}
          color={connected ? 'pos' : 'text3'}
          flexShrink={0}
        >
          ● {connected ? 'Conectado' : 'Desconectado'}
        </Text>
      }
    >
      {connected && (
        <Box fontFamily="mono" fontSize="12px" color="text3" mb={4}>
          <Text>Conectado · {formatTimestamp(connectedAt)}</Text>
          <Text>Última sincronización · {formatTimestamp(lastSyncedAt)}</Text>
        </Box>
      )}

      <Flex gap={2} wrap="wrap">
        {connected ? (
          <>
            {syncButton}
            <Button
              onClick={handleDisconnect}
              loading={disconnecting}
              variant="ghost"
              color="neg"
              _hover={{ bg: 'negSoft' }}
            >
              <LuUnplug />
              Desconectar
            </Button>
          </>
        ) : (
          <Button onClick={handleConnect} bg="brandSolid" color="white" _hover={{ bg: 'brand.600' }}>
            <LuMail />
            Conectar Gmail
          </Button>
        )}
      </Flex>
    </SettingsSection>
  )
}
