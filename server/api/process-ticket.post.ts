import Groq from 'groq-sdk'
import { serverSupabaseUser } from '#supabase/server'

const MODELOS_IA_PERMITIDOS = [
    'meta-llama/llama-4-scout-17b-16e-instruct',
    'llama-3.2-11b-vision-preview',
    'llama-3.2-90b-vision-preview'
]

const EXTRACTION_PROMPT = `
Eres un sistema especializado en extracción de datos de tickets y facturas.
Analizá la imagen del ticket y devolvé ÚNICAMENTE un objeto JSON válido con exactamente estas claves:

- comercio: nombre del comercio o establecimiento (string)
- fecha: fecha de la compra en formato YYYY-MM-DD (string). Prestá especial atención a etiquetas de fecha en otros idiomas como "data" (en catalán), "date" (en inglés) o "fecha" (en español). Si el año se expresa con dos dígitos (por ejemplo, "26" o "/26"), correspondé al año 2026. El año de referencia actual es 2026.
- total: importe total pagado como número decimal (number)
- categoria: categoría del gasto — elegí una de: "alimentación", "transporte", "salud", "tecnología", "ropa", "hogar", "entretenimiento", "restaurante", "cuidado_personal", "otro"
- iva: importe del IVA si aparece explícitamente en el ticket como número decimal, o null si no está indicado (number | null)
- notas: redactá una frase corta y natural describiendo la compra (ej: "Compra de supermercado con varios productos frescos" o "Cena en restaurante para dos personas"). Nunca dejes este campo en null. (string)
- metodo_pago: medio de pago detectado — elegí uno de: "efectivo", "tarjeta_debito", "tarjeta_credito", "transferencia", "desconocido"
- confianza: tu nivel de certeza/seguridad general sobre la extracción de datos de este ticket como un número decimal entre 0.0 y 1.0 (number)
- items: array con cada producto o línea del ticket. Cada elemento tiene:
    - nombre: descripción del producto (string)
    - precio: precio unitario como número decimal (number)
    - cantidad: unidades compradas (number, por defecto 1 si no se especifica)
  Si el ticket no tiene desglose de productos, devolvé un array vacío [].

Reglas estrictas:
1. Devolvé SOLO el JSON. Sin markdown, sin bloques de código, sin explicaciones.
2. Si un dato no está visible o no podés determinarlo con certeza, usá null.
3. El campo "total" debe ser un número (no un string).
4. La fecha siempre en formato YYYY-MM-DD. Si aparece "data: 20/06/26" o similar, recordá que "data" significa fecha en catalán y "26" representa el año 2026. Evitá a toda costa extraer años incorrectos (como 2024).
5. Los precios de "items" deben ser números, nunca strings.
`.trim()

export default defineEventHandler(async (event) => {
    // 1. Validar autenticación
    const user = await serverSupabaseUser(event)
    if (!user) {
        throw createError({ statusCode: 401, message: 'No autorizado. Debes iniciar sesión.' })
    }

    // 2. Prevenir DoS por tamaño de payload
    const contentLength = getHeader(event, 'content-length')
    if (contentLength && parseInt(contentLength) > 7 * 1024 * 1024) {
        throw createError({ statusCode: 413, message: 'El archivo es demasiado grande. Límite: 7MB.' })
    }

    // 3. Validar modelo de IA solicitado
    const selectedModel = getHeader(event, 'x-ia-model') || 'meta-llama/llama-4-scout-17b-16e-instruct'
    if (!MODELOS_IA_PERMITIDOS.includes(selectedModel)) {
        throw createError({ statusCode: 400, message: 'Modelo de IA no permitido.' })
    }

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
            model: selectedModel,
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
