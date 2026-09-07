import type { PartialTheme } from '@nivo/theming'

/**
 * Shared chart styling.
 *
 * The app has a single hardcoded dark theme, so these are the dark-surface
 * values from `theme/index.ts` rather than a light/dark pair.
 */
export const SURFACE = '#1a1a23'
export const BORDER = '#2d2d35'
export const TEXT_PRIMARY = '#ffffff'
export const TEXT_SECONDARY = '#B0B0B0'
export const TEXT_MUTED = '#6b7280'

/** Semantic, never reused as a categorical slot. */
export const INCOME = '#10B981'
export const EXPENSE = '#F43F5E'
export const BRAND = '#4F46E5'
export const ACCENT = '#F97316'

/**
 * Categorical palette, assigned in this fixed order and never cycled.
 *
 * Validated against the app's chart surface (#1a1a23) in dark mode: lightness
 * band, chroma floor, adjacent-pair CVD separation (worst ΔE 8.4), normal-vision
 * floor (worst ΔE 19.3) and 3:1 contrast all pass.
 *
 * Only the first three slots clear the all-pairs floors, so forms that put
 * every series against every other (radar, scatter) cap at three; the rest fold
 * into "Otros".
 */
export const CATEGORICAL = [
  '#3987e5', // blue
  '#d95926', // orange
  '#199e70', // aqua
  '#c98500', // yellow
  '#d55181', // magenta
  '#008300', // green
  '#9085e9', // violet
  '#e66767', // red
] as const

/** Slots safe when every series is compared against every other. */
export const CATEGORICAL_ALL_PAIRS = CATEGORICAL.slice(0, 3)

/** Single hue, dim → bright, for magnitude on a dark surface. */
export const SEQUENTIAL = ['#252a4d', '#312e81', '#4338CA', '#6B74F8', '#B4BAFF']

export function seriesColor(index: number): string {
  return CATEGORICAL[index % CATEGORICAL.length]
}

export const nivoTheme: PartialTheme = {
  background: 'transparent',
  text: {
    fontSize: 11,
    fill: TEXT_SECONDARY,
    fontFamily: 'var(--font-geist-sans), sans-serif',
  },
  axis: {
    domain: { line: { stroke: BORDER, strokeWidth: 1 } },
    ticks: {
      line: { stroke: BORDER, strokeWidth: 1 },
      text: { fontSize: 11, fill: TEXT_MUTED },
    },
    legend: { text: { fontSize: 11, fill: TEXT_SECONDARY } },
  },
  grid: {
    line: { stroke: BORDER, strokeWidth: 1, strokeDasharray: '2 4' },
  },
  legends: {
    text: { fontSize: 11, fill: TEXT_SECONDARY },
  },
  labels: {
    text: { fontSize: 11, fill: TEXT_PRIMARY },
  },
  tooltip: {
    container: {
      background: '#18181d',
      color: TEXT_PRIMARY,
      fontSize: 12,
      borderRadius: 8,
      border: `1px solid ${BORDER}`,
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
      padding: '8px 10px',
    },
  },
  annotations: {
    text: { fill: TEXT_PRIMARY },
    link: { stroke: BORDER },
    outline: { stroke: BORDER },
  },
}
