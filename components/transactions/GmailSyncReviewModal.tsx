'use client'

import {
  Box,
  Button,
  DialogBackdrop,
  DialogContent,
  DialogPositioner,
  DialogRoot,
  Flex,
  Grid,
  Icon,
  IconButton,
  Stack,
  Text,
} from '@chakra-ui/react'
import { useState, useMemo, useRef } from 'react'
import { LuCheck, LuMail, LuPencil, LuUndo2, LuX } from 'react-icons/lu'
import { TransactionForm } from './TransactionForm'
import { PortalContainerProvider } from '@/components/ui/FloatingPortal'
import { SHEET_CONTENT_PROPS, SHEET_PLACEMENT } from '@/components/ui/dialog-sheet'
import { Money } from '@/components/ui/Money'
import { ComboboxField } from '@/components/ui/ComboboxField'
import { commitGmailTransactions } from '@/lib/actions/gmail.actions'
import { toaster } from '@/lib/toaster'
import type { Account, Category, Currency, TransactionType, TransactionWithCategory } from '@/types/database.types'
import type { ParsedItem } from '@/lib/gmail/process'
import type { ParserSource } from '@/lib/gmail/parsers'

interface ReviewItem {
  parsed: ParsedItem
  edited: {
    type: TransactionType
    amount: number
    currency: Currency
    category_id: string
    account_id: string | null
    description: string
    date: string
    notes: string
  }
  excluded: boolean
}

const SOURCE_LABEL: Record<ParserSource, string> = {
  bancolombia: 'Bancolombia',
  binance: 'Binance',
  mercantil: 'Mercantil',
  bofa: 'Bank of America',
}

/** checkbox · fecha · origen · descripción · categoría · monto · acciones */
const COLUMNS = '30px 56px 118px minmax(0, 1fr) 190px 112px 72px'

/** COP has no cents in practice; USD/VES keep them. */
const decimalsFor = (currency: string) => (currency === 'COP' ? 0 : 2)

function findAccountByLastFour(accounts: Account[], lastFour: string | null): string | null {
  if (!lastFour) return null
  const match = accounts.find(
    (a) => (a.last_four === lastFour || a.card_number === lastFour) && a.is_active
  )
  return match?.id ?? null
}

function initialEdited(p: ParsedItem, accounts: Account[]): ReviewItem['edited'] {
  return {
    type: p.type,
    amount: p.amount,
    currency: p.currency,
    category_id: '',
    account_id: findAccountByLastFour(accounts, p.lastFour),
    description: p.description,
    date: p.date,
    notes: '',
  }
}

/** "2026-10-24" → "24 oct" */
function shortDate(iso: string): string {
  const d = new Date(`${iso}T12:00:00`)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }).replace(' de ', ' ').replace('.', '')
}

function syncedAgo(iso: string): string {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000))
  if (minutes < 1) return 'sincronizado ahora'
  if (minutes < 60) return `sincronizado hace ${minutes} min`
  return `sincronizado hace ${Math.round(minutes / 60)} h`
}

/** "Bancolombia <alertas@bancolombia.com.co>" → "alertas@bancolombia.com.co" */
function senderAddress(rawFrom: string): string {
  return rawFrom.match(/<([^>]+)>/)?.[1] ?? rawFrom
}

/** 22px rounded checkbox: brandSolid with a white check when included. */
function IncludeCheckbox({ checked, onToggle, label }: { checked: boolean; onToggle: () => void; label: string }) {
  return (
    <Box
      as="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={onToggle}
      display="flex"
      alignItems="center"
      justifyContent="center"
      boxSize="22px"
      borderRadius="7px"
      flexShrink={0}
      cursor="pointer"
      bg={checked ? 'brandSolid' : 'transparent'}
      color="white"
      boxShadow={checked ? 'none' : 'inset 0 0 0 1.5px var(--chakra-colors-text3)'}
      transition="background 150ms"
    >
      {checked && <Icon as={LuCheck} boxSize="14px" strokeWidth={3} />}
    </Box>
  )
}

interface Props {
  isOpen: boolean
  onClose: () => void
  userId: string
  items: ParsedItem[]
  syncedAt: string
  categories: Category[]
  accounts: Account[]
  onDone: () => void
}

