import type { OrderWithRelations, WorkshopConfig } from '@/types/database';

export interface OrderPDFData {
  order: OrderWithRelations;
  workshop: WorkshopConfig;
}

/**
 * Mapeo de estados de orden a español
 */
const ORDER_STATUS_MAP: Record<string, string> = {
  new: 'Nuevo',
  diagnosis: 'En Diagnóstico',
  waiting_approval: 'Esperando Aprobación',
  approved: 'Aprobado',
  in_progress: 'En Proceso',
  waiting_parts: 'Esperando Refacciones',
  quality_check: 'Control de Calidad',
  ready: 'Listo para Entregar',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

/**
 * Colores para estados de orden
 */
const ORDER_STATUS_COLORS: Record<string, string> = {
  new: '#f59e0b',
  diagnosis: '#f59e0b',
  waiting_approval: '#f97316',
  approved: '#3b82f6',
  in_progress: '#3b82f6',
  waiting_parts: '#8b5cf6',
  quality_check: '#6366f1',
  ready: '#10b981',
  delivered: '#10b981',
  cancelled: '#ef4444',
};

/**
 * Mapeo de métodos de pago a español
 */
const PAYMENT_METHOD_MAP: Record<string, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia',
  check: 'Cheque',
  credit: 'Crédito',
};

/**
 * Colores para estado de pago
 */
const PAYMENT_STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  partial: '#f97316',
  paid: '#10b981',
};

/**
 * Mapeo de estado de pago a español
 */
const PAYMENT_STATUS_MAP: Record<string, string> = {
  pending: 'Pendiente',
  partial: 'Parcial',
  paid: 'Pagado',
};

/**
 * Formatea un número como moneda en pesos mexicanos
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(amount);
}

/**
 * Formatea una fecha en español
 */
