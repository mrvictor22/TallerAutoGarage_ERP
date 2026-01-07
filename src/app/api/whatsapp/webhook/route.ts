import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { validateTwilioWebhook, mapTwilioStatus } from '@/services/twilio'

/**
 * Twilio WhatsApp Webhook Handler
 *
 * Receives status updates from Twilio when message status changes:
 * - queued: Message is queued for sending
 * - sending: Message is being sent
 * - sent: Message sent to carrier
 * - delivered: Message delivered to recipient
 * - read: Message read by recipient (WhatsApp only)
 * - failed: Message failed to send
 * - undelivered: Message undelivered
 *
 * Configure this URL in Twilio Console:
 * https://your-domain.com/api/whatsapp/webhook
 */
export async function POST(request: NextRequest): Promise<Response> {
  try {
    // Parse form data (Twilio sends as application/x-www-form-urlencoded)
    const formData = await request.formData()
    const params: Record<string, string> = {}

    formData.forEach((value, key) => {
      params[key] = value.toString()
    })

    // Get Twilio signature from headers
    const twilioSignature = request.headers.get('X-Twilio-Signature')

    // Validate webhook signature (optional but recommended for production)
    if (twilioSignature) {
      const url = request.url
      const isValid = validateTwilioWebhook(twilioSignature, url, params)

      if (!isValid) {
        console.warn('Invalid Twilio webhook signature')
        // In production, you might want to reject invalid signatures
        // return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
      }
    }

    // Extract relevant fields from Twilio webhook
    const messageSid = params.MessageSid || params.SmsSid
    const messageStatus = params.MessageStatus || params.SmsStatus
    const errorCode = params.ErrorCode
    const errorMessage = params.ErrorMessage

    if (!messageSid || !messageStatus) {
      console.warn('Missing required fields in webhook:', params)
      return NextResponse.json({ received: true })
    }

    console.log(`Twilio webhook: MessageSid=${messageSid}, Status=${messageStatus}`)

    // Get admin client for database operations
    const adminClient = createAdminClient()

    // Find the message by external_id (Twilio MessageSid)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const messagesTable = adminClient.from('whatsapp_messages') as any
    const { data: messageData, error: findError } = await messagesTable
      .select('id, status')
      .eq('external_id', messageSid)
      .single()

    if (findError || !messageData) {
      console.warn(`Message not found for SID: ${messageSid}`)
      // Return 200 to acknowledge receipt (Twilio will retry otherwise)
      return NextResponse.json({ received: true, message: 'Message not found' })
    }

    const message = messageData as { id: string; status: string }

    // Map Twilio status to our internal status
    const newStatus = mapTwilioStatus(messageStatus)
    const now = new Date().toISOString()

    // Prepare update data
    const updateData: Record<string, string | null> = {
      status: newStatus
    }

    // Set appropriate timestamp based on status
    switch (newStatus) {
      case 'sent':
        updateData.sent_at = now
        break
      case 'delivered':
        updateData.delivered_at = now
        break
      case 'read':
        updateData.read_at = now
        break
      case 'failed':
        updateData.error_message = errorMessage || `Error code: ${errorCode || 'unknown'}`
        break
    }

    // Update the message record
    const { error: updateError } = await messagesTable
      .update(updateData)
      .eq('id', message.id)

    if (updateError) {
      console.error('Error updating message status:', updateError)
      // Still return 200 to prevent Twilio retries
    }

    console.log(`Updated message ${message.id} to status: ${newStatus}`)

    // Return 200 to acknowledge receipt
    return NextResponse.json({
      received: true,
      messageId: message.id,
      status: newStatus
    })

  } catch (error) {
    console.error('Error processing Twilio webhook:', error)
    // Return 200 to prevent Twilio from retrying
    return NextResponse.json({
      received: true,
      error: 'Processing error'
    })
  }
}

// Also handle GET requests (Twilio might send a verification request)
export async function GET(): Promise<Response> {
  return NextResponse.json({
    status: 'ok',
    message: 'Twilio WhatsApp webhook endpoint'
  })
}
