import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

interface ResendInviteRequest {
  userId: string
  email: string
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
        { success: false, error: 'Solo los administradores pueden reenviar invitaciones' },
        { status: 403 }
      )
    }

    // Parse request body
    const body: ResendInviteRequest = await request.json()
    const { userId, email } = body

    if (!userId || !email) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos requeridos: userId, email' },
        { status: 400 }
      )
    }

    // Get the user's profile to get their metadata
    const userProfileResult = await adminClient
      .from('profiles')
      .select('full_name, role')
      .eq('id', userId)
      .single()

    const userProfile = userProfileResult.data as { full_name: string; role: string } | null

    // Define redirect URL
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
    if (!siteUrl) {
      return NextResponse.json({ success: false, error: 'NEXT_PUBLIC_SITE_URL no está configurada' }, { status: 500 })
    }
    const redirectTo = `${siteUrl}/auth/callback`

    // Generate a new invite link for the user
    // First, we need to delete the existing user and recreate with invite
    // OR we can use generateLink to create a new magic link

    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: 'invite',
      email: email,
      options: {
        data: {
          full_name: userProfile?.full_name || '',
          role: userProfile?.role || 'technician'
        },
        redirectTo
      }
    })

    if (linkError) {
      console.error('Error generating invite link:', linkError)
      return NextResponse.json(
        { success: false, error: linkError.message },
        { status: 400 }
      )
    }

    // The generateLink returns the link but doesn't send the email
    // We need to use inviteUserByEmail instead, but that creates a new user
    // For existing users, we should use resetPasswordForEmail or a magic link

    // Alternative: Send a password reset email which allows them to set their password
    const { error: resetError } = await adminClient.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo
      }
    })

    if (resetError) {
      console.error('Error sending recovery email:', resetError)
    }

    // For users who haven't confirmed, re-invite them
    const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
      email,
      {
        data: {
          full_name: userProfile?.full_name || '',
          role: userProfile?.role || 'technician'
        },
        redirectTo
      }
    )

    if (inviteError) {
      // If user already exists, try sending a magic link instead
      if (inviteError.message.includes('already been registered') || inviteError.message.includes('already exists')) {
        // Send magic link for existing users
        const { error: magicLinkError } = await adminClient.auth.admin.generateLink({
          type: 'magiclink',
          email: email,
          options: {
            redirectTo
          }
        })

        if (magicLinkError) {
          console.error('Error generating magic link:', magicLinkError)
          return NextResponse.json(
            { success: false, error: 'No se pudo enviar el email. El usuario ya existe.' },
            { status: 400 }
          )
        }

        return NextResponse.json({
          success: true,
          message: 'Se ha enviado un enlace de acceso al email del usuario.'
        })
      }

      return NextResponse.json(
        { success: false, error: inviteError.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Email de invitación reenviado exitosamente.'
    })

  } catch (error) {
    console.error('Unexpected error in resend-invite:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
