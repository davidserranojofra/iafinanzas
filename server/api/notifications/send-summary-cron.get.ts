import webpush from 'web-push'
import { serverSupabaseClient } from '#supabase/server'

interface FilaPerfil {
  id: string
  notif_enabled: boolean
  notif_interval_days: number
  notif_summary_type: 'total' | 'categorias'
  notif_categories: Record<string, boolean>
  last_notified_at: string | null
  divisa: string
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const runtimeConfig = useRuntimeConfig()
  
  // Guard de seguridad por Secret (se puede configurar en .env si se quiere más secreto)
  const cronSecret = query.secret
  if (!cronSecret || cronSecret !== 'super-cron-secret') {
    throw createError({ statusCode: 401, statusMessage: 'No autorizado. Se requiere un secret válido.' })
  }

  // Configurar las credenciales de VAPID para Web Push
  const email = runtimeConfig.vapidEmail
  const publicKey = runtimeConfig.public.vapidPublicKey
  const privateKey = runtimeConfig.vapidPrivateKey

  if (!email || !publicKey || !privateKey) {
    throw createError({ statusCode: 500, statusMessage: 'Credenciales VAPID no configuradas en el servidor.' })
  }

  webpush.setVapidDetails(email, publicKey, privateKey)

  // Cliente de Supabase en el servidor
  const supabase = await serverSupabaseClient(event)

  // 1. Obtener todos los perfiles que tienen las notificaciones activas
  const { data: perfiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, notif_enabled, notif_interval_days, notif_summary_type, notif_categories, last_notified_at, divisa')
    .eq('notif_enabled', true)

  if (profilesError) {
    throw createError({ statusCode: 500, statusMessage: profilesError.message })
  }

  const resultados: any[] = []

  // 2. Procesar cada perfil
  for (const perfil of (perfiles as unknown as FilaPerfil[])) {
    const ahora = new Date()
    const lastNotified = perfil.last_notified_at ? new Date(perfil.last_notified_at) : null
    
    // Verificar si ya se cumplió el intervalo de días establecido o si es un envío forzado para pruebas
    let debeNotificar = false
    const force = query.force === 'true'
    
    if (force || !lastNotified) {
      debeNotificar = true // Primera notificación o forzado manual de testeo
    } else {
      const diferenciaMs = ahora.getTime() - lastNotified.getTime()
      const margenGraciaMs = 2 * 60 * 60 * 1000 // 2 horas de margen de gracia para evitar desajustes en el trigger del cron
      const intervaloMs = (perfil.notif_interval_days * 24 * 60 * 60 * 1000) - margenGraciaMs
      if (diferenciaMs >= intervaloMs) {
        debeNotificar = true
      }
    }

    if (!debeNotificar) {
      continue
    }

    // Calcular la fecha inicial del intervalo (X días atrás)
    const fechaInicio = new Date()
    fechaInicio.setDate(ahora.getDate() - perfil.notif_interval_days)
    const fechaInicioStr = fechaInicio.toISOString().slice(0, 10)

    // 3. Consultar los tickets de este usuario en ese rango de fechas
    const { data: tickets, error: ticketsError } = await supabase
      .from('tickets')
      .select('total, categoria')
      .eq('user_id', perfil.id)
      .gte('fecha', fechaInicioStr)

    if (ticketsError) {
      console.error(`Error obteniendo tickets para usuario ${perfil.id}:`, ticketsError.message)
      continue
    }

    const totalGastado = (tickets ?? []).reduce((sum, t) => sum + Number(t.total), 0)
    const divisaSimbolo = perfil.divisa === 'EUR' ? '€' : perfil.divisa === 'USD' ? '$' : perfil.divisa

    let cuerpoNotificacion = ''

    if (perfil.notif_summary_type === 'total') {
      cuerpoNotificacion = `En los últimos ${perfil.notif_interval_days} días acumulaste un total de ${totalGastado.toFixed(2)} ${divisaSimbolo} en consumos.`
    } else {
      // Agrupar por categoría
      const desglose: Record<string, number> = {}
      for (const t of (tickets ?? [])) {
        const cat = t.categoria
        desglose[cat] = (desglose[cat] || 0) + Number(t.total)
      }

      // Filtrar y armar texto de categorías activas
      const lineasCategorias: string[] = []
      for (const [cat, activa] of Object.entries(perfil.notif_categories)) {
        if (activa && desglose[cat] > 0) {
          lineasCategorias.push(`${cat}: ${desglose[cat].toFixed(2)} ${divisaSimbolo}`)
        }
      }

      if (lineasCategorias.length > 0) {
        cuerpoNotificacion = `Gastos de ${perfil.notif_interval_days} días (${totalGastado.toFixed(2)} ${divisaSimbolo}):\n` + lineasCategorias.join(' · ')
      } else {
        cuerpoNotificacion = `No registraste gastos en tus categorías seleccionadas durante los últimos ${perfil.notif_interval_days} días (Total general: ${totalGastado.toFixed(2)} ${divisaSimbolo}).`
      }
    }

    // 4. Obtener las suscripciones del usuario
    const { data: suscripciones, error: subsError } = await supabase
      .from('push_subscriptions')
      .select('id, subscription')
      .eq('user_id', perfil.id)

    if (subsError || !suscripciones?.length) {
      console.log(`Usuario ${perfil.id} no tiene suscripciones push activas.`)
      continue
    }

    let enviadosExitosos = 0

    // 5. Enviar la notificación a cada suscripción del usuario
    for (const sub of suscripciones) {
      try {
        await webpush.sendNotification(
          sub.subscription,
          JSON.stringify({
            title: 'Resumen de gastos 📊',
            body: cuerpoNotificacion
          })
        )
        enviadosExitosos++
      } catch (err: any) {
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

    // 6. Actualizar la fecha del último resumen enviado
    await supabase
      .from('profiles')
      .update({ last_notified_at: ahora.toISOString() })
      .eq('id', perfil.id)

    resultados.push({
      userId: perfil.id,
      interval: perfil.notif_interval_days,
      total: totalGastado,
      sentCount: enviadosExitosos
    })
  }

  return {
    success: true,
    processedCount: resultados.length,
    results: resultados
  }
})
