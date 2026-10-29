'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Box,
  Button,
  DialogBackdrop,
  DialogContent,
  DialogPositioner,
  DialogRoot,
  Flex,
  Icon,
  IconButton,
  Input,
  Spinner,
  Stack,
  Text,
} from '@chakra-ui/react'
import { useRouter } from 'next/navigation'
import { LuMic, LuSparkles, LuSquare } from 'react-icons/lu'
import { categorizePurchase, type CategorizedTransaction } from '@/lib/actions/ai.actions'
import { createTransaction } from '@/lib/actions/transactions.actions'
import { OPEN_AI_CHAT_EVENT } from '@/lib/ai-chat'
import { formatCurrency } from '@/lib/utils/currency'
import { toaster } from '@/lib/toaster'
import { Money } from '@/components/ui/Money'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'
import type { Account, Category } from '@/types/database.types'

interface Props {
  userId: string
  categories: Category[]
  accounts?: Account[]
}

const SUGGESTIONS = ['almuerzo 32 mil', 'uber 18.500 ayer', 'me pagaron el salario, 2,5 millones']

type State =
  | { status: 'idle' }
  | { status: 'loading'; text: string }
  | { status: 'error'; text: string; message: string }
  | { status: 'result'; text: string; tx: CategorizedTransaction }

/** COP has no cents in practice; USD/VES keep them. */
const decimalsFor = (currency: string) => (currency === 'COP' ? 0 : 2)

function formatDay(date: string): string {
  const today = new Date()
  const iso = (d: Date) => d.toLocaleDateString('en-CA')
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (date === iso(today)) return 'hoy'
  if (date === iso(yesterday)) return 'ayer'
  return new Date(`${date}T12:00:00`).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
}

/**
 * AI command palette (⌘K / Ctrl+K, the header AI bar or "Mejor díctalo").
 * One phrase in, one transaction out: the model proposes it and the user
 * picks the account and saves with Enter.
 */
