import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
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
    return NextResponse.redirect(`${origin}?${errorParams.toString()}`)
  }

  if (code) {
    const supabase = await createClient()
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      // Redirect to landing with error
      const errorParams = new URLSearchParams({
        error: 'exchange_failed',
        error_description: exchangeError.message
      })
      return NextResponse.redirect(`${origin}?${errorParams.toString()}`)
    }

    // Success - redirect to dashboard
    return NextResponse.redirect(`${origin}/es/dashboard`)
  }

  // No code provided, redirect to landing
  return NextResponse.redirect(origin)
}
