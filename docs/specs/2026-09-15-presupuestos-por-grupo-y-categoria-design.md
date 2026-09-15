# Presupuestos por grupo y por categoría — diseño

- **Fecha:** 2026-09-15
- **Rama:** `feat/528-presupuestos-por-grupo-y-categoria`
- **Nivel:** 3 (feature)

## Problema

La vista de Presupuestos (`Planificación → Presupuestos`) renderiza todos los
presupuestos en un `VStack` plano, una card a ancho completo por presupuesto.
Con 22 presupuestos activos (5 de grupo y 17 de categoría) la vista exige
scroll largo y no distingue los dos ejes: el tope real del grupo y el reparto
interno por categoría.

El modelo de datos ya soporta ambos (`budgets.scope`, `budgets.group_id`,
`category_groups`, `category_group_members`) y `getBudgets` ya calcula `spent`
y `limit_amount` para los tres scopes. Lo que falta es la presentación.

El objetivo del usuario es leer su situación en bloques grandes —cinco cifras—
y bajar al detalle solo cuando un bloque se sale.

## Alcance

**Dentro:**

1. Sub-tabs `Grupos` / `Categorías` dentro de la pestaña Presupuestos.
2. Vista Grupos como acordeón con desglose de categorías miembro.
3. Vista Categorías como tabla densa en desktop y filas de dos líneas en mobile.
4. `BudgetWidget` del dashboard: pasa a mostrar solo presupuestos de grupo, en
   formato compacto de una línea.

**Fuera:**

- Cambios al esquema de base de datos.
- Cambios a `BudgetForm` más allá de preseleccionar el scope.
- Cambios a `budgets.actions.ts` (la capa de datos ya entrega lo necesario).
- Cambios a la pestaña Metas de Ahorro.

## Decisiones de diseño

### 1. Estructura y routing

Sub-tabs dentro de la pestaña existente, no tabs de primer nivel: el nivel
superior de Planificación mezcla secciones (Metas, Presupuestos), y el eje
grupo/categoría es una *vista* dentro de una sección, no una sección nueva.

Estado en la URL: `?tab=presupuestos&vista=grupos|categorias`. Valor por
defecto `grupos`. Un `vista` desconocido cae a `grupos`.

**Sin queries nuevas.** `getBudgets(userId)` ya devuelve todos los presupuestos
del usuario con `spent`, `limit_amount` y el `group` resuelto. El split entre
sub-tabs es filtrado en cliente por `budget.scope`. La URL solo existe para que
recargar o compartir el enlace conserve la vista.

El botón `+ Nuevo Presupuesto` abre `BudgetForm` con el scope preseleccionado
según el sub-tab activo (`group` en Grupos, `category` en Categorías).

### 2. Vista Grupos — acordeón a ancho completo

Filas-acordeón, no grid de cards expandibles: una card que se expande dentro de
un grid desplaza a sus vecinas de columna y produce saltos de layout. Con cinco
grupos, la fila a ancho completo da además espacio para el desglose sin apretar.

**En reposo**, cada fila muestra: icono y nombre del grupo, `gastado / tope`,
porcentaje, barra de progreso y chevron.

**Expandida**, despliega hacia abajo una línea por categoría miembro *que tenga
presupuesto propio*, con nombre, mini-barra y porcentaje.

#### Fila residual

El presupuesto de grupo suma el gasto de **todas** las categorías del grupo,
incluidas las que no tienen presupuesto propio (hoy: `Educación`). Si el
desglose listara solo las categorías con presupuesto, sus cifras no sumarían el
total del grupo y parecería un error de cálculo.

Se cierra con una fila final **"Otras categorías del grupo"**:

```
residual = budgetDeGrupo.spent − Σ(presupuestosDeCategoríaMiembros.spent)
```

Se renderiza solo si `residual > 0`. No requiere queries nuevas: ambos lados de
la resta ya vienen de `getBudgets`.

> Nota: un presupuesto de categoría cuyo periodo activo difiera del periodo del
> presupuesto de grupo (distinto `start_date` o `period`) compara gastos de
> ventanas distintas y puede producir un residual negativo. Por eso la fila se
> oculta cuando el residual no es positivo, en lugar de mostrar un número sin
> sentido.

### 3. Vista Categorías — dos layouts, un componente

Punto de corte: **1024px** (`lg` de Chakra).

**Desktop (≥1024px)** — tabla densa, una fila por presupuesto:

| Categoría | Tope | Barra | % |
|---|---|---|---|

Editar y Eliminar aparecen al hacer hover sobre la fila; en reposo la tabla se
mantiene limpia.

**Mobile (<1024px)** — filas de dos líneas: nombre y porcentaje arriba, barra a
todo el ancho y montos (`gastado` / `de tope`) abajo. Al tocar una fila se abre
un panel con el detalle completo (periodo, fecha de inicio, montos) y las
acciones, porque en táctil no existe el hover.

**Orden por defecto en ambos layouts: porcentaje consumido descendente**, para
que lo que está por excederse quede arriba.

### 4. BudgetWidget del dashboard

