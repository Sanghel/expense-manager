# Research: Refresco visual de la UI

**Feature**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md) · **Date**: 2026-09-23

## R1 — Conjunto de iconos "Lucide"

- **Decision**: Usar `react-icons/lu` (Lucide empaquetado dentro de `react-icons@5.6`, ya instalado). No se añade `lucide-react`.
- **Rationale**: La constitución fija `react-icons` como librería de iconos; `react-icons/lu` es el set Lucide oficial, así que el resultado visual es el que pidió el usuario sin dependencia nueva. Tree-shaking por import nombrado.
- **Alternatives considered**: `lucide-react` (dependencia nueva duplicada, habría que justificarla y enmendar la sección de stack); mantener `react-icons/fi` (Feather, predecesor de Lucide; se ve parecido, pero no es lo que se pidió y mezclaría estilos).
- **Alcance**: solo se migran a `lu` los iconos de las acciones tocadas en la Historia 2 y de los componentes nuevos. Los iconos `fi` decorativos restantes quedan igual (spec, Assumptions).

## R2 — Botón de icono con tooltip

- **Decision**: Crear un wrapper compartido `components/ui/ActionIconButton.tsx` = `Tooltip` de Chakra v3 + `IconButton`, con `label` obligatorio usado a la vez como `aria-label` y contenido del tooltip, `loading` y tamaño táctil mínimo de 44 px en móvil.
- **Rationale**: Hoy ningún componente usa `Tooltip` (36 de 39 IconButtons no tienen tooltip). Un wrapper con `label` obligatorio hace imposible crear un botón de icono sin nombre accesible (FR-007) y centraliza el icono por acción (FR-010).
- **Detalles técnicos**:
  - Chakra v3 `Tooltip.Root` con `openDelay≈300`, `closeDelay≈100`. El tooltip se abre en hover y en foco de teclado.
  - En táctil, tocar ejecuta la acción y no muestra el tooltip. El nombre sigue disponible vía `aria-label`. Esta es la regla ya reflejada en spec FR-007 y en los Edge Cases.
  - Se descarta la pulsación larga, por dos motivos: en iOS dispara el menú contextual del sistema y compite con el tap que ejecuta la acción.
  - Para nombres truncados (R5) sí se abre con un toque, porque el texto no es una acción → ver R5.
  - `IconButton` con `loading` mantiene el ancho (el spinner reemplaza al icono) → FR-008.
- **Alternatives considered**: atributo `title` nativo (sin estilo, sin retardo configurable y sin foco por teclado consistente); usar `Button` con texto oculto en móvil (no es lo que se pidió).

## R3 — Mapa de iconos por acción

- **Decision**: Un único mapa de iconos por acción en `components/ui/action-icons.ts` (p. ej. `sync: LuRefreshCw`, `syncMail: LuMailSearch`, `import: LuUpload`, `export: LuDownload`, `edit: LuPencil`, `delete: LuTrash2`, `prev: LuChevronLeft`, `next: LuChevronRight`, `clear: LuEraser`, `run: LuPlay`, `expand: LuChevronDown`, `collapse: LuChevronUp`).
- **Rationale**: Garantiza FR-010 (mismo icono para la misma acción) y facilita la revisión.
- **Alternatives considered**: importar iconos sueltos en cada archivo (vuelve a divergir con el tiempo).

## R4 — Inventario de acciones (Historia 2)

