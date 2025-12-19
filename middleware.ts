import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Routes that don't require authentication
const publicRoutes = ['/login', '/auth/callback', '/auth/confirm', '/es/login', '/es/auth']

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  // Create Supabase client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session if it exists
  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Check if the current path is public
  const isPublicRoute = publicRoutes.some(route => pathname.includes(route)) || pathname === '/' || pathname === '/es'

  // Check if the current path is a protected route
  const protectedPaths = ['/dashboard', '/ordenes', '/duenos', '/vehiculos', '/notificaciones', '/configuracion']
  const isProtectedRoute = protectedPaths.some(path => pathname.includes(path))

  // Redirect unauthenticated users from protected routes to login
  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/es/login'
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users from login to dashboard
  if (user && pathname.includes('/login')) {
    const url = request.nextUrl.clone()
    url.pathname = '/es/dashboard'
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: ['/', '/((?!api|_next|_vercel|.*\\..*).*)']
}
