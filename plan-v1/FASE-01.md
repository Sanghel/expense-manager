# FASE 01: Configuración Inicial del Proyecto

## 🎯 Objetivo de la Fase

Crear la estructura base del proyecto Next.js con TypeScript, configurar Git/GitHub, instalar dependencias iniciales y establecer la estructura de carpetas.

**Resultado esperado:** Proyecto Next.js funcional, repositorio configurado, README básico, y estructura de carpetas lista para desarrollo.

---

## ⚠️ Pre-requisitos

Antes de comenzar esta fase, debes haber completado:

- ✅ Todo el archivo **00-SETUP-MANUAL.md**
- ✅ Leído el archivo **01-FLUJO-GIT-GITHUB.md**

---

## 📋 Inicio de Fase

### Crear Issue de Fase en GitHub

```bash
gh issue create \
  --title "FASE 01: Configuración Inicial del Proyecto" \
  --body "## Objetivo
Configurar proyecto Next.js base con TypeScript, Git/GitHub, y estructura de carpetas.

## Tareas
- [ ] Tarea 1.1: Crear directorio del proyecto
- [ ] Tarea 1.2: Inicializar proyecto Next.js
- [ ] Tarea 1.3: Configurar TypeScript
- [ ] Tarea 1.4: Limpiar archivos de ejemplo
- [ ] Tarea 1.5: Instalar dependencias base
- [ ] Tarea 1.6: Configurar ESLint y Prettier
- [ ] Tarea 1.7: Crear estructura de carpetas
- [ ] Tarea 1.8: Inicializar Git localmente
- [ ] Tarea 1.9: Crear repositorio GitHub y conectar
- [ ] Tarea 1.10: Crear rama develop y configurar como default
- [ ] Tarea 1.11: Crear README básico

## Criterios de Aceptación
- Proyecto Next.js funcionando en http://localhost:3000
- Repositorio GitHub configurado con main y develop
- Estructura de carpetas creada
- README básico presente"
```

**📝 Anotar el número de issue** (ejemplo: #1)

---

## 📝 Tareas de la Fase

### Tarea 1.1: Crear directorio del proyecto

**No requiere issue/PR - Paso directo**

```bash
# Navegar a donde quieres el proyecto
cd ~/proyectos  # o la ubicación que prefieras

# Crear directorio
mkdir expense-manager

# Entrar al directorio
cd expense-manager

# Verificar ubicación
pwd
```

**Verificación:**

- [ ] Directorio creado
- [ ] Estás dentro del directorio

---

### Tarea 1.2: Inicializar proyecto Next.js

**No requiere issue/PR - Paso directo**

```bash
# Crear proyecto Next.js con pnpm
pnpm create next-app@latest . --typescript --tailwind --app --no-src

# Responder las preguntas:
# ✔ Would you like to use TypeScript? … Yes
# ✔ Would you like to use ESLint? … Yes
# ✔ Would you like to use Tailwind CSS? … Yes (lo usaremos junto con Chakra)
# ✔ Would you like to use `src/` directory? … No
# ✔ Would you like to use App Router? … Yes (recomendado)
# ✔ Would you like to customize the default import alias (@/*)? … No
```

**Verificación:**

```bash
# Verificar que se crearon archivos
ls -la

# Deberías ver:
# - package.json
# - tsconfig.json
# - next.config.js
# - app/
# - public/
```

**Probar que funciona:**

```bash
pnpm dev
```

Abrir http://localhost:3000 - Deberías ver la página de bienvenida de Next.js.

**Detener el servidor:** Ctrl + C

**Verificación:**

- [ ] Proyecto creado
- [ ] Servidor de desarrollo funciona
- [ ] Se ve la página de Next.js

---

### Tarea 1.3: Configurar TypeScript

**Issue:** "Configurar TypeScript con reglas estrictas"

```bash
git checkout -b feature/2-typescript-config
```

**Desarrollo:**

Editar `tsconfig.json` para hacerlo más estricto:

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    },
    "forceConsistentCasingInFileNames": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

**Verificar:**

```bash
pnpm build
# Debería compilar sin errores
```

**Commit y PR:**

