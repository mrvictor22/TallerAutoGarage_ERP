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
