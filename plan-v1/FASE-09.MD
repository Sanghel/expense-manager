# FASE 09: Conversión de Monedas

## 🎯 Objetivo

Sistema de conversión entre COP, USD, BOB con tasas actualizables.

## 📋 Tareas Principales

### 9.1: Seed de tasas de cambio iniciales

Insertar tasas en tabla `exchange_rates`:

- USD/COP: 4000
- BOB/COP: 580
- USD/BOB: 6.9
  (Valores aproximados para testing)

### 9.2: Componente selector de moneda

- Dropdown para seleccionar moneda preferida
- Guardar en `users.preferred_currency`

### 9.3: Conversión automática en formularios

- Al crear transacción, mostrar equivalente en otras monedas
- Usar `convertCurrency` action

### 9.4: Vista multi-moneda en dashboard

- Mostrar balance en COP, USD, BOB simultáneamente
- Usar moneda preferida como principal

### 9.5: Actualizar tasas de cambio

- Formulario admin para actualizar tasas
- Opcional: integrar API externa (fixer.io, exchangerate-api)

## 🎯 Fin de Fase

```bash
gh pr create --base main --head develop --title "FASE 09: Conversión de Monedas"
```

**🛑 DETENER - 📢 NOTIFICAR - ⏸️ ESPERAR**
