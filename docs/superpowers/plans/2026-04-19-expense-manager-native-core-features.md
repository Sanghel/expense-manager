# Expense Manager Native — Plan 2: Core Features

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar CRUD completo de Transacciones (FASE 3) y CRUD de Cuentas + Movimientos entre cuentas (FASE 4).

**Architecture:** Cada feature sigue el mismo patrón: data layer (actions en `lib/actions/`, validaciones Zod en `lib/validations/`) → componentes UI reutilizables → screens con Expo Router Stack dentro de cada tab. Las acciones son funciones async puras (sin `'use server'` ni `revalidatePath`), usan `insforge` (anon key + RLS). Las screens usan `useFocusEffect` para refetch al volver a la pantalla.

**Tech Stack:** Expo SDK 54, Expo Router v6, NativeWind v4, zod, @insforge/sdk, TypeScript

**Spec:** `docs/superpowers/specs/2026-04-18-expense-manager-native-design.md`

**Proyecto:** `/Users/sanghelgonzalez/Documents/projects/expense-manager-native`

---

## Archivos a crear / modificar

```
expense-manager-native/
├── lib/
│   ├── validations/
│   │   ├── transaction.ts          (nuevo)
│   │   └── account.ts              (nuevo)
│   └── actions/
│       ├── categories.actions.ts   (nuevo)
│       ├── transactions.actions.ts (nuevo)
│       ├── accounts.actions.ts     (nuevo)
│       └── account_movements.actions.ts (nuevo)
├── components/
│   ├── ui/
│   │   ├── FormInput.tsx           (nuevo)
│   │   └── SelectModal.tsx         (nuevo)
│   ├── transactions/
│   │   └── TransactionCard.tsx     (nuevo)
│   └── accounts/
│       ├── AccountCard.tsx         (nuevo)
│       └── AccountMovementForm.tsx (nuevo)
└── app/(dashboard)/
    ├── transactions.tsx            (ELIMINAR — reemplazar por directorio)
    ├── transactions/
    │   ├── _layout.tsx             (nuevo)
    │   ├── index.tsx               (nuevo)
    │   └── [id].tsx                (nuevo)
    ├── accounts.tsx                (ELIMINAR — reemplazar por directorio)
    └── accounts/
        ├── _layout.tsx             (nuevo)
        ├── index.tsx               (nuevo)
        └── [id].tsx                (nuevo)
```

---

## FASE 3: Transacciones

### Task 1: Instalar zod y crear data layer de transacciones

**Files:**
- Create: `lib/validations/transaction.ts`
- Create: `lib/actions/categories.actions.ts`
- Create: `lib/actions/transactions.actions.ts`

- [ ] **Paso 1.1: Crear issue maestro FASE 3**

```bash
gh issue create \
  --repo Sanghel/expense-manager-native \
  --title "FASE 3: CRUD de Transacciones" \
  --body "## Objetivo
Lista, crear, editar y eliminar transacciones con categoría, cuenta y moneda.

## Tareas
- [ ] Data layer (validaciones + actions)
- [ ] UI primitivos (FormInput, SelectModal)
- [ ] Lista de transacciones con FlatList
- [ ] Formulario crear/editar transacción

## Criterios de Aceptación
- Se pueden crear, editar y eliminar transacciones
- El balance de la cuenta se actualiza al asociar una transacción"
```

- [ ] **Paso 1.2: Crear issue de tarea y rama**

```bash
gh issue create \
  --repo Sanghel/expense-manager-native \
  --title "Data layer de transacciones: validaciones y actions" \
  --body "Parte de FASE 3"

# Anotar el número del issue (ej: #20)
git checkout develop && git pull origin develop
git checkout -b feature/[issue-number]-transactions-data-layer
```

- [ ] **Paso 1.3: Instalar zod**

```bash
cd /Users/sanghelgonzalez/Documents/projects/expense-manager-native
pnpm add zod
```

- [ ] **Paso 1.4: Crear `lib/validations/transaction.ts`**

```ts
// lib/validations/transaction.ts
import { z } from 'zod'

export const createTransactionSchema = z.object({
  amount: z.number().positive('El monto debe ser positivo'),
  currency: z.enum(['COP', 'USD', 'VES']),
  type: z.enum(['income', 'expense']),
  category_id: z.string().uuid(),
  account_id: z.string().uuid().nullable().optional(),
  description: z.string().min(1, 'La descripción es requerida'),
  date: z.string(),
  notes: z.string().optional(),
})

export const updateTransactionSchema = createTransactionSchema.partial()

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>
```

- [ ] **Paso 1.5: Crear `lib/actions/categories.actions.ts`**

```ts
// lib/actions/categories.actions.ts
import { insforge } from '@/lib/insforge'
import type { Category } from '@/types/database.types'

export async function getCategories(userId: string): Promise<{ success: boolean; data?: Category[]; error?: string }> {
  if (!userId) return { success: false, error: 'User ID requerido' }
  try {
    const [{ data: predefined, error: e1 }, { data: userCats, error: e2 }] = await Promise.all([
      insforge.database.from('categories').select('*').is('user_id', null).order('name'),
      insforge.database.from('categories').select('*').eq('user_id', userId).order('name'),
    ])
    if (e1) throw e1
    if (e2) throw e2
    return { success: true, data: [...(predefined ?? []), ...(userCats ?? [])] as Category[] }
  } catch {
    return { success: false, error: 'Error al cargar categorías' }
  }
}
```

- [ ] **Paso 1.6: Crear `lib/actions/transactions.actions.ts`**

```ts
// lib/actions/transactions.actions.ts
import { insforge } from '@/lib/insforge'
import {
  createTransactionSchema,
  updateTransactionSchema,
  type CreateTransactionInput,
  type UpdateTransactionInput,
} from '@/lib/validations/transaction'
import type { TransactionWithCategory } from '@/types/database.types'

export async function getTransactions(
  userId: string,
  limit = 100
): Promise<{ success: boolean; data?: TransactionWithCategory[]; error?: string }> {
  if (!userId) return { success: false, error: 'User ID requerido' }
  try {
    const { data, error } = await insforge.database
      .from('transactions')
      .select('*, category:categories(*)')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(limit)
    if (error) throw error
    return { success: true, data: (data ?? []) as TransactionWithCategory[] }
  } catch {
    return { success: false, error: 'Error al cargar transacciones' }
  }
}

export async function getTransactionById(
  id: string,
  userId: string
): Promise<{ success: boolean; data?: TransactionWithCategory; error?: string }> {
  try {
    const { data, error } = await insforge.database
      .from('transactions')
      .select('*, category:categories(*)')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle()
    if (error) throw error
    if (!data) return { success: false, error: 'Transacción no encontrada' }
    return { success: true, data: data as TransactionWithCategory }
  } catch {
    return { success: false, error: 'Error al cargar transacción' }
  }
}

export async function createTransaction(
  userId: string,
  input: CreateTransactionInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const validated = createTransactionSchema.parse(input)
    const { data: transaction, error } = await insforge.database
      .from('transactions')
      .insert([{ ...validated, user_id: userId, source: 'manual' }])
      .select()
      .single()
    if (error) throw error

    if (validated.account_id) {
      const rpc = validated.type === 'income' ? 'increment_account_balance' : 'decrement_account_balance'
      await insforge.database.rpc(rpc, {
        account_id: validated.account_id,
        amount: validated.amount,
      })
    }
    return { success: true }
  } catch {
    return { success: false, error: 'Error al crear transacción' }
  }
}

export async function updateTransaction(
  id: string,
  userId: string,
  input: UpdateTransactionInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: oldTx, error: fetchError } = await insforge.database
      .from('transactions')
      .select('account_id, type, amount')
      .eq('id', id)
      .eq('user_id', userId)
      .single()
    if (fetchError) throw fetchError

    const validated = updateTransactionSchema.parse(input)
    const { data: transaction, error } = await insforge.database
      .from('transactions')
      .update(validated)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()
    if (error) throw error

    // Revertir efecto anterior
    if (oldTx.account_id) {
      const reverseRpc = oldTx.type === 'expense' ? 'increment_account_balance' : 'decrement_account_balance'
      await insforge.database.rpc(reverseRpc, {
        account_id: oldTx.account_id,
        amount: Number(oldTx.amount),
      })
    }
    // Aplicar nuevo efecto
    if (transaction.account_id) {
      const applyRpc = transaction.type === 'income' ? 'increment_account_balance' : 'decrement_account_balance'
      await insforge.database.rpc(applyRpc, {
        account_id: transaction.account_id,
        amount: Number(transaction.amount),
      })
    }
    return { success: true }
  } catch {
    return { success: false, error: 'Error al actualizar transacción' }
  }
}

export async function deleteTransaction(
  id: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: tx } = await insforge.database
      .from('transactions')
      .select('account_id, type, amount')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle()

    const { error } = await insforge.database
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
    if (error) throw error

    if (tx?.account_id) {
      const reverseRpc = tx.type === 'expense' ? 'increment_account_balance' : 'decrement_account_balance'
      await insforge.database.rpc(reverseRpc, {
        account_id: tx.account_id,
        amount: Number(tx.amount),
      })
    }
    return { success: true }
  } catch {
    return { success: false, error: 'Error al eliminar transacción' }
  }
}
```

- [ ] **Paso 1.7: TypeScript check**

```bash
cd /Users/sanghelgonzalez/Documents/projects/expense-manager-native && npx tsc --noEmit
```

Resultado esperado: 0 errores.

- [ ] **Paso 1.8: Commit y PR**

```bash
git add .
git commit -m "feat: add transactions and categories data layer"
git push -u origin feature/[issue-number]-transactions-data-layer

gh pr create \
  --repo Sanghel/expense-manager-native \
  --base develop \
  --title "feat: add transactions and categories data layer" \
  --body "- lib/validations/transaction.ts: Zod schemas
- lib/actions/categories.actions.ts: getCategories
- lib/actions/transactions.actions.ts: CRUD completo con balance update via RPC

Closes #[issue-number]"

gh pr merge --squash --delete-branch --repo Sanghel/expense-manager-native
git checkout develop && git pull origin develop
```

---

### Task 2: UI primitivos — FormInput y SelectModal

**Files:**
- Create: `components/ui/FormInput.tsx`
- Create: `components/ui/SelectModal.tsx`

- [ ] **Paso 2.1: Crear issue y rama**

```bash
gh issue create \
  --repo Sanghel/expense-manager-native \
  --title "UI primitivos: FormInput y SelectModal" \
  --body "Parte de FASE 3"

git checkout develop && git pull origin develop
git checkout -b feature/[issue-number]-ui-primitives
```

- [ ] **Paso 2.2: Crear `components/ui/FormInput.tsx`**

```tsx
// components/ui/FormInput.tsx
import { View, Text, TextInput, type TextInputProps } from 'react-native'

interface Props extends TextInputProps {
  label: string
}

export function FormInput({ label, style, ...props }: Props) {
  return (
    <View className="mb-4">
      <Text className="text-muted text-sm mb-1">{label}</Text>
      <TextInput
        {...props}
        placeholderTextColor="#B0B0B0"
        className="bg-surface border border-border rounded-xl px-4 py-3 text-white"
      />
    </View>
  )
}
```

- [ ] **Paso 2.3: Crear `components/ui/SelectModal.tsx`**

```tsx
// components/ui/SelectModal.tsx
import { Modal, View, Text, TouchableOpacity, FlatList } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export interface SelectOption {
  label: string
  value: string
}

interface Props {
  visible: boolean
  onClose: () => void
  title: string
  options: SelectOption[]
  selected?: string
  onSelect: (value: string) => void
}

export function SelectModal({ visible, onClose, title, options, selected, onSelect }: Props) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 bg-black/60 justify-end">
        <SafeAreaView edges={['bottom']} className="bg-surface rounded-t-2xl" style={{ maxHeight: '65%' }}>
          <View className="flex-row justify-between items-center px-4 py-3 border-b border-border">
            <Text className="text-white text-base font-bold">{title}</Text>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7} className="p-2">
              <Text className="text-muted text-xl leading-none">✕</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={options}
            keyExtractor={(item) => item.value}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => onSelect(item.value)}
                activeOpacity={0.7}
                className={`flex-row items-center justify-between px-4 py-4 border-b border-border ${
                  selected === item.value ? 'bg-primary/20' : ''
                }`}
              >
                <Text className="text-white flex-1">{item.label}</Text>
                {selected === item.value && (
                  <Text className="text-primary font-bold ml-2">✓</Text>
                )}
              </TouchableOpacity>
            )}
          />
        </SafeAreaView>
      </View>
    </Modal>
  )
}
```

- [ ] **Paso 2.4: TypeScript check y PR**

```bash
cd /Users/sanghelgonzalez/Documents/projects/expense-manager-native && npx tsc --noEmit

git add .
git commit -m "feat: add FormInput and SelectModal UI primitives"
git push -u origin feature/[issue-number]-ui-primitives

gh pr create \
  --repo Sanghel/expense-manager-native \
  --base develop \
  --title "feat: add FormInput and SelectModal UI primitives" \
  --body "- components/ui/FormInput.tsx: TextInput con label
- components/ui/SelectModal.tsx: picker modal reutilizable

Closes #[issue-number]"

gh pr merge --squash --delete-branch --repo Sanghel/expense-manager-native
git checkout develop && git pull origin develop
```

---

### Task 3: Pantalla lista de transacciones

**Files:**
- Delete: `app/(dashboard)/transactions.tsx`
- Create: `app/(dashboard)/transactions/_layout.tsx`
- Create: `app/(dashboard)/transactions/index.tsx`
- Create: `components/transactions/TransactionCard.tsx`

- [ ] **Paso 3.1: Crear issue y rama**

```bash
gh issue create \
  --repo Sanghel/expense-manager-native \
  --title "Pantalla lista de transacciones" \
  --body "FlatList de transacciones con pull-to-refresh y FAB para crear. Parte de FASE 3."

git checkout develop && git pull origin develop
git checkout -b feature/[issue-number]-transactions-list
```

- [ ] **Paso 3.2: Eliminar el placeholder y crear el Stack layout**

```bash
rm /Users/sanghelgonzalez/Documents/projects/expense-manager-native/app/\(dashboard\)/transactions.tsx
mkdir -p /Users/sanghelgonzalez/Documents/projects/expense-manager-native/app/\(dashboard\)/transactions
```

```tsx
// app/(dashboard)/transactions/_layout.tsx
import { Stack } from 'expo-router'
import { colors } from '@/constants/theme'

export default function TransactionsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
      }}
    />
  )
}
```

- [ ] **Paso 3.3: Crear `components/transactions/TransactionCard.tsx`**

```tsx
// components/transactions/TransactionCard.tsx
import { View, Text, TouchableOpacity, Alert } from 'react-native'
import { formatCurrency } from '@/lib/utils/currency'
import type { TransactionWithCategory } from '@/types/database.types'

interface Props {
  transaction: TransactionWithCategory
  onPress: () => void
  onDelete: () => Promise<void>
}

export function TransactionCard({ transaction, onPress, onDelete }: Props) {
  const isIncome = transaction.type === 'income'

  function handleDelete() {
    Alert.alert('Eliminar', '¿Eliminar esta transacción?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: onDelete },
    ])
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="flex-row items-center bg-surface mx-4 my-1 p-4 rounded-xl border border-border"
    >
      <Text className="text-2xl mr-3">{transaction.category?.icon ?? '💰'}</Text>
      <View className="flex-1">
        <Text className="text-white font-medium" numberOfLines={1}>
          {transaction.description}
        </Text>
        <Text className="text-muted text-xs mt-0.5">
          {transaction.category?.name ?? 'Sin categoría'} · {transaction.date}
        </Text>
      </View>
      <View className="items-end ml-2">
        <Text className={`font-bold ${isIncome ? 'text-green-400' : 'text-red-400'}`}>
          {isIncome ? '+' : '-'}{formatCurrency(transaction.amount, transaction.currency)}
        </Text>
        <TouchableOpacity onPress={handleDelete} activeOpacity={0.7} className="mt-1">
          <Text className="text-red-400 text-xs">Eliminar</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  )
}
```

