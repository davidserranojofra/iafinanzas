# Skill Registry — cartera

_Generado: 2026-04-22_

## Project Conventions

| Archivo | Propósito |
|---------|-----------|
| `CLAUDE.md` | Guía principal del proyecto para Claude Code |

## User Skills

| Skill | Trigger |
|-------|---------|
| `sdd-init` | Inicializar contexto SDD en un proyecto |
| `sdd-explore` | Explorar e investigar ideas antes de un cambio |
| `sdd-propose` | Crear propuesta de cambio |
| `sdd-spec` | Escribir especificaciones |
| `sdd-design` | Diseño técnico con decisiones de arquitectura |
| `sdd-tasks` | Desglose de tareas de implementación |
| `sdd-apply` | Implementar tareas del cambio |
| `sdd-verify` | Validar implementación contra specs |
| `sdd-archive` | Archivar cambio completado |
| `sdd-onboard` | Walkthrough guiado del flujo SDD |
| `branch-pr` | Crear pull request siguiendo el flujo del equipo |
| `issue-creation` | Crear GitHub issue |
| `judgment-day` | Revisión adversarial paralela del código |
| `skill-creator` | Crear nuevos skills de agente IA |
| `skill-registry` | Actualizar este registro |
| `go-testing` | Patrones de testing en Go |

## Compact Rules

### General
- Idioma: español en CLAUDE.md y respuestas. Rioplatense (voseo) en conversación.
- Stack: Nuxt 4, Vue 3 Composition API, TypeScript, Tailwind v4, Supabase, Gemini
- Tailwind v4: tokens via `@theme {}` en CSS, no `tailwind.config.ts`
- No builds after changes
- Conventional commits, sin Co-Authored-By

### Vue / Nuxt
- Directorio `app/` para código cliente, `server/` para API Nitro
- Composables con `use` prefix en `app/composables/`
- Pinia stores en `app/stores/`
- Middleware de auth en `app/middleware/auth.ts`
- Auto-import activo: no importar componentes manualmente

### Design System (Dracula)
- Paleta: bg=#282a36, card=#44475a, card2=#383a4a, text=#f8f8f2, muted=#6272a4
- Accent: purple=#bd93f9, pink=#ff79c6, green=#50fa7b, cyan=#8be9fd
- Tipografía: Inter (sans), Fira Code (mono)
- Border radius mínimo: rounded-2xl (16px) para cards
- Touch targets mínimos: 44px height en mobile
