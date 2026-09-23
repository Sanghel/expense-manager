# UI Component Contracts

**Feature**: [../spec.md](../spec.md) · **Date**: 2026-09-23

Los contratos públicos (props) de los componentes compartidos nuevos o reescritos. Todos van en
`components/ui/`, son Client Components (`'use client'`) y usan tokens de `theme/index.ts`.

---

## `ActionIconButton` (nuevo): Historia 2

```ts
interface ActionIconButtonProps {
  kind: ActionKind            // clave de ACTION_ICONS → icono Lucide (react-icons/lu)
  label: string               // OBLIGATORIO, español; aria-label + tooltip
  onClick?: () => void
  loading?: boolean           // muestra spinner, deshabilita, mantiene tamaño
  disabled?: boolean
  tone?: 'neutral' | 'danger' // danger → colorPalette rojo
  size?: 'xs' | 'sm' | 'md'   // área táctil ≥ 44px en móvil sin importar size
  variant?: 'ghost' | 'outline' | 'subtle'
  icon?: IconType             // override excepcional; preferir kind
}
```

Garantías:
- Siempre tiene nombre accesible (`aria-label = label`) y tooltip con `label` en hover y foco de teclado.
- En táctil, tocar ejecuta la acción y no abre tooltip (spec FR-007).
- Mientras está `loading`, un clic no dispara `onClick`.
- El foco visible usa el anillo del tema.

## `ACTION_ICONS` (nuevo): `components/ui/action-icons.ts`

`Record<ActionKind, IconType>`: es la única fuente del icono de cada acción. Las claves mínimas son:
`sync`, `syncMail`, `import`, `export`, `template`, `edit`, `delete`, `prev`, `next`, `back`,
`regenerate`, `run`, `clear`, `discard`, `close`, `send`, `mic`, `micOff`, `include`, `exclude`,
`expand`, `collapse`, `viewAll`.

---

## `TruncatedText` (nuevo): Historia 1

```ts
interface TruncatedTextProps extends TextProps {
  children: string            // texto completo (también contenido del tooltip)
}
```

Garantías:
- Una sola línea con "…" cuando desborda. Requiere que el padre flex tenga `minW={0}`.
- Solo cuando hay desbordamiento: el tooltip se abre en hover, foco (`tabIndex=0`) y tap.
- Sin desbordamiento no hay tooltip ni tab stop extra.

## `AccountCard` (extraído de `AccountsTab`): Historia 1

```ts
interface AccountCardProps {
  account: Account
  onEdit: (account: Account) => void
  onDelete: (accountId: string) => void
  extraAction?: ReactNode     // p. ej. "Pagar tarjeta" en cuentas tipo card
}
```

Layout garantizado:
- `[Circle 1:1, flexShrink 0] [nombre + etiquetas, flex 1, minW 0] [acciones, flexShrink 0]`.
- El saldo va en una fila propia, truncable.

---

## `ComboboxField` (nuevo): Historia 3

```ts
interface ComboboxFieldProps {
  label: string
  value: string                    // '' = sin selección
  onChange: (value: string) => void
  options: Option[]                // ver data-model.md
  placeholder?: string             // p. ej. "Seleccionar categoría..."
  required?: boolean
  disabled?: boolean
  invalid?: boolean
  errorText?: string
  helperText?: string
  clearable?: boolean              // default: !required
  emptyText?: string               // default: "Sin resultados"
  hideLabel?: boolean              // para filtros compactos; mantiene aria-label
}
```

Garantías:
- El filtrado no distingue mayúsculas ni tildes, y compara por `label`.
- Soporta teclado completo: ↑/↓, Enter, Esc y Tab.
- Lista plana, sin grupos. Las opciones se muestran en el orden recibido.
- El valor solo cambia al seleccionar una opción (no se acepta texto libre).
- Al cerrar sin seleccionar, el input vuelve a mostrar la etiqueta de la opción actual.

### Wrappers que conservan su API actual (sin cambios en consumidores)

`SelectField`, `CategorySelect`, `AccountSelect`, `CurrencySelect`, `FrequencySelect` y `CategoryGroupSelect` mantienen sus props actuales. Por dentro solo mapean sus datos a `Option[]` y renderizan `ComboboxField`.

---

## `DateInput` (reescrito, misma API): Historia 3

```ts
interface DateInputProps {            // sin cambios
  label: string
  value: string                       // ISO YYYY-MM-DD o ''
  onChange: (value: string) => void   // ISO o ''
  required?: boolean
  disabled?: boolean
  optional?: boolean
  showClear?: boolean                 // default true
}
```

Garantías:
- Muestra DD/MM/AAAA, con locale `es-CO` y la semana empezando en lunes.
- Acepta escritura manual y calendario desplegable.
- No usa ningún `<input type="date">`.
- El día emitido no depende de la zona horaria.

## `InputPercent` (reescrito, misma API): Historia 3

```ts
interface InputPercentProps {             // sin cambios
  label: string
  value: number | undefined
  onChange: (value: number | undefined) => void
  helperText?: string
  isRequired?: boolean
  isDisabled?: boolean
}
```

Garantías:
- Usa `NumberInput` de Chakra con botones de subir y bajar propios. No hay `input[type=number]`, así que tampoco aparecen las flechas nativas.
- Rango de 0 a 100 y paso 1. El valor se limita al rango al salir del campo. Muestra el sufijo "%".
- El campo vacío emite `undefined`. Nunca emite `NaN`.

## `ColorPicker` (reescrito, misma API): Historia 3, `components/categories/ColorPicker.tsx`

```ts
interface ColorPickerProps {              // sin cambios
  value: string                           // '#rrggbb'
  onChange: (color: string) => void       // '#rrggbb' en minúsculas
}
```

Garantías:
- El trigger es un cuadro de 36 px con el color actual y `aria-label="Elegir color"`.
- El popover muestra las 15 muestras actuales, en el mismo orden. Al elegir una, se cierra.
- La sección personalizada tiene área de color, control de tono y campo hex.
- No abre el selector de color del sistema ni usa `input[type=color]`.
- Emite siempre el formato `#rrggbb` en minúsculas y sin alfa. Un valor guardado que no está entre las muestras se muestra y se conserva sin cambios.

## `MonthSelector` (reescrito, misma API): Historia 3

- Conserva sus props actuales.
- La UI es un `DatePicker` en vista de mes, con el formato "septiembre 2026" y flechas Anterior/Siguiente como `ActionIconButton` (`prev`/`next`).
