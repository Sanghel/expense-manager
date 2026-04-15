# Esquema de Base de Datos

## Tablas

### whitelist

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | uuid PK | `gen_random_uuid()` |
| email | text unique not null | Email autorizado |
| created_at | timestamptz | `now()` |

### users

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | uuid PK | `gen_random_uuid()` |
| email | text unique not null | Email del usuario |
| name | text | Nombre |
| avatar_url | text | URL del avatar |
| preferred_currency | text | Default `'COP'` |
| created_at | timestamptz | `now()` |
| updated_at | timestamptz | `now()` |

### categories

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | uuid PK | `gen_random_uuid()` |
| user_id | uuid FK nullable | `null` = predefinida |
| name | text not null | Nombre |
| type | text not null | `'income'` \| `'expense'` |
| icon | text | Emoji/icono |
| color | text | Hex color |
| created_at | timestamptz | `now()` |

### transactions

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | uuid PK | `gen_random_uuid()` |
| user_id | uuid FK not null | Referencia a users |
| amount | numeric not null | Monto |
| currency | text not null | `'COP'` \| `'USD'` \| `'BOB'` |
| type | text not null | `'income'` \| `'expense'` |
| category_id | uuid FK not null | Referencia a categories |
| description | text not null | Descripción |
| date | date not null | Fecha |
| source | text | Default `'manual'` |
| notes | text | Notas opcionales |
| created_at | timestamptz | `now()` |
| updated_at | timestamptz | `now()` |

### budgets

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | uuid PK | `gen_random_uuid()` |
| user_id | uuid FK not null | Referencia a users |
| category_id | uuid FK not null | Referencia a categories |
| amount | numeric not null | Monto del presupuesto |
| currency | text not null | Moneda |
| period | text not null | `'monthly'` \| `'yearly'` |
| start_date | date not null | Fecha de inicio |
| created_at | timestamptz | `now()` |

### exchange_rates

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | uuid PK | `gen_random_uuid()` |
| from_currency | text not null | Moneda origen |
| to_currency | text not null | Moneda destino |
| rate | numeric not null | Tasa de cambio |
| date | date not null | Fecha de la tasa |
| created_at | timestamptz | `now()` |

Constraint único: `(from_currency, to_currency, date)`

## Relaciones

```
whitelist (standalone)
users ← transactions.user_id
users ← categories.user_id (nullable)
users ← budgets.user_id
categories ← transactions.category_id
categories ← budgets.category_id
exchange_rates (standalone)
```

## RLS Policies

| Tabla | Política |
|-------|----------|
| users | Solo puede ver/editar su propio registro |
| transactions | CRUD solo sobre sus propias transacciones |
| categories | SELECT público, INSERT/UPDATE/DELETE solo las propias |
| budgets | CRUD solo sobre sus propios presupuestos |
| exchange_rates | SELECT público, gestión por service_role |
