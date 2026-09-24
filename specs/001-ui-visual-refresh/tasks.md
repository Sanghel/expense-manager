---

description: "Task list for 001-ui-visual-refresh"
---

# Tasks: Refresco visual de la UI (acciones con iconos, controles de formulario unificados y tarjetas de cuentas)

**Input**: Design documents from `specs/001-ui-visual-refresh/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/ui-components.md](./contracts/ui-components.md), [quickstart.md](./quickstart.md)

**Tests**: La spec no pide tests automatizados y el repo no tiene suite de UI (research R9). La verificación de cada historia es la validación manual de `quickstart.md` más los gates `pnpm type-check`, `pnpm lint` y `pnpm build`.

**Organization**: Una fase por historia. **Cada historia es una rama y un PR independiente a `develop`** (plan → Estrategia de entrega).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede ejecutarse en paralelo (archivos distintos y sin dependencias pendientes)
- **[Story]**: US1 = Tarjetas de cuentas (P1) · US2 = Acciones con iconos (P2) · US3 = Controles de formulario (P3)

## Convenciones para todas las tareas

- Todos los componentes son Client Components (`'use client'`) y usan Chakra UI v3 (`@chakra-ui/react` 3.34).
- Iconos nuevos solo de `react-icons/lu`. No instalar `lucide-react` ni ninguna otra dependencia.
- Usar tokens de `theme/index.ts`, no hex nuevos:
  - Colores base: `brand.*`, `bg.canvas`, `bg.subtle`, `bg.default`, `border.default`, `text.primary`, `text.secondary`, `text.muted`.
  - Donde un componente tocado tenga hex que coincidan con esos tokens (`#4F46E5`, `#1a1a23`, `#2d2d35`, `#B0B0B0`), reemplazarlos por el token correspondiente.
- Todo texto visible y todo `aria-label` va en español.
- Commits con Conventional Commits. No hacer commits directos a `develop` ni a `main`.

---

## Phase 1: Setup (spec docs e issues)

**Purpose**: Versionar la documentación de la spec y crear las issues que numeran las ramas.

- [X] T001 Crear la rama `docs/001-ui-visual-refresh-spec` desde `develop`. Commitear `specs/001-ui-visual-refresh/` completo y `.specify/feature.json` con `docs: spec 001 refresco visual de la UI`. Abrir un PR a `develop` y hacer merge `--squash` tras la aprobación del dueño.
- [X] T002 Crear 3 issues en GitHub con `gh issue create`, una por historia. Títulos:
  - "UI: tarjetas de cuentas con nombre truncado y tooltip"
  - "UI: acciones con botones de icono Lucide"
  - "UI: migrar controles de formulario a Combobox/DatePicker/NumberInput/ColorPicker de Chakra"

  Cada issue enlaza `specs/001-ui-visual-refresh/spec.md` y la historia correspondiente. Anotar los números como `#A` (US1), `#B` (US2) y `#C` (US3). **Creadas: #534 (US1), #535 (US2), #536 (US3).** Las ramas de cada fase usan esos números.

---

## Phase 2: Foundational

**Purpose**: Ninguna. No hay infraestructura compartida que bloquee a las tres historias. Los componentes compartidos nacen en la historia que los necesita primero: `ActionIconButton` en US1 y `ComboboxField` en US3. Así cada PR es autocontenido (plan → Structure Decision).

**Checkpoint**: Con Setup completo, se puede empezar US1.

---

## Phase 3: User Story 1 - Tarjetas de cuentas legibles en Configuración (Priority: P1) 🎯 MVP

**Goal**: Cada tarjeta de cuenta cumple lo siguiente:
- El icono es un círculo 1:1 de tamaño fijo.
- El nombre ocupa una línea con "…" y tiene tooltip solo si está truncado.
- Las acciones editar/eliminar tienen ancho fijo y nombre accesible.
- El saldo no desborda la tarjeta.

**Independent Test**: [quickstart.md → PR 1](./quickstart.md) en 375 px y en escritorio, con cuentas de nombre corto, de 40+ caracteres, con una palabra larga sin espacios y con saldo ≥ 1.000.000.000.

**Branch**: `feature/#A-account-cards-truncate` desde `develop` actualizado.

- [X] T003 [US1] Crear la rama `feature/<#A>-account-cards-truncate` desde `develop` actualizado (`git checkout develop && git pull && git checkout -b ...`).
- [X] T004 [P] [US1] Crear `components/ui/action-icons.ts`. Debe exportar el tipo `ActionKind` y `ACTION_ICONS: Record<ActionKind, IconType>` (`IconType` de `react-icons`), por ahora solo con `edit: LuPencil` y `delete: LuTrash2` de `react-icons/lu`. Añadir un comentario que diga que es la única fuente de iconos por acción (FR-010).
- [X] T005 [P] [US1] Crear `components/ui/TruncatedText.tsx` según el contrato `TruncatedText` de `contracts/ui-components.md`:
  - Props: `children: string` más `TextProps` de Chakra. Usar `Text` con `truncate` y `minW={0}`.
  - Desbordamiento: detectarlo con `useRef` + `ResizeObserver` comparando `el.scrollWidth > el.clientWidth`, y recalcular al cambiar el tamaño o el texto.
  - Si desborda: envolver el texto en `Tooltip.Root` de Chakra (`Tooltip.Trigger asChild`, `Portal`, `Tooltip.Positioner`, `Tooltip.Content` con el texto completo), con `openDelay={300}`.
  - Apertura: controlar `open` para que también abra con clic o tap (toggle en `onClick`) y cerrar con `onPointerDownOutside` y `Escape`. Dar `tabIndex={0}` al trigger para que abra con foco.
  - Si no desborda: renderizar solo `Text`, sin tooltip y sin `tabIndex`.
