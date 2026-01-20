import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Allow login and auth API routes without authentication
  if (
    request.nextUrl.pathname === '/login' ||
    request.nextUrl.pathname.startsWith('/api/auth')
  ) {
    return NextResponse.next()
  }

  // Check if user is authenticated
  const authCookie = request.cookies.get('dashboard-auth')

  // If cookie is missing, redirect to login
  if (!authCookie) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Simple validation - just check if the auth cookie exists and has expected format
  // The actual password validation happens in the API route
  if (authCookie.value !== process.env.AUTH_SECRET) {
    const response = NextResponse.redirect(new URL('/login', request.url))
    response.cookies.delete('dashboard-auth')
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/', '/api/members/:path*'],
}
