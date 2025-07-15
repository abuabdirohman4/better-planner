import { NextResponse, type NextRequest } from 'next/server'

import { createClient } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  try {
    const { supabase, response } = createClient(request)
    const { data: { session } } = await supabase.auth.getSession()

    const { pathname } = request.nextUrl

    // Jika user tidak login dan tidak berada di halaman auth, redirect ke signin
    if (!session && pathname !== '/signin' && pathname !== '/signup') {
      return NextResponse.redirect(new URL('/signin', request.url))
    }

    // Jika user sudah login dan mencoba mengakses halaman signin/signup, redirect ke dashboard
    if (session && (pathname === '/signin' || pathname === '/signup')) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return response
  } catch {
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    })
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images (public images)
     */
    '/((?!_next/static|_next/image|favicon.ico|images/).*)',
  ],
} 