# FASE 10: Chat IA para Registro de Gastos

## 🎯 Objetivo

Interfaz de chat donde el usuario escribe gastos en lenguaje natural y Claude API los categoriza automáticamente.

## 📋 Tareas Principales

### 10.1: Server Action para categorización IA

Crear `lib/actions/ai.actions.ts`:

```typescript
'use server'

export async function categorizePurchase(text: string, categories: any[]) {
  const prompt = `
Usuario escribió: "${text}"

Categorías disponibles:
${categories.map((c) => `- ${c.name} (${c.type})`).join('\n')}

Extrae:
- amount (número)
- description (texto descriptivo)
- category_id (del listado)
- type (income o expense)

Responde solo JSON.
`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  const data = await response.json()
  const parsed = JSON.parse(data.content[0].text)

  return { success: true, data: parsed }
}
```

### 10.2: Componente de Chat

Crear `components/chat/ChatInterface.tsx`:

- Input de texto para escribir gasto
- Historial de conversación
- Preview de transacción antes de guardar
- Botón confirmar/editar

### 10.3: Página de Chat

`app/(dashboard)/chat/page.tsx`:

- Integrar ChatInterface
- Cargar categorías
- Llamar a categorización IA
- Crear transacción al confirmar

### 10.4: Mejoras del prompt

- Detectar moneda (si dice "50 dólares" → USD)
- Detectar fecha ("ayer", "la semana pasada")
- Manejar múltiples gastos en un mensaje

### 10.5: Historial de conversación

- Guardar mensajes en localStorage
- Mostrar sugerencias basadas en historial

## 🎯 Fin de Fase

```bash
gh pr create --base main --head develop --title "FASE 10: Chat IA"
```

**🛑 DETENER - 📢 NOTIFICAR - ⏸️ ESPERAR**
