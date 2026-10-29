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
const floatingPanel = { bg: 'surface', background: 'surface', borderWidth: '1px', borderColor: 'line', color: 'text' }

// Pulso palette: [light, dark], applied by the `.light`/`.dark` class that
// next-themes puts on <html>. Same condition keys as Chakra's defaults, so
// they replace them on merge instead of sitting next to them.
const mode = (light: string, dark: string) => ({ value: { _light: light, _dark: dark } })

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
        mono:    { value: 'var(--font-geist-mono), ui-monospace, monospace' },
      },
      radii: {
        pill:  { value: '999px' },
        hero:  { value: '28px' }, // hero cards, modals
        card:  { value: '24px' },
        tile:  { value: '18px' }, // sub-cards, tiles
        input: { value: '14px' },
        nav:   { value: '12px' },
      },
    },
    textStyles: {
      // Mono uppercase label above the H1 ("JUE 29 OCT 2026")
      eyebrow: { value: { fontFamily: 'mono', fontSize: '11px', fontWeight: '500', letterSpacing: '0.08em', textTransform: 'uppercase' } },
      // Mono uppercase section label ("CATEGORÍA", "SALDADOS")
      sectionLabel: { value: { fontFamily: 'mono', fontSize: '11px', fontWeight: '500', letterSpacing: '0.08em', textTransform: 'uppercase' } },
      pageTitle: { value: { fontSize: { base: '28px', md: '40px' }, fontWeight: '600', letterSpacing: '-0.03em', lineHeight: '1.1' } },
      cardTitle: { value: { fontSize: '15px', fontWeight: '600' } },
      heroFigure: { value: { fontFamily: 'mono', fontSize: { base: '52px', md: '84px' }, fontWeight: '500', letterSpacing: '-0.05em', lineHeight: '1' } },
      stat: { value: { fontFamily: 'mono', fontSize: { base: '16px', md: '22px' }, fontWeight: '500' } },
    },
    semanticTokens: {
      colors: {
        // ── Pulso design tokens ────────────────────────────────────────────
        bg: {
          DEFAULT: mode('#FAFAFB', '#0B0B0F'),
          panel: { value: '{colors.surface}' },
          // Legacy aliases, see below.
          canvas: { value: '{colors.surface}' },
          default: { value: '{colors.bg}' },
          subtle: { value: '{colors.surface2}' },
        },
        surface: mode('#F1F1F4', '#131319'),
        surface2: mode('#E7E7EC', '#1B1B23'),
        line: mode('rgba(16,16,32,.09)', 'rgba(255,255,255,.08)'),
        text: {
          DEFAULT: mode('#101016', '#F5F5F7'),
          // Legacy aliases, see below.
          primary: { value: '{colors.text}' },
          secondary: { value: '{colors.text2}' },
          muted: { value: '{colors.text3}' },
        },
        text2: mode('#52525C', '#A6A6B0'),
        text3: mode('#85858F', '#72727D'),
        brandSolid: { value: '{colors.brand.500}' },
        brandSoft: mode('rgba(79,70,229,.10)', 'rgba(107,116,248,.16)'),
        pos: mode('#047857', '#34D399'),
        posSoft: mode('rgba(5,150,105,.11)', 'rgba(52,211,153,.14)'),
        neg: mode('#BE123C', '#FB7185'),
        negSoft: mode('rgba(225,29,72,.10)', 'rgba(251,113,133,.14)'),
        warn: mode('#B45309', '#FBBF24'),
        warnSoft: mode('rgba(217,119,6,.12)', 'rgba(251,191,36,.14)'),
        track: mode('rgba(16,16,32,.08)', 'rgba(255,255,255,.08)'),

        // Full semantic palette so `colorPalette="brand"` works on any Chakra
        // component (solid buttons, selected calendar days, focus rings…).
        // `brand` alone is the accent for text and links.
        brand: {
          DEFAULT: mode('#4F46E5', '#8B93FF'),
          solid: { value: '{colors.brand.500}' },
          contrast: { value: 'white' },
          fg: mode('#4F46E5', '#8B93FF'),
          muted: mode('{colors.brand.100}', '{colors.brand.800}'),
          subtle: mode('{colors.brand.50}', '{colors.brand.900}'),
          emphasized: mode('{colors.brand.200}', '{colors.brand.700}'),
          focusRing: { value: '{colors.brand.500}' },
        },

        // Chakra's own surfaces follow the Pulso palette.
        fg: { DEFAULT: { value: '{colors.text}' } },
        border: {
          DEFAULT: { value: '{colors.line}' },
          // Legacy aliases, see below.
          default: { value: '{colors.line}' },
          subtle: { value: '{colors.line}' },
        },

        // ── Legacy aliases ─────────────────────────────────────────────────
        // `bg.canvas`, `text.primary`, `border.default`… (nested above) and
        // these shadows are kept while screens migrate to the Pulso tokens;
        // removed in the final cleanup (#564).
        'shadow.sm': mode('rgba(16,16,32,.08)', 'rgba(0,0,0,.3)'),
        'shadow.md': mode('rgba(16,16,32,.14)', 'rgba(0,0,0,.5)'),
      },
      shadows: {
        overlay: mode('0 30px 80px rgba(16,16,32,.2)', '0 30px 80px rgba(0,0,0,.6)'),
      },
    },
    recipes: {
      button: { base: { borderRadius: 'pill' } },
    },
    slotRecipes: {
      combobox: extendSlotRecipe('combobox', {
        content: floatingPanel,
        item: { _highlighted: { bg: 'brandSoft' }, _selected: { color: 'brand' } },
        input: { bg: 'surface2', borderColor: 'line' },
        empty: { color: 'text2' },
      }),
      datePicker: extendSlotRecipe('datePicker', {
        content: floatingPanel,
        input: { bg: 'surface2', borderColor: 'line' },
      }),
      numberInput: extendSlotRecipe('numberInput', {
        input: { bg: 'surface2', borderColor: 'line' },
      }),
      colorPicker: extendSlotRecipe('colorPicker', {
        content: floatingPanel,
        channelInput: { bg: 'surface2', borderColor: 'line' },
      }),
      dialog: extendSlotRecipe('dialog', {
        content: { bg: 'surface', borderRadius: 'hero', boxShadow: 'overlay' },
      }),
      tooltip: extendSlotRecipe('tooltip', {
        content: {
          '--tooltip-bg': 'colors.surface2',
          color: 'text',
          borderWidth: '1px',
          borderColor: 'line',
        },
      }),
    },
  },
})

export const system = createSystem(defaultConfig, config)
