// Simple in-memory rate limiter
const attempts = new Map<string, { count: number; resetAt: number }>()

const WINDOW_MS = 15 * 60 * 1000 // 15 minutes
const MAX_ATTEMPTS = 5 // 5 attempts per window

export function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const record = attempts.get(ip)

  // Clean up expired records
  if (record && now > record.resetAt) {
    attempts.delete(ip)
  }

  const current = attempts.get(ip)

  if (!current) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return { allowed: true, remaining: MAX_ATTEMPTS - 1 }
  }

  if (current.count >= MAX_ATTEMPTS) {
    return { allowed: false, remaining: 0 }
  }

  current.count++
  return { allowed: true, remaining: MAX_ATTEMPTS - current.count }
}

export function resetRateLimit(ip: string): void {
  attempts.delete(ip)
}
