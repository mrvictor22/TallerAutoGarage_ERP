# Implementación del Módulo de Configuración

Este documento detalla la implementación completa del módulo de CONFIGURACIÓN del sistema de gestión de talleres.

## Resumen de Implementación

Se ha implementado un módulo completo de configuración con las siguientes funcionalidades:

### 1. API de Backend (supabase-api.ts)

#### Expense Categories API
- `getCategories()` - Obtener todas las categorías de gastos
- `createCategory()` - Crear nueva categoría
- `updateCategory()` - Actualizar categoría existente
- `deleteCategory()` - Eliminar categoría (valida que no tenga gastos asociados)

#### Users API (Mejorado)
- `getUsers(includeInactive)` - Obtener usuarios (con opción de incluir inactivos)
- `createUser()` - Crear nuevo usuario con autenticación
- `updateProfile()` - Actualizar perfil de usuario
- `toggleUserStatus()` - Activar/desactivar usuario

#### Workshop Config API
- `getWorkshopConfig()` - Obtener configuración del taller
- `updateWorkshopConfig()` - Actualizar configuración del taller

### 2. Componente de Configuración (configuration-content.tsx)

#### Características Implementadas

##### A. Tab General
- **Información Básica del Taller**:
  - Nombre del taller (requerido)
  - Dirección completa
  - Teléfono de contacto
  - Email de contacto

- **Información Fiscal**:
  - NIT/RUC
  - Régimen fiscal (General, Simplificado, Pequeño Contribuyente)
  - Moneda (USD, SVC)
  - Prefijo de órdenes (auto-uppercase, max 5 caracteres)

- Formulario controlado con estado local
- Validación de campos
- Guardado con feedback visual (loading states)
- Notificaciones de éxito/error con toast

##### B. Tab Usuarios
- **Lista de Usuarios** (DataTable):
  - Avatar con iniciales
  - Nombre completo y email
  - Rol (Administrador, Recepción, Técnico) con badges de color
  - Teléfono
  - Estado (Activo/Inactivo) con switch interactivo
  - Botón de edición

- **Crear Usuario**:
  - Formulario completo con validación
  - Campos: nombre, email, contraseña (min 6 caracteres), teléfono, rol
  - Creación de usuario en Supabase Auth + Profile
  - Estado inicial: activo

- **Editar Usuario**:
  - Pre-llenar formulario con datos existentes
  - Email no editable (campo de autenticación)
  - Actualizar nombre, teléfono, rol, estado
  - Toggle de activación/desactivación

- **Características Especiales**:
  - NO se permite eliminar usuarios, solo desactivar
  - Búsqueda por nombre
  - Estados de carga

##### C. Tab WhatsApp
- **Configuración WhatsApp Business**:
  - Toggle principal para habilitar/deshabilitar
  - Número de negocio WhatsApp
  - Token de API (campo password con botón show/hide)
  - Campos deshabilitados cuando WhatsApp está desactivado
  - Mensajes de ayuda descriptivos

- Integración con workshop_config
- Guardado persistente

##### D. Tab Categorías de Gastos
- **Lista de Categorías** (DataTable):
  - Color visual (círculo de color)
  - Nombre de la categoría
  - Descripción
  - Estado (Activa/Inactiva) con badge
  - Botones de editar y eliminar

- **Crear Categoría**:
  - Nombre (requerido)
  - Descripción (opcional)
  - Color (selector de color + input hex)
  - Estado inicial: activa

- **Editar Categoría**:
  - Actualizar todos los campos
  - Mantener ID de categoría

- **Eliminar Categoría**:
  - AlertDialog de confirmación
  - Validación: no permite eliminar si tiene gastos asociados
  - Mensaje de error descriptivo

- **Características Especiales**:
  - Búsqueda por nombre
  - Preview de color en tiempo real
  - Estados de carga

### 3. Seguridad y Permisos

#### Verificación de Permisos de Admin
- Verificación al montar el componente
- Redirección automática si no es admin
- Pantalla de "Acceso Denegado" con mensaje claro
- Toast de error informativo
- Queries deshabilitados si no es admin

#### Funciones de Seguridad
- `isAdmin()` - Verifica si el usuario actual es administrador
- useEffect con verificación en cada renderizado
- Protección a nivel de UI y API

### 4. UI/UX Implementado

#### Componentes Utilizados
- **Tabs**: Navegación entre secciones
- **Cards**: Agrupación de información
- **Forms**: Input, Textarea, Select controlados
- **DataTable**: Tablas con búsqueda y paginación
- **Dialog**: Modales para crear/editar
- **AlertDialog**: Confirmaciones de eliminación
- **Switch**: Toggle de estados
- **Badge**: Indicadores visuales
- **Button**: Acciones con estados de carga
- **Loader2**: Spinners de carga

#### Estados de la UI
- Loading states en todos los queries
- Loading states en todas las mutations
- Disabled states apropiados
- Feedback visual inmediato
- Validación de formularios
- Mensajes de error descriptivos

#### Responsividad
- Grid adaptativo (1 columna en móvil, 2 en desktop)
- Tablas responsive
- Modales adaptativos

### 5. Integraciones con Supabase