- [ ] **Paso 3.4: Crear `app/(dashboard)/transactions/index.tsx`**

```tsx
// app/(dashboard)/transactions/index.tsx
import { View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native'
import { useState, useCallback } from 'react'
import { router, useFocusEffect } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '@/context/AuthContext'
import { getTransactions, deleteTransaction } from '@/lib/actions/transactions.actions'
import { TransactionCard } from '@/components/transactions/TransactionCard'
import type { TransactionWithCategory } from '@/types/database.types'

export default function TransactionsScreen() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<TransactionWithCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchTransactions = useCallback(async () => {
    if (!user) return
    const result = await getTransactions(user.id)
    if (result.success && result.data) setTransactions(result.data)
    setLoading(false)
    setRefreshing(false)
  }, [user])

  useFocusEffect(
    useCallback(() => {
      fetchTransactions()
    }, [fetchTransactions])
  )

  async function handleDelete(id: string) {
    if (!user) return
    const result = await deleteTransaction(id, user.id)
    if (result.success) {
      setTransactions((prev) => prev.filter((t) => t.id !== id))
    }
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg">
      <View className="px-4 py-3 border-b border-border">
        <Text className="text-white text-xl font-bold">Transacciones</Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted">Cargando...</Text>
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TransactionCard
              transaction={item}
              onPress={() => router.push(`/(dashboard)/transactions/${item.id}`)}
              onDelete={() => handleDelete(item.id)}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchTransactions() }}
              tintColor="#4F46E5"
            />
          }
          ListEmptyComponent={
            <View className="items-center mt-20">
              <Text className="text-muted text-base">No hay transacciones</Text>
              <Text className="text-muted text-sm mt-1">Toca + para crear una</Text>
            </View>
          }
          contentContainerStyle={{ paddingBottom: 100, paddingTop: 8 }}
        />
      )}

      <TouchableOpacity
        onPress={() => router.push('/(dashboard)/transactions/new')}
        activeOpacity={0.8}
        className="absolute bottom-6 right-6 w-14 h-14 bg-primary rounded-full items-center justify-center"
        style={{ elevation: 4 }}
      >
        <Text className="text-white text-3xl leading-none">+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  )
}
```

- [ ] **Paso 3.5: TypeScript check y PR**

```bash
cd /Users/sanghelgonzalez/Documents/projects/expense-manager-native && npx tsc --noEmit

git add .
git commit -m "feat: add transactions list screen with FlatList and delete"
git push -u origin feature/[issue-number]-transactions-list

gh pr create \
  --repo Sanghel/expense-manager-native \
  --base develop \
  --title "feat: add transactions list screen" \
  --body "- app/(dashboard)/transactions/_layout.tsx: Stack navigator
- app/(dashboard)/transactions/index.tsx: lista con FlatList, pull-to-refresh, FAB
- components/transactions/TransactionCard.tsx: card con delete

Closes #[issue-number]"

gh pr merge --squash --delete-branch --repo Sanghel/expense-manager-native
git checkout develop && git pull origin develop
```

---

### Task 4: Pantalla crear / editar transacción

**Files:**
- Create: `app/(dashboard)/transactions/[id].tsx`

- [ ] **Paso 4.1: Crear issue y rama**

```bash
gh issue create \
  --repo Sanghel/expense-manager-native \
  --title "Pantalla crear/editar transacción" \
  --body "Screen de formulario para crear (id=new) y editar (id=uuid) transacciones. Parte de FASE 3."

git checkout develop && git pull origin develop
git checkout -b feature/[issue-number]-transaction-form
```

- [ ] **Paso 4.2: Crear `app/(dashboard)/transactions/[id].tsx`**

```tsx
// app/(dashboard)/transactions/[id].tsx
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native'
import { useState, useEffect } from 'react'
import { useLocalSearchParams, router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '@/context/AuthContext'
import {
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from '@/lib/actions/transactions.actions'
import { getCategories } from '@/lib/actions/categories.actions'
import { getAccounts } from '@/lib/actions/accounts.actions'
import { FormInput } from '@/components/ui/FormInput'
import { SelectModal } from '@/components/ui/SelectModal'
import { PrimaryButton } from '@/components/ui/PrimaryButton'
import type { Category, Account } from '@/types/database.types'

const CURRENCY_OPTIONS = [
  { label: 'COP - Peso Colombiano', value: 'COP' },
  { label: 'USD - Dólar', value: 'USD' },
  { label: 'VES - Bolívar (Bs)', value: 'VES' },
]

export default function TransactionFormScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { user } = useAuth()
  const isNew = id === 'new'

  const [initialLoading, setInitialLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])

  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('COP')
  const [type, setType] = useState<'income' | 'expense'>('expense')
  const [categoryId, setCategoryId] = useState('')
  const [accountId, setAccountId] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')

  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false)
  const [showCategoryPicker, setShowCategoryPicker] = useState(false)
  const [showAccountPicker, setShowAccountPicker] = useState(false)

  useEffect(() => {
    if (!user) return
    Promise.all([getCategories(user.id), getAccounts(user.id)]).then(
      ([catsRes, accsRes]) => {
        if (catsRes.success && catsRes.data) setCategories(catsRes.data)
        if (accsRes.success && accsRes.data) setAccounts(accsRes.data)
      }
    )
    if (!isNew) {
      getTransactionById(id, user.id).then((res) => {
        if (res.success && res.data) {
          const tx = res.data
          setDescription(tx.description)
          setAmount(String(tx.amount))
          setCurrency(tx.currency)
          setType(tx.type)
          setCategoryId(tx.category_id)
          setAccountId(tx.account_id ?? '')
          setDate(tx.date)
          setNotes(tx.notes ?? '')
        }
        setInitialLoading(false)
      })
    }
  }, [user, id, isNew])

  async function handleSubmit() {
    if (!user || !description.trim() || !amount || !categoryId || !date) {
      Alert.alert('Error', 'Completa todos los campos requeridos')
      return
    }
    setSaving(true)
    const data = {
      description: description.trim(),
      amount: parseFloat(amount),
      currency: currency as 'COP' | 'USD' | 'VES',
      type,
      category_id: categoryId,
      account_id: accountId || null,
      date,
      notes: notes.trim() || undefined,
    }
    const result = isNew
      ? await createTransaction(user.id, data)
      : await updateTransaction(id, user.id, data)

    if (result.success) {
      router.back()
    } else {
      Alert.alert('Error', result.error ?? 'Error al guardar')
    }
    setSaving(false)
  }

  function handleDelete() {
    if (!user || isNew) return
    Alert.alert('Eliminar transacción', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await deleteTransaction(id, user.id)
          router.back()
        },
      },
    ])
  }

  const filteredCategories = categories.filter((c) => c.type === type)
  const categoryOptions = filteredCategories.map((c) => ({
    label: `${c.icon ?? ''} ${c.name}`.trim(),
    value: c.id,
  }))
  const accountOptions = [
    { label: 'Sin cuenta', value: '' },
    ...accounts.map((a) => ({
      label: `${a.icon ?? '💳'} ${a.name} (${a.currency})`,
      value: a.id,
    })),
  ]
  const selectedCategory = categories.find((c) => c.id === categoryId)
  const selectedAccount = accounts.find((a) => a.id === accountId)

  if (initialLoading) {
    return (
      <View className="flex-1 bg-bg items-center justify-center">
        <ActivityIndicator color="#4F46E5" />
      </View>
    )
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-bg">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Text className="text-primary text-base">← Volver</Text>
        </TouchableOpacity>
        <Text className="text-white text-base font-bold">
          {isNew ? 'Nueva Transacción' : 'Editar Transacción'}
        </Text>
        {!isNew ? (
          <TouchableOpacity onPress={handleDelete} activeOpacity={0.7}>
            <Text className="text-red-400 text-sm">Eliminar</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 56 }} />
        )}
      </View>

      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingVertical: 16, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Tipo: Ingreso / Gasto */}
        <View className="flex-row gap-2 mb-4">
          {(['expense', 'income'] as const).map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => { setType(t); setCategoryId('') }}
              activeOpacity={0.7}
              className={`flex-1 py-3 rounded-xl items-center border ${
                type === t ? 'bg-primary border-primary' : 'bg-transparent border-border'
              }`}
            >
              <Text className="text-white font-medium">
                {t === 'expense' ? '🔴 Gasto' : '💚 Ingreso'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <FormInput
          label="Descripción *"
          value={description}
          onChangeText={setDescription}
          placeholder="Ej: Mercado del mes"
        />

        <FormInput
          label="Monto *"
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          placeholder="0.00"
        />

        {/* Moneda */}
        <View className="mb-4">
          <Text className="text-muted text-sm mb-1">Moneda</Text>
          <TouchableOpacity
            onPress={() => setShowCurrencyPicker(true)}
            activeOpacity={0.7}
            className="bg-surface border border-border rounded-xl px-4 py-3"
          >
            <Text className="text-white">
              {CURRENCY_OPTIONS.find((o) => o.value === currency)?.label ?? currency}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Categoría */}
        <View className="mb-4">
          <Text className="text-muted text-sm mb-1">Categoría *</Text>
          <TouchableOpacity
            onPress={() => setShowCategoryPicker(true)}
            activeOpacity={0.7}
            className="bg-surface border border-border rounded-xl px-4 py-3"
          >
            <Text className={selectedCategory ? 'text-white' : 'text-muted'}>
              {selectedCategory
                ? `${selectedCategory.icon ?? ''} ${selectedCategory.name}`.trim()
                : 'Seleccionar categoría...'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Cuenta */}
        <View className="mb-4">
          <Text className="text-muted text-sm mb-1">Cuenta (opcional)</Text>
          <TouchableOpacity
            onPress={() => setShowAccountPicker(true)}
            activeOpacity={0.7}
            className="bg-surface border border-border rounded-xl px-4 py-3"
          >
            <Text className="text-white">
              {selectedAccount
                ? `${selectedAccount.icon ?? '💳'} ${selectedAccount.name}`
                : 'Sin cuenta'}
            </Text>
          </TouchableOpacity>
        </View>

        <FormInput
          label="Fecha *"
          value={date}
          onChangeText={setDate}
          placeholder="YYYY-MM-DD"
          keyboardType="numeric"
        />

        <FormInput
          label="Notas (opcional)"
          value={notes}
          onChangeText={setNotes}
          placeholder="Notas adicionales..."
          multiline
          numberOfLines={3}
          style={{ minHeight: 80, textAlignVertical: 'top' }}
        />

        <PrimaryButton
          onPress={handleSubmit}
          loading={saving}
          disabled={!description.trim() || !amount || !categoryId || !date}
        >
          {isNew ? 'Crear Transacción' : 'Guardar Cambios'}
        </PrimaryButton>
      </ScrollView>

      <SelectModal
        visible={showCurrencyPicker}
        onClose={() => setShowCurrencyPicker(false)}
        title="Seleccionar Moneda"
        options={CURRENCY_OPTIONS}
        selected={currency}
        onSelect={(v) => { setCurrency(v); setShowCurrencyPicker(false) }}
      />
      <SelectModal
        visible={showCategoryPicker}
        onClose={() => setShowCategoryPicker(false)}
        title="Seleccionar Categoría"
        options={categoryOptions}
        selected={categoryId}
        onSelect={(v) => { setCategoryId(v); setShowCategoryPicker(false) }}
      />
      <SelectModal
        visible={showAccountPicker}
        onClose={() => setShowAccountPicker(false)}
        title="Seleccionar Cuenta"
        options={accountOptions}
        selected={accountId}
        onSelect={(v) => { setAccountId(v); setShowAccountPicker(false) }}
      />
    </SafeAreaView>
  )
}
```

