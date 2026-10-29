import { Box, BoxProps } from '@chakra-ui/react'

/** Pulso card: tonal surface, no border or shadow. */
export function Card({ children, ...props }: BoxProps) {
  return (
    <Box bg="surface" borderRadius="card" p={5} {...props}>
      {children}
    </Box>
  )
}
