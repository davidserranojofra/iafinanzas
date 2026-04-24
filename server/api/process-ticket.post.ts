import Groq from 'groq-sdk'

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

export default defineEventHandler(async (event) => {
  const { groqApiKey } = useRuntimeConfig(event)

  const groq = new Groq({ apiKey: groqApiKey })

  const form = await readMultipartFormData(event)
  const imageField = form?.find(f => f.name === 'image')
  if (!imageField?.data) {
    throw createError({ statusCode: 400, message: 'Se requiere una imagen en el campo "image"' })
  }

  const mimeType = (imageField.type ?? 'image/jpeg').split(';')[0]
  const base64 = Buffer.from(imageField.data).toString('base64')

  try {
    const response = await groq.chat.completions.create({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: EXTRACTION_PROMPT },
            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } },
          ],
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0,
    })

    const text = response.choices[0]?.message?.content?.trim()
    if (!text) throw createError({ statusCode: 500, message: 'La IA no devolvió datos.' })
    return JSON.parse(text)
  }
  catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[process-ticket] Groq error:', msg)
    if (msg.includes('429') || msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('rate')) {
      throw createError({ statusCode: 429, message: 'Límite de la API alcanzado. Esperá un minuto e intentá de nuevo.' })
    }
    throw createError({ statusCode: 500, message: `Error al procesar la imagen con IA. (${msg})` })
  }
})
