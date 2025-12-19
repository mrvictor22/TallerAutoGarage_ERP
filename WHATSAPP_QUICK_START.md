# Guía Rápida - Módulo WhatsApp

## Inicio Rápido

### Acceso al Módulo
```
URL: /es/notificaciones/whatsapp
```

## Características Principales

### 📊 Dashboard
Al entrar al módulo verás 4 métricas principales:
- **Total Mensajes**: Todos los mensajes enviados
- **Enviados Hoy**: Mensajes del día actual
- **Tasa de Entrega**: Porcentaje de mensajes entregados
- **Clientes WhatsApp**: Clientes con consentimiento activo

### 📝 Gestión de Plantillas

#### Crear Nueva Plantilla
1. Click en botón "Nueva Plantilla"
2. Llenar formulario:
   - **Nombre**: Nombre descriptivo (ej: "Servicio Listo")
   - **Categoría**: Tipo de mensaje
   - **Contenido**: Mensaje con variables
3. Usar `{{variable}}` para datos dinámicos
4. Ver preview automático
5. Activar/Desactivar según necesidad
6. Guardar

#### Variables Disponibles
```
{{cliente}}          → Juan Pérez
{{placa}}            → P123-456
{{ordenId}}          → ORD-2024-001
{{total}}            → $250.00
{{vehiculo}}         → Toyota Corolla 2020
{{servicio}}         → Cambio de aceite
{{linkSeguimiento}}  → https://...
{{fecha}}            → 18/12/2025
{{hora}}             → 14:30
```

#### Ejemplo de Plantilla
```
Hola {{cliente}},

Tu vehículo {{vehiculo}} con placa {{placa}} está listo para recoger.

Total a pagar: {{total}}
Orden: {{ordenId}}

Puedes ver los detalles aquí: {{linkSeguimiento}}

¡Gracias por confiar en nosotros!
```

#### Acciones Disponibles
- **👁️ Ver**: Vista previa con datos de ejemplo
- **✏️ Editar**: Modificar plantilla existente
- **📋 Duplicar**: Crear copia de plantilla
- **🗑️ Eliminar**: Borrar plantilla

### 📨 Enviar Mensajes

#### Desde Detalle de Orden
1. Abrir detalle de una orden
2. Localizar sección "WhatsApp"
3. Seleccionar plantilla del dropdown
4. Variables se auto-llenan automáticamente:
   - Cliente desde `order.owner.name`
   - Placa desde `order.vehicle.plate`
   - Orden ID desde `order.folio`
   - Total desde `order.total`
   - Vehículo desde marca + modelo
   - Servicio desde `order.reason`
5. Ver preview del mensaje
6. Click "Enviar Mensaje"

#### Validaciones
⚠️ **Advertencia**: Si el cliente no tiene `whatsapp_consent = true`, se mostrará advertencia y no se podrá enviar.

### 📜 Historial de Mensajes

#### Ver Historial
1. Tab "Historial" en página principal
2. Ver tabla con todos los mensajes

#### Información Mostrada
- 📅 Fecha de envío
- 👤 Destinatario (nombre + teléfono)
- 📄 Plantilla utilizada
- 🔵 Estado del mensaje
- 💬 Contenido del mensaje

#### Filtros Disponibles
- **Por Estado**: Dropdown con opciones
  - Todos
  - Pendiente
  - Enviado
  - Entregado
  - Leído
  - Fallido
- **Por Búsqueda**: Campo de búsqueda por teléfono

#### Estados Visuales
- 🟡 **Pendiente** - En cola
- 🔵 **Enviado** - Enviado exitosamente
- 🟢 **Entregado** - Recibido por cliente
- 🟣 **Leído** - Abierto por cliente
- 🔴 **Fallido** - Error en envío

### 📊 Estadísticas Detalladas

#### Breakdown por Estado
Vista visual con contadores por cada estado:
```
Pendiente: 5
Enviado: 120
Entregado: 110
Leído: 95
Fallido: 3
```

## Casos de Uso