```bash
git add tsconfig.json
git commit -m "feat: configure TypeScript with strict rules"
git push -u origin feature/2-typescript-config

gh pr create \
  --base develop \
  --title "Configure TypeScript with strict rules" \
  --body "Closes #2"
```

**Merge y cleanup:**

```bash
gh pr merge --squash
git checkout develop
git pull origin develop
git branch -d feature/2-typescript-config
```

---

### Tarea 1.4: Limpiar archivos de ejemplo

**Issue:** "Limpiar archivos de ejemplo de Next.js"

```bash
git checkout develop
git pull origin develop
git checkout -b feature/3-clean-template
```

**Desarrollo:**

1. Limpiar `app/page.tsx`:

```tsx
export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <h1 className="text-4xl font-bold">Expense Manager</h1>
      <p className="mt-4 text-gray-600">
        Sistema de gestión de finanzas personales
      </p>
    </main>
  )
}
```

2. Limpiar `app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

3. Eliminar archivos innecesarios:

```bash
# Si existen, eliminar:
rm -f app/favicon.ico  # Usaremos uno custom después
```

**Verificar:**

```bash
pnpm dev
# Abrir localhost:3000
# Debe verse la página limpia
```

**Commit y PR:**

```bash
git add .
git commit -m "chore: clean Next.js template files"
git push -u origin feature/3-clean-template

gh pr create \
  --base develop \
  --title "Clean Next.js template files" \
  --body "Closes #3"

gh pr merge --squash
git checkout develop
git pull origin develop
git branch -d feature/3-clean-template
```

---

### Tarea 1.5: Instalar dependencias base

**Issue:** "Instalar dependencias base del proyecto"

```bash
git checkout develop
git pull origin develop
git checkout -b feature/4-install-dependencies
```

**Desarrollo:**

```bash
# Chakra UI
pnpm add @chakra-ui/react @chakra-ui/next-js @emotion/react @emotion/styled framer-motion

# NextAuth.js
pnpm add next-auth

# Validación
pnpm add zod

# Manejo de fechas
pnpm add date-fns

# Gráficos
pnpm add recharts

# HTTP client para Server Actions (ya incluido en Next.js)
# Icons (opcional, Chakra tiene sus propios icons)
pnpm add react-icons

# InsForge SDK
pnpm add @supabase/supabase-js  # InsForge usa SDK compatible con Supabase

# Dependencias de desarrollo
pnpm add -D @types/node
```

**Verificar instalación:**

```bash
pnpm build
# Debe compilar sin errores
```

**Commit y PR:**

```bash
git add package.json pnpm-lock.yaml
git commit -m "feat: install base project dependencies"
git push -u origin feature/4-install-dependencies

gh pr create \
  --base develop \
  --title "Install base project dependencies" \
  --body "Installed:
- Chakra UI and dependencies
- NextAuth.js
- Zod for validation
- date-fns
- recharts
- react-icons
- @supabase/supabase-js (InsForge SDK)

Closes #4"

gh pr merge --squash
git checkout develop
git pull origin develop
git branch -d feature/4-install-dependencies
```

---

### Tarea 1.6: Configurar ESLint y Prettier

**Issue:** "Configurar ESLint y Prettier"

```bash
git checkout develop
git pull origin develop
git checkout -b feature/5-eslint-prettier
```

**Desarrollo:**

1. Instalar Prettier:

```bash
pnpm add -D prettier eslint-config-prettier
```

2. Crear `.prettierrc`:

```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 80,
  "arrowParens": "always"
}
```

3. Crear `.prettierignore`:

```
node_modules
.next
out
dist
build
.vercel
pnpm-lock.yaml
```

4. Actualizar `.eslintrc.json`:

```json
{
  "extends": ["next/core-web-vitals", "prettier"],
  "rules": {
    "@typescript-eslint/no-unused-vars": "warn",
    "@typescript-eslint/no-explicit-any": "warn"
  }
}
```

5. Agregar scripts a `package.json`:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "type-check": "tsc --noEmit"
  }
}
```

**Probar:**

```bash
pnpm format
pnpm lint
pnpm type-check
```

**Commit y PR:**