- [X] T006 [US1] Crear `components/ui/ActionIconButton.tsx` según el contrato `ActionIconButton` (depende de T004):
  - Props: `kind: ActionKind`, `label: string` (obligatoria), `onClick?`, `loading?`, `disabled?`, `tone?: 'neutral' | 'danger'`, `size?: 'xs' | 'sm' | 'md'` (default `'sm'`), `variant?: 'ghost' | 'outline' | 'subtle'` (default `'ghost'`) e `icon?: IconType` (override).
  - Render: `Tooltip.Root` (`openDelay={300}`, `closeDelay={100}`) que envuelve un `IconButton` con `aria-label={label}`, `loading={loading}` y `disabled={disabled || loading}`. Con `tone === 'danger'` usar `colorPalette="red"`; si no, `colorPalette="gray"`.
  - Área táctil mínima de 44 px en móvil: `minW={{ base: '11', md: 'auto' }}` y `minH={{ base: '11', md: 'auto' }}`.
  - El icono sale de `icon ?? ACTION_ICONS[kind]`.
  - El texto del tooltip es `label`. El tooltip se abre en hover y en foco de teclado. En táctil no se abre al tocar, porque tocar ejecuta la acción (spec FR-007, research R2). No añadir lógica de pulsación larga.
- [X] T007 [US1] Crear `components/settings/AccountCard.tsx` con las props `{ account: Account; onEdit(account); onDelete(accountId); extraAction?: ReactNode }`. Mover el markup de la tarjeta desde `components/settings/AccountsTab.tsx` (el `Box` dentro de `accounts.map`) y reorganizar el layout:
  - Contenedor: `Box` con `borderWidth="1px"`, `borderRadius="xl"`, `p={4}`, `bg="bg.canvas"`, `borderColor="border.default"` y `_hover={{ borderColor: 'brand.500' }}`. Si `account.is_default`, el borde es `brand.500`.
  - Fila 1: `HStack gap={3} align="start"` con tres zonas:
    - (a) `Circle size="10" flexShrink={0} bg={account.color ?? 'brand.400'} fontSize="lg"` con `{account.icon ?? '💳'}`.
    - (b) `VStack align="start" gap={1} flex="1" minW={0}` con `<TruncatedText fontWeight="semibold" fontSize="sm" color="text.primary" w="full">{account.name}</TruncatedText>` y un `HStack gap={1} flexWrap="wrap"` con las badges de tipo (`ACTION_TYPE_LABELS` movido o exportado) y "Por defecto".
    - (c) `HStack gap={0} flexShrink={0}` con `<ActionIconButton kind="edit" label={`Editar cuenta ${account.name}`} />` y `<ActionIconButton kind="delete" tone="danger" label={`Eliminar cuenta ${account.name}`} />`.
  - Fila 2: saldo con `<TruncatedText fontSize="xl" fontWeight="bold" color="text.primary">{formatCurrency(balance, currency)}</TruncatedText>`. Usar la misma expresión de saldo y moneda que el código actual; no cambiar el cálculo (principio IV).
  - Fila 3 (opcional): `extraAction`.
- [X] T008 [US1] En `components/settings/AccountsTab.tsx`, reemplazar el markup inline de la tarjeta por `<AccountCard account={acc} onEdit={(a) => { setEditingAccount(a); setIsAccountFormOpen(true) }} onDelete={setDeletingAccountId} extraAction={...} />`:
  - Mover la acción "Pagar tarjeta" (≈línea 239, solo en cuentas tipo `card`) a `extraAction` sin cambiar su comportamiento.
  - Mantener `ConfirmDialog` para eliminar.
  - Mantener `SimpleGrid minChildWidth="260px" gap={3}`.
  - Quitar los imports que queden sin uso.
- [X] T009 [US1] Ejecutar `pnpm type-check && pnpm lint && pnpm build` y corregir errores.
- [X] T010 [US1] Validar [quickstart.md → PR 1](./quickstart.md) (pasos 1–7) con `pnpm dev` y el navegador integrado, en 375×812 y en escritorio. Revisar también un ancho de 360 px (Edge Case). Anotar el resultado en la descripción del PR.
- [X] T011 [US1] Commitear con `feat(settings): tarjetas de cuentas con nombre truncado, tooltip e icono circular fijo`. Hacer push y abrir un PR a `develop` con `Closes #A`, capturas de antes y después (móvil y escritorio) y una nota explícita: "Sin cambios de datos ni de acceso (principios III/IV)". Hacer merge `--squash` solo tras la aprobación del dueño.

**Checkpoint**: US1 en `develop`. `ActionIconButton`, `action-icons.ts` y `TruncatedText` quedan disponibles para US2 y US3.

---

## Phase 4: User Story 2 - Acciones con botones de icono (Priority: P2)

**Goal**:
- Las acciones utilitarias pasan a `ActionIconButton`, con icono Lucide, tooltip y `aria-label` en español.
- Se añade tooltip a todos los `IconButton` existentes.
- Las acciones principales de crear, guardar y confirmar conservan su texto.

**Independent Test**: [quickstart.md → PR 2](./quickstart.md), pasos 1–5.

**Branch**: `feature/#B-icon-actions` desde `develop` con US1 mergeada.

**Regla por tarea**:
- Botón utilitario con texto → `<ActionIconButton kind=... label="<texto actual o más descriptivo>" onClick={mismo handler} loading={mismo estado} />`.
- `IconButton` existente → `ActionIconButton`, con el mismo `aria-label` como `label`.
- No se cambia ningún handler, estado ni lógica.

