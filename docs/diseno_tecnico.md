# Documento de Diseño Técnico y Arquitectónico: IA Finanzas

## 1. Resumen Ejecutivo y Objetivos del Diseño

**IA Finanzas** es una plataforma móvil-first en formato Progressive Web Application (PWA) orientada a la autogestión de finanzas personales a través de la digitalización automatizada de tickets y facturas. 

### Objetivos Principales del Diseño
1.  **Reducción de Fricción en Captura de Datos:** Minimizar el esfuerzo del usuario en el registro de gastos empleando inteligencia artificial de visión para extraer automáticamente la información de tickets en papel.
2.  **Arquitectura Offline-First:** Proveer un funcionamiento continuo sin conexión a Internet, garantizando la persistencia local temporal de capturas e imágenes para su posterior sincronización en segundo plano al recuperar la conectividad.
3.  **Interfaz Premium de Alta Fidelidad:** Implementar una experiencia estética avanzada basada en la paleta de colores del tema Dracula, con una navegación táctil optimizada para pantallas móviles.
4.  **Seguridad y Privacidad:** Cumplir con estrictas políticas de acceso y protección de datos basadas en estándares OWASP, asegurando el aislamiento multi-inquilino.

---

## 2. Arquitectura General y Flujos de Datos

La aplicación sigue un diseño desacoplado donde la interfaz de usuario se ejecuta en el cliente como Single Page Application (SPA), comunicándose mediante llamadas HTTP seguras con una capa de servicios API y una base de datos relacional integrada en la nube.

### Flujo de Escaneo con IA e Inserción de Tickets
```
[Cámara / Archivo] ──(Imagen)──► FormData ──► POST /api/ai/extract (o /api/process-ticket)
                                                    │
                                                    ▼
                                          [Groq / OpenAI Vision]
                                                    │
                                                    ▼
[Confirmación en UI] ◄── (JSON estructurado) ◄── Parseo de JSON
         │
         ├──► Upload imagen ──► Supabase Storage bucket
         └──► INSERT ticket ──► Supabase DB (tickets table, items as jsonb)
```

1.  **Captura del Comprobante:** El cliente captura la imagen mediante la API de cámara o subida de archivo.
2.  **Carga e Inferencia:** La imagen se transmite codificada al endpoint seguro del servidor `/api/ai/extract` (o la ruta `/api/process-ticket`). Esta capa actúa como proxy seguro del SDK de OpenAI/Groq, ocultando la clave del API.
3.  **Procesamiento de Visión:** El modelo analiza la imagen inyectando un esquema de datos rígido (JSON schema) en las instrucciones.
4.  **Pre-rellenado y Persistencia:** El composable reactivo `useAIExtraction` captura el objeto JSON y pre-rellena el formulario. Tras la validación y confirmación del usuario, la imagen se almacena en Supabase Storage, y los metadatos más la lista desglosada de productos (`jsonb`) se insertan en PostgreSQL.

### Flujo de Resiliencia Offline-First
*   **Servicio Offline:** Controlado por el Service Worker (`sw.ts` y Workbox) precachando las rutas y recursos estáticos de la aplicación.
*   **Encolamiento Local (IndexedDB):** Si la conexión falla, se utiliza la base de datos local `iafianza-offline-db` mediante el helper `idb` para guardar transacciones en la cola `tickets-pendientes` e imágenes temporales.
*   **Sincronización:** Al restablecerse la conexión, la API de Background Sync procesa la cola de transacciones pendientes con el servidor.

---

## 3. Especificaciones de Interfaz y Experiencia de Usuario (UI/UX)

La UI/UX sigue las especificaciones exactas del handoff de diseño visual de Claude Design:

### Colores del Tema (Paleta Dracula)
*   **Fondo principal (`--bg`):** `#282a36`
*   **Fondo secundario / sidebar (`--bg2`):** `#1e2030`
*   **Tarjetas nivel 1 (`--card`):** `#44475a`
*   **Tarjetas nivel 2 (`--card2`):** `#383a4a`
*   **Texto principal (`--text`):** `#f8f8f2`
*   **Texto secundario (`--muted`):** `#6272a4`
*   **Acento primario (`--purple`):** `#bd93f9`
*   **Acento secundario (`--pink`):** `#ff79c6`
*   **Éxito / IA (`--green`):** `#50fa7b`
*   **Información (`--cyan`):** `#8be9fd`
*   **Advertencia / Transporte (`--orange`):** `#ffb86c`
*   **Restaurantes (`--yellow`):** `#f1fa8c`
*   **Error / Gastos (`--red`):** `#ff5555`

