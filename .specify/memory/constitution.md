# Expense Manager Constitution

## Core Principles

### I. Documentación de Next.js primero

El proyecto usa Next.js 16 (App Router), cuyas APIs y convenciones difieren de versiones
anteriores.

- Antes de escribir o cambiar código que dependa de Next.js (routing, server actions, caching,
  `proxy.ts`, metadata, config), se DEBE consultar la guía correspondiente en
  `node_modules/next/dist/docs/`.
- Los avisos de deprecación DEBEN respetarse; no se introducen APIs deprecadas.
- Cada plan (`/speckit-plan`) que toque Next.js DEBE citar la guía consultada.

**Razón**: evitar código basado en APIs de versiones anteriores que compila pero falla o se comporta
distinto en la versión instalada.

### II. Tipado estricto y validación en el borde

- TypeScript en modo estricto; `any` explícito solo con comentario que lo justifique.
- Toda entrada que cruce un límite de confianza (server actions en `lib/actions/`, route handlers en
  `app/api/`, respuestas de IA, parsers de extractos bancarios, datos de Gmail) DEBE validarse con
  Zod (esquemas en `lib/validations/`) antes de usarse.
- `pnpm type-check` y `pnpm lint` DEBEN pasar sin errores antes de abrir un PR.

**Razón**: los datos financieros llegan de fuentes heterogéneas (usuario, bancos, IA); validar en el
borde evita que datos malformados lleguen a la base de datos.

### III. Aislamiento de datos por usuario (NON-NEGOTIABLE)

- Toda server action y route handler DEBE obtener la sesión (NextAuth) y rechazar la petición si no
  hay usuario autenticado.
- Toda lectura y escritura DEBE filtrarse por el `user_id` de la sesión; nunca por un id recibido
  del cliente.
- El cliente administrativo de InsForge (`lib/insforge-admin.ts`) y las API keys (Anthropic,
  InsForge, Google) solo se usan en el servidor; nunca se exponen al bundle del cliente.
- Los crons y endpoints internos DEBEN verificar su secreto de autorización.

**Razón**: es una app de finanzas personales; una fuga entre usuarios es el peor fallo posible.

### IV. Integridad financiera

- Los montos DEBEN conservar su moneda original (COP, USD, VES); las conversiones se calculan y
  nunca sobrescriben el monto original.
- Los totales, presupuestos y reportes DEBEN ser consistentes entre vistas (dashboard, presupuestos,
  calendario, exportación): un mismo dato se calcula en un solo lugar y se reutiliza.
- Ningún cambio puede provocar pérdida silenciosa de datos. Las migraciones SQL se versionan en el
  repositorio, se aplican manualmente contra InsForge y DEBEN documentar su orden de aplicación y su
  reversión en el PR.
- Las operaciones destructivas (borrar transacciones, cuentas, categorías con datos asociados) DEBEN
  pedir confirmación al usuario y definir qué pasa con los registros dependientes.

**Razón**: un número incorrecto en una app de gastos destruye la confianza del usuario.

### V. UI mobile-first, accesible y en español

- Toda interfaz se diseña primero para móvil (bottom navigation, vistas en tarjetas) y luego se
  adapta a escritorio.
- Se usan los componentes de Chakra UI v3 y los tokens del tema (`theme/`); no se introducen otras
  librerías de UI sin justificarlo en el plan.
- Los controles interactivos DEBEN ser accesibles: etiquetas o `aria-label`, navegación por
  teclado, foco visible y contraste suficiente en modo claro y oscuro.
- Todo texto visible para el usuario está en español.

**Razón**: la app se usa principalmente desde el teléfono como PWA, y sus usuarios hablan español.

### VI. Simplicidad y cambios acotados

- Cada spec resuelve un problema concreto; los cambios no relacionados van en su propia spec o PR.
- Se prefiere extender los patrones existentes (server actions, hooks, componentes) antes que crear
  abstracciones nuevas; toda abstracción o dependencia nueva DEBE justificarse en el plan.
- YAGNI: no se implementa funcionalidad que la spec no pida.

**Razón**: PRs pequeños y enfocados son más fáciles de revisar, probar y revertir.

## Stack y restricciones técnicas

- **Framework**: Next.js 16 (App Router, Server Components), React 19, TypeScript.
- **UI**: Chakra UI v3, Framer Motion, gráficos con Nivo; iconos con `react-icons`.
- **Datos**: InsForge (PostgreSQL) mediante `@insforge/sdk`.
- **Autenticación**: NextAuth.js v4 con Google OAuth.
- **IA**: Anthropic Claude vía `@anthropic-ai/sdk`, siempre desde el servidor.
- **Gestor de paquetes**: pnpm. No se usan npm ni yarn para instalar dependencias.
- **Deploy**: Vercel mediante GitHub Actions (`develop` → preview, `main` → producción).
- **Verificación**: parsers y crons se validan con sus scripts (`pnpm test:*-parser`,
  `pnpm test:crons`). Si se agregan tests automatizados, se ejecutan solo los archivos afectados y
  con recursos limitados (`--maxWorkers=2 --testTimeout=15000 --forceExit` en Jest).

## Flujo de desarrollo y quality gates

- Se sigue `rules/github-flow.md`: una issue y una rama `feature/NNN-descripcion` por tarea, creada
  desde `develop`; PR a `develop` con merge `--squash`.
- Los commits siguen Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`).
- Antes de abrir un PR DEBEN pasar: `pnpm type-check`, `pnpm lint`, `pnpm build`, los scripts de
  verificación del área tocada y una comprobación manual del flujo afectado en la app (móvil y
  escritorio).
- El release sigue: rama `chore/bump-vX.Y.Z` (versión en `package.json` + entrada en
  `CHANGELOG.md`) → PR a `develop` → PR `develop → main`. El merge a `main` requiere aprobación
  manual explícita del dueño del proyecto; después se crea el tag `vX.Y.Z` sobre `main` y el
  release en GitHub.
- Nunca se hacen commits directos a `main` ni a `develop`.

## Governance

- Esta constitución prevalece sobre cualquier otra práctica del proyecto. `AGENTS.md` y
  `rules/*.md` la complementan con guía operativa.
- Todo plan (`/speckit-plan`) DEBE pasar el "Constitution Check"; cualquier desviación se registra
  en la tabla de complejidad del plan con su justificación.
- Enmiendas: se proponen con `/speckit-constitution`, se revisan en un PR propio y se registran con
  versionado semántico:
  - MAJOR: se elimina o redefine un principio de forma incompatible.
  - MINOR: se agrega un principio o sección, o se amplía de forma material.
  - PATCH: aclaraciones y correcciones de redacción.
- Cada revisión de PR verifica el cumplimiento de los principios III (aislamiento) y IV
  (integridad financiera) de forma explícita.

**Version**: 1.0.0 | **Ratified**: 2026-09-23 | **Last Amended**: 2026-09-23
