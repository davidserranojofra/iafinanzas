# Resumen de IAFinanzas para Presentación (Slides)

Este documento contiene una recopilación estructurada y sintetizada de toda la aplicación **IAFinanzas**. Está diseñado específicamente para servir como guía y contenido "copiar y pegar" en diapositivas de presentación del proyecto.

---

## Estructura de Diapositivas Sugerida

### 📊 Diapositiva 1: Portada

- **Título**: IAFinanzas
- **Subtítulo**: Gestión Inteligente de Gastos IA y Arquitectura Offline-First
- **Presentado por**: David Serrano Jofra
- **Stack Principal**: Nuxt 4 · Vue 3 · Supabase · TailwindCSS v4 · Groq (Llama IA) · PWA (Workbox)

---

### 💡 Diapositiva 2: ¿Qué es IAFinanzas? (El Problema y la Solución)

- **El Problema**:
    - La recopilación manual de tickets de compras es tediosa y propensa a errores.
    - La falta de conectividad móvil en comercios o sótanos suele impedir el registro inmediato de gastos.
    - El análisis de finanzas personales carece de automatización y alertas proactivas.
- **La Solución**:
    - Una **Aplicación Web Progresiva (PWA)** ágil, responsiva y con soporte offline.
    - Extracción automática y precisa de datos de tickets mediante **Modelos de Visión por Inteligencia Artificial (OCR IA)**.
    - Resúmenes automatizados de gastos enviados mediante **Notificaciones Push** al móvil.

---

### ⚙️ Diapositiva 3: Arquitectura Técnica y Stack Tecnológico

- **Frontend**:
    - **Framework**: **Nuxt 4** (Modo SSR/Hybrid) para máximo rendimiento y SEO óptimo.
    - **Biblioteca UI**: **Vue 3** con Reactividad Avanzada (Composition API).
    - **Diseño y Estilo**: **TailwindCSS v4** con un sistema de diseño dinámico basado en CSS Variables y paleta **Dracula Theme** (con soporte nativo para Modo Claro/Oscuro).
- **Backend y Base de Datos**:
    - **BaaS (Backend as a Service)**: **Supabase** para Autenticación de Usuarios y Base de Datos Relacional (**PostgreSQL**).
    - **Almacenamiento Local**: **IndexedDB** (`idb`) para encolar transacciones e imágenes durante el modo sin conexión.
- **Inteligencia Artificial**:
    - **Motor**: **Groq Cloud API** con modelos Llama Vision.

---

### 🧠 Diapositiva 4: Procesamiento de Tickets con IA

- **Flujo de Escaneo**:
    1. El usuario toma una foto del ticket usando la cámara del dispositivo o sube un archivo.
    2. La imagen se transmite de forma segura al endpoint `/api/process-ticket`.
    3. La IA analiza la imagen usando un **Prompt de Extracción Estricto** y responde con un objeto estructurado JSON en milisegundos.
- **Datos Extraídos**:
    - Comercio, fecha de compra (normalizada a `YYYY-MM-DD`, con tolerancia multi-idioma/catalán), total decimal, desglose detallado de productos (nombre, precio unitario, cantidad), IVA, notas descriptivas del gasto y método de pago.
- **Modelos Flexibles**: Permite configurar desde el perfil del usuario el motor a utilizar (ej: _Llama-3.2-11b-vision-preview_ o _Llama-4-scout_).

---

### 🔌 Diapositiva 5: PWA & Offline-First (Resiliencia Móvil)

- **Soporte Offline Completo**:
    - Implementado mediante un Service Worker robusto generado con `@vite-pwa/nuxt` y **Workbox**.
    - Carga instantánea de la aplicación y recursos estáticos mediante precaching inteligente.
- **Cola de Sincronización en Segundo Plano (Background Sync)**:
    - Si el usuario no tiene conexión a internet al escanear o registrar un ticket, los datos y las imágenes se encolan de manera segura en la base de datos local **IndexedDB** (`useColaTicketsDb` y `useColaLecturasDb`).
    - En cuanto el dispositivo recupera la conectividad, el navegador despierta al Service Worker a través de la **API de Background Sync** de forma nativa para que sincronice la cola en segundo plano con el servidor de Supabase, incluso si la app está cerrada.

