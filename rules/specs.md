# Specs — desarrollo guiado por specs con OpenSpec

Los specs son la **fuente de verdad de la intención**. Viven solo en el vault de Obsidian, en el **store
`expense-manager`** de OpenSpec (`<vault>/expense-manager/openspec/`). Este repo solo tiene
`openspec/config.yaml` con `store: expense-manager`, así que `openspec` y `/opsx:*` lanzados desde aquí
actúan sobre el vault (`Using OpenSpec root: expense-manager`). Nunca crees carpetas reales
`openspec/specs` ni `openspec/changes` en el repo: taparían el store. Principios:
`expense-manager/docs/constitution.md` en el vault. El código implementa los specs; nunca los contradice.
Si código y spec no coinciden, se corrige uno de los dos en el mismo change.

Reemplaza a Spec Kit (`.specify/`, `specs/NNN-*`, `/speckit-*`), retirado el 2026-10-06. La spec 001
(refresco visual de la UI, v3.12.0) se migró al store: change archivado
`changes/archive/2026-10-06-ui-visual-refresh/` y specs `account-cards`, `icon-actions` y `form-controls`.

## Setup (una vez por máquina)

```bash
openspec store register "<vault>/expense-manager" --id expense-manager --yes
openspec list --specs   # desde el repo: imprime "Using OpenSpec root: expense-manager"
```

## Estructura del store

```
<vault>/expense-manager/
├── openspec/
│   ├── config.yaml                  ← contexto del proyecto + reglas por artefacto
│   ├── specs/<capacidad>/spec.md    ← lo que el sistema ES hoy (permanente)
│   └── changes/
│       ├── <change-id>/             ← proposal.md, design.md, tasks.md, specs/ (deltas)
│       └── archive/                 ← changes cerrados
└── docs/                            ← constitution.md y otra documentación de referencia (no specs)
```

## Flujo

```
idea → /opsx:propose (proposal + deltas + design + tasks) → revisión → issue(s) → /opsx:apply (código)
     → PR a develop → PR develop → main (aprobación de Sanghel) → tag + release → /opsx:archive
```

1. Escribe o actualiza el change **antes** del código: `/opsx:propose <change-id>` y luego
   `openspec validate <change-id> --strict`.
2. Cada requisito tiene al menos un `#### Scenario:` (WHEN/THEN) verificable (por test, script o validación manual documentada).
3. `design.md` incluye el Constitution Check (principios I–VI); las desviaciones van en Complexity Tracking.
4. Cada grupo de `tasks.md` cierra con `pnpm type-check`, `pnpm lint`, `pnpm build`, los scripts del área
   tocada y una validación manual en móvil y escritorio.
5. El PR que implementa un change nombra el change id en su descripción; `tasks.md` se marca a medida que
   avanza y `## Seguimiento` de `proposal.md` lista issues, ramas y PRs.
6. Archiva (`/opsx:archive <change-id>`) solo cuando el trabajo ya está publicado en `main`.

Ramas, commits, PRs y releases siguen `rules/github-flow.md` sin cambios.

## Identificadores

| Artefacto | Esquema                                            | Ejemplo             |
| --------- | -------------------------------------------------- | ------------------- |
| Capacidad | sustantivo kebab-case de un comportamiento estable | `form-controls`     |
| Change    | frase verbal kebab-case                            | `add-budget-alerts` |

Los ids legacy de Spec Kit (`001/FR-NNN`, `SC-NNN`, `USn-m`, `T0NN`) se conservan en los specs para trazabilidad.

## Convenciones de Obsidian

- Wikilinks con ruta completa desde la raíz del vault: `[[expense-manager/openspec/specs/form-controls/spec|form-controls]]`.
- El código se enlaza con rutas relativas planas (Obsidian no las abre, GitHub sí).
- Frontmatter permitido en los archivos de OpenSpec (`legacy_id`, `status`, `issue`, `pr`, `tags`).
- No se versiona `.obsidian/` (es configuración personal).
