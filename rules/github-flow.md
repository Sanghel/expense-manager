# 01 - FLUJO GIT Y GITHUB

## 📖 Guía Completa del Workflow de Git Flow

Este documento explica el flujo de trabajo con Git y GitHub que se usará durante todo el desarrollo del proyecto.

---

## 🌳 Estructura de Ramas

```
main (producción - protegida)
  ↑
  │ (PR al final de cada FASE)
  │
develop (integración - default)
  ↑
  │ (PRs de cada tarea)
  │
feature/[issue-number]-[descripcion] (tareas individuales)
```

### Descripción de Ramas:

- **`main`**: Rama de producción
  - Solo código estable y probado
  - Deploy automático a Vercel
  - Protegida: solo acepta PRs de `develop`
  - Nunca se trabaja directamente aquí

- **`develop`**: Rama de desarrollo
  - Integración de todas las tareas
  - Rama por defecto del repositorio
  - Base para crear ramas `feature/*`
  - Siempre debe estar funcional

- **`feature/[issue-number]-[descripcion]`**: Ramas de tareas
  - Una rama por tarea/issue
  - Se crean desde `develop`
  - Se fusionan de vuelta a `develop` vía PR
  - Se eliminan después del merge

---

## 🔄 Flujo de Trabajo por Fase

### FASE N - Flujo Completo

```
┌──────────────────────────────────────┐
│  1. INICIO DE FASE                   │
│  - Crear issue de FASE               │
│  - Anotar número (#15 ejemplo)       │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│  2. POR CADA TAREA                   │
│  ┌────────────────────────────────┐  │
│  │ a) Crear issue de tarea        │  │
│  │ b) Crear rama feature          │  │
│  │ c) Desarrollar                 │  │
│  │ d) Commit y push               │  │
│  │ e) Crear PR a develop          │  │
│  │ f) Code review                 │  │
│  │ g) Merge PR                    │  │
│  │ h) Cerrar issue                │  │
│  └────────────────────────────────┘  │
│  (Repetir para todas las tareas)     │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│  3. FIN DE FASE                      │
│  - Build y verificación              │
│  - PR develop → main                 │
│  - ⚠️ DETENER DESARROLLO             │
│  - 📢 NOTIFICAR                      │
│  - ⏸️ ESPERAR APROBACIÓN             │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│  4. DESPUÉS DE APROBACIÓN            │
│  - Merge PR                          │
│  - Cerrar issue de FASE              │
│  - Actualizar develop                │
│  - Continuar con siguiente fase      │
└──────────────────────────────────────┘
```

---

## 📝 Comandos Git Detallados

### INICIO DE FASE

#### 1. Crear Issue de Fase en GitHub

```bash
gh issue create \
  --title "FASE [N]: [Nombre de la fase]" \
  --body "## Objetivo
Descripción de lo que se logrará en esta fase.

## Tareas
- [ ] Tarea 1
- [ ] Tarea 2
...

## Criterios de Aceptación
- Todas las tareas completadas
- Build exitoso
- Funcionalidad probada"
```

