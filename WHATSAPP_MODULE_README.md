# Módulo de Notificaciones WhatsApp

## Resumen

El módulo de notificaciones WhatsApp está completamente implementado y permite gestionar plantillas de mensajes, enviar notificaciones a clientes y visualizar el historial de mensajes enviados.

## Archivos Implementados

### 1. API Layer

#### `/src/services/whatsapp-api-enhanced.ts`
API completa con las siguientes funcionalidades:

**Gestión de Plantillas:**
- `getTemplates(includeInactive)` - Obtener todas las plantillas
- `getTemplate(id)` - Obtener una plantilla específica
- `createTemplate(template)` - Crear nueva plantilla
- `updateTemplate(id, template)` - Actualizar plantilla existente
- `deleteTemplate(id)` - Eliminar plantilla
- `duplicateTemplate(id)` - Duplicar plantilla existente

**Gestión de Mensajes:**
- `getMessages(filters, limit)` - Obtener mensajes con filtros
- `getMessage(id)` - Obtener mensaje específico
- `sendMessage(...)` - Enviar mensaje usando plantilla
- `getStats()` - Obtener estadísticas de mensajes

### 2. Componentes

#### `/src/components/whatsapp/whatsapp-management-content-enhanced.tsx`
Componente principal para la página de gestión de WhatsApp que incluye:

**Características:**
- Dashboard con estadísticas en tiempo real
- Gestión completa de plantillas (CRUD)
- Historial de mensajes con filtros
- Vista previa de plantillas con datos de ejemplo
- Detección automática de variables en plantillas
- Sistema de categorías para plantillas
- Estados de mensajes (pending, sent, delivered, read, failed)

**Pestañas:**
1. **Plantillas** - Gestión de plantillas de mensajes
2. **Historial** - Historial completo de mensajes enviados

#### `/src/components/whatsapp/whatsapp-sender.tsx`
Componente mejorado para enviar mensajes desde el detalle de orden:

**Características:**
- Selección de plantilla
- Auto-llenado de variables desde la orden
- Vista previa del mensaje antes de enviar
- Validación de consentimiento WhatsApp
- Advertencia si el cliente no tiene consentimiento
- Historial de mensajes de la orden

### 3. Página Principal

#### `/src/app/[locale]/notificaciones/whatsapp/page.tsx`
Página principal que renderiza el componente de gestión.

## Variables Disponibles

Las plantillas pueden usar las siguientes variables (se reemplazan automáticamente):

- `{{cliente}}` - Nombre del cliente
- `{{placa}}` - Placa del vehículo
- `{{ordenId}}` - Folio de la orden
- `{{total}}` - Total de la orden
- `{{vehiculo}}` - Marca y modelo del vehículo
- `{{servicio}}` - Motivo/servicio de la orden
- `{{linkSeguimiento}}` - Link para seguimiento de la orden
- `{{fecha}}` - Fecha actual
- `{{hora}}` - Hora actual

## Ejemplo de Plantilla

```
Hola {{cliente}}, tu vehículo {{vehiculo}} con placa {{placa}} está listo para recoger.

Total a pagar: {{total}}
Orden: {{ordenId}}

Puedes ver los detalles aquí: {{linkSeguimiento}}

¡Gracias por confiar en nosotros!
```

## Características Principales

### 1. Gestión de Plantillas

- **Crear plantilla**: Formulario completo con nombre, categoría y contenido
- **Editar plantilla**: Modificar plantillas existentes
- **Duplicar plantilla**: Crear copias de plantillas existentes
- **Eliminar plantilla**: Remover plantillas no utilizadas
- **Activar/Desactivar**: Control de estado de plantillas
- **Vista previa**: Ver cómo se verá el mensaje con datos de ejemplo
- **Detección automática de variables**: Las variables se extraen del contenido automáticamente

### 2. Categorías de Plantillas

- **order_status** - Estado de Orden
- **appointment** - Cita
- **reminder** - Recordatorio
- **promotion** - Promoción
- **general** - General

### 3. Historial de Mensajes

**Filtros disponibles:**
- Por estado (pending, sent, delivered, read, failed)
- Por fecha (desde/hasta)
- Por cliente
- Por plantilla usada
- Por búsqueda de teléfono

**Información mostrada:**
- Fecha de envío
- Destinatario (nombre y teléfono)
- Plantilla utilizada
- Estado del mensaje
- Contenido del mensaje

### 4. Estadísticas

**Métricas principales:**
- Total de mensajes enviados
- Mensajes enviados hoy
- Tasa de entrega (%)
- Clientes con WhatsApp habilitado

