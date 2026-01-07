import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { sendWhatsAppMessage, getTwilioConfig } from '@/services/twilio'
import type { WhatsAppTemplate } from '@/types/database'

interface SendMessageRequest {
  ownerId: string
  orderId?: string | null
  templateId: string
  variables: Record<string, string>
  phoneNumber: string
}

interface ApiSuccessResponse {
  success: true
  data: {
    messageId: string
    externalId?: string
    status: string
  }
  message: string
}

interface ApiErrorResponse {
  success: false
  error: string
}

type ApiResponse = ApiSuccessResponse | ApiErrorResponse

export async function POST(request: NextRequest): Promise<Response> {
  const adminClient = createAdminClient()

  try {
    // Verify authentication
    const supabase = await createClient()
    const { data: authData, error: authError } = await supabase.auth.getUser()

    if (authError || !authData.user) {
      const response: ApiResponse = { success: false, error: 'No autorizado' }
      return NextResponse.json(response, { status: 401 })
    }

    const currentUserId = authData.user.id

    // Check if Twilio is configured
    const twilioConfig = getTwilioConfig()
    if (!twilioConfig) {
      const response: ApiResponse = {
        success: false,
        error: 'Twilio no está configurado. Contacte al administrador.'
      }
      return NextResponse.json(response, { status: 503 })
    }

    // Parse request body
    const body: SendMessageRequest = await request.json()
    const { ownerId, orderId, templateId, variables, phoneNumber } = body

    // Validate required fields
    if (!ownerId || !templateId || !phoneNumber) {
      const response: ApiResponse = {
        success: false,
        error: 'Faltan campos requeridos: ownerId, templateId, phoneNumber'
      }
      return NextResponse.json(response, { status: 400 })
    }

    // Get the template
    const { data: templateData, error: templateError } = await adminClient
      .from('whatsapp_templates')
      .select('*')
      .eq('id', templateId)
      .single()

    if (templateError || !templateData) {
      const response: ApiResponse = {
        success: false,
        error: 'Plantilla no encontrada'
      }
      return NextResponse.json(response, { status: 404 })
    }

    const template = templateData as WhatsAppTemplate

    if (!template.is_active) {
      const response: ApiResponse = {
        success: false,
        error: 'La plantilla está inactiva'
      }
      return NextResponse.json(response, { status: 400 })
    }

    // Verify owner has WhatsApp consent
    const { data: ownerData, error: ownerError } = await adminClient
      .from('owners')
      .select('id, full_name, whatsapp_consent')
      .eq('id', ownerId)
      .single()

    if (ownerError || !ownerData) {
      const response: ApiResponse = {
        success: false,
        error: 'Cliente no encontrado'
      }
      return NextResponse.json(response, { status: 404 })
    }

    const owner = ownerData as { id: string; full_name: string; whatsapp_consent: boolean }

    if (!owner.whatsapp_consent) {
      const response: ApiResponse = {
        success: false,
        error: 'El cliente no ha dado consentimiento para recibir mensajes de WhatsApp'
      }
      return NextResponse.json(response, { status: 400 })
    }

    // Replace variables in template content
    let messageContent = template.content
    for (const [key, value] of Object.entries(variables)) {
      messageContent = messageContent.replace(new RegExp(`{{${key}}}`, 'g'), value)
    }

    // Create message record with status 'pending'
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const messagesTable = adminClient.from('whatsapp_messages') as any
    const { data: messageRecord, error: insertError } = await messagesTable
      .insert({
        owner_id: ownerId,
        order_id: orderId || null,
        template_id: templateId,
        phone_number: phoneNumber,
        content: messageContent,
        variables: variables,
        status: 'pending',
        created_by: currentUserId
      })
      .select()
      .single()

    if (insertError || !messageRecord) {
      console.error('Error creating message record:', insertError)
      const response: ApiResponse = {
        success: false,
        error: 'Error al crear el registro del mensaje'
      }
      return NextResponse.json(response, { status: 500 })
    }

    // Send message via Twilio
    const twilioResult = await sendWhatsAppMessage(phoneNumber, messageContent)

    if (twilioResult.success && twilioResult.messageSid) {
      // Update message record with success
      await messagesTable
        .update({
          status: 'sent',
          external_id: twilioResult.messageSid,
          sent_at: new Date().toISOString()
        })
        .eq('id', messageRecord.id)

      // Add timeline entry if order exists
      if (orderId) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const timelineTable = adminClient.from('timeline_entries') as any
        await timelineTable
          .insert({
            order_id: orderId,
            type: 'message_sent',
            title: 'Mensaje WhatsApp enviado',
            description: `Mensaje enviado a ${owner.full_name}`,
            author_id: currentUserId
          })
      }

      const successResponse: ApiResponse = {
        success: true,
        data: {
          messageId: messageRecord.id,
          externalId: twilioResult.messageSid,
          status: 'sent'
        },
        message: 'Mensaje enviado exitosamente'
      }
      return NextResponse.json(successResponse)

    } else {
      // Update message record with failure
      await messagesTable
        .update({
          status: 'failed',
          error_message: twilioResult.error || 'Error desconocido'
        })
        .eq('id', messageRecord.id)

      const response: ApiResponse = {
        success: false,
        error: twilioResult.error || 'Error al enviar el mensaje por WhatsApp'
      }
      return NextResponse.json(response, { status: 500 })
    }

  } catch (error) {
    console.error('Unexpected error in whatsapp/send:', error)
    const response: ApiResponse = {
      success: false,
      error: 'Error interno del servidor'
    }
    return NextResponse.json(response, { status: 500 })
  }
}