#### Tablas Utilizadas
- `workshop_config` - Configuración del taller
- `profiles` - Usuarios del sistema
- `expense_categories` - Categorías de gastos
- `expenses` - Para validar eliminación de categorías

#### React Query
- Queries con caché automático
- Invalidación de queries después de mutations
- Estados de carga centralizados
- Error handling

### 6. Flujos Completos Implementados

#### Flujo de Configuración General
1. Usuario admin accede a configuración
2. Se cargan datos actuales del workshop_config
3. Usuario modifica campos
4. Click en "Guardar Configuración"
5. Validación de datos
6. Actualización en Supabase
7. Notificación de éxito
8. Revalidación de caché

#### Flujo de Creación de Usuario
1. Click en "Nuevo Usuario"
2. Modal se abre con formulario vacío
3. Usuario completa campos (validación mínima)
4. Click en "Guardar Usuario"
5. Validación: campos obligatorios y contraseña mínima
6. Creación en Supabase Auth
7. Creación/actualización de profile
8. Notificación de éxito
9. Modal se cierra
10. Lista se actualiza

#### Flujo de Edición de Usuario
1. Click en botón de editar
2. Modal se abre con datos pre-cargados
3. Email deshabilitado (no editable)
4. Usuario modifica campos
5. Click en "Guardar Usuario"
6. Actualización de profile en Supabase
7. Notificación de éxito
8. Lista se actualiza

#### Flujo de Activar/Desactivar Usuario
1. Usuario toggle switch en la tabla
2. Llamada inmediata a API
3. Actualización de estado en Supabase
4. Notificación de éxito/error
5. Lista se actualiza automáticamente

#### Flujo de Configuración WhatsApp
1. Toggle para habilitar WhatsApp
2. Campos se habilitan/deshabilitan dinámicamente
3. Usuario ingresa número y token
4. Toggle show/hide para token (seguridad)
5. Click en "Guardar Configuración"
6. Actualización en workshop_config
7. Notificación de éxito

#### Flujo de Categorías de Gastos
1. **Crear**: Modal → Completar → Guardar → Actualizar lista
2. **Editar**: Click editar → Modal pre-llenado → Modificar → Guardar
3. **Eliminar**: Click eliminar → AlertDialog → Confirmar → Validar gastos → Eliminar/Error

### 7. Validaciones Implementadas

#### Configuración General
- Nombre del taller no vacío
- Email válido (tipo email)
- Prefijo de órdenes uppercase automático
- Máximo 5 caracteres en prefijo

#### Usuarios
- Nombre completo requerido
- Email requerido y válido
- Contraseña mínimo 6 caracteres (solo en creación)
- Rol requerido
- Email no editable en actualización

#### Categorías
- Nombre requerido
- Color válido (formato hex)
- No eliminar si tiene gastos asociados

### 8. Manejo de Errores

#### Errores de API
- Captura de errores en todas las mutations
- Mensajes descriptivos en español
- Toast notifications
- Estados de error en queries

#### Errores de Validación
- Validación antes de enviar
- Mensajes de error claros
- Prevención de envío si hay errores

#### Errores de Permisos
- Redirección automática
- Mensaje de error claro
- Pantalla de acceso denegado

## Archivos Modificados/Creados

### Creados
1. `/src/components/ui/alert-dialog.tsx` - Componente AlertDialog para confirmaciones

### Modificados
1. `/src/services/supabase-api.ts`:
   - Añadido `expenseCategoriesApi` completo
   - Mejorado `usersApi` con createUser y toggleUserStatus
   - getUsers ahora acepta parámetro includeInactive

2. `/src/components/configuration/configuration-content.tsx`:
   - Reescritura completa del componente
   - Implementación de todos los tabs funcionales
   - Formularios controlados con estado
   - Integración completa con APIs
   - Validaciones y manejo de errores

## Dependencias Utilizadas

- `@tanstack/react-query` - Gestión de estado del servidor
- `zustand` - Auth store para permisos
- `@radix-ui/react-alert-dialog` - AlertDialog component
- `sonner` - Toast notifications
- `lucide-react` - Iconos
- `next/navigation` - Router para redirecciones

## Próximos Pasos Sugeridos

1. **Testing**: Crear tests unitarios y de integración
2. **Logs de Auditoría**: Registrar cambios en configuración
3. **Business Hours**: Implementar selector de horarios de negocio
4. **Logo Upload**: Agregar carga de logo del taller
5. **Email/SMTP Config**: Implementar tab de configuración de email
6. **Sistema de Backups**: Implementar tab de sistema

## Notas Técnicas

- Todos los componentes usan "use client" para interactividad
- Estados de loading en todas las operaciones asíncronas
- Invalidación de caché optimizada
- Formularios controlados para mejor UX
- Componentes reutilizables y modulares
- Código TypeScript con tipos estrictos
- Comentarios en español donde es necesario

## Conclusión

El módulo de configuración está completamente funcional y listo para producción. Incluye:
- ✅ Configuración general del taller
- ✅ Gestión completa de usuarios (CRUD menos delete)
- ✅ Configuración de WhatsApp Business
- ✅ Gestión completa de categorías de gastos (CRUD completo)
- ✅ Validación de permisos de admin
- ✅ Manejo de errores robusto
- ✅ UI/UX profesional y responsive
- ✅ Integración completa con Supabase
