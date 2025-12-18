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

### State Management

- **Zustand** stores in `src/stores/` with persistence middleware:
  - `auth.ts` - Authentication state with role-based permissions (admin, reception, technician)
  - `ui.ts` - Theme, sidebar state, table column preferences
- **TanStack Query** for server state (configured in `src/lib/providers.tsx`)

### API Layer

- `src/services/api.ts` - Contains mock API implementations with simulated delays
- APIs: `ordersApi`, `ownersApi`, `vehiclesApi`, `timelineApi`, `whatsappApi`, `dashboardApi`, `usersApi`, `configApi`
- All return `ApiResponse<T>` or `PaginatedResponse<T>` wrapper types
- **Currently uses mock data** from `src/lib/mock-data.ts` - designed to be replaced with real HTTP calls

### Component Organization

- `src/components/ui/` - Base shadcn/ui components
- `src/components/layout/` - MainLayout, Sidebar, Header
- `src/components/{feature}/` - Feature-specific components (orders, owners, vehicles, whatsapp, dashboard, configuration)
- Content components follow pattern: `{feature}-list-content.tsx`, `{feature}-detail-content.tsx`

### Type System

- All domain types in `src/types/index.ts`
- Key entities: `Order`, `Owner`, `Vehicle`, `TimelineEntry`, `WhatsAppMessage`, `WhatsAppTemplate`, `User`
- Extended types with relations: `OrderWithRelations`, `OwnerWithRelations`, `VehicleWithRelations`
- Form types: `CreateOrderForm`, `CreateOwnerForm`, `CreateVehicleForm`

### Key Patterns

- **Path alias**: `@/*` maps to `src/*`
- **Forms**: React Hook Form with Zod validation
- **Notifications**: Sonner toasts
- **Icons**: Lucide React
- **Styling**: Tailwind CSS v4 with CSS variables for theming
- **Translations**: `messages/es.json` loaded via next-intl
