import { serverSupabaseClient } from '#supabase/server'

// Cooldown del lado servidor entre notificaciones de prueba (por usuario)
const COOLDOWN_PRUEBA_MS = 60 * 1000

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Sesión inválida o expirada.' })
  }

  // Rate limiting persistido en DB (un Map en memoria no sirve en serverless:
  // cada instancia tiene su propia memoria). RLS limita la fila al propio usuario.
  const { data: perfil, error: perfilError } = await supabase
    .from('profiles')
    .select('last_test_notification_at')
    .eq('id', user.id)
    .single<{ last_test_notification_at: string | null }>()

  if (perfilError) {
    throw createError({ statusCode: 500, statusMessage: perfilError.message })
  }

  const ultimaPrueba = perfil?.last_test_notification_at
    ? new Date(perfil.last_test_notification_at).getTime()
    : null

  if (ultimaPrueba !== null && Date.now() - ultimaPrueba < COOLDOWN_PRUEBA_MS) {
    throw createError({
      statusCode: 429,
      statusMessage: 'Espera un momento antes de enviar otra notificación de prueba.'
    })
  }

  // Configurar credenciales VAPID (normaliza el subject mailto:)
  configurarVapid(event)

  // Leer las suscripciones del propio usuario (RLS las filtra por user_id)
  const { data: suscripciones, error } = await supabase
    .from('push_subscriptions')
    .select('id, subscription')
    .eq('user_id', user.id)

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  if (!suscripciones?.length) {
    throw createError({
      statusCode: 400,
      statusMessage: 'No hay ninguna suscripción push registrada en este dispositivo. Activa primero las alertas.'
    })
  }

  // Registrar el intento ANTES de enviar para cerrar la ventana de carrera
  // entre peticiones concurrentes del mismo usuario
  await supabase
    .from('profiles')
    .update({ last_test_notification_at: new Date().toISOString() } as never)
    .eq('id', user.id)

  const { enviados, fallidos } = await enviarPushASuscripciones(supabase, suscripciones, {
    title: 'Notificación de prueba 🔔',
    body: 'Todo funciona correctamente. Así se verán tus resúmenes de gastos.'
  })

  return {
    success: enviados > 0,
    sentCount: enviados,
    failedCount: fallidos
  }
})