Pasa a mostrar **solo presupuestos con `scope === 'group'`**, todos (no top 3),
en el formato más compacto posible: una línea por grupo con nombre, mini-barra
y porcentaje. Con cinco grupos el widget completo cabe sin scroll y entrega
exactamente las cinco cifras que el usuario quiere vigilar a diario.

**Fallback:** si el usuario no tiene ningún presupuesto de grupo, el widget
conserva el comportamiento actual (los 3 de mayor consumo, sin importar scope).
Esto evita que un usuario sin grupos vea un widget vacío.

El enlace "Ver todos →" apunta a `?tab=presupuestos&vista=grupos`.

## Componentes

| Archivo | Cambio |
|---|---|
| `app/(dashboard)/planificacion/page.tsx` | lee `vista` de `searchParams` y la pasa al cliente |
| `app/(dashboard)/planificacion/PlanificacionPageClient.tsx` | propaga `vista` a `BudgetsPageClient` |
| `app/(dashboard)/budgets/BudgetsPageClient.tsx` | renderiza sub-tabs, filtra por scope, preselecciona scope en el form |
| `components/budgets/BudgetGroupAccordion.tsx` | **nuevo** — acordeón de grupos con desglose y residual |
| `components/budgets/BudgetCategoryTable.tsx` | **nuevo** — tabla en desktop, filas de dos líneas en mobile |
| `components/budgets/BudgetProgress.tsx` | nuevo prop `variant: 'full' \| 'bar'`; `'full'` es el render actual y el valor por defecto |
| `components/budgets/BudgetWidget.tsx` | filtra a scope `group`, formato de una línea, fallback |
| `components/budgets/BudgetList.tsx` | **se elimina** — `BudgetsPageClient` era su único consumidor |
| `lib/utils/budget-grouping.ts` | **nuevo** — funciones puras de agrupación y residual |

`BudgetForm.tsx`, `lib/actions/budgets.actions.ts`, `lib/validations/budget.ts`
y el esquema de base de datos no se modifican.

### `lib/utils/budget-grouping.ts`

Concentra toda la aritmética para poder probarla sin montar React:

- `splitBudgetsByScope(budgets)` → `{ total, groups, categories }`
- `buildGroupBreakdown(groupBudget, categoryBudgets)` → miembros ordenados por
  porcentaje descendente más `residual`
- `sortByConsumption(budgets)` → orden descendente por `spent / limit_amount`

Usa `safeRatio` y `toNumber` de `lib/utils/numbers.ts`, ya existentes, para no
duplicar el manejo de división por cero y de valores nulos.

## Casos borde

| Caso | Comportamiento |
|---|---|
| `scope: 'total'` | No pertenece a ninguno de los dos sub-tabs. Se renderiza como franja fija encima de ambos, siempre visible. |
| Grupo sin presupuesto propio | No aparece en la vista Grupos. Sus categorías sí aparecen en la vista Categorías. |
| Presupuesto cuyo grupo fue eliminado | Se conserva el texto actual `'Grupo eliminado'`. |
| Categoría miembro sin presupuesto propio | No aparece como línea del desglose; su gasto entra en la fila residual. |
| Residual ≤ 0 | La fila residual se oculta. |
| Sub-tab sin presupuestos | Mensaje vacío propio de esa vista, con el botón de crear. |
| `limit_amount = 0` en presupuesto porcentual | Se conserva el mensaje actual de `BudgetProgress` ("Sin movimientos suficientes…"). |
| Presupuesto con `start_date` futuro | `resolvePeriod` ya devuelve el primer ciclo como activo; se muestra con `spent = 0`. Sin cambios. |

## Verificación

El repositorio no tiene framework de tests; los scripts de verificación
existentes son `tsx` ejecutados a mano (`scripts/test-*-parser.ts`).

1. `pnpm type-check`
2. `pnpm lint`
3. `pnpm build`
4. `npx tsx scripts/test-budget-grouping.ts` — **nuevo**, siguiendo la
   convención de los `test-*-parser.ts`. Cubre `budget-grouping.ts`: residual
   positivo, residual cero, residual negativo (se oculta), grupo sin miembros
   con presupuesto, y orden por consumo.
5. Revisión visual: desktop ≥1024px y ~390px, en ambos sub-tabs, con el
   acordeón abierto y cerrado, y el widget del dashboard.

## Notas para quien implemente

- `AGENTS.md` del repositorio: esta versión de Next (**16.2.3**) tiene cambios
  incompatibles respecto al conocimiento previo. Leer la guía correspondiente en
  `node_modules/next/dist/docs/` antes de escribir código, en particular lo
  relativo a `searchParams` en Server Components.
- Chakra UI es **v3** (`^3.34.0`): la API de `Tabs` es `Tabs.Root` /
  `Tabs.List` / `Tabs.Trigger` / `Tabs.Content`, como ya se usa en
  `PlanificacionPageClient.tsx`.
- Mantener la paleta oscura existente (`#0F0F0F`, `#1A1A1A`, `#2d2d35`,
  `#B0B0B0`, acento `#4F46E5` / `#6366f1`) y los umbrales de color de
  `BudgetProgress` (verde ≤80%, amarillo >80%, rojo >100%).
