'use client'

import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Heading,
  SimpleGrid,
  Badge,
  Separator,
  IconButton,
} from '@chakra-ui/react'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi'
import { deleteAccount } from '@/lib/actions/accounts.actions'
import { deleteAccountMovement } from '@/lib/actions/account_movements.actions'
import { toaster } from '@/lib/toaster'
import { AccountForm } from './AccountForm'
import { AccountMovementForm } from './AccountMovementForm'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { DataTable, type ColumnDef } from '@/components/ui/DataTable'
import { formatCurrency } from '@/lib/utils/currency'
import type { Account, AccountMovementWithAccounts } from '@/types/database.types'

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  bank: 'Banco',
  digital: 'Digital',
  crypto: 'Crypto',
  cash: 'Efectivo',
}

interface Props {
  userId: string
  initialAccounts: Account[]
  initialMovements: AccountMovementWithAccounts[]
}

export function AccountsTab({ userId, initialAccounts, initialMovements }: Props) {
  const router = useRouter()
  const [accounts, setAccounts] = useState<Account[]>(initialAccounts)
  const [movements, setMovements] = useState<AccountMovementWithAccounts[]>(initialMovements)
  const [isAccountFormOpen, setIsAccountFormOpen] = useState(false)
  const [isMovementFormOpen, setIsMovementFormOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [deletingAccountId, setDeletingAccountId] = useState<string | null>(null)
  const [deletingMovementId, setDeletingMovementId] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => { setAccounts(initialAccounts) }, [initialAccounts])
  useEffect(() => { setMovements(initialMovements) }, [initialMovements])

  const handleAccountSuccess = useCallback(() => {
    router.refresh()
    setEditingAccount(null)
  }, [router])

  const handleMovementSuccess = useCallback(() => {
    router.refresh()
  }, [router])

  const handleDeleteAccount = async () => {
    if (!deletingAccountId) return
    setDeleteLoading(true)
    const result = await deleteAccount(deletingAccountId, userId)
    setDeleteLoading(false)
    setDeletingAccountId(null)
    if (result.success) {
      toaster.create({ title: 'Cuenta eliminada', type: 'success', duration: 3000 })
      router.refresh()
    } else {
      toaster.create({ title: result.error ?? 'Error', type: 'error', duration: 4000 })
    }
  }

  const handleDeleteMovement = async () => {
    if (!deletingMovementId) return
    setDeleteLoading(true)
    const result = await deleteAccountMovement(deletingMovementId, userId)
    setDeleteLoading(false)
    setDeletingMovementId(null)
    if (result.success) {
      toaster.create({ title: 'Movimiento eliminado', type: 'success', duration: 3000 })
      router.refresh()
    } else {
      toaster.create({ title: result.error ?? 'Error', type: 'error', duration: 4000 })
    }
  }

  const movementColumns: ColumnDef<AccountMovementWithAccounts>[] = [
    { key: 'date', header: 'Fecha', render: (m) => new Date(m.date).toLocaleDateString('es-CO') },
    {
      key: 'from',
      header: 'Origen',
      render: (m) => (
        <Text fontSize="sm">{m.from_account?.icon ?? '💳'} {m.from_account?.name ?? '—'}</Text>
      ),
    },
    {
      key: 'to',
      header: 'Destino',
      render: (m) => (
        <Text fontSize="sm">{m.to_account?.icon ?? '💳'} {m.to_account?.name ?? '—'}</Text>
      ),
    },
    {
      key: 'amount',
      header: 'Monto',
      render: (m) => (
        <Text fontWeight="semibold">{formatCurrency(m.amount, m.currency)}</Text>
      ),
    },
    { key: 'description', header: 'Descripción', render: (m) => m.description ?? '—' },
    {
      key: 'actions',
      header: '',
      render: (m) => (
        <IconButton
          aria-label="Eliminar"
          size="sm"
          variant="ghost"
          colorPalette="red"
          onClick={() => setDeletingMovementId(m.id)}
        >
          <FiTrash2 />
        </IconButton>
      ),
    },
  ]

  return (
    <VStack gap={8} align="stretch">
      {/* Cuentas */}
      <Box>
        <HStack justify="space-between" mb={4}>
          <Heading size="sm" color="white">Mis Cuentas</Heading>
          <Button
            size="sm"
            bg="#4F46E5"
            color="white"
            _hover={{ bg: '#4338CA' }}
            onClick={() => { setEditingAccount(null); setIsAccountFormOpen(true) }}
          >
            <FiPlus />
            Nueva Cuenta
          </Button>
        </HStack>

        {accounts.length === 0 ? (
          <Text color="#B0B0B0" fontSize="sm">
            No tienes cuentas registradas. Crea una para empezar.
          </Text>
        ) : (
          <SimpleGrid minChildWidth="260px" gap={3}>
            {accounts.map((acc) => (
              <Box
                key={acc.id}
                borderWidth="1px"
                borderRadius="xl"
                p={4}
                bg="#1a1a23"
                borderColor="#2d2d35"
                _hover={{ borderColor: '#4F46E5' }}
                transition="border-color 0.2s"
              >
                <VStack align="stretch" gap={2}>
                  <HStack justify="space-between">
                    <HStack gap={2}>
                      <Box
                        w="8"
                        h="8"
                        borderRadius="full"
                        bg={acc.color ?? '#6366f1'}
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        fontSize="md"
                      >
                        {acc.icon ?? '💳'}
                      </Box>
                      <VStack align="start" gap={0}>
                        <Text fontWeight="semibold" fontSize="sm" color="white">{acc.name}</Text>
                        <Badge size="sm" variant="outline" colorPalette="gray">
                          {ACCOUNT_TYPE_LABELS[acc.type] ?? acc.type}
                        </Badge>
                      </VStack>
                    </HStack>
                    <HStack gap={1}>
                      <IconButton
                        aria-label="Editar"
                        size="xs"
                        variant="ghost"
                        color="#B0B0B0"
                        onClick={() => { setEditingAccount(acc); setIsAccountFormOpen(true) }}
                      >
                        <FiEdit2 />
                      </IconButton>
                      <IconButton
                        aria-label="Eliminar"
                        size="xs"
                        variant="ghost"
                        color="#ef4444"
                        onClick={() => setDeletingAccountId(acc.id)}
                      >
                        <FiTrash2 />
                      </IconButton>
                    </HStack>
                  </HStack>
                  <Text fontWeight="bold" fontSize="lg" color="white">
                    {formatCurrency(acc.balance, acc.currency as any)}
                  </Text>
                </VStack>
              </Box>
            ))}
          </SimpleGrid>
        )}
      </Box>

      <Separator />

      {/* Movimientos */}
      <Box>
        <HStack justify="space-between" mb={4}>
          <Heading size="sm" color="white">Movimientos entre Cuentas</Heading>
          <Button
            size="sm"
            bg="#4F46E5"
            color="white"
            _hover={{ bg: '#4338CA' }}
            onClick={() => setIsMovementFormOpen(true)}
            disabled={accounts.length < 2}
          >
            <FiPlus />
            Nuevo Movimiento
          </Button>
        </HStack>

        {accounts.length < 2 && (
          <Text color="#B0B0B0" fontSize="sm" mb={4}>
            Necesitas al menos 2 cuentas para registrar movimientos.
          </Text>
        )}

        <DataTable
          data={movements}
          columns={movementColumns}
          emptyMessage="No hay movimientos registrados."
          size="sm"
        />
      </Box>

      <AccountForm
        isOpen={isAccountFormOpen}
        onClose={() => setIsAccountFormOpen(false)}
        userId={userId}
        editingAccount={editingAccount}
        onSuccess={handleAccountSuccess}
      />

      <AccountMovementForm
        isOpen={isMovementFormOpen}
        onClose={() => setIsMovementFormOpen(false)}
        userId={userId}
        accounts={accounts}
        onSuccess={handleMovementSuccess}
      />

      <ConfirmDialog
        isOpen={deletingAccountId !== null}
        onClose={() => setDeletingAccountId(null)}
        onConfirm={handleDeleteAccount}
        title="Eliminar cuenta"
        description="¿Estás seguro? Esta acción no se puede deshacer."
        isLoading={deleteLoading}
      />

      <ConfirmDialog
        isOpen={deletingMovementId !== null}
        onClose={() => setDeletingMovementId(null)}
        onConfirm={handleDeleteMovement}
        title="Eliminar movimiento"
        description="¿Estás seguro? Los balances de las cuentas serán revertidos."
        isLoading={deleteLoading}
      />
    </VStack>
  )
}
