# Handoff: Cartera — App de Finanzas Personales

## Overview
Cartera es una app mobile-first de digitalización de tickets y finanzas personales. Permite al usuario fotografiar tickets físicos (con extracción IA de datos), añadirlos manualmente, visualizar estadísticas de gasto y gestionar su perfil.

## About the Design Files
Los archivos de este bundle son **prototipos de referencia creados en HTML** — muestran el aspecto visual y el comportamiento interactivo intencionado, pero NO son código de producción. La tarea del desarrollador es **recrear estos diseños en Nuxt 4** usando sus patrones y librerías establecidos (Vue 3 Composition API, Pinia, NuxtUI / custom components).

## Fidelity
**Alta fidelidad (hifi):** Los prototipos son pixel-perfect con colores, tipografía, espaciados e interacciones finales. El desarrollador debe recrear la UI de forma fiel usando el sistema de diseño definido en este documento.

---

## Paleta de colores (Dracula)
| Token | Hex | Uso |
|---|---|---|
| `--bg` | `#282a36` | Fondo principal |
| `--card` | `#44475a` | Tarjetas nivel 1 |
| `--card2` | `#383a4a` | Tarjetas nivel 2 |
| `--text` | `#f8f8f2` | Texto principal |
| `--muted` | `#6272a4` | Texto secundario |
| `--purple` | `#bd93f9` | Acento primario |
| `--pink` | `#ff79c6` | Acento secundario |
| `--green` | `#50fa7b` | Éxito / Alimentación |
| `--cyan` | `#8be9fd` | Info / Salud |
| `--orange` | `#ffb86c` | Transporte |
| `--yellow` | `#f1fa8c` | Restaurantes |
| `--red` | `#ff5555` | Gastos / Error |

## Tipografía
- **Fuente:** Inter (Google Fonts)
- **Pesos:** 300, 400, 500, 600, 700, 800

---

## Archivos de diseño
- `Cartera.html` — Prototipo interactivo completo con todas las pantallas

---

## Tech Stack recomendado

| Capa | Tecnología |
|---|---|
| Framework | Nuxt 4 (Vue 3) |
| State | Pinia |
| Estilos | Tailwind CSS 4 + CSS variables Dracula |
| Componentes UI | NuxtUI v3 (headless) |
| Formularios | VeeValidate + Zod |
| HTTP | $fetch / useFetch |
| Auth | nuxt-auth-utils |
| DB (mock) | Supabase o Drizzle + SQLite |
| IA OCR | OpenAI Vision API |
| PWA | @vite-pwa/nuxt |
