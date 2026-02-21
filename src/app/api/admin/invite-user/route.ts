import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import type { UserRole } from '@/types/database'

interface InviteUserRequest {
  email: string
  full_name: string
  role: UserRole
  phone?: string | null
  sendInvite: boolean
  password?: string
}

interface ApiSuccessResponse {
  success: true
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any
  message: string
}

interface ApiErrorResponse {
  success: false
  error: string
}

type ApiResponse = ApiSuccessResponse | ApiErrorResponse

export async function POST(request: NextRequest): Promise<Response> {
  // Create admin client at the start
  const adminClient = createAdminClient()

  try {
    // Verify the requesting user is authenticated
    const supabase = await createClient()
    const { data: authData, error: authError } = await supabase.auth.getUser()

    if (authError || !authData.user) {
      const response: ApiResponse = { success: false, error: 'No autorizado' }
      return NextResponse.json(response, { status: 401 })
    }

    const currentUserId = authData.user.id

    // Check if current user is admin
    const profileResult = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', currentUserId)
      .single()

    if (profileResult.error) {
      console.error('Profile error:', profileResult.error)
      const response: ApiResponse = { success: false, error: 'No se pudo verificar el perfil del usuario' }
      return NextResponse.json(response, { status: 403 })
    }

    // Explicitly type the data to work around TypeScript narrowing issue
    const userProfile = profileResult.data as { role: string } | null
    if (!userProfile || userProfile.role !== 'admin') {
      const response: ApiResponse = { success: false, error: 'Solo los administradores pueden crear usuarios' }
      return NextResponse.json(response, { status: 403 })
    }

    // Parse request body
    const body: InviteUserRequest = await request.json()
    const { email, full_name, role, phone, sendInvite, password } = body

    // Validate required fields
    if (!email || !full_name || !role) {
      const response: ApiResponse = { success: false, error: 'Faltan campos requeridos: email, full_name, role' }
      return NextResponse.json(response, { status: 400 })
    }

    // If not sending invite, password is required
    if (!sendInvite && (!password || password.length < 6)) {
      const response: ApiResponse = { success: false, error: 'La contrasena debe tener al menos 6 caracteres' }
      return NextResponse.json(response, { status: 400 })
    }

    // Define redirect URL for invitation emails
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
    if (!siteUrl) {
      const response: ApiResponse = { success: false, error: 'NEXT_PUBLIC_SITE_URL no está configurada' }
      return NextResponse.json(response, { status: 500 })
    }
    const redirectTo = `${siteUrl}/auth/callback`

    let userId: string

    if (sendInvite) {
      // Use inviteUserByEmail - sends an invitation email
      const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
        email,
        {
          data: {
            full_name,
            role
          },
          redirectTo
        }
      )

      if (inviteError) {
        console.error('Error inviting user:', inviteError)
        const response: ApiResponse = { success: false, error: inviteError.message }
        return NextResponse.json(response, { status: 400 })
      }

      if (!inviteData.user) {
        const response: ApiResponse = { success: false, error: 'Error al crear la invitacion' }
        return NextResponse.json(response, { status: 500 })
      }

      userId = inviteData.user.id
    } else {
      // Use createUser with a password - no email sent
      const { data: createData, error: createError } = await adminClient.auth.admin.createUser({
        email,
        password: password!,
        email_confirm: true, // Auto-confirm email since admin is creating
        user_metadata: {
          full_name,
          role
        }
      })

      if (createError) {
        console.error('Error creating user:', createError)
        const response: ApiResponse = { success: false, error: createError.message }
        return NextResponse.json(response, { status: 400 })
      }

      if (!createData.user) {
        const response: ApiResponse = { success: false, error: 'Error al crear el usuario' }
        return NextResponse.json(response, { status: 500 })
      }

      userId = createData.user.id
    }

    // Create or update the profile with is_approved: true
    // (since admin is creating the user, they're pre-approved)
    const profileToUpsert = {
      id: userId,
      email,
      full_name,
      role,
      phone: phone || null,
      is_active: true,
      is_approved: true
    }

    // Use a fresh admin client reference to work around TypeScript control flow analysis
    const adminClientForUpsert = createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const profilesTable = adminClientForUpsert.from('profiles') as any
    const { data: profile, error: profileUpsertError } = await profilesTable
      .upsert(profileToUpsert, {
        onConflict: 'id'
      })
      .select()
      .single()

    if (profileUpsertError) {
      console.error('Error upserting profile:', profileUpsertError)
      // User was created but profile failed - try to clean up
      // Note: We don't delete the auth user here as it might cause more issues
      const response: ApiResponse = {
        success: false,
        error: `Usuario creado pero fallo el perfil: ${profileUpsertError.message}`
      }
      return NextResponse.json(response, { status: 500 })
    }

    const successResponse: ApiResponse = {
      success: true,
      data: profile,
      message: sendInvite
        ? 'Invitacion enviada exitosamente. El usuario recibira un email para establecer su contrasena.'
        : 'Usuario creado exitosamente con la contrasena proporcionada.'
    }
    return NextResponse.json(successResponse)

  } catch (error) {
    console.error('Unexpected error in invite-user:', error)
    const response: ApiResponse = { success: false, error: 'Error interno del servidor' }
    return NextResponse.json(response, { status: 500 })
  }
}
