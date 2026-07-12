import { createHash, timingSafeEqual } from 'node:crypto'
import { serverSupabaseServiceRole } from '#supabase/server'

interface FilaPerfil {
  id: string
  notif_enabled: boolean
  notif_interval_days: number
  notif_summary_type: 'total' | 'categorias'
  notif_categories: Record<string, boolean>
  notif_hour: number
  notif_timezone: string
  last_notified_at: string | null
  divisa: string
}

const TIMEZONE_FALLBACK = 'Europe/Madrid'

// Comparación en tiempo constante sobre digests SHA-256 de ambos valores
// (evita ataques de timing y el problema de longitudes distintas)
function compararSecretoSeguro(recibido: string, esperado: string): boolean {
  const digestRecibido = createHash('sha256').update(recibido).digest()
  const digestEsperado = createHash('sha256').update(esperado).digest()
  return timingSafeEqual(digestRecibido, digestEsperado)
}

// Calcula la hora actual (0-23) en la zona horaria del usuario.
// Si la timezone guardada es inválida, usa el fallback.
function horaActualEnTimezone(timezone: string): number {
  try {
    return Number(new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      hour12: false,
      hourCycle: 'h23'
    }).format(new Date()))
  } catch {
    return Number(new Intl.DateTimeFormat('en-US', {
      timeZone: TIMEZONE_FALLBACK,
      hour: 'numeric',
      hour12: false,
      hourCycle: 'h23'
    }).format(new Date()))
  }
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const runtimeConfig = useRuntimeConfig(event)

  // Guard de seguridad: nunca comparar contra un secret vacío
  if (!runtimeConfig.cronSecret) {
    throw createError({ statusCode: 500, statusMessage: 'Cron secret no configurado en el servidor.' })
  }

  // Autorización: solo header 'Authorization: Bearer <secret>' (mecanismo oficial
  // de Vercel Cron con la env var CRON_SECRET). No se acepta el secret por query
  // string: las URLs de un GET quedan registradas en logs y proxies. Para disparos
  // manuales usar curl con el header Bearer.
  const authHeader = getHeader(event, 'authorization')
  const autorizado =
    typeof authHeader === 'string' &&
    compararSecretoSeguro(authHeader, `Bearer ${runtimeConfig.cronSecret}`)

  if (!autorizado) {
    // Log explícito para que el fallo de auth del cron sea visible en los logs de función
    console.error('Cron de notificaciones: petición no autorizada (header Bearer ausente o secret incorrecto).')
    throw createError({ statusCode: 401, statusMessage: 'No autorizado. Se requiere un secret válido.' })
  }

  // Configurar las credenciales de VAPID para Web Push (normaliza el subject mailto:)
  configurarVapid(event)

  // Cliente de Supabase en el servidor con rol de servicio (bypassa RLS)
  const supabase = await serverSupabaseServiceRole(event)

  // 1. Obtener todos los perfiles que tienen las notificaciones activas
  const { data: perfiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, notif_enabled, notif_interval_days, notif_summary_type, notif_categories, notif_hour, notif_timezone, last_notified_at, divisa')
    .eq('notif_enabled', true)

  if (profilesError) {
    throw createError({ statusCode: 500, statusMessage: profilesError.message })
  }

  const resultados: any[] = []
  const force = query.force === 'true'

  // 2. Procesar cada perfil
  for (const perfil of (perfiles as unknown as FilaPerfil[])) {
    const ahora = new Date()

    // Gating por hora: el cron corre cada hora y notifica a partir de la hora
    // preferida del usuario en SU zona horaria. Se usa >= en vez de igualdad
    // exacta para que una ejecución perdida o retrasada del cron (deploy,
    // incidencia, salto de DST) no salte el día entero: el control de intervalo
    // sobre last_notified_at ya evita envíos duplicados dentro del mismo día
    const horaLocal = horaActualEnTimezone(perfil.notif_timezone || TIMEZONE_FALLBACK)
    if (!force && horaLocal < perfil.notif_hour) {
      continue
    }

    const lastNotified = perfil.last_notified_at ? new Date(perfil.last_notified_at) : null

    // Verificar si ya se cumplió el intervalo de días establecido o si es un envío forzado para pruebas
    let debeNotificar = false

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

    // 5. Enviar la notificación a cada suscripción del usuario (con limpieza de 410/404)
    const { enviados, fallidos } = await enviarPushASuscripciones(supabase, suscripciones, {
      title: 'Resumen de gastos 📊',
      body: cuerpoNotificacion
    })

    // 6. Actualizar la fecha del último resumen enviado SOLO si hubo al menos
    //    un envío exitoso; si todos fallaron, el próximo cron reintenta
    if (enviados > 0) {
      await supabase
        .from('profiles')
        .update({ last_notified_at: ahora.toISOString() })
        .eq('id', perfil.id)
    }

    resultados.push({
      userId: perfil.id,
      interval: perfil.notif_interval_days,
      total: totalGastado,
      sentCount: enviados,
      failedCount: fallidos
    })
  }

  return {
    success: true,
    processedCount: resultados.length,
    results: resultados
  }
})
