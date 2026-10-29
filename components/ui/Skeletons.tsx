import { Box, BoxProps, Flex, Grid, Stack } from '@chakra-ui/react'

/** Tonal placeholder block with a soft pulse. */
export function SkeletonBlock(props: BoxProps) {
  return <Box bg="surface" borderRadius="card" animation="pulse" {...props} />
}

/** Placeholder for a tab's content while its data streams in. */
export function TabSkeleton() {
  return (
    <Stack gap={4} aria-busy="true" aria-label="Cargando">
      <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={4}>
        <SkeletonBlock h="96px" />
        <SkeletonBlock h="96px" display={{ base: 'none', md: 'block' }} />
        <SkeletonBlock h="96px" display={{ base: 'none', md: 'block' }} />
      </Grid>
      <SkeletonBlock h="320px" />
    </Stack>
  )
}

/** `loading.tsx` placeholder: page header + content, shown instantly on navigation. */
export function PageSkeleton({ withTabs = false }: { withTabs?: boolean }) {
  return (
    <Box aria-busy="true" aria-label="Cargando">
      <Flex justify="space-between" align="flex-end" gap={4} wrap="wrap" mb={7}>
        <Stack gap={3}>
          <SkeletonBlock h="11px" w="120px" borderRadius="pill" />
          <SkeletonBlock h={{ base: '28px', md: '40px' }} w={{ base: '180px', md: '260px' }} borderRadius="tile" />
        </Stack>
        {withTabs && (
          <Flex gap={2}>
            <SkeletonBlock h="36px" w="120px" borderRadius="pill" />
            <SkeletonBlock h="36px" w="110px" borderRadius="pill" />
          </Flex>
        )}
      </Flex>
      <TabSkeleton />
    </Box>
  )
}
