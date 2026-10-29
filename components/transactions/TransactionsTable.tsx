'use client'

import { Box, Flex, Grid, IconButton, Text } from '@chakra-ui/react'
import { useState } from 'react'
import { LuPencil, LuTrash2 } from 'react-icons/lu'
import { deleteTransaction } from '@/lib/actions/transactions.actions'
import { toaster } from '@/lib/toaster'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Money } from '@/components/ui/Money'
import type { Account, TransactionWithCategory } from '@/types/database.types'

interface Props {
  transactions: TransactionWithCategory[]
  userId: string
  onUpdate: () => void
  onEdit: (transaction: TransactionWithCategory) => void
  accounts?: Account[]
}

/** fecha · descripción · cuenta · monto · acciones */
const COLUMNS = '72px minmax(0, 1fr) 150px 140px 64px'

/** COP has no cents in practice; USD/VES keep them. */
const decimalsFor = (currency: string) => (currency === 'COP' ? 0 : 2)

/** "28 oct" */
const shortDate = (iso: string) =>
  new Date(`${iso}T12:00:00`)
    .toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
    .replace(' de ', ' ')
    .replace('.', '')

/** Pulso transactions list: grid rows with line separators; two columns on mobile. */
export function TransactionsTable({ transactions, userId, onUpdate, onEdit, accounts = [] }: Props) {
  const accountById = new Map(accounts.map((a) => [a.id, a]))
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!selectedId) return
    setIsDeleting(true)
    const result = await deleteTransaction(selectedId, userId)
    setIsDeleting(false)

    if (result.success) {
      toaster.create({ title: 'Transacción eliminada', type: 'success', duration: 3000 })
      onUpdate()
    } else {
      toaster.create({ title: 'Error al eliminar', description: result.error, type: 'error', duration: 4000 })
    }
    setSelectedId(null)
  }

  if (transactions.length === 0) {
    return (
      <Text color="text3" textAlign="center" py={12} fontSize="sm">
        No hay transacciones con estos filtros.
      </Text>
    )
  }

  return (
    <>
      <Grid
        display={{ base: 'none', md: 'grid' }}
        templateColumns={COLUMNS}
        gap={4}
        px={4}
        pb={2.5}
        borderBottomWidth="1px"
        borderColor="line"
        textStyle="sectionLabel"
        color="text3"
      >
        <span>Fecha</span>
        <span>Descripción</span>
        <span>Cuenta</span>
        <Text as="span" textAlign="right">Monto</Text>
        <span />
      </Grid>

      {transactions.map((t) => {
        const account = t.account_id ? accountById.get(t.account_id) : undefined
        const category = `${t.category?.name ?? 'Sin categoría'}`
        const actions = (
          <Flex gap={0.5} justify="flex-end" className="row-actions">
            <IconButton aria-label="Editar transacción" size="xs" variant="ghost" color="text3" _hover={{ color: 'text', bg: 'surface2' }} onClick={() => onEdit(t)}>
              <LuPencil />
            </IconButton>
            <IconButton aria-label="Eliminar transacción" size="xs" variant="ghost" color="text3" _hover={{ color: 'neg', bg: 'negSoft' }} onClick={() => setSelectedId(t.id)}>
              <LuTrash2 />
            </IconButton>
          </Flex>
        )
        const amount = (
          <Money
            amount={Number(t.amount)}
            currency={t.currency}
            kind={t.type}
            fractionDigits={decimalsFor(t.currency)}
            fontSize="14px"
            fontWeight="500"
            textAlign="right"
            display="block"
          />
        )
        return (
          <Grid
            key={t.id}
            templateColumns={{ base: 'minmax(0, 1fr) auto', md: COLUMNS }}
            gap={{ base: 3, md: 4 }}
            alignItems="center"
            px={{ base: 1, md: 4 }}
            py="14px"
            borderBottomWidth="1px"
            borderColor="line"
            transition="background 150ms"
            _hover={{ bg: { md: 'surface2' } }}
            // Actions fade in on hover/focus on desktop; always visible on touch.
            css={{
              '@media (hover: hover)': {
                '& .row-actions': { opacity: 0, transition: 'opacity 150ms' },
                '&:hover .row-actions, &:focus-within .row-actions': { opacity: 1 },
              },
            }}
          >
            <Text display={{ base: 'none', md: 'block' }} fontFamily="mono" fontSize="12px" color="text2">
              {shortDate(t.date)}
            </Text>

            <Flex align="center" gap={3} minW={0}>
              <Text fontSize="18px" w="24px" textAlign="center" flexShrink={0}>
                {t.category?.icon ?? '🏷️'}
              </Text>
              <Box minW={0}>
                <Text fontSize="14px" fontWeight="500" color="text" truncate>
                  {t.description}
                </Text>
                <Text fontSize="12px" color="text3" truncate display={{ base: 'none', md: 'block' }}>
                  {category}
                </Text>
                {/* Mobile: date · category · account in one line */}
                <Text fontSize="12px" color="text3" truncate display={{ base: 'block', md: 'none' }}>
                  {[shortDate(t.date), category, account?.name].filter(Boolean).join(' · ')}
                </Text>
              </Box>
            </Flex>

            <Text display={{ base: 'none', md: 'block' }} fontSize="13px" color="text2" truncate>
              {account ? `${account.icon ?? '💳'} ${account.name}` : '—'}
            </Text>

            <Box display={{ base: 'none', md: 'block' }}>{amount}</Box>
            <Box display={{ base: 'none', md: 'block' }}>{actions}</Box>

            {/* Mobile: amount with the actions below */}
            <Flex display={{ base: 'flex', md: 'none' }} direction="column" align="flex-end" gap={0.5}>
              {amount}
              {actions}
            </Flex>
          </Grid>
        )
      })}

      <ConfirmDialog
        isOpen={selectedId !== null}
        onClose={() => setSelectedId(null)}
        onConfirm={handleDelete}
        title="Eliminar transacción"
        description="¿Estás seguro? Esta acción no se puede deshacer."
        isLoading={isDeleting}
      />
    </>
  )
}