**Qué conserva el texto (FR-009)**:
- Botones "Nueva …" y "Registrar Préstamo".
- Botones de guardar, confirmar y cancelar, y los de `ConfirmDialog`.
- Los tres botones de formato de `ExportTransactionsModal`.
- "¡Ya me pagaron!/¡Ya pagué!", "Pagar tarjeta", "Registrar pago/ingreso", "Abono", "Conectar Gmail" y "Desconectar".
- Los toggles "Ver más / Ocultar".

- [X] T012 [US2] Crear la rama `feature/<#B>-icon-actions` desde `develop` actualizado.
- [X] T013 [US2] Completar `ACTION_ICONS` en `components/ui/action-icons.ts` con las claves y los iconos de `react-icons/lu` siguientes:

  | Clave | Icono |
  |-------|-------|
  | `sync` | `LuRefreshCw` |
  | `syncMail` | `LuMailSearch` |
  | `import` | `LuUpload` |
  | `export` | `LuDownload` |
  | `template` | `LuFileDown` |
  | `prev` | `LuChevronLeft` |
  | `next` | `LuChevronRight` |
  | `back` | `LuArrowLeft` |
  | `regenerate` | `LuRefreshCw` |
  | `run` | `LuPlay` |
  | `clear` | `LuEraser` |
  | `discard` | `LuX` |
  | `close` | `LuX` |
  | `send` | `LuSend` |
  | `mic` | `LuMic` |
  | `micOff` | `LuMicOff` |
  | `include` | `LuCheck` |
  | `exclude` | `LuX` |
  | `expand` | `LuChevronDown` |
  | `collapse` | `LuChevronUp` |
  | `viewAll` | `LuArrowRight` |
  | `add` | `LuPlus` |
  | `pay` | `LuCircleCheck` |
  | `history` | `LuHistory` |
  | `apply` | `LuWandSparkles` |

  Antes de usar cada nombre, comprobar que existe en `node_modules/react-icons/lu/index.d.ts`. Si no existe, usar el equivalente más cercano y anotarlo en un comentario.
- [X] T014 [P] [US2] `app/(dashboard)/transactions/TransactionsPageClient.tsx`:
  - "Exportar" (≈132) → `kind="export" label="Exportar transacciones"`.
  - "Importar" (≈136) → `kind="import" label="Importar extracto"`.
  - Paginación "Anterior"/"Siguiente" (≈182/193) → `prev`/`next` con `label="Página anterior"`/`"Página siguiente"`.
  - "Nueva Transacción" conserva el texto; cambiar su `FiPlus` por `LuPlus`.
- [X] T015 [P] [US2] `components/transactions/GmailSyncButton.tsx`: "Sincronizar correos" (≈54) → `kind="syncMail" label="Sincronizar correos"`, con `loading` ligado al estado de sincronización actual. Mantener el toaster de error y éxito existente.
- [X] T016 [P] [US2] `components/transactions/GmailSyncReviewModal.tsx`:
  - "Editar" (≈271) → `edit`.
  - "Incluir/Excluir" (≈272) → `include`/`exclude` con `label` según el estado.
  - Sus 2 `IconButton` → `ActionIconButton`.
  - "Guardar todas" y "Descartar" (≈287–288) conservan el texto.
- [X] T017 [P] [US2] `components/transactions/ImportTransactionsModal.tsx`:
  - "Plantilla" (≈257) → `kind="template" label="Descargar plantilla"`.
  - "Volver" (≈457) → `kind="back" label="Volver"`.
- [X] T018 [P] [US2] `components/transactions/ExportTransactionsModal.tsx`: los botones de formato (≈135/146/157) conservan el texto; cambiar sus iconos a `LuFileText`, `LuFileSpreadsheet` y `LuFileJson` (research R4).
- [X] T019 [P] [US2] `components/transactions/TransactionsTable.tsx` y `components/transactions/TransactionCardMobile.tsx`: sus `IconButton` de editar y eliminar → `ActionIconButton` con `kind="edit"` y `kind="delete" tone="danger"`, y `label` "Editar transacción" / "Eliminar transacción".
- [X] T020 [P] [US2] `app/(dashboard)/budgets/BudgetsPageClient.tsx`: "Editar"/"Eliminar" (≈143/146) → `edit`/`delete` con `label` "Editar presupuesto" / "Eliminar presupuesto". Las pills de vista (≈93) no cambian.
- [X] T021 [P] [US2] `components/budgets/BudgetGroupAccordion.tsx`: "Editar"/"Eliminar" (≈175/178) → `edit`/`delete` con `label` "Editar grupo" / "Eliminar grupo".
- [X] T022 [P] [US2] `components/budgets/BudgetCategoryTable.tsx`:
  - Los botones con emoji "✎"/"🗑" (≈132/135) y "Editar"/"Eliminar" (≈191/194) → `edit`/`delete` con `label` "Editar presupuesto" / "Eliminar presupuesto".
  - `components/budgets/BudgetWidget.tsx`: "Ver todos →" (≈33) → `kind="viewAll" label="Ver todos los presupuestos"`.
- [X] T023 [P] [US2] `components/calendar/TransactionCalendar.tsx` y `components/calendar/RemindersCalendar.tsx`:
  - "← Anterior"/"Siguiente →" → `prev`/`next` con `label` "Mes anterior" / "Mes siguiente".
  - Sus `IconButton` existentes → `ActionIconButton`.
  - "Nueva Transacción", "Nuevo recordatorio" y "Registrar pago" conservan el texto (cambiar `FiPlus` por `LuPlus`).
  - En `components/calendar/CalendarPageContent.tsx`, las pestañas cambian el emoji por el icono y conservan el texto: `LuCalendar` en "Transacciones" y `LuBell` en "Programado".
