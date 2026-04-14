# FASE 03: Base de Datos (Esquema en InsForge)

## 🎯 Objetivo

Diseñar y crear el esquema completo de la base de datos en InsForge: tablas, relaciones, RLS policies, y seed de datos iniciales.

**Resultado:** Base de datos completa con tablas de users, whitelist, transactions, categories, budgets, y exchange_rates.

---

## ⚠️ Pre-requisitos

- ✅ FASE 02 completada
- ✅ MCP de InsForge configurado con Claude Code
- ✅ Acceso al dashboard de InsForge

---

## 📋 Inicio de Fase

```bash
git checkout develop && git pull
gh issue create --title "FASE 03: Base de Datos (Esquema en InsForge)"
```

📝 Anotar issue #18

---

## 📝 Tareas

### Tarea 3.1: Diseñar esquema completo

**Issue:** "Diseñar esquema de base de datos"

```bash
git checkout -b feature/19-database-schema
```

Crear `docs/DATABASE_SCHEMA.md`:

```markdown
# Esquema de Base de Datos

## Tablas

### whitelist

- id (uuid, PK)
- email (text, unique, not null)
- created_at (timestamptz)

### users

- id (uuid, PK)
- email (text, unique, not null)
- name (text)
- avatar_url (text)
- preferred_currency (text) DEFAULT 'COP'
- created_at (timestamptz)
- updated_at (timestamptz)

### categories

- id (uuid, PK)
- user_id (uuid, FK, nullable) -- null = predefined
- name (text, not null)
- type (text, not null) -- 'income' | 'expense'
- icon (text)
- color (text)
- created_at (timestamptz)

### transactions

- id (uuid, PK)
- user_id (uuid, FK, not null)
- amount (numeric, not null)
- currency (text, not null)
- type (text, not null) -- 'income' | 'expense'
- category_id (uuid, FK, not null)
- description (text, not null)
- date (date, not null)
- source (text) DEFAULT 'manual' -- 'manual' | 'conversational'
- notes (text)
- created_at (timestamptz)
- updated_at (timestamptz)

### budgets

- id (uuid, PK)
- user_id (uuid, FK, not null)
- category_id (uuid, FK, not null)
- amount (numeric, not null)
- currency (text, not null)
- period (text, not null) -- 'monthly' | 'yearly'
- start_date (date, not null)
- created_at (timestamptz)

### exchange_rates

- id (uuid, PK)
- from_currency (text, not null)
- to_currency (text, not null)
- rate (numeric, not null)
- date (date, not null)
- created_at (timestamptz)
```

Commit:

```bash
git add . && git commit -m "docs: create database schema documentation"
git push -u origin feature/19-database-schema
gh pr create --base develop --title "Create database schema documentation" --body "Closes #19"
gh pr merge --squash && git checkout develop && git pull && git branch -d feature/19-database-schema
```

---

### Tarea 3.2: Crear tablas usando MCP

**Issue:** "Crear tablas en InsForge usando MCP"

En Claude Code, ejecuta:

```
I'm using InsForge as my backend platform. Create the following tables in my database:

1. whitelist table:
   - id: uuid primary key default uuid_generate_v4()
   - email: text unique not null
   - created_at: timestamptz default now()

2. users table:
   - id: uuid primary key default uuid_generate_v4()
   - email: text unique not null
   - name: text
   - avatar_url: text
   - preferred_currency: text default 'COP'
   - created_at: timestamptz default now()
   - updated_at: timestamptz default now()

3. categories table:
   - id: uuid primary key default uuid_generate_v4()
   - user_id: uuid references users(id) on delete cascade (nullable)
   - name: text not null
   - type: text not null check (type in ('income', 'expense'))
   - icon: text
   - color: text
   - created_at: timestamptz default now()

4. transactions table:
   - id: uuid primary key default uuid_generate_v4()
   - user_id: uuid references users(id) on delete cascade not null
   - amount: numeric not null
   - currency: text not null
   - type: text not null check (type in ('income', 'expense'))
   - category_id: uuid references categories(id) not null
   - description: text not null
   - date: date not null
   - source: text default 'manual'
   - notes: text
   - created_at: timestamptz default now()
   - updated_at: timestamptz default now()

5. budgets table:
   - id: uuid primary key default uuid_generate_v4()
   - user_id: uuid references users(id) on delete cascade not null
   - category_id: uuid references categories(id) not null
   - amount: numeric not null
   - currency: text not null
   - period: text not null check (period in ('monthly', 'yearly'))
   - start_date: date not null
   - created_at: timestamptz default now()

6. exchange_rates table:
   - id: uuid primary key default uuid_generate_v4()
   - from_currency: text not null
   - to_currency: text not null
   - rate: numeric not null
   - date: date not null
   - created_at: timestamptz default now()
   - unique constraint on (from_currency, to_currency, date)
```

