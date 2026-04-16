import { Card } from './Card'
import { StatRoot, StatLabel, StatHelpText, StatValueText } from '@chakra-ui/react'
import type { ReactNode } from 'react'

interface StatCardProps {
  label: string
  value: string | number
  helpText?: string | ReactNode
}

export function StatCard({ label, value, helpText }: StatCardProps) {
  return (
    <Card>
      <StatRoot>
        <StatLabel>{label}</StatLabel>
        <StatValueText>{value}</StatValueText>
        {helpText && <StatHelpText>{helpText}</StatHelpText>}
      </StatRoot>
    </Card>
  )
}