export function AiPalette({ userId, categories, accounts = [] }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [state, setState] = useState<State>({ status: 'idle' })
  const [accountId, setAccountId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const reset = useCallback(() => {
    setInput('')
    setState({ status: 'idle' })
    setAccountId(null)
  }, [])

  useEffect(() => {
    const show = () => setOpen(true)
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    window.addEventListener(OPEN_AI_CHAT_EVENT, show)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener(OPEN_AI_CHAT_EVENT, show)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  const interpret = useCallback(
    async (raw: string) => {
      const text = raw.trim()
      if (!text || state.status === 'loading') return
      setInput(text)
      setState({ status: 'loading', text })
      const result = await categorizePurchase(
        text,
        categories.map((c) => ({ id: c.id, name: c.name, type: c.type }))
      )
      setState(
        result.success
          ? { status: 'result', text, tx: result.data }
          : { status: 'error', text, message: result.error }
      )
    },
    [categories, state.status]
  )

  const speech = useSpeechRecognition({ onInterim: setInput, onFinal: interpret })

  const save = async () => {
    if (state.status !== 'result' || saving) return
    const { tx } = state
    setSaving(true)
    const result = await createTransaction(userId, {
      amount: tx.amount,
      currency: tx.currency,
      type: tx.type,
      category_id: tx.category_id,
      account_id: accountId,
      description: tx.description,
      date: tx.date,
      notes: undefined,
    })
    setSaving(false)

    if (!result.success) {
      toaster.create({ title: 'Error al guardar', description: result.error, type: 'error', duration: 4000 })
      return
    }
    const category = categories.find((c) => c.id === tx.category_id)
    toaster.create({
      title: [
        tx.type === 'expense' ? 'Gasto registrado' : 'Ingreso registrado',
        category?.name,
        formatCurrency(tx.amount, tx.currency, decimalsFor(tx.currency)),
      ]
        .filter(Boolean)
        .join(' · '),
      type: 'success',
      duration: 2600,
    })
    setOpen(false)
    reset()
    router.refresh()
  }

  const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return
    e.preventDefault()
    // Enter interprets new text; on an unchanged result it saves.
    if (state.status === 'result' && input.trim() === state.text) save()
    else interpret(input)
  }

  const category =
    state.status === 'result' ? categories.find((c) => c.id === state.tx.category_id) : undefined

  return (
    <DialogRoot
      open={open}
      onOpenChange={({ open: next }) => {
        setOpen(next)
        if (!next && !saving) reset()
      }}
      initialFocusEl={() => inputRef.current}
      placement="top"
      lazyMount
      unmountOnExit
    >
      <DialogBackdrop />
      <DialogPositioner>
        <DialogContent
          aria-label="Registrar con IA"
          w="min(600px, calc(100vw - 32px))"
          maxW="none"
          mt="12vh"
          borderRadius="26px"
          overflow="hidden"
        >
          {/* Input row */}
          <Flex align="center" gap={3} px={5} py={4} borderBottomWidth="1px" borderColor="line">
            <Icon as={LuSparkles} boxSize="20px" color="brand" flexShrink={0} />
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onInputKeyDown}
              placeholder="¿Qué gastaste o recibiste?"
              aria-label="¿Qué gastaste o recibiste?"
              variant="flushed"
              borderBottomWidth="0"
              fontSize="17px"
              h="auto"
              px={0}
              _focusVisible={{ boxShadow: 'none' }}
              color="text"
              _placeholder={{ color: 'text3' }}
            />
            {speech.isSupported && (
              <IconButton
                aria-label={speech.isRecording ? 'Detener dictado' : 'Dictar'}
                onClick={speech.toggle}
                size="sm"
                variant="ghost"
                color={speech.isRecording ? 'neg' : 'text2'}
                bg={speech.isRecording ? 'negSoft' : undefined}
                _hover={{ bg: 'surface2' }}
              >
                {speech.isRecording ? <LuSquare /> : <LuMic />}
              </IconButton>
            )}
            <Text
              as="kbd"
              fontFamily="mono"
              fontSize="11px"
              color="text3"
              bg="surface2"
              px={2}
              py={0.5}
              borderRadius="md"
              display={{ base: 'none', md: 'inline' }}
            >
              ESC
            </Text>
          </Flex>

          <Box px={5} py={5}>
            {state.status === 'idle' && (
              <Stack gap={3}>
                <Text textStyle="sectionLabel" color="text3">
                  Prueba con
                </Text>
                <Stack gap={1}>
                  {SUGGESTIONS.map((s) => (
                    <Button
                      key={s}
                      onClick={() => interpret(s)}
                      variant="ghost"
                      justifyContent="flex-start"
                      color="text2"
                      fontWeight="400"
                      borderRadius="input"
                      _hover={{ bg: 'surface2', color: 'text' }}
                    >
                      “{s}”
                    </Button>
                  ))}
                </Stack>
              </Stack>
            )}

            {state.status === 'loading' && (
              <Flex align="center" gap={3} color="text2" fontSize="sm" py={2}>
                <Spinner size="sm" color="brand" />
                Entendiendo “{state.text}”…
              </Flex>
            )}

            {state.status === 'error' && (
              <Text color="text2" fontSize="sm">
                No pude registrar “{state.text}”. {state.message} Prueba con más detalle, por
                ejemplo “mercado 120 mil en Bancolombia”.
              </Text>
            )}

            {state.status === 'result' && (
              <Stack gap={4}>
                <Box bg="bg" borderRadius="tile" p={4}>
                  <Text color="text3" fontSize="13px" mb={3}>
                    “{state.text}”
                  </Text>
                  <Flex align="center" gap={3}>
                    <Flex
                      align="center"
                      justify="center"
                      boxSize="36px"
                      borderRadius="10px"
                      bg="surface2"
                      fontSize="18px"
                      flexShrink={0}
                    >
                      {category?.icon ?? '🏷️'}
                    </Flex>
                    <Box flex="1" minW={0}>
                      <Text fontSize="14px" fontWeight="500" color="text" truncate>
                        {category?.name ?? 'Sin categoría'}
                      </Text>
                      <Text fontSize="12px" color="text3" truncate>
                        {state.tx.description} · {formatDay(state.tx.date)}
                      </Text>
                    </Box>
                    <Money
                      amount={state.tx.amount}
                      currency={state.tx.currency}
                      kind={state.tx.type}
                      fractionDigits={decimalsFor(state.tx.currency)}
                      fontSize="18px"
                      fontWeight="500"
                    />
                  </Flex>
                </Box>

                {accounts.length > 0 && (
                  <Stack gap={2}>
                    <Text textStyle="sectionLabel" color="text3">
                      Cuenta
                    </Text>
                    <Flex gap={2} overflowX="auto" pb={1} css={{ scrollbarWidth: 'none' }}>
                      {[{ id: null, name: 'Sin cuenta', icon: null }, ...accounts].map((account) => {
                        const selected = accountId === account.id
                        return (
                          <Button
                            key={account.id ?? 'none'}
                            onClick={() => setAccountId(account.id)}
                            aria-pressed={selected}
                            size="sm"
                            flexShrink={0}
                            bg={selected ? 'brandSolid' : 'surface2'}
                            color={selected ? 'white' : 'text2'}
                            _hover={{ bg: selected ? 'brandSolid' : 'line' }}
                            fontWeight="500"
                          >
                            {account.icon && <span>{account.icon}</span>}
                            {account.name}
                          </Button>
                        )
                      })}
                    </Flex>
                  </Stack>
                )}

                <Flex justify="flex-end" gap={2}>
                  <Button
                    variant="ghost"
                    color="text2"
                    onClick={() => {
                      reset()
                      inputRef.current?.focus()
                    }}
                    disabled={saving}
                  >
                    Descartar
                  </Button>
                  <Button
                    bg="brandSolid"
                    color="white"
                    _hover={{ bg: 'brand.600' }}
                    onClick={save}
                    loading={saving}
                  >
                    Guardar ↵
                  </Button>
                </Flex>
              </Stack>
            )}
          </Box>
        </DialogContent>
      </DialogPositioner>
    </DialogRoot>
  )
}
