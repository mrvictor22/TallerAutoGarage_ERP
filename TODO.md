# TODO - Features Pendientes

## 1. Sistema de Notificaciones In-App
**Prioridad:** Media
**Ubicación:** Icono de campana en el header (ya existe UI)

### Qué notificar:
- [ ] Nueva orden creada
- [ ] Cambio de estado en órdenes (ej: "Orden ORD-0006 pasó a quality_check")
- [ ] Presupuesto aprobado por cliente
- [ ] Pago recibido
- [ ] Orden lista para entrega
- [ ] Recordatorios de órdenes estancadas (más de X días sin actividad)
- [ ] Vehículo listo para recoger
- [ ] Mensajes WhatsApp fallidos

### Consideraciones técnicas:
- Usar Supabase Realtime para notificaciones en tiempo real
- Tabla `notifications` con campos: id, user_id, type, title, message, read, created_at
- Badge con contador de no leídas en el icono de campana
- Dropdown con lista de notificaciones recientes
- Marcar como leídas individual o todas

---

## 2. Modal de Release Notes / Changelog
**Prioridad:** Baja
**Trigger:** Después de cada deploy a producción en Vercel

### Funcionalidad:
- [ ] Mostrar modal/hover con los últimos cambios del sistema
- [ ] Informar al usuario sobre nuevas funcionalidades y fixes
- [ ] Solo mostrar una vez por versión (guardar en localStorage)

### Implementación sugerida:
- Archivo `CHANGELOG.md` o `releases.json` con historial de versiones
- Componente `ReleaseNotesModal` que se muestra al detectar nueva versión
- Comparar `APP_VERSION` en localStorage vs variable de entorno
- Formato amigable: "Novedades en v1.2.0" con lista de cambios

### Ejemplo de contenido:
```
v1.2.0 - 8 de Enero 2026
- Nuevos widgets de Ganancias y Repuestos en el dashboard
- Integración de WhatsApp con Twilio
- Corrección de cálculo de ingresos (ahora solo cuenta mano de obra)
```

---

## 3. Modal de Búsqueda Global (Cmd+K)
**Prioridad:** Media
**Ubicación:** Header y Sidebar (ya existe botón de búsqueda)
**Referencias en código:**
- `src/components/layout/header.tsx:93`
- `src/components/layout/header.tsx:110`
- `src/components/layout/sidebar.tsx:246`

### Funcionalidad:
- [ ] Modal de búsqueda con atajo Cmd+K / Ctrl+K
- [ ] Buscar órdenes por folio, cliente, vehículo, placa
- [ ] Buscar dueños por nombre, teléfono, email
- [ ] Buscar vehículos por placa, marca, modelo
- [ ] Navegación rápida a secciones del sistema
- [ ] Resultados agrupados por categoría

### Implementación sugerida:
- Usar `cmdk` (Command Menu) o similar
- Debounce en búsqueda para evitar muchas queries
- Mostrar últimas búsquedas recientes

---

## 4. Widgets del Dashboard Clickeables con Filtros
**Prioridad:** Alta
**Ubicación:** `src/components/dashboard/dashboard-content.tsx`

### Funcionalidad:
- [ ] Hacer clickeables los widgets KPI del dashboard para navegar a órdenes filtradas
- [ ] Soportar query params en la URL de órdenes (ej: `/ordenes?status=new`)
- [ ] Aplicar filtros automáticamente al cargar la página desde query params
- [ ] Funcionar tanto en vista tabla como en vista tarjetas

### Mapeo de widgets a filtros:
| Widget | Filtro URL |
|--------|-----------|
| Órdenes Abiertas | `/ordenes?status=new` |
| En Proceso | `/ordenes?status=in_progress` |
| Completadas Hoy | `/ordenes?status=delivered&date=today` |
| Pendientes de Pago | `/ordenes?pending_payment=true` |

### Archivos a modificar:
- `src/components/dashboard/dashboard-content.tsx` - Agregar `href` a KPICard
- `src/components/orders/orders-list-content.tsx` - Leer query params e inicializar filtros
- `src/services/supabase-api.ts` - Posiblemente agregar filtro `pending_payment`

### Consideraciones:
- Ya existe sistema de filtros funcional en `orders-list-content.tsx:86`
- El componente `KPICard` necesita aceptar prop `href` opcional
- Usar `useSearchParams` de Next.js para leer query params
- Sincronizar URL con estado de filtros (actualizar URL al cambiar filtros)

---

## 5. Otras ideas pendientes
- [ ] Exportar reportes a PDF/Excel
- [ ] Dashboard con gráficos de tendencias (Chart.js o Recharts)
- [ ] Calendario de citas/entregas
- [ ] Inventario de repuestos con alertas de stock bajo
