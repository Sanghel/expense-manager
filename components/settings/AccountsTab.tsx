'use client'

import { Box, Flex, Grid, Icon, Text, Button, VStack } from '@chakra-ui/react'
import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { LuArrowRight, LuPlus } from 'react-icons/lu'
import { deleteAccount } from '@/lib/actions/accounts.actions'
import { deleteAccountMovement } from '@/lib/actions/account_movements.actions'
import { toaster } from '@/lib/toaster'
import { AccountForm } from './AccountForm'
import { AccountMovementForm } from './AccountMovementForm'
import { AccountCard } from './AccountCard'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { ActionIconButton } from '@/components/ui/ActionIconButton'
import { formatCurrency } from '@/lib/utils/currency'
import type { Account, AccountMovementWithAccounts } from '@/types/database.types'

interface Props {
  userId: string
  initialAccounts: Account[]
  initialMovements: AccountMovementWithAccounts[]
}

export function AccountsTab({ userId, initialAccounts: accounts, initialMovements: movements }: Props) {
  const router = useRouter()
  const [isAccountFormOpen, setIsAccountFormOpen] = useState(false)
  const [isMovementFormOpen, setIsMovementFormOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [preselectedToAccountId, setPreselectedToAccountId] = useState<string | undefined>(undefined)
  const [deletingAccountId, setDeletingAccountId] = useState<string | null>(null)
  const [deletingMovementId, setDeletingMovementId] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

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

  const shortDate = (iso: string) =>
    new Date(`${iso.slice(0, 10)}T12:00:00`)
      .toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
      .replace(' de ', ' ')
      .replace('.', '')
  const money = (amount: number, currency: string) =>
    formatCurrency(amount, currency, currency === 'COP' ? 0 : 2)

  return (
    <VStack gap={8} align="stretch">
      <Grid templateColumns="repeat(auto-fill, minmax(min(260px, 100%), 1fr))" gap={3}>
        {accounts.map((acc) => (
          <AccountCard
            key={acc.id}
            account={acc}
            onEdit={(a) => { setEditingAccount(a); setIsAccountFormOpen(true) }}
            onDelete={setDeletingAccountId}
            extraAction={
              acc.type === 'card' && acc.credit_limit != null ? (
                <Button
                  size="xs"
                  variant="ghost"
                  color="brand"
                  bg="brandSoft"
                  onClick={() => {
                    setPreselectedToAccountId(acc.id)
                    setIsMovementFormOpen(true)
                  }}
                >
                  Pagar tarjeta
                </Button>
              ) : undefined
            }
          />
        ))}
        <Box
          as="button"
          onClick={() => { setEditingAccount(null); setIsAccountFormOpen(true) }}
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          gap={2}
          minH="140px"
          bg="brandSoft"
          color="brand"
          borderRadius="card"
          fontWeight="500"
          fontSize="14px"
          cursor="pointer"
          transition="opacity 150ms"
          _hover={{ opacity: 0.85 }}
        >
          <Icon as={LuPlus} boxSize="20px" />
          Nueva cuenta
        </Box>
      </Grid>

      <Box>
        <Flex justify="space-between" align="center" mb={3} gap={3}>
          <Text textStyle="sectionLabel" color="text3">
            Transferencias entre cuentas
          </Text>
          <Button
            size="sm"
            variant="ghost"
            color="text2"
            boxShadow="inset 0 0 0 1px var(--chakra-colors-line)"
            onClick={() => setIsMovementFormOpen(true)}
            disabled={accounts.length < 2}
          >
            <LuPlus />
            Nueva transferencia
          </Button>
        </Flex>

        {accounts.length < 2 ? (
          <Text color="text3" fontSize="13px">Necesitas al menos 2 cuentas para registrar transferencias.</Text>
        ) : movements.length === 0 ? (
          <Text color="text3" fontSize="13px">No hay transferencias registradas.</Text>
        ) : (
          <Box bg="surface" borderRadius="card" px={{ base: 4, md: 5 }} py={1}>
            {movements.map((m) => (
              <Grid
                key={m.id}
                templateColumns={{ base: '1fr auto', md: '72px minmax(0, 1fr) 24px minmax(0, 1fr) 32px' }}
                gap={{ base: 2, md: 4 }}
                alignItems="center"
                py={3.5}
                borderBottomWidth="1px"
                borderColor="line"
                _last={{ borderBottomWidth: 0 }}
              >
                <Text fontFamily="mono" fontSize="12px" color="text3" display={{ base: 'none', md: 'block' }}>
                  {shortDate(m.date)}
                </Text>
                <Box minW={0}>
                  <Text fontSize="14px" color="text" truncate>
                    {m.from_account?.icon ?? '💳'} {m.from_account?.name ?? '—'}
                  </Text>
                  <Text fontFamily="mono" fontSize="12px" color="text2">
                    −{money(m.from_amount, m.from_currency)}
                  </Text>
                  {/* Mobile: destination under the origin */}
                  <Text display={{ base: 'block', md: 'none' }} fontSize="12px" color="text3" mt={1} truncate>
                    → {m.to_account?.name ?? '—'} · <Text as="span" fontFamily="mono" color="pos">+{money(m.to_amount, m.to_currency)}</Text> · {shortDate(m.date)}
                  </Text>
                </Box>
                <Icon as={LuArrowRight} color="text3" display={{ base: 'none', md: 'block' }} />
                <Box minW={0} display={{ base: 'none', md: 'block' }}>
                  <Text fontSize="14px" color="text" truncate>
                    {m.to_account?.icon ?? '💳'} {m.to_account?.name ?? '—'}
                  </Text>
                  <Text fontFamily="mono" fontSize="12px" color="pos">
                    +{money(m.to_amount, m.to_currency)}
                  </Text>
                </Box>
                <ActionIconButton
                  kind="delete"
                  tone="danger"
                  label="Eliminar transferencia"
                  size="xs"
                  variant="ghost"
                  onClick={() => setDeletingMovementId(m.id)}
                />
              </Grid>
            ))}
          </Box>
        )}
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
        onClose={() => { setIsMovementFormOpen(false); setPreselectedToAccountId(undefined) }}
        userId={userId}
        accounts={accounts}
        onSuccess={handleMovementSuccess}
        preselectedToAccountId={preselectedToAccountId}
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
        title="Eliminar transferencia"
        description="¿Estás seguro? Los balances de las cuentas serán revertidos."
        isLoading={deleteLoading}
      />
    </VStack>
  )
}
