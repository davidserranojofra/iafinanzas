# Registro de Seguridad OWASP — IAFinanzas

Este documento detalla las vulnerabilidades de seguridad identificadas y resueltas en el proyecto basándose en los estándares internacionales de **OWASP** (Open Web Application Security Project).

## RESUMEN

1. BOLA / IDOR: Evitar la escritura de tickets en cuentas de otros usuarios.
2. SSRF: Filtro y lista blanca de dominios de notificaciones push de confianza.
3. Falta de Autenticación: Cierre de la API pública del procesador de tickets por IA.
4. DoS de Memoria: Límite estricto de 7MB por imagen para proteger el servidor de caídas.
5. Fuga de Credenciales y RLS en Cron: Mudar el token de seguridad a variables de entorno y usar el rol administrativo correcto en
   Supabase.

---

## 1. Protección contra Modificación de Datos Ajenos (BOLA / IDOR)

- **Categoría OWASP**: API1:2023 - Broken Object Level Authorization (Autorización Rota a Nivel de Objeto).
- **Dónde aplicaba**: Base de datos de Supabase, en la política de creación de tickets (`tickets_insert`).
- **Explicación no técnica**:
  Antes, el sistema solo comprobaba que quien subiera un ticket tuviera una cuenta activa, pero no comprobaba a nombre de quién guardaba el ticket. Esto permitía que un usuario malintencionado guardara facturas o tickets falsos en la cuenta de cualquier otro usuario.
- **Qué soluciona**:
  Se modificó la política de seguridad para que la base de datos exija de forma estricta que el dueño del ticket que se está guardando coincida siempre con el usuario que ha iniciado sesión. Nadie puede escribir en el casillero de otro.

---

## 2. Prevención de Peticiones Internas Fraudulentas (SSRF)

- **Categoría OWASP**: API8:2023 - Security Misconfiguration / API10:2023 - Unsafe Consumption of APIs.
- **Dónde aplicaba**: Endpoint del servidor para registrar suscripciones de notificaciones push (`/api/notifications/subscribe`).
- **Explicación no técnica**:
  Para enviar notificaciones push, nuestro servidor tiene que enviar una señal a un servicio externo (como los servidores de Google o Apple). Antes, cualquier usuario podía enviar una URL de destino inventada. Si ponía la dirección de un servidor privado nuestro o un servidor malicioso, el sistema intentaba conectarse a él al enviar notificaciones.
- **Qué soluciona**:
  Se añadió una "lista de confianza" (whitelist). Ahora el servidor solo acepta URLs que apunten a los servidores oficiales de notificaciones de Google, Apple, Mozilla y Microsoft. Cualquier otra dirección extraña es rechazada inmediatamente, evitando que el servidor sea usado para espiar la red interna o fugar claves privadas de firma.

---

## 3. Control de Acceso a la Inteligencia Artificial

- **Categoría OWASP**: API5:2023 - Broken Function Level Authorization (Control de Acceso Roto).
- **Dónde aplicaba**: Endpoint del servidor para escanear y procesar tickets con IA (`/api/process-ticket`).
- **Explicación no técnica**:
  El escáner de tickets con inteligencia artificial de Groq estaba accesible de forma pública para cualquier persona en internet, sin necesidad de estar registrado o haber iniciado sesión en la app.
- **Qué soluciona**:
  Se implementó un control de acceso para que solo los usuarios legítimos de la aplicación que hayan iniciado sesión puedan utilizar el motor de extracción de tickets por IA. Esto protege la API de consumos no autorizados y de facturas inesperadas.

---

## 4. Limitación de Subidas contra Caídas de Servicio (DoS de Memoria)

- **Categoría OWASP**: API4:2023 - Unrestricted Resource Consumption (Consumo Desmedido de Recursos).
- **Dónde aplicaba**: Procesamiento de archivos de imagen en `/api/process-ticket`.
- **Explicación no técnica**:
  El servidor intentaba procesar cualquier imagen que le enviaran por grande que fuera. Si un usuario subía un archivo gigantesco (como un vídeo pesado o una imagen de alta resolución de 100MB), el servidor gastaba toda su memoria RAM intentando leerlo y la aplicación se caía para todos los usuarios.
- **Qué soluciona**:
  Se configuró un límite de tamaño de archivo de **7 MB**. Si alguien intenta subir un archivo que supere este límite, el servidor corta la conexión inmediatamente antes de procesarlo en memoria, garantizando que la aplicación siga estable.

---

## 5. Ocultación de Contraseñas y Corrección del Planificador (Cron)

- **Categoría OWASP**: API7:2023 - Security Misconfiguration (Configuración de Seguridad Defectuosa).
- **Dónde aplicaba**: Tarea automática de envío de resúmenes semanales (`/api/notifications/send-summary-cron`).
- **Explicación no técnica**:
  La contraseña que autorizaba el envío semanal estaba escrita a la vista en el código fuente (`super-cron-secret`). Además, debido a las restricciones de privacidad de la base de datos, el planificador automático (que no tiene un usuario humano detrás) no podía leer los perfiles para enviarles notificaciones, por lo que el sistema fallaba en segundo plano y no enviaba nada.
- **Qué soluciona**:
  Se extrajo la contraseña del código y ahora se carga de forma segura desde las variables del entorno del servidor. Asimismo, se modificó el script para que utilice permisos administrativos especiales (rol de servicio) que le permiten consultar la lista de usuarios para enviarles sus notificaciones semanales, logrando que la funcionalidad sirva pero de forma segura y controlada.
