'use client'

import { createClient } from '@/lib/supabase/client'
import { WhatsAppTemplate, WhatsAppMessage } from '@/types/database'
import { ApiResponse } from './supabase-api'

// ============================================
// Types
// ============================================

export interface WhatsAppMessageFilters {
  status?: string[]
  owner_id?: string
  date_from?: string
  date_to?: string
  template_id?: string
}

export interface WhatsAppStats {
  totalMessages: number
  sentToday: number
  deliveryRate: number
  messagesByStatus: {
    pending: number
    sent: number
    delivered: number
    read: number
    failed: number
  }
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
// Enhanced WhatsApp API
// ============================================

export const whatsappApiEnhanced = {
  // Templates
  getTemplates: async (includeInactive: boolean = false): Promise<ApiResponse<WhatsAppTemplate[]>> => {
    const supabase = createClient()

    let query = supabase
      .from('whatsapp_templates')
      .select('*')
      .order('name')

    if (!includeInactive) {
      query = query.eq('is_active', true)
    }

    const { data, error } = await query

    if (error) {
      return createErrorResponse(error.message)
    }

    return createSuccessResponse(data)
  },

  getTemplate: async (id: string): Promise<ApiResponse<WhatsAppTemplate>> => {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('whatsapp_templates')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      return createErrorResponse(error.message)
    }

    return createSuccessResponse(data)
  },

  createTemplate: async (template: Omit<WhatsAppTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<WhatsAppTemplate>> => {
    const supabase = createClient()

    // Extract variables from content
    const variableRegex = /{{(\w+)}}/g
    const variables: string[] = []
    let match
    while ((match = variableRegex.exec(template.content)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1])
      }
    }

    const { data, error } = await supabase
      .from('whatsapp_templates')
      .insert({ ...template, variables })
      .select()
      .single()

    if (error) {
      return createErrorResponse(error.message)
    }

    return createSuccessResponse(data, 'Plantilla creada exitosamente')
  },

  updateTemplate: async (id: string, template: Partial<WhatsAppTemplate>): Promise<ApiResponse<WhatsAppTemplate>> => {
    const supabase = createClient()

    // If content is being updated, re-extract variables
    const updates = { ...template }
    if (template.content) {
      const variableRegex = /{{(\w+)}}/g
      const variables: string[] = []
      let match
      while ((match = variableRegex.exec(template.content)) !== null) {
        if (!variables.includes(match[1])) {
          variables.push(match[1])
        }
      }
      updates.variables = variables
    }

    const { data, error } = await supabase
      .from('whatsapp_templates')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return createErrorResponse(error.message)
    }

    return createSuccessResponse(data, 'Plantilla actualizada exitosamente')
  },

  deleteTemplate: async (id: string): Promise<ApiResponse<null>> => {
    const supabase = createClient()

    const { error } = await supabase
      .from('whatsapp_templates')
      .delete()
      .eq('id', id)

    if (error) {
      return createErrorResponse(error.message)
    }

    return createSuccessResponse(null, 'Plantilla eliminada exitosamente')
  },

  duplicateTemplate: async (id: string): Promise<ApiResponse<WhatsAppTemplate>> => {
    const supabase = createClient()

    // Get original template
    const { data: original, error: fetchError } = await supabase
      .from('whatsapp_templates')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !original) {
      return createErrorResponse('Plantilla no encontrada')
    }

    // Create duplicate
    const { data, error } = await supabase
      .from('whatsapp_templates')
      .insert({
        name: `${original.name} (Copia)`,
        category: original.category,
        content: original.content,
        variables: original.variables,
        language: original.language,
        is_active: false
      })
      .select()
      .single()

    if (error) {
      return createErrorResponse(error.message)
    }

    return createSuccessResponse(data, 'Plantilla duplicada exitosamente')
  },

  // Messages
  getMessages: async (
    filters: WhatsAppMessageFilters = {},
    limit: number = 100
  ): Promise<ApiResponse<WhatsAppMessage[]>> => {
    const supabase = createClient()

    let query = supabase
      .from('whatsapp_messages')
      .select('*')
      .order('created_at', { ascending: false })

    // Apply filters
    if (filters.status?.length) {
      query = query.in('status', filters.status)
    }
    if (filters.owner_id) {
      query = query.eq('owner_id', filters.owner_id)
    }
    if (filters.template_id) {
      query = query.eq('template_id', filters.template_id)
    }
    if (filters.date_from) {
      query = query.gte('created_at', filters.date_from)
    }
    if (filters.date_to) {
      query = query.lte('created_at', filters.date_to)
    }

    const { data, error } = await query.limit(limit)

    if (error) {
      return createErrorResponse(error.message)
    }

    return createSuccessResponse(data)
  },

  getMessage: async (id: string): Promise<ApiResponse<WhatsAppMessage>> => {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('whatsapp_messages')
      .select('*')
      .eq('id', id)
      .single()

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
  },

  getStats: async (): Promise<ApiResponse<WhatsAppStats>> => {
    const supabase = createClient()

    const { data: messages } = await supabase
      .from('whatsapp_messages')
      .select('status, sent_at')

    const today = new Date().toISOString().split('T')[0]

    const stats: WhatsAppStats = {
      totalMessages: messages?.length || 0,
      sentToday: messages?.filter(m => m.sent_at?.startsWith(today)).length || 0,
      deliveryRate: messages?.length ? Math.round((messages.filter(m => m.status === 'delivered' || m.status === 'read').length / messages.length) * 100) : 0,
      messagesByStatus: {
        pending: messages?.filter(m => m.status === 'pending').length || 0,
        sent: messages?.filter(m => m.status === 'sent').length || 0,
        delivered: messages?.filter(m => m.status === 'delivered').length || 0,
        read: messages?.filter(m => m.status === 'read').length || 0,
        failed: messages?.filter(m => m.status === 'failed').length || 0
      }
    }

    return createSuccessResponse(stats)
  }
}
