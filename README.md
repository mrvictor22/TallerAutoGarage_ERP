# 🚗 Garage Management System

Sistema completo de gestión para talleres automotrices desarrollado con Next.js, React y TypeScript. Incluye gestión de órdenes de trabajo, clientes, vehículos, notificaciones WhatsApp y configuración del taller.

## ✨ Características

- **Dashboard Interactivo**: KPIs en tiempo real y actividades recientes
- **Gestión de Órdenes**: Creación, seguimiento y timeline de órdenes de trabajo
- **Gestión de Clientes**: Registro completo de propietarios y empresas
- **Inventario de Vehículos**: Control detallado del parque automotor
- **Notificaciones WhatsApp**: Plantillas y envío automatizado de mensajes
- **Sistema de Roles**: Permisos basados en roles (Admin, Recepción, Técnico)
- **Internacionalización**: Soporte completo en español
- **Temas**: Modo claro y oscuro
- **Accesibilidad**: Atajos de teclado, ARIA roles y gestión de foco
- **Responsive**: Diseño adaptativo para móviles y escritorio

## 🛠️ Stack Tecnológico

- **Framework**: Next.js 14 con App Router
- **Lenguaje**: TypeScript
- **UI**: TailwindCSS + shadcn/ui
- **Estado**: Zustand
- **Formularios**: React Hook Form + Zod
- **Consultas**: TanStack Query
- **Iconos**: Lucide React
- **Internacionalización**: next-intl
- **Notificaciones**: Sonner

## 🚀 Instalación y Configuración

### Prerrequisitos

- Node.js 18+ 
- npm, yarn, pnpm o bun

### Instalación

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd garage-ui
```

2. **Instalar dependencias**
```bash
npm install
# o
yarn install
# o
pnpm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env.local
```

Editar `.env.local` con tus configuraciones:
```env
# Base URL de la aplicación
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Configuración de WhatsApp Business API (opcional)
NEXT_PUBLIC_WHATSAPP_API_URL=https://api.whatsapp.com
WHATSAPP_API_TOKEN=tu_token_aqui

# Configuración de base de datos (cuando integres backend real)
DATABASE_URL=postgresql://user:password@localhost:5432/garage_db

# Configuración de email (opcional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_email@gmail.com
SMTP_PASS=tu_password
```

4. **Ejecutar en modo desarrollo**
```bash
npm run dev
# o
yarn dev
# o
pnpm dev
```

5. **Abrir en el navegador**
Visita [http://localhost:3000](http://localhost:3000)

## 👤 Usuarios de Prueba

El sistema incluye usuarios de prueba para cada rol:

| Email | Contraseña | Rol | Permisos |
|-------|------------|-----|----------|
| admin@taller.com | admin123 | Administrador | Acceso completo |
| recepcion@taller.com | recepcion123 | Recepción | Órdenes, clientes, vehículos |
| tecnico@taller.com | tecnico123 | Técnico | Solo órdenes asignadas |

## 📱 Funcionalidades Principales

### Dashboard
- KPIs del taller (órdenes activas, ingresos, clientes)
- Actividades recientes
- Mensajes WhatsApp recientes
- Acceso rápido a funciones principales

### Gestión de Órdenes
- **Lista de órdenes**: Filtros avanzados, búsqueda, exportación CSV
- **Crear orden**: Formulario completo con validaciones
- **Detalle de orden**: Timeline interactivo, partes/facturas, WhatsApp
- **Estados**: Pendiente, En Progreso, Completada, Cancelada

### Gestión de Clientes
- **Registro de propietarios**: Personas y empresas
- **Información completa**: Contacto, dirección, vehículos asociados
- **Consentimiento WhatsApp**: Control de permisos de comunicación
- **Historial**: Órdenes y servicios realizados

### Inventario de Vehículos
- **Registro detallado**: Marca, modelo, año, VIN, kilometraje
- **Historial de servicios**: Órdenes completadas y mantenimientos
- **Fotos**: Galería de imágenes del vehículo
- **Propietario**: Vinculación con cliente

### WhatsApp Business
- **Plantillas**: Gestión de mensajes predefinidos
- **Variables dinámicas**: Personalización automática
- **Historial**: Seguimiento de mensajes enviados
- **Estados**: Enviado, entregado, leído, fallido

### Configuración
- **Datos del taller**: Información básica y fiscal
- **Horarios**: Días y horas de atención
- **Usuarios**: Gestión de accesos y roles
- **WhatsApp**: Configuración de API Business
- **Notificaciones**: Email y recordatorios

## ⌨️ Atajos de Teclado

### Globales
- `Ctrl + K`: Búsqueda global
- `Ctrl + B`: Alternar barra lateral
- `Ctrl + Shift + T`: Cambiar tema
- `Ctrl + Alt + D`: Ir al dashboard
- `Ctrl + Alt + O`: Ir a órdenes
- `Ctrl + Alt + C`: Ir a clientes
- `Ctrl + Alt + V`: Ir a vehículos
- `Ctrl + Alt + W`: Ir a WhatsApp
- `Ctrl + Alt + S`: Ir a configuración (solo admin)

### Por Página
- `Ctrl + N`: Crear nuevo elemento
- `Ctrl + F`: Enfocar búsqueda
- `?`: Mostrar ayuda de atajos

## 🔌 Integración con Backend Real

El sistema está preparado para integración con APIs reales. Actualmente usa datos simulados.

### Estructura de APIs Esperadas

```typescript
// Ejemplo de endpoints esperados
GET    /api/orders              // Lista de órdenes
POST   /api/orders              // Crear orden
GET    /api/orders/:id          // Detalle de orden
PUT    /api/orders/:id          // Actualizar orden
DELETE /api/orders/:id          // Eliminar orden

