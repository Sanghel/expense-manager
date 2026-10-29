import { Box, BoxProps } from '@chakra-ui/react'

/** Budget thresholds: under 80% OK, 80–99% warning, 100%+ exceeded. */
export function progressTone(percent: number): 'pos' | 'warn' | 'neg' {
  if (percent >= 100) return 'neg'
  if (percent >= 80) return 'warn'
  return 'pos'
}

interface Props extends Omit<BoxProps, 'children'> {
  /** 0–100; values above 100 fill the bar. */
  value: number
  /** `threshold` colors the fill by `progressTone`. */
  tone?: 'threshold' | 'brand' | 'pos' | 'warn' | 'neg'
  /** Bar height in px. */
  size?: number
  label?: string
}

export function ProgressBar({ value, tone = 'threshold', size = 6, label, ...props }: Props) {
  const fill = tone === 'threshold' ? progressTone(value) : tone === 'brand' ? 'brandSolid' : tone
  const width = Math.max(0, Math.min(100, value))

  return (
    <Box
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
      h={`${size}px`}
      bg="track"
      borderRadius="pill"
      overflow="hidden"
      {...props}
    >
      <Box h="full" w={`${width}%`} bg={fill} borderRadius="pill" transition="width 300ms" />
    </Box>
  )
}
