'use client'

import { Box, Button, Flex, Grid, Icon, IconButton, Stack, Text } from '@chakra-ui/react'
import { useCallback, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LuBell, LuChevronLeft, LuChevronRight, LuPlus } from 'react-icons/lu'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Money } from '@/components/ui/Money'
import { TransactionForm } from '@/components/transactions/TransactionForm'
import { ReminderForm } from '@/components/reminders/ReminderForm'
import { remindersForDate } from '@/lib/reminders/matches-date'
import { buildConverter } from '@/lib/utils/currency-converter'
import { formatCompactCurrency } from '@/lib/utils/currency'
import { getLocalDateString, todayEyebrow } from '@/lib/utils/dates'
import type {
  Account,
  Category,
  Currency,
  ExchangeRate,
  ReminderWithCategory,
  TransactionWithCategory,
} from '@/types/database.types'

interface Props {
  userId: string
  initialTransactions: TransactionWithCategory[]
  categories: Category[]
  accounts: Account[]
  reminders: ReminderWithCategory[]
  preferredCurrency: Currency
  exchangeRates: ExchangeRate[]
}

const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

/** COP has no cents in practice; USD/VES keep them. */
const decimalsFor = (currency: string) => (currency === 'COP' ? 0 : 2)

/**
 * Pulso calendar: a 7-column month grid where each day shows its spending as
 * a bar and a bell when a payment is scheduled; the selected day's detail
 * (transactions + scheduled payments) sits below.
 */
