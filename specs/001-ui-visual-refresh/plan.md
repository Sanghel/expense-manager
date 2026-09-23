# Implementation Plan: Refresco visual de la UI

**Branch**: `001-ui-visual-refresh` (spec). La entrega va en 3 ramas `feature/NNN-*` desde `develop`, una por historia. | **Date**: 2026-09-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-ui-visual-refresh/spec.md`

## Summary

Hay tres mejoras visuales, independientes entre sí y entregadas en PRs separados a `develop`:

1. **Tarjetas de cuentas** en Configuración:
   - Se extrae `AccountCard` con un layout flex de tres zonas: círculo 1:1 con `flexShrink=0`, texto con `minW=0` y acciones fijas.
   - Nuevo `TruncatedText`, que solo muestra tooltip cuando el texto desborda.
2. **Acciones con iconos**:
   - Nuevo `ActionIconButton` (Tooltip + IconButton con `label` obligatorio).
   - Un mapa único `ACTION_ICONS` con Lucide (`react-icons/lu`, ya instalado).
   - Se migran unas 50 acciones utilitarias y se añade tooltip a los 36 IconButtons existentes.
3. **Controles de formulario**:
   - Nuevo `ComboboxField` sobre el `Combobox` de Chakra v3.34, con búsqueda sin distinguir tildes. Listas planas, sin grupos.
   - Los 6 wrappers de select existentes se reimplementan encima conservando su API.
   - `DateInput` y `MonthSelector` se reescriben sobre el `DatePicker` de Chakra (es-CO, semana desde lunes, ISO sin zona horaria).
   - `InputPercent` pasa a `NumberInput` (0–100, paso 1, limitado al rango al salir).
   - `ColorPicker` pasa al `ColorPicker` de Chakra: las 15 muestras, más área, tono y campo hex en `#rrggbb` en minúsculas.
   - Se añaden `slotRecipes` al tema con los colores de la app.

No hay cambios de datos, server actions ni dependencias. Después de aprobar se hace el release `develop → main` con tag y GitHub release. Detalle en [research.md](./research.md).

## Technical Context

**Language/Version**: TypeScript 5 (strict), React 19, Next.js 16 (App Router). Solo Client Components.

**Primary Dependencies**:
- `@chakra-ui/react` 3.34.0: ya trae `Combobox`, `DatePicker`, `Tooltip`, `useListCollection`, `useFilter` y `parseDate`.
- `react-icons` 5.6 (set `lu` = Lucide).
- `@internationalized/date` 3.12, transitivo.

**Storage**: N/A (sin cambios de BD)

**Testing**: No hay suite de UI. Los gates son `pnpm type-check`, `pnpm lint`, `pnpm build` y la validación manual de [quickstart.md](./quickstart.md) (móvil 375 px y escritorio) en el navegador integrado.

**Target Platform**: PWA web, mobile-first; navegadores evergreen (iOS Safari, Chrome Android y escritorio)

**Project Type**: Aplicación web Next.js (monorepo simple: `app/`, `components/`, `lib/`, `theme/`)

**Performance Goals**:
- Sin regresión perceptible: los desplegables abren en menos de 100 ms con 200 opciones.
- El filtrado del combobox responde al teclear.

**Constraints**:
- API de props de los wrappers existentes sin cambios.
- Valores emitidos idénticos (ISO, uuid, código de moneda).
- Área táctil de al menos 44 px.
- Textos en español.
- Solo modo oscuro (no hay modo claro en la app).

