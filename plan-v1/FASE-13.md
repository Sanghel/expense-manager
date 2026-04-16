# FASE 13: Características Avanzadas

## 🎯 Objetivo

Implementar funcionalidades adicionales que mejoran la experiencia del usuario: gastos recurrentes, metas de ahorro, etiquetas, y adjuntos.

---

## 📋 Tareas Principales

### 13.1: Gastos Recurrentes

**Issue:** "Implementar sistema de transacciones recurrentes"

**Crear tabla (en InsForge con MCP):**

```sql
recurring_transactions:
  - id (uuid, PK)
  - user_id (uuid, FK)
  - amount (numeric)
  - currency (text)
  - type (text)
  - category_id (uuid, FK)
  - description (text)
  - frequency (text) -- 'daily', 'weekly', 'monthly', 'yearly'
  - start_date (date)
  - end_date (date, nullable)
  - is_active (boolean)
  - last_generated (date, nullable)
  - created_at (timestamptz)
```

**Componentes:**

- `RecurringTransactionForm.tsx` - Crear gasto recurrente
- `RecurringTransactionsList.tsx` - Lista de recurrentes
- Server Action para generar transacciones automáticamente

**Lógica:**

- Cron job o verificación al login
- Generar transacciones basadas en frecuencia
- Marcar fecha de última generación

---

### 13.2: Metas de Ahorro

**Issue:** "Implementar sistema de metas de ahorro"

**Crear tabla:**

```sql
savings_goals:
  - id (uuid, PK)
  - user_id (uuid, FK)
  - name (text)
  - target_amount (numeric)
  - current_amount (numeric) DEFAULT 0
  - currency (text)
  - deadline (date, nullable)
  - is_completed (boolean) DEFAULT false
  - created_at (timestamptz)
```

**Componentes:**

- `SavingsGoalForm.tsx` - Crear meta
- `SavingsGoalCard.tsx` - Tarjeta con progreso
- `SavingsGoalsGrid.tsx` - Grid de metas

**Funcionalidad:**

- Progreso visual (progress bar)
- Agregar dinero a la meta
- Marcar como completada
- Widget en dashboard

---

### 13.3: Sistema de Etiquetas

**Issue:** "Agregar sistema de etiquetas a transacciones"

**Crear tabla:**

```sql
tags:
  - id (uuid, PK)
  - user_id (uuid, FK)
  - name (text)
  - color (text)
  - created_at (timestamptz)

transaction_tags:
  - transaction_id (uuid, FK)
  - tag_id (uuid, FK)
  - PRIMARY KEY (transaction_id, tag_id)
```

**Componentes:**

- `TagInput.tsx` - Input con autocompletado
- `TagBadge.tsx` - Badge para mostrar tags
- Filtro por tags en transacciones

---

### 13.4: Adjuntar Recibos (Imágenes)

**Issue:** "Permitir adjuntar imágenes a transacciones"

**Actualizar tabla transactions:**

```sql
ALTER TABLE transactions ADD COLUMN receipt_url text;
```

**Componentes:**

- `ImageUpload.tsx` - Componente de upload
- Integración con InsForge Storage (S3)

**Server Action:**

```typescript
async function uploadReceipt(file: File, userId: string) {
  const { data, error } = await insforge.storage
    .from('receipts')
    .upload(`${userId}/${Date.now()}_${file.name}`, file)

  if (error) throw error
  return data.path
}
```

**Funcionalidad:**

- Upload al crear/editar transacción
- Preview de imagen
- Eliminar adjunto

---

### 13.5: Notas y Comentarios

**Issue:** "Mejorar sistema de notas en transacciones"

**Componentes:**

- `NotesEditor.tsx` - Textarea con formato
- Soporte para markdown (opcional)
- Preview de notas en lista

---

### 13.6: Calendario de Pagos

**Issue:** "Crear vista de calendario para transacciones"

**Componentes:**

- `TransactionCalendar.tsx` - Calendario mensual
- Integrar con `react-big-calendar` o similar
- Mostrar transacciones por día
- Click en día para ver detalles

---

### 13.7: Página de Configuración

**Issue:** "Crear página de configuración de usuario"

`app/(dashboard)/settings/page.tsx`:

**Secciones:**

- Perfil del usuario (nombre, avatar)
- Moneda preferida
- Notificaciones (email, push)
- Tema (light/dark)
- Exportar datos
- Eliminar cuenta

---

### 13.8: Exportar Datos

**Issue:** "Implementar exportación de datos"

**Server Action:**

```typescript
async function exportTransactions(userId: string, format: 'csv' | 'json') {
  const transactions = await getTransactions(userId, 10000)

  if (format === 'csv') {
    return convertToCSV(transactions)
  }
  return JSON.stringify(transactions, null, 2)
}
```

**Componentes:**

- Botón "Exportar a CSV"
- Botón "Exportar a JSON"
- Descarga automática del archivo

---

## 🎯 Fin de Fase 13

### Verificación

```bash
pnpm build
pnpm type-check
```

**Checklist:**

- [ ] ✅ Gastos recurrentes funcionando
- [ ] ✅ Metas de ahorro creadas
- [ ] ✅ Sistema de etiquetas implementado
- [ ] ✅ Upload de recibos funcional
- [ ] ✅ Notas mejoradas
- [ ] ✅ Calendario de pagos
- [ ] ✅ Página de configuración
- [ ] ✅ Exportación de datos

---

### PR Final

```bash
gh pr create \
  --base main \
  --head develop \
  --title "FASE 13: Características Avanzadas" \
  --body "Implementadas funcionalidades avanzadas:
- Gastos recurrentes
- Metas de ahorro
- Sistema de etiquetas
- Adjuntar recibos
- Calendario de pagos
- Configuración de usuario
- Exportación de datos

Closes #[issue-number]"
```

**🛑 DETENER - 📢 NOTIFICAR - ⏸️ ESPERAR**

---

**¡FASE 13 COMPLETADA! 🎉**

Continuar con: **FASE-14.md**
