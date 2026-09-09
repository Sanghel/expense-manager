import { Card } from './Card'
import { StatRoot, StatLabel, StatHelpText, StatValueText } from '@chakra-ui/react'
import type { ReactNode } from 'react'

interface StatCardProps {
  label: string
  value: string | number
  helpText?: string | ReactNode
  /** `compact` trims the padding and the figure size for dense layouts. */
  variant?: 'default' | 'compact'
}

export function StatCard({ label, value, helpText, variant = 'default' }: StatCardProps) {
  const compact = variant === 'compact'

  // Spread conditionally: `p={undefined}` would still win over Card's own p={6}
  // default and leave the card with no padding at all.
  return (
    <Card {...(compact ? { p: { base: 3, md: 4 } } : {})}>
      <StatRoot gap={compact ? 0 : undefined}>
        <StatLabel fontSize={compact ? 'xs' : undefined}>{label}</StatLabel>
        <StatValueText fontSize={compact ? { base: 'lg', md: 'xl' } : undefined}>
          {value}
        </StatValueText>
        {helpText && (
          <StatHelpText fontSize={compact ? 'xs' : undefined} mb={0}>
            {helpText}
          </StatHelpText>
        )}
      </StatRoot>
    </Card>
  )
}
