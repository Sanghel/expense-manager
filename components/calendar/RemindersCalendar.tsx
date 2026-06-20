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
  DialogFooter,
  DialogCloseTrigger,
  IconButton,
  Icon,
  useBreakpointValue,
} from '@chakra-ui/react'
import { useState } from 'react'
import { FiPlus, FiX } from 'react-icons/fi'
import type { ReminderWithCategory, Account, Category, ReminderType } from '@/types/database.types'
import { getLocalDateString } from '@/lib/utils/dates'
import { reminderMatchesDate } from '@/lib/reminders/matches-date'
import { TransactionForm } from '@/components/transactions/TransactionForm'
import { ReminderForm } from '@/components/reminders/ReminderForm'

const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

const INCOME_COLOR = '#10b981'
const EXPENSE_COLOR = '#6366f1'

const reminderColor = (type: ReminderType) => (type === 'income' ? INCOME_COLOR : EXPENSE_COLOR)

interface DayItem {
  label: string
  icon: string
  color: string
  type: ReminderType
  reminder: ReminderWithCategory
}

function getItemsForDay(
  reminders: ReminderWithCategory[],
  year: number,
  month: number,
  day: number
): DayItem[] {
  const date = new Date(year, month, day)
  const items: DayItem[] = []

  for (const r of reminders) {
    if (reminderMatchesDate(r, date)) {
      items.push({
        label: r.description,
        icon: r.category?.icon ?? '🔔',
        color: reminderColor(r.type),
        type: r.type,
        reminder: r,
      })
    }
  }

  return items
}

interface Props {
  userId: string
  reminders: ReminderWithCategory[]
  categories: Category[]
  accounts: Account[]
  onRefresh?: () => void
}

