'use client'

import { Badge, CloseButton } from '@chakra-ui/react'
import type { Tag } from '@/types/database.types'

interface Props {
  tag: Tag
  onRemove?: () => void
}

export function TagBadge({ tag, onRemove }: Props) {
  return (
    <Badge
      variant="solid"
      style={{ backgroundColor: tag.color }}
      display="flex"
      alignItems="center"
      gap="1"
    >
      {tag.name}
      {onRemove && <CloseButton size="sm" onClick={onRemove} />}
    </Badge>
  )
}