> **Nota:** `getAccounts` se importa desde `lib/actions/accounts.actions.ts` — este archivo no existe aún pero se crea en Task 5. El TypeScript check fallará hasta que Task 5 esté completa. Crear el archivo con un stub es suficiente para que compile ahora (ver paso 4.3).

- [ ] **Paso 4.3: Crear stub de accounts.actions para compilar**

```ts
// lib/actions/accounts.actions.ts (stub — se reemplaza en Task 5)
import type { Account } from '@/types/database.types'

export async function getAccounts(_userId: string): Promise<{ success: boolean; data?: Account[] }> {
  return { success: true, data: [] }
}
```

- [ ] **Paso 4.4: TypeScript check y PR**

```bash
cd /Users/sanghelgonzalez/Documents/projects/expense-manager-native && npx tsc --noEmit

git add .
git commit -m "feat: add transaction create/edit screen"
git push -u origin feature/[issue-number]-transaction-form

gh pr create \
  --repo Sanghel/expense-manager-native \
  --base develop \
  --title "feat: add transaction create/edit screen" \
  --body "- app/(dashboard)/transactions/[id].tsx: formulario crear/editar
- lib/actions/accounts.actions.ts: stub (se completa en FASE 4)

Closes #[issue-number]"

gh pr merge --squash --delete-branch --repo Sanghel/expense-manager-native
git checkout develop && git pull origin develop
```

---

## FASE 4: Cuentas y Movimientos

### Task 5: Data layer de cuentas y movimientos

**Files:**
- Create: `lib/validations/account.ts`
- Modify: `lib/actions/accounts.actions.ts` (reemplazar el stub)
- Create: `lib/actions/account_movements.actions.ts`

- [ ] **Paso 5.1: Crear issue maestro FASE 4**

```bash
gh issue create \
  --repo Sanghel/expense-manager-native \
  --title "FASE 4: CRUD de Cuentas y Movimientos" \
  --body "## Objetivo
Lista, crear, editar y eliminar cuentas. Movimientos entre cuentas con actualización automática de balances.

## Criterios de Aceptación
- CRUD de cuentas con balance inicial
- Movimientos entre cuentas con montos/monedas diferenciados
- Balance se actualiza automáticamente"
```

- [ ] **Paso 5.2: Crear issue de tarea y rama**

```bash
gh issue create \
  --repo Sanghel/expense-manager-native \
  --title "Data layer de cuentas y movimientos" \
  --body "Parte de FASE 4"

git checkout develop && git pull origin develop
git checkout -b feature/[issue-number]-accounts-data-layer
```

- [ ] **Paso 5.3: Crear `lib/validations/account.ts`**

```ts
// lib/validations/account.ts
import { z } from 'zod'

export const createAccountSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  type: z.enum(['bank', 'digital', 'crypto', 'cash']),
  currency: z.enum(['COP', 'USD', 'VES']),
  balance: z.number().default(0),
  color: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
})

export const updateAccountSchema = createAccountSchema.partial()

export const createAccountMovementSchema = z.object({
  from_account_id: z.string().uuid(),
  from_amount: z.number().positive('El monto enviado debe ser mayor a 0'),
  from_currency: z.enum(['COP', 'USD', 'VES']),
  to_account_id: z.string().uuid(),
  to_amount: z.number().positive('El monto recibido debe ser mayor a 0'),
  to_currency: z.enum(['COP', 'USD', 'VES']),
  description: z.string().nullable().optional(),
  date: z.string(),
})

export type CreateAccountInput = z.infer<typeof createAccountSchema>
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>
export type CreateAccountMovementInput = z.infer<typeof createAccountMovementSchema>
```

- [ ] **Paso 5.4: Reemplazar `lib/actions/accounts.actions.ts`**