- [X] T024 [P] [US2] `app/(dashboard)/consejos-ahorro/ConsejosAhorroPageClient.tsx`: "Regenerar" (≈150) → `kind="regenerate" label="Regenerar consejos"` con el mismo handler que abre la confirmación. "Sí, regenerar" y "Cancelar" conservan el texto.
- [X] T025 [P] [US2] `components/chat/ChatInterface.tsx` y `components/chat/FloatingChat.tsx`:
  - "Limpiar" (≈313) → `kind="clear" label="Limpiar conversación"`.
  - "Descartar" (≈440) → `kind="discard" label="Descartar"`.
  - Los `<Button>` que solo tienen icono (cerrar ≈317, voz ≈485, enviar ≈522) → `close`, `mic`/`micOff` y `send`, con `label` "Cerrar chat", "Dictar mensaje"/"Detener dictado" y "Enviar mensaje".
  - El `IconButton` de `FloatingChat` → `ActionIconButton`.
  - "Confirmar" conserva el texto.
- [X] T026 [P] [US2] `components/settings/CronActionsPanel.tsx`: el botón con `buttonLabel` (≈80) → `kind="run" label={buttonLabel}`, con `loading` ligado a su estado. `components/settings/GmailConnectionPanel.tsx`: "Conectar Gmail" y "Desconectar" conservan el texto; solo se cambian sus iconos a `LuMail` y `LuUnplug`.
- [X] T027 [P] [US2] `components/settings/AccountsTab.tsx`: el `IconButton` "Eliminar" de la tabla de movimientos → `ActionIconButton kind="delete" tone="danger" label="Eliminar movimiento"`. "Nuevo Movimiento" conserva el texto.
- [X] T028 [P] [US2] `components/dashboard/RecentTransactions.tsx`: "Anterior"/"Siguiente" (≈66/75) → `prev`/`next` con `label` "Página anterior" / "Página siguiente". `components/dashboard/DashboardContent.tsx`: "Ver más / Ocultar" conserva el texto; cambiar su icono a `LuChevronDown`/`LuChevronUp`.
- [X] T029 [P] [US2] `components/loans/LoansTable.tsx` y `components/loans/LoanCards.tsx`: sus `IconButton` (4 y 3) → `ActionIconButton` con el mismo `aria-label`. "Abono" y "¡Ya me pagaron!/¡Ya pagué!" conservan el texto y cambian su icono a `LuCirclePlus`/`LuCircleCheck`. El toggle de historial de `LoanCards` conserva el texto.
- [X] T030 [P] [US2] Carpeta `components/savings/`:
  - `SavingsGoalCard.tsx`: sus 3 `IconButton` (el `title` nativo pasa a `label`) → `ActionIconButton`. El toggle "Aportes" conserva el texto; icono `LuHistory`.
  - `BudgetSuggestionsList.tsx`, `GroupSuggestionsList.tsx`, `CategoryHygieneList.tsx`, `SavingsGoalSuggestions.tsx` y `ContributionHistory.tsx`: su `IconButton` → `ActionIconButton`.
  - "Aplicar"/"Editar" de `BudgetSuggestionsList` (≈146) y "Editar meta" de `SavingsGoalSuggestions` (≈173) → `apply`/`edit`. "Crear meta" conserva el texto.
- [X] T031 [P] [US2] Categorías y recordatorios, pasar a `ActionIconButton` con el mismo `aria-label`:
  - Los 2 `IconButton` de `app/(dashboard)/categories/CategoriesPageClient.tsx`.
  - Los 2 de `components/categories/CategoryGroupsSection.tsx`.
  - Los 2 de `components/reminders/RemindersList.tsx`.

  En `components/reminders/RecordatoriosTab.tsx`, "Pagar" (≈89) conserva el texto; cambiar su icono a `LuCircleCheck`.
- [X] T032 [P] [US2] `components/notifications/NotificationsPanel.tsx`: sus 2 `IconButton` con `title` → `ActionIconButton` con `label` igual al `title`. "Registrar pago / ingreso" conserva el texto.
- [X] T033 [P] [US2] `components/ui/ConfirmDialog.tsx` y `components/ui/FormDialog.tsx`: el `IconButton` de cerrar → `ActionIconButton kind="close" label="Cerrar"`. No tocar `components/ui/DateInput.tsx`, que se reescribe en US3.
- [X] T034 [US2] Auditoría final:
  - `grep -rn "<IconButton" app components --include='*.tsx'` solo debe devolver `components/ui/ActionIconButton.tsx` y `components/ui/DateInput.tsx`.
  - `grep -rn "aria-label" components/ui/ActionIconButton.tsx`: confirmar que `label` es obligatoria en el tipo.
  - Revisar que el mismo tipo de acción no use iconos distintos (FR-010).
- [X] T035 [US2] Ejecutar `pnpm type-check && pnpm lint && pnpm build` y corregir errores.
- [X] T036 [US2] Validar [quickstart.md → PR 2](./quickstart.md) (pasos 1–5) en 375×812 y en escritorio, con navegación por teclado.
- [X] T037 [US2] Commitear con `feat(ui): acciones utilitarias como botones de icono Lucide con tooltip`. Abrir un PR a `develop` con `Closes #B`, la lista de pantallas tocadas, capturas y la nota "Sin cambios de datos ni de acceso (principios III/IV)". Hacer merge `--squash` tras la aprobación.

**Checkpoint**: US2 en `develop`. Todas las acciones utilitarias son iconos con tooltip.

---

## Phase 5: User Story 3 - Controles de formulario unificados (Priority: P3)

