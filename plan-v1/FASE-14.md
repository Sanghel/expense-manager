# FASE 14: Optimización y Performance

## 🎯 Objetivo

Optimizar la aplicación para mejorar rendimiento, reducir bundle size, y mejorar la experiencia del usuario.

---

## 📋 Tareas Principales

### 14.1: React.memo y optimización de re-renders

**Issue:** "Optimizar re-renders con React.memo"

**Identificar componentes:**

- Componentes que se renderizan frecuentemente sin cambios
- Listas largas (transacciones, categorías)
- Componentes pesados (gráficos)

**Implementar:**

```typescript
// components/transactions/TransactionCard.tsx
export const TransactionCard = React.memo(
  ({ transaction, onUpdate }) => {
    // ...
  },
  (prevProps, nextProps) => {
    return prevProps.transaction.id === nextProps.transaction.id
  }
)

// components/charts/MonthlyTrendChart.tsx
export const MonthlyTrendChart = React.memo(({ data }) => {
  // ...
})
```

---

### 14.2: useMemo y useCallback

**Issue:** "Optimizar cálculos y funciones con hooks"

**Implementar:**

```typescript
// hooks/useFinancialSummary.ts
const summary = useMemo(() => {
  return calculateSummary(transactions)
}, [transactions])

// components/TransactionsList.tsx
const handleDelete = useCallback(
  (id: string) => {
    deleteTransaction(id, userId)
  },
  [userId]
)
```

---

### 14.3: Lazy Loading de Componentes

**Issue:** "Implementar lazy loading de rutas"

**Implementar:**

```typescript
// app/(dashboard)/reports/page.tsx
import dynamic from 'next/dynamic'

const ExpensesByCategoryChart = dynamic(
  () => import('@/components/charts/ExpensesByCategoryChart'),
  { loading: () => <Spinner /> }
)

const MonthlyComparisonChart = dynamic(
  () => import('@/components/charts/MonthlyComparisonChart'),
  { ssr: false }
)
```

---

### 14.4: Optimización de Queries a InsForge

**Issue:** "Optimizar queries a la base de datos"

**Implementar:**

- Paginación en lugar de fetch all
- Seleccionar solo campos necesarios
- Usar índices en columnas frecuentes
- Cache de datos estáticos (categorías predefinidas)

```typescript
// Antes
const { data } = await insforge.from('transactions').select('*')

// Después
const { data } = await insforge
  .from('transactions')
  .select('id, amount, description, date, category_id')
  .range(0, 49) // Primeros 50
```

**Crear índices en InsForge:**

```sql
CREATE INDEX idx_transactions_user_date ON transactions(user_id, date DESC);
CREATE INDEX idx_transactions_category ON transactions(category_id);
```

---

### 14.5: Caché con React Query (opcional)

**Issue:** "Implementar caching de datos"

**Si decides usar React Query:**

```bash
pnpm add @tanstack/react-query
```

```typescript
// hooks/useTransactions.ts
import { useQuery } from '@tanstack/react-query'

export function useTransactions(userId: string) {
  return useQuery({
    queryKey: ['transactions', userId],
    queryFn: () => getTransactions(userId),
    staleTime: 5 * 60 * 1000, // 5 minutos
  })
}
```

---

### 14.6: Optimización de Imágenes

**Issue:** "Optimizar carga de imágenes"

**Implementar:**

- Usar Next.js Image component
- Lazy loading de imágenes
- Formatos modernos (WebP)

```typescript
import Image from 'next/image'

<Image
  src={receiptUrl}
  alt="Recibo"
  width={300}
  height={400}
  loading="lazy"
  placeholder="blur"
/>
```

---

### 14.7: Code Splitting y Bundle Analysis

**Issue:** "Analizar y reducir bundle size"

**Analizar bundle:**

```bash
pnpm add -D @next/bundle-analyzer
```

```javascript
// next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer({
  // config
})
```

**Ejecutar análisis:**

```bash
ANALYZE=true pnpm build
```

**Acciones:**

- Identificar dependencias pesadas
- Reemplazar librerías grandes por alternativas
- Tree-shaking de código no usado

---

### 14.8: Virtualización de Listas

**Issue:** "Implementar virtualización para listas largas"

**Para listas de >100 items:**

```bash
pnpm add react-window
```

```typescript
import { FixedSizeList } from 'react-window'

<FixedSizeList
  height={600}
  itemCount={transactions.length}
  itemSize={60}
  width="100%"
>
  {({ index, style }) => (
    <div style={style}>
      <TransactionCard transaction={transactions[index]} />
    </div>
  )}
</FixedSizeList>
```

---

### 14.9: Debouncing de Búsquedas

**Issue:** "Optimizar búsquedas con debouncing"

```typescript
import { useDebouncedValue } from '@/hooks/useDebounce'

function SearchBar() {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 300)

  useEffect(() => {
    // Buscar solo después de 300ms sin escribir
    searchTransactions(debouncedSearch)
  }, [debouncedSearch])
}
```

---

### 14.10: Prefetching de Datos

**Issue:** "Prefetch de datos en navegación"

```typescript
// En links de navegación
import { useRouter } from 'next/navigation'

const router = useRouter()

<Link
  href="/transactions"
  onMouseEnter={() => router.prefetch('/transactions')}
>
  Transacciones
</Link>
```

---

### 14.11: Reducir JavaScript en Cliente

**Issue:** "Minimizar JS del lado del cliente"

- Usar Server Components donde sea posible
- Mover lógica a Server Actions
- Evitar librerías pesadas en cliente

---

### 14.12: Performance Monitoring

**Issue:** "Implementar monitoreo de performance"

**Usar Web Vitals:**

```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

**Medir Core Web Vitals:**

- LCP (Largest Contentful Paint)
- FID (First Input Delay)
- CLS (Cumulative Layout Shift)

---

## 🎯 Fin de Fase 14

### Verificación

**Métricas a verificar:**

```bash
# Build de producción
pnpm build

# Analizar bundle
ANALYZE=true pnpm build

# Lighthouse audit
pnpm build && pnpm start
# Abrir DevTools > Lighthouse > Run audit
```

**Checklist:**

- [ ] ✅ React.memo implementado
- [ ] ✅ useMemo/useCallback optimizado
- [ ] ✅ Lazy loading implementado
- [ ] ✅ Queries optimizadas
- [ ] ✅ Bundle size reducido
- [ ] ✅ Imágenes optimizadas
- [ ] ✅ Listas virtualizadas (si aplica)
- [ ] ✅ Debouncing implementado
- [ ] ✅ Lighthouse score > 90

**Objetivos de Performance:**

- Lighthouse Performance: >90
- First Contentful Paint: <1.5s
- Time to Interactive: <3s
- Bundle size: <500KB (gzipped)

---

### PR Final

```bash
gh pr create \
  --base main \
  --head develop \
  --title "FASE 14: Optimización y Performance" \
  --body "Optimizaciones implementadas:
- React.memo en componentes clave
- useMemo/useCallback
- Lazy loading de componentes
- Queries optimizadas
- Bundle analysis y reducción
- Virtualización de listas
- Debouncing
- Performance monitoring

Lighthouse Score: [score]
Bundle Size: [size]

Closes #[issue-number]"
```

**🛑 DETENER - 📢 NOTIFICAR - ⏸️ ESPERAR**

---

**¡FASE 14 COMPLETADA! 🎉**

Continuar con: **FASE-15.md**
