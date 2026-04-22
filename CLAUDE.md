# CLAUDE.md

Este archivo le da contexto a Claude Code (claude.ai/code) cuando trabaja en este repositorio.

## Comandos

```bash
npm run dev        # servidor de desarrollo en http://localhost:3000
npm run build      # build de producción
npm run generate   # generación estática
npm run preview    # previsualizar el build de producción
```

Sin suite de tests configurada todavía.

## Variables de entorno

Crear un archivo `.env` en la raíz del proyecto:

```
NUXT_GEMINI_API_KEY=tu_clave_aqui
SUPABASE_URL=tu_supabase_url
SUPABASE_KEY=tu_supabase_anon_key
```

`NUXT_GEMINI_API_KEY` se mapea a `runtimeConfig.geminiApiKey` (solo servidor). Las variables de Supabase las toma automáticamente `@nuxtjs/supabase`.

## Arquitectura

**Nuxt 4** con Tailwind CSS v4, Supabase y Gemini AI. App mobile-first PWA de gestión de tickets y finanzas personales.

Sigue la convención de directorio `app/` de Nuxt 4 — todo el código del cliente vive ahí:
- `app/app.vue` — root con `<NuxtPage>` y `<LayoutBottomNav>`
- `app/pages/` — rutas (ver tabla abajo)
- `app/components/` — auto-import, organizados en `ui/`, `layout/`, `tickets/`, `stats/`, `dashboard/`
- `app/composables/` — lógica reutilizable con prefijo `use`
- `app/stores/` — Pinia stores (`auth.ts`, `tickets.ts`, `user.ts`)
- `app/middleware/auth.ts` — redirige a `/login` si no hay sesión
- `app/types/index.ts` — interfaces globales (`Ticket`, `ExtractedTicket`, `UserProfile`, etc.)
- `app/assets/css/main.css` — Tailwind v4 con `@theme {}` para tokens Dracula

El código del servidor vive en `server/`:
- `server/api/process-ticket.post.ts` — extracción IA con Gemini (mantener Gemini, no migrar a OpenAI)

## Design System — Paleta Dracula

Los tokens están en `app/assets/css/main.css` bajo `@theme {}`. En Tailwind v4 se usan como `bg-dracula-bg`, `text-dracula-purple`, etc.

| Token | Valor | Uso |
|-------|-------|-----|
| `dracula-bg` | `#282a36` | Fondo principal |
| `dracula-card` | `#44475a` | Tarjetas |
| `dracula-card2` | `#383a4a` | Tarjetas secundarias |
| `dracula-text` | `#f8f8f2` | Texto principal |
| `dracula-muted` | `#6272a4` | Texto secundario |
| `dracula-purple` | `#bd93f9` | Acento principal |
| `dracula-pink` | `#ff79c6` | Acento secundario |
| `dracula-green` | `#50fa7b` | Éxito, IA |
| `dracula-cyan` | `#8be9fd` | Info, monospace |

- Tipografía: `Inter` (sans), `Fira Code` (mono)
- Border radius mínimo: `rounded-2xl` (16px) para cards, `rounded-3xl` para hero/modales
- Touch targets mínimos: 44px height en todos los elementos interactivos
- Gradiente acento: `linear-gradient(135deg, #bd93f9, #ff79c6)` — FAB, botón primario, avatar

## Rutas

| Ruta | Auth | Descripción |
|------|------|-------------|
| `/login` | público | Login + OAuth Google/Apple |
| `/dashboard` | privado | Balance, gráficos semanales, últimos tickets |
| `/tickets` | privado | Lista con filtros por categoría |
| `/tickets/nuevo` | privado | Bottom sheet: escanear IA o manual |
| `/tickets/escanear` | privado | Cámara + extracción IA con Gemini |
| `/tickets/manual` | privado | Formulario manual con Zod |
| `/tickets/[id]` | privado | Detalle con ilustración SVG por categoría |
| `/estadisticas` | privado | Gráficos día/semana/mes/año + filtros |
| `/perfil` | privado | Menú de secciones + logout |
| `/perfil/datos` | privado | Editar datos personales |
| `/perfil/seguridad` | privado | Contraseña + toggles privacidad |
| `/perfil/pagos` | privado | Métodos de pago |
| `/perfil/ia` | privado | Preferencias del motor IA |

## Flujo principal

`TicketCapture` (o `/tickets/escanear`) captura foto → `FormData` a `POST /api/process-ticket` → Gemini 2.0 Flash con schema JSON → response (comercio, fecha, total, categoría, método_pago, notas).

Supabase disponible via `useSupabaseClient()` — sin llamadas a tablas implementadas todavía.

## Convenciones importantes

- Tailwind v4: tokens via `@theme {}` en CSS, **nunca** `tailwind.config.ts`.
- `supabase.redirect: false` — auth redirects deshabilitados intencionalmente.
- La clave de Gemini es solo servidor; nunca va en `runtimeConfig.public`.
- El endpoint de IA usa Gemini (`@google/genai`), no OpenAI — no migrar.
- Bottom nav siempre visible en rutas privadas vía `app.vue`.
