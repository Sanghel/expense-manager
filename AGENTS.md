<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# Expense Manager — guía del proyecto

App de finanzas personales (Next.js 16 + Chakra UI v3 + InsForge). Principios no negociables:
`~/Documents/Obsidian Vault/expense-manager/docs/constitution.md`. Flujo git: `rules/github-flow.md`.
Deploy: `rules/deploy-guide.md`.

## Specs primero — OpenSpec, store `expense-manager`

Los specs son la fuente de verdad de la intención y viven **solo en el vault de Obsidian**, en el store de
OpenSpec **`expense-manager`**: `~/Documents/Obsidian Vault/expense-manager/openspec/` (registrado con
`openspec store register`). Nunca escribas specs, changes ni diseños como archivos del repo. **Lee el spec
relevante antes de escribir código y mantenlo sincronizado en el mismo change.** Detalle del proceso:
`rules/specs.md`.

- `openspec/config.yaml` de este repo solo contiene `store: expense-manager`, así que cualquier `openspec` o
  `/opsx:*` lanzado desde aquí actúa sobre el vault. Comprueba la línea `Using OpenSpec root: expense-manager`.
  **Nunca** crees `openspec/specs` ni `openspec/changes` reales en este repo: taparían el store.
- Contexto y reglas de los artefactos (idioma, principios, stack): `expense-manager/openspec/config.yaml` del vault.
- Skills `/opsx:*` instalados globalmente; no hace falta nada por proyecto. No se usa Spec Kit.
- Panorama: `openspec list --specs` (lo que el sistema es hoy), `openspec list` (changes en curso),
  `openspec show <id>`.

### Clasifica cada mensaje antes de actuar

Empieza **cada respuesta** con una línea `**Tipo:** <categoría>` y actúa según ella:

| Categoría       | Qué es                                                                        | Qué hacer                                                                                                                                    |
| --------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `consulta`      | Pregunta, análisis, revisión, explicación                                     | Responder. Sin cambios en código ni en el vault.                                                                                             |
| `modificación`  | Cambiar un spec existente o una funcionalidad ya implementada (incluye fixes) | Si cambia un requisito: change de OpenSpec (`/opsx:propose`) con delta `MODIFIED`. Si es un fix que no cambia requisitos: issue → rama → PR. |
| `feature nueva` | Funcionalidad que no tiene spec en el store                                   | Flujo OpenSpec completo (abajo).                                                                                                             |

Si el mensaje encaja en más de una, o no está claro, di cuál interpretas y pregunta antes de tocar nada.

### Feature nueva: OpenSpec con puntos de aprobación

Cada paso **se detiene y espera la aprobación explícita de Sanghel** antes del siguiente. Nunca encadenes pasos.

1. (Opcional) `/opsx:explore` para aclarar ideas. Sin escribir artefactos.
2. `/opsx:propose <change-id>` → crea en el store `changes/<change-id>/` con `proposal.md`, `specs/` (deltas),
   `design.md` (con Constitution Check) y `tasks.md`. `openspec validate <change-id> --strict`. **Parar.**
3. Tras la revisión: ajustes con `/opsx:update`; al aprobar se crean las issues (`rules/github-flow.md`) y se
   anotan en el frontmatter (`issue:`) y en `## Seguimiento` de `proposal.md`. **Parar.**
4. Aprobado → `/opsx:apply` en una rama `feature/<issue>-<slug>` desde `develop`; marca `tasks.md` a medida que avanza.
5. Cuando el trabajo llega a `main` (PR `develop → main` aprobado y mergeado por Sanghel) → `/opsx:archive <change-id>`:
   fusiona los deltas en `openspec/specs/` y mueve el change a `changes/archive/`. Nunca borres artefactos a mano.

### Trazabilidad en `proposal.md`

Al final de cada `proposal.md`:

```markdown
## Seguimiento

- Repos: expense-manager
- Issues: #N
- Branches: feature/N-slug
- PRs: #M
- Release: vX.Y.Z
- Relacionado: [[expense-manager/openspec/specs/form-controls/spec|form-controls]]
```

Wikilinks siempre con ruta completa desde la raíz del vault (`[[expense-manager/...]]`).