**Verificar en InsForge Dashboard:**

- Ir a https://insforge.dev/dashboard
- Ver tablas creadas

**Crear commit:**

```bash
git checkout -b feature/20-create-tables
# (no hay cambios de código, solo DB)
git commit --allow-empty -m "feat: create database tables in InsForge"
git push -u origin feature/20-create-tables
gh pr create --base develop --title "Create database tables in InsForge" --body "Closes #20"
gh pr merge --squash && git checkout develop && git pull && git branch -d feature/20-create-tables
```

---

### Tarea 3.3: Configurar RLS Policies

**Issue:** "Configurar Row Level Security policies"

En Claude Code:

```
Enable RLS and create policies for the tables in my InsForge database:

For users table:
- Enable RLS
- Policy "Users can view their own data": SELECT for authenticated users where id = auth.uid()
- Policy "Users can update their own data": UPDATE for authenticated users where id = auth.uid()

For transactions table:
- Enable RLS
- Policy "Users can view their own transactions": SELECT where user_id = auth.uid()
- Policy "Users can insert their own transactions": INSERT where user_id = auth.uid()
- Policy "Users can update their own transactions": UPDATE where user_id = auth.uid()
- Policy "Users can delete their own transactions": DELETE where user_id = auth.uid()

For categories table:
- Enable RLS
- Policy "Users can view all categories": SELECT for all (both predefined and user-created)
- Policy "Users can insert their own categories": INSERT where user_id = auth.uid()
- Policy "Users can update their own categories": UPDATE where user_id = auth.uid()
- Policy "Users can delete their own categories": DELETE where user_id = auth.uid()

For budgets table:
- Enable RLS
- Policy "Users can view their own budgets": SELECT where user_id = auth.uid()
- Policy "Users can manage their own budgets": ALL where user_id = auth.uid()

For exchange_rates table:
- Enable RLS
- Policy "Everyone can read exchange rates": SELECT for all
- Policy "Service role can manage rates": ALL for service_role
```

Commit:

```bash
git checkout -b feature/21-rls-policies
git commit --allow-empty -m "feat: configure RLS policies for all tables"
git push -u origin feature/21-rls-policies
gh pr create --base develop --title "Configure RLS policies" --body "Closes #21"
gh pr merge --squash && git checkout develop && git pull && git branch -d feature/21-rls-policies
```

---

### Tarea 3.4: Seed de whitelist

**Issue:** "Agregar emails a whitelist"

En Claude Code:

```
Insert the following emails into the whitelist table in my InsForge database:

- tu-email@gmail.com
- otro-email@example.com

(Reemplaza con tus emails reales del 00-SETUP-MANUAL.md)
```

Commit:

```bash
git checkout -b feature/22-seed-whitelist
git commit --allow-empty -m "feat: seed whitelist with authorized emails"
git push -u origin feature/22-seed-whitelist
gh pr create --base develop --title "Seed whitelist with authorized emails" --body "Closes #22"
gh pr merge --squash && git checkout develop && git pull && git branch -d feature/22-seed-whitelist
```

---

### Tarea 3.5: Seed de categorías predefinidas

