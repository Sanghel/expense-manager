# FASE 11: Visualización de Datos (Gráficos Avanzados)

## 🎯 Objetivo

Crear página de reportes con múltiples gráficos interactivos.

## 📋 Tareas Principales

### 11.1: Gráfico de gastos por categoría (Pie/Donut)

```typescript
// components/charts/ExpensesByCategoryChart.tsx
<PieChart>
  <Pie data={expensesByCategory} dataKey="value" nameKey="name" />
</PieChart>
```

### 11.2: Gráfico de comparación mensual (Barras)

Comparar ingresos vs gastos por mes en gráfico de barras.

### 11.3: Gráfico de balance acumulado (Área)

Mostrar evolución del balance a lo largo del tiempo.

### 11.4: Filtros de visualización

- Selector de rango de fechas
- Filtro por categoría
- Filtro por tipo (income/expense)
- Exportar gráfico como imagen (opcional)

### 11.5: Página de Reportes

Crear `app/(dashboard)/reports/page.tsx`:

- Grid con todos los gráficos
- Controles de filtros
- Estadísticas clave

## 🎯 Fin de Fase

```bash
gh pr create --base main --head develop --title "FASE 11: Visualización de Datos"
```

**🛑 DETENER - 📢 NOTIFICAR - ⏸️ ESPERAR**