### Tipografía y Espaciados
*   **Fuente Sans-Serif:** Inter (pesos 300, 400, 500, 600, 700, 800).
*   **Fuente Monospace:** Fira Code (para desgloses de tickets e información técnica).
*   **Bordes Redondeados (Border Radius):**
    *   Tarjetas, inputs y elementos comunes: `rounded-2xl` (16px).
    *   Modales, hojas inferiores (Bottom Sheets) y hero banners: `rounded-3xl` (20px/24px).
*   **Objetivos Táctiles Táctiles (Touch Targets):** Mínimo **44px de altura** en todos los elementos interactivos para garantizar usabilidad móvil.
*   **Transiciones y Animaciones:** Despliegue de hojas inferiores animadas con curvas de aceleración `cubic-bezier(0.32, 0.72, 0, 1)` y visualización de líneas de escaneo animadas sobre las imágenes cargadas.

---

## 4. Características Principales y Configuraciones

### Regla de Negocio: Conmutación de Temas (Modo Oscuro / Modo Claro)
El sistema implementa de forma prioritaria el soporte dinámico para Modo Oscuro (por defecto, basado en Dracula) y Modo Claro.

#### Mecánica de Implementación
1.  **Inicialización:** El plugin del cliente [theme.client.ts](file:///C:/Users/david/Documents/Icnea/cartera/app/plugins/theme.client.ts) se ejecuta al arrancar la app. Recupera la preferencia de `localStorage` bajo la clave `'theme'`. Si no existe, establece la vista en modo oscuro (`true`).
2.  **Estado Reactivo:** Controlado por el composable [useTheme.ts](file:///C:/Users/david/Documents/Icnea/cartera/app/composables/useTheme.ts) usando el estado compartido `useState('theme-is-dark')`.
3.  **Inyección en DOM:** Al alternar el tema, el sistema añade o remueve la clase `.light` en la etiqueta de documento raíz `<html>` (`document.documentElement.classList.toggle('light', !dark)`).
4.  **Sobrescritura CSS:** Definida en [main.css](file:///C:/Users/david/Documents/Icnea/cartera/app/assets/css/main.css): cuando la clase `.light` está activa, las variables de tema Dracula se reasignan a variantes de alta legibilidad en fondo claro.

#### Controles de Usuario
*   Ubicados en la cabecera de la sección Perfil (`/perfil`), representados por un switch de botones con iconos de Sol (Sun) y Luna (Moon) con transiciones suaves de color.

### Flujo de Instalación PWA Híbrido (Android/iOS)
La aplicación implementa un sistema inteligente para incitar la instalación de la PWA según el sistema operativo del usuario, evitando molestar a quienes ya la tienen instalada.

#### Mecánica de Detección e Instalación
1.  **Detección de Instalación (Standalone):** El composable [usePwaInstaller.ts](file:///C:/Users/david/Documents/Icnea/cartera/app/composables/usePwaInstaller.ts) verifica si el entorno de visualización ya está en modo autónomo (`display-mode: standalone` o `navigator.standalone` en iOS). Si se cumple, oculta cualquier aviso.
2.  **Android (Instalación Nativa):** Intercepta el evento `beforeinstallprompt` provisto por Chrome, almacenando la llamada reactivamente y habilitando el botón **"Instalar aplicación"** en la interfaz para abrir el diálogo nativo del sistema.
3.  **iOS / iPhone (Instalación Guiada):** Al no disponer de eventos de instalación programáticos en iOS, se detecta el User Agent de Apple y se muestra un panel guía al pie que indica los pasos de Safari: pulsar el botón de compartir e indicar **"Añadir a la pantalla de inicio"**.
4.  **Control de Molestias (Fricción):** El descarte del aviso (click en cerrar) almacena el timestamp actual en `localStorage` bajo la clave `pwa-install-dismissed`, bloqueando el aviso durante las siguientes 24 horas para mantener la experiencia de usuario limpia.

#### Componente e Inyección
*   **Componente:** [AvisoInstalacion.vue](file:///C:/Users/david/Documents/Icnea/cartera/app/components/layout/AvisoInstalacion.vue) envuelto en `<ClientOnly>` para eludir fallos de hydration.
*   **Ubicación:** Inyectado de manera fija en [login.vue](file:///C:/Users/david/Documents/Icnea/cartera/app/pages/login.vue) (posición inferior `bottom-6`) y en [index.vue](file:///C:/Users/david/Documents/Icnea/cartera/app/pages/dashboard/index.vue) (posición flotante `bottom-24` para no solaparse con la barra de navegación).

---

## 5. Componentes Técnicos y Estructura del Código

### Estructura de Directorios Clave
*   **`app/pages/`:** Contiene las rutas del frontend SPA (login, dashboard, listado de tickets, escaneo, estadísticas y perfil).
*   **`app/components/`:** Elementos reutilizables separados por contexto (`ui/`, `layout/`, `tickets/`, `stats/`, `dashboard/`).
*   **`app/composables/`:** Encapsula la lógica de negocio y llamadas a APIs (`useTickets`, `useAIExtraction`, `useTheme`, `useOfflineDb`).
*   **`app/stores/`:** Estado de Pinia (`auth`, `tickets`, `user`).
*   **`server/api/`:** Rutas del lado del servidor para peticiones seguras de Base de Datos y comunicación con la IA.

### Componentes Clave y Firmas

#### TicketRow.vue
Representación visual de un ticket en listas de transacciones.
```typescript
interface Props {
  ticket: Ticket
  compact?: boolean // Modo compacto para el dashboard
}
const emit = defineEmits<{
  click: [ticket: Ticket]
}>()
```

#### CategoryIllustration.vue
Renderiza un gráfico o ilustración SVG dinámico según la categoría especificada.
```typescript
interface Props {
  categoria: TicketCategoria // 'Alimentación' | 'Transporte' | 'Ropa' | etc.
  size?: number // Tamaño de renderizado (Default: 90)
}
```

#### AIScanProgress.vue
Controla los estados y transiciones en la pantalla de carga e inferencia de tickets.
```typescript
interface Props {
  phase: 'scan' | 'loading' | 'result'
  extractedData?: ExtractedTicket
  progress?: number // Progreso simulado (0-100)
}
const emit = defineEmits<{
  upload: [file: File]
  confirm: [data: ExtractedTicket]
  editManual: []
}>()
```

---

## 6. Diccionario de Datos y Referencias Cruzadas

Las interfaces y contratos de datos definidos en el archivo global de tipos [types/index.ts](file:///C:/Users/david/Documents/Icnea/cartera/app/types/index.ts) son los siguientes:

### Definiciones de Tipos

#### `TicketCategoria`
Enumerado de categorías admitidas por el sistema para la organización de gastos:
```typescript
type TicketCategoria =
  | 'Alimentación' | 'Transporte' | 'Ropa'
  | 'Restaurantes' | 'Suscripciones' | 'Salud'
  | 'Hogar' | 'Ocio' | 'Tecnología' | 'Otro'
```

#### `Ticket`
Estructura completa de almacenamiento del gasto en Supabase:
```typescript
interface Ticket {
  id:            string            // Identificador UUID
  userId:        string            // UUID del propietario (auth.users)
  comercio:      string            // Nombre del comercio
  fecha:         string            // Fecha de compra normalizada (ISO 8601 YYYY-MM-DD)
  total:         number            // Importe total decimal
  iva?:          number            // Importe de IVA (opcional)
  categoria:     TicketCategoria   // Categoría asignada
  metodoPago?:   string            // Método de pago activo
  notas?:        string            // Observaciones
  imageUrl?:     string            // URL del archivo en Supabase Storage
  items?:        TicketItem[]      // Líneas detalladas de productos (JSONB)
  extractedByAI: boolean           // Verdadero si fue extraído por IA
  aiConfidence?: number            // Nivel de confianza retornado por el modelo (0-1)
  createdAt:     string            // Fecha de inserción
}
```

#### `TicketItem`
Desglose individual de productos o conceptos dentro del ticket:
```typescript
interface TicketItem {
  nombre:    string
  precio:    number
  cantidad?: number
}
```

#### `ExtractedTicket`
Contrato de respuesta del procesador de IA (`server/api/ai/extract.post.ts`):
```typescript
interface ExtractedTicket {
  comercio:    string
  fecha:       string
  total:       number
  iva?:        number
  items:       TicketItem[]
  metodoPago?: string
  categoria:   TicketCategoria
  confianza:   number
}
```

#### `UserProfile`
Información y preferencias del perfil de usuario:
```typescript
interface UserProfile {
  id:         string
  nombre:     string
  email:      string
  telefono?:  string
  ciudad?:    string
  divisa:     'EUR' | 'USD' | 'GBP' | 'JPY' | 'MXN'
  avatarUrl?: string
  createdAt:  string
}
```
