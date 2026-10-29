'use client'

import { Box, Flex, Grid, Stack, Text } from '@chakra-ui/react'
import type { ReactNode } from 'react'
import { Card } from '@/components/ui/Card'
import { formatCompactCurrency } from '@/lib/utils/currency'
import type { AnalysisDataset } from '@/lib/actions/reports.actions'
import type { Currency } from '@/types/database.types'

const monthName = (month: string, opts: Intl.DateTimeFormatOptions = { month: 'long' }) =>
  new Date(`${month}-01T12:00:00`).toLocaleDateString('es-CO', opts).replace('.', '')

const pct = (n: number) => `${n > 0 ? '+' : ''}${n.toFixed(1).replace('.', ',')}%`

/** Title + what it measures + chart + one-sentence takeaway. */
function AnalysisCard({
  title,
  subtitle,
  conclusion,
  wide,
  children,
}: {
  title: string
  subtitle: string
  conclusion: ReactNode
  wide?: boolean
  children: ReactNode
}) {
  return (
    <Card gridColumn={wide ? { base: 'auto', md: '1 / -1' } : undefined} display="flex" flexDirection="column" minW={0}>
      <Text textStyle="cardTitle" color="text">
        {title}
      </Text>
      <Text fontSize="12px" color="text3" mb={5}>
        {subtitle}
      </Text>
      <Box flex="1">{children}</Box>
      <Text fontSize="13px" color="text2" mt={5} pt={4} borderTopWidth="1px" borderColor="line">
        {conclusion}
      </Text>
    </Card>
  )
}

function Stat({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <Box>
      <Text textStyle="sectionLabel" color="text3" mb={1}>
        {label}
      </Text>
      <Text fontFamily="mono" fontSize="20px" fontWeight="500" color={color ?? 'text'}>
        {value}
      </Text>
      {sub && (
        <Text fontSize="12px" color="text3">
          {sub}
        </Text>
      )}
    </Box>
  )
}

// ── 1. Ritmo de gasto ──────────────────────────────────────────────────────