- **Decision**: Pasan a `ActionIconButton` las acciones utilitarias del inventario (≈50 botones en ~30 archivos). Entre ellas: Exportar e Importar en Transacciones, `GmailSyncButton`, Regenerar en Consejos, Editar y Eliminar en presupuestos (`BudgetsPageClient`, `BudgetGroupAccordion`, `BudgetCategoryTable`), paginación Anterior/Siguiente, navegación de mes en calendarios, Limpiar/Descartar del chat, `CronActionsPanel` "Actualizar ahora", Plantilla y Volver en el import, y los botones ✎/🗑 hechos con emoji en `BudgetCategoryTable`. También se añade tooltip a los 36 IconButtons existentes.
- **Se conservan con texto** (FR-009, se les puede añadir icono Lucide si ya tenían icono):
  - Acciones de creación: "Nueva …" y "Registrar Préstamo".
  - Acciones de guardar/confirmar/cancelar y los botones de `ConfirmDialog`.
  - Las opciones de formato en `ExportTransactionsModal`: son la elección principal del diálogo, así que mantienen texto y cambian su icono por `LuFileText`, `LuFileSpreadsheet` y `LuFileJson`.
  - Las acciones de dominio con verbo de negocio que no tienen un icono inequívoco: "¡Ya me pagaron!", "Pagar tarjeta", "Registrar pago", "Abono", "Conectar Gmail" y "Desconectar". En escritorio mantienen texto + icono. En móvil pasan a icono con tooltip solo cuando comparten fila con otras acciones.
  - Los toggles "Ver más / Ocultar": mantienen texto porque describen contenido y no son una acción.
- **Rationale**: Se equilibran la densidad visual y la claridad. Las acciones cuyo significado no se deduce del icono solo se degradarían.
- **Alternatives considered**: convertir todo a icono. Se descarta porque rompe FR-009 y la claridad de las acciones de negocio.

## R5 — Truncado con tooltip en tarjetas de cuenta (Historia 1)

- **Decision**: Componente `components/ui/TruncatedText.tsx`:
  - Usa `Text` con `truncate` (`lineClamp=1`) y `minW={0}` en el contenedor flex.
  - Detecta el desbordamiento con `ResizeObserver` comparando `scrollWidth > clientWidth`.
  - Solo cuando hay desbordamiento envuelve el texto en `Tooltip`, que se abre con hover, foco (`tabIndex=0` solo si está truncado) y tap. El tap se consigue controlando `open` con `onClick` y cierre en `onPointerDownOutside`.
- **Layout de la tarjeta**: `HStack` con tres zonas:
  - Icono: `Circle size="8" flexShrink={0}`, que resuelve el óvalo de hoy.
  - Bloque de texto: `flex=1 minW=0`, con el nombre y las etiquetas debajo.
  - Acciones: `flexShrink={0}`, con dos `ActionIconButton` ("Editar cuenta {nombre}" y "Eliminar cuenta {nombre}").
  - El saldo va en su propia fila con `truncate` + `TruncatedText`, para cubrir los saldos enormes.
- **Rationale**: La deformación actual viene de dos cosas. El `Box w=8 h=8` se encoge en el `HStack` porque le falta `flexShrink=0`. Además, el nombre no tiene `minW=0`, así que en lugar de recortarse empuja el layout. El tooltip condicional cumple el escenario 3 (no mostrar tooltip redundante).
- **Alternatives considered**:
  - Tooltip siempre visible: es redundante y contradice el escenario 3.
  - `lineClamp=2`: sigue deformando la altura y el usuario pidió cortar.
  - `title` nativo: no se abre con tap ni con teclado.

## R6 — Selectores → Combobox de Chakra (Historia 3)

- **Decision**: Componente compartido `components/ui/ComboboxField.tsx` sobre `Combobox` de Chakra v3.34, que ya está disponible. Se construye así:
  - Datos: `useListCollection` + `useFilter({ sensitivity: 'base' })`, que filtra sin distinguir tildes ni mayúsculas.
  - Grupos: **sin soporte**. `Category` (`types/database.types.ts`) no tiene grupo y hoy todos los selectores muestran listas planas, así que agrupar sería funcionalidad nueva (YAGNI; spec, Edge Cases).
  - Controles: `ClearTrigger` opcional, `Combobox.Empty` con el texto "Sin resultados", y `openOnClick` para que se comporte también como select.
  - API: `value: string` y `onChange(value: string)`, idéntica a la de `SelectField` actual (FR-015).
  - Encima de él se reimplementan los wrappers actuales (`SelectField`, `CategorySelect`, `AccountSelect`, `CurrencySelect`, `FrequencySelect` y `CategoryGroupSelect`) conservando sus props. Así los ~25 consumidores no cambian.