**Goal**:
- 0 controles nativos visibles (`select`, `input[type=date|month|number|color]`).
- Selectores con búsqueda: combobox de Chakra, en lista plana.
- Fechas y meses: DatePicker de Chakra en español con semana desde el lunes.
- Porcentaje: NumberInput de Chakra.
- Color: ColorPicker de Chakra.
- Colores del tema.
- **Valores emitidos idénticos a los de hoy** (tabla "Formatos de valor" de `data-model.md`).

**Independent Test**: [quickstart.md → PR 3](./quickstart.md), pasos 1–9, incluida la comparación de payloads (SC-006).

**Branch**: `feature/#C-chakra-form-controls` desde `develop` con US2 mergeada. Si el diff supera ~800 líneas, partir en 3a (T038–T046) y 3b (T047–T056), cada uno con su propio PR.

**Invariantes (data-model.md), a respetar en cada tarea**:
- "Un control **nunca** emite `onChange` con un valor que no esté en su colección (sin texto libre en combobox)".
- "Escribir en el buscador del combobox **no** cambia el valor hasta que se selecciona una opción".
- `DateInput` emite ISO `YYYY-MM-DD` o `''`, sin hora ni zona.
- `MonthSelector` emite `YYYY-MM`.
- `InputPercent` emite un `number` entero entre 0 y 100, o `undefined`. Nunca `NaN`.
- `ColorPicker` emite "hex `#rrggbb` en minúsculas, sin alfa".

- [X] T038 [US3] Crear la rama `feature/<#C>-chakra-form-controls` desde `develop` actualizado.
- [X] T039 [US3] En `theme/index.ts`, añadir `slotRecipes` para `combobox`, `datePicker`, `numberInput`, `colorPicker` y `tooltip` con `defineSlotRecipe`, extendiendo las recipes por defecto. En `numberInput` y `colorPicker`, aplicar los mismos estilos de `content`, `input` (focus) y `trigger` que en el combobox. Estilos por slot:

  | Slot | Estilos |
  |------|---------|
  | `content` | `bg: 'bg.canvas'`, `borderColor: 'border.default'`, `color: 'text.primary'` |
  | `item` resaltado (`_highlighted`) | `bg: 'brand.500/20'` |
  | `item` seleccionado | `color: 'brand.300'` |
  | `input` (focus) | `borderColor: 'brand.500'` |
  | `tableCellTrigger` seleccionado | `bg: 'brand.500'`, `color: 'white'` |
  | `tableCellTrigger` hoy | `borderColor: 'brand.400'` |
  | `tooltip.content` | `bg: 'bg.subtle'`, `color: 'text.primary'`, `borderColor: 'border.default'` |

  Consultar las claves exactas de los slots en `node_modules/@chakra-ui/react/dist/types/theme/recipes/`. Comprobar que `pnpm type-check` pasa.
- [X] T040 [US3] Crear `components/ui/ComboboxField.tsx` según el contrato `ComboboxField`:
  - Props: `label`, `value`, `onChange`, `options: Option[]`, `placeholder?`, `required?`, `disabled?`, `invalid?`, `errorText?`, `helperText?`, `clearable?` (default `!required`), `emptyText?` (default `"Sin resultados"`) y `hideLabel?`.
  - Tipo exportado: `Option = { value: string; label: string; icon?: ReactNode; disabled?: boolean }`. Sin campo de grupo: las listas son planas (research R6).
  - Filtrado: `useFilter({ sensitivity: 'base' })` y `useListCollection({ initialItems: options, filter: contains, itemToString: o => o.label, itemToValue: o => o.value })`. Llamar a `collection.set(options)` / `reset` cuando cambien las `options`.
  - Estructura:
    - `Field.Root` con `required`, `invalid` y `disabled`.
    - `Combobox.Root` con `collection`, `value={value ? [value] : []}`, `onValueChange={e => onChange(e.value[0] ?? '')}`, `onInputValueChange={e => filter(e.inputValue)}`, `openOnClick` y `selectionBehavior="replace"`.
    - Dentro: `Combobox.Label` (o `VisuallyHidden` si `hideLabel`) y `Combobox.Control` con `Combobox.Input placeholder`, `Combobox.IndicatorGroup`, `Combobox.ClearTrigger` (si `clearable`) y `Combobox.Trigger`.
    - `Portal` con `Combobox.Positioner` y `Combobox.Content`. Dentro van `Combobox.Empty` con `emptyText` y los ítems (`Combobox.Item` con `icon` + `label` + `Combobox.ItemIndicator`), en el orden recibido.
    - `Field.HelperText` y `Field.ErrorText`.
  - Al cerrar sin seleccionar, reset del filtro y del texto a la etiqueta del valor actual.
  - Con `value === ''`, el `onChange` debe emitir `''` al limpiar.
- [X] T041 [P] [US3] Reimplementar `components/ui/SelectField.tsx` sobre `ComboboxField`, conservando exactamente sus props (`label`, `value`, `onChange`, `options`, `required`).
- [X] T042 [P] [US3] Reimplementar `components/ui/CategorySelect.tsx` sobre `ComboboxField`, conservando sus props (`value`, `onChange`, `categories`, `filterByType?`, `required?`):
  - Mismo filtro por tipo que hoy: `c.type === filterByType || c.type === 'both'`.
  - Opciones: `{ value: cat.id, label: cat.name, icon: cat.icon }`.
  - Lista plana en el mismo orden que hoy. `Category` no tiene campo de grupo; no añadir agrupación (spec, Edge Cases).
  - `placeholder="Seleccionar categoría..."`.
