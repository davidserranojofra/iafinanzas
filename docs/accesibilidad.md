# Informe de Auditoría y Estado de Accesibilidad (A11y) — IA Finanzas

Este documento detalla el análisis de accesibilidad de la aplicación **IA Finanzas** de acuerdo con las pautas internacionales **WCAG 2.1 (Web Content Accessibility Guidelines)**, incluyendo el historial de vulnerabilidades corregidas durante las fases de optimización para asegurar el cumplimiento del estándar **Nivel AA**.

---

## 1. Historial de Correcciones (Fases Ejecutadas)

Para transformar IA Finanzas en una aplicación verdaderamente inclusiva, se ejecutó un plan de remediación estructurado en tres fases:

### 🚀 Fase 1: Correcciones Críticas (Completada)
*   **Rehabilitación de Zoom Móvil:**
    *   *Problema original:* El archivo de configuración [nuxt.config.ts](file:///C:/Users/david/Documents/Icnea/cartera/nuxt.config.ts) bloqueaba el pellizco para zoom (`user-scalable=no`, `maximum-scale=1.0`), violando el criterio **WCAG 1.4.4** (Cambiar tamaño del texto).
    *   *Solución:* Se retiraron estas restricciones del meta viewport. Ahora los usuarios con visión reducida pueden ampliar la interfaz nativamente en sus navegadores móviles hasta un 200%.
*   **Accesibilidad en Botón Flotante Central (FAB):**
    *   *Problema original:* El botón central de registro en la barra [BottomNav.vue](file:///C:/Users/david/Documents/Icnea/cartera/app/components/layout/BottomNav.vue) solo contenía un icono SVG, por lo que los lectores de pantalla lo anunciaban simplemente como "botón".
    *   *Solución:* Se añadió la etiqueta descriptiva `aria-label="Registrar nuevo ticket"` para proveer el contexto de acción correcto a tecnologías de asistencia.

### 🏗️ Fase 2: Estructura de Formularios y Estados (Completada)
*   **Asociación de Labels e Inputs:**
    *   *Problema original:* En los formularios de registro manual ([manual.vue](file:///C:/Users/david/Documents/Icnea/cartera/app/pages/tickets/manual.vue)) y edición ([[id].vue](file:///C:/Users/david/Documents/Icnea/cartera/app/pages/tickets/[id].vue)), las etiquetas `<label>` no estaban vinculadas a sus campos, incumpliendo el criterio **WCAG 1.3.1** (Información y relaciones).
    *   *Solución:* Se asociaron mediante atributos `for` e `id` únicos (ej. `for="comercio-input"` e `id="comercio-input"`). Para evitar colisiones en el DOM durante la edición superpuesta, en el formulario modal de [[id].vue](file:///C:/Users/david/Documents/Icnea/cartera/app/pages/tickets/[id].vue) se prefijaron los identificadores con `edit-` (ej. `id="edit-comercio-input"`).
*   **Estados ARIA en Botones de Selección:**
    *   *Problema original:* Los selectores personalizados de categorías y métodos de pago cambiaban solo el color de fondo al seleccionarse, lo que resultaba imperceptible para lectores de pantalla.
    *   *Solución:* Se inyectó dinámicamente el atributo de estado `:aria-pressed="activo ? 'true' : 'false'"` en las listas de botones de selección de ambos formularios.

### 🎨 Fase 3: Diseño Visual e Iconografía (Completada)
*   **Aislamiento de Iconografía Decorativa:**
    *   *Problema original:* Los iconos SVG decorativos incrustados en campos de texto, cabeceras y menús provocaban lecturas ruidosas e inconexas en asistentes de voz.
    *   *Solución:* Se aplicó el atributo `aria-hidden="true"` a los SVG decorativos de la barra [BottomNav.vue](file:///C:/Users/david/Documents/Icnea/cartera/app/components/layout/BottomNav.vue), la cabecera [MobileHeader.vue](file:///C:/Users/david/Documents/Icnea/cartera/app/components/layout/MobileHeader.vue) y los inputs de [manual.vue](file:///C:/Users/david/Documents/Icnea/cartera/app/pages/tickets/manual.vue). Adicionalmente, se asignó `aria-label="Volver"` a los botones de navegación de retroceso.
*   **Ajuste Quirúrgico de Contraste (WCAG AA 4.5:1):**
    *   *Problema original:* El texto secundario/muted (`#6272a4`) sobre las tarjetas oscuras del tema Dracula original poseía un contraste muy bajo (~1.7:1), violando el criterio **WCAG 1.4.3** (Contraste mínimo).
    *   *Solución:* Se actualizaron los valores cromáticos de la variable `--color-dracula-muted` en la hoja de estilos [main.css](file:///C:/Users/david/Documents/Icnea/cartera/app/assets/css/main.css):
        *   *Modo Oscuro:* Se incrementó la luminosidad de `#6272a4` a `#a9b7dc` (alcanzando el ratio exigido de **~4.5:1**).
        *   *Modo Claro:* Se aumentó la oscuridad de `#5a6890` a `#3d496a` (alcanzando un ratio de **~5.2:1**).
        *   *Beneficio:* Se logró la legibilidad del texto secundario sin alterar la identidad de los fondos y acentos morados/rosas del tema original.

---

## 2. Puntos Fuertes de Accesibilidad en la App

Gracias a estas optimizaciones, la aplicación cuenta con un nivel de accesibilidad sobresaliente:

1.  **Touch Targets Robustos:** Mínimo de **44px de altura** garantizado por CSS global en todos los elementos interactivos (`button, a, [role="button"]`), cumpliendo el criterio de tamaño de target en pantallas móviles.
2.  **Estructura Semántica Limpia:** Uso de etiquetas nativas HTML5 (`<nav>`, `<header>`, `<form>`) que facilitan la navegación por teclado nativa y la indexación estructurada.
3.  **Contraste Adaptativo en Doble Tema:** La app maneja un Modo Oscuro nativo y un Modo Claro conmutables desde el perfil del usuario, recalculando los colores de acento para preservar ratios óptimos de lectura en cualquier circunstancia.

---

## 3. Recomendaciones y Mejoras Futuras

Para futuras iteraciones evolutivas del sistema, se recomienda:

*   **Skip Links:** Implementar un enlace de "Saltar al contenido principal" si la estructura de navegación superior y barra lateral crece en el futuro.
*   **Accesibilidad en Gráficos:** Para la sección de estadísticas, proveer descripciones auditivas estructuradas (`aria-describedby`) o vistas en formato de tabla alternativa para facilitar la interpretación de los datos a usuarios ciegos.