export function GmailSyncReviewModal({ isOpen, onClose, userId, items, syncedAt, categories, accounts, onDone }: Props) {
  const [reviews, setReviews] = useState<ReviewItem[]>(
    items.map((p) => ({ parsed: p, edited: initialEdited(p, accounts), excluded: false }))
  )
  const [editing, setEditing] = useState<number | null>(null)
  const [lastEditing, setLastEditing] = useState<number | null>(null)
  const [outerOpen, setOuterOpen] = useState(true)
  const [saving, setSaving] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  // Skip the next onClose from outer dialog when we close it programmatically
  // to open the nested edit dialog (avoid triggering handleDiscard).
  const skipNextOuterCloseRef = useRef(false)

  const startEditing = (idx: number) => {
    setLastEditing(idx)
    skipNextOuterCloseRef.current = true
    setOuterOpen(false)
    // Wait for outer close animation before mounting the inner dialog,
    // so Chakra/Ark dialogs are never simultaneously open.
    setTimeout(() => setEditing(idx), 220)
  }

  const stopEditing = () => {
    setEditing(null)
    // After inner close animation, reopen the outer.
    setTimeout(() => setOuterOpen(true), 220)
  }

  const handleOuterClose = () => {
    if (skipNextOuterCloseRef.current) {
      skipNextOuterCloseRef.current = false
      return
    }
    handleDiscard()
  }

  const activeReviews = useMemo(() => reviews.filter((r) => !r.excluded), [reviews])
  const missingCategoryCount = useMemo(
    () => activeReviews.filter((r) => !r.edited.category_id).length,
    [activeReviews]
  )
  const discardedCount = reviews.length - activeReviews.length
  const oldestDate = useMemo(
    () => reviews.reduce((min, r) => (r.edited.date < min ? r.edited.date : min), reviews[0]?.edited.date ?? ''),
    [reviews]
  )

  const accountFor = (id: string | null) => (id ? accounts.find((a) => a.id === id) : undefined)
  const categoriesFor = (type: TransactionType) =>
    categories.filter((c) => c.type === type || c.type === 'both')

  const updateRow = (idx: number, patch: Partial<ReviewItem['edited']>) => {
    setReviews((prev) => prev.map((r, i) => i === idx ? { ...r, edited: { ...r.edited, ...patch } } : r))
  }
  const toggleExclude = (idx: number) => {
    setReviews((prev) => prev.map((r, i) => i === idx ? { ...r, excluded: !r.excluded } : r))
  }

  const handleSave = async () => {
    if (missingCategoryCount > 0) {
      toaster.create({ title: 'Asigna categoría a todas las transacciones', type: 'error' })
      return
    }
    setSaving(true)
    const payload = activeReviews.map((r) => ({
      ...r.parsed,
      type: r.edited.type,
      amount: r.edited.amount,
      currency: r.edited.currency,
      description: r.edited.description,
      date: r.edited.date,
      category_id: r.edited.category_id,
      account_id: r.edited.account_id,
    }))
    const result = await commitGmailTransactions(payload, syncedAt)
    setSaving(false)
    if (!result.success) {
      toaster.create({ title: 'Error', description: result.error, type: 'error' })
      return
    }
    toaster.create({
      title: `${result.created} transacciones registradas desde Gmail`,
      description: result.errors.length > 0 ? `${result.errors.length} con error` : undefined,
      type: result.errors.length > 0 ? 'warning' : 'success',
    })
    onDone()
    onClose()
  }

  const handleDiscard = () => {
    toaster.create({ title: 'No se registró ninguna transacción', type: 'info' })
    onClose()
  }

  const editingReview = lastEditing != null ? reviews[lastEditing] : null
  const editingAsTransaction: TransactionWithCategory | null = editingReview
    ? ({
        id: `staging-${lastEditing}`,
        user_id: userId,
        amount: editingReview.edited.amount,
        currency: editingReview.edited.currency,
        type: editingReview.edited.type,
        category_id: editingReview.edited.category_id || null,
        account_id: editingReview.edited.account_id,
        description: editingReview.edited.description,
        date: editingReview.edited.date,
        notes: editingReview.edited.notes,
        source: 'gmail',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        category: null,
      } as unknown as TransactionWithCategory)
    : null

  const categorySelect = (r: ReviewItem, idx: number) => (
    <ComboboxField
      label={`Categoría de ${r.edited.description}`}
      hideLabel
      size="sm"
      pill
      placeholder="Elegir categoría"
      value={r.edited.category_id}
      onChange={(category_id) => updateRow(idx, { category_id })}
      options={categoriesFor(r.edited.type).map((c) => ({ value: c.id, label: c.name, icon: c.icon }))}
      invalid={!r.excluded && !r.edited.category_id}
      disabled={r.excluded}
      clearable={false}
    />
  )

  const rowActions = (r: ReviewItem, idx: number) => (
    <Flex gap={0.5} justify="flex-end">
      <IconButton
        aria-label="Editar transacción"
        title="Editar"
        size="xs"
        variant="ghost"
        color="text3"
        _hover={{ color: 'text', bg: 'surface2' }}
        onClick={() => startEditing(idx)}
        disabled={r.excluded}
      >
        <LuPencil />
      </IconButton>
      <IconButton
        aria-label={r.excluded ? 'Restaurar' : 'Descartar'}
        title={r.excluded ? 'Restaurar' : 'Descartar'}
        size="xs"
        variant="ghost"
        color={r.excluded ? 'brand' : 'text3'}
        _hover={{ color: r.excluded ? 'brand' : 'neg', bg: 'surface2' }}
        onClick={() => toggleExclude(idx)}
      >
        {r.excluded ? <LuUndo2 /> : <LuX />}
      </IconButton>
    </Flex>
  )

  const descriptionCell = (r: ReviewItem) => {
    const account = accountFor(r.edited.account_id)
    return (
      <Box minW={0}>
        <Text
          fontSize="14px"
          fontWeight="500"
          color="text"
          truncate
          textDecoration={r.excluded ? 'line-through' : undefined}
        >
          {r.edited.description}
        </Text>
        <Flex align="center" gap={1.5} fontSize="12px" color="text3" minW={0}>
          <Icon as={LuMail} boxSize="12px" flexShrink={0} />
          <Text truncate>
            {senderAddress(r.parsed.rawFrom)}
            {account && ` · ${account.icon ?? ''} ${account.name}`}
          </Text>
        </Flex>
      </Box>
    )
  }

  const amountCell = (r: ReviewItem) => (
    <Money
      amount={r.edited.amount}
      currency={r.edited.currency}
      kind={r.edited.type}
      fractionDigits={decimalsFor(r.edited.currency)}
      fontSize="14px"
      fontWeight="500"
      textAlign="right"
      display="block"
      textDecoration={r.excluded ? 'line-through' : undefined}
    />
  )

  return (
    <>
      <DialogRoot
        open={isOpen && outerOpen}
        onOpenChange={({ open }) => !open && handleOuterClose()}
        placement={SHEET_PLACEMENT}
        lazyMount
        unmountOnExit
        closeOnInteractOutside={false}
      >
        <DialogBackdrop />
        <DialogPositioner>
          <DialogContent
            ref={contentRef}
            tabIndex={-1}
            aria-label="Revisión de Gmail"
            w="min(1040px, calc(100vw - 48px))"
            {...SHEET_CONTENT_PROPS}
            maxW={{ base: 'full', md: 'none' }}
            display="flex"
            flexDirection="column"
          >
            <PortalContainerProvider container={contentRef}>
              {/* Header */}
              <Flex align="center" gap={3.5} px={{ base: 5, md: 7 }} py={5} flexShrink={0}>
                <Flex align="center" justify="center" boxSize="44px" borderRadius="full" bg="brandSoft" color="brand" flexShrink={0}>
                  <Icon as={LuMail} boxSize="20px" />
                </Flex>
                <Box flex="1" minW={0}>
                  <Text fontSize="18px" fontWeight="600" color="text">
                    Revisa lo que llegó por correo
                  </Text>
                  <Text fontSize="13px" color="text3">
                    {reviews.length} {reviews.length === 1 ? 'correo bancario' : 'correos bancarios'}
                    {oldestDate && ` desde el ${shortDate(oldestDate)}`} · {syncedAgo(syncedAt)}
                  </Text>
                </Box>
                <IconButton
                  aria-label="Cerrar"
                  onClick={handleOuterClose}
                  boxSize="36px"
                  minW="36px"
                  bg="surface2"
                  color="text2"
                  _hover={{ color: 'text' }}
                >
                  <LuX />
                </IconButton>
              </Flex>

              {/* Desktop: table with its own scroll and a sticky header */}
              <Box display={{ base: 'none', md: 'block' }} flex="1" minH={0} overflowY="auto" px={7}>
                <Grid
                  templateColumns={COLUMNS}
                  gap={3}
                  alignItems="center"
                  position="sticky"
                  top={0}
                  zIndex={1}
                  bg="surface"
                  py={2.5}
                  borderBottomWidth="1px"
                  borderColor="line"
                  textStyle="sectionLabel"
                  color="text3"
                >
                  <span />
                  <span>Fecha</span>
                  <span>Origen</span>
                  <span>Descripción</span>
                  <span>Categoría</span>
                  <Text as="span" textAlign="right">Monto</Text>
                  <span />
                </Grid>
                {reviews.map((r, idx) => {
                  const account = accountFor(r.edited.account_id)
                  return (
                    <Grid
                      key={r.parsed.gmailMessageId}
                      templateColumns={COLUMNS}
                      gap={3}
                      alignItems="center"
                      py={3}
                      borderBottomWidth="1px"
                      borderColor="line"
                      opacity={r.excluded ? 0.45 : 1}
                      transition="opacity 150ms"
                    >
                      <IncludeCheckbox
                        checked={!r.excluded}
                        onToggle={() => toggleExclude(idx)}
                        label={`Incluir ${r.edited.description}`}
                      />
                      <Text fontFamily="mono" fontSize="12px" color="text2">
                        {shortDate(r.edited.date)}
                      </Text>
                      <Text fontSize="13px" color="text2" truncate>
                        {account?.icon ?? '🏦'} {SOURCE_LABEL[r.parsed.source]}
                      </Text>
                      {descriptionCell(r)}
                      {categorySelect(r, idx)}
                      {amountCell(r)}
                      {rowActions(r, idx)}
                    </Grid>
                  )
                })}
              </Box>

              {/* Mobile: one card per row */}
              <Stack display={{ base: 'flex', md: 'none' }} flex="1" minH={0} overflowY="auto" px={4} pb={2} gap={2.5}>
                {reviews.map((r, idx) => (
                  <Box
                    key={r.parsed.gmailMessageId}
                    bg="surface2"
                    borderRadius="tile"
                    p={3.5}
                    opacity={r.excluded ? 0.45 : 1}
                  >
                    <Flex gap={3} align="flex-start">
                      <IncludeCheckbox
                        checked={!r.excluded}
                        onToggle={() => toggleExclude(idx)}
                        label={`Incluir ${r.edited.description}`}
                      />
                      <Box flex="1" minW={0}>{descriptionCell(r)}</Box>
                      <Box flexShrink={0}>
                        {amountCell(r)}
                        <Text fontFamily="mono" fontSize="11px" color="text3" textAlign="right">
                          {shortDate(r.edited.date)}
                        </Text>
                      </Box>
                    </Flex>
                    <Flex gap={2} mt={3} align="center">
                      <Box flex="1" minW={0}>{categorySelect(r, idx)}</Box>
                      {rowActions(r, idx)}
                    </Flex>
                  </Box>
                ))}
              </Stack>

              {/* Footer */}
              <Flex
                align="center"
                gap={3}
                px={{ base: 5, md: 7 }}
                py={4}
                borderTopWidth="1px"
                borderColor="line"
                flexShrink={0}
                wrap="wrap"
              >
                <Text fontSize="13px" color="text2">
                  {activeReviews.length} por registrar
                  {discardedCount > 0 && ` · ${discardedCount} ${discardedCount === 1 ? 'descartada' : 'descartadas'}`}
                  {missingCategoryCount > 0 && (
                    <Text as="span" color="neg">
                      {' '}· {missingCategoryCount} sin categoría
                    </Text>
                  )}
                </Text>
                <Flex gap={2} ms="auto">
                  <Button variant="ghost" color="text2" onClick={handleDiscard} disabled={saving}>
                    Cancelar
                  </Button>
                  <Button
                    bg="brandSolid"
                    color="white"
                    _hover={{ bg: 'brand.600' }}
                    onClick={handleSave}
                    loading={saving}
                    disabled={activeReviews.length === 0}
                    _disabled={{ opacity: 0.5, cursor: 'not-allowed' }}
                  >
                    Registrar {activeReviews.length}{' '}
                    {activeReviews.length === 1 ? 'transacción' : 'transacciones'}
                  </Button>
                </Flex>
              </Flex>
            </PortalContainerProvider>
          </DialogContent>
        </DialogPositioner>
      </DialogRoot>

      {editingAsTransaction && lastEditing != null && (
        <TransactionForm
          isOpen={editing != null}
          onClose={stopEditing}
          userId={userId}
          categories={categories}
          accounts={accounts}
          transaction={editingAsTransaction}
          onSuccess={stopEditing}
          onSubmitOverride={(values) => updateRow(lastEditing, values)}
        />
      )}
    </>
  )
}
