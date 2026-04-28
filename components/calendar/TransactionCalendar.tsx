'use client'

import {
  Box,
  Button,
  Grid,
  HStack,
  Text,
  VStack,
  Badge,
  DialogRoot,
  DialogBackdrop,
  DialogPositioner,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogCloseTrigger,
  IconButton,
  Icon,
  useBreakpointValue,
} from '@chakra-ui/react'
import { FiX, FiChevronDown, FiChevronRight } from 'react-icons/fi'
import { useState } from 'react'
import type { TransactionWithCategory } from '@/types/database.types'
import { formatCurrency } from '@/lib/utils/currency'
import { getLocalDateString } from '@/lib/utils/dates'

interface Props {
  userId: string
  initialTransactions: TransactionWithCategory[]
}

const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
const TYPE_LABELS: Record<string, string> = { expense: 'Gasto', income: 'Ingreso' }

export function TransactionCalendar({ initialTransactions }: Props) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [transactions] = useState<TransactionWithCategory[]>(initialTransactions)
  const [selectedDay, setSelectedDay] = useState<TransactionWithCategory[] | null>(null)
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set())
  const isMobile = useBreakpointValue({ base: true, md: false })

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const getTransactionsForDay = (day: number) => {
    const dateStr = getLocalDateString(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))
    return transactions.filter(t => t.date === dateStr)
  }

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
    setExpandedDays(new Set())
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
    setExpandedDays(new Set())
  }

  const handleDayClick = (day: number) => {
    setSelectedDay(getTransactionsForDay(day))
  }

  const toggleDayExpand = (day: number) => {
    setExpandedDays(prev => {
      const next = new Set(prev)
      if (next.has(day)) next.delete(day)
      else next.add(day)
      return next
    })
  }

  const daysInMonth = getDaysInMonth(currentDate)
  const firstDay = getFirstDayOfMonth(currentDate)

  const monthHeader = (
    <HStack justifyContent="space-between" alignItems="center">
      <Button onClick={handlePrevMonth} variant="ghost" size={{ base: 'sm', md: 'md' }}>
        ← Anterior
      </Button>
      <Text fontSize={{ base: 'md', md: 'lg' }} fontWeight="bold">
        {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
      </Text>
      <Button onClick={handleNextMonth} variant="ghost" size={{ base: 'sm', md: 'md' }}>
        Siguiente →
      </Button>
    </HStack>
  )

  // Desktop grid view
  const desktopView = (() => {
    const days: (number | null)[] = []
    for (let i = 0; i < firstDay; i++) days.push(null)
    for (let i = 1; i <= daysInMonth; i++) days.push(i)

    return (
      <>
        <Grid templateColumns="repeat(7, 1fr)" gap="1">
          {WEEKDAYS.map(day => (
            <Text key={day} textAlign="center" fontWeight="bold" fontSize="sm" py="2">
              {day}
            </Text>
          ))}
        </Grid>
        <Grid templateColumns="repeat(7, 1fr)" gap="1" autoRows="minmax(100px, 1fr)">
          {days.map((day, idx) => {
            if (day === null) return <Box key={`empty-${idx}`} />
            const dayTransactions = getTransactionsForDay(day)
            const hasTransactions = dayTransactions.length > 0
            return (
              <Box
                key={day}
                borderWidth="1px"
                borderRadius="md"
                p="2"
                bg={hasTransactions ? '#1a1a27' : 'transparent'}
                borderColor={hasTransactions ? '#4F46E5' : '#2d2d35'}
                cursor={hasTransactions ? 'pointer' : 'default'}
                onClick={() => hasTransactions && handleDayClick(day)}
                _hover={hasTransactions ? { bg: '#252535' } : { bg: '#1a1a1a' }}
                transition="background 0.2s"
              >
                <VStack alignItems="flex-start" gap="1" height="100%">
                  <Text fontWeight="bold" fontSize="sm">{day}</Text>
                  {dayTransactions.length > 0 && (
                    <VStack alignItems="flex-start" gap="0.5" width="100%" flex="1" overflowY="auto">
                      {dayTransactions.slice(0, 2).map(t => (
                        <Badge
                          key={t.id}
                          fontSize="xs"
                          variant="subtle"
                          colorScheme={t.type === 'income' ? 'green' : 'red'}
                          width="100%"
                          justifyContent="flex-start"
                        >
                          {formatCurrency(Number(t.amount), t.currency)}
                        </Badge>
                      ))}
                      {dayTransactions.length > 2 && (
                        <Text fontSize="xs" color="fg.muted">+{dayTransactions.length - 2} más</Text>
                      )}
                    </VStack>
                  )}
                </VStack>
              </Box>
            )
          })}
        </Grid>
      </>
    )
  })()

  // Mobile list view
  const mobileView = (() => {
    const daysWithTxns: { day: number; weekday: string; txns: TransactionWithCategory[] }[] = []
    for (let d = 1; d <= daysInMonth; d++) {
      const txns = getTransactionsForDay(d)
      if (txns.length > 0) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), d)
        daysWithTxns.push({ day: d, weekday: WEEKDAYS[date.getDay()], txns })
      }
    }

    if (daysWithTxns.length === 0) {
      return (
        <Box py={8} textAlign="center">
          <Text color="#808080">Sin transacciones este mes</Text>
        </Box>
      )
    }

    return (
      <VStack gap={2} align="stretch">
        {daysWithTxns.map(({ day, weekday, txns }) => {
          const isExpanded = expandedDays.has(day)
          const income = txns.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
          const expense = txns.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
          const currency = txns[0].currency

          return (
            <Box key={day} borderWidth="1px" borderRadius="lg" borderColor="#2d2d35" overflow="hidden">
              <HStack
                px={4}
                py={3}
                justify="space-between"
                bg="#1a1a27"
                cursor="pointer"
                onClick={() => toggleDayExpand(day)}
                _hover={{ bg: '#252535' }}
              >
                <HStack gap={3}>
                  <Box
                    w={9}
                    h={9}
                    borderRadius="full"
                    bg="#4F46E5"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    flexShrink={0}
                  >
                    <Text fontWeight="bold" fontSize="sm" color="white">{day}</Text>
                  </Box>
                  <VStack align="flex-start" gap={0}>
                    <Text fontSize="sm" fontWeight="semibold" color="white">{weekday}</Text>
                    <Text fontSize="xs" color="#808080">{txns.length} transacción{txns.length !== 1 ? 'es' : ''}</Text>
                  </VStack>
                </HStack>
                <HStack gap={3}>
                  {income > 0 && (
                    <Text fontSize="xs" color="#10B981" fontWeight="semibold">
                      +{formatCurrency(income, currency)}
                    </Text>
                  )}
                  {expense > 0 && (
                    <Text fontSize="xs" color="#F43F5E" fontWeight="semibold">
                      -{formatCurrency(expense, currency)}
                    </Text>
                  )}
                  <Icon as={isExpanded ? FiChevronDown : FiChevronRight} color="#808080" boxSize={4} />
                </HStack>
              </HStack>

              {isExpanded && (
                <VStack gap={0} align="stretch" px={4} py={2} bg="#18181d">
                  {txns.map((t, idx) => (
                    <HStack
                      key={t.id}
                      justify="space-between"
                      py={2}
                      borderTopWidth={idx > 0 ? '1px' : '0'}
                      borderColor="#2d2d35"
                    >
                      <VStack align="flex-start" gap={0}>
                        <Text fontSize="sm" color="white">{t.description}</Text>
                        <HStack gap={1}>
                          <Text fontSize="xs" color="#808080">{t.category.name}</Text>
                          <Text fontSize="xs" color="#808080">·</Text>
                          <Text fontSize="xs" color="#808080">{TYPE_LABELS[t.type] ?? t.type}</Text>
                        </HStack>
                      </VStack>
                      <Text
                        fontSize="sm"
                        fontWeight="semibold"
                        color={t.type === 'income' ? '#10B981' : '#F43F5E'}
                      >
                        {t.type === 'income' ? '+' : '-'}{formatCurrency(Number(t.amount), t.currency)}
                      </Text>
                    </HStack>
                  ))}
                </VStack>
              )}
            </Box>
          )
        })}
      </VStack>
    )
  })()

  return (
    <>
      <Box borderWidth="1px" borderRadius="lg" p={{ base: 4, md: 6 }} bg="bg.surface" width="100%">
        <VStack gap="4" alignItems="stretch">
          {monthHeader}
          {isMobile ? mobileView : desktopView}
        </VStack>
      </Box>

      {/* Day details dialog (desktop only — mobile uses inline expand) */}
      {!isMobile && (
        <DialogRoot open={selectedDay !== null} onOpenChange={details => !details.open && setSelectedDay(null)} size="md" placement="center" lazyMount unmountOnExit closeOnInteractOutside={false}>
          <DialogBackdrop />
          <DialogPositioner>
            <DialogContent tabIndex={-1} mx={{ base: 3, md: 0 }} style={{ marginTop: 'max(16px, env(safe-area-inset-top))' }}>
              <DialogHeader borderBottomWidth="1px" borderColor="#2d2d35" py={4}>
                <HStack justify="space-between" align="center">
                  <DialogTitle color="white">Transacciones del {selectedDay?.[0] && new Date(selectedDay[0].date).toLocaleDateString('es-ES')}</DialogTitle>
                  <DialogCloseTrigger asChild>
                    <IconButton
                      aria-label="Cerrar"
                      size="sm"
                      variant="ghost"
                      color="#B0B0B0"
                      _hover={{ color: 'white', bg: '#2d2d35' }}
                      onClick={() => setSelectedDay(null)}
                    >
                      <Icon as={FiX} />
                    </IconButton>
                  </DialogCloseTrigger>
                </HStack>
              </DialogHeader>
              <DialogBody>
                <VStack alignItems="flex-start" gap="2">
                  {selectedDay && selectedDay.length > 0 ? (
                    selectedDay.map(txn => (
                      <Box
                        key={txn.id}
                        width="100%"
                        p="3"
                        borderWidth="1px"
                        borderRadius="md"
                        bg="bg.muted"
                      >
                        <HStack justifyContent="space-between" mb="1">
                          <Text fontWeight="bold">{txn.description}</Text>
                          <Text fontWeight="bold" color={txn.type === 'income' ? '#10B981' : '#F43F5E'}>
                            {txn.type === 'income' ? '+' : '-'}{formatCurrency(Number(txn.amount), txn.currency)}
                          </Text>
                        </HStack>
                        <HStack justifyContent="space-between" fontSize="sm" color="fg.muted">
                          <Text>{txn.category.name}</Text>
                          <Text>{TYPE_LABELS[txn.type] ?? txn.type}</Text>
                        </HStack>
                        {txn.notes && (
                          <Text fontSize="sm" mt="2" color="fg.muted">
                            {txn.notes}
                          </Text>
                        )}
                      </Box>
                    ))
                  ) : (
                    <Text color="fg.muted">Sin transacciones</Text>
                  )}
                </VStack>
              </DialogBody>
            </DialogContent>
          </DialogPositioner>
        </DialogRoot>
      )}
    </>
  )
}