GET    /api/owners              // Lista de clientes
POST   /api/owners              // Crear cliente
GET    /api/owners/:id          // Detalle de cliente

GET    /api/vehicles            // Lista de vehículos
POST   /api/vehicles            // Crear vehículo

GET    /api/whatsapp/templates  // Plantillas WhatsApp
POST   /api/whatsapp/send       // Enviar mensaje

GET    /api/config              // Configuración del taller
PUT    /api/config              // Actualizar configuración
```

### Modificar Servicios API

Los servicios están en `src/services/api.ts`. Para integrar con backend real:

1. **Reemplazar simulaciones** por llamadas HTTP reales
2. **Configurar base URL** en variables de entorno
3. **Agregar autenticación** (JWT, cookies, etc.)
4. **Manejar errores** de red y servidor
5. **Implementar paginación** real

Ejemplo de migración:

```typescript
// Antes (simulado)
export const ordersApi = {
  getOrders: async (filters: OrderFilters) => {
    await delay();
    return createApiResponse(mockOrders);
  }
};

// Después (real)
export const ordersApi = {
  getOrders: async (filters: OrderFilters) => {
    const response = await fetch(`${API_BASE_URL}/orders?${new URLSearchParams(filters)}`);
    if (!response.ok) throw new Error('Error al cargar órdenes');
    return response.json();
  }
};
```

## 🎨 Personalización

### Temas y Colores
Los colores están definidos en `src/app/globals.css`. Puedes personalizar:

```css
:root {
  --primary: 222.2 84% 4.9%;
  --secondary: 210 40% 96%;
  /* ... más variables */
}
```

### Componentes UI
Los componentes base están en `src/components/ui/`. Son de shadcn/ui y completamente personalizables.

### Traducciones
Las traducciones están en `messages/es.json`. Para agregar idiomas:

1. Crear `messages/en.json` (o el idioma deseado)
2. Configurar en `src/i18n.ts`
3. Actualizar `middleware.ts`

## 📦 Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Servidor de desarrollo
npm run build        # Construir para producción
npm run start        # Servidor de producción
npm run lint         # Linter ESLint
npm run type-check   # Verificación de tipos TypeScript

# Utilidades
npm run clean        # Limpiar archivos generados
npm run analyze      # Analizar bundle size
```

## 🧪 Testing (Próximamente)

```bash
# Tests unitarios
npm run test

# Tests e2e
npm run test:e2e

# Coverage
npm run test:coverage
```

## 📁 Estructura del Proyecto

```
src/
├── app/                    # App Router de Next.js
│   ├── [locale]/          # Rutas internacionalizadas
│   ├── globals.css        # Estilos globales
│   └── layout.tsx         # Layout raíz
├── components/            # Componentes React
│   ├── ui/               # Componentes base (shadcn/ui)
│   ├── layout/           # Componentes de layout
│   ├── dashboard/        # Componentes del dashboard
│   ├── orders/           # Componentes de órdenes
│   ├── owners/           # Componentes de clientes
│   ├── vehicles/         # Componentes de vehículos
│   ├── whatsapp/         # Componentes de WhatsApp
│   ├── configuration/    # Componentes de configuración
│   └── accessibility/    # Componentes de accesibilidad
├── hooks/                # Custom hooks
├── lib/                  # Utilidades y configuraciones
├── services/             # Servicios de API
├── stores/               # Estado global (Zustand)
├── types/                # Definiciones de TypeScript
└── middleware.ts         # Middleware de Next.js
```

## 🚀 Despliegue

### Vercel (Recomendado)
1. Conectar repositorio en [Vercel](https://vercel.com)
2. Configurar variables de entorno
3. Deploy automático

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Variables de Entorno para Producción
```env
NEXT_PUBLIC_APP_URL=https://tu-dominio.com
WHATSAPP_API_TOKEN=token_produccion
DATABASE_URL=postgresql://...
SMTP_HOST=smtp.tu-proveedor.com
```

## 🤝 Contribución

1. Fork del repositorio
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 🆘 Soporte

- **Documentación**: Este README
- **Issues**: Crear issue en GitHub
- **Email**: soporte@tu-empresa.com

## 🔄 Roadmap

- [ ] Integración con APIs reales
- [ ] Tests unitarios y e2e
- [ ] PWA (Progressive Web App)
- [ ] Notificaciones push
- [ ] Reportes avanzados
- [ ] Integración con sistemas contables
- [ ] App móvil (React Native)
- [ ] Módulo de inventario de repuestos
- [ ] Sistema de citas online
- [ ] Integración con redes sociales

---

**Desarrollado con ❤️ para talleres automotrices**