- [X] T043 [P] [US3] Reimplementar `components/ui/AccountSelect.tsx` sobre `ComboboxField`, conservando sus props y su `placeholder`. Opciones con `{ value: acc.id, label: acc.name, icon: acc.icon ?? '💳' }` y el mismo filtrado de cuentas que hoy.
- [X] T044 [P] [US3] Reimplementar `components/ui/CurrencySelect.tsx` y `components/ui/FrequencySelect.tsx` sobre `ComboboxField`. Deben conservar sus props, sus opciones y sus valores (códigos ISO y enum de frecuencia), con `clearable={false}`.
- [X] T045 [P] [US3] Reimplementar `components/ui/CategoryGroupSelect.tsx` sobre `ComboboxField`, conservando sus props, `placeholder="Seleccionar grupo..."` y `FieldHelperText`.
- [X] T046 [US3] Pasar al `ComboboxField` los selects inline siguientes, con `hideLabel` y `aria-label` donde hoy no hay label visible:
  - `components/settings/CurrencySelector.tsx`.
  - `components/transactions/TransactionsFilter.tsx`.
  - `components/transactions/ExportTransactionsModal.tsx`.
  - `components/chat/ChatInterface.tsx`.

  En cada uno, conservar los mismos valores, los mismos valores por defecto y los mismos handlers.
- [X] T047 [US3] En `components/reminders/ReminderForm.tsx`, pasar al `ComboboxField` los 3 `NativeSelect` inline: tipo (≈199), día 1–31 (≈217) y mes (≈231). Las opciones de día van como `String(d)`. Si el estado del formulario guarda el día como número, convertir con `Number(v)` en el `onChange` para que el valor guardado no cambie. Quitar los imports `NativeSelectRoot`/`NativeSelectField`.
- [X] T048 [US3] Reescribir internamente `components/ui/DateInput.tsx` sobre `DatePicker` de Chakra, sin cambiar sus props (`label`, `value`, `onChange`, `required?`, `disabled?`, `optional?`, `showClear?`):
  - Configuración del root: `locale="es-CO"`, `startOfWeek={1}`, `value={value ? [parseDate(value)] : []}` y `onValueChange={e => onChange(e.value[0]?.toString() ?? '')}`. `toString()` de `CalendarDate` da `YYYY-MM-DD`.
  - Formato con `format={d => DD/MM/YYYY}` y parseo con `parse` de DD/MM/AAAA, para permitir escritura manual. Solo se emite con una fecha completa válida.
  - Controles: `DatePicker.Input`, `DatePicker.Trigger` (`LuCalendar`, `aria-label="Abrir calendario"`) y `DatePicker.ClearTrigger` (si `showClear`, `aria-label="Limpiar fecha"`).
  - Contenido: vistas día, mes y año (`DatePicker.View view="day|month|year"`, con `Header`, `DayTable`, `MonthTable` y `YearTable`).
  - Conservar la etiqueta "(opcional)" usando el token `text.secondary`.
  - Eliminar el `<input type="date">` oculto, `showPicker` y los hex hardcodeados.
  - Nunca usar `new Date(iso)`.
- [X] T049 [US3] Reescribir `components/dashboard/MonthSelector.tsx` sobre `DatePicker`, conservando sus props `{ value: string ('YYYY-MM'); onChange(month: string) }`:
  - Configuración: `defaultView="month"`, `minView="month"`, `locale="es-CO"`, `min` = el primer día de hace 11 meses y `max` = el primer día del mes actual. Así se mantiene el rango "últimos 12 meses" de hoy.
  - Valor: `parseDate(`${value}-01`)`. Al cambiar, emitir `e.value[0].toString().slice(0, 7)`.
  - Texto: "septiembre 2026" con `toLocaleDateString('es', { month: 'long', year: 'numeric' })`, calculado desde año y mes, sin UTC.
  - A los lados, `ActionIconButton` `prev`/`next` ("Mes anterior"/"Mes siguiente"), deshabilitados en los límites.
  - Ancho máximo: `maxW="250px"`.
  - Debe seguir funcionando igual con `components/dashboard/DashboardContent.tsx:111`.
- [X] T050 [P] [US3] Reescribir internamente `components/ui/InputPercent.tsx` sobre `NumberInput` de Chakra, según el contrato `InputPercent` y research R11, sin cambiar sus props (`label`, `value: number | undefined`, `onChange(value: number | undefined)`, `helperText?`, `isRequired?`, `isDisabled?`):
  - Mantener `FieldRoot`, `FieldLabel` y `FieldHelperText` como hoy.
  - Dentro, `NumberInput.Root` con:
    - Límites: `min={0}`, `max={100}` y `step={1}`.
    - Comportamiento: `clampValueOnBlur` y `allowMouseWheel={false}`.
    - Formato: `locale="es-CO"` y `formatOptions={{ maximumFractionDigits: 0 }}`.
    - Valor: `value={value === undefined ? '' : String(value)}` y `onValueChange={e => onChange(e.value === '' || Number.isNaN(e.valueAsNumber) ? undefined : e.valueAsNumber)}`.
  - Controles: `InputGroup endElement="%"` que envuelve `NumberInput.Input` (`placeholder="0"`, `inputMode="numeric"`), más `NumberInput.Control` con `IncrementTrigger` y `DecrementTrigger` (`aria-label` "Aumentar porcentaje" / "Disminuir porcentaje", áreas táctiles de 44 px o más en móvil).
  - No usar `type="number"`.
  - Único consumidor: `components/budgets/BudgetForm.tsx:252`, que no cambia.
  - Comprobar a mano que se cumple: escribir 150 y salir del campo da 100, vaciar el campo da `undefined` y el campo nunca emite `NaN`.
