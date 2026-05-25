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
    throw createError({ statusCode: 400, statusMessage: 'Se requiere una suscripción push válida para remover.' })
  }

  // Borrar suscripción que coincida con el endpoint y usuario
  const { error } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('user_id', user.id)
    .eq('subscription->>endpoint', subscription.endpoint)

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return { success: true }
})