function PaceChart({ data }: { data: AnalysisDataset }) {
  const { pace, daysInMonth, lastDay, isCurrentMonth } = data
  const W = 600
  const H = 220
  const spent = pace.current[pace.current.length - 1] ?? 0
  const maxY =
    Math.max(1, pace.cap ?? 0, pace.projection, ...pace.previous, ...pace.current) * 1.08
  const x = (day: number) => (day / daysInMonth) * W
  const y = (v: number) => H - (v / maxY) * H
  const path = (series: number[]) => series.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i + 1)},${y(v)}`).join(' ')

  const currentPath = path(pace.current)
  const areaPath = pace.current.length > 0 ? `${currentPath} L${x(pace.current.length)},${H} L${x(1)},${H} Z` : ''

  return (
    <Box position="relative" h="220px">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" width="100%" height="100%" role="img" aria-label="Gasto acumulado del mes">
        {pace.cap && (
          <>
            {/* Ideal rhythm: from 0 to the cap at month end */}
            <line x1={0} y1={H} x2={W} y2={y(pace.cap)} stroke="var(--chakra-colors-text3)" strokeDasharray="2 5" vectorEffect="non-scaling-stroke" />
            <line x1={0} y1={y(pace.cap)} x2={W} y2={y(pace.cap)} stroke="var(--chakra-colors-neg)" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
          </>
        )}
        <path d={path(pace.previous.slice(0, daysInMonth))} fill="none" stroke="var(--chakra-colors-text3)" strokeOpacity={0.55} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
        <path d={areaPath} fill="var(--chakra-colors-brand)" fillOpacity={0.12} />
        <path d={currentPath} fill="none" stroke="var(--chakra-colors-brand)" strokeWidth={2.5} vectorEffect="non-scaling-stroke" />
        {isCurrentMonth && lastDay < daysInMonth && (
          <line
            x1={x(lastDay)}
            y1={y(spent)}
            x2={W}
            y2={y(pace.projection)}
            stroke="var(--chakra-colors-brand)"
            strokeDasharray="5 5"
            strokeWidth={2}
            vectorEffect="non-scaling-stroke"
          />
        )}
      </svg>
      {pace.cap && (
        <Text position="absolute" right={0} top={`${(y(pace.cap) / H) * 100}%`} transform="translateY(-120%)" fontFamily="mono" fontSize="11px" color="neg">
          tope {formatCompactCurrency(pace.cap, data.currency)}
        </Text>
      )}
    </Box>
  )
}

function PaceCard({ data }: { data: AnalysisDataset }) {
  const { pace, currency, lastDay, daysInMonth, isCurrentMonth } = data
  const spent = pace.current[pace.current.length - 1] ?? 0
  const vsPrev = pace.previousAtSameDay > 0 ? ((spent - pace.previousAtSameDay) / pace.previousAtSameDay) * 100 : null
  const gap = pace.cap ? pace.cap - pace.projection : null
  const daysLeft = daysInMonth - lastDay
  const prevName = monthName(data.prevMonth)

  let conclusion: string
  if (!isCurrentMonth) {
    conclusion = gap === null
      ? `Cerraste ${monthName(data.month)} con ${formatCompactCurrency(spent, currency)} en gastos.`
      : gap >= 0
        ? `Cerraste el mes ${formatCompactCurrency(gap, currency)} por debajo de tu tope.`
        : `Cerraste el mes ${formatCompactCurrency(-gap, currency)} por encima de tu tope.`
  } else if (gap === null) {
    conclusion = `A este ritmo cerrarás el mes con ${formatCompactCurrency(pace.projection, currency)} en gastos.`
  } else if (gap >= 0) {
    conclusion = `A este ritmo cierras el mes ${formatCompactCurrency(gap, currency)} por debajo de tu tope.`
  } else {
    conclusion = `A este ritmo te pasas ${formatCompactCurrency(-gap, currency)} del tope: recorta ${formatCompactCurrency(-gap / Math.max(daysLeft, 1), currency)} por día.`
  }

  return (
    <AnalysisCard
      wide
      title="Ritmo de gasto del mes"
      subtitle={`Gasto acumulado día a día frente a ${prevName}${pace.cap ? ' y a tu tope' : ''}`}
      conclusion={conclusion}
    >
      <Grid templateColumns={{ base: '1fr', lg: 'minmax(0, 1fr) 220px' }} gap={6}>
        <Box minW={0}>
          <PaceChart data={data} />
          <Flex gap={4} wrap="wrap" mt={3} fontSize="12px" color="text3">
            <Flex align="center" gap={1.5}><Box w="14px" h="3px" bg="brand" borderRadius="pill" />{monthName(data.month)}</Flex>
            {isCurrentMonth && <Flex align="center" gap={1.5}><Box w="14px" borderTop="2px dashed" borderColor="brand" />Proyección</Flex>}
            <Flex align="center" gap={1.5}><Box w="14px" h="2px" bg="text3" opacity={0.55} />{prevName}</Flex>
            {pace.cap && <Flex align="center" gap={1.5}><Box w="14px" borderTop="2px dashed" borderColor="neg" />Tope</Flex>}
          </Flex>
        </Box>
        <Stack gap={5}>
          <Stat
            label={isCurrentMonth ? `Proyección al ${daysInMonth} ${monthName(data.month, { month: 'short' })}` : 'Gasto del mes'}
            value={formatCompactCurrency(pace.projection, currency)}
            sub={gap === null ? undefined : `${formatCompactCurrency(Math.abs(gap), currency)} ${gap >= 0 ? 'bajo' : 'sobre'} tu tope`}
            color={gap !== null && gap < 0 ? 'neg' : undefined}
          />
          {vsPrev !== null && (
            <Stat
              label={`Vs. ${prevName} a esta fecha`}
              value={pct(vsPrev)}
              color={vsPrev > 0 ? 'neg' : 'pos'}
            />
          )}
          {pace.mostExpensiveDay && (
            <Stat
              label="Día más caro"
              value={formatCompactCurrency(pace.mostExpensiveDay.value, currency)}
              sub={`${pace.mostExpensiveDay.day} de ${monthName(data.month)}`}
            />
          )}
        </Stack>
      </Grid>
    </AnalysisCard>
  )
}

// ── 2. Tasa de ahorro ──────────────────────────────────────────────────────

function SavingsRateCard({ data }: { data: AnalysisDataset }) {
  const rates = data.savingsRate
  const known = rates.filter((r) => r.rate !== null).map((r) => r.rate as number)
  const avg = known.length ? known.reduce((s, r) => s + r, 0) / known.length : null
  const current = rates[rates.length - 1]?.rate ?? null
  const maxAbs = Math.max(10, ...known.map(Math.abs))
  const H = 140
  const zero = H / 2
  const scale = (r: number) => (r / maxAbs) * (H / 2)

  return (
    <AnalysisCard
      title="Tasa de ahorro"
      subtitle="Qué porcentaje de tus ingresos te quedó cada mes · 12 meses"
      conclusion={
        current === null
          ? 'Este mes aún no hay ingresos registrados para medir el ahorro.'
          : avg === null
            ? `Este mes vas en ${Math.round(current)}%.`
            : `Este mes vas en ${Math.round(current)}%, ${current >= avg ? 'por encima' : 'por debajo'} de tu promedio de ${Math.round(avg)}%.`
      }
    >
      <Text fontFamily="mono" fontSize="32px" fontWeight="500" color={current !== null && current < 0 ? 'neg' : 'text'} mb={3}>
        {current === null ? '—' : `${Math.round(current)}%`}
      </Text>
      <Box position="relative" h={`${H}px`}>
        <Box position="absolute" left={0} right={0} top={`${zero}px`} borderTopWidth="1px" borderColor="line" />
        {avg !== null && (
          <Box position="absolute" left={0} right={0} top={`${zero - scale(avg)}px`} borderTopWidth="1.5px" borderStyle="dashed" borderColor="text3" title={`Promedio ${Math.round(avg)}%`} />
        )}
        <Grid templateColumns={`repeat(${rates.length}, 1fr)`} gap={1.5} h="full">
          {rates.map((r, i) => {
            const last = i === rates.length - 1
            const h = r.rate === null ? 0 : Math.abs(scale(r.rate))
            const negative = (r.rate ?? 0) < 0
            return (
              <Box key={r.month} position="relative" title={`${monthName(r.month, { month: 'short', year: '2-digit' })}: ${r.rate === null ? 'sin ingresos' : `${Math.round(r.rate)}%`}`}>
                <Box
                  position="absolute"
                  left="15%"
                  right="15%"
                  top={negative ? `${zero}px` : `${zero - h}px`}
                  h={`${Math.max(h, r.rate === null ? 0 : 2)}px`}
                  bg={negative ? 'neg' : 'brand'}
                  opacity={last ? 1 : 0.55}
                  borderRadius="3px"
                />
              </Box>
            )
          })}
        </Grid>
      </Box>
      <Flex justify="space-between" mt={2} fontFamily="mono" fontSize="10px" color="text3">
        <Text>{monthName(rates[0]?.month ?? data.month, { month: 'short' })}</Text>
        <Text>{monthName(data.month, { month: 'short' })}</Text>
      </Flex>
    </AnalysisCard>
  )
}

// ── 3. Qué cambió ──────────────────────────────────────────────────────────

function DeltasCard({ data }: { data: AnalysisDataset }) {
  const deltas = data.categoryDeltas
  const maxAbs = Math.max(1, ...deltas.map((d) => Math.abs(d.delta)))
  const biggestUp = deltas.find((d) => d.delta > 0)
  const biggestDown = deltas.find((d) => d.delta < 0)
  const prevName = monthName(data.prevMonth)

  return (
    <AnalysisCard
      title={`Qué cambió vs. ${prevName}`}
      subtitle="Categorías que más subieron (derecha) o bajaron (izquierda)"
      conclusion={
        biggestUp
          ? `${biggestUp.label} es lo que más subió: ${formatCompactCurrency(biggestUp.delta, data.currency)} más que en ${prevName}.`
          : biggestDown
            ? `Gastaste menos en todo; ${biggestDown.label} bajó ${formatCompactCurrency(-biggestDown.delta, data.currency)}.`
            : 'Sin cambios relevantes frente al mes anterior.'
      }
    >
      {deltas.length === 0 ? (
        <Text fontSize="13px" color="text3">Aún no hay datos para comparar.</Text>
      ) : (
        <Stack gap={2.5}>
          {deltas.map((d) => {
            const w = (Math.abs(d.delta) / maxAbs) * 50
            const up = d.delta > 0
            return (
              <Grid key={d.id} templateColumns="minmax(0, 1fr) minmax(0, 1.4fr) 72px" gap={3} alignItems="center">
                <Text fontSize="13px" color="text2" truncate>
                  {d.icon} {d.label}
                </Text>
                <Box position="relative" h="10px">
                  <Box position="absolute" left="50%" top="-3px" bottom="-3px" w="1px" bg="line" />
                  <Box
                    position="absolute"
                    top={0}
                    h="full"
                    borderRadius="pill"
                    bg={up ? 'neg' : 'pos'}
                    left={up ? '50%' : `${50 - w}%`}
                    w={`${w}%`}
                  />
                </Box>
                <Text fontFamily="mono" fontSize="12px" textAlign="right" color={up ? 'neg' : 'pos'}>
                  {up ? '+' : '−'}{formatCompactCurrency(Math.abs(d.delta), data.currency).replace(/^\S+\s/, '')}
                </Text>
              </Grid>
            )
          })}
        </Stack>
      )}
    </AnalysisCard>
  )
}

// ── 4. Gastos hormiga ──────────────────────────────────────────────────────

function AntCard({ data }: { data: AnalysisDataset }) {
  const { ant, currency, goal } = data
  const half = ant.total / 2
  const goalShare = goal && goal.currency === currency && goal.requiredMonthly > 0 ? (half / goal.requiredMonthly) * 100 : null

  return (
    <AnalysisCard
      title="Gastos hormiga"
      subtitle={`Compras sueltas de menos de ${formatCompactCurrency(ant.threshold, currency)} que suman`}
      conclusion={
        ant.total === 0
          ? 'No hay gastos hormiga este mes.'
          : goal && goalShare !== null
            ? `Si recortas la mitad, liberas ${formatCompactCurrency(half, currency)} al mes: el ${Math.round(goalShare)}% del aporte que necesita "${goal.name}".`
            : `Si recortas la mitad, liberas ${formatCompactCurrency(half, currency)} al mes.`
      }
    >
      <Flex align="baseline" gap={3} mb={3}>
        <Text fontFamily="mono" fontSize="32px" fontWeight="500" color="warn">
          {Math.round(ant.share)}%
        </Text>
        <Text fontSize="13px" color="text2">
          del gasto · <Text as="span" fontFamily="mono">{formatCompactCurrency(ant.total, currency)}</Text> en {ant.count} compras
        </Text>
      </Flex>
      <Box h="8px" bg="track" borderRadius="pill" overflow="hidden" mb={4}>
        <Box h="full" w={`${Math.min(100, ant.share)}%`} bg="warn" borderRadius="pill" />
      </Box>
      <Stack gap={2}>
        {ant.byCategory.map((c) => (
          <Flex key={c.id} justify="space-between" fontSize="13px">
            <Text color="text2" truncate>{c.icon} {c.label}</Text>
            <Text fontFamily="mono" color="text">{formatCompactCurrency(c.value, currency)}</Text>
          </Flex>
        ))}
      </Stack>
    </AnalysisCard>
  )
}

// ── 5. Fijos vs. variables ─────────────────────────────────────────────────

function FixedVariableCard({ data }: { data: AnalysisDataset }) {
  const { fixed, variable } = data.fixedVsVariable
  const total = fixed + variable
  const fixedShare = total > 0 ? (fixed / total) * 100 : 0
  const committed = data.totals.income > 0 ? (fixed / data.totals.income) * 100 : null

  return (
    <AnalysisCard
      title="Fijos vs. variables"
      subtitle="Gastos que coinciden con un recordatorio frente al resto"
      conclusion={
        committed === null
          ? `Tus gastos fijos son el ${Math.round(fixedShare)}% de lo que gastas.`
          : `Tus fijos comprometen el ${Math.round(committed)}% de tus ingresos del mes.`
      }
    >
      <Flex h="40px" borderRadius="12px" overflow="hidden" bg="surface2" mb={4}>
        <Box w={`${fixedShare}%`} bg="brandSolid" />
      </Flex>
      <Grid templateColumns="1fr 1fr" gap={4}>
        <Stat label="Fijos" value={formatCompactCurrency(fixed, data.currency)} sub={`${Math.round(fixedShare)}%`} />
        <Stat label="Variables" value={formatCompactCurrency(variable, data.currency)} sub={`${Math.round(100 - fixedShare)}%`} />
      </Grid>
    </AnalysisCard>
  )
}

// ── 6. Exposición por moneda ───────────────────────────────────────────────

const EXPOSURE_COLOR: Record<Currency, string> = { USD: 'brandSolid', VES: 'warn', COP: 'pos' }

function ExposureCard({ data }: { data: AnalysisDataset }) {
  const positive = data.exposure.filter((e) => e.converted > 0)
  const total = positive.reduce((s, e) => s + e.converted, 0)
  const usd = positive.find((e) => e.currency === 'USD')
  const usdImpact = usd && data.currency !== 'USD' ? usd.converted * 0.05 : null

  return (
    <AnalysisCard
      title="Exposición por moneda"
      subtitle={`Saldo de tus cuentas por moneda, convertido a ${data.currency}`}
      conclusion={
        usdImpact !== null
          ? `Si el dólar baja 5%, tu saldo en ${data.currency} cae ${formatCompactCurrency(usdImpact, data.currency)}.`
          : total > 0
            ? `Todo tu saldo positivo está en ${positive.map((e) => e.currency).join(' y ')}.`
            : 'Tus cuentas no tienen saldo positivo.'
      }
    >
      <Flex h="14px" borderRadius="pill" overflow="hidden" bg="track" mb={4}>
        {positive.map((e) => (
          <Box key={e.currency} w={`${total > 0 ? (e.converted / total) * 100 : 0}%`} bg={EXPOSURE_COLOR[e.currency]} />
        ))}
      </Flex>
      <Stack gap={2.5}>
        {data.exposure.map((e) => (
          <Flex key={e.currency} justify="space-between" align="baseline" gap={3} fontSize="13px">
            <Flex align="center" gap={2}>
              <Box boxSize="8px" borderRadius="full" bg={EXPOSURE_COLOR[e.currency]} />
              <Text fontFamily="mono" color="text">{e.currency}</Text>
              <Text fontFamily="mono" color="text3">{formatCompactCurrency(e.balance, e.currency)}</Text>
            </Flex>
            <Text fontFamily="mono" color={e.converted < 0 ? 'neg' : 'text2'}>
              {total > 0 && e.converted > 0 ? `${Math.round((e.converted / total) * 100)}%` : '—'}
            </Text>
          </Flex>
        ))}
      </Stack>
    </AnalysisCard>
  )
}

// ── 7. Cuándo gastas más ───────────────────────────────────────────────────

function WeekdayCard({ data }: { data: AnalysisDataset }) {
  const max = Math.max(1, ...data.weekday.map((d) => d.value))
  const top = data.weekday.reduce((a, b) => (b.value > a.value ? b : a), data.weekday[0])
  const fullName: Record<string, string> = { Lun: 'lunes', Mar: 'martes', Mié: 'miércoles', Jue: 'jueves', Vie: 'viernes', Sáb: 'sábados', Dom: 'domingos' }

  return (
    <AnalysisCard
      title="Cuándo gastas más"
      subtitle="Gasto promedio por día de la semana en el mes"
      conclusion={
        top && top.value > 0
          ? `Gastas más los ${fullName[top.label]}: ${formatCompactCurrency(top.value, data.currency)} en promedio.`
          : 'Aún no hay gasto suficiente este mes.'
      }
    >
      <Grid templateColumns="repeat(7, 1fr)" gap={2} h="140px" alignItems="end">
        {data.weekday.map((d) => {
          const isTop = d === top && d.value > 0
          return (
            <Stack key={d.label} gap={2} h="full" justify="flex-end" align="center" title={`${d.label}: ${formatCompactCurrency(d.value, data.currency)}`}>
              <Box w="70%" maxW="28px" h={`${(d.value / max) * 100}%`} minH="2px" bg={isTop ? 'brand' : 'text3'} opacity={isTop ? 1 : 0.45} borderRadius="5px 5px 2px 2px" />
              <Text fontFamily="mono" fontSize="11px" color={isTop ? 'text' : 'text3'}>
                {d.label}
              </Text>
            </Stack>
          )
        })}
      </Grid>
    </AnalysisCard>
  )
}

/** Análisis: seven cards, each ending with a one-sentence takeaway. */
export function AnalysisSection({ data }: { data: AnalysisDataset }) {
  return (
    <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={4}>
      <PaceCard data={data} />
      <SavingsRateCard data={data} />
      <DeltasCard data={data} />
      <AntCard data={data} />
      <FixedVariableCard data={data} />
      <ExposureCard data={data} />
      <WeekdayCard data={data} />
    </Grid>
  )
}