- [X] T051 [P] [US3] Reescribir `components/categories/ColorPicker.tsx` sobre `ColorPicker` de Chakra, según el contrato `ColorPicker` y research R12, sin cambiar sus props (`value: string`, `onChange(color: string)`):
  - Conservar el array `COLORS` (las 15 muestras, en el mismo orden).
  - Root: `ColorPicker.Root` con `value={parseColor(value || '#6366f1')}`, `format="rgba"` y `onValueChange={e => onChange(e.value.toString('hex').toLowerCase())}`. Controlar `open` para cerrar el popover al elegir una muestra.
  - Trigger: `ColorPicker.Control` con `ColorPicker.Trigger` (`aria-label="Elegir color"`) y `ColorPicker.ValueSwatch` de 36 px (`w="9" h="9" borderRadius="md"`), con borde `border.default` y `brand.500` cuando está abierto.
  - Contenido: `Portal` con `ColorPicker.Positioner` y `ColorPicker.Content` (`bg="bg.canvas"`, `borderColor="border.default"`, `w="220px"`). Dentro:
    - `ColorPicker.SwatchGroup`, en una rejilla de 5 columnas, con `COLORS.map(c => <ColorPicker.SwatchTrigger value={c}><ColorPicker.Swatch value={c} /><ColorPicker.SwatchIndicator /></ColorPicker.SwatchTrigger>)`, cada uno con `aria-label` en español (p. ej. "Color #ef4444").
    - Un `Text` "Personalizado" (`text.secondary`, `fontSize="xs"`).
    - `ColorPicker.Area` (con `AreaBackground` y `AreaThumb`) y `ColorPicker.ChannelSlider channel="hue"` (con `ChannelSliderTrack` y `ChannelSliderThumb`).
    - `ColorPicker.ChannelInput channel="hex"`, con el valor en mayúsculas solo para mostrarlo.
  - Eliminar el `<input type="color">` oculto, `nativeColorRef`, `showPicker`, `StyledButton`, el cálculo manual de posición (`getBoundingClientRect`, `position: fixed`, `PICKER_WIDTH`/`PICKER_HEIGHT`) y el listener `mousedown`. El `Positioner` gestiona el posicionamiento y las colisiones.
  - Los 4 consumidores no cambian: `components/settings/AccountForm.tsx:204`, `components/categories/CategoryForm.tsx:88`, `components/categories/CategoryEditForm.tsx:94` y `components/categories/QuickCategoryForm.tsx:105`. En `QuickCategoryForm`, comprobar que el popover no queda tapado si se abre dentro de un diálogo (z-index del `Portal`).
  - Comprobar a mano que se cumple: elegir una muestra emite exactamente el mismo string de `COLORS` y un color personalizado se emite como `#rrggbb` en minúsculas, sin alfa.
- [X] T052 [US3] Auditoría de controles nativos. Estos dos comandos no deben devolver nada:
  - `grep -rnE "NativeSelect|<select|<option|type=\"(date|month|number|color)\"|showPicker" app components --include='*.tsx'`. La única excepción permitida es el `<input type="file">` oculto de `components/transactions/ImportTransactionsModal.tsx` (spec FR-017), que esta búsqueda no detecta.
  - `grep -rn "NativeSelect" theme`

  Revisar que los ~25 consumidores de los wrappers compilan sin cambios (`pnpm type-check`).
- [X] T053 [US3] Ejecutar `pnpm type-check && pnpm lint && pnpm build` y corregir errores.
- [X] T054 [US3] Validar [quickstart.md → PR 3](./quickstart.md), pasos 1–9, en 375×812 y en escritorio:
  - Búsqueda sin tildes, teclado, "Sin resultados" y estado de error.
  - Calendario en español con la semana desde el lunes.
  - Dashboard con cambio de mes.
  - Porcentaje (pasos 6a) y color (6b).
  - La consola devuelve `0` para `document.querySelectorAll('select, input[type=date], input[type=month], input[type=number], input[type=color]').length`.
