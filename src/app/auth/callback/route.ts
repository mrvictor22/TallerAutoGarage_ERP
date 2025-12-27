import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const token_hash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type')
  const error = requestUrl.searchParams.get('error')
  const errorCode = requestUrl.searchParams.get('error_code')
  const errorDescription = requestUrl.searchParams.get('error_description')
  const origin = requestUrl.origin

  // Handle errors from Supabase
  if (error || errorCode) {
    const errorParams = new URLSearchParams()
    if (error) errorParams.set('error', error)
    if (errorCode) errorParams.set('error_code', errorCode)
    if (errorDescription) errorParams.set('error_description', errorDescription)
    return NextResponse.redirect(`${origin}/es/login?${errorParams.toString()}`)
  }

  const supabase = await createClient()

  // Handle token_hash (from email confirmation links)
  if (token_hash && type) {
    const { error: verifyError } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as 'signup' | 'email' | 'recovery' | 'invite' | 'magiclink' | 'email_change'
    })

    if (verifyError) {
      const errorParams = new URLSearchParams({
        error: 'verification_failed',
        error_description: verifyError.message
      })
      return NextResponse.redirect(`${origin}/es/login?${errorParams.toString()}`)
    }

    // Handle different auth flow types
    switch (type) {
      case 'recovery':
        // Password reset flow - redirect to reset password page
        return NextResponse.redirect(`${origin}/es/reset-password`)

      case 'magiclink':
        // Magic link login - verify user is approved and redirect
        const { data: { session: magicSession } } = await supabase.auth.getSession()

        if (magicSession?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('is_approved, email')
            .eq('id', magicSession.user.id)
            .single() as { data: { is_approved: boolean; email: string } | null }

          const isSuperAdmin = profile?.email === 'vc70383@hotmail.com'

          if (profile?.is_approved || isSuperAdmin) {
            // Approved user - go to dashboard
            return NextResponse.redirect(`${origin}/es/dashboard`)
          } else {
            // Not approved - sign out and show pending message
            await supabase.auth.signOut()
            const successParams = new URLSearchParams({
              confirmed: 'true',
              message: 'pending_approval',
              error_description: 'Tu cuenta está pendiente de aprobación. El administrador debe aprobar tu acceso.'
            })
            return NextResponse.redirect(`${origin}/es/login?${successParams.toString()}`)
          }
        }
        // If no session, redirect to login with error
        return NextResponse.redirect(`${origin}/es/login?error=session_failed&error_description=No se pudo establecer la sesión`)

      case 'email_change':
        // Email change confirmation - redirect to login with success message
        const successParams = new URLSearchParams({
          confirmed: 'true',
          message: 'email_updated',
          error_description: 'Tu correo electrónico ha sido actualizado exitosamente. Inicia sesión con tu nuevo correo.'
        })
        return NextResponse.redirect(`${origin}/es/login?${successParams.toString()}`)

      case 'signup':
        // Email confirmation after signup - redirect to login with success message
        const signupParams = new URLSearchParams({
          confirmed: 'true',
          message: 'email_verified',
          error_description: 'Tu correo ha sido verificado. Ahora puedes iniciar sesión.'
        })
        return NextResponse.redirect(`${origin}/es/login?${signupParams.toString()}`)

      default:
        // Default case - email verified
        const defaultParams = new URLSearchParams({
          confirmed: 'true',
          message: 'email_verified'
        })
        return NextResponse.redirect(`${origin}/es/login?${defaultParams.toString()}`)
    }
  }

  // Handle code exchange (PKCE flow)
  if (code) {
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      const errorParams = new URLSearchParams({
        error: 'exchange_failed',
        error_description: exchangeError.message
      })
      return NextResponse.redirect(`${origin}/es/login?${errorParams.toString()}`)
    }

    // Check if user is approved
    if (data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_approved, email')
        .eq('id', data.user.id)
        .single() as { data: { is_approved: boolean; email: string } | null }

      const isSuperAdmin = profile?.email === 'vc70383@hotmail.com'

      if (profile?.is_approved || isSuperAdmin) {
        // Approved user - go to dashboard
        return NextResponse.redirect(`${origin}/es/dashboard`)
      } else {
        // Not approved - sign out and show pending message
        await supabase.auth.signOut()
        const successParams = new URLSearchParams({
          confirmed: 'true',
          message: 'pending_approval',
          error_description: 'Tu cuenta está pendiente de aprobación. El administrador debe aprobar tu acceso.'
        })
        return NextResponse.redirect(`${origin}/es/login?${successParams.toString()}`)
      }
    }
  }

  // No code or token provided, redirect to login
  return NextResponse.redirect(`${origin}/es/login`)
}
