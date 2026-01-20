import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true })

  // Clear authentication cookies
  response.cookies.delete('dashboard-auth')
  response.cookies.delete('dashboard-auth-hash')

  return response
}