**Issue:** "Crear categorías predefinidas"

En Claude Code:

```
Insert predefined categories into the categories table (user_id should be NULL for predefined categories):

EXPENSE categories:
- Alimentación (icon: 🍽️, color: #FF6B6B)
- Transporte (icon: 🚗, color: #4ECDC4)
- Vivienda (icon: 🏠, color: #45B7D1)
- Servicios (icon: 💡, color: #FFA07A)
- Salud (icon: ⚕️, color: #98D8C8)
- Educación (icon: 📚, color: #F7DC6F)
- Entretenimiento (icon: 🎬, color: #BB8FCE)
- Ropa (icon: 👕, color: #F8B195)
- Otros Gastos (icon: 💳, color: #95A5A6)

INCOME categories:
- Salario (icon: 💰, color: #2ECC71)
- Freelance (icon: 💼, color: #3498DB)
- Inversiones (icon: 📈, color: #9B59B6)
- Otros Ingresos (icon: ✨, color: #1ABC9C)
```

Commit:

```bash
git checkout -b feature/23-seed-categories
git commit --allow-empty -m "feat: seed predefined categories"
git push -u origin feature/23-seed-categories
gh pr create --base develop --title "Seed predefined categories" --body "Closes #23"
gh pr merge --squash && git checkout develop && git pull && git branch -d feature/23-seed-categories
```

---

### Tarea 3.6: Actualizar verificación de whitelist en NextAuth

**Issue:** "Implementar verificación real de whitelist"

```bash
git checkout -b feature/24-whitelist-verification
```

Actualizar `lib/auth.ts`:

```typescript
callbacks: {
  async signIn({ user }) {
    if (!user.email) {
      return false
    }

    try {
      // Verificar whitelist
      const { data, error } = await insforge
        .from('whitelist')
        .select('email')
        .eq('email', user.email)
        .single()

      if (error || !data) {
        console.log('❌ Email not in whitelist:', user.email)
        return false
      }

      // Crear o actualizar usuario en tabla users
      const { error: upsertError } = await insforge
        .from('users')
        .upsert(
          {
            email: user.email,
            name: user.name,
            avatar_url: user.image,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'email',
          }
        )

      if (upsertError) {
        console.error('Error upserting user:', upsertError)
        return false
      }

      console.log('✅ User authorized:', user.email)
      return true
    } catch (error) {
      console.error('SignIn error:', error)
      return false
    }
  },
  // ... resto igual
}
```

Commit y PR:

```bash
git add . && git commit -m "feat: implement real whitelist verification"
git push -u origin feature/24-whitelist-verification
gh pr create --base develop --title "Implement real whitelist verification" --body "Closes #24"
gh pr merge --squash && git checkout develop && git pull && git branch -d feature/24-whitelist-verification
```

---

### Tarea 3.7: Crear tipos TypeScript del schema

**Issue:** "Crear tipos TypeScript para tablas de BD"

```bash
git checkout -b feature/25-database-types
```

Crear `types/database.types.ts`:

```typescript
export type Currency = 'COP' | 'USD' | 'BOB'
export type TransactionType = 'income' | 'expense'
export type BudgetPeriod = 'monthly' | 'yearly'
export type TransactionSource = 'manual' | 'conversational'

export interface Whitelist {
  id: string
  email: string
  created_at: string
}

export interface User {
  id: string
  email: string
  name: string | null
  avatar_url: string | null
  preferred_currency: Currency
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  user_id: string | null // null = predefined
  name: string
  type: TransactionType
  icon: string | null
  color: string | null
  created_at: string
}

export interface Transaction {
  id: string
  user_id: string
  amount: number
  currency: Currency
  type: TransactionType
  category_id: string
  description: string
  date: string // ISO date
  source: TransactionSource
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Budget {
  id: string
  user_id: string
  category_id: string
  amount: number
  currency: Currency
  period: BudgetPeriod
  start_date: string // ISO date
  created_at: string
}

export interface ExchangeRate {
  id: string
  from_currency: Currency
  to_currency: Currency
  rate: number
  date: string // ISO date
  created_at: string
}

// With relations
export interface TransactionWithCategory extends Transaction {
  category: Category
}

export interface BudgetWithCategory extends Budget {
  category: Category
}
```