```ts
// lib/actions/accounts.actions.ts
import { insforge } from '@/lib/insforge'
import {
  createAccountSchema,
  updateAccountSchema,
  type CreateAccountInput,
  type UpdateAccountInput,
} from '@/lib/validations/account'
import type { Account } from '@/types/database.types'

export async function getAccounts(userId: string): Promise<{ success: boolean; data?: Account[]; error?: string }> {
  if (!userId) return { success: false, error: 'User ID requerido' }
  try {
    const { data, error } = await insforge.database
      .from('accounts')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('name')
    if (error) throw error
    return { success: true, data: (data ?? []) as Account[] }
  } catch {
    return { success: false, error: 'Error al cargar cuentas' }
  }
}

export async function getAccountById(
  id: string,
  userId: string
): Promise<{ success: boolean; data?: Account; error?: string }> {
  try {
    const { data, error } = await insforge.database
      .from('accounts')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle()
    if (error) throw error
    if (!data) return { success: false, error: 'Cuenta no encontrada' }
    return { success: true, data: data as Account }
  } catch {
    return { success: false, error: 'Error al cargar cuenta' }
  }
}

export async function createAccount(
  userId: string,
  input: CreateAccountInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const validated = createAccountSchema.parse(input)
    const { error } = await insforge.database
      .from('accounts')
      .insert([{ ...validated, user_id: userId }])
    if (error) throw error
    return { success: true }
  } catch {
    return { success: false, error: 'Error al crear cuenta' }
  }
}

export async function updateAccount(
  id: string,
  userId: string,
  input: UpdateAccountInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const validated = updateAccountSchema.parse(input)
    const { error } = await insforge.database
      .from('accounts')
      .update({ ...validated, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
    if (error) throw error
    return { success: true }
  } catch {
    return { success: false, error: 'Error al actualizar cuenta' }
  }
}

export async function deleteAccount(
  id: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: movements } = await insforge.database
      .from('account_movements')
      .select('id')
      .or(`from_account_id.eq.${id},to_account_id.eq.${id}`)
      .limit(1)

    if (movements && movements.length > 0) {
      return { success: false, error: 'No se puede eliminar: la cuenta tiene movimientos asociados' }
    }

    const { error } = await insforge.database
      .from('accounts')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
    if (error) throw error
    return { success: true }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error al eliminar cuenta'
    return { success: false, error: msg }
  }
}
```

- [ ] **Paso 5.5: Crear `lib/actions/account_movements.actions.ts`**

```ts
// lib/actions/account_movements.actions.ts
import { insforge } from '@/lib/insforge'
import {
  createAccountMovementSchema,
  type CreateAccountMovementInput,
} from '@/lib/validations/account'
import type { AccountMovementWithAccounts } from '@/types/database.types'

export async function getAccountMovements(
  userId: string
): Promise<{ success: boolean; data?: AccountMovementWithAccounts[]; error?: string }> {
  if (!userId) return { success: false, error: 'User ID requerido' }
  try {
    const { data, error } = await insforge.database
      .from('account_movements')
      .select('*, from_account:accounts!from_account_id(*), to_account:accounts!to_account_id(*)')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
    if (error) throw error
    return { success: true, data: (data ?? []) as AccountMovementWithAccounts[] }
  } catch {
    return { success: false, error: 'Error al cargar movimientos' }
  }
}

export async function createAccountMovement(
  userId: string,
  input: CreateAccountMovementInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const validated = createAccountMovementSchema.parse(input)
    if (validated.from_account_id === validated.to_account_id) {
      return { success: false, error: 'La cuenta origen y destino no pueden ser la misma' }
    }
    const { error } = await insforge.database
      .from('account_movements')
      .insert([{ ...validated, user_id: userId }])
    if (error) throw error

    await Promise.all([
      insforge.database.rpc('decrement_account_balance', {
        account_id: validated.from_account_id,
        amount: validated.from_amount,
      }),
      insforge.database.rpc('increment_account_balance', {
        account_id: validated.to_account_id,
        amount: validated.to_amount,
      }),
    ])
    return { success: true }
  } catch {
    return { success: false, error: 'Error al registrar movimiento' }
  }
}

export async function deleteAccountMovement(
  id: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: movement } = await insforge.database
      .from('account_movements')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle()

    const { error } = await insforge.database
      .from('account_movements')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
    if (error) throw error

    if (movement) {
      await Promise.all([
        insforge.database.rpc('increment_account_balance', {
          account_id: movement.from_account_id,
          amount: movement.from_amount,
        }),
        insforge.database.rpc('decrement_account_balance', {
          account_id: movement.to_account_id,
          amount: movement.to_amount,
        }),
      ])
    }
    return { success: true }
  } catch {
    return { success: false, error: 'Error al eliminar movimiento' }
  }
}
```

- [ ] **Paso 5.6: TypeScript check y PR**

```bash
cd /Users/sanghelgonzalez/Documents/projects/expense-manager-native && npx tsc --noEmit

git add .
git commit -m "feat: add accounts and account_movements data layer"
git push -u origin feature/[issue-number]-accounts-data-layer

gh pr create \
  --repo Sanghel/expense-manager-native \
  --base develop \
  --title "feat: add accounts and account movements data layer" \
  --body "- lib/validations/account.ts: schemas Zod
- lib/actions/accounts.actions.ts: CRUD completo (reemplaza stub)
- lib/actions/account_movements.actions.ts: CRUD con balance RPC

Closes #[issue-number]"

gh pr merge --squash --delete-branch --repo Sanghel/expense-manager-native
git checkout develop && git pull origin develop
```

---

### Task 6: Pantalla lista de cuentas

**Files:**
- Delete: `app/(dashboard)/accounts.tsx`
- Create: `app/(dashboard)/accounts/_layout.tsx`
- Create: `app/(dashboard)/accounts/index.tsx`
- Create: `components/accounts/AccountCard.tsx`

- [ ] **Paso 6.1: Crear issue y rama**

```bash
gh issue create \
  --repo Sanghel/expense-manager-native \
  --title "Pantalla lista de cuentas" \
  --body "Lista de cuentas con balance, FAB para crear. Parte de FASE 4."

git checkout develop && git pull origin develop
git checkout -b feature/[issue-number]-accounts-list
```

- [ ] **Paso 6.2: Eliminar placeholder y crear Stack layout**

```bash
rm /Users/sanghelgonzalez/Documents/projects/expense-manager-native/app/\(dashboard\)/accounts.tsx
mkdir -p /Users/sanghelgonzalez/Documents/projects/expense-manager-native/app/\(dashboard\)/accounts
```

```tsx
// app/(dashboard)/accounts/_layout.tsx
import { Stack } from 'expo-router'
import { colors } from '@/constants/theme'

export default function AccountsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
      }}
    />
  )
}
```

- [ ] **Paso 6.3: Crear `components/accounts/AccountCard.tsx`**

