# FASE 12: Sistema de Presupuestos

## 🎯 Objetivo

Crear, gestionar y monitorear presupuestos por categoría con alertas visuales.

## 📋 Tareas Principales

### 12.1: Formulario de presupuesto

Crear `components/budgets/BudgetForm.tsx`:

- Seleccionar categoría
- Monto del presupuesto
- Periodo (monthly/yearly)
- Fecha de inicio

### 12.2: Lista de presupuestos

Mostrar todos los presupuestos del usuario con:

- Progreso visual (progress bar)
- Porcentaje gastado
- Monto restante
- Alerta si se excede

### 12.3: Indicadores de progreso

```typescript
// components/budgets/BudgetProgress.tsx
const percentage = (spent / budgetAmount) * 100

<Progress
  value={percentage}
  colorScheme={percentage > 100 ? 'red' : percentage > 80 ? 'yellow' : 'green'}
/>
```

### 12.4: Alertas de exceso

Cuando `spent > budgetAmount`:

- Badge rojo "Excedido"
- Notificación en dashboard

### 12.5: Página de Presupuestos

`app/(dashboard)/budgets/page.tsx`:

- Grid de presupuestos
- Botón crear nuevo
- Editar/Eliminar presupuestos
- Resumen general

### 12.6: Widget en Dashboard

Agregar widget "Presupuestos del Mes" en dashboard principal:

- Top 3 presupuestos más cercanos al límite
- Link a página completa

## 🎯 Fin de Fase

```bash
gh pr create --base main --head develop --title "FASE 12: Sistema de Presupuestos"
```

**🛑 DETENER - 📢 NOTIFICAR - ⏸️ ESPERAR**

---

**¡FASES 1-12 COMPLETADAS! 🎉**

Con estas 12 fases tienes el MVP completo funcional:

- ✅ Autenticación
- ✅ Base de datos
- ✅ Dashboard
- ✅ Transacciones CRUD
- ✅ Categorías
- ✅ Conversión de monedas
- ✅ Chat IA
- ✅ Gráficos
- ✅ Presupuestos

**Siguiente:** Fases opcionales (13-17) para pulir, optimizar y deployer.
