import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Sesión inválida o expirada.' })
  }

  const body = await readBody<{ subscription?: any }>(event)
  const subscription = body?.subscription

  if (!subscription || !subscription.endpoint) {
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
