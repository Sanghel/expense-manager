# Data Model: Refresco visual de la UI

**Feature**: [spec.md](./spec.md) · **Date**: 2026-09-23

Esta feature es **solo de UI**. No hay tablas, migraciones, cambios en server actions ni esquemas Zod
nuevos. Los "modelos" relevantes son los formatos de valor que intercambian los controles de formulario
con los formularios existentes; deben permanecer **idénticos** (FR-015, SC-006).

## Formatos de valor (invariantes)

| Control | Valor que entrega a `onChange` | Valor vacío | Origen |
|---------|-------------------------------|-------------|--------|
| `ComboboxField` / `SelectField` | `string` = `option.value` | `''` | igual que `NativeSelectField` hoy |
| `CategorySelect` | `category.id` (uuid) | `''` | igual |
| `AccountSelect` | `account.id` (uuid) | `''` | igual |
| `CurrencySelect` / `CurrencySelector` | código ISO (`COP`, `USD`, `VES`) | — (siempre tiene valor) | igual |
| `FrequencySelect` | valor del enum de frecuencia existente | igual | igual |
| `CategoryGroupSelect` | `group.id` (uuid) | `''` | igual |
| `DateInput` | ISO `YYYY-MM-DD` (sin hora ni zona) | `''` | igual |
| `MonthSelector` | `YYYY-MM` (string) | — (siempre tiene valor) | igual |
| `InputPercent` | `number` entero entre 0 y 100 | `undefined` | igual (hoy `Number(raw)`); fuera de rango se limita al salir del campo |
| `ColorPicker` | hex `#rrggbb` en minúsculas, sin alfa | — (siempre tiene valor) | igual que las muestras y que el `<input type="color">` de hoy |

Reglas:

- Un control **nunca** emite `onChange` con un valor que no esté en su colección (sin texto libre en combobox).
- Escribir en el buscador del combobox **no** cambia el valor hasta que se selecciona una opción.
- Una fecha escrita a mano solo emite `onChange` cuando es una fecha válida completa, o `''` si se borra. Es el comportamiento actual de `DateInput`.

## View models (solo presentación)

### Option (combobox)

| Campo | Tipo | Notas |
|-------|------|-------|
| `value` | `string` | identificador que se guarda |
| `label` | `string` | texto visible y texto sobre el que se filtra |
| `icon` | `ReactNode?` | emoji o icono (categorías, cuentas) |
| `disabled` | `boolean?` | |

Sin campo de grupo: las listas son planas, igual que hoy (spec, Edge Cases; research R6).

### Account card (Historia 1): campos ya existentes en `Account`

`name` (truncable), `icon` (emoji, por defecto `💳`), `color` (fondo del círculo, por defecto `brand.400`), `type` (etiqueta), `is_default` (insignia), `balance` + `currency` (saldo formateado con `formatCurrency`). Sin cambios en la entidad.

### Action (Historia 2)

| Campo | Tipo | Notas |
|-------|------|-------|
| `kind` | clave de `ACTION_ICONS` | determina el icono (FR-010) |
| `label` | `string` (es) | `aria-label` + tooltip (FR-007) |
| `loading` | `boolean?` | estado asíncrono (FR-008) |
| `tone` | `'neutral' \| 'danger'` | `danger` → paleta roja (eliminar) |

## Transiciones de estado

- **ActionIconButton**: `idle → loading (deshabilitado) → idle`. Si hay un error se muestra el toaster existente y el botón vuelve a `idle`.
- **TruncatedText**: pasa de `fits` (sin tooltip) a `overflowing` (tooltip activo, enfocable). Se recalcula al cambiar el tamaño.
