import webpush from 'web-push'
import type { H3Event } from 'h3'
import type { SupabaseClient } from '@supabase/supabase-js'

export interface SuscripcionPush {
  id: string
  subscription: any
}

export interface ResultadoEnvio {
  enviados: number
  fallidos: number
}

// Configura las credenciales VAPID de web-push desde runtimeConfig.
// Normaliza el subject: web-push exige una URL 'mailto:' o 'https:',
// así que un email pelado se convierte automáticamente en 'mailto:email'.
export function configurarVapid(event: H3Event) {
  const runtimeConfig = useRuntimeConfig(event)

  const email = runtimeConfig.vapidEmail
  const publicKey = runtimeConfig.public.vapidPublicKey
  const privateKey = runtimeConfig.vapidPrivateKey

  if (!email || !publicKey || !privateKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Credenciales VAPID no configuradas en el servidor (NUXT_VAPID_EMAIL, NUXT_PUBLIC_VAPID_PUBLIC_KEY, NUXT_VAPID_PRIVATE_KEY).'
    })
  }

  const subject = email.startsWith('mailto:') || email.startsWith('https://')
    ? email
    : `mailto:${email}`

  webpush.setVapidDetails(subject, publicKey, privateKey)
}

// Envía una notificación push a una lista de suscripciones y limpia
// automáticamente las suscripciones muertas (410 Gone / 404 Not Found)
// usando el cliente de Supabase recibido (con RLS o service role según el caso).
export async function enviarPushASuscripciones(
  supabase: SupabaseClient<any>,
  suscripciones: SuscripcionPush[],
  payload: { title: string; body: string }
): Promise<ResultadoEnvio> {
  let enviados = 0
  let fallidos = 0

  for (const sub of suscripciones) {
    try {
      await webpush.sendNotification(
        sub.subscription,
        JSON.stringify(payload),
        { TTL: 86400 } // 24h: un resumen viejo no debe entregarse días después
      )
      enviados++
    } catch (err: any) {
      fallidos++
      console.warn(`Error enviando notificación a suscripción ${sub.id}:`, err.message)
      // Limpieza de suscripciones obsoletas (410 Gone / 404 Not Found)
      if (err.statusCode === 410 || err.statusCode === 404) {
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('id', sub.id)
        console.log(`Suscripción obsoleta ${sub.id} eliminada automáticamente.`)
      }
    }
  }

  return { enviados, fallidos }
}