---

### 🔔 Diapositiva 6: Sistema de Notificaciones Web Push

- **Flujo de Suscripción**:
    - Permiso explícito de notificaciones nativas solicitado al usuario.
    - Registro de la suscripción push cifrada en la base de datos de Supabase utilizando estándares **VAPID**.
- **Alertas Personalizadas desde el Perfil**:
    - El usuario configura la frecuencia del resumen (diario, semanal, mensual) y el formato (solo total gastado o desglose detallado por categorías de su interés).
- **Envío Automatizado (Cron Job)**:
    - Una tarea programada (cron) hace un trigger al endpoint seguro `/api/notifications/send-summary-cron`.
    - El servidor calcula los gastos de cada usuario, genera un resumen descriptivo y emite notificaciones Web Push nativas a los navegadores del usuario usando el paquete `web-push`.

---

### 🛡️ Diapositiva 7: Seguridad y Mitigación de Riesgos (OWASP API)

La aplicación implementa protecciones rigurosas contra el Top 10 de vulnerabilidades de API de OWASP:

1. **BOLA / IDOR (API1:2023)**: Políticas RLS (Row Level Security) en Supabase para asegurar que un usuario autenticado solo pueda ver o modificar sus propios datos.
2. **SSRF (API10:2023)**: Validación rigurosa del endpoint de suscripción Push contra una lista blanca (whitelist) de dominios permitidos (Google, Apple, Mozilla, Windows).
3. **Control de Acceso (API5:2023)**: Protección de rutas del servidor (`/api/process-ticket`) para evitar el consumo libre y malintencionado de APIs de IA costosas.
4. **Denegación de Servicio - DoS (API4:2023)**: Límite estricto de **7 MB** en el procesamiento de imágenes para evitar saturación de la memoria RAM del servidor.
5. **Secrets & Credentials (API7:2023)**: Extracción completa de contraseñas críticas (como el secreto del planificador Cron) y llaves del código fuente hacia variables de entorno seguras.

---

### 🎨 Diapositiva 8: Experiencia de Usuario & Diseño Premium

- **Paleta Dracula**: Un diseño visual moderno, vibrante y estético basado en tonos morados, rosas y fondos oscuros que reducen la fatiga visual.
- **Soporte Light Mode**: Override de colores CSS en tiempo de ejecución para usuarios que prefieren interfaces claras.
- **Mobile-First Real**: Diseñada pensando en la usabilidad móvil (con tamaños de botones mínimos de 44px para targets táctiles, transiciones fluidas de menús inferiores y alertas de aviso offline intuitivas).

---

## Glosario de Archivos Clave del Proyecto

Por si necesitas revisar el código de cada sección durante tu preparación:

- **Configuración del Proyecto**: [nuxt.config.ts](file:///C:/Users/david/Documents/Icnea/cartera/nuxt.config.ts) y [package.json](file:///C:/Users/david/Documents/Icnea/cartera/package.json)
- **Entornos y Llaves**: [.env](file:///C:/Users/david/Documents/Icnea/cartera/.env)
- **Base de Estilo de la App**: [main.css](file:///C:/Users/david/Documents/Icnea/cartera/app/assets/css/main.css)
- **Service Worker & PWA**: [sw.ts](file:///C:/Users/david/Documents/Icnea/cartera/app/sw.ts)
- **Endpoint de IA**: [process-ticket.post.ts](file:///C:/Users/david/Documents/Icnea/cartera/server/api/process-ticket.post.ts)
- **Suscripción y Envío Push**: [subscribe.post.ts](file:///C:/Users/david/Documents/Icnea/cartera/server/api/notifications/subscribe.post.ts) y [send-summary-cron.get.ts](file:///C:/Users/david/Documents/Icnea/cartera/server/api/notifications/send-summary-cron.get.ts)
- **Historial de Parches de Seguridad**: [seguridadOWASP.md](file:///C:/Users/david/Documents/Icnea/cartera/docs/seguridadOWASP.md)
