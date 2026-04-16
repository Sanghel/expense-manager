'use client'

import {
  Box,
  VStack,
  HStack,
  Text,
  Input,
  Button,
  Badge,
  Spinner,
  Separator,
  Icon,
} from '@chakra-ui/react'
import { useState, useRef, useEffect } from 'react'
import { FiSend, FiCheck, FiX, FiMessageSquare, FiXCircle } from 'react-icons/fi'
import { categorizePurchase, type CategorizedTransaction } from '@/lib/actions/ai.actions'
import { createTransaction } from '@/lib/actions/transactions.actions'
import { toaster } from '@/lib/toaster'
import type { Category } from '@/types/database.types'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  text: string
  preview?: CategorizedTransaction & { category_name?: string }
  timestamp: number
}

interface Props {
  userId: string
  categories: Category[]
  onClose?: () => void
}

const STORAGE_KEY = 'chat-ia-history'

function loadHistory(): ChatMessage[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as ChatMessage[]) : []
  } catch {
    return []
  }
}

function saveHistory(messages: ChatMessage[]) {
  try {
    // Guardar solo los últimos 50 mensajes
    const toSave = messages.slice(-50)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
  } catch {
    // localStorage puede estar lleno
  }
}

export function ChatInterface({ userId, categories, onClose }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Cargar historial al montar
  useEffect(() => {
    const history = loadHistory()
    if (history.length > 0) {
      setMessages(history)
    } else {
      setMessages([
        {
          id: 'welcome',
          role: 'system',
          text: '¡Hola! Escribe tus gastos o ingresos en lenguaje natural y los categorizo automáticamente. Por ejemplo: "Gasté 45.000 en el supermercado" o "Recibí 500 dólares de salario".',
          timestamp: Date.now(),
        },
      ])
    }
  }, [])

  // Scroll al fondo cuando llegan mensajes nuevos
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const addMessage = (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMsg: ChatMessage = {
      ...msg,
      id: `${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
    }
    setMessages((prev) => {
      const updated = [...prev, newMsg]
      saveHistory(updated)
      return updated
    })
    return newMsg
  }

  const handleSend = async () => {
    const text = input.trim()
    if (!text || loading) return

    setInput('')
    setLoading(true)

    addMessage({ role: 'user', text })

    const result = await categorizePurchase(
      text,
      categories.map((c) => ({ id: c.id, name: c.name, type: c.type }))
    )

    if (!result.success) {
      addMessage({
        role: 'assistant',
        text: `No pude procesar ese mensaje. ${result.error}. Intenta con más detalle, por ejemplo: "Compré comida por 30.000 pesos".`,
      })
      setLoading(false)
      return
    }

    const category = categories.find((c) => c.id === result.data.category_id)
    const preview = { ...result.data, category_name: category?.name ?? 'Sin categoría' }

    const typeLabel = result.data.type === 'expense' ? 'gasto' : 'ingreso'
    const formattedAmount = new Intl.NumberFormat('es-CO').format(result.data.amount)

    addMessage({
      role: 'assistant',
      text: `Detecté un ${typeLabel} de ${formattedAmount} ${result.data.currency} en "${preview.category_name}" para el ${result.data.date}. ¿Confirmas?`,
      preview,
    })

    setLoading(false)
  }

  const handleConfirm = async (msg: ChatMessage) => {
    if (!msg.preview) return

    const result = await createTransaction(userId, {
      amount: msg.preview.amount,
      currency: msg.preview.currency,
      type: msg.preview.type,
      category_id: msg.preview.category_id,
      description: msg.preview.description,
      date: msg.preview.date,
      notes: undefined,
    })

    if (result.success) {
      toaster.create({ title: 'Transacción guardada', type: 'success', duration: 3000 })
      // Marcar el mensaje como confirmado (sin preview)
      setMessages((prev) => {
        const updated = prev.map((m) =>
          m.id === msg.id ? { ...m, preview: undefined, text: `✅ ${m.text}` } : m
        )
        saveHistory(updated)
        return updated
      })
      addMessage({ role: 'system', text: '¡Listo! La transacción fue registrada correctamente.' })
    } else {
      toaster.create({ title: 'Error al guardar', description: result.error, type: 'error', duration: 4000 })
    }
  }

  const handleDiscard = (msgId: string) => {
    setMessages((prev) => {
      const updated = prev.map((m) =>
        m.id === msgId ? { ...m, preview: undefined, text: `❌ ${m.text}` } : m
      )
      saveHistory(updated)
      return updated
    })
    addMessage({ role: 'system', text: 'Entendido, descartado. ¿Quieres intentarlo de nuevo con más detalle?' })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleClearHistory = () => {
    localStorage.removeItem(STORAGE_KEY)
    setMessages([
      {
        id: 'welcome',
        role: 'system',
        text: '¡Hola! Escribe tus gastos o ingresos en lenguaje natural y los categorizo automáticamente.',
        timestamp: Date.now(),
      },
    ])
  }

  return (
    <VStack gap={0} h="full" maxH="calc(100vh - 160px)">
      {/* Encabezado */}
      <HStack w="full" p={4} borderBottomWidth="1px" borderColor="gray.200" bg="white" justify="space-between">
        <HStack gap={2}>
          <Icon as={FiMessageSquare} color="brand.500" boxSize={5} />
          <Text fontWeight="semibold" color="gray.700">Chat IA</Text>
        </HStack>
        <HStack gap={1}>
          <Button size="xs" variant="ghost" colorPalette="gray" onClick={handleClearHistory}>
            Limpiar
          </Button>
          {onClose && (
            <Button size="xs" variant="ghost" colorPalette="gray" onClick={onClose} aria-label="Cerrar chat">
              <Icon as={FiXCircle} />
            </Button>
          )}
        </HStack>
      </HStack>

      {/* Mensajes */}
      <Box flex="1" overflowY="auto" w="full" p={4} bg="gray.50">
        <VStack gap={3} align="stretch">
          {messages.map((msg) => (
            <Box key={msg.id}>
              {msg.role === 'user' && (
                <HStack justify="flex-end">
                  <Box
                    bg="brand.500"
                    color="white"
                    px={4}
                    py={2}
                    borderRadius="2xl"
                    borderBottomRightRadius="sm"
                    maxW="80%"
                  >
                    <Text fontSize="sm">{msg.text}</Text>
                  </Box>
                </HStack>
              )}

              {msg.role === 'assistant' && (
                <VStack align="flex-start" gap={2} maxW="85%">
                  <Box
                    bg="white"
                    border="1px solid"
                    borderColor="gray.200"
                    px={4}
                    py={2}
                    borderRadius="2xl"
                    borderBottomLeftRadius="sm"
                  >
                    <Text fontSize="sm" color="gray.700">{msg.text}</Text>
                  </Box>

                  {msg.preview && (
                    <Box
                      bg="white"
                      border="1px solid"
                      borderColor="brand.200"
                      borderRadius="xl"
                      p={4}
                      w="full"
                      shadow="sm"
                    >
                      <Text fontSize="xs" fontWeight="bold" color="gray.500" mb={2} textTransform="uppercase">
                        Vista previa
                      </Text>
                      <VStack gap={1} align="stretch" mb={3}>
                        <HStack justify="space-between">
                          <Text fontSize="sm" color="gray.600">Tipo</Text>
                          <Badge colorPalette={msg.preview.type === 'expense' ? 'red' : 'green'} size="sm">
                            {msg.preview.type === 'expense' ? 'Gasto' : 'Ingreso'}
                          </Badge>
                        </HStack>
                        <Separator />
                        <HStack justify="space-between">
                          <Text fontSize="sm" color="gray.600">Monto</Text>
                          <Text fontSize="sm" fontWeight="bold">
                            {new Intl.NumberFormat('es-CO').format(msg.preview.amount)} {msg.preview.currency}
                          </Text>
                        </HStack>
                        <Separator />
                        <HStack justify="space-between">
                          <Text fontSize="sm" color="gray.600">Descripción</Text>
                          <Text fontSize="sm">{msg.preview.description}</Text>
                        </HStack>
                        <Separator />
                        <HStack justify="space-between">
                          <Text fontSize="sm" color="gray.600">Categoría</Text>
                          <Text fontSize="sm">{msg.preview.category_name}</Text>
                        </HStack>
                        <Separator />
                        <HStack justify="space-between">
                          <Text fontSize="sm" color="gray.600">Fecha</Text>
                          <Text fontSize="sm">{msg.preview.date}</Text>
                        </HStack>
                      </VStack>
                      <HStack gap={2}>
                        <Button
                          size="sm"
                          colorPalette="green"
                          flex="1"
                          onClick={() => handleConfirm(msg)}
                        >
                          <Icon as={FiCheck} />
                          Confirmar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          colorPalette="red"
                          flex="1"
                          onClick={() => handleDiscard(msg.id)}
                        >
                          <Icon as={FiX} />
                          Descartar
                        </Button>
                      </HStack>
                    </Box>
                  )}
                </VStack>
              )}

              {msg.role === 'system' && (
                <HStack justify="center">
                  <Text fontSize="xs" color="gray.400" textAlign="center" maxW="70%">
                    {msg.text}
                  </Text>
                </HStack>
              )}
            </Box>
          ))}

          {loading && (
            <HStack>
              <Box bg="white" border="1px solid" borderColor="gray.200" px={4} py={2} borderRadius="2xl">
                <HStack gap={2}>
                  <Spinner size="xs" color="brand.500" />
                  <Text fontSize="sm" color="gray.500">Analizando...</Text>
                </HStack>
              </Box>
            </HStack>
          )}

          <div ref={bottomRef} />
        </VStack>
      </Box>

      {/* Input */}
      <HStack w="full" p={4} borderTopWidth="1px" borderColor="gray.200" bg="white" gap={2}>
        <Input
          placeholder="Escribe tu gasto, ej: &quot;Pagué 80.000 en restaurante&quot;"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
          flex="1"
          size="md"
        />
        <Button
          colorPalette="brand"
          onClick={handleSend}
          disabled={!input.trim() || loading}
          size="md"
        >
          <Icon as={FiSend} />
        </Button>
      </HStack>
    </VStack>
  )
}