function formatDate(date: string | null | undefined): string {
  if (!date) return 'N/A';

  const dateObj = new Date(date);
  return new Intl.DateTimeFormat('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(dateObj);
}

/**
 * Formatea fecha y hora en español
 */
function formatDateTime(date: string | null | undefined): string {
  if (!date) return 'N/A';

  const dateObj = new Date(date);
  return new Intl.DateTimeFormat('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(dateObj);
}

/**
 * Genera el HTML completo del PDF para una orden de servicio
 */
export function generateOrderPDFTemplate(data: OrderPDFData): string {
  const { order, workshop } = data;
  const primaryColor = workshop.primary_color || '#1e40af';

  // Calcular totales
  const subtotal = order.subtotal || 0;
  const tax = order.tax_amount || 0;
  const discount = order.discount_amount || 0;
  const total = order.total || 0;

  // Calcular totales de pagos
  const totalPaid = order.payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
  const balance = total - totalPaid;

  // Determinar estado de pago
  let paymentStatus: 'pending' | 'partial' | 'paid' = 'pending';
  if (totalPaid >= total) {
    paymentStatus = 'paid';
  } else if (totalPaid > 0) {
    paymentStatus = 'partial';
  }

  // Separar líneas de presupuesto por tipo
  const laborLines = order.budget_lines?.filter(line => line.type === 'labor') || [];
  const partsLines = order.budget_lines?.filter(line => line.type === 'parts') || [];

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Orden de Servicio - ${order.folio}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-size: 10pt;
      line-height: 1.4;
      color: #1f2937;
      background: white;
      padding: 20mm 15mm;
    }

    .container {
      max-width: 210mm;
      margin: 0 auto;
    }

    /* Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 3px solid ${primaryColor};
    }

    .header-left {
      flex: 1;
    }

    .logo {
      max-width: 120px;
      max-height: 60px;
      margin-bottom: 10px;
    }

    .workshop-info {
      font-size: 9pt;
      line-height: 1.5;
    }

    .workshop-name {
      font-size: 14pt;
      font-weight: bold;
      color: ${primaryColor};
      margin-bottom: 5px;
    }

    .workshop-details {
      color: #6b7280;
    }

    .header-right {
      text-align: right;
    }

    .doc-title {
      font-size: 18pt;
      font-weight: bold;
      color: ${primaryColor};
      margin-bottom: 10px;
    }

    .folio {
      font-size: 16pt;
      font-weight: bold;
      color: #1f2937;
      margin-bottom: 5px;
    }

    .dates {
      font-size: 9pt;
      color: #6b7280;
    }

    /* Two columns section */
    .two-columns {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 20px;
    }

    .section {
      background: #f9fafb;
      padding: 12px;
      border-radius: 6px;
      border: 1px solid #e5e7eb;
    }

    .section-title {
      font-size: 11pt;
      font-weight: bold;
      color: ${primaryColor};
      margin-bottom: 8px;
      padding-bottom: 5px;
      border-bottom: 2px solid ${primaryColor};
    }

    .info-row {
      margin-bottom: 6px;
      display: flex;
    }

    .info-label {
      font-weight: 600;
      color: #4b5563;
      min-width: 100px;
    }

    .info-value {
      color: #1f2937;
      flex: 1;
    }

    /* Service reason */
    .service-reason {
      margin-bottom: 20px;
    }

    .service-reason .section {
      background: #fef3c7;
      border-color: #fcd34d;
    }

    .service-text {
      color: #1f2937;
      line-height: 1.6;
    }

    /* Status section */
    .status-section {
      margin-bottom: 20px;
    }

    .status-badge {
      display: inline-block;
      padding: 6px 14px;
      border-radius: 20px;
      font-weight: 600;
      font-size: 10pt;
      color: white;
      margin-bottom: 10px;
    }

    .diagnosis-text {
      background: #eff6ff;
      padding: 10px;
      border-radius: 6px;
      border-left: 4px solid #3b82f6;
      color: #1e40af;
      font-style: italic;
    }

    /* Budget table */
    .budget-section {
      margin-bottom: 20px;
    }

    .budget-category {
      font-weight: 600;
      font-size: 10pt;
      color: ${primaryColor};
      margin-top: 10px;
      margin-bottom: 5px;
      padding-left: 5px;
      border-left: 3px solid ${primaryColor};
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 15px;
    }

    thead {
      background: ${primaryColor};
      color: white;
    }

    th {
      padding: 10px;
      text-align: left;
      font-weight: 600;
      font-size: 9pt;
    }

    th.text-right,
    td.text-right {
      text-align: right;
    }

    th.text-center,
    td.text-center {
      text-align: center;
    }

    tbody tr {
      border-bottom: 1px solid #e5e7eb;
    }

    tbody tr:nth-child(even) {
      background: #f9fafb;
    }

    td {
      padding: 8px 10px;
      font-size: 9pt;
    }

    /* Totals */
    .totals-container {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 20px;
    }

    .totals {
      width: 300px;
      background: #f9fafb;
      padding: 12px;
      border-radius: 6px;
      border: 1px solid #e5e7eb;
    }

    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 10pt;
    }

    .total-row.subtotal {
      border-bottom: 1px solid #d1d5db;
    }

    .total-row.final {
      margin-top: 8px;
      padding-top: 8px;
      border-top: 2px solid ${primaryColor};
      font-size: 14pt;
      font-weight: bold;
      color: ${primaryColor};
    }

    .total-label {
      font-weight: 600;
    }

    /* Payments */
    .payments-section {
      margin-bottom: 20px;
    }

    .payment-summary {
      background: #f0fdf4;
      padding: 12px;
      border-radius: 6px;
      border: 2px solid #10b981;
      margin-bottom: 10px;
    }

    .payment-summary.pending {
      background: #fef3c7;
      border-color: #f59e0b;
    }

    .payment-summary.partial {
      background: #fff7ed;
      border-color: #f97316;
    }

    .payment-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 5px;
      font-size: 10pt;
    }

    .payment-row.balance {
      margin-top: 8px;
      padding-top: 8px;
      border-top: 2px solid currentColor;
      font-size: 12pt;
      font-weight: bold;
    }

    /* Footer */
    .footer {
      margin-top: 30px;
      padding-top: 15px;
      border-top: 2px solid #e5e7eb;
    }

    .terms {
      font-size: 8pt;
      color: #6b7280;
      margin-bottom: 20px;
      line-height: 1.5;
    }

    .signature-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
      margin-top: 40px;
    }

    .signature-box {
      text-align: center;
    }

    .signature-line {
      border-top: 2px solid #1f2937;
      margin-top: 60px;
      padding-top: 8px;
      font-size: 9pt;
      font-weight: 600;
    }

    .generated-date {
      text-align: center;
      font-size: 8pt;
      color: #9ca3af;
      margin-top: 20px;
    }

    /* Print optimization */
    @media print {
      body {
        padding: 0;
      }

      .container {
        max-width: 100%;
      }

      @page {
        size: letter;
        margin: 15mm;
      }
    }

    /* Empty state */
    .empty-message {
      text-align: center;
      padding: 20px;
      color: #9ca3af;
      font-style: italic;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div class="header-left">
        ${workshop.logo_url ? `<img src="${workshop.logo_url}" alt="Logo" class="logo" />` : ''}
        <div class="workshop-info">
          <div class="workshop-name">${workshop.name || 'Taller Mecánico'}</div>
          <div class="workshop-details">
            ${workshop.address ? `<div>${workshop.address}</div>` : ''}
            ${workshop.phone ? `<div>Tel: ${workshop.phone}</div>` : ''}
            ${workshop.email ? `<div>Email: ${workshop.email}</div>` : ''}
            ${workshop.tax_id ? `<div>RFC: ${workshop.tax_id}</div>` : ''}
          </div>
        </div>
      </div>
      <div class="header-right">
        <div class="doc-title">ORDEN DE SERVICIO</div>
        <div class="folio">${order.folio || 'N/A'}</div>
        <div class="dates">
          <div><strong>Fecha:</strong> ${formatDate(order.entry_date)}</div>
          ${order.commitment_date ? `<div><strong>Fecha Compromiso:</strong> ${formatDate(order.commitment_date)}</div>` : ''}
        </div>
      </div>
    </div>

    <!-- Client and Vehicle Info -->
    <div class="two-columns">
      <div class="section">
        <div class="section-title">Información del Cliente</div>
        <div class="info-row">
          <span class="info-label">Nombre:</span>
          <span class="info-value">${order.owner?.name || 'N/A'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Teléfono:</span>
          <span class="info-value">${order.owner?.phone || 'N/A'}</span>
        </div>
        ${order.owner?.email ? `
        <div class="info-row">
          <span class="info-label">Email:</span>
          <span class="info-value">${order.owner.email}</span>
        </div>
        ` : ''}
      </div>

      <div class="section">
        <div class="section-title">Datos del Vehículo</div>
        <div class="info-row">
          <span class="info-label">Vehículo:</span>
          <span class="info-value">${order.vehicle?.brand || ''} ${order.vehicle?.model || ''} ${order.vehicle?.year || ''}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Placas:</span>
          <span class="info-value">${order.vehicle?.plate || 'N/A'}</span>
        </div>
        ${order.vehicle?.color ? `
        <div class="info-row">
          <span class="info-label">Color:</span>
          <span class="info-value">${order.vehicle.color}</span>
        </div>
        ` : ''}
        ${order.entry_mileage ? `
        <div class="info-row">
          <span class="info-label">Kilometraje:</span>
          <span class="info-value">${order.entry_mileage} km</span>
        </div>
        ` : ''}
        ${order.fuel_level ? `
        <div class="info-row">
          <span class="info-label">Combustible:</span>
          <span class="info-value">${order.fuel_level}</span>
        </div>
        ` : ''}
      </div>
    </div>

    <!-- Service Reason -->
    ${order.reason || order.customer_complaints ? `
    <div class="service-reason">
      <div class="section">
        <div class="section-title">Motivo del Servicio</div>
        ${order.reason ? `
        <div class="service-text">
          <strong>Razón:</strong> ${order.reason}
        </div>
        ` : ''}
        ${order.customer_complaints ? `
        <div class="service-text" style="margin-top: 8px;">
          <strong>Quejas del Cliente:</strong> ${order.customer_complaints}
        </div>
        ` : ''}
      </div>
    </div>
    ` : ''}

    <!-- Status and Diagnosis -->
    <div class="status-section">
      <div class="section">
        <div class="section-title">Estado de la Orden</div>
        <div>
          <span class="status-badge" style="background-color: ${ORDER_STATUS_COLORS[order.status] || '#6b7280'}">
            ${ORDER_STATUS_MAP[order.status] || order.status}
          </span>
        </div>
        ${order.diagnosis ? `
        <div class="diagnosis-text">
          <strong>Diagnóstico:</strong> ${order.diagnosis}
        </div>
        ` : ''}
      </div>
    </div>

    <!-- Budget -->
    ${order.budget_lines && order.budget_lines.length > 0 ? `
    <div class="budget-section">
      <div class="section">
        <div class="section-title">Presupuesto Detallado</div>

        ${laborLines.length > 0 ? `
        <div class="budget-category">Mano de Obra</div>
        <table>
          <thead>
            <tr>
              <th>Descripción</th>
              <th class="text-center" style="width: 80px;">Cantidad</th>
              <th class="text-right" style="width: 100px;">Precio Unit.</th>
              <th class="text-right" style="width: 100px;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${laborLines.map(line => `
            <tr>
              <td>${line.description}</td>
              <td class="text-center">${line.quantity || 1}</td>
              <td class="text-right">${formatCurrency(line.unit_price || 0)}</td>
              <td class="text-right">${formatCurrency((line.quantity || 1) * (line.unit_price || 0))}</td>
            </tr>
            `).join('')}
          </tbody>
        </table>
        ` : ''}

        ${partsLines.length > 0 ? `
        <div class="budget-category">Refacciones</div>
        <table>
          <thead>
            <tr>
              <th>Descripción</th>
              <th class="text-center" style="width: 80px;">Cantidad</th>
              <th class="text-right" style="width: 100px;">Precio Unit.</th>
              <th class="text-right" style="width: 100px;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${partsLines.map(line => `
            <tr>
              <td>${line.description}</td>
              <td class="text-center">${line.quantity || 1}</td>
              <td class="text-right">${formatCurrency(line.unit_price || 0)}</td>
              <td class="text-right">${formatCurrency((line.quantity || 1) * (line.unit_price || 0))}</td>
            </tr>
            `).join('')}
          </tbody>
        </table>
        ` : ''}
      </div>
    </div>
    ` : ''}

    <!-- Totals -->
    <div class="totals-container">
      <div class="totals">
        <div class="total-row subtotal">
          <span class="total-label">Subtotal:</span>
          <span>${formatCurrency(subtotal)}</span>
        </div>
        <div class="total-row">
          <span class="total-label">IVA (16%):</span>
          <span>${formatCurrency(tax)}</span>
        </div>
        ${discount > 0 ? `
        <div class="total-row">
          <span class="total-label">Descuento:</span>
          <span>-${formatCurrency(discount)}</span>
        </div>
        ` : ''}
        <div class="total-row final">
          <span class="total-label">TOTAL:</span>
          <span>${formatCurrency(total)}</span>
        </div>
      </div>
    </div>

    <!-- Payments -->
    ${order.payments && order.payments.length > 0 ? `
    <div class="payments-section">
      <div class="section">
        <div class="section-title">Pagos Realizados</div>

        <div class="payment-summary ${paymentStatus}">
          <div class="payment-row">
            <span class="total-label">Total de la Orden:</span>
            <span>${formatCurrency(total)}</span>
          </div>
          <div class="payment-row">
            <span class="total-label">Total Pagado:</span>
            <span>${formatCurrency(totalPaid)}</span>
          </div>
          <div class="payment-row balance" style="color: ${PAYMENT_STATUS_COLORS[paymentStatus]}">
            <span class="total-label">Saldo Pendiente:</span>
            <span>${formatCurrency(balance)}</span>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 120px;">Fecha</th>
              <th style="width: 100px;">Método</th>
              <th class="text-right" style="width: 100px;">Monto</th>
              <th>Referencia</th>
            </tr>
          </thead>
          <tbody>
            ${order.payments.map(payment => `
            <tr>
              <td>${formatDate(payment.payment_date)}</td>
              <td>${PAYMENT_METHOD_MAP[payment.payment_method] || payment.payment_method}</td>
              <td class="text-right">${formatCurrency(payment.amount || 0)}</td>
              <td>${payment.reference_number || '-'}</td>
            </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
    ` : ''}

    <!-- Footer -->
    <div class="footer">
      <div class="terms">
        <strong>Términos y Condiciones:</strong><br>
        • El cliente debe recoger el vehículo dentro de las 48 horas posteriores a la fecha de entrega comprometida.<br>
        • Después de 30 días, el taller no se hace responsable por el vehículo.<br>
        • Los presupuestos tienen una validez de 15 días naturales.<br>
        • No se aceptan devoluciones de refacciones una vez instaladas.<br>
        • El taller no se hace responsable por objetos de valor dejados en el vehículo.
      </div>

      <div class="signature-section">
        <div class="signature-box">
          <div class="signature-line">Firma del Cliente</div>
        </div>
        <div class="signature-box">
          <div class="signature-line">Firma del Taller</div>
        </div>
      </div>

      <div class="generated-date">
        Documento generado el ${formatDateTime(new Date().toISOString())}
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}