```tsx
// components/accounts/AccountCard.tsx
import { View, Text, TouchableOpacity, Alert } from 'react-native'
import { formatCurrency } from '@/lib/utils/currency'
import type { Account } from '@/types/database.types'

interface Props {
  account: Account
  onPress: () => void
  onDelete: () => Promise<void>
}

export function AccountCard({ account, onPress, onDelete }: Props) {
  function handleDelete() {
    Alert.alert('Eliminar cuenta', `¿Eliminar "${account.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: onDelete },
    ])
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="bg-surface mx-4 my-1.5 p-4 rounded-xl border border-border"
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-3 flex-1">
          <View
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: account.color ?? '#4F46E5' }}
          >
            <Text className="text-xl">{account.icon ?? '💳'}</Text>
          </View>
          <View className="flex-1">
            <Text className="text-white font-semibold" numberOfLines={1}>
              {account.name}
            </Text>
            <Text className="text-muted text-xs capitalize">{account.type}</Text>
          </View>
        </View>
        <View className="items-end">
          <Text className="text-white font-bold">
            {formatCurrency(account.balance, account.currency)}
          </Text>
          <TouchableOpacity onPress={handleDelete} activeOpacity={0.7} className="mt-1">
            <Text className="text-red-400 text-xs">Eliminar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  )
}
```

- [ ] **Paso 6.4: Crear `app/(dashboard)/accounts/index.tsx`**

```tsx
// app/(dashboard)/accounts/index.tsx
import { View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native'
import { useState, useCallback } from 'react'
import { router, useFocusEffect } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '@/context/AuthContext'
import { getAccounts, deleteAccount } from '@/lib/actions/accounts.actions'
import { AccountCard } from '@/components/accounts/AccountCard'
import type { Account } from '@/types/database.types'
import { formatCurrency } from '@/lib/utils/currency'

export default function AccountsScreen() {
  const { user } = useAuth()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchAccounts = useCallback(async () => {
    if (!user) return
    const result = await getAccounts(user.id)
    if (result.success && result.data) setAccounts(result.data)
    setLoading(false)
    setRefreshing(false)
  }, [user])

  useFocusEffect(
    useCallback(() => {
      fetchAccounts()
    }, [fetchAccounts])
  )

  async function handleDelete(id: string) {
    if (!user) return
    const result = await deleteAccount(id, user.id)
    if (result.success) {
      setAccounts((prev) => prev.filter((a) => a.id !== id))
    } else {
      const { Alert } = await import('react-native')
      Alert.alert('Error', result.error)
    }
  }

  const totalByCurrency = accounts.reduce<Record<string, number>>((acc, account) => {
    acc[account.currency] = (acc[account.currency] ?? 0) + account.balance
    return acc
  }, {})

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg">
      <View className="px-4 py-3 border-b border-border">
        <Text className="text-white text-xl font-bold">Cuentas</Text>
        {Object.entries(totalByCurrency).length > 0 && (
          <View className="flex-row gap-4 mt-1">
            {Object.entries(totalByCurrency).map(([cur, total]) => (
              <Text key={cur} className="text-muted text-xs">
                {formatCurrency(total, cur as 'COP' | 'USD' | 'VES')}
              </Text>
            ))}
          </View>
        )}
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted">Cargando...</Text>
        </View>
      ) : (
        <FlatList
          data={accounts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <AccountCard
              account={item}
              onPress={() => router.push(`/(dashboard)/accounts/${item.id}`)}
              onDelete={() => handleDelete(item.id)}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchAccounts() }}
              tintColor="#4F46E5"
            />
          }
          ListEmptyComponent={
            <View className="items-center mt-20">
              <Text className="text-muted text-base">No hay cuentas</Text>
              <Text className="text-muted text-sm mt-1">Toca + para crear una</Text>
            </View>
          }
          contentContainerStyle={{ paddingBottom: 100, paddingTop: 8 }}
        />
      )}

      <TouchableOpacity
        onPress={() => router.push('/(dashboard)/accounts/new')}
        activeOpacity={0.8}
        className="absolute bottom-6 right-6 w-14 h-14 bg-primary rounded-full items-center justify-center"
        style={{ elevation: 4 }}
      >
        <Text className="text-white text-3xl leading-none">+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  )
}
```

- [ ] **Paso 6.5: TypeScript check y PR**

```bash
cd /Users/sanghelgonzalez/Documents/projects/expense-manager-native && npx tsc --noEmit

git add .
git commit -m "feat: add accounts list screen with balance summary"
git push -u origin feature/[issue-number]-accounts-list

gh pr create \
  --repo Sanghel/expense-manager-native \
  --base develop \
  --title "feat: add accounts list screen" \
  --body "- app/(dashboard)/accounts/_layout.tsx: Stack navigator
- app/(dashboard)/accounts/index.tsx: lista con total por moneda, pull-to-refresh, FAB
- components/accounts/AccountCard.tsx: card con balance y delete

Closes #[issue-number]"

gh pr merge --squash --delete-branch --repo Sanghel/expense-manager-native
git checkout develop && git pull origin develop
```

---

### Task 7: Pantalla crear/editar cuenta + formulario de movimientos

**Files:**
- Create: `app/(dashboard)/accounts/[id].tsx`
- Create: `components/accounts/AccountMovementForm.tsx`

- [ ] **Paso 7.1: Crear issue y rama**

```bash
gh issue create \
  --repo Sanghel/expense-manager-native \
  --title "Pantalla crear/editar cuenta y formulario de movimientos" \
  --body "Formulario de cuenta (crear/editar) y modal de movimiento entre cuentas. Parte de FASE 4."

git checkout develop && git pull origin develop
git checkout -b feature/[issue-number]-accounts-form
```

- [ ] **Paso 7.2: Crear `components/accounts/AccountMovementForm.tsx`**

```tsx
// components/accounts/AccountMovementForm.tsx
import { View, Text, Alert } from 'react-native'
import { useState } from 'react'
import { FormInput } from '@/components/ui/FormInput'
import { SelectModal } from '@/components/ui/SelectModal'
import { PrimaryButton } from '@/components/ui/PrimaryButton'
import { createAccountMovement } from '@/lib/actions/account_movements.actions'
import type { Account } from '@/types/database.types'

const CURRENCY_OPTIONS = [
  { label: 'COP - Peso Colombiano', value: 'COP' },
  { label: 'USD - Dólar', value: 'USD' },
  { label: 'VES - Bolívar (Bs)', value: 'VES' },
]

interface Props {
  userId: string
  accounts: Account[]
  onSuccess: () => void
}

const defaultForm = {
  from_account_id: '',
  from_amount: '',
  from_currency: 'COP',
  to_account_id: '',
  to_amount: '',
  to_currency: 'COP',
  description: '',
  date: new Date().toISOString().split('T')[0],
}

