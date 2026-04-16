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
} from '@chakra-ui/react'
import { useCallback, useEffect, useState } from 'react'
import { getTransactions } from '@/lib/actions/transactions.actions'
import { toaster } from '@/lib/toaster'
import type { TransactionWithCategory } from '@/types/database.types'

interface Props {
  userId: string
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export function TransactionCalendar({ userId }: Props) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [transactions, setTransactions] = useState<TransactionWithCategory[]>([])
  const [selectedDay, setSelectedDay] = useState<TransactionWithCategory[] | null>(null)
  const [loading, setLoading] = useState(true)

  const loadTransactions = useCallback(async () => {
    setLoading(true)
    const result = await getTransactions(userId, 1000)
    if (result.success) {
      setTransactions(result.data || [])
    } else {
      if (result.error) {
        toaster.error({ title: result.error })
      }
    }
    setLoading(false)
  }, [userId])

  useEffect(() => {
    loadTransactions()
  }, [loadTransactions])

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

  if (loading) return <Text>Loading...</Text>

  return (
    <>
      <Box borderWidth="1px" borderRadius="lg" p="6" bg="bg.surface">
        <VStack gap="4" alignItems="stretch">
          {/* Header */}
          <HStack justifyContent="space-between" alignItems="center">
            <Button onClick={handlePrevMonth} variant="ghost">
              ← Prev
            </Button>
            <Text fontSize="lg" fontWeight="bold">
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </Text>
            <Button onClick={handleNextMonth} variant="ghost">
              Next →
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
                  bg={hasTransactions ? 'blue.50' : 'bg.muted'}
                  cursor={hasTransactions ? 'pointer' : 'default'}
                  onClick={() => hasTransactions && handleDayClick(day)}
                  _hover={hasTransactions ? { bg: 'blue.100' } : {}}
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
                            {t.amount.toLocaleString()} {t.currency}
                          </Badge>
                        ))}
                        {dayTransactions.length > 2 && (
                          <Text fontSize="xs" color="fg.muted">
                            +{dayTransactions.length - 2} more
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
      <DialogRoot open={selectedDay !== null} onOpenChange={details => !details.open && setSelectedDay(null)}>
        <DialogBackdrop />
        <DialogPositioner>
          <DialogContent maxW="md">
            <DialogHeader>
              <DialogTitle>Transactions for {selectedDay?.length ? new Date(selectedDay[0].date).toLocaleDateString() : ''}</DialogTitle>
              <DialogCloseTrigger />
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
                        <Text fontWeight="bold" color={txn.type === 'income' ? 'green.600' : 'red.600'}>
                          {txn.type === 'income' ? '+' : '-'} {txn.amount.toLocaleString()} {txn.currency}
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
                  <Text color="fg.muted">No transactions</Text>
                )}
              </VStack>
            </DialogBody>
          </DialogContent>
        </DialogPositioner>
      </DialogRoot>
    </>
  )
}
