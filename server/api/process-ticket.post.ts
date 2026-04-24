import Groq from 'groq-sdk'

const EXTRACTION_PROMPT = `
Eres un sistema especializado en extracción de datos de tickets y facturas.
Analizá la imagen del ticket y devolvé ÚNICAMENTE un objeto JSON válido con exactamente estas claves:

- comercio: nombre del comercio o establecimiento (string)
- fecha: fecha de la compra en formato YYYY-MM-DD (string)
- total: importe total pagado como número decimal (number)
- categoria: categoría del gasto — elegí una de: "alimentación", "transporte", "salud", "tecnología", "ropa", "hogar", "entretenimiento", "restaurante", "otro"
- iva: importe del IVA si aparece explícitamente en el ticket como número decimal, o null si no está indicado (number | null)
- notas: redactá una frase corta y natural describiendo la compra (ej: "Compra de supermercado con varios productos frescos" o "Cena en restaurante para dos personas"). Nunca dejes este campo en null. (string)
- metodo_pago: medio de pago detectado — elegí uno de: "efectivo", "tarjeta_debito", "tarjeta_credito", "transferencia", "desconocido"
- items: array con cada producto o línea del ticket. Cada elemento tiene:
    - nombre: descripción del producto (string)
    - precio: precio unitario como número decimal (number)
    - cantidad: unidades compradas (number, por defecto 1 si no se especifica)
  Si el ticket no tiene desglose de productos, devolvé un array vacío [].

Reglas estrictas:
1. Devolvé SOLO el JSON. Sin markdown, sin bloques de código, sin explicaciones.
2. Si un dato no está visible o no podés determinarlo con certeza, usá null.
3. El campo "total" debe ser un número (no un string).
4. La fecha siempre en formato YYYY-MM-DD.
5. Los precios de "items" deben ser números, nunca strings.
`.trim()

export default defineEventHandler(async (event) => {
    const {groqApiKey} = useRuntimeConfig(event)

    const groq = new Groq({apiKey: groqApiKey})

    const form = await readMultipartFormData(event)
    const imageField = form?.find((f) => f.name === 'image')
    if (!imageField?.data) {
        throw createError({statusCode: 400, message: 'Se requiere una imagen en el campo "image"'})
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
                        {type: 'text', text: EXTRACTION_PROMPT},
                        {type: 'image_url', image_url: {url: `data:${mimeType};base64,${base64}`}},
                    ],
                },
            ],
            response_format: {type: 'json_object'},
            temperature: 0,
        })

        const text = response.choices[0]?.message?.content?.trim()
        if (!text) throw createError({statusCode: 500, message: 'La IA no devolvió datos.'})
        return JSON.parse(text)
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        console.error('[process-ticket] Groq error:', msg)
        if (msg.includes('429') || msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('rate')) {
            throw createError({
                statusCode: 429,
                message: 'Límite de la API alcanzado. Esperá un minuto e intentá de nuevo.',
            })
        }
        throw createError({statusCode: 500, message: `Error al procesar la imagen con IA. (${msg})`})
    }
})
