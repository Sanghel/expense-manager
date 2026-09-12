'use client'

import type { ReactNode } from 'react'
import { TOOLTIP_CONTAINER } from './nivo-theme'

export interface TooltipRow {
  /** Chip de color de la serie. Se omite en gráficas de una sola serie. */
  color?: string
  label?: ReactNode
  value: ReactNode
  /** Fila secundaria: porcentajes, totales de referencia. */
  muted?: boolean
}

interface Props {
  title: ReactNode
  rows: TooltipRow[]
}

const CELL = { padding: '3px 5px' } as const

/**
 * Tooltip compartido de todas las gráficas.
 *
 * Nivo NO aplica `theme.tooltip.container` a los tooltips propios: su
 * `TooltipWrapper` omite explícitamente las claves `container`, `table`,
 * `tableCell`, `chip`… del tema, y solo sus `BasicTooltip`/`TableTooltip`
 * internos las usan. Por eso este componente pinta el contenedor él mismo,
 * en vez de confiar en el tema.
 */
export function ChartTooltip({ title, rows }: Props) {
  const hasChips = rows.some((r) => r.color)

  return (
    <div style={TOOLTIP_CONTAINER} role="tooltip">
      <div style={{ fontWeight: 600, marginBottom: 4, padding: '0 5px' }}>{title}</div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={row.muted ? { opacity: 0.7 } : undefined}>
              {hasChips && (
                <td style={{ ...CELL, width: 12 }}>
                  {row.color && (
                    <span
                      style={{
                        display: 'block',
                        width: 12,
                        height: 12,
                        borderRadius: 2,
                        background: row.color,
                      }}
                    />
                  )}
                </td>
              )}
              <td style={CELL}>{row.label}</td>
              <td
                style={{
                  ...CELL,
                  textAlign: 'right',
                  paddingLeft: 12,
                  fontWeight: row.muted ? 400 : 600,
                }}
              >
                {row.value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