- **Rationale**: Es el mínimo cambio con la máxima cobertura. Los consumidores siguen igual y el comportamiento se unifica.
- **Casos especiales**:
  - Los selects inline de `ReminderForm` (tipo, día y mes), `TransactionsFilter`, `ExportTransactionsModal`, `CurrencySelector` y `ChatInterface` pasan a usar `ComboboxField` directamente.
  - Los selects de día (1–31) usan el mismo combobox, porque escribir "15" filtra rápido.
  - `CategorySelect` conserva la lista plana actual, con el mismo orden y el mismo filtro por tipo.
- **Alternatives considered**:
  - `Select` de Chakra (no nativo, sin búsqueda): el usuario pidió combobox explícitamente.
  - Híbrido `Select`/`Combobox` según la longitud de la lista: es más complejo y el usuario pidió consistencia.

## R7 — Fechas → DatePicker de Chakra (Historia 3)

- **Decision**: Reescribir `components/ui/DateInput.tsx` internamente sobre `DatePicker` de Chakra v3.34:
  - Props: `locale="es-CO"`, `startOfWeek={1}`, `format` DD/MM/AAAA e input editable.
  - Contenido: `DatePicker.Input`, `Trigger` y `ClearTrigger`, más las vistas día/mes/año.
  - Conversión: con `parseDate` (reexportado por Chakra, `@internationalized/date` ya está como transitiva). El `DateValue` se convierte a ISO `YYYY-MM-DD` con `toString()`.
  - Se mantienen las props actuales (`label`, `value` ISO, `onChange(iso)`, `required`, `disabled`, `optional`, `showClear`).
- **Rationale**: `CalendarDate` no tiene zona horaria, así que elimina el riesgo de desplazar el día guardado (Edge Case). El contrato ISO se conserva (FR-015). Además se elimina el `<input type="date">` oculto, el último control nativo (FR-017).
- **Mes**: `MonthSelector` (dashboard) pasa a usar `DatePicker` con `defaultView="month"`, `minView="month"` y formato "MMMM AAAA" en español (FR-013).
- **Alternatives considered**:
  - `react-day-picker` u otra librería: es una dependencia nueva que la constitución no permite sin justificación, y Chakra ya lo cubre.
  - Mantener la fecha nativa con estilos: no cumple FR-017.

## R11 — Porcentaje → NumberInput de Chakra (Historia 3)

- **Decision**: reescribir internamente `components/ui/InputPercent.tsx` sobre `NumberInput` de Chakra v3.34:
  - Estructura: `NumberInput.Root` con `min={0}`, `max={100}`, `step={1}`, `clampValueOnBlur`, `allowMouseWheel={false}` y `locale="es-CO"`, más `NumberInput.Control` (botones de subir y bajar) y `NumberInput.Input` dentro de un `InputGroup endElement="%"`.
  - Valor controlado: `value={value === undefined ? '' : String(value)}`.
  - Emisión: `onValueChange={e => onChange(e.value === '' || Number.isNaN(e.valueAsNumber) ? undefined : e.valueAsNumber)}`.
  - Se conservan las props (`label`, `value`, `onChange`, `helperText`, `isRequired` e `isDisabled`) y el único consumidor, `components/budgets/BudgetForm.tsx:252`, no cambia.
- **Rationale**:
  - Hoy es `Input type="number"`, que muestra las flechas nativas del navegador y se comporta distinto en iOS y en Android.
  - `NumberInput` da botones propios, limita el valor al rango al salir del campo (spec, Edge Case "porcentaje fuera de rango") y mantiene el contrato `number | undefined` (FR-020).
- **Alternatives considered**:
  - Ocultar las flechas nativas con CSS: no da botones táctiles ni limita el rango.
  - Slider: menos preciso para escribir valores exactos.
- **Fuera de alcance**: `InputAmount`, que ya es un `Input` de texto con formato es-CO, sin controles nativos visibles.

## R12 — Selector de color → ColorPicker de Chakra (Historia 3)