Commit y PR:

```bash
git add . && git commit -m "feat: create TypeScript types for database schema"
git push -u origin feature/25-database-types
gh pr create --base develop --title "Create TypeScript types for database schema" --body "Closes #25"
gh pr merge --squash && git checkout develop && git pull && git branch -d feature/25-database-types
```

---

### Tarea 3.8: Testing de schema

**Issue:** "Verificar schema completo de base de datos"

Crear `scripts/test-database.ts`:

```typescript
import { insforge } from '../lib/insforge'

async function testDatabase() {
  console.log('🔍 Testing database schema...\n')

  // Test whitelist
  const { data: whitelist, error: wError } = await insforge
    .from('whitelist')
    .select('*')
    .limit(1)
  console.log(
    'Whitelist:',
    wError ? '❌' : '✅',
    whitelist?.length || 0,
    'records'
  )

  // Test users
  const { data: users, error: uError } = await insforge
    .from('users')
    .select('*')
    .limit(1)
  console.log('Users:', uError ? '❌' : '✅', users?.length || 0, 'records')

  // Test categories
  const { data: categories, error: cError } = await insforge
    .from('categories')
    .select('*')
    .limit(5)
  console.log(
    'Categories:',
    cError ? '❌' : '✅',
    categories?.length || 0,
    'records'
  )

  // Test transactions
  const { data: transactions, error: tError } = await insforge
    .from('transactions')
    .select('*')
    .limit(1)
  console.log(
    'Transactions:',
    tError ? '❌' : '✅',
    transactions?.length || 0,
    'records'
  )

  // Test budgets
  const { data: budgets, error: bError } = await insforge
    .from('budgets')
    .select('*')
    .limit(1)
  console.log('Budgets:', bError ? '❌' : '✅', budgets?.length || 0, 'records')

  // Test exchange_rates
  const { data: rates, error: rError } = await insforge
    .from('exchange_rates')
    .select('*')
    .limit(1)
  console.log(
    'Exchange Rates:',
    rError ? '❌' : '✅',
    rates?.length || 0,
    'records'
  )

  console.log('\n✅ Database schema test complete!')
}

testDatabase()
```

Ejecutar:

```bash
npx tsx scripts/test-database.ts
```

Commit:

```bash
git checkout -b feature/26-test-database
git add . && git commit -m "test: add database schema verification script"
git push -u origin feature/26-test-database
gh pr create --base develop --title "Add database schema verification script" --body "Closes #26"
gh pr merge --squash && git checkout develop && git pull && git branch -d feature/26-test-database
```

---

## 🎯 Fin de Fase 3

### Verificación Final

```bash
pnpm build
pnpm type-check
npx tsx scripts/test-database.ts
```

**Checklist:**

- [ ] ✅ Todas las tablas creadas
- [ ] ✅ RLS policies configuradas
- [ ] ✅ Whitelist seed completado
- [ ] ✅ Categorías predefinidas agregadas
- [ ] ✅ Verificación de whitelist funcionando
- [ ] ✅ Tipos TypeScript creados
- [ ] ✅ Script de testing exitoso

---

### PR Final de Fase

```bash
gh pr create \
  --base main \
  --head develop \
  --title "FASE 03: Base de Datos (Esquema en InsForge)" \
  --body "## Completado
- Schema completo de 6 tablas
- RLS policies configuradas
- Seeds de whitelist y categorías
- Verificación de whitelist en NextAuth
- Tipos TypeScript del schema

Closes #18"
```

**🛑 DETENER - 📢 NOTIFICAR - ⏸️ ESPERAR APROBACIÓN**

---

**¡FASE 03 COMPLETADA! 🎉**

Continuar con: **FASE-04.md**