```bash
git add .
git commit -m "feat: configure ESLint and Prettier"
git push -u origin feature/5-eslint-prettier

gh pr create \
  --base develop \
  --title "Configure ESLint and Prettier" \
  --body "Closes #5"

gh pr merge --squash
git checkout develop
git pull origin develop
git branch -d feature/5-eslint-prettier
```

---

### Tarea 1.7: Crear estructura de carpetas

**Issue:** "Crear estructura de carpetas del proyecto"

```bash
git checkout develop
git pull origin develop
git checkout -b feature/6-folder-structure
```

**Desarrollo:**

```bash
# Crear estructura de carpetas
mkdir -p app/api/auth/[...nextauth]
mkdir -p app/(dashboard)
mkdir -p components/ui
mkdir -p components/dashboard
mkdir -p components/transactions
mkdir -p components/categories
mkdir -p components/chat
mkdir -p lib/actions
mkdir -p lib/utils
mkdir -p lib/validations
mkdir -p types
mkdir -p config
mkdir -p hooks
mkdir -p constants
mkdir -p theme
```

**Crear archivo .gitkeep en carpetas vacías:**

```bash
touch app/api/auth/[...nextauth]/.gitkeep
touch components/ui/.gitkeep
touch components/dashboard/.gitkeep
touch components/transactions/.gitkeep
touch components/categories/.gitkeep
touch components/chat/.gitkeep
touch lib/actions/.gitkeep
touch lib/utils/.gitkeep
touch lib/validations/.gitkeep
touch types/.gitkeep
touch config/.gitkeep
touch hooks/.gitkeep
touch constants/.gitkeep
touch theme/.gitkeep
```

**Verificar estructura:**

```bash
tree -L 2 -a
```

**Commit y PR:**

```bash
git add .
git commit -m "feat: create project folder structure"
git push -u origin feature/6-folder-structure

gh pr create \
  --base develop \
  --title "Create project folder structure" \
  --body "Created organized folder structure:
- app/ - Next.js App Router pages
- components/ - React components by feature
- lib/ - Server actions and utilities
- types/ - TypeScript type definitions
- config/ - Configuration files
- hooks/ - Custom React hooks
- constants/ - App constants
- theme/ - Chakra UI theme

Closes #6"

gh pr merge --squash
git checkout develop
git pull origin develop
git branch -d feature/6-folder-structure
```

---

### Tarea 1.8: Inicializar Git localmente

**No requiere issue/PR - Paso directo**

**create-next-app ya inicializa Git automáticamente, pero verificamos:**

```bash
# Verificar que existe .git
ls -la | grep .git

# Si NO existe .git (poco probable):
git init

# Verificar .gitignore (debería existir)
cat .gitignore
```

**Asegurar que `.gitignore` tiene todo lo necesario:**

```gitignore
# Dependencies
node_modules
.pnp
.pnp.js

# Testing
coverage

# Next.js
.next/
out/
build
dist
.vercel

# Production
build

# Misc
.DS_Store
*.pem
.env
.env.local
.env.*.local
.env.production

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# IDE
.vscode/
.idea/
*.swp
*.swo

# Credentials
CREDENTIALS.md
secrets.json

# Temp files
*.log
.DS_Store
```

**Si falta algo, agregarlo al .gitignore:**

```bash
# Editar .gitignore si es necesario
nano .gitignore
# o
code .gitignore
```

---

### Tarea 1.9: Crear repositorio en GitHub y conectar

**No requiere issue/PR - Paso directo**

**Opción A - Crear repositorio Y conectarlo en un solo comando (RECOMENDADO):**

```bash
# Este comando:
# 1. Crea el repo en GitHub
# 2. Conecta el remote origin
# 3. Hace el push inicial
gh repo create expense-manager \
  --public \
  --description "Sistema de gestión de finanzas personales con Next.js e InsForge" \
  --source=. \
  --remote=origin \
  --push
```

**Opción B - Paso por paso (si prefieres más control):**

```bash
# 1. Crear repositorio en GitHub
gh repo create expense-manager \
  --public \
  --description "Sistema de gestión de finanzas personales con Next.js e InsForge"

# 2. Agregar remote manualmente
git remote add origin https://github.com/[tu-usuario]/expense-manager.git

# 3. Verificar remote
git remote -v

# 4. Renombrar rama actual a main (si no lo está)
git branch -M main

# 5. Push inicial
git push -u origin main
```

