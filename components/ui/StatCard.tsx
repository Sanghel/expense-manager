import { Card } from './Card'
import { StatRoot, StatLabel, StatHelpText, StatValueText } from '@chakra-ui/react'

interface StatCardProps {
  label: string
  value: string | number
  helpText?: string
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