**Scale/Scope**:
- Historia 1: 1 pantalla (Configuración → Cuentas).
- Historia 2: unos 30 archivos (≈50 botones con texto y 36 IconButtons sin tooltip).
- Historia 3: 12 archivos con selects nativos, 1 `DateInput`, 1 `MonthSelector`, 1 `InputPercent` (1 consumidor) y 1 `ColorPicker` (4 consumidores). Unos 30 archivos consumidores no cambian.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principio | Evaluación | Estado |
|---|-----------|------------|--------|
| I | Docs de Next.js primero | No toca routing, caching, server actions ni config de Next. Solo Client Components y tema. Se revisó el índice `node_modules/next/dist/docs/01-app` y no hay guías aplicables (research R10). | ✅ N/A |
| II | Tipado estricto y validación en el borde | Props tipadas y sin `any`. No hay nuevas entradas de confianza. Los esquemas Zod existentes no cambian porque los valores emitidos son idénticos. | ✅ |
| III | Aislamiento por usuario | No cambia server actions, sesiones ni filtros por `user_id`. | ✅ |
| IV | Integridad financiera | FR-015 y SC-006 garantizan los mismos formatos guardados. `DateInput` usa `CalendarDate` sin zona (no desplaza el día). Borrar cuenta sigue pasando por `ConfirmDialog`. El saldo se sigue formateando con `formatCurrency` y en su moneda original. | ✅ |
| V | UI mobile-first, accesible, en español, Chakra v3 + tokens | Todo con componentes Chakra v3 y tokens de `theme/`. `aria-label` obligatorio. Tooltips por hover, foco y tap. Foco visible. Validación primero en móvil. Textos en español. | ✅ |
| VI | Simplicidad y cambios acotados | Tres PRs, uno por historia. Cuatro abstracciones nuevas justificadas: `ActionIconButton` y `ACTION_ICONS` (FR-007 y FR-010), `TruncatedText` (FR-002) y `ComboboxField` (FR-011, que reutilizan 6 wrappers). No hay dependencias nuevas. No se añade modo claro ni se migran iconos decorativos (YAGNI). | ✅ |
| Stack | Iconos con `react-icons` | Se usa `react-icons/lu`, así que no se introduce `lucide-react`. | ✅ |
| Flujo | Ramas `feature/NNN-*` desde `develop`, PR squash, release con aprobación manual | Contemplado en la estrategia de entrega (abajo). | ✅ |

**Resultado**: pasa sin violaciones. Complexity Tracking vacío.

**Re-check post-diseño (Phase 1)**: los contratos ([contracts/ui-components.md](./contracts/ui-components.md)) mantienen las APIs existentes y no añaden dependencias. Los formatos de [data-model.md](./data-model.md) son invariantes. ✅ Sigue pasando.

## Project Structure

### Documentation (this feature)

```text
specs/001-ui-visual-refresh/
├── plan.md                  # Este archivo
├── research.md              # Phase 0
├── data-model.md            # Phase 1 (formatos de valor invariantes + view models)
├── quickstart.md            # Phase 1 (validación manual por PR + release)
├── contracts/
│   └── ui-components.md     # Phase 1 (props de componentes compartidos)
├── checklists/
│   └── requirements.md
└── tasks.md                 # Phase 2 (/speckit-tasks)
```

### Source Code (repository root)

```text
theme/
└── index.ts                         # H3: slotRecipes combobox / datePicker / tooltip con tokens brand/bg/border

components/ui/
├── TruncatedText.tsx                # H1 NUEVO
├── ActionIconButton.tsx             # H1 NUEVO (lo usa AccountCard) · H2 lo generaliza
├── action-icons.ts                  # H1 NUEVO (edit/delete) · H2 completa el mapa
├── ComboboxField.tsx                # H3 NUEVO
├── SelectField.tsx                  # H3 reimplementado (misma API)
├── CategorySelect.tsx               # H3 reimplementado
├── AccountSelect.tsx                # H3 reimplementado
├── CurrencySelect.tsx               # H3 reimplementado
├── FrequencySelect.tsx              # H3 reimplementado
├── CategoryGroupSelect.tsx          # H3 reimplementado
├── DateInput.tsx                    # H3 reescrito sobre DatePicker (misma API)
├── InputPercent.tsx                 # H3 reescrito sobre NumberInput (misma API)
├── ConfirmDialog.tsx, FormDialog.tsx  # H2: tooltip en botón cerrar

components/settings/
├── AccountCard.tsx                  # H1 NUEVO (extraído de AccountsTab)
├── AccountsTab.tsx                  # H1 usa AccountCard · H2 acciones de movimientos
├── CronActionsPanel.tsx, GmailConnectionPanel.tsx   # H2
└── CurrencySelector.tsx             # H3

components/dashboard/MonthSelector.tsx          # H3 DatePicker vista mes
components/categories/ColorPicker.tsx           # H3 reescrito sobre ColorPicker de Chakra (misma API)
components/reminders/ReminderForm.tsx           # H3 selects inline → ComboboxField
components/transactions/                        # H2: GmailSyncButton, GmailSyncReviewModal, Import/Export modals,
                                                #     TransactionsTable, TransactionCardMobile
                                                # H3: TransactionsFilter, ExportTransactionsModal
components/chat/ChatInterface.tsx               # H2 acciones · H3 select
components/{budgets,calendar,loans,savings,categories,reminders,notifications,dashboard}/  # H2 (ver research R4)
app/(dashboard)/{transactions,budgets,consejos-ahorro,categories}/*PageClient.tsx          # H2
```

