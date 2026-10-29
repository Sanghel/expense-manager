'use client'

import { useMemo, useRef, useState } from 'react'
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
  Input,
  Stack,
  Text,
  Textarea,
} from '@chakra-ui/react'
import { LuArrowDownLeft, LuArrowUpRight, LuCalendar, LuPlus, LuSparkles, LuX } from 'react-icons/lu'
import { createTransaction } from '@/lib/actions/transactions.actions'
import { toaster } from '@/lib/toaster'
import { openAiChat } from '@/lib/ai-chat'
import { PortalContainerProvider } from '@/components/ui/FloatingPortal'
import { SHEET_CONTENT_PROPS, SHEET_PLACEMENT } from '@/components/ui/dialog-sheet'
import { InlineCalendar } from '@/components/ui/InlineCalendar'
import { CurrencyPreview } from './CurrencyPreview'
import { QuickCategoryForm } from '@/components/categories/QuickCategoryForm'
import type { Account, Category, Currency, TransactionType } from '@/types/database.types'
import { getLocalDateString } from '@/lib/utils/dates'
import { formatCurrency } from '@/lib/utils/currency'

const CURRENCIES: Currency[] = ['COP', 'USD', 'VES']
const CURRENCY_SYMBOL: Record<Currency, string> = { COP: 'COP', USD: 'US$', VES: 'Bs' }
const TOP_CATEGORIES = 8

/** COP has no cents in practice; USD/VES keep them. */
const decimalsFor = (currency: string) => (currency === 'COP' ? 0 : 2)

interface Props {
  isOpen: boolean
  onClose: () => void
  userId: string
  categories: Category[]
  accounts?: Account[]
  onSuccess: () => void
  initialDate?: string
  lockedDate?: boolean
  prefillDescription?: string
  prefillCategoryId?: string
  initialType?: 'income' | 'expense'
  /** Past transactions, used to show the most frequent categories first. */
  history?: { category_id: string | null }[]
}

const defaultForm = {
  type: 'expense' as TransactionType,
  amount: undefined as number | undefined,
  currency: 'COP' as Currency,
  category_id: '',
  account_id: '',
  description: '',
  date: getLocalDateString(),
  notes: '',
}

/** "45000,5" → "45.000,5" while typing (es-CO: dot thousands, comma decimals). */
function formatTyping(raw: string): string {
  const cleaned = raw.replace(/[^0-9,]/g, '')
  const [int, ...rest] = cleaned.split(',')
  const intFormatted = int.replace(/^0+(?=\d)/, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return rest.length > 0 ? `${intFormatted},${rest.join('').slice(0, 2)}` : intFormatted
}

function parseTyping(text: string): number | undefined {
  const n = Number(text.replace(/\./g, '').replace(',', '.'))
  return text && Number.isFinite(n) && n > 0 ? n : undefined
}

function dayLabel(date: string): string {
  const d = new Date(`${date}T12:00:00`)
  // "24 oct" (es-CO formats it as "24 de oct.")
  const short = d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }).replace(' de ', ' ').replace('.', '')
  return date === getLocalDateString() ? `Hoy · ${short}` : `📅 ${short}`
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text textStyle="sectionLabel" color="text3" mb={2.5}>
      {children}
    </Text>
  )
}

type BodyProps = Omit<Props, 'isOpen'>

/**
 * The form itself. The dialog unmounts it on close, so every opening starts
 * from a clean state built from the props (no reset effect needed).
 */
