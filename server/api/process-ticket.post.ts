import { GoogleGenAI } from '@google/genai'

const EXTRACTION_PROMPT = `
Sos un sistema especializado en extracción de datos de tickets y facturas.
Analizá la imagen del ticket y devolvé ÚNICAMENTE un objeto JSON válido con exactamente estas claves:

- comercio: nombre del comercio o establecimiento (string)
- fecha: fecha de la compra en formato YYYY-MM-DD (string)
- total: importe total pagado como número decimal (number)
- categoria: categoría del gasto — elegí una de: "alimentación", "transporte", "salud", "tecnología", "ropa", "hogar", "entretenimiento", "restaurante", "otro"
- notas: observaciones relevantes del ticket, o null si no hay nada relevante (string | null)
- metodo_pago: medio de pago detectado — elegí uno de: "efectivo", "tarjeta_debito", "tarjeta_credito", "transferencia", "desconocido"

Reglas estrictas:
1. Devolvé SOLO el JSON. Sin markdown, sin bloques de código, sin explicaciones.
2. Si un dato no está visible o no podés determinarlo con certeza, usá null.
3. El campo "total" debe ser un número (no un string).
4. La fecha siempre en formato YYYY-MM-DD.
`.trim()

const TICKET_SCHEMA = {
  type: 'object',
  properties: {
    comercio: { type: 'string' },
    fecha: { type: 'string' },
    total: { type: 'number' },
    categoria: {
      type: 'string',
      enum: ['alimentación', 'transporte', 'salud', 'tecnología', 'ropa', 'hogar', 'entretenimiento', 'restaurante', 'otro'],
    },
    notas: { type: 'string', nullable: true },
    metodo_pago: {
      type: 'string',
      enum: ['efectivo', 'tarjeta_debito', 'tarjeta_credito', 'transferencia', 'desconocido'],
    },
  },
  required: ['comercio', 'fecha', 'total', 'categoria', 'notas', 'metodo_pago'],
}

// Foto en duro para pruebas — ticket suizo de Wikimedia Commons
const TEST_IMAGE_URL = 'https://upload.wikimedia.org/wikipedia/commons/0/0b/ReceiptSwiss.jpg'

export default defineEventHandler(async (event) => {
  const { geminiApiKey } = useRuntimeConfig(event)

  const ai = new GoogleGenAI({ apiKey: geminiApiKey })

  const imageRes = await fetch(TEST_IMAGE_URL)
  if (!imageRes.ok) {
    throw createError({ statusCode: 502, message: 'No se pudo obtener la imagen de prueba' })
  }

  const mimeType = (imageRes.headers.get('content-type') ?? 'image/jpeg').split(';')[0]
  const buffer = await imageRes.arrayBuffer()
  const base64 = Buffer.from(buffer).toString('base64')

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: [
      {
        role: 'user',
        parts: [
          { text: EXTRACTION_PROMPT },
          { inlineData: { mimeType, data: base64 } },
        ],
      },
    ],
    config: {
      responseMimeType: 'application/json',
      responseSchema: TICKET_SCHEMA,
    },
  })

  return JSON.parse(response.text ?? '{}')
})
