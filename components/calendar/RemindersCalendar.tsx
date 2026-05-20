'use client'

import {
  Box,
  Button,
  Grid,
  HStack,
  Text,
  VStack,
  Badge,
  useBreakpointValue,
} from '@chakra-ui/react'
import { useState } from 'react'
import { FiPlus } from 'react-icons/fi'
import type { ReminderWithCategory, RecurringTransactionWithCategory, Account, Category } from '@/types/database.types'
import { formatCurrency } from '@/lib/utils/currency'
import { getLocalDateString } from '@/lib/utils/dates'
import { TransactionForm } from '@/components/transactions/TransactionForm'

const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

interface DayItem {
  type: 'reminder' | 'recurring'
  label: string
  icon: string
  color: string
  reminder?: ReminderWithCategory
  recurring?: RecurringTransactionWithCategory
}

function getItemsForDay(
  reminders: ReminderWithCategory[],
  recurring: RecurringTransactionWithCategory[],
  year: number,
  month: number,
  day: number
): DayItem[] {
  const date = new Date(year, month, day)
  const dayOfWeek = date.getDay()
  const dateStr = getLocalDateString(date)
  const items: DayItem[] = []

  for (const r of reminders) {
    if (!r.is_active) continue
    let matches = false
    switch (r.frequency) {
      case 'once':
        matches = r.specific_date === dateStr
        break
      case 'weekly':
        matches = r.day_of_week === dayOfWeek
        break
      case 'monthly':
        matches = r.day_of_month === day
        break
      case 'yearly':
        matches = r.day_of_month === day && r.month_of_year === (month + 1)
        break
    }
    if (matches) {
      items.push({
        type: 'reminder',
        label: r.description,
        icon: r.category?.icon ?? '🔔',
        color: r.category?.color ?? '#6366f1',
        reminder: r,
      })
    }
  }

  for (const rt of recurring) {
    if (!rt.is_active) continue
    if (dateStr < rt.start_date) continue
    if (rt.end_date && dateStr > rt.end_date) continue
    const startDate = new Date(rt.start_date + 'T12:00:00')
    let matches = false
    switch (rt.frequency) {
      case 'daily':
        matches = true
        break
      case 'weekly':
        matches = startDate.getDay() === dayOfWeek
        break
      case 'monthly':
        matches = startDate.getDate() === day
        break
      case 'yearly':
        matches = startDate.getDate() === day && startDate.getMonth() === month
        break
    }
    if (matches) {
      items.push({
        type: 'recurring',
        label: rt.description,
        icon: rt.category?.icon ?? '🔄',
        color: rt.category?.color ?? '#10B981',
        recurring: rt,
      })
    }
  }

  return items
}

interface Props {
  userId: string
  reminders: ReminderWithCategory[]
  recurringTransactions: RecurringTransactionWithCategory[]
  categories: Category[]
  accounts: Account[]
}

