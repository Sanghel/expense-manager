import { createSystem, defaultConfig, defineConfig, type SystemStyleObject } from '@chakra-ui/react'

// Overrides of Chakra's default slot recipes. The merge combines `slots` arrays
// index by index, so always pass the full default list or other slots lose
// their styles.
const defaultSlotRecipes = defaultConfig.theme?.slotRecipes ?? {}
const extendSlotRecipe = (name: string, base: Record<string, SystemStyleObject>) => ({
  slots: defaultSlotRecipes[name]?.slots ?? [],
  base,
})

// Floating panels (combobox list, calendar, color picker) share the app's card look.
const floatingPanel = { bg: 'bg.canvas', background: 'bg.canvas', borderWidth: '1px', borderColor: 'border.default', color: 'text.primary' }

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
        // Full semantic palette so `colorPalette="brand"` works on any Chakra
        // component (solid buttons, selected calendar days, focus rings…).
        brand: {
          solid: { value: '{colors.brand.500}' },
          contrast: { value: 'white' },
          fg: { value: '{colors.brand.300}' },
          muted: { value: '{colors.brand.800}' },
          subtle: { value: '{colors.brand.900}' },
          emphasized: { value: '{colors.brand.700}' },
          focusRing: { value: '{colors.brand.500}' },
        },
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
    slotRecipes: {
      combobox: extendSlotRecipe('combobox', {
        content: floatingPanel,
        item: { _highlighted: { bg: 'brand.500/20' }, _selected: { color: 'brand.300' } },
        input: { bg: 'bg.subtle', borderColor: 'border.default' },
        empty: { color: 'text.secondary' },
      }),
      datePicker: extendSlotRecipe('datePicker', {
        content: floatingPanel,
        input: { bg: 'bg.subtle', borderColor: 'border.default' },
      }),
      numberInput: extendSlotRecipe('numberInput', {
        input: { bg: 'bg.subtle', borderColor: 'border.default' },
      }),
      colorPicker: extendSlotRecipe('colorPicker', {
        content: floatingPanel,
        channelInput: { bg: 'bg.subtle', borderColor: 'border.default' },
      }),
      tooltip: extendSlotRecipe('tooltip', {
        content: {
          '--tooltip-bg': 'colors.bg.subtle',
          color: 'text.primary',
          borderWidth: '1px',
          borderColor: 'border.default',
        },
      }),
    },
  },
})

export const system = createSystem(defaultConfig, config)