export function AccountMovementForm({ userId, accounts, onSuccess }: Props) {
  const [form, setForm] = useState(defaultForm)
  const [saving, setSaving] = useState(false)
  const [showFromCurrency, setShowFromCurrency] = useState(false)
  const [showToCurrency, setShowToCurrency] = useState(false)
  const [showFromAccount, setShowFromAccount] = useState(false)
  const [showToAccount, setShowToAccount] = useState(false)

  const accountOptions = accounts.map((a) => ({
    label: `${a.icon ?? '💳'} ${a.name} (${a.currency})`,
    value: a.id,
  }))
  const toAccountOptions = accountOptions.filter((o) => o.value !== form.from_account_id)

  async function handleSubmit() {
    if (!form.from_account_id || !form.to_account_id || !form.from_amount || !form.to_amount) {
      Alert.alert('Error', 'Completa todos los campos requeridos')
      return
    }
    setSaving(true)
    const result = await createAccountMovement(userId, {
      from_account_id: form.from_account_id,
      from_amount: parseFloat(form.from_amount),
      from_currency: form.from_currency as 'COP' | 'USD' | 'VES',
      to_account_id: form.to_account_id,
      to_amount: parseFloat(form.to_amount),
      to_currency: form.to_currency as 'COP' | 'USD' | 'VES',
      description: form.description || null,
      date: form.date,
    })
    if (result.success) {
      setForm(defaultForm)
      onSuccess()
    } else {
      Alert.alert('Error', result.error ?? 'Error al registrar movimiento')
    }
    setSaving(false)
  }

  const fromAccount = accounts.find((a) => a.id === form.from_account_id)
  const toAccount = accounts.find((a) => a.id === form.to_account_id)

  return (
    <View className="gap-0">
      {/* Cuenta origen */}
      <View className="mb-4">
        <Text className="text-muted text-sm mb-1">Cuenta origen *</Text>
        <View className="flex-row gap-2">
          <View className="flex-1">
            <View
              onTouchEnd={() => setShowFromAccount(true)}
              className="bg-surface border border-border rounded-xl px-4 py-3"
            >
              <Text className={fromAccount ? 'text-white' : 'text-muted'}>
                {fromAccount ? `${fromAccount.icon ?? '💳'} ${fromAccount.name}` : 'Seleccionar...'}
              </Text>
            </View>
          </View>
          <View
            onTouchEnd={() => setShowFromCurrency(true)}
            className="bg-surface border border-border rounded-xl px-3 py-3 justify-center"
          >
            <Text className="text-white font-medium">{form.from_currency}</Text>
          </View>
        </View>
      </View>

      <FormInput
        label="Monto enviado *"
        value={form.from_amount}
        onChangeText={(v) => setForm({ ...form, from_amount: v })}
        keyboardType="decimal-pad"
        placeholder="0.00"
      />

      {/* Cuenta destino */}
      <View className="mb-4">
        <Text className="text-muted text-sm mb-1">Cuenta destino *</Text>
        <View className="flex-row gap-2">
          <View className="flex-1">
            <View
              onTouchEnd={() => setShowToAccount(true)}
              className="bg-surface border border-border rounded-xl px-4 py-3"
            >
              <Text className={toAccount ? 'text-white' : 'text-muted'}>
                {toAccount ? `${toAccount.icon ?? '💳'} ${toAccount.name}` : 'Seleccionar...'}
              </Text>
            </View>
          </View>
          <View
            onTouchEnd={() => setShowToCurrency(true)}
            className="bg-surface border border-border rounded-xl px-3 py-3 justify-center"
          >
            <Text className="text-white font-medium">{form.to_currency}</Text>
          </View>
        </View>
      </View>

      <FormInput
        label="Monto recibido *"
        value={form.to_amount}
        onChangeText={(v) => setForm({ ...form, to_amount: v })}
        keyboardType="decimal-pad"
        placeholder="0.00"
      />

      <FormInput
        label="Descripción (opcional)"
        value={form.description}
        onChangeText={(v) => setForm({ ...form, description: v })}
        placeholder="Ej: Cambio de dólares"
      />

      <FormInput
        label="Fecha *"
        value={form.date}
        onChangeText={(v) => setForm({ ...form, date: v })}
        placeholder="YYYY-MM-DD"
        keyboardType="numeric"
      />

      <PrimaryButton
        onPress={handleSubmit}
        loading={saving}
        disabled={!form.from_account_id || !form.to_account_id || !form.from_amount || !form.to_amount}
      >
        Registrar Movimiento
      </PrimaryButton>

      <SelectModal visible={showFromAccount} onClose={() => setShowFromAccount(false)}
        title="Cuenta origen" options={accountOptions} selected={form.from_account_id}
        onSelect={(v) => { setForm({ ...form, from_account_id: v, to_account_id: form.to_account_id === v ? '' : form.to_account_id }); setShowFromAccount(false) }} />
      <SelectModal visible={showToAccount} onClose={() => setShowToAccount(false)}
        title="Cuenta destino" options={toAccountOptions} selected={form.to_account_id}
        onSelect={(v) => { setForm({ ...form, to_account_id: v }); setShowToAccount(false) }} />
      <SelectModal visible={showFromCurrency} onClose={() => setShowFromCurrency(false)}
        title="Moneda enviada" options={CURRENCY_OPTIONS} selected={form.from_currency}
        onSelect={(v) => { setForm({ ...form, from_currency: v }); setShowFromCurrency(false) }} />
      <SelectModal visible={showToCurrency} onClose={() => setShowToCurrency(false)}
        title="Moneda recibida" options={CURRENCY_OPTIONS} selected={form.to_currency}
        onSelect={(v) => { setForm({ ...form, to_currency: v }); setShowToCurrency(false) }} />
    </View>
  )
}
```

- [ ] **Paso 7.3: Crear `app/(dashboard)/accounts/[id].tsx`**

Esta screen sirve para crear (id=`new`) o editar (id=UUID) una cuenta. También incluye la lista de movimientos entre cuentas y el formulario para crear uno nuevo.

```tsx
// app/(dashboard)/accounts/[id].tsx
import {
  View, Text, ScrollView, TouchableOpacity, Alert,
  ActivityIndicator, SectionList,
} from 'react-native'
import { useState, useEffect, useCallback } from 'react'
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '@/context/AuthContext'
import {
  getAccountById, createAccount, updateAccount, deleteAccount, getAccounts,
} from '@/lib/actions/accounts.actions'
import {
  getAccountMovements, deleteAccountMovement,
} from '@/lib/actions/account_movements.actions'
import { FormInput } from '@/components/ui/FormInput'
import { SelectModal, type SelectOption } from '@/components/ui/SelectModal'
import { PrimaryButton } from '@/components/ui/PrimaryButton'
import { AccountMovementForm } from '@/components/accounts/AccountMovementForm'
import { formatCurrency } from '@/lib/utils/currency'
import type { Account, AccountMovementWithAccounts } from '@/types/database.types'

const CURRENCY_OPTIONS: SelectOption[] = [
  { label: 'COP - Peso Colombiano', value: 'COP' },
  { label: 'USD - Dólar', value: 'USD' },
  { label: 'VES - Bolívar (Bs)', value: 'VES' },
]

const TYPE_OPTIONS: SelectOption[] = [
  { label: '🏦 Banco', value: 'bank' },
  { label: '📱 Digital', value: 'digital' },
  { label: '₿ Crypto', value: 'crypto' },
  { label: '💵 Efectivo', value: 'cash' },
]

