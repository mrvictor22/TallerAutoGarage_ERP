import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getTwilioStatus } from '@/services/twilio'

interface ApiSuccessResponse {
  success: true
  data: {
    configured: boolean
    mode: 'sandbox' | 'production' | 'not_configured'
    whatsappNumber?: string
  }
}

interface ApiErrorResponse {
  success: false
  error: string
}

type ApiResponse = ApiSuccessResponse | ApiErrorResponse

/**
 * GET /api/whatsapp/status
 *
 * Returns the current Twilio configuration status.
 * Does not expose sensitive credentials.
 */
export async function GET(): Promise<Response> {
  try {
    // Verify authentication
    const supabase = await createClient()
    const { data: authData, error: authError } = await supabase.auth.getUser()

    if (authError || !authData.user) {
      const response: ApiResponse = { success: false, error: 'No autorizado' }
      return NextResponse.json(response, { status: 401 })
    }

    // Get Twilio status (safe to expose)
    const twilioStatus = getTwilioStatus()

    const response: ApiResponse = {
      success: true,
      data: twilioStatus
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error getting Twilio status:', error)
    const response: ApiResponse = {
      success: false,
      error: 'Error interno del servidor'
    }
    return NextResponse.json(response, { status: 500 })
  }
}
