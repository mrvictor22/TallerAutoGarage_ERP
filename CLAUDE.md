# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Development Commands

```bash
npm run dev      # Start dev server with Turbopack
npm run build    # Production build with Turbopack
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Architecture Overview

This is a **garage/workshop management system** built with Next.js 15 App Router, React 19, and TypeScript. The UI is in Spanish.

### Routing Structure

The app uses **next-intl** for internationalization with locale-based routing:
- Routes are under `src/app/[locale]/` (currently only `es` locale)
- Main sections: `/dashboard`, `/ordenes` (orders), `/duenos` (owners), `/vehiculos` (vehicles), `/notificaciones/whatsapp`, `/configuracion`
- Detail pages use dynamic routes: `/ordenes/[id]`, `/duenos/[id]`, `/vehiculos/[id]`
- Edit pages: `/ordenes/[id]/editar`, `/vehiculos/[id]/editar`

### State Management

- **Zustand** stores in `src/stores/` with persistence middleware:
  - `auth.ts` - Authentication state with role-based permissions (admin, reception, mechanic_lead, technician)
  - `ui.ts` - Theme, sidebar state, table column preferences
- **TanStack Query** for server state (configured in `src/lib/providers.tsx`)

### API Layer

- `src/services/supabase-api.ts` - Main API layer connecting to Supabase backend
- APIs: `ordersApi`, `ownersApi`, `vehiclesApi`, `timelineApi`, `whatsappApi`, `dashboardApi`, `usersApi`, `configApi`
- All return `ApiResponse<T>` or `PaginatedResponse<T>` wrapper types
- Uses Supabase client from `src/lib/supabase/client.ts`

### Database (Supabase)

- PostgreSQL database with Row Level Security (RLS) policies
- Types defined in `src/types/database.ts` matching Supabase schema
- Main tables: `profiles`, `owners`, `vehicles`, `orders`, `budget_lines`, `timeline_entries`, `payments`, `whatsapp_messages`, `workshop_config`

### Role-Based Access Control (RBAC)

Four user roles with specific permissions defined in `src/stores/auth.ts`:

| Role | Description | Key Permissions |
|------|-------------|-----------------|
| `admin` | Full system access | All permissions (`*`) |
| `reception` | Front desk operations | Orders CRUD, Owners, Vehicles, Payments, WhatsApp |
| `mechanic_lead` | Workshop supervisor | Orders (read/update/assign), Budget approval, Technician assignment, Reports |
| `technician` | Workshop technician | Orders (read/update), Timeline, Parts |

### Component Organization

- `src/components/ui/` - Base shadcn/ui components
- `src/components/layout/` - MainLayout, Sidebar, Header
- `src/components/{feature}/` - Feature-specific components (orders, owners, vehicles, whatsapp, dashboard, configuration)
- Content components follow pattern: `{feature}-list-content.tsx`, `{feature}-detail-content.tsx`, `{feature}-form.tsx`

### Type System

- All domain types in `src/types/database.ts` (generated from Supabase schema)
- Key entities: `Order`, `Owner`, `Vehicle`, `Profile`, `TimelineEntry`, `WhatsAppMessage`, `WhatsAppTemplate`, `WorkshopConfig`
- Extended types with relations: `OrderWithRelations`, `OwnerWithRelations`, `VehicleWithRelations`
- Insert/Update types: `OrderInsert`, `OwnerInsert`, `VehicleInsert`, etc.

### Key Patterns

- **Path alias**: `@/*` maps to `src/*`
- **Forms**: React Hook Form with Zod validation
- **Notifications**: Sonner toasts
- **Icons**: Lucide React
- **Styling**: Tailwind CSS v4 with CSS variables for theming
- **Translations**: `messages/es.json` loaded via next-intl
- **Folio Generation**: Auto-generated order numbers with format `{PREFIX}-{COUNTER}` (e.g., ORD-0001)

### Supabase Foreign Key Hints

When querying related data with ambiguous foreign keys, use explicit hints:
```typescript
// Example: orders table has multiple FK to profiles
.select(`
  *,
  technician:profiles!technician_id(*),
  author:profiles!author_id(*)
`)
```

## Estrategia Multi-Taller (Branching por Cliente)

Cada taller cliente tiene su propia rama de deployment y proyecto en Vercel. **Esta es una directriz permanente del proyecto.**

### Arquitectura

```
master (código compartido, source of truth)
  ├── deploy/autogarage   → Vercel: taller-auto-garage-erp
  ├── deploy/autosymas    → Vercel: taller_autos_y_mas
  └── deploy/[futuro]     → Vercel: nuevo proyecto por taller
```

### Talleres Activos

| Taller | Rama | Proyecto Vercel | Supabase |
|--------|------|----------------|----------|
| Taller Autogarage | `deploy/autogarage` | taller-auto-garage-erp | psyxlneicggekuchfqah |
| Autos y Mas | `deploy/autosymas` | taller_autos_y_mas | (su propia instancia) |

### Reglas de Branching

- **`master`** = código fuente canónico. Aquí se desarrollan TODOS los features y fixes
- **`deploy/{slug}`** = rama de producción por taller. Son mirrors de master
- **`feature/*`**, **`fix/*`**, **`hotfix/*`** = ramas temporales de desarrollo, siempre hacia master
- **NUNCA** desarrollar features directamente en una rama `deploy/*`
- Las personalizaciones por taller son la excepción, no la regla. Usar `workshop_config` para diferenciación

### Naming Convention

| Tipo | Patrón | Ejemplo |
|------|--------|---------|
| Deploy por taller | `deploy/{slug-taller}` | `deploy/autogarage` |
| Feature | `feature/{descripcion}` | `feature/expense-tracking` |
| Bugfix | `fix/{descripcion}` | `fix/pdf-generation` |
| Hotfix | `hotfix/{descripcion}` | `hotfix/login-crash` |

### Workflow de Desarrollo

1. Crear feature branch desde `master`
2. Desarrollar y probar localmente
3. Merge a `master` (via PR o directo)
4. Distribuir a talleres: `./scripts/distribute.sh` (o selectivamente: `./scripts/distribute.sh autogarage`)
5. Vercel deployea automáticamente al detectar push en la rama `deploy/*`

### Variables de Entorno por Taller

Cada proyecto de Vercel tiene sus propias env vars. Ver `.env.example` para la lista completa.
**IMPORTANTE**: No hardcodear URLs o credenciales de un taller específico en el código. Siempre usar `process.env`.

### Onboarding de Nuevo Taller

1. Crear proyecto Supabase + ejecutar `supabase/schema-complete.sql` + insertar `workshop_config`
2. Crear rama: `git checkout master && git checkout -b deploy/{slug} && git push -u origin deploy/{slug}`
3. Crear proyecto Vercel apuntando a la nueva rama + configurar env vars (ver `.env.example`)
4. Agregar slug al array `WORKSHOPS` en `scripts/distribute.sh`
5. Verificar deployment

## Git Commit Rules

- **NO incluir "Co-Authored-By"** en los commits
- **NO incluir** la línea "Generated with Claude Code"
- Solo incluir el mensaje del commit con su descripción
- Formato simple:
  ```
  tipo: descripción breve

  - Detalle 1
  - Detalle 2
  ```