export function RemindersCalendar({ userId, reminders, categories, accounts, onRefresh }: Props) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<{ date: string; items: DayItem[] } | null>(null)
  const [registerFor, setRegisterFor] = useState<{ date: string; reminder: ReminderWithCategory } | null>(null)
  const [createReminderDate, setCreateReminderDate] = useState<string | null>(null)
  const isMobile = useBreakpointValue({ base: true, md: false })

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDay = new Date(year, month, 1).getDay()
  const today = getLocalDateString(new Date())

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1))
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1))

  const openDayDialog = (dateStr: string, items: DayItem[]) => {
    setSelectedDay({ date: dateStr, items })
  }

  const monthHeader = (
    <HStack justifyContent="space-between" alignItems="center">
      <Button onClick={handlePrevMonth} variant="ghost" size={{ base: 'sm', md: 'md' }}>← Anterior</Button>
      <Text fontSize={{ base: 'md', md: 'lg' }} fontWeight="bold">
        {MONTHS[month]} {year}
      </Text>
      <Button onClick={handleNextMonth} variant="ghost" size={{ base: 'sm', md: 'md' }}>Siguiente →</Button>
    </HStack>
  )

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
            const items = getItemsForDay(reminders, year, month, day)
            const isToday = dateStr === today
            return (
              <Box
                key={day}
                borderWidth="1px"
                borderRadius="md"
                p="2"
                cursor="pointer"
                bg={items.length > 0 ? '#1a1a27' : 'transparent'}
                borderColor={isToday ? '#4F46E5' : items.length > 0 ? '#3b3b4f' : '#2d2d35'}
                _hover={{ borderColor: '#4F46E5' }}
                transition="background 0.2s, border-color 0.2s"
                onClick={() => openDayDialog(dateStr, items)}
              >
                <VStack alignItems="flex-start" gap="1" height="100%">
                  <HStack justify="space-between" w="full">
                    <Text fontWeight="bold" fontSize="sm" color={isToday ? '#818cf8' : 'white'}>{day}</Text>
                    {isToday && <Box w={2} h={2} borderRadius="full" bg="#4F46E5" />}
                  </HStack>
                  <VStack alignItems="flex-start" gap="0.5" width="100%" flex="1" overflowY="auto">
                    {items.slice(0, 3).map((item, i) => (
                      <HStack key={i} w="full" gap={1}>
                        <Box w={2} h={2} borderRadius="full" bg={item.color} flexShrink={0} mt="1px" />
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

  const mobileView = (() => {
    const daysWithItems: { day: number; dateStr: string; items: DayItem[] }[] = []
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = getLocalDateString(new Date(year, month, d))
      const items = getItemsForDay(reminders, year, month, d)
      if (items.length > 0) daysWithItems.push({ day: d, dateStr, items })
    }

    if (daysWithItems.length === 0) {
      return (
        <VStack gap={3}>
          <Box py={8} textAlign="center" w="full">
            <Text color="#808080">Sin recordatorios este mes</Text>
          </Box>
          <Button
            bg="#4F46E5"
            color="white"
            _hover={{ bg: '#4338CA' }}
            onClick={() => setCreateReminderDate(today)}
            w="full"
          >
            <FiPlus /> Nuevo recordatorio
          </Button>
        </VStack>
      )
    }

    return (
      <VStack gap={2} align="stretch">
        {daysWithItems.map(({ day, dateStr, items }) => {
          const isToday = dateStr === today
          return (
            <Box
              key={day}
              borderWidth="1px"
              borderRadius="lg"
              borderColor={isToday ? '#4F46E5' : '#2d2d35'}
              overflow="hidden"
              cursor="pointer"
              onClick={() => openDayDialog(dateStr, items)}
              _hover={{ borderColor: '#4F46E5' }}
              transition="border-color 0.2s"
            >
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
                    <Text fontSize="xs" color="#808080">{items.length} recordatorio{items.length !== 1 ? 's' : ''}</Text>
                  </VStack>
                </HStack>
              </HStack>
              <VStack gap={0} align="stretch" px={4} py={2} bg="#18181d">
                {items.slice(0, 3).map((item, i) => (
                  <HStack key={i} py={2} gap={2} borderTopWidth={i > 0 ? '1px' : '0'} borderColor="#2d2d35">
                    <Box w={2} h={2} borderRadius="full" bg={item.color} flexShrink={0} />
                    <Text fontSize="sm" color="white" lineClamp={1} flex={1}>
                      {item.icon} {item.label}
                    </Text>
                    <Badge size="xs" variant="subtle" colorPalette={item.type === 'income' ? 'green' : 'red'}>
                      {item.type === 'income' ? 'Ingreso' : 'Gasto'}
                    </Badge>
                  </HStack>
                ))}
                {items.length > 3 && (
                  <Text fontSize="xs" color="#808080" py={1}>+{items.length - 3} más</Text>
                )}
              </VStack>
            </Box>
          )
        })}
      </VStack>
    )
  })()

  const dialogDate = selectedDay?.date
  const dialogItems = selectedDay?.items ?? []

  return (
    <>
      <Box borderWidth="1px" borderRadius="lg" p={{ base: 4, md: 6 }} bg="bg.surface" width="100%">
        <VStack gap="4" alignItems="stretch">
          {monthHeader}

          {/* Legend */}
          <HStack gap={4} flexWrap="wrap">
            <HStack gap={1}>
              <Box w={2} h={2} borderRadius="full" bg={EXPENSE_COLOR} />
              <Text fontSize="xs" color="#B0B0B0">Gasto</Text>
            </HStack>
            <HStack gap={1}>
              <Box w={2} h={2} borderRadius="full" bg={INCOME_COLOR} />
              <Text fontSize="xs" color="#B0B0B0">Ingreso</Text>
            </HStack>
            <Text fontSize="xs" color="#B0B0B0">· Haz clic en un día para ver detalles o crear un recordatorio</Text>
          </HStack>

          {isMobile ? mobileView : desktopView}
        </VStack>
      </Box>

      {/* Day details dialog */}
      <DialogRoot
        open={selectedDay !== null}
        onOpenChange={(details) => !details.open && setSelectedDay(null)}
        size="md"
        placement="center"
        lazyMount
        unmountOnExit
        closeOnInteractOutside={false}
      >
        <DialogBackdrop />
        <DialogPositioner>
          <DialogContent tabIndex={-1} mx={{ base: 3, md: 0 }} maxH={{ base: '85vh', md: '90vh' }} display="flex" flexDirection="column">
            <DialogHeader borderBottomWidth="1px" borderColor="#2d2d35" py={4} flexShrink={0}>
              <HStack justify="space-between" align="center">
                <DialogTitle color="white">
                  {dialogDate
                    ? new Date(dialogDate + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
                    : 'Programado del día'}
                </DialogTitle>
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
            <DialogBody flex="1" minH="0" overflowY="auto">
              <VStack alignItems="stretch" gap="2">
                {dialogItems.length === 0 ? (
                  <Text color="fg.muted">Sin recordatorios este día.</Text>
                ) : (
                  dialogItems.map((item, i) => (
                    <Box
                      key={i}
                      width="100%"
                      p="3"
                      borderWidth="1px"
                      borderRadius="md"
                      bg="bg.muted"
                    >
                      <HStack justify="space-between" mb="2" align="flex-start">
                        <HStack gap={2} flex={1}>
                          <Box w={2} h={2} borderRadius="full" bg={item.color} flexShrink={0} mt="6px" />
                          <VStack align="flex-start" gap={0} flex={1}>
                            <Text fontWeight="bold" color="white">{item.icon} {item.label}</Text>
                            <Badge size="xs" variant="subtle" colorPalette={item.type === 'income' ? 'green' : 'red'}>
                              {item.type === 'income' ? 'Ingreso' : 'Gasto'}
                            </Badge>
                          </VStack>
                        </HStack>
                      </HStack>
                      {dialogDate && (
                        <Button
                          size="sm"
                          bg="#4F46E5"
                          color="white"
                          _hover={{ bg: '#4338CA' }}
                          width="full"
                          onClick={() => {
                            setRegisterFor({ date: dialogDate, reminder: item.reminder })
                            setSelectedDay(null)
                          }}
                        >
                          <FiPlus />
                          {item.type === 'income' ? 'Registrar ingreso' : 'Registrar pago'}
                        </Button>
                      )}
                    </Box>
                  ))
                )}
              </VStack>
            </DialogBody>
            <DialogFooter borderTopWidth="1px" borderColor="#2d2d35" pt={4}>
              <Button
                bg="#4F46E5"
                color="white"
                _hover={{ bg: '#4338CA' }}
                width="full"
                onClick={() => {
                  if (dialogDate) {
                    setCreateReminderDate(dialogDate)
                    setSelectedDay(null)
                  }
                }}
              >
                <FiPlus />
                Nuevo recordatorio
              </Button>
            </DialogFooter>
          </DialogContent>
        </DialogPositioner>
      </DialogRoot>

      {/* Transaction creation from reminder */}
      {registerFor && (
        <TransactionForm
          isOpen
          onClose={() => setRegisterFor(null)}
          userId={userId}
          categories={categories}
          accounts={accounts}
          initialDate={registerFor.date}
          lockedDate
          onSuccess={() => {
            setRegisterFor(null)
            onRefresh?.()
          }}
          prefillDescription={registerFor.reminder.description}
          prefillCategoryId={registerFor.reminder.category_id ?? undefined}
          initialType={registerFor.reminder.type}
        />
      )}

      {/* New reminder from calendar */}
      <ReminderForm
        isOpen={createReminderDate !== null}
        onClose={() => setCreateReminderDate(null)}
        userId={userId}
        categories={categories}
        accounts={accounts}
        prefillDate={createReminderDate ?? undefined}
        onSuccess={() => {
          setCreateReminderDate(null)
          onRefresh?.()
        }}
      />
    </>
  )
}
