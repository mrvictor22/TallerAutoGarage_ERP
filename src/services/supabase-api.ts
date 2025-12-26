'use client'

import { createClient } from '@/lib/supabase/client'
import {
  Database,
  Owner,
  OwnerInsert,
  OwnerUpdate,
  OwnerWithRelations,
  Vehicle,
  VehicleInsert,
  VehicleUpdate,
  VehicleWithRelations,
  Order,
  OrderInsert,
  OrderUpdate,
  OrderWithRelations,
  OrderStatus,
  BudgetLine,
  BudgetLineInsert,
  TimelineEntry,
  TimelineEntryInsert,
  Payment,
  PaymentInsert,
  PartsInvoice,
  WhatsAppTemplate,
  WhatsAppMessage,
  Profile,
  WorkshopConfig
} from '@/types/database'

// ============================================
// Generic Response Types
// ============================================

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// ============================================
// Filter Types
// ============================================

export interface OrderFilters {
  status?: OrderStatus[]
  technician_id?: string
  date_from?: string
  date_to?: string
  search?: string
  owner_id?: string
  vehicle_id?: string
  payment_status?: string
}

export interface OwnerFilters {
  type?: 'person' | 'company'
  tags?: string[]
  search?: string
  has_whatsapp_consent?: boolean
}

export interface VehicleFilters {
  brand?: string
  model?: string
  year?: number
  owner_id?: string
  search?: string
}

// ============================================
// Helper Functions
// ============================================

function createSuccessResponse<T>(data: T, message?: string): ApiResponse<T> {
  return { success: true, data, message }
}

function createErrorResponse<T>(error: string): ApiResponse<T> {
  return { success: false, error }
}

// ============================================
// OWNERS API
// ============================================