function TransactionFormBody({
  onClose,
  userId,
  categories,
  accounts = [],
  onSuccess,
  initialDate,
  lockedDate,
  prefillDescription,
  prefillCategoryId,
  initialType,
  history = [],
}: BodyProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState(() => ({
    ...defaultForm,
    type: initialType ?? defaultForm.type,
    date: initialDate ?? getLocalDateString(),
    description: prefillDescription ?? '',
    category_id: prefillCategoryId ?? '',
  }))
  const [amountText, setAmountText] = useState('')
  const [localCategories, setLocalCategories] = useState<Category[]>(categories)
  const [quickCategoryOpen, setQuickCategoryOpen] = useState(false)
  const [showAllCategories, setShowAllCategories] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)

  const isExpense = formData.type === 'expense'

  // Categories of the current type, most used first.
  const typeCategories = useMemo(() => {
    const usage = new Map<string, number>()
    for (const t of history) {
      if (t.category_id) usage.set(t.category_id, (usage.get(t.category_id) ?? 0) + 1)
    }
    return localCategories
      .filter((c) => c.type === formData.type || c.type === 'both')
      .sort((a, b) => (usage.get(b.id) ?? 0) - (usage.get(a.id) ?? 0) || a.name.localeCompare(b.name))
  }, [localCategories, formData.type, history])

  const selectedCategory = localCategories.find((c) => c.id === formData.category_id)
  const visibleCategories = useMemo(() => {
    if (showAllCategories) return typeCategories
    const top = typeCategories.slice(0, TOP_CATEGORIES)
    // Keep a selected (or prefilled) category visible even if it isn't a top one.
    if (selectedCategory && !top.some((c) => c.id === selectedCategory.id)) top.push(selectedCategory)
    return top
  }, [typeCategories, showAllCategories, selectedCategory])

  const selectedAccount = accounts.find((a) => a.id === formData.account_id)
  const accountLocksCurrency = !!selectedAccount
  const cardOverLimit =
    isExpense &&
    selectedAccount?.type === 'card' &&
    formData.amount != null &&
    formData.amount > (selectedAccount.balance ?? 0)

  const canSave = !!formData.amount && !!formData.category_id && !!formData.date && !loading

  const setType = (type: TransactionType) =>
    setFormData((prev) => ({ ...prev, type, category_id: '' }))

  const handleAccountChange = (accountId: string) => {
    const account = accounts.find((a) => a.id === accountId)
    setFormData((prev) => ({
      ...prev,
      account_id: accountId,
      currency: account ? (account.currency as Currency) : prev.currency,
    }))
  }

  const handleAmountChange = (raw: string) => {
    const text = formatTyping(raw)
    setAmountText(text)
    setFormData((prev) => ({ ...prev, amount: parseTyping(text) }))
  }

  const handleCategoryCreated = (newCategory: Category) => {
    setLocalCategories((prev) => [...prev, newCategory])
    setFormData((prev) => ({ ...prev, category_id: newCategory.id }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSave) return
    setLoading(true)

    const result = await createTransaction(userId, {
      ...formData,
      amount: formData.amount ?? 0,
      account_id: formData.account_id || null,
      // The description is required by the schema; the category name is a
      // sensible default when the user leaves it empty.
      description: formData.description.trim() || selectedCategory?.name || 'Transacción',
    })

    if (result.success) {
      toaster.create({
        title: [
          isExpense ? 'Gasto registrado' : 'Ingreso registrado',
          selectedCategory?.name,
          formatCurrency(formData.amount ?? 0, formData.currency, decimalsFor(formData.currency)),
        ]
          .filter(Boolean)
          .join(' · '),
        type: 'success',
        duration: 2600,
      })
      onSuccess()
      onClose()
    } else {
      toaster.create({ title: 'Error al crear', description: result.error, type: 'error', duration: 4000 })
    }
    setLoading(false)
  }

  const amountLabel = formData.amount
    ? formatCurrency(formData.amount, formData.currency, decimalsFor(formData.currency))
    : null
  const sign = isExpense ? '−' : '+'

  return (
    <>
      <form onSubmit={handleSubmit} style={{ display: 'contents' }}>
        <Box flex="1" minH={0} overflowY="auto" px={{ base: 5, md: 7 }} pt={5} pb={2}>
          {/* Expense / income + close */}
          <Flex justify="space-between" align="center" mb={6}>
            <Flex bg="bg" borderRadius="pill" p={1} gap={1} role="radiogroup" aria-label="Tipo">
              {(
                [
                  { value: 'expense', label: 'Gasto', icon: LuArrowUpRight, fg: 'neg', bg: 'negSoft' },
                  { value: 'income', label: 'Ingreso', icon: LuArrowDownLeft, fg: 'pos', bg: 'posSoft' },
                ] as const
              ).map((t) => {
                const active = formData.type === t.value
                return (
                  <Button
                    key={t.value}
                    role="radio"
                    aria-checked={active}
                    onClick={() => setType(t.value)}
                    size="sm"
                    px={4}
                    gap={1.5}
                    bg={active ? t.bg : 'transparent'}
                    color={active ? t.fg : 'text2'}
                    _hover={{ color: active ? t.fg : 'text' }}
                  >
                    <Icon as={t.icon} boxSize="15px" />
                    {t.label}
                  </Button>
                )
              })}
            </Flex>
            <IconButton
              aria-label="Cerrar"
              onClick={onClose}
              boxSize="36px"
              minW="36px"
              bg="surface2"
              color="text2"
              _hover={{ color: 'text' }}
            >
              <LuX />
            </IconButton>
          </Flex>

          {/* Amount */}
          <Stack align="center" gap={3} mb={7}>
            <Flex gap={1} role="radiogroup" aria-label="Moneda">
              {CURRENCIES.map((c) => {
                const active = formData.currency === c
                return (
                  <Button
                    key={c}
                    role="radio"
                    aria-checked={active}
                    onClick={() => setFormData((prev) => ({ ...prev, currency: c }))}
                    disabled={accountLocksCurrency && !active}
                    title={accountLocksCurrency && !active ? 'La moneda la define la cuenta' : undefined}
                    size="2xs"
                    px={2.5}
                    fontFamily="mono"
                    fontSize="11px"
                    bg={active ? 'text' : 'transparent'}
                    color={active ? 'bg' : 'text3'}
                    _hover={{ color: active ? 'bg' : 'text' }}
                  >
                    {c}
                  </Button>
                )
              })}
            </Flex>
            <Flex align="baseline" justify="center" maxW="full">
              <Text as="span" fontFamily="mono" fontSize="20px" color="text3" me={1.5} whiteSpace="nowrap">
                {sign}
                {CURRENCY_SYMBOL[formData.currency]}
              </Text>
              <Input
                value={amountText}
                onChange={(e) => handleAmountChange(e.target.value)}
                inputMode="decimal"
                placeholder="0"
                aria-label="Monto"
                autoFocus
                variant="flushed"
                borderBottomWidth="0"
                _focusVisible={{ boxShadow: 'none' }}
                // Width follows the digits so sign and figure read as one unit.
                w={`${Math.max(amountText.length, 1) + 0.5}ch`}
                maxW="11ch"
                h="auto"
                px={0}
                fontFamily="mono"
                fontSize={{ base: '44px', md: '52px' }}
                fontWeight="500"
                letterSpacing="-0.04em"
                lineHeight="1"
                color="text"
                _placeholder={{ color: 'text3' }}
              />
            </Flex>
            <CurrencyPreview variant="inline" amount={formData.amount ?? 0} fromCurrency={formData.currency} />
          </Stack>

          {/* Category */}
          <Box mb={6}>
            <SectionLabel>Categoría</SectionLabel>
            <Flex wrap="wrap" gap={2}>
              {visibleCategories.map((c) => {
                const selected = formData.category_id === c.id
                return (
                  <Button
                    key={c.id}
                    aria-pressed={selected}
                    onClick={() => setFormData((prev) => ({ ...prev, category_id: c.id }))}
                    h="36px"
                    px={3.5}
                    gap={1.5}
                    fontSize="13px"
                    fontWeight="500"
                    bg={selected ? 'brandSoft' : 'surface2'}
                    color={selected ? 'brand' : 'text'}
                    boxShadow={selected ? 'inset 0 0 0 1.5px var(--chakra-colors-brand)' : 'none'}
                    _hover={{ bg: selected ? 'brandSoft' : 'line' }}
                  >
                    {c.icon && <span>{c.icon}</span>}
                    {c.name}
                  </Button>
                )
              })}
              {typeCategories.length > TOP_CATEGORIES && (
                <Button
                  onClick={() => setShowAllCategories((v) => !v)}
                  h="36px"
                  px={3.5}
                  fontSize="13px"
                  variant="ghost"
                  color="text2"
                >
                  {showAllCategories ? 'Ver menos' : 'Ver todas'}
                </Button>
              )}
              <Button
                onClick={() => setQuickCategoryOpen(true)}
                h="36px"
                px={3.5}
                gap={1}
                fontSize="13px"
                variant="ghost"
                color="brand"
                boxShadow="inset 0 0 0 1px var(--chakra-colors-line)"
              >
                <LuPlus />
                Nueva
              </Button>
            </Flex>
          </Box>

          {/* Account */}
          {accounts.length > 0 && (
            <Box mb={6}>
              <SectionLabel>Cuenta</SectionLabel>
              <Flex gap={2} overflowX="auto" pb={1} mx={-1} px={1} css={{ scrollbarWidth: 'none' }}>
                {[{ id: '', name: 'Sin cuenta', icon: null, balance: null, currency: null }, ...accounts].map(
                  (a) => {
                    const selected = formData.account_id === a.id
                    return (
                      <Button
                        key={a.id || 'none'}
                        aria-pressed={selected}
                        onClick={() => handleAccountChange(a.id)}
                        h="auto"
                        minH="44px"
                        py={2}
                        px={3.5}
                        borderRadius="16px"
                        flexShrink={0}
                        flexDirection="column"
                        alignItems="flex-start"
                        gap={0.5}
                        bg={selected ? 'brandSoft' : 'surface2'}
                        color={selected ? 'brand' : 'text'}
                        boxShadow={selected ? 'inset 0 0 0 1.5px var(--chakra-colors-brand)' : 'none'}
                        _hover={{ bg: selected ? 'brandSoft' : 'line' }}
                      >
                        <Text as="span" fontSize="13px" fontWeight="500">
                          {a.icon && `${a.icon} `}
                          {a.name}
                        </Text>
                        {a.balance != null && a.currency && (
                          <Text as="span" fontFamily="mono" fontSize="11px" color={a.balance < 0 ? 'neg' : 'text3'}>
                            {formatCurrency(a.balance, a.currency, decimalsFor(a.currency))}
                          </Text>
                        )}
                      </Button>
                    )
                  }
                )}
              </Flex>
              {cardOverLimit && selectedAccount && (
                <Text mt={2} fontSize="13px" color="neg" bg="negSoft" borderRadius="input" px={3} py={2}>
                  El monto excede el cupo disponible (
                  {formatCurrency(selectedAccount.balance, selectedAccount.currency)})
                </Text>
              )}
            </Box>
          )}

          {/* Description + date */}
          <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={4} mb={calendarOpen ? 3 : 6}>
            <Box>
              <SectionLabel>Descripción</SectionLabel>
              <Input
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder={selectedCategory?.name ?? 'Ej: Compra en supermercado'}
                h="44px"
              />
            </Box>
            <Box>
              <SectionLabel>Fecha</SectionLabel>
              <Flex gap={2}>
                <Button
                  flex="1"
                  h="44px"
                  borderRadius="input"
                  bg="surface2"
                  color="text"
                  fontWeight="500"
                  justifyContent="flex-start"
                  onClick={() => setCalendarOpen((v) => !v)}
                  disabled={lockedDate}
                >
                  {dayLabel(formData.date)}
                </Button>
                <IconButton
                  aria-label={calendarOpen ? 'Cerrar calendario' : 'Elegir fecha'}
                  aria-expanded={calendarOpen}
                  boxSize="44px"
                  borderRadius="input"
                  bg={calendarOpen ? 'brandSoft' : 'surface2'}
                  color={calendarOpen ? 'brand' : 'text2'}
                  onClick={() => setCalendarOpen((v) => !v)}
                  disabled={lockedDate}
                >
                  <LuCalendar />
                </IconButton>
              </Flex>
            </Box>
          </Grid>
          {calendarOpen && (
            <Box mb={6}>
              <InlineCalendar
                value={formData.date}
                onChange={(date) => {
                  setFormData((prev) => ({ ...prev, date }))
                  setCalendarOpen(false)
                }}
              />
            </Box>
          )}

          {/* Notes */}
          <Box mb={4}>
            <SectionLabel>Notas · opcional</SectionLabel>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              rows={2}
              resize="none"
              placeholder="Algo que quieras recordar"
            />
          </Box>
        </Box>

        {/* Footer */}
        <Flex
          align="center"
          gap={2}
          px={{ base: 5, md: 7 }}
          py={4}
          borderTopWidth="1px"
          borderColor="line"
          flexShrink={0}
          wrap="wrap"
        >
          <Button
            variant="ghost"
            color="brand"
            px={2}
            gap={1.5}
            fontSize="13px"
            onClick={() => {
              onClose()
              openAiChat()
            }}
          >
            <LuSparkles />
            Mejor díctalo
          </Button>
          <Flex gap={2} ms="auto">
            <Button variant="ghost" color="text2" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button
              type="submit"
              bg="brandSolid"
              color="white"
              _hover={{ bg: 'brand.600' }}
              loading={loading}
              disabled={!canSave}
              _disabled={{ opacity: 0.5, cursor: 'not-allowed' }}
            >
              {isExpense ? 'Guardar gasto' : 'Guardar ingreso'}
              {amountLabel && (
                <Text as="span" fontFamily="mono" fontWeight="500">
                  · {amountLabel}
                </Text>
              )}
            </Button>
          </Flex>
        </Flex>
      </form>

      <QuickCategoryForm
        isOpen={quickCategoryOpen}
        onClose={() => setQuickCategoryOpen(false)}
        userId={userId}
        defaultType={formData.type}
        onCreated={handleCategoryCreated}
      />
    </>
  )
}

/** Pulso "Nueva transacción": centered on desktop, bottom sheet on mobile. */
export function TransactionForm({ isOpen, ...props }: Props) {
  // Floating panels (pickers inside nested dialogs) render inside the dialog.
  const contentRef = useRef<HTMLDivElement>(null)

  return (
    <DialogRoot
      open={isOpen}
      onOpenChange={({ open }) => !open && props.onClose()}
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
          aria-label="Nueva transacción"
          w="min(580px, calc(100vw - 32px))"
          {...SHEET_CONTENT_PROPS}
          maxW={{ base: 'full', md: 'none' }}
          display="flex"
          flexDirection="column"
        >
          <PortalContainerProvider container={contentRef}>
            <TransactionFormBody {...props} />
          </PortalContainerProvider>
        </DialogContent>
      </DialogPositioner>
    </DialogRoot>
  )
}
