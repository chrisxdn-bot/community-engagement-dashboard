import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, resetRateLimit } from '@/lib/rate-limit'

// Generate a secure session token
function generateSessionToken(): string {
  const randomBytes = crypto.getRandomValues(new Uint8Array(32))
  return Array.from(randomBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()

    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
               request.headers.get('x-real-ip') ||
               'unknown'

    // Check rate limit
    const rateLimit = checkRateLimit(ip)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many attempts. Please try again in 15 minutes.' },
        { status: 429 }
      )
    }

    // Compare password with environment variable
    const correctPassword = process.env.DASHBOARD_PASSWORD || 'changeme'

    if (password === correctPassword) {
      // Reset rate limit on successful login
      resetRateLimit(ip)

      // Generate a secure auth secret
      const authSecret = process.env.AUTH_SECRET || generateSessionToken()

      const response = NextResponse.json({ success: true })

      // Set secure HTTP-only cookie
      response.cookies.set('dashboard-auth', authSecret, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      })

      return response
    }

    return NextResponse.json(
      {
        error: 'Invalid password',
        attemptsRemaining: rateLimit.remaining
      },
      { status: 401 }
    )
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
