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
    return NextResponse.redirect(`${origin}/login?${errorParams.toString()}`)
  }

  const supabase = await createClient()

  // Handle token_hash (from email confirmation links)
  if (token_hash && type) {
    const { error: verifyError } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as 'signup' | 'email' | 'recovery' | 'invite'
    })

    if (verifyError) {
      const errorParams = new URLSearchParams({
        error: 'verification_failed',
        error_description: verifyError.message
      })
      return NextResponse.redirect(`${origin}/login?${errorParams.toString()}`)
    }

    // Email confirmed - redirect to login with success message
    const successParams = new URLSearchParams({
      confirmed: 'true',
      message: 'email_verified'
    })
    return NextResponse.redirect(`${origin}/login?${successParams.toString()}`)
  }

  // Handle code exchange (PKCE flow)
  if (code) {
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      const errorParams = new URLSearchParams({
        error: 'exchange_failed',
        error_description: exchangeError.message
      })
      return NextResponse.redirect(`${origin}/login?${errorParams.toString()}`)
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
          message: 'pending_approval'
        })
        return NextResponse.redirect(`${origin}/login?${successParams.toString()}`)
      }
    }
  }

  // No code provided, redirect to login
  return NextResponse.redirect(`${origin}/login`)
}
