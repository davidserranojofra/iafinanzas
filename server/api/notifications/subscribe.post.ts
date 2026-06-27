import { serverSupabaseClient } from '#supabase/server'

const DOMINIOS_PUSH_PERMITIDOS = [
  'android.googleapis.com',
  'fcm.googleapis.com',
  'updates.push.services.mozilla.com',
  'updates-autopush.stage.mozaws.net',
  'updates-autopush.prod.mozaws.net',
  'apple.com',
  'push.apple.com',
  'notify.windows.com'
]

function esSuscripcionValida(sub: any): boolean {
  if (!sub || typeof sub !== 'object') return false
  if (typeof sub.endpoint !== 'string') return false
  if (!sub.keys || typeof sub.keys !== 'object') return false
  if (typeof sub.keys.p256dh !== 'string' || !sub.keys.p256dh.trim()) return false
  if (typeof sub.keys.auth !== 'string' || !sub.keys.auth.trim()) return false

  try {
    const url = new URL(sub.endpoint)
    if (url.protocol !== 'https:') return false
    const hostname = url.hostname.toLowerCase()
    return DOMINIOS_PUSH_PERMITIDOS.some(dom => 
      hostname === dom || hostname.endsWith('.' + dom)
    )
  } catch {
    return false
  }
}

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Sesión inválida o expirada.' })
  }

  const body = await readBody<{ subscription?: any }>(event)
  const subscription = body?.subscription

  if (!esSuscripcionValida(subscription)) {
    throw createError({ statusCode: 400, statusMessage: 'Se requiere una suscripción push válida.' })
  }

  // Verificar si la suscripción con este endpoint exacto ya existe para el usuario
  const { data: existente, error: selectError } = await supabase
    .from('push_subscriptions')
    .select('id')
    .eq('user_id', user.id)
    .eq('subscription->>endpoint', subscription.endpoint)
    .maybeSingle()

  if (selectError) {
    throw createError({ statusCode: 500, statusMessage: selectError.message })
  }

  if (existente) {
    return { success: true, message: 'Suscripción ya registrada.' }
  }

  // Insertar la nueva suscripción
  const { error: insertError } = await supabase
    .from('push_subscriptions')
    .insert({
      user_id: user.id,
      subscription: subscription
    })

  if (insertError) {
    throw createError({ statusCode: 500, statusMessage: insertError.message })
  }

  return { success: true }
})
