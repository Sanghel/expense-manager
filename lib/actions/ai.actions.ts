'use server'

import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export interface CategorizedTransaction {
  amount: number
  description: string
  category_id: string
  type: 'income' | 'expense'
  currency: 'COP' | 'USD' | 'VES'
  date: string
}

export interface CategorizePurchaseResult {
  success: true
  data: CategorizedTransaction
}

export interface CategorizePurchaseError {
  success: false
  error: string
}

export async function categorizePurchase(
  text: string,
  categories: { id: string; name: string; type: string }[]
): Promise<CategorizePurchaseResult | CategorizePurchaseError> {
  try {
    const today = new Date().toISOString().split('T')[0]

    const prompt = `El usuario escribió: "${text}"

Categorías disponibles:
${categories.map((c) => `- ID: ${c.id} | Nombre: ${c.name} | Tipo: ${c.type}`).join('\n')}

Fecha actual: ${today}

Responde ÚNICAMENTE con un JSON válido (sin markdown, sin explicaciones).

Si el mensaje describe un gasto o ingreso, responde:
{
  "valid": true,
  "amount": <número positivo>,
  "description": "<descripción breve y clara del gasto/ingreso>",
  "category_id": "<id de la categoría más apropiada del listado>",
  "type": "<'income' o 'expense'>",
  "currency": "<'COP', 'USD' o 'VES' - detecta según el contexto: 'dólares'/'USD'/'$' → USD, 'bolívares'/'VES'/'Bs' → VES, por defecto COP>",
  "date": "<fecha en formato YYYY-MM-DD - 'ayer' → día anterior, 'la semana pasada' → lunes anterior, si no se menciona usa la fecha actual>"
}

Si el mensaje NO describe un gasto ni un ingreso, responde:
{
  "valid": false,
  "message": "<mensaje breve y amigable explicando que solo puedes registrar transacciones>"
}`

    const response = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    })

    const textContent = response.content.find((b) => b.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      return { success: false, error: 'No se recibió respuesta del modelo' }
    }

    const clean = textContent.text.trim().replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
    const parsed = JSON.parse(clean) as CategorizedTransaction & { valid: boolean; message?: string }

    if (!parsed.valid) {
      return { success: false, error: parsed.message ?? 'Solo puedo ayudarte a registrar gastos e ingresos.' }
    }

    return { success: true, data: parsed }
  } catch (error) {
    console.error('AI categorization error:', error)
    if (error instanceof SyntaxError) {
      return { success: false, error: 'El modelo no devolvió un JSON válido' }
    }
    return { success: false, error: 'Error al procesar con IA' }
  }
}