- [ ] T055 [US3] **(Pendiente con sesión real: formatos verificados por componente en PR #539.)** Invariante de datos (SC-006). Con DevTools → Network, crear y editar una transacción, un recordatorio, una cuenta, un movimiento, un presupuesto con porcentaje y una categoría con color predefinido y personalizado, primero en `develop` y luego en la rama. Comparar los payloads (fecha `YYYY-MM-DD`, ids uuid, moneda ISO, día del recordatorio, porcentaje numérico y color `#rrggbb` en minúsculas) y documentar en el PR que son idénticos.
- [X] T056 [US3] Commitear con `feat(ui): migrar selectores, fechas, porcentaje y color a componentes de Chakra`. Abrir un PR a `develop` con `Closes #C`, capturas, el resultado de T055 y la nota "Sin cambios de datos (FR-015); sin cambios de acceso (principio III)". Hacer merge `--squash` tras la aprobación.

**Checkpoint**: Las tres historias están en `develop`.

---

## Phase 6: Polish & Release

**Purpose**: Cierre transversal y publicación de la versión.

- [X] T057 **(Hallazgos corregidos en #541.)** Revisión transversal en `develop` en 375×812 y en escritorio. Buscar:
  - Tooltips cortados en los bordes.
  - Desplegables y calendario tapados en `FormDialog` (z-index del `Portal`).
  - Foco visible.
  - Contraste de los textos `text.secondary` sobre `bg.canvas`.

  Si hay que corregir algo, abrir `fix/<issue>-ui-refresh-polish` con su PR a `develop`.
- [X] T058 Crear la rama `chore/bump-v3.12.0` desde `develop`. Subir `"version"` en `package.json` a `3.12.0` y añadir la entrada `## [3.12.0] - <fecha>` en `CHANGELOG.md`, siguiendo el formato de las entradas existentes. Secciones "Mejoras de UI" con: tarjetas de cuentas, acciones con iconos Lucide, y combobox, datepicker, campo de porcentaje y selector de color de Chakra. Commitear con `chore: bump version to 3.12.0` y abrir un PR a `develop`. Hacer merge `--squash` tras la aprobación.
- [ ] T059 Abrir el PR `develop → main` con `gh pr create --base main --head develop --title "Release v3.12.0"`, con un resumen del changelog. **Esperar la aprobación explícita del dueño en chat antes de hacer el merge.** Respetar el flujo de la memoria "Release flow develop→main": puede haber divergencia por hotfixes.
- [ ] T060 Tras el merge a `main`:
  - `git checkout main && git pull`.
  - `git tag v3.12.0 && git push origin v3.12.0`.
  - `gh release create v3.12.0 --title "v3.12.0" --notes-file <extracto de CHANGELOG 3.12.0>`.

  Después, verificar que el deploy de producción en Vercel (GitHub Actions) terminó bien.
- [ ] T061 Marcar como completas las tareas de `specs/001-ui-visual-refresh/tasks.md` y cerrar las issues `#A`, `#B` y `#C` si no se cerraron solas.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (T001–T002)**: no depende de nada. T002 da los números de issue que usan las ramas.
- **Foundational**: vacía.
- **US1 (T003–T011)**: depende de Setup. Es el MVP.
- **US2 (T012–T037)**: depende de que US1 esté mergeada en `develop`, porque reutiliza `ActionIconButton` y `action-icons.ts`.
- **US3 (T038–T056)**: depende de que US2 esté mergeada, para evitar conflictos en `ChatInterface`, `ExportTransactionsModal` y `AccountsTab`. Usa `ActionIconButton` en `MonthSelector`.
- **Polish & Release (T057–T061)**: depende de US1–US3 en `develop`. T059 y T060 requieren la aprobación explícita del dueño.

```text
T001 → T002 → [US1: T003 → (T004 ∥ T005) → T006 → T007 → T008 → T009 → T010 → T011]
            → [US2: T012 → T013 → (T014 … T033 en paralelo) → T034 → T035 → T036 → T037]
            → [US3: T038 → T039 → T040 → (T041 ∥ T042 ∥ T043 ∥ T044 ∥ T045) → T046 → T047 → T048 → T049 → (T050 ∥ T051) → T052 → T053 → T054 → T055 → T056]
            → T057 → T058 → T059 (aprobación) → T060 → T061
```

### Within Each User Story

- US1: primero `action-icons` y `TruncatedText`, después `ActionIconButton`, `AccountCard` y la integración en `AccountsTab`.
- US2: primero el mapa de iconos (T013) y después las migraciones por archivo, que son independientes entre sí.
- US3: primero el tema y `ComboboxField`, después los wrappers y los selects inline, luego las fechas y al final el porcentaje y el color.

### Parallel Opportunities

- US1: T004 ∥ T005.
- US2: de T014 a T033 son 20 tareas sobre archivos disjuntos, todas `[P]` una vez hecha T013.
- US3: T041 ∥ T042 ∥ T043 ∥ T044 ∥ T045 una vez hecha T040. T048, T049, T050 y T051 pueden ir en paralelo con T046 y T047, porque tocan archivos distintos y solo dependen del tema (T039).

## Parallel Example: User Story 2

```text
Tras T013, lanzar en paralelo (subagentes, un archivo o grupo cada uno):
  T014 TransactionsPageClient   T015 GmailSyncButton        T016 GmailSyncReviewModal
  T017 ImportTransactionsModal  T018 ExportTransactionsModal T019 TransactionsTable/CardMobile
  T020 BudgetsPageClient        T021 BudgetGroupAccordion    T022 BudgetCategoryTable/Widget
  T023 Calendarios              T024 ConsejosAhorro          T025 Chat
  T026 Cron/Gmail panels        T027 AccountsTab movimientos T028 Dashboard
  T029 Loans                    T030 Savings                 T031 Categorías/Recordatorios
  T032 Notificaciones           T033 ConfirmDialog/FormDialog
Luego T034 (auditoría) de forma secuencial.
```

## Parallel Example: User Story 3

```text
Tras T040 (ComboboxField):
  T041 SelectField   T042 CategorySelect   T043 AccountSelect   T044 Currency/Frequency   T045 CategoryGroupSelect
En paralelo con T046 y T047 (selects inline):
  T048 DateInput     T049 MonthSelector     T050 InputPercent     T051 ColorPicker
```

## Implementation Strategy

### MVP First (User Story 1)

1. Setup (T001–T002).
2. US1 (T003–T011). Es el defecto visible de la captura y se entrega solo.
3. **Parar y validar**: el dueño revisa el PR de US1 en el preview de `develop`.

### Incremental Delivery

1. US1, luego PR a `develop` y su aprobación.
2. US2, luego PR a `develop` y su aprobación.
3. US3 (o 3a y 3b), luego PR a `develop` y su aprobación.
4. Release 3.12.0: el bump, después el PR `develop → main` con aprobación explícita y por último el tag y el GitHub release.

Cada PR se puede revertir de forma independiente. Ninguno cambia datos ni server actions.

## Notes

- `[P]` indica archivos distintos sin dependencias pendientes.
- Los números de línea (≈) son orientativos, tomados del inventario del 2026-09-23. Hay que localizar cada botón por su texto.
- No se añaden tests automatizados: la spec no los pide (research R9).
- Si alguna tarea necesitara una dependencia nueva, hay que detenerse y justificarlo en `plan.md`, según el principio VI.
