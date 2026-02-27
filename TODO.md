# TODO - Features Pendientes

## Pendiente Inmediato (Post Multi-Taller)

### Configuración Vercel - Acción Manual
- [ ] Cambiar production branch: `taller-auto-garage-erp` → `deploy/autogarage`
- [ ] Cambiar production branch: `taller_autos_y_mas` → `deploy/autosymas`
- [ ] Agregar `NEXT_PUBLIC_SITE_URL` en ambos proyectos de Vercel
- [ ] Completar env vars faltantes en `taller_autos_y_mas` (SUPABASE_SERVICE_ROLE_KEY, CRON_SECRET, Twilio)
- [ ] Verificar que ambos deployments funcionan correctamente tras el cambio de branch

---

## 1. Modal de Release Notes / Changelog
**Prioridad:** Baja
**Trigger:** Después de cada deploy a producción en Vercel

### Funcionalidad:
- [ ] Mostrar modal/hover con los últimos cambios del sistema
- [ ] Informar al usuario sobre nuevas funcionalidades y fixes
- [ ] Solo mostrar una vez por versión (guardar en localStorage)

### Implementación sugerida:
- Ya existe `CHANGELOG.md` con historial de versiones
- Componente `ReleaseNotesModal` que se muestra al detectar nueva versión
- Comparar `APP_VERSION` en localStorage vs variable de entorno

---

## 2. Modal de Búsqueda Global (Cmd+K)
**Prioridad:** Media
**Ubicación:** Header y Sidebar (ya existe botón de búsqueda)

### Funcionalidad:
- [ ] Modal de búsqueda con atajo Cmd+K / Ctrl+K
- [ ] Buscar órdenes por folio, cliente, vehículo, placa
- [ ] Buscar dueños por nombre, teléfono, email
- [ ] Buscar vehículos por placa, marca, modelo
- [ ] Navegación rápida a secciones del sistema
- [ ] Resultados agrupados por categoría

---

## 3. GitHub Actions para Distribución Automática
**Prioridad:** Media

### Funcionalidad:
- [ ] Workflow `distribute.yml` con `workflow_dispatch` para distribuir master a talleres
- [ ] Opción de distribuir a todos o a un taller específico
- [ ] Notificación de éxito/fallo

---

## 4. Feature Flags via workshop_config
**Prioridad:** Baja

### Funcionalidad:
- [ ] Agregar campo `features` (jsonb) a tabla `workshop_config`
- [ ] Habilitar/deshabilitar módulos por taller (ej: WhatsApp, reportes)
- [ ] Hook `useFeatureFlag('whatsapp')` para condicionar UI
- [ ] Evitar necesidad de ramas divergentes por personalización

---

## 5. Otras Ideas Pendientes
- [ ] Exportar reportes a PDF/Excel
- [ ] Dashboard con gráficos de tendencias (Chart.js o Recharts)
- [ ] Calendario de citas/entregas
- [ ] Inventario de repuestos con alertas de stock bajo
- [ ] PWA (Progressive Web App)
- [ ] Tests unitarios y e2e

---

## Completado

- [x] **Sistema de Notificaciones In-App** — Implementado con recordatorios periódicos cada hora
- [x] **Widgets del Dashboard Clickeables** — Navegan a órdenes filtradas por estado
- [x] **Generación de PDF** — Órdenes de servicio con template profesional
- [x] **Estrategia Multi-Taller** — Branching por cliente, script de distribución, documentación (2026-02-21)