- **Decision**: reescribir `components/categories/ColorPicker.tsx` sobre `ColorPicker` de Chakra v3.34, conservando sus props `{ value: string; onChange(color: string) }`:
  - Estructura: `ColorPicker.Root` con `value={parseColor(value || '#6366f1')}`, `format="rgba"` y `onValueChange={e => onChange(e.value.toString('hex').toLowerCase())}`.
  - Trigger: `ColorPicker.Control` con un `ColorPicker.Trigger` que muestra `ColorPicker.ValueSwatch` (cuadro de 36 px, igual que hoy) y lleva `aria-label="Elegir color"`.
  - Contenido, dentro de `Portal`, `ColorPicker.Positioner` y `ColorPicker.Content`:
    - `ColorPicker.SwatchGroup` con las 15 muestras actuales (`COLORS`), cada una en `ColorPicker.SwatchTrigger` + `ColorPicker.Swatch` + `ColorPicker.SwatchIndicator`.
    - Debajo, la sección "Personalizado": `ColorPicker.Area`, `ColorPicker.ChannelSlider channel="hue"` y `ColorPicker.ChannelInput channel="hex"`.
  - Al elegir una muestra, el popover se cierra, como hoy.
  - Se eliminan el `<input type="color">` oculto, `showPicker`, el posicionamiento manual (`getBoundingClientRect` y `position: fixed`, porque el `Positioner` ya gestiona colisiones con el borde) y los hex de UI hardcodeados (se usan tokens).
  - Los 4 consumidores (`AccountForm`, `CategoryForm`, `CategoryEditForm` y `QuickCategoryForm`) no cambian.
- **Formato del valor**: hoy se guarda `#rrggbb` en minúsculas, tanto en las muestras como en el `<input type="color">`. `Color.toString('hex')` devuelve `#RRGGBB`, así que se normaliza con `.toLowerCase()`. Se fija `format` sin canal alfa para no emitir nunca `#rrggbbaa` (FR-021, SC-006).
- **Rationale**: hoy el color personalizado abre el selector del sistema operativo, que se ve distinto en cada plataforma y no sigue la paleta. Chakra ya incluye `ColorPicker` sin dependencias nuevas.
- **Alternatives considered**:
  - Conservar el popover propio y reemplazar solo el `<input type="color">`: duplica la lógica de posicionamiento que Chakra ya resuelve.
  - Quitar el color personalizado: pierde funcionalidad existente.

## R8 — Colores y tema

- **Decision**:
  - Estilos: aplicar los tokens de `theme/index.ts` (`brand.*`, `bg.canvas`, `bg.subtle`, `border.default`, `text.*`) con `colorPalette="brand"` en los componentes nuevos. Donde no baste, se añaden `slotRecipes` de `combobox`, `datePicker` y `tooltip` en `theme/index.ts` para fondo del desplegable `bg.canvas`, borde `border.default`, ítem resaltado `brand.500/20%` y día seleccionado `brand.500`.
  - Modo de color: la app hoy es solo modo oscuro (no hay `ColorModeProvider` ni `next-themes`). Los componentes usan tokens semánticos para que un futuro modo claro funcione, pero **no se añade modo claro** (YAGNI).
- **Rationale**: Cumple FR-014 y el principio V (tokens del tema) y elimina hex hardcodeados en los componentes tocados.
- **Alternatives considered**: estilos inline con hex, como hoy en `DateInput` y `AccountsTab`. Se descarta porque perpetúa la inconsistencia.

## R9 — Verificación

- **Decision**: No hay tests automatizados de UI en el repo. Cada PR se valida con `pnpm type-check`, `pnpm lint`, `pnpm build` y la comprobación manual de [quickstart.md](./quickstart.md) en móvil (375 px) y escritorio, usando el navegador integrado. Para FR-015 se compara el payload enviado a las server actions (DevTools → red) antes y después en crear/editar transacción, recordatorio, cuenta y movimiento.
- **Alternatives considered**: introducir Playwright/RTL. Queda fuera de alcance (YAGNI) y se puede proponer como spec aparte.

## R10 — Next.js

- La feature solo toca Client Components (`'use client'`) y el tema de Chakra; no usa routing, caching, server actions, metadata ni config de Next.js. Se revisó `node_modules/next/dist/docs/01-app` (índice de guías) sin encontrar guías aplicables. **Principio I: N/A.**