export const ownersApi = {
  getOwners: async (
    filters: OwnerFilters = {},
    page: number = 1,
    pageSize: number = 10
  ): Promise<ApiResponse<PaginatedResponse<OwnerWithRelations>>> => {
    const supabase = createClient()

    let query = supabase
      .from('owners')
      .select('*, vehicles(*), orders(*)', { count: 'exact' })

    // Apply filters
    if (filters.type) {
      query = query.eq('type', filters.type)
    }
    if (filters.has_whatsapp_consent !== undefined) {
      query = query.eq('whatsapp_consent', filters.has_whatsapp_consent)
    }
    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`)
    }
    if (filters.tags?.length) {
      query = query.overlaps('tags', filters.tags)
    }

    // Pagination
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to).order('created_at', { ascending: false })

    const { data, error, count } = await query

    if (error) {
      return createErrorResponse(error.message)
    }

    return createSuccessResponse({
      data: data as OwnerWithRelations[],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize)
    })
  },

  getOwner: async (id: string): Promise<ApiResponse<OwnerWithRelations>> => {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('owners')
      .select('*, vehicles(*), orders(*)')
      .eq('id', id)
      .single()

    if (error) {
      return createErrorResponse(error.message)
    }

    return createSuccessResponse(data as OwnerWithRelations)
  },

  createOwner: async (owner: OwnerInsert): Promise<ApiResponse<Owner>> => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('owners')
      .insert({ ...owner, created_by: user?.id })
      .select()
      .single()

    if (error) {
      return createErrorResponse(error.message)
    }

    return createSuccessResponse(data, 'Cliente creado exitosamente')
  },

  updateOwner: async (id: string, owner: OwnerUpdate): Promise<ApiResponse<Owner>> => {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('owners')
      .update(owner)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return createErrorResponse(error.message)
    }

    return createSuccessResponse(data, 'Cliente actualizado exitosamente')
  },

  deleteOwner: async (id: string): Promise<ApiResponse<null>> => {
    const supabase = createClient()

    const { error } = await supabase
      .from('owners')
      .delete()
      .eq('id', id)

    if (error) {
      return createErrorResponse(error.message)
    }

    return createSuccessResponse(null, 'Cliente eliminado exitosamente')
  }
}

// ============================================
// VEHICLES API
// ============================================

export const vehiclesApi = {
  getVehicles: async (
    filters: VehicleFilters = {},
    page: number = 1,
    pageSize: number = 10
  ): Promise<ApiResponse<PaginatedResponse<VehicleWithRelations>>> => {
    const supabase = createClient()

    let query = supabase
      .from('vehicles')
      .select('*, owner:owners(*), orders(*)', { count: 'exact' })

    // Apply filters
    if (filters.owner_id) {
      query = query.eq('owner_id', filters.owner_id)
    }
    if (filters.brand) {
      query = query.ilike('brand', `%${filters.brand}%`)
    }
    if (filters.model) {
      query = query.ilike('model', `%${filters.model}%`)
    }
    if (filters.year) {
      query = query.eq('year', filters.year)
    }
    if (filters.search) {
      query = query.or(`plate.ilike.%${filters.search}%,brand.ilike.%${filters.search}%,model.ilike.%${filters.search}%`)
    }

    // Pagination
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to).order('created_at', { ascending: false })

    const { data, error, count } = await query

    if (error) {
      return createErrorResponse(error.message)
    }

    return createSuccessResponse({
      data: data as VehicleWithRelations[],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize)
    })
  },

  getVehicle: async (id: string): Promise<ApiResponse<VehicleWithRelations>> => {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('vehicles')
      .select('*, owner:owners(*), orders(*)')
      .eq('id', id)
      .single()

    if (error) {
      return createErrorResponse(error.message)
    }

    return createSuccessResponse(data as VehicleWithRelations)
  },

  createVehicle: async (vehicle: VehicleInsert): Promise<ApiResponse<Vehicle>> => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('vehicles')
      .insert({ ...vehicle, created_by: user?.id })
      .select()
      .single()

    if (error) {
      return createErrorResponse(error.message)
    }

    return createSuccessResponse(data, 'Vehículo creado exitosamente')
  },

  updateVehicle: async (id: string, vehicle: VehicleUpdate): Promise<ApiResponse<Vehicle>> => {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('vehicles')
      .update(vehicle)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return createErrorResponse(error.message)
    }

    return createSuccessResponse(data, 'Vehículo actualizado exitosamente')
  },

  deleteVehicle: async (id: string): Promise<ApiResponse<null>> => {
    const supabase = createClient()

    const { error } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', id)

    if (error) {
      return createErrorResponse(error.message)
    }

    return createSuccessResponse(null, 'Vehículo eliminado exitosamente')
  },

  getVehiclesByOwner: async (ownerId: string): Promise<ApiResponse<Vehicle[]>> => {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false })

    if (error) {
      return createErrorResponse(error.message)
    }

    return createSuccessResponse(data)
  }
}

// ============================================
// ORDERS API
// ============================================

export const ordersApi = {
  getOrders: async (
    filters: OrderFilters = {},
    page: number = 1,
    pageSize: number = 10
  ): Promise<ApiResponse<PaginatedResponse<OrderWithRelations>>> => {
    const supabase = createClient()

    let query = supabase
      .from('orders')
      .select(`
        *,
        owner:owners(*),
        vehicle:vehicles(*),
        technician:profiles!technician_id(*),
        budget_lines(*),
        timeline_entries(*),
        payments(*),
        parts_invoices(*),
        messages:whatsapp_messages(*)
      `, { count: 'exact' })

    // Apply filters
    if (filters.status?.length) {
      query = query.in('status', filters.status)
    }
    if (filters.technician_id) {
      query = query.eq('technician_id', filters.technician_id)
    }
    if (filters.owner_id) {
      query = query.eq('owner_id', filters.owner_id)
    }
    if (filters.vehicle_id) {
      query = query.eq('vehicle_id', filters.vehicle_id)
    }
    if (filters.payment_status) {
      query = query.eq('payment_status', filters.payment_status)
    }
    if (filters.date_from) {
      query = query.gte('entry_date', filters.date_from)
    }
    if (filters.date_to) {
      query = query.lte('entry_date', filters.date_to)
    }
    if (filters.search) {
      query = query.or(`folio.ilike.%${filters.search}%,reason.ilike.%${filters.search}%`)
    }

    // Pagination
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to).order('created_at', { ascending: false })

    const { data, error, count } = await query

    if (error) {
      return createErrorResponse(error.message)
    }

    return createSuccessResponse({
      data: data as OrderWithRelations[],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize)
    })
  },

  getOrder: async (id: string): Promise<ApiResponse<OrderWithRelations>> => {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        owner:owners(*),
        vehicle:vehicles(*),
        technician:profiles!technician_id(*),
        budget_lines(*),
        timeline_entries(*, author:profiles!author_id(*)),
        payments(*),
        parts_invoices(*),
        messages:whatsapp_messages(*)
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching order:', error)
      return createErrorResponse(error.message)
    }

    if (!data) {
      return createErrorResponse('Orden no encontrada')
    }

    return createSuccessResponse(data as OrderWithRelations)
  },

  createOrder: async (order: OrderInsert): Promise<ApiResponse<Order>> => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Generate folio if not provided
    let folio = order.folio
    if (!folio) {
      const { data: config } = await supabase
        .from('workshop_config')
        .select('id, order_prefix, order_counter')
        .single()

      const prefix = config?.order_prefix || 'ORD'

      // Get the highest folio number from existing orders
      const { data: lastOrder } = await supabase
        .from('orders')
        .select('folio')
        .like('folio', `${prefix}-%`)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      let nextCounter = 1
      if (lastOrder?.folio) {
        // Extract number from folio (e.g., "ORD-0001" -> 1)
        const match = lastOrder.folio.match(/-(\d+)$/)
        if (match) {
          nextCounter = parseInt(match[1], 10) + 1
        }
      } else if (config?.order_counter) {
        nextCounter = config.order_counter + 1
      }

      folio = `${prefix}-${nextCounter.toString().padStart(4, '0')}`

      // Update counter in config
      if (config) {
        await supabase
          .from('workshop_config')
          .update({ order_counter: nextCounter })
          .eq('id', config.id)
      }
    }

    const { data, error } = await supabase
      .from('orders')
      .insert({ ...order, folio, created_by: user?.id })
      .select()
      .single()

    if (error) {
      return createErrorResponse(error.message)
    }

    // Create initial timeline entry
    if (data) {
      await supabase.from('timeline_entries').insert({
        order_id: data.id,
        type: 'status_change',
        title: 'Orden creada',
        description: 'Se ha creado una nueva orden de servicio',
        new_status: 'new',
        author_id: user?.id ?? ''
      })
    }

    return createSuccessResponse(data, 'Orden creada exitosamente')
  },

  updateOrder: async (id: string, order: OrderUpdate): Promise<ApiResponse<Order>> => {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('orders')
      .update(order)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return createErrorResponse(error.message)
    }

    return createSuccessResponse(data, 'Orden actualizada exitosamente')
  },

  updateOrderStatus: async (
    id: string,
    newStatus: OrderStatus,
    notes?: string
  ): Promise<ApiResponse<Order>> => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Get current order status
    const { data: currentOrder } = await supabase
      .from('orders')
      .select('status')
      .eq('id', id)
      .single()

    // Update order status
    const { data, error } = await supabase
      .from('orders')
      .update({
        status: newStatus,
        ...(newStatus === 'delivered' ? { delivery_date: new Date().toISOString() } : {}),
        ...(newStatus === 'ready' ? { actual_completion: new Date().toISOString() } : {})
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return createErrorResponse(error.message)
    }

    // Create timeline entry for status change
    await supabase.from('timeline_entries').insert({
      order_id: id,
      type: 'status_change',
      title: `Estado cambiado a ${newStatus}`,
      description: notes || `Estado actualizado de ${currentOrder?.status} a ${newStatus}`,
      old_status: currentOrder?.status,
      new_status: newStatus,
      author_id: user?.id ?? ''
    })

    return createSuccessResponse(data, 'Estado actualizado exitosamente')
  },

  deleteOrder: async (id: string): Promise<ApiResponse<null>> => {
    const supabase = createClient()

    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', id)

    if (error) {
      return createErrorResponse(error.message)
    }

    return createSuccessResponse(null, 'Orden eliminada exitosamente')
  },

  getOrdersByVehicle: async (vehicleId: string): Promise<ApiResponse<Order[]>> => {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .order('entry_date', { ascending: false })

    if (error) {
      return createErrorResponse(error.message)
    }

    return createSuccessResponse(data)
  },

  getOrdersByOwner: async (ownerId: string): Promise<ApiResponse<Order[]>> => {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('owner_id', ownerId)
      .order('entry_date', { ascending: false })

    if (error) {
      return createErrorResponse(error.message)
    }

    return createSuccessResponse(data)
  }
}

// ============================================
// BUDGET LINES API
// ============================================

export const budgetLinesApi = {
  getBudgetLines: async (orderId: string): Promise<ApiResponse<BudgetLine[]>> => {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('budget_lines')
      .select('*')
      .eq('order_id', orderId)
      .order('sort_order', { ascending: true })

    if (error) {
      return createErrorResponse(error.message)
    }

    return createSuccessResponse(data)
  },

  createBudgetLine: async (line: BudgetLineInsert): Promise<ApiResponse<BudgetLine>> => {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('budget_lines')
      .insert(line)
      .select()
      .single()

    if (error) {
      return createErrorResponse(error.message)
    }

    return createSuccessResponse(data, 'Línea agregada al presupuesto')
  },

  updateBudgetLine: async (
    id: string,
    line: Partial<BudgetLine>
  ): Promise<ApiResponse<BudgetLine>> => {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('budget_lines')
      .update(line)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return createErrorResponse(error.message)
    }

    return createSuccessResponse(data, 'Línea actualizada')
  },

  deleteBudgetLine: async (id: string): Promise<ApiResponse<null>> => {
    const supabase = createClient()

    const { error } = await supabase
      .from('budget_lines')
      .delete()
      .eq('id', id)

    if (error) {
      return createErrorResponse(error.message)
    }

    return createSuccessResponse(null, 'Línea eliminada')
  },

  approveBudgetLine: async (id: string, approved: boolean): Promise<ApiResponse<BudgetLine>> => {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('budget_lines')
      .update({ approved })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return createErrorResponse(error.message)
    }

    return createSuccessResponse(data)
  }
}

// ============================================
// TIMELINE API
// ============================================

export const timelineApi = {
  getTimeline: async (orderId: string): Promise<ApiResponse<TimelineEntry[]>> => {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('timeline_entries')
      .select('*, author:profiles!author_id(*)')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false })

    if (error) {
      return createErrorResponse(error.message)
    }

    return createSuccessResponse(data as TimelineEntry[])
  },

  addEntry: async (entry: TimelineEntryInsert): Promise<ApiResponse<TimelineEntry>> => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('timeline_entries')
      .insert({ ...entry, author_id: user?.id ?? '' })
      .select('*, author:profiles!author_id(*)')
      .single()

    if (error) {
      return createErrorResponse(error.message)
    }

    return createSuccessResponse(data as TimelineEntry, 'Entrada agregada')
  }
}

// ============================================
// PAYMENTS API
// ============================================

export const paymentsApi = {
  getPayments: async (orderId: string): Promise<ApiResponse<Payment[]>> => {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('order_id', orderId)
      .order('payment_date', { ascending: false })

    if (error) {
      return createErrorResponse(error.message)
    }

    return createSuccessResponse(data)
  },

  createPayment: async (payment: PaymentInsert): Promise<ApiResponse<Payment>> => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('payments')
      .insert({ ...payment, received_by: user?.id })
      .select()
      .single()

    if (error) {
      return createErrorResponse(error.message)
    }

    // Add timeline entry for payment
    await supabase.from('timeline_entries').insert({
      order_id: payment.order_id,
      type: 'payment',
      title: 'Pago recibido',
      description: `Se recibió un pago de $${payment.amount} por ${payment.payment_method}`,
      author_id: user?.id ?? ''
    })

    return createSuccessResponse(data, 'Pago registrado exitosamente')
  }
}

// ============================================
// WHATSAPP API
// ============================================

export const whatsappApi = {
  getTemplates: async (): Promise<ApiResponse<WhatsAppTemplate[]>> => {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('whatsapp_templates')
      .select('*')
      .eq('is_active', true)
      .order('name')

    if (error) {
      return createErrorResponse(error.message)
    }

    return createSuccessResponse(data)
  },

  getMessages: async (orderId?: string): Promise<ApiResponse<WhatsAppMessage[]>> => {
    const supabase = createClient()

    let query = supabase
      .from('whatsapp_messages')
      .select('*')
      .order('created_at', { ascending: false })

    if (orderId) {
      query = query.eq('order_id', orderId)
    }

    const { data, error } = await query.limit(50)

    if (error) {
      return createErrorResponse(error.message)
    }

    return createSuccessResponse(data)
  },

  sendMessage: async (
    ownerId: string,
    orderId: string | null,
    templateId: string,
    variables: Record<string, string>,
    phoneNumber: string
  ): Promise<ApiResponse<WhatsAppMessage>> => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Get template
    const { data: template } = await supabase
      .from('whatsapp_templates')
      .select('*')
      .eq('id', templateId)
      .single()

    if (!template) {
      return createErrorResponse('Plantilla no encontrada')
    }

    // Replace variables in content
    let content = template.content
    Object.entries(variables).forEach(([key, value]) => {
      content = content.replace(new RegExp(`{{${key}}}`, 'g'), value)
    })

    // Create message record
    const { data, error } = await supabase
      .from('whatsapp_messages')
      .insert({
        owner_id: ownerId,
        order_id: orderId,
        template_id: templateId,
        phone_number: phoneNumber,
        content,
        variables,
        status: 'sent', // In real implementation, this would be 'pending' until confirmed
        sent_at: new Date().toISOString(),
        created_by: user?.id
      })
      .select()
      .single()

    if (error) {
      return createErrorResponse(error.message)
    }

    // Add timeline entry if order exists
    if (orderId) {
      await supabase.from('timeline_entries').insert({
        order_id: orderId,
        type: 'message_sent',
        title: 'Mensaje WhatsApp enviado',
        description: `Se envió un mensaje usando la plantilla "${template.name}"`,
        author_id: user?.id ?? ''
      })
    }

    return createSuccessResponse(data, 'Mensaje enviado exitosamente')
  }
}

// ============================================
// DASHBOARD API
// ============================================

export interface DashboardKPIs {
  totalOrders: number
  openOrders: number
  inProgressOrders: number
  completedToday: number
  pendingPayment: number
  totalRevenue: number
  revenueThisMonth: number
  totalCustomers: number
  totalVehicles: number
}

export const dashboardApi = {
  getKPIs: async (): Promise<ApiResponse<DashboardKPIs>> => {
    const supabase = createClient()

    try {
      // Get all orders with payment info
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('status, total, amount_paid, delivery_date, payment_status')

      if (ordersError) {
        console.error('Error fetching orders:', ordersError)
      }

      // Get customer count
      const { count: customersCount, error: customersError } = await supabase
        .from('owners')
        .select('*', { count: 'exact', head: true })

      if (customersError) {
        console.error('Error counting customers:', customersError)
      }

      // Get vehicle count
      const { count: vehiclesCount, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('*', { count: 'exact', head: true })

      if (vehiclesError) {
        console.error('Error counting vehicles:', vehiclesError)
      }

      const today = new Date().toISOString().split('T')[0]
      const thisMonthStart = new Date()
      thisMonthStart.setDate(1)
      thisMonthStart.setHours(0, 0, 0, 0)

      // Calculate KPIs
      const kpis: DashboardKPIs = {
        totalOrders: orders?.length || 0,
        // Órdenes Abiertas (new, diagnosis, waiting_approval)
        openOrders: orders?.filter(o =>
          ['new', 'diagnosis', 'waiting_approval'].includes(o.status)
        ).length || 0,
        // En Proceso (approved, in_progress, waiting_parts, quality_check)
        inProgressOrders: orders?.filter(o =>
          ['approved', 'in_progress', 'waiting_parts', 'quality_check'].includes(o.status)
        ).length || 0,
        // Completadas hoy (delivered con fecha de hoy)
        completedToday: orders?.filter(o =>
          o.status === 'delivered' && o.delivery_date?.startsWith(today)
        ).length || 0,
        // Pendientes de pago (payment_status != 'paid')
        pendingPayment: orders?.filter(o =>
          o.payment_status && o.payment_status !== 'paid'
        ).length || 0,
        // Ingresos totales (suma de amount_paid de todas las órdenes)
        totalRevenue: orders?.reduce((sum, o) => sum + (o.amount_paid || 0), 0) || 0,
        // Ingresos del mes (suma de amount_paid de órdenes entregadas este mes)
        revenueThisMonth: orders?.filter(o => {
          if (!o.delivery_date) return false
          const deliveryDate = new Date(o.delivery_date)
          return deliveryDate >= thisMonthStart
        }).reduce((sum, o) => sum + (o.amount_paid || 0), 0) || 0,
        totalCustomers: customersCount || 0,
        totalVehicles: vehiclesCount || 0
      }

      return createSuccessResponse(kpis)
    } catch (error) {
      console.error('Error getting dashboard KPIs:', error)
      return createErrorResponse('Error al obtener estadísticas del dashboard')
    }
  },

  getRecentActivity: async (limit: number = 10): Promise<ApiResponse<TimelineEntry[]>> => {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('timeline_entries')
      .select('*, author:profiles!author_id(*), order:orders(folio)')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      return createErrorResponse(error.message)
    }

    return createSuccessResponse(data as TimelineEntry[])
  },

  getRecentMessages: async (limit: number = 5): Promise<ApiResponse<WhatsAppMessage[]>> => {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('whatsapp_messages')
      .select('*, owner:owners(name), order:orders(folio)')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      return createErrorResponse(error.message)
    }

    return createSuccessResponse(data as WhatsAppMessage[])
  }
}

// ============================================
// USERS API
// ============================================

export const usersApi = {
  getUsers: async (includeInactive: boolean = false): Promise<ApiResponse<Profile[]>> => {
    const supabase = createClient()

    let query = supabase
      .from('profiles')
      .select('*')
      .order('full_name')

    if (!includeInactive) {
      query = query.eq('is_active', true)
    }

    const { data, error } = await query

    if (error) {
      return createErrorResponse(error.message)
    }

    return createSuccessResponse(data)
  },

  getTechnicians: async (): Promise<ApiResponse<Profile[]>> => {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .in('role', ['technician', 'admin'])
      .eq('is_active', true)
      .order('full_name')

    if (error) {
      return createErrorResponse(error.message)
    }

    return createSuccessResponse(data)
  },

  getCurrentUser: async (): Promise<ApiResponse<Profile>> => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return createErrorResponse('No hay sesión activa')
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      return createErrorResponse(error.message)
    }

    return createSuccessResponse(data)
  },

  createUser: async (userData: {
    email: string
    password: string
    full_name: string
    role: Database['public']['Enums']['user_role']
    phone?: string | null
  }): Promise<ApiResponse<Profile>> => {
    const supabase = createClient()

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          full_name: userData.full_name,
          role: userData.role
        }
      }
    })

    if (authError) {
      return createErrorResponse(authError.message)
    }

    if (!authData.user) {
      return createErrorResponse('Error al crear usuario')
    }

    // Create or update profile with additional data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: authData.user.id,
        email: userData.email,
        full_name: userData.full_name,
        role: userData.role,
        phone: userData.phone,
        is_active: true
      })
      .select()
      .single()

    if (profileError) {
      return createErrorResponse(profileError.message)
    }

    return createSuccessResponse(profile, 'Usuario creado exitosamente')
  },

  updateProfile: async (id: string, profile: Partial<Profile>): Promise<ApiResponse<Profile>> => {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('profiles')
      .update(profile)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return createErrorResponse(error.message)
    }

    return createSuccessResponse(data, 'Perfil actualizado')
  },

  toggleUserStatus: async (id: string, isActive: boolean): Promise<ApiResponse<Profile>> => {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('profiles')
      .update({ is_active: isActive })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return createErrorResponse(error.message)
    }

    return createSuccessResponse(data, isActive ? 'Usuario activado' : 'Usuario desactivado')
  }
}

// ============================================
// CONFIG API
// ============================================

export const configApi = {
  getWorkshopConfig: async (): Promise<ApiResponse<WorkshopConfig>> => {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('workshop_config')
      .select('*')
      .maybeSingle()

    if (error) {
      return createErrorResponse(error.message)
    }

    // If no config exists, create a default one
    if (!data) {
      const defaultConfig = {
        name: 'Mi Taller',
        order_prefix: 'ORD',
        order_counter: 0,
        currency: 'MXN',
        tax_regime: 'general',
        whatsapp_enabled: false
      }

      const { data: newConfig, error: insertError } = await supabase
        .from('workshop_config')
        .insert(defaultConfig)
        .select()
        .single()

      if (insertError) {
        return createErrorResponse(insertError.message)
      }

      return createSuccessResponse(newConfig)
    }

    return createSuccessResponse(data)
  },

  updateWorkshopConfig: async (config: Partial<WorkshopConfig>): Promise<ApiResponse<WorkshopConfig>> => {
    const supabase = createClient()

    // Check if config exists
    const { data: existing } = await supabase
      .from('workshop_config')
      .select('id')
      .maybeSingle()

    if (existing) {
      // Update existing config
      const { data, error } = await supabase
        .from('workshop_config')
        .update(config)
        .eq('id', existing.id)
        .select()
        .single()

      if (error) {
        return createErrorResponse(error.message)
      }

      return createSuccessResponse(data, 'Configuración actualizada')
    } else {
      // Create new config (upsert behavior)
      const defaultConfig = {
        name: config.name || 'Mi Taller',
        order_prefix: config.order_prefix || 'ORD',
        order_counter: 0,
        currency: config.currency || 'USD',
        tax_regime: config.tax_regime || 'general',
        whatsapp_enabled: config.whatsapp_enabled || false,
        ...config
      }

      const { data, error } = await supabase
        .from('workshop_config')
        .insert(defaultConfig)
        .select()
        .single()

      if (error) {
        return createErrorResponse(error.message)
      }

      return createSuccessResponse(data, 'Configuración creada')
    }
  }
}

// ============================================
// EXPENSE CATEGORIES API
// ============================================

export const expenseCategoriesApi = {
  getCategories: async (): Promise<ApiResponse<Database['public']['Tables']['expense_categories']['Row'][]>> => {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('expense_categories')
      .select('*')
      .order('name')

    if (error) {
      return createErrorResponse(error.message)
    }

    return createSuccessResponse(data)
  },

  createCategory: async (
    category: Database['public']['Tables']['expense_categories']['Insert']
  ): Promise<ApiResponse<Database['public']['Tables']['expense_categories']['Row']>> => {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('expense_categories')
      .insert(category)
      .select()
      .single()

    if (error) {
      return createErrorResponse(error.message)
    }

    return createSuccessResponse(data, 'Categoría creada exitosamente')
  },

  updateCategory: async (
    id: string,
    category: Database['public']['Tables']['expense_categories']['Update']
  ): Promise<ApiResponse<Database['public']['Tables']['expense_categories']['Row']>> => {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('expense_categories')
      .update(category)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return createErrorResponse(error.message)
    }

    return createSuccessResponse(data, 'Categoría actualizada exitosamente')
  },

  deleteCategory: async (id: string): Promise<ApiResponse<null>> => {
    const supabase = createClient()

    // Check if category is used in any expenses
    const { count } = await supabase
      .from('expenses')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', id)

    if (count && count > 0) {
      return createErrorResponse('No se puede eliminar la categoría porque tiene gastos asociados')
    }

    const { error } = await supabase
      .from('expense_categories')
      .delete()
      .eq('id', id)

    if (error) {
      return createErrorResponse(error.message)
    }

    return createSuccessResponse(null, 'Categoría eliminada exitosamente')
  }
}