**Verificar que todo está en GitHub:**

```bash
# Abrir repositorio en navegador
gh browse

# Ver estado de Git
git status
git log --oneline
```

**Deberías ver:**

- Repositorio creado en GitHub
- Código inicial pusheado
- Rama `main` con commits

---

### Tarea 1.10: Crear rama develop y configurar como default

**No requiere issue/PR - Paso directo**

**1. Crear rama develop desde main:**

```bash
# Asegurarse de estar en main actualizado
git checkout main
git pull origin main

# Crear rama develop
git checkout -b develop

# Push de develop al remoto
git push -u origin develop
```

**2. Configurar develop como rama por defecto en GitHub:**

```bash
# Abrir configuración del repositorio
gh browse

# Manualmente en GitHub:
# 1. Ir a Settings del repositorio
# 2. En el menú lateral, click "Branches"
# 3. En "Default branch", click el botón de cambiar
# 4. Seleccionar "develop"
# 5. Click "Update"
# 6. Confirmar el cambio
```

**O usando GitHub CLI (más rápido):**

```bash
# Cambiar default branch a develop
gh repo edit --default-branch develop

# Verificar
gh repo view --json defaultBranchRef --jq .defaultBranchRef.name
# Debería mostrar: develop
```

**Verificar estructura de ramas:**

```bash
# Ver todas las ramas
git branch -a

# Deberías ver:
# * develop
#   main
#   remotes/origin/develop
#   remotes/origin/main
```

---

### Tarea 1.11: Crear README básico

**Issue:** "Crear README básico del proyecto"

```bash
# Asegurarse de estar en develop
git checkout develop
git pull origin develop

# Crear rama para el README
git checkout -b feature/7-create-readme
```

**Crear README.md:**

````markdown
# Expense Manager

Sistema de gestión de finanzas personales con IA integrada.

## 🚀 Características

- 💳 Registro de gastos e ingresos
- 🤖 Categorización automática con IA
- 💱 Conversión de monedas (BOB, COP, USD)
- 📊 Visualización de datos con gráficos
- 💬 Chat para registro conversacional
- 📱 Diseño responsive

## 🛠️ Stack Tecnológico

### Frontend

- **Framework**: Next.js 14+ (App Router)
- **Lenguaje**: TypeScript
- **UI**: Chakra UI
- **Autenticación**: NextAuth.js
- **Gráficos**: Recharts
- **Validación**: Zod

### Backend

- **Platform**: InsForge
- **Database**: PostgreSQL
- **Auth**: JWT
- **Storage**: S3-compatible
- **Functions**: Edge Functions

### IA

- **Provider**: Anthropic Claude
- **Modelo**: Claude Sonnet 4.5

## 📋 Prerequisitos

- Node.js 18.17 o superior
- pnpm 8.x o superior
- Cuenta de InsForge
- Cuenta de Google Cloud (OAuth)
- API Key de Anthropic

## 🔧 Instalación

```bash
# Clonar repositorio
git clone https://github.com/[tu-usuario]/expense-manager.git
cd expense-manager

# Instalar dependencias
pnpm install

# Configurar variables de entorno
cp .env.local.example .env.local
# Editar .env.local con tus credenciales

# Ejecutar en desarrollo
pnpm dev
```
````