### Caso 1: Notificar Servicio Listo
```markdown
**Plantilla**: "Servicio Completado"
**Categoría**: order_status
**Contenido**:
Hola {{cliente}},
Tu {{vehiculo}} está listo.
Total: {{total}}
Orden: {{ordenId}}
```

### Caso 2: Recordatorio de Cita
```markdown
**Plantilla**: "Recordatorio Cita"
**Categoría**: reminder
**Contenido**:
Estimado {{cliente}},
Recuerda tu cita para {{servicio}}
el día {{fecha}} a las {{hora}}.
Vehículo: {{placa}}
```

### Caso 3: Promoción
```markdown
**Plantilla**: "Promoción Especial"
**Categoría**: promotion
**Contenido**:
Hola {{cliente}},
¡Oferta especial!
20% descuento en cambio de aceite.
Válido hasta fin de mes.
Reserva tu cita ahora.
```

## Flujo Típico

### 1️⃣ Configuración Inicial
```
1. Crear 3-5 plantillas base
   - Servicio listo
   - Diagnóstico completado
   - Recordatorio de pago
   - Confirmación de cita
   - Promociones
2. Probar cada plantilla
3. Ajustar según feedback
```

### 2️⃣ Uso Diario
```
1. Cliente trae vehículo → Crear orden
2. Servicio completado → Enviar "Servicio Listo"
3. Cliente recoge → Automático en historial
4. Revisar estadísticas semanalmente
```

### 3️⃣ Mantenimiento
```
1. Revisar tasa de entrega
2. Identificar mensajes fallidos
3. Actualizar plantillas según necesidad
4. Eliminar plantillas obsoletas
```

## Tips y Mejores Prácticas

### ✅ Hacer
- Usar nombres descriptivos para plantillas
- Incluir siempre nombre del cliente
- Mantener mensajes concisos (< 160 caracteres ideal)
- Usar preview antes de enviar
- Verificar consentimiento WhatsApp del cliente
- Revisar estadísticas regularmente

### ❌ Evitar
- Enviar mensajes sin consentimiento
- Usar muchas variables innecesarias
- Mensajes muy largos
- Enviar a horas inapropiadas
- Spam de mensajes promocionales
- Variables sin valores

## Troubleshooting

### Problema: No puedo enviar mensaje
**Solución**: Verificar que cliente tenga `whatsapp_consent = true`

### Problema: Variables no se llenan
**Solución**:
1. Verificar que orden tenga todos los datos
2. Revisar sintaxis `{{variable}}` (sin espacios)
3. Verificar que variable exista en la lista

### Problema: Mensaje aparece como "Fallido"
**Solución**:
1. Verificar número de teléfono
2. Revisar formato del teléfono
3. Ver `error_message` en la base de datos

### Problema: No veo estadísticas
**Solución**:
1. Enviar al menos un mensaje
2. Refrescar página
3. Verificar que query esté funcionando

## Integración Futura

### WhatsApp Business API
Para envío real, necesitarás:
1. Cuenta de WhatsApp Business
2. API Token
3. Número verificado
4. Modificar `whatsappApiEnhanced.sendMessage()`
5. Configurar webhooks para estados

### Ejemplo de Integración
```typescript
// En whatsapp-api-enhanced.ts
const response = await fetch('https://api.whatsapp.com/send', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${API_TOKEN}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    to: phoneNumber,
    message: content
  })
});

const result = await response.json();
// Guardar external_id
```

## Recursos Adicionales

- **Documentación Completa**: Ver `WHATSAPP_MODULE_README.md`
- **Resumen Técnico**: Ver `WHATSAPP_IMPLEMENTATION_SUMMARY.md`
- **Código Fuente**:
  - API: `/src/services/whatsapp-api-enhanced.ts`
  - UI: `/src/components/whatsapp/whatsapp-management-content-enhanced.tsx`
  - Sender: `/src/components/whatsapp/whatsapp-sender.tsx`

## Soporte

Para ayuda adicional:
1. Revisar documentación técnica
2. Consultar código fuente con comentarios
3. Verificar tipos en `/src/types/database.ts`

---

**Versión**: 1.0.0
**Última actualización**: 2025-12-18
**Estado**: Producción Ready
