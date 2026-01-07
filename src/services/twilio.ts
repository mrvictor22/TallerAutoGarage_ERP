import Twilio from 'twilio'

export interface TwilioConfig {
  accountSid: string
  authToken: string
  whatsappNumber: string
  sandboxNumber?: string
  useSandbox: boolean
}

export interface SendWhatsAppResult {
  success: boolean
  messageSid?: string
  error?: string
}

export interface TwilioStatusResponse {
  configured: boolean
  mode: 'sandbox' | 'production' | 'not_configured'
  whatsappNumber?: string
}

/**
 * Get Twilio configuration from environment variables.
 * Returns null if not configured.
 */
export function getTwilioConfig(): TwilioConfig | null {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER
  const sandboxNumber = process.env.TWILIO_SANDBOX_NUMBER
  const useSandbox = process.env.TWILIO_USE_SANDBOX === 'true'

  if (!accountSid || !authToken || !whatsappNumber) {
    return null
  }

  return {
    accountSid,
    authToken,
    whatsappNumber,
    sandboxNumber,
    useSandbox
  }
}

/**
 * Get the status of Twilio configuration.
 * Safe to expose to client (doesn't include sensitive data).
 */
export function getTwilioStatus(): TwilioStatusResponse {
  const config = getTwilioConfig()

  if (!config) {
    return {
      configured: false,
      mode: 'not_configured'
    }
  }

  return {
    configured: true,
    mode: config.useSandbox ? 'sandbox' : 'production',
    whatsappNumber: config.useSandbox
      ? config.sandboxNumber || config.whatsappNumber
      : config.whatsappNumber
  }
}

/**
 * Create a Twilio client instance.
 * IMPORTANT: Only use in server-side code.
 */
export function createTwilioClient(): Twilio.Twilio | null {
  const config = getTwilioConfig()

  if (!config) {
    return null
  }

  return Twilio(config.accountSid, config.authToken)
}

/**
 * Get the WhatsApp number to use for sending messages.
 * Returns the appropriate number based on sandbox/production mode.
 */
export function getWhatsAppFromNumber(): string | null {
  const config = getTwilioConfig()

  if (!config) {
    return null
  }

  const number = config.useSandbox
    ? (config.sandboxNumber || config.whatsappNumber)
    : config.whatsappNumber

  // Twilio WhatsApp requires 'whatsapp:' prefix
  return `whatsapp:${number}`
}

/**
 * Format a phone number for WhatsApp.
 * Ensures the number has the 'whatsapp:' prefix and proper country code.
 *
 * Default country code is +503 (El Salvador) if not specified.
 * Can be overridden with TWILIO_DEFAULT_COUNTRY_CODE env var.
 */
export function formatWhatsAppNumber(phoneNumber: string): string {
  // Remove any existing whatsapp: prefix
  const cleanNumber = phoneNumber.replace(/^whatsapp:/, '')

  // Remove spaces, dashes, and parentheses
  const normalized = cleanNumber.replace(/[\s\-\(\)]/g, '')

  // Check if number already has a country code (starts with +)
  if (normalized.startsWith('+')) {
    return `whatsapp:${normalized}`
  }

  // Get default country code from env or use El Salvador (+503)
  const defaultCountryCode = process.env.TWILIO_DEFAULT_COUNTRY_CODE || '+503'

  // If number starts with the country code without +, add just the +
  // e.g., "50379312064" -> "+50379312064"
  if (normalized.startsWith(defaultCountryCode.replace('+', ''))) {
    return `whatsapp:+${normalized}`
  }

  // Otherwise, prepend the default country code
  // e.g., "79312064" -> "+50379312064"
  return `whatsapp:${defaultCountryCode}${normalized}`
}

/**
 * Send a WhatsApp message using Twilio.
 * IMPORTANT: Only use in server-side code (API routes).
 */
export async function sendWhatsAppMessage(
  to: string,
  body: string
): Promise<SendWhatsAppResult> {
  const client = createTwilioClient()
  const fromNumber = getWhatsAppFromNumber()

  if (!client || !fromNumber) {
    return {
      success: false,
      error: 'Twilio no está configurado. Verifique las variables de entorno.'
    }
  }

  try {
    const message = await client.messages.create({
      from: fromNumber,
      to: formatWhatsAppNumber(to),
      body: body
    })

    return {
      success: true,
      messageSid: message.sid
    }
  } catch (error) {
    console.error('Error sending WhatsApp message:', error)

    const errorMessage = error instanceof Error
      ? error.message
      : 'Error desconocido al enviar mensaje'

    return {
      success: false,
      error: errorMessage
    }
  }
}

/**
 * Validate Twilio webhook signature.
 * Use this to verify that webhook requests are actually from Twilio.
 */
export function validateTwilioWebhook(
  signature: string,
  url: string,
  params: Record<string, string>
): boolean {
  const config = getTwilioConfig()

  if (!config) {
    return false
  }

  return Twilio.validateRequest(
    config.authToken,
    signature,
    url,
    params
  )
}

/**
 * Map Twilio message status to our internal status.
 */
export function mapTwilioStatus(twilioStatus: string): 'pending' | 'sent' | 'delivered' | 'read' | 'failed' {
  const statusMap: Record<string, 'pending' | 'sent' | 'delivered' | 'read' | 'failed'> = {
    'queued': 'pending',
    'sending': 'pending',
    'sent': 'sent',
    'delivered': 'delivered',
    'read': 'read',
    'failed': 'failed',
    'undelivered': 'failed'
  }

  return statusMap[twilioStatus.toLowerCase()] || 'pending'
}