**Breakdown por estado:**
- Pendientes
- Enviados
- Entregados
- Leídos
- Fallidos

### 5. Envío de Mensajes

**Desde el detalle de orden:**
1. Seleccionar plantilla
2. Variables se auto-llenan con datos de la orden
3. Vista previa del mensaje
4. Validación de consentimiento WhatsApp
5. Envío del mensaje
6. Se guarda en el historial
7. Se crea entrada en timeline de la orden

**Validaciones:**
- Cliente debe tener `whatsapp_consent = true`
- Plantilla debe estar activa
- Todas las variables deben tener valores

## Estados de Mensajes

1. **pending** - Mensaje en cola para enviar
2. **sent** - Mensaje enviado exitosamente
3. **delivered** - Mensaje entregado al destinatario
4. **read** - Mensaje leído por el destinatario
5. **failed** - Error al enviar mensaje

## Integración con Supabase

El módulo se conecta a las siguientes tablas:

### `whatsapp_templates`
- `id` - UUID
- `name` - Nombre de la plantilla
- `category` - Categoría
- `content` - Contenido con variables
- `variables` - Array de variables detectadas
- `language` - Idioma (default: 'es')
- `is_active` - Estado activo/inactivo
- `created_at`, `updated_at` - Timestamps

### `whatsapp_messages`
- `id` - UUID
- `order_id` - Referencia a orden (nullable)
- `owner_id` - Referencia a cliente
- `template_id` - Plantilla usada (nullable)
- `phone_number` - Teléfono destino
- `content` - Contenido del mensaje
- `variables` - Variables usadas (JSON)
- `status` - Estado del mensaje
- `external_id` - ID del proveedor de WhatsApp (nullable)
- `error_message` - Mensaje de error si aplica
- `sent_at`, `delivered_at`, `read_at` - Timestamps
- `created_by`, `created_at` - Auditoría

## Notas Importantes

### Simulación de Envío
Actualmente el envío de mensajes es simulado. Los mensajes se guardan en la base de datos con estado 'sent', pero no se envían a través de una API real de WhatsApp.

Para integrar con un proveedor real:
1. Actualizar `whatsappApiEnhanced.sendMessage()`
2. Cambiar estado inicial a 'pending'
3. Implementar webhook para actualizar estados
4. Guardar `external_id` del proveedor

### Consentimiento WhatsApp
El sistema verifica que el cliente tenga `whatsapp_consent = true` antes de enviar mensajes. Esto cumple con regulaciones de privacidad.

### Variables Dinámicas
Las variables se extraen automáticamente del contenido usando regex `/{{(\w+)}}/g`. Nuevas variables se pueden agregar modificando la función `handleTemplateChange` en el sender.

## Uso

### Crear una nueva plantilla
1. Ir a `/notificaciones/whatsapp`
2. Pestaña "Plantillas"
3. Clic en "Nueva Plantilla"
4. Completar nombre, categoría y contenido
5. Usar `{{variable}}` para datos dinámicos
6. Ver preview y guardar

### Enviar mensaje desde una orden
1. Ir al detalle de una orden
2. Buscar el componente WhatsAppSender
3. Seleccionar plantilla
4. Verificar variables (se auto-llenan)
5. Ver preview
6. Clic en "Enviar Mensaje"

### Ver historial
1. Ir a `/notificaciones/whatsapp`
2. Pestaña "Historial"
3. Usar filtros según necesidad
4. Buscar por teléfono si es necesario

## Testing

Para probar el módulo:

```bash
# Iniciar servidor de desarrollo
npm run dev

# Visitar
http://localhost:3000/es/notificaciones/whatsapp
```

Asegúrate de tener:
1. Supabase configurado con las tablas necesarias
2. Al menos un cliente con `whatsapp_consent = true`
3. Una orden de servicio para probar el envío

## Futuros Mejoras

1. **Integración real de WhatsApp API**
   - WhatsApp Business API
   - Twilio WhatsApp
   - Meta Business Suite

2. **Webhooks para estados**
   - Actualizar estado a 'delivered' y 'read' en tiempo real

3. **Mensajes programados**
   - Enviar mensajes en fecha/hora específica

4. **Plantillas con multimedia**
   - Imágenes
   - PDFs
   - Links

5. **Respuestas automáticas**
   - Bot para responder preguntas frecuentes

6. **Análisis avanzado**
   - Tasa de respuesta
   - Tiempo promedio de lectura
   - Conversiones desde mensajes

## Soporte

Para más información sobre el sistema, consulta:
- `/CLAUDE.md` - Guía general del proyecto
- `/src/types/database.ts` - Tipos de datos
- `/src/services/whatsapp-api-enhanced.ts` - API completa