export function RemindersCalendar({ userId, reminders, recurringTransactions, categories, accounts }: Props) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [registerFor, setRegisterFor] = useState<{ date: string; reminder: ReminderWithCategory } | null>(null)
  const isMobile = useBreakpointValue({ base: true, md: false })

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDay = new Date(year, month, 1).getDay()
  const today = getLocalDateString(new Date())

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1))
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1))

  const monthHeader = (
    <HStack justifyContent="space-between" alignItems="center">
      <Button onClick={handlePrevMonth} variant="ghost" size={{ base: 'sm', md: 'md' }}>← Anterior</Button>
      <Text fontSize={{ base: 'md', md: 'lg' }} fontWeight="bold">
        {MONTHS[month]} {year}
      </Text>
      <Button onClick={handleNextMonth} variant="ghost" size={{ base: 'sm', md: 'md' }}>Siguiente →</Button>
    </HStack>
  )

  // Desktop grid
  const desktopView = (() => {
    const days: (number | null)[] = []
    for (let i = 0; i < firstDay; i++) days.push(null)
    for (let i = 1; i <= daysInMonth; i++) days.push(i)

    return (
      <>
        <Grid templateColumns="repeat(7, 1fr)" gap="1">
          {WEEKDAYS.map((d) => (
            <Text key={d} textAlign="center" fontWeight="bold" fontSize="sm" py="2">{d}</Text>
          ))}
        </Grid>
        <Grid templateColumns="repeat(7, 1fr)" gap="1" autoRows="minmax(100px, 1fr)">
          {days.map((day, idx) => {
            if (day === null) return <Box key={`empty-${idx}`} />
            const dateStr = getLocalDateString(new Date(year, month, day))
            const items = getItemsForDay(reminders, recurringTransactions, year, month, day)
            const isToday = dateStr === today
            return (
              <Box
                key={day}
                borderWidth="1px"
                borderRadius="md"
                p="2"
                bg={items.length > 0 ? '#1a1a27' : 'transparent'}
                borderColor={isToday ? '#4F46E5' : items.length > 0 ? '#3b3b4f' : '#2d2d35'}
                transition="background 0.2s"
              >
                <VStack alignItems="flex-start" gap="1" height="100%">
                  <HStack justify="space-between" w="full">
                    <Text fontWeight="bold" fontSize="sm" color={isToday ? '#818cf8' : 'white'}>{day}</Text>
                    {isToday && <Box w={2} h={2} borderRadius="full" bg="#4F46E5" />}
                  </HStack>
                  <VStack alignItems="flex-start" gap="0.5" width="100%" flex="1" overflowY="auto">
                    {items.slice(0, 3).map((item, i) => (
                      <HStack
                        key={i}
                        w="full"
                        gap={1}
                        cursor={item.type === 'reminder' && isToday ? 'pointer' : 'default'}
                        onClick={() => {
                          if (item.type === 'reminder' && item.reminder) {
                            setRegisterFor({ date: dateStr, reminder: item.reminder })
                          }
                        }}
                        _hover={item.type === 'reminder' && isToday ? { opacity: 0.8 } : {}}
                      >
                        <Box
                          w={2}
                          h={2}
                          borderRadius="full"
                          bg={item.color}
                          flexShrink={0}
                          mt="1px"
                        />
                        <Text fontSize="xs" color="#D0D0D0" lineClamp={1}>
                          {item.icon} {item.label}
                        </Text>
                      </HStack>
                    ))}
                    {items.length > 3 && (
                      <Text fontSize="xs" color="#808080">+{items.length - 3} más</Text>
                    )}
                  </VStack>
                </VStack>
              </Box>
            )
          })}
        </Grid>
      </>
    )
  })()

  // Mobile list
  const mobileView = (() => {
    const daysWithItems: { day: number; dateStr: string; items: DayItem[] }[] = []
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = getLocalDateString(new Date(year, month, d))
      const items = getItemsForDay(reminders, recurringTransactions, year, month, d)
      if (items.length > 0) daysWithItems.push({ day: d, dateStr, items })
    }

    if (daysWithItems.length === 0) {
      return (
        <Box py={8} textAlign="center">
          <Text color="#808080">Sin recordatorios ni suscripciones este mes</Text>
        </Box>
      )
    }

    return (
      <VStack gap={2} align="stretch">
        {daysWithItems.map(({ day, dateStr, items }) => {
          const isToday = dateStr === today
          return (
            <Box key={day} borderWidth="1px" borderRadius="lg" borderColor={isToday ? '#4F46E5' : '#2d2d35'} overflow="hidden">
              <HStack px={4} py={3} bg="#1a1a27" justify="space-between">
                <HStack gap={3}>
                  <Box
                    w={9} h={9}
                    borderRadius="full"
                    bg={isToday ? '#4F46E5' : '#2d2d35'}
                    display="flex" alignItems="center" justifyContent="center" flexShrink={0}
                  >
                    <Text fontWeight="bold" fontSize="sm" color="white">{day}</Text>
                  </Box>
                  <VStack align="flex-start" gap={0}>
                    <Text fontSize="sm" fontWeight="semibold" color="white">
                      {WEEKDAYS[new Date(year, month, day).getDay()]}
                      {isToday && <Badge ml={2} size="xs" colorPalette="purple">Hoy</Badge>}
                    </Text>
                    <Text fontSize="xs" color="#808080">{items.length} evento{items.length !== 1 ? 's' : ''}</Text>
                  </VStack>
                </HStack>
              </HStack>
              <VStack gap={0} align="stretch" px={4} py={2} bg="#18181d">
                {items.map((item, i) => (
                  <HStack
                    key={i}
                    justify="space-between"
                    py={2}
                    borderTopWidth={i > 0 ? '1px' : '0'}
                    borderColor="#2d2d35"
                  >
                    <HStack gap={2} flex={1}>
                      <Box w={2} h={2} borderRadius="full" bg={item.color} flexShrink={0} />
                      <VStack align="flex-start" gap={0} flex={1}>
                        <Text fontSize="sm" color="white">{item.icon} {item.label}</Text>
                        <HStack gap={1}>
                          <Badge size="xs" variant="outline" colorPalette={item.type === 'reminder' ? 'purple' : 'green'}>
                            {item.type === 'reminder' ? 'Recordatorio' : 'Suscripción'}
                          </Badge>
                          {item.recurring && (
                            <Text fontSize="xs" color="#808080">
                              {formatCurrency(Number(item.recurring.amount), item.recurring.currency)}
                            </Text>
                          )}
                        </HStack>
                      </VStack>
                    </HStack>
                    {item.type === 'reminder' && isToday && item.reminder && (
                      <Button
                        size="xs"
                        bg="#4F46E5"
                        color="white"
                        _hover={{ bg: '#4338CA' }}
                        flexShrink={0}
                        onClick={() => setRegisterFor({ date: dateStr, reminder: item.reminder! })}
                      >
                        <FiPlus />
                        Registrar
                      </Button>
                    )}
                  </HStack>
                ))}
              </VStack>
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

          {/* Legend */}
          <HStack gap={4} flexWrap="wrap">
            <HStack gap={1}>
              <Box w={2} h={2} borderRadius="full" bg="#6366f1" />
              <Text fontSize="xs" color="#B0B0B0">Recordatorio</Text>
            </HStack>
            <HStack gap={1}>
              <Box w={2} h={2} borderRadius="full" bg="#10B981" />
              <Text fontSize="xs" color="#B0B0B0">Suscripción recurrente</Text>
            </HStack>
            <Text fontSize="xs" color="#B0B0B0">· Haz clic en un recordatorio de hoy para registrar la transacción</Text>
          </HStack>

          {isMobile ? mobileView : desktopView}
        </VStack>
      </Box>

      {registerFor && (
        <TransactionForm
          isOpen
          onClose={() => setRegisterFor(null)}
          userId={userId}
          categories={categories}
          accounts={accounts}
          initialDate={registerFor.date}
          lockedDate
          onSuccess={() => setRegisterFor(null)}
          prefillDescription={registerFor.reminder.description}
          prefillCategoryId={registerFor.reminder.category_id ?? undefined}
        />
      )}
    </>
  )
}