Abrir [http://localhost:3000](http://localhost:3000)

## 📝 Variables de Entorno

Ver `.env.local.example` para la lista completa de variables requeridas.

## 🚀 Deploy

El proyecto está configurado para deploy automático en Vercel.

Ver [GUÍA DE DEPLOY](./docs/02-GUIA-DEPLOY.md) para instrucciones detalladas.

## 📖 Documentación

- [Plan de Trabajo](./docs/README-PLAN.md)
- [Setup Manual](./docs/00-SETUP-MANUAL.md)
- [Flujo Git/GitHub](./docs/01-FLUJO-GIT-GITHUB.md)
- [Guía de Deploy](./docs/02-GUIA-DEPLOY.md)

## 🤝 Contribuir

Este es un proyecto personal, pero las sugerencias son bienvenidas.

## 📄 Licencia

MIT

## 👤 Autor

[Tu Nombre]

---

**Nota**: Proyecto en desarrollo activo.

````

**Crear archivo de ejemplo de variables:**

`.env.local.example`:

```env
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# InsForge
NEXT_PUBLIC_INSFORGE_URL=
INSFORGE_API_KEY=

# Claude API
ANTHROPIC_API_KEY=
````

**Commit y push:**

```bash
git add README.md .env.local.example
git commit -m "docs: create README and env example"
git push -u origin feature/7-create-readme
```

**Crear PR feature → develop:**

```bash
gh pr create \
  --base develop \
  --head feature/7-create-readme \
  --title "Add README and environment example" \
  --body "Initial documentation setup.

Closes #7"
```

**Merge PR:**

```bash
gh pr merge --squash
git checkout develop
git pull origin develop
git branch -d feature/7-create-readme
```

---

## 🎯 Fin de Fase 1

### Verificación Final

Antes de crear el PR final, verificar:

```bash
# Estar en develop actualizado
git checkout develop
git pull origin develop

# Build exitoso
pnpm build

# Linter sin errores
pnpm lint

# Type check sin errores
pnpm type-check

# Dev server funciona
pnpm dev
# Abrir localhost:3000
```

**Checklist:**

- [ ] ✅ Proyecto Next.js creado
- [ ] ✅ TypeScript configurado
- [ ] ✅ Dependencias instaladas
- [ ] ✅ ESLint y Prettier configurados
- [ ] ✅ Estructura de carpetas creada
- [ ] ✅ Git inicializado
- [ ] ✅ Repositorio GitHub creado y conectado
- [ ] ✅ Push inicial a main exitoso
- [ ] ✅ Rama develop creada y pusheada
- [ ] ✅ Develop configurado como default branch
- [ ] ✅ README.md creado
- [ ] ✅ .env.local.example creado
- [ ] ✅ Build exitoso
- [ ] ✅ Linter sin errores

---

### Crear PR Final de Fase

```bash
gh pr create \
  --base main \
  --head develop \
  --title "FASE 01: Configuración Inicial del Proyecto" \
  --body "## Resumen
Configuración completa del proyecto Next.js con TypeScript, estructura de carpetas, y repositorio GitHub.

## Tareas Completadas
- [x] Tarea 1.1: Crear directorio del proyecto
- [x] Tarea 1.2: Inicializar proyecto Next.js
- [x] Tarea 1.3: Configurar TypeScript (#2)
- [x] Tarea 1.4: Limpiar archivos de ejemplo (#3)
- [x] Tarea 1.5: Instalar dependencias base (#4)
- [x] Tarea 1.6: Configurar ESLint y Prettier (#5)
- [x] Tarea 1.7: Crear estructura de carpetas (#6)
- [x] Tarea 1.8: Inicializar Git localmente
- [x] Tarea 1.9: Crear repositorio GitHub y conectar
- [x] Tarea 1.10: Crear rama develop y configurar como default
- [x] Tarea 1.11: Crear README básico (#7)

## Verificación
- ✅ Build exitoso
- ✅ Linter sin errores
- ✅ Type check sin errores
- ✅ Dev server funciona

Closes #1"
```

---

### ⚠️ CHECKPOINT - Requiere Aprobación Manual

**🛑 DETENER DESARROLLO**

**📢 NOTIFICAR:**

```
FASE 01 completada y lista para revisión.
PR #[número] creado: develop → main
Proyecto Next.js configurado y funcionando.
Esperando aprobación para continuar con FASE 02.
```

**⏸️ ESPERAR APROBACIÓN**

---

### Después de Aprobación

```bash
# Merge del PR
gh pr merge [número] --merge

# Actualizar develop
git checkout develop
git pull origin develop

# Cerrar issue de fase
gh issue close 1

# ✅ Listo para FASE 02
```

---

## 📚 Recursos

- Next.js Docs: https://nextjs.org/docs
- TypeScript Docs: https://www.typescriptlang.org/docs
- Chakra UI Docs: https://chakra-ui.com
- pnpm Docs: https://pnpm.io

---

**¡FASE 01 COMPLETADA! 🎉**

Continuar con: **FASE-02.md**