**Anotar el número de issue** (ejemplo: #15)

---

### POR CADA TAREA

#### 1. Asegurarse de estar en develop actualizado

```bash
# Cambiar a develop
git checkout develop

# Descargar últimos cambios
git pull origin develop

# Verificar estado limpio
git status
```

#### 2. Crear Issue de Tarea

```bash
gh issue create \
  --title "[Descripción concisa de la tarea]" \
  --body "## Objetivo
Qué se va a implementar/modificar.

## Pasos
1. Paso 1
2. Paso 2

## Archivos Afectados
- src/components/...

## Criterios de Aceptación
- [ ] Funcionalidad implementada
- [ ] Sin errores TypeScript
- [ ] Probado localmente

## Related
Parte de #[número-issue-fase]"
```

**Anotar el número de issue** (ejemplo: #23)

#### 3. Crear Rama Feature

```bash
# Crear y cambiar a nueva rama
git checkout -b feature/23-descripcion-corta

# Ejemplo real:
git checkout -b feature/23-create-dashboard-layout

# Verificar rama actual
git branch
```

**Nomenclatura de ramas:**

- Prefijo: `feature/`
- Número de issue: `23`
- Descripción corta: `descripcion-corta`
- Todo en minúsculas con guiones `-`

#### 4. Desarrollar la Tarea

```bash
# Desarrollar normalmente...
# Editar archivos, crear componentes, etc.

# Ver archivos modificados
git status

# Ver diferencias
git diff
```

#### 5. Hacer Commit

```bash
# Agregar archivos al staging
git add .

# O agregar archivos específicos
git add src/components/Dashboard.tsx

# Commit con mensaje descriptivo
git commit -m "feat: create dashboard layout with header and sidebar"

# Ver historial
git log --oneline
```

**Convenciones de Commits** (Conventional Commits):

```
feat: nueva funcionalidad
fix: corrección de bug
docs: cambios en documentación
style: formato de código (sin cambio lógico)
refactor: refactorización
test: agregar o modificar tests
chore: tareas de mantenimiento

Ejemplos:
feat: add transaction form component
fix: correct currency conversion logic
docs: update README with installation steps
refactor: optimize transaction list rendering
```

#### 6. Push de la Rama

```bash
# Primera vez (crear rama en remoto)
git push -u origin feature/23-create-dashboard-layout

# Pushes subsecuentes (si haces más commits)
git push
```

#### 7. Crear Pull Request

**Opción A - GitHub CLI (recomendado):**

```bash
gh pr create \
  --base develop \
  --head feature/23-create-dashboard-layout \
  --title "Create dashboard layout with header and sidebar" \
  --body "## Cambios
- Implementado layout principal con Chakra UI Grid
- Agregado Header component
- Agregado Sidebar component
- Implementado responsive design

## Testing
- ✅ Probado en desktop
- ✅ Probado en mobile
- ✅ Sin errores de TypeScript

## Screenshots
[Agregar capturas si es relevante]

Closes #23
Related to #15"
```

**Opción B - GitHub Web:**

1. Ve a tu repositorio en GitHub
2. Verás banner de "Compare & pull request"
3. Click en el banner
4. Base: `develop` ← Head: `feature/23-...`
5. Completa título y descripción
6. Asigna el PR a ti mismo
7. Agrega labels si quieres (enhancement, bug, etc.)
8. Click "Create pull request"

#### 8. Code Review

**Auto-Review Checklist:**

```markdown
## Funcionalidad

- [ ] El código hace lo que dice que hace
- [ ] La aplicación corre sin errores
- [ ] No hay warnings en consola
- [ ] TypeScript compila sin errores

## Calidad de Código

- [ ] Código legible y bien organizado
- [ ] Nombres de variables/funciones descriptivos
- [ ] No hay código comentado innecesario
- [ ] No hay console.logs de debug
- [ ] Imports ordenados correctamente

## Git

- [ ] Commits con mensajes descriptivos
- [ ] No hay archivos innecesarios
- [ ] El PR está asociado al issue correcto

## Testing

- [ ] Funcionalidad probada en navegador
- [ ] Probado en diferentes tamaños de pantalla
- [ ] No rompe funcionalidad existente
```

**Probar PR localmente (opcional):**

```bash
# Hacer checkout del PR para probarlo
gh pr checkout 45

# Probar la aplicación
pnpm dev

# Volver a develop cuando termines
git checkout develop
```

#### 9. Aprobar y Merge del PR

**Si todo está bien:**

```bash
# Merge con squash (recomendado - mantiene historial limpio)
gh pr merge 45 --squash

# O merge normal
gh pr merge 45 --merge

# Eliminar rama local
git checkout develop
git pull origin develop
git branch -d feature/23-create-dashboard-layout
```

**GitHub automáticamente:**

- Cierra el PR
- Elimina la rama remota (si está configurado)
- Cierra el issue (si pusiste "Closes #23" en el PR)

#### 10. Cerrar Issue (si no se cerró automático)

```bash
gh issue close 23
```

---

### FIN DE FASE

#### 1. Verificar que Todas las Tareas Están Mergeadas

```bash
# Ir a develop y actualizar
git checkout develop
git pull origin develop

# Ver últimos commits
git log --oneline -20

# Verificar que están todos los features de la fase
```

#### 2. Verificar Build

```bash
# Instalar dependencias (si cambiaron)
pnpm install

# Build de producción
pnpm build

# Si build es exitoso, probar
pnpm start
```

Abrir http://localhost:3000 y verificar que todo funciona.

#### 3. Crear PR develop → main

```bash
gh pr create \
  --base main \
  --head develop \
  --title "FASE [N]: [Nombre de la fase]" \
  --body "## Resumen
Descripción general de lo logrado en esta fase.

## Tareas Completadas
- [x] Tarea 1 (#23)
- [x] Tarea 2 (#24)
- [x] Tarea 3 (#25)
...

## Testing
- ✅ Build exitoso
- ✅ Aplicación funcional
- ✅ Sin errores de TypeScript
- ✅ Probado en desarrollo local

## Next Steps
Siguiente fase a desarrollar...

Closes #15"
```

#### 4. ⚠️ DETENER DESARROLLO

**No continúes con la siguiente fase.**

El PR `develop → main` requiere revisión manual.

#### 5. 📢 NOTIFICAR

Informa que la fase está completa:

```
FASE [N] completada y lista para revisión.
PR #[número] creado: develop → main
Esperando aprobación para continuar.
```

#### 6. ⏸️ ESPERAR APROBACIÓN

El usuario revisará:

- El código en GitHub
- La aplicación en preview de Vercel
- Que todas las tareas se completaron

#### 7. Después de Aprobación - Merge

Una vez aprobado:

```bash
# Merge del PR
gh pr merge [número-pr] --merge

# Actualizar develop
git checkout develop
git pull origin develop

# Actualizar main localmente
git checkout main
git pull origin main

# Verificar que están sincronizados
git log --oneline -5

# Volver a develop para siguiente fase
git checkout develop
```

#### 8. Cerrar Issue de Fase

```bash
gh issue close 15
```

---

## 🛠️ Comandos de Referencia Rápida

### Git Básico

```bash
# Ver estado
git status

# Ver ramas
git branch
git branch -a  # Incluye remotas

# Cambiar de rama
git checkout nombre-rama

# Crear y cambiar a nueva rama
git checkout -b nombre-nueva-rama

# Ver diferencias
git diff
git diff archivo.ts

# Ver historial
git log
git log --oneline
git log --oneline --graph --all

# Deshacer cambios (archivo no staged)
git checkout -- archivo.ts

# Deshacer cambios (archivo staged)
git reset HEAD archivo.ts
git checkout -- archivo.ts

# Actualizar desde remoto
git fetch origin
git pull origin develop
```

### GitHub CLI

```bash
# Issues
gh issue list
gh issue view [número]
gh issue create
gh issue close [número]

# Pull Requests
gh pr list
gh pr view [número]
gh pr create
gh pr checkout [número]
gh pr merge [número]
gh pr close [número]

# Repositorio
gh repo view
gh browse  # Abrir repo en navegador
```

### pnpm (contexto Next.js)

```bash
pnpm install              # Instalar dependencias
pnpm dev                  # Dev server
pnpm build                # Build de producción
pnpm start                # Server de producción
pnpm lint                 # Linter
pnpm type-check           # Verificar TypeScript
```

---

## 🔧 Resolución de Problemas Comunes

### Problema 1: Merge Conflicts

Cuando hay conflictos al hacer merge o pull:

```bash
# Ver archivos en conflicto
git status

# Editar los archivos y resolver conflictos manualmente
# Buscar marcadores: <<<<<<, ======, >>>>>>

# Después de resolver
git add archivo-resuelto.ts
git commit -m "resolve merge conflicts"
git push
```

### Problema 2: Olvidaste crear rama desde develop

```bash
# Si ya hiciste commits en develop por error
git checkout -b feature/nueva-rama

# Regresar develop al estado remoto
git checkout develop
git reset --hard origin/develop

# Ahora tus commits están en feature/nueva-rama
git checkout feature/nueva-rama
```

### Problema 3: Necesitas actualizar tu rama con cambios de develop

```bash
# Estando en tu rama feature
git fetch origin

# Opción A: Merge (crea commit de merge)
git merge origin/develop

# Opción B: Rebase (historial más limpio)
git rebase origin/develop

# Si hay conflictos, resuélvelos y:
git add .
git rebase --continue

# Push (forzado si usaste rebase)
git push --force-with-lease
```

### Problema 4: Commit con mensaje incorrecto

```bash
# Último commit (antes de push)
git commit --amend -m "mensaje correcto"

# Si ya hiciste push
git commit --amend -m "mensaje correcto"
git push --force-with-lease
```

### Problema 5: Olvidaste agregar archivos al último commit

```bash
# Agregar archivos
git add archivo-olvidado.ts

# Agregar al último commit
git commit --amend --no-edit

# Push
git push --force-with-lease
```

### Problema 6: Quieres deshacer el último commit (local)

```bash
# Mantener cambios en working directory
git reset --soft HEAD~1

# Descartar cambios completamente
git reset --hard HEAD~1
```

---

## 📊 Ejemplo Completo de Flujo

### Caso: FASE 5, Tarea 5.3 - Configurar Tema de Chakra UI

```bash
# 1. Estar en develop actualizado
git checkout develop
git pull origin develop

# 2. Crear issue de tarea
gh issue create \
  --title "Configurar tema personalizado de Chakra UI" \
  --body "..."
# Resultado: Issue #34 creado

# 3. Crear rama
git checkout -b feature/34-chakra-ui-theme

# 4. Desarrollar
# ... crear src/theme/index.ts
# ... modificar src/app/providers.tsx

# 5. Commit
git add .
git commit -m "feat: configure custom Chakra UI theme with colors and fonts"

# 6. Push
git push -u origin feature/34-chakra-ui-theme

# 7. Crear PR
gh pr create \
  --base develop \
  --title "Configure custom Chakra UI theme" \
  --body "Closes #34"

# 8. Auto-review
# ... verificar en navegador
# ... verificar TypeScript

# 9. Merge
gh pr merge 45 --squash

# 10. Cleanup
git checkout develop
git pull origin develop
git branch -d feature/34-chakra-ui-theme

# Resultado: Tarea completada ✅
```

---

## 🎯 Best Practices

### ✅ HACER:

- ✅ Commits frecuentes con mensajes descriptivos
- ✅ Una rama por tarea (no mezclar tareas)
- ✅ PRs pequeños y enfocados
- ✅ Probar antes de push
- ✅ Revisar tu propio código antes de crear PR
- ✅ Mantener develop siempre funcional
- ✅ Actualizar develop antes de crear nueva rama
- ✅ Cerrar issues al completar tareas

### ❌ NO HACER:

- ❌ Trabajar directamente en develop o main
- ❌ PRs gigantes con múltiples funcionalidades
- ❌ Commits con mensajes vagos ("fix", "update", "wip")
- ❌ Push de código que no compila
- ❌ Dejar console.logs en el código
- ❌ Mezclar múltiples tareas en un PR
- ❌ Hacer force push a develop o main

---

## 📝 Template de Mensaje de Commit

```
<tipo>: <descripción corta>

[Opcional] Descripción larga explicando el por qué
y cualquier contexto relevante.

[Opcional] Refs: #issue-number
```

**Tipos:**

- `feat`: Nueva funcionalidad
- `fix`: Corrección de bug
- `docs`: Documentación
- `style`: Formato (sin cambio de código)
- `refactor`: Refactorización
- `test`: Tests
- `chore`: Mantenimiento

**Ejemplos:**

```
feat: add currency conversion selector

Implements dropdown to select between COP, USD, BOB.
Conversion rates are fetched from exchange_rates table.

Refs: #45
```

```
fix: correct transaction list pagination

Fixed off-by-one error causing last page to show incorrect items.

Closes #52
```

---

## 🔐 Seguridad

### .gitignore Esencial

Asegúrate de que `.gitignore` incluye:

```gitignore
# Dependencies
node_modules/

# Build output
.next/
out/
dist/
build/

# Environment variables
.env
.env.local
.env.*.local
.env.production

# Credentials
CREDENTIALS.md
secrets.json

# OS
.DS_Store
Thumbs.db

# Editor
.vscode/
.idea/
*.swp
*.swo

# Testing
coverage/

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# Misc
*.pem
```

### ⚠️ NUNCA commitear:

- ❌ Archivos `.env` con credenciales reales
- ❌ API keys
- ❌ Passwords
- ❌ Tokens de autenticación
- ❌ Archivos de credenciales

---

## 📞 Ayuda Adicional

### Recursos:

- **Git Docs**: https://git-scm.com/doc
- **GitHub CLI Docs**: https://cli.github.com/manual/
- **GitHub Flow**: https://guides.github.com/introduction/flow/
- **Conventional Commits**: https://www.conventionalcommits.org/

### Comandos de Ayuda:

```bash
git help
gh help
git <comando> --help
gh <comando> --help
```

---

**¡Éxito con el flujo de trabajo! 🚀**

Recuerda: Un flujo de trabajo limpio y organizado hace el desarrollo más fácil y el código más mantenible.
