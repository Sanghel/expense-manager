<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# Expense Manager — guía del proyecto

App de finanzas personales (Next.js 16 + Chakra UI v3 + InsForge). Principios no negociables:
`~/Documents/Obsidian Vault/expense-manager/docs/constitution.md`. Flujo git: `rules/github-flow.md`.
Deploy: `rules/deploy-guide.md`.

## Flujo de trabajo

Documentación de referencia (no código) en el vault: `~/Documents/Obsidian Vault/expense-manager/docs/`.

### Clasifica cada mensaje antes de actuar

Empieza **cada respuesta** con una línea `**Tipo:** <categoría>` y actúa según ella:

| Categoría       | Qué es                                                    | Qué hacer                                                         |
| --------------- | --------------------------------------------------------- | ----------------------------------------------------------------- |
| `consulta`      | Pregunta, análisis, revisión, explicación                 | Responder. Sin cambios en código ni en el vault.                  |
| `modificación`  | Cambiar una funcionalidad ya implementada (incluye fixes) | Issue → rama → PR (`rules/github-flow.md`).                       |
| `feature nueva` | Funcionalidad nueva                                       | Plan corto con aprobación de Sanghel y después issue → rama → PR. |

Si el mensaje encaja en más de una, o no está claro, di cuál interpretas y pregunta antes de tocar nada.

### Feature nueva: plan, después issue → rama → PR

1. Plan corto (alcance, archivos, tests). **Parar** y esperar la aprobación explícita de Sanghel.
2. Aprobado → crear las issues (`rules/github-flow.md`).
3. Rama `feature/<issue>-<slug>` desde `develop`, con tests, y PR hacia `develop`.
4. El trabajo llega a `main` con el PR `develop → main` (aprobado y mergeado por Sanghel).
