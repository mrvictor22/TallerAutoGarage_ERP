import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

interface ConfirmEmailRequest {
  userId: string
}

export async function POST(request: NextRequest): Promise<Response> {
  const adminClient = createAdminClient()

  try {
    // Verify the requesting user is authenticated and is admin
    const supabase = await createClient()
    const { data: authData, error: authError } = await supabase.auth.getUser()

    if (authError || !authData.user) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    // Check if current user is admin
    const profileResult = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', authData.user.id)
      .single()

    const currentUserProfile = profileResult.data as { role: string } | null
    if (!currentUserProfile || currentUserProfile.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Solo los administradores pueden confirmar emails' },
        { status: 403 }
      )
    }

    // Parse request body
    const body: ConfirmEmailRequest = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Falta el campo requerido: userId' },
        { status: 400 }
      )
    }

    // Confirm the user's email using admin API
    const { data: userData, error: updateError } = await adminClient.auth.admin.updateUserById(
      userId,
      { email_confirm: true }
    )

    if (updateError) {
      console.error('Error confirming email:', updateError)
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 400 }
      )
    }

    if (!userData.user) {
      return NextResponse.json(
        { success: false, error: 'No se encontró el usuario' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Email confirmado exitosamente. El usuario ahora puede iniciar sesión.'
    })

  } catch (error) {
    console.error('Unexpected error in confirm-email:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
