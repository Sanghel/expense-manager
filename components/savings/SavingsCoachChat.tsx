'use client'

import { Box, VStack, HStack, Text, Input, Button, Icon, Spinner } from '@chakra-ui/react'
import { useState, useRef, useEffect, useCallback } from 'react'
import { FiSend, FiMessageCircle } from 'react-icons/fi'
import { askSavingsCoach } from '@/lib/actions/savingsAdvice.actions'
import { toaster } from '@/lib/toaster'

interface CoachMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
}

const STORAGE_KEY = 'savings-coach-history'

const SUGGESTIONS = [
  '¿En qué estoy gastando de más?',
  '¿Cómo puedo ahorrar este mes?',
  '¿Voy bien con mis presupuestos?',
]

function loadHistory(): CoachMessage[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as CoachMessage[]) : []
  } catch {
    return []
  }
}

function saveHistory(messages: CoachMessage[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-50)))
  } catch {
    // localStorage puede estar lleno
  }
}

interface Props {
  userId: string
}

export function SavingsCoachChat({ userId }: Props) {
  const [messages, setMessages] = useState<CoachMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Load on mount (not a lazy initializer) to avoid an SSR hydration mismatch.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMessages(loadHistory())
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = useCallback(
    async (textOverride?: string) => {
      const text = (textOverride ?? input).trim()
      if (!text || loading) return

      setInput('')
      setLoading(true)

      const userMsg: CoachMessage = { id: `${Date.now()}-u`, role: 'user', text }
      const withUser = [...messages, userMsg]
      setMessages(withUser)
      saveHistory(withUser)

      const result = await askSavingsCoach(
        userId,
        withUser.map((m) => ({ role: m.role, content: m.text }))
      )

      if (!result.success || !result.text) {
        toaster.create({ title: 'Error', description: result.error, type: 'error', duration: 4000 })
        setLoading(false)
        return
      }

      const assistantMsg: CoachMessage = { id: `${Date.now()}-a`, role: 'assistant', text: result.text }
      setMessages((prev) => {
        const updated = [...prev, assistantMsg]
        saveHistory(updated)
        return updated
      })
      setLoading(false)
    },
    [input, loading, messages, userId]
  )

  const handleClear = () => {
    localStorage.removeItem(STORAGE_KEY)
    setMessages([])
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const isEmpty = messages.length === 0

  return (
    <Box borderWidth="1px" borderColor="#2d2d35" borderRadius="lg" bg="#1a1a23" overflow="hidden">
      <HStack justify="space-between" p={4} borderBottomWidth="1px" borderColor="#2d2d35" bg="#18181d">
        <HStack gap={2}>
          <Icon as={FiMessageCircle} color="#6366f1" boxSize={5} />
          <Text fontWeight="semibold" color="white">
            Coach de ahorro
          </Text>
        </HStack>
        {!isEmpty && (
          <Button size="xs" variant="ghost" colorPalette="gray" onClick={handleClear}>
            Limpiar
          </Button>
        )}
      </HStack>

      <Box maxH="420px" overflowY="auto" p={4} bg="#0f0f13">
        {isEmpty ? (
          <VStack gap={3} align="stretch" py={2}>
            <Text fontSize="sm" color="#B0B0B0">
              Pregúntame sobre tus finanzas. Por ejemplo:
            </Text>
            {SUGGESTIONS.map((s) => (
              <Button
                key={s}
                size="sm"
                variant="outline"
                borderColor="#2d2d35"
                color="#B0B0B0"
                justifyContent="flex-start"
                _hover={{ borderColor: '#4F46E5', color: 'white' }}
                onClick={() => handleSend(s)}
              >
                {s}
              </Button>
            ))}
          </VStack>
        ) : (
          <VStack gap={3} align="stretch">
            {messages.map((msg) =>
              msg.role === 'user' ? (
                <HStack key={msg.id} justify="flex-end">
                  <Box
                    bg="#4F46E5"
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
              ) : (
                <HStack key={msg.id} justify="flex-start">
                  <Box
                    bg="#18181d"
                    border="1px solid"
                    borderColor="#2d2d35"
                    px={4}
                    py={2}
                    borderRadius="2xl"
                    borderBottomLeftRadius="sm"
                    maxW="85%"
                  >
                    <Text fontSize="sm" color="white" whiteSpace="pre-wrap">
                      {msg.text}
                    </Text>
                  </Box>
                </HStack>
              )
            )}
            {loading && (
              <HStack justify="flex-start">
                <Box bg="#18181d" border="1px solid" borderColor="#2d2d35" px={4} py={2} borderRadius="2xl">
                  <HStack gap={2}>
                    <Spinner size="xs" color="#6366f1" />
                    <Text fontSize="sm" color="#B0B0B0">
                      Pensando…
                    </Text>
                  </HStack>
                </Box>
              </HStack>
            )}
            <div ref={bottomRef} />
          </VStack>
        )}
      </Box>

      <HStack p={4} borderTopWidth="1px" borderColor="#2d2d35" bg="#18181d" gap={2}>
        <Input
          placeholder="Escribe tu pregunta…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
          flex="1"
          size="md"
        />
        <Button
          bg="#4F46E5"
          color="white"
          _hover={{ bg: '#4338CA' }}
          onClick={() => handleSend()}
          disabled={!input.trim() || loading}
          size="md"
        >
          <Icon as={FiSend} />
        </Button>
      </HStack>
    </Box>
  )
}
