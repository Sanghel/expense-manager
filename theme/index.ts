import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react'

const config = defineConfig({
  theme: {
    tokens: {
      colors: {
        brand: {
          50:  { value: '#EDEFFF' },
          100: { value: '#D8DCFF' },
          200: { value: '#B4BAFF' },
          300: { value: '#8B93FF' },
          400: { value: '#6B74F8' },
          500: { value: '#4F46E5' }, // indigo-600 — primary
          600: { value: '#4338CA' },
          700: { value: '#3730A3' },
          800: { value: '#312E81' },
          900: { value: '#1E1B4B' },
        },
        income: {
          50:  { value: '#ECFDF5' },
          500: { value: '#10B981' },
          600: { value: '#059669' },
        },
        expense: {
          50:  { value: '#FFF1F2' },
          500: { value: '#F43F5E' },
          600: { value: '#E11D48' },
        },
        accent: {
          500: { value: '#F97316' }, // orange accent
          600: { value: '#EA580C' },
        },
      },
      fonts: {
        heading: { value: 'var(--font-geist-sans), sans-serif' },
        body:    { value: 'var(--font-geist-sans), sans-serif' },
      },
    },
    semanticTokens: {
      colors: {
        'bg.canvas': {
          value: '#1A1A23',
        },
        'bg.default': {
          value: '#0F0F13',
        },
        'bg.subtle': {
          value: '#18181D',
        },
        'text.primary': {
          value: '#FFFFFF',
        },
        'text.secondary': {
          value: '#B0B0B0',
        },
        'text.muted': {
          value: '#808080',
        },
        'border.default': {
          value: '#2D2D35',
        },
        'border.subtle': {
          value: '#262630',
        },
        'shadow.sm': {
          value: 'rgba(0, 0, 0, 0.3)',
        },
        'shadow.md': {
          value: 'rgba(0, 0, 0, 0.5)',
        },
      },
    },
  },
})

export const system = createSystem(defaultConfig, config)
