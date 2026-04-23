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
} from '@chakra-ui/react'
import { FiX } from 'react-icons/fi'
import { useState } from 'react'
import type { TransactionWithCategory } from '@/types/database.types'
import { formatCurrency } from '@/lib/utils/currency'

interface Props {
  userId: string
  initialTransactions: TransactionWithCategory[]
}

const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

export function TransactionCalendar({ initialTransactions }: Props) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [transactions] = useState<TransactionWithCategory[]>(initialTransactions)
  const [selectedDay, setSelectedDay] = useState<TransactionWithCategory[] | null>(null)

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const getTransactionsForDay = (day: number) => {
    const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
      .toISOString()
      .split('T')[0]
    return transactions.filter(t => t.date === dateStr)
  }

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const handleDayClick = (day: number) => {
    setSelectedDay(getTransactionsForDay(day))
  }

  const daysInMonth = getDaysInMonth(currentDate)
  const firstDay = getFirstDayOfMonth(currentDate)
  const days = []

  // Empty cells for days before month starts
  for (let i = 0; i < firstDay; i++) {
    days.push(null)
  }

  // Days of month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i)
  }

  return (
    <>
      <Box borderWidth="1px" borderRadius="lg" p="6" bg="bg.surface" width="100%">
        <VStack gap="4" alignItems="stretch">
          {/* Header */}
          <HStack justifyContent="space-between" alignItems="center">
            <Button onClick={handlePrevMonth} variant="ghost">
              ← Anterior
            </Button>
            <Text fontSize="lg" fontWeight="bold">
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </Text>
            <Button onClick={handleNextMonth} variant="ghost">
              Siguiente →
            </Button>
          </HStack>

          {/* Weekday headers */}
          <Grid templateColumns="repeat(7, 1fr)" gap="1">
            {WEEKDAYS.map(day => (
              <Text key={day} textAlign="center" fontWeight="bold" fontSize="sm" py="2">
                {day}
              </Text>
            ))}
          </Grid>

          {/* Calendar days */}
          <Grid templateColumns="repeat(7, 1fr)" gap="1" autoRows="minmax(100px, 1fr)">
            {days.map((day, idx) => {
              if (day === null) {
                return <Box key={`empty-${idx}`} />
              }

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
                    <Text fontWeight="bold" fontSize="sm">
                      {day}
                    </Text>
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
                          <Text fontSize="xs" color="fg.muted">
                            +{dayTransactions.length - 2} más
                          </Text>
                        )}
                      </VStack>
                    )}
                  </VStack>
                </Box>
              )
            })}
          </Grid>
        </VStack>
      </Box>

      {/* Day details dialog */}
      <DialogRoot open={selectedDay !== null} onOpenChange={details => !details.open && setSelectedDay(null)} size="md" placement="center" lazyMount unmountOnExit closeOnInteractOutside={false}>
        <DialogBackdrop />
        <DialogPositioner>
          <DialogContent tabIndex={-1} mx={{ base: 3, md: 0 }}>
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
                        <Text>{txn.type}</Text>
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
    </>
  )
}