export default function AccountFormScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { user } = useAuth()
  const isNew = id === 'new'

  const [initialLoading, setInitialLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [allAccounts, setAllAccounts] = useState<Account[]>([])
  const [movements, setMovements] = useState<AccountMovementWithAccounts[]>([])
  const [showMovementForm, setShowMovementForm] = useState(false)

  const [name, setName] = useState('')
  const [type, setType] = useState('bank')
  const [currency, setCurrency] = useState('COP')
  const [balance, setBalance] = useState('0')
  const [color, setColor] = useState('#4F46E5')
  const [icon, setIcon] = useState('💳')

  const [showTypePicker, setShowTypePicker] = useState(false)
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false)

  useEffect(() => {
    if (!user) return
    getAccounts(user.id).then((res) => {
      if (res.success && res.data) setAllAccounts(res.data)
    })
    if (!isNew) {
      Promise.all([
        getAccountById(id, user.id),
        getAccountMovements(user.id),
      ]).then(([accRes, movRes]) => {
        if (accRes.success && accRes.data) {
          const a = accRes.data
          setName(a.name)
          setType(a.type)
          setCurrency(a.currency)
          setBalance(String(a.balance))
          setColor(a.color ?? '#4F46E5')
          setIcon(a.icon ?? '💳')
        }
        if (movRes.success && movRes.data) {
          // Mostrar solo movimientos de esta cuenta
          setMovements(
            movRes.data.filter(
              (m) => m.from_account_id === id || m.to_account_id === id
            )
          )
        }
        setInitialLoading(false)
      })
    }
  }, [user, id, isNew])

  const refreshMovements = useCallback(async () => {
    if (!user || isNew) return
    const res = await getAccountMovements(user.id)
    if (res.success && res.data) {
      setMovements(res.data.filter((m) => m.from_account_id === id || m.to_account_id === id))
    }
  }, [user, id, isNew])

  async function handleSubmit() {
    if (!user || !name.trim()) {
      Alert.alert('Error', 'El nombre es requerido')
      return
    }
    setSaving(true)
    const data = {
      name: name.trim(),
      type: type as 'bank' | 'digital' | 'crypto' | 'cash',
      currency: currency as 'COP' | 'USD' | 'VES',
      balance: parseFloat(balance) || 0,
      color: color || null,
      icon: icon || null,
    }
    const result = isNew
      ? await createAccount(user.id, data)
      : await updateAccount(id, user.id, data)

    if (result.success) {
      router.back()
    } else {
      Alert.alert('Error', result.error ?? 'Error al guardar')
    }
    setSaving(false)
  }

  function handleDelete() {
    if (!user || isNew) return
    Alert.alert('Eliminar cuenta', '¿Eliminar esta cuenta?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive',
        onPress: async () => {
          const result = await deleteAccount(id, user.id)
          if (result.success) {
            router.back()
          } else {
            Alert.alert('Error', result.error)
          }
        },
      },
    ])
  }

  async function handleDeleteMovement(movId: string) {
    if (!user) return
    Alert.alert('Eliminar movimiento', '¿Revertir este movimiento?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive',
        onPress: async () => {
          const result = await deleteAccountMovement(movId, user.id)
          if (result.success) {
            setMovements((prev) => prev.filter((m) => m.id !== movId))
            // Refresh account balance
            const accRes = await getAccountById(id, user.id)
            if (accRes.success && accRes.data) {
              setBalance(String(accRes.data.balance))
            }
          }
        },
      },
    ])
  }

  if (initialLoading) {
    return (
      <View className="flex-1 bg-bg items-center justify-center">
        <ActivityIndicator color="#4F46E5" />
      </View>
    )
  }

  const AccountForm = (
    <View>
      <FormInput label="Nombre *" value={name} onChangeText={setName} placeholder="Ej: Bancolombia" />

      {/* Tipo */}
      <View className="mb-4">
        <Text className="text-muted text-sm mb-1">Tipo</Text>
        <TouchableOpacity onPress={() => setShowTypePicker(true)} activeOpacity={0.7}
          className="bg-surface border border-border rounded-xl px-4 py-3">
          <Text className="text-white">
            {TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Moneda */}
      <View className="mb-4">
        <Text className="text-muted text-sm mb-1">Moneda</Text>
        <TouchableOpacity onPress={() => setShowCurrencyPicker(true)} activeOpacity={0.7}
          className="bg-surface border border-border rounded-xl px-4 py-3">
          <Text className="text-white">
            {CURRENCY_OPTIONS.find((o) => o.value === currency)?.label ?? currency}
          </Text>
        </TouchableOpacity>
      </View>

      {isNew && (
        <FormInput
          label="Balance inicial"
          value={balance}
          onChangeText={setBalance}
          keyboardType="decimal-pad"
          placeholder="0"
        />
      )}

      <FormInput label="Ícono (emoji)" value={icon} onChangeText={setIcon} placeholder="💳" />
      <FormInput label="Color (hex)" value={color} onChangeText={setColor} placeholder="#4F46E5" />

      <PrimaryButton onPress={handleSubmit} loading={saving} disabled={!name.trim()}>
        {isNew ? 'Crear Cuenta' : 'Guardar Cambios'}
      </PrimaryButton>
    </View>
  )

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-bg">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Text className="text-primary text-base">← Volver</Text>
        </TouchableOpacity>
        <Text className="text-white text-base font-bold">
          {isNew ? 'Nueva Cuenta' : name || 'Editar Cuenta'}
        </Text>
        {!isNew ? (
          <TouchableOpacity onPress={handleDelete} activeOpacity={0.7}>
            <Text className="text-red-400 text-sm">Eliminar</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 56 }} />
        )}
      </View>

      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingVertical: 16, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        {AccountForm}

        {/* Movimientos — solo en modo edición */}
        {!isNew && (
          <View className="mt-6">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-white text-base font-bold">Movimientos</Text>
              <TouchableOpacity
                onPress={() => setShowMovementForm(!showMovementForm)}
                activeOpacity={0.7}
                className="border border-primary rounded-lg px-3 py-1.5"
              >
                <Text className="text-primary text-sm">
                  {showMovementForm ? 'Cancelar' : '+ Nuevo'}
                </Text>
              </TouchableOpacity>
            </View>

            {showMovementForm && (
              <View className="bg-surface border border-border rounded-xl p-4 mb-4">
                <AccountMovementForm
                  userId={user!.id}
                  accounts={allAccounts}
                  onSuccess={() => {
                    setShowMovementForm(false)
                    refreshMovements()
                  }}
                />
              </View>
            )}

            {movements.length === 0 ? (
              <Text className="text-muted text-sm text-center py-4">Sin movimientos</Text>
            ) : (
              movements.map((mov) => {
                const isFrom = mov.from_account_id === id
                return (
                  <View
                    key={mov.id}
                    className="bg-surface border border-border rounded-xl p-3 mb-2"
                  >
                    <View className="flex-row justify-between items-start">
                      <View className="flex-1">
                        <Text className="text-white text-sm font-medium">
                          {isFrom
                            ? `→ ${mov.to_account?.name}`
                            : `← ${mov.from_account?.name}`}
                        </Text>
                        <Text className="text-muted text-xs mt-0.5">
                          {mov.description ?? ''} {mov.date}
                        </Text>
                      </View>
                      <View className="items-end ml-2">
                        <Text className={`font-bold text-sm ${isFrom ? 'text-red-400' : 'text-green-400'}`}>
                          {isFrom
                            ? `-${formatCurrency(mov.from_amount, mov.from_currency)}`
                            : `+${formatCurrency(mov.to_amount, mov.to_currency)}`}
                        </Text>
                        <TouchableOpacity
                          onPress={() => handleDeleteMovement(mov.id)}
                          activeOpacity={0.7}
                          className="mt-1"
                        >
                          <Text className="text-red-400 text-xs">Eliminar</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                )
              })
            )}
          </View>
        )}
      </ScrollView>

      <SelectModal
        visible={showTypePicker}
        onClose={() => setShowTypePicker(false)}
        title="Tipo de cuenta"
        options={TYPE_OPTIONS}
        selected={type}
        onSelect={(v) => { setType(v); setShowTypePicker(false) }}
      />
      <SelectModal
        visible={showCurrencyPicker}
        onClose={() => setShowCurrencyPicker(false)}
        title="Moneda"
        options={CURRENCY_OPTIONS}
        selected={currency}
        onSelect={(v) => { setCurrency(v); setShowCurrencyPicker(false) }}
      />
    </SafeAreaView>
  )
}
```

- [ ] **Paso 7.4: TypeScript check y PR**

```bash
cd /Users/sanghelgonzalez/Documents/projects/expense-manager-native && npx tsc --noEmit

git add .
git commit -m "feat: add account form screen with movements section"
git push -u origin feature/[issue-number]-accounts-form

gh pr create \
  --repo Sanghel/expense-manager-native \
  --base develop \
  --title "feat: add account form and movements section" \
  --body "- app/(dashboard)/accounts/[id].tsx: crear/editar + movimientos de la cuenta
- components/accounts/AccountMovementForm.tsx: formulario de movimiento entre cuentas

Closes #[issue-number]"

gh pr merge --squash --delete-branch --repo Sanghel/expense-manager-native
git checkout develop && git pull origin develop
```

---

### Task 8: PR FASE 3+4 → main

- [ ] **Paso 8.1: Crear issue y verificar build**

```bash
gh issue create \
  --repo Sanghel/expense-manager-native \
  --title "FASE 3+4: Release — Transacciones, Cuentas y Movimientos" \
  --body "PR de develop a main al finalizar FASE 3 y FASE 4."

# Verificar TypeScript limpio en develop
cd /Users/sanghelgonzalez/Documents/projects/expense-manager-native && npx tsc --noEmit
```

- [ ] **Paso 8.2: Crear PR FASE 3+4 → main**

```bash
gh pr create \
  --repo Sanghel/expense-manager-native \
  --base main \
  --head develop \
  --title "FASE 3+4: Transacciones, Cuentas y Movimientos entre cuentas" \
  --body "## Resumen
CRUD completo de transacciones y cuentas con movimientos diferenciados por moneda.

## Tareas completadas
### FASE 3 — Transacciones
- [x] Data layer: validaciones Zod + actions (CRUD + balance RPC)
- [x] UI primitivos: FormInput, SelectModal
- [x] Lista de transacciones con FlatList, pull-to-refresh
- [x] Formulario crear/editar con selector de categoría, cuenta y moneda

### FASE 4 — Cuentas
- [x] Data layer: validaciones + accounts.actions + account_movements.actions
- [x] Lista de cuentas con balance total por moneda
- [x] Formulario crear/editar cuenta
- [x] Sección de movimientos entre cuentas en la pantalla de cuenta

## Testing
- ✅ TypeScript: 0 errores"
```

⚠️ **DETENER — esperar aprobación del PR antes de continuar con Plan 3**

---

## Notas importantes para el implementador

### RPC de balances

Las funciones `increment_account_balance` y `decrement_account_balance` son RPCs de InsForge (funciones PostgreSQL). Si hay errores de permisos al llamarlas con el anon key, verificar con el usuario si las funciones tienen `SECURITY DEFINER` o necesitan ser actualizadas para permitir llamadas autenticadas con anon key.

### Routing con directorios

Al eliminar `transactions.tsx` y `accounts.tsx` y crear los directorios `transactions/` y `accounts/`, el Tab Navigator en `(dashboard)/_layout.tsx` NO necesita cambios — Expo Router resuelve automáticamente `name="transactions"` al directorio `transactions/index.tsx`.

### zod

`pnpm add zod` en Task 1 instala la librería una sola vez — no repetir en Tasks 5+.
