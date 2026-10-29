import { Box, Text } from '@chakra-ui/react'
import type { ReactNode } from 'react'
import { Card } from '@/components/ui/Card'

/** Card with a title, a one-line explanation and its control. */
export function SettingsSection({
  title,
  description,
  aside,
  children,
}: {
  title: string
  description?: string
  /** Shown at the right of the title (status badge, meta). */
  aside?: ReactNode
  children: ReactNode
}) {
  return (
    <Card>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={3} mb={description ? 1 : 4}>
        <Text textStyle="cardTitle" color="text">
          {title}
        </Text>
        {aside}
      </Box>
      {description && (
        <Text fontSize="13px" color="text3" mb={4}>
          {description}
        </Text>
      )}
      {children}
    </Card>
  )
}