**Structure Decision**: estructura existente de Next.js. Los componentes compartidos nuevos van en `components/ui/` y los de dominio en su carpeta. `ActionIconButton` y `action-icons.ts` nacen en la Historia 1 con solo `edit` y `delete`, y la Historia 2 los completa. Así la Historia 1 se puede entregar sola sin depender de la 2.

## Estrategia de entrega (ramas, PRs y release)

Según la constitución y `rules/github-flow.md`, cada rama:
- tiene su issue en GitHub;
- se crea desde `develop` actualizado;
- usa Conventional Commits;
- se integra con PR a `develop` usando `--squash`.

| Orden | Rama | Historia | Alcance | Depende de |
|-------|------|----------|---------|------------|
| 1 | `feature/NNN-account-cards-truncate` | H1 (P1) | `TruncatedText`, `AccountCard`, `ActionIconButton` y `action-icons` (edit/delete) | — |
| 2 | `feature/NNN-icon-actions` | H2 (P2) | `ACTION_ICONS` completo, migración del inventario R4 y tooltips en IconButtons | H1 mergeada (reutiliza `ActionIconButton`) |
| 3 | `feature/NNN-chakra-form-controls` | H3 (P3) | `slotRecipes` en el tema, `ComboboxField`, 6 wrappers, `DateInput`, `MonthSelector`, selects inline, `InputPercent` y `ColorPicker` | H2 mergeada, para evitar conflictos en `ChatInterface`, `TransactionsFilter` y `ExportTransactionsModal` |
| 4 | `chore/bump-vX.Y.Z` | Release | `package.json` (MINOR, p. ej. 3.12.0) y `CHANGELOG.md` | H1–H3 en `develop` y aprobadas |
| 5 | PR `develop → main` | Release | **Solo tras aprobación explícita del dueño**. Luego tag `vX.Y.Z` y `gh release create` | 4 |

`NNN` es el número de la issue de GitHub correspondiente. La H3 es grande. Si el diff supera ~800 líneas, se puede partir en 3a (tema + `ComboboxField` + wrappers) y 3b (`DateInput`, `MonthSelector` y selects inline) sin cambiar este plan.

Antes de cada PR: `pnpm type-check`, `pnpm lint`, `pnpm build` y la sección correspondiente de [quickstart.md](./quickstart.md) en móvil y escritorio. El PR describe explícitamente que no afecta los principios III ni IV (no hay cambios de datos ni de acceso).

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|--------|------------|
| El combobox muestra el texto de búsqueda en lugar de la etiqueta al cerrar | `ComboboxField` sincroniza `inputValue` con la etiqueta de `value` en `onOpenChange(false)` (contrato). |
| La fecha se desplaza un día por la zona horaria | `parseDate`/`CalendarDate` (sin hora). Nunca `new Date(iso)` en el control. |
| Tooltip de truncado inaccesible en táctil | `TruncatedText` controla `open` con tap y cierra al tocar fuera (R5). |
| Estilos del desplegable fuera de la paleta (portal fuera del contenedor) | `slotRecipes` en el tema, no estilos locales. Validación visual en quickstart. |
| Regresiones en ~25 consumidores de selects | Los wrappers conservan la API. El quickstart compara los payloads (SC-006). |
| El color se guarda en mayúsculas o con alfa (`#RRGGBBAA`) | `format` sin alfa y `.toLowerCase()` al emitir (research R12). Se comprueba en quickstart 6b y 8. |
| `NumberInput` emite `NaN` o una cadena | Emitir `undefined` si `e.value === ''` o `NaN`, y si no `e.valueAsNumber` (research R11). |

## Complexity Tracking

Sin violaciones de la constitución. No aplica.