export function CalendarPageContent({
  userId,
  initialTransactions: transactions,
  categories,
  accounts,
  reminders,
  preferredCurrency,
  exchangeRates,
}: Props) {
  const router = useRouter()
  const today = getLocalDateString()
  const [view, setView] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  })
  const [selected, setSelected] = useState(today)
  const [createFor, setCreateFor] = useState<string | null>(null)
  const [payFor, setPayFor] = useState<{ date: string; reminder: ReminderWithCategory } | null>(null)
  const [reminderFor, setReminderFor] = useState<string | null>(null)

  const convert = useMemo(() => buildConverter(exchangeRates), [exchangeRates])

  const byDate = useMemo(() => {
    const map = new Map<string, TransactionWithCategory[]>()
    for (const t of transactions) {
      const list = map.get(t.date)
      if (list) list.push(t)
      else map.set(t.date, [t])
    }
    return map
  }, [transactions])

  const expenseOf = useCallback(
    (date: string) =>
      (byDate.get(date) ?? [])
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + convert(Number(t.amount), t.currency, preferredCurrency), 0),
    [byDate, convert, preferredCurrency]
  )

  const days = useMemo(() => {
    const count = new Date(view.year, view.month + 1, 0).getDate()
    return Array.from({ length: count }, (_, i) => {
      const date = new Date(view.year, view.month, i + 1)
      const iso = getLocalDateString(date)
      return { day: i + 1, iso, expense: expenseOf(iso), scheduled: remindersForDate(reminders, date).length > 0 }
    })
  }, [view, expenseOf, reminders])

  const maxExpense = Math.max(1, ...days.map((d) => d.expense))
  const leading = new Date(view.year, view.month, 1).getDay()
  const monthTitle = (() => {
    const s = new Date(view.year, view.month, 1).toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })
    return s.charAt(0).toUpperCase() + s.slice(1).replace(' de ', ' ')
  })()

  const shift = (delta: number) =>
    setView(({ year, month }) => {
      const d = new Date(year, month + delta, 1)
      return { year: d.getFullYear(), month: d.getMonth() }
    })

  // Selected day detail
  const selectedDate = new Date(`${selected}T12:00:00`)
  const dayTransactions = byDate.get(selected) ?? []
  const dayReminders = remindersForDate(reminders, selectedDate)
  const isPaid = (r: ReminderWithCategory) =>
    dayTransactions.some((t) => t.description === r.description && t.category_id === r.category_id)
  const selectedLabel = (() => {
    const s = selectedDate.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })
    return s.charAt(0).toUpperCase() + s.slice(1)
  })()
  const selectedExpense = expenseOf(selected)

  return (
    <Box>
      <PageHeader
        eyebrow={todayEyebrow()}
        title="Calendario"
        actions={
          <Flex align="center" gap={1}>
            <IconButton aria-label="Mes anterior" size="sm" variant="ghost" color="text2" onClick={() => shift(-1)}>
              <LuChevronLeft />
            </IconButton>
            <Text fontSize="15px" fontWeight="600" color="text" minW="150px" textAlign="center">
              {monthTitle}
            </Text>
            <IconButton aria-label="Mes siguiente" size="sm" variant="ghost" color="text2" onClick={() => shift(1)}>
              <LuChevronRight />
            </IconButton>
          </Flex>
        }
      />

      <Grid templateColumns="repeat(7, minmax(0, 1fr))" gap={{ base: 1, md: 2 }} mb={2}>
        {WEEKDAYS.map((d) => (
          <Text key={d} textStyle="sectionLabel" color="text3" textAlign="center">
            {d}
          </Text>
        ))}
      </Grid>
      <Grid templateColumns="repeat(7, minmax(0, 1fr))" gap={{ base: 1, md: 2 }} mb={6}>
        {Array.from({ length: leading }, (_, i) => (
          <Box key={`pad-${i}`} />
        ))}
        {days.map((d) => {
          const isSelected = d.iso === selected
          const isToday = d.iso === today
          return (
            <Box
              key={d.iso}
              as="button"
              onClick={() => setSelected(d.iso)}
              aria-pressed={isSelected}
              aria-label={`${d.day}${d.expense > 0 ? `, gasto ${formatCompactCurrency(d.expense, preferredCurrency)}` : ''}${d.scheduled ? ', pago programado' : ''}`}
              position="relative"
              display="flex"
              flexDirection="column"
              h={{ base: '58px', md: '108px' }}
              p={{ base: 1.5, md: 2.5 }}
              borderRadius={{ base: '12px', md: '16px' }}
              bg={isSelected ? 'surface2' : 'surface'}
              boxShadow={isSelected ? 'inset 0 0 0 1.5px var(--chakra-colors-brand)' : 'none'}
              opacity={d.iso > today ? 0.4 : 1}
              textAlign="left"
              cursor="pointer"
              transition="background 150ms"
              _hover={{ bg: 'surface2' }}
              minW={0}
            >
              <Flex justify="space-between" align="center">
                <Text fontFamily="mono" fontSize="12px" fontWeight={isToday ? '600' : '400'} color={isToday ? 'brand' : 'text2'}>
                  {d.day}
                </Text>
                {d.scheduled && <Icon as={LuBell} boxSize={{ base: '10px', md: '13px' }} color="warn" />}
              </Flex>
              <Flex flex="1" align="flex-end" gap={2} minH={0}>
                {d.expense > 0 && (
                  <Box
                    w={{ base: '4px', md: '6px' }}
                    h={`${Math.max(10, (d.expense / maxExpense) * 100)}%`}
                    bg="brand"
                    borderRadius="pill"
                    flexShrink={0}
                  />
                )}
                {d.expense > 0 && (
                  <Text display={{ base: 'none', md: 'block' }} fontFamily="mono" fontSize="12px" color="text" truncate>
                    {formatCompactCurrency(d.expense, preferredCurrency).replace(/^COP\s/, '')}
                  </Text>
                )}
              </Flex>
            </Box>
          )
        })}
      </Grid>

      {/* Selected day */}
      <Card>
        <Flex justify="space-between" align="flex-start" gap={4} wrap="wrap" mb={4}>
          <Box>
            <Text textStyle="cardTitle" color="text">
              {selectedLabel}
            </Text>
            <Text fontSize="13px" color="text3">
              Gastado{' '}
              <Text as="span" fontFamily="mono" color="text">
                {formatCompactCurrency(selectedExpense, preferredCurrency)}
              </Text>
            </Text>
          </Box>
          <Flex gap={2}>
            <Button size="sm" variant="ghost" color="text2" boxShadow="inset 0 0 0 1px var(--chakra-colors-line)" onClick={() => setReminderFor(selected)}>
              <LuBell />
              Recordatorio
            </Button>
            <Button size="sm" bg="brandSolid" color="white" _hover={{ bg: 'brand.600' }} onClick={() => setCreateFor(selected)}>
              <LuPlus />
              Registrar
            </Button>
          </Flex>
        </Flex>

        {dayTransactions.length === 0 && dayReminders.length === 0 ? (
          <Text fontSize="14px" color="text3">
            Sin movimientos ni pagos programados este día.
          </Text>
        ) : (
          <Stack gap={0}>
            {dayReminders.map((r) => {
              const paid = isPaid(r)
              return (
                <Flex key={`r-${r.id}`} align="center" gap={3} py={3} borderBottomWidth="1px" borderColor="line" _last={{ borderBottomWidth: 0 }}>
                  <Text fontSize="18px" w="24px" textAlign="center" flexShrink={0}>
                    {r.category?.icon ?? '🔔'}
                  </Text>
                  <Box flex="1" minW={0}>
                    <Text fontSize="14px" fontWeight="500" color="text" truncate>
                      {r.description}
                    </Text>
                    <Text fontSize="12px" color={paid ? 'pos' : 'warn'}>
                      {paid ? 'Registrado' : 'Pendiente'}
                      {r.category ? ` · ${r.category.name}` : ''}
                    </Text>
                  </Box>
                  {!paid && (
                    <Button size="xs" bg="warnSoft" color="warn" _hover={{ opacity: 0.85 }} onClick={() => setPayFor({ date: selected, reminder: r })}>
                      {r.type === 'income' ? 'Registrar ingreso' : 'Registrar pago'}
                    </Button>
                  )}
                </Flex>
              )
            })}
            {dayTransactions.map((t) => (
              <Flex key={t.id} align="center" gap={3} py={3} borderBottomWidth="1px" borderColor="line" _last={{ borderBottomWidth: 0 }}>
                <Text fontSize="18px" w="24px" textAlign="center" flexShrink={0}>
                  {t.category?.icon ?? '🏷️'}
                </Text>
                <Box flex="1" minW={0}>
                  <Text fontSize="14px" fontWeight="500" color="text" truncate>
                    {t.description}
                  </Text>
                  <Text fontSize="12px" color="text3" truncate>
                    {t.category?.name ?? 'Sin categoría'}
                  </Text>
                </Box>
                <Money
                  amount={Number(t.amount)}
                  currency={t.currency}
                  kind={t.type}
                  fractionDigits={decimalsFor(t.currency)}
                  fontSize="14px"
                  fontWeight="500"
                />
              </Flex>
            ))}
          </Stack>
        )}
      </Card>

      <TransactionForm
        isOpen={createFor !== null}
        onClose={() => setCreateFor(null)}
        userId={userId}
        categories={categories}
        accounts={accounts}
        initialDate={createFor ?? undefined}
        lockedDate
        history={transactions}
        onSuccess={() => {
          setCreateFor(null)
          router.refresh()
        }}
      />

      {payFor && (
        <TransactionForm
          isOpen
          onClose={() => setPayFor(null)}
          userId={userId}
          categories={categories}
          accounts={accounts}
          initialDate={payFor.date}
          lockedDate
          history={transactions}
          prefillDescription={payFor.reminder.description}
          prefillCategoryId={payFor.reminder.category_id ?? undefined}
          initialType={payFor.reminder.type}
          onSuccess={() => {
            setPayFor(null)
            router.refresh()
          }}
        />
      )}

      <ReminderForm
        isOpen={reminderFor !== null}
        onClose={() => setReminderFor(null)}
        userId={userId}
        categories={categories}
        accounts={accounts}
        prefillDate={reminderFor ?? undefined}
        onSuccess={() => {
          setReminderFor(null)
          router.refresh()
        }}
      />
    </Box>
  )
}
