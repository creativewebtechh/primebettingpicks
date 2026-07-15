import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword, generateToken } from '@/lib/auth'
import { cookies } from 'next/headers'
import { checkRateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

const loginAttempts = new Map<string, { count: number; resetTime: number }>()
const MAX_ATTEMPTS = 5
const LOCKOUT_MS = 15 * 60 * 1000

function getLoginAttemptKey(email: string, ip: string): string {
  return `login:${email}:${ip}`
}

function isLockedOut(key: string): boolean {
  const record = loginAttempts.get(key)
  if (!record) return false
  if (Date.now() > record.resetTime) {
    loginAttempts.delete(key)
    return false
  }
  return record.count >= MAX_ATTEMPTS
}

function recordFailedAttempt(key: string): void {
  const now = Date.now()
  const record = loginAttempts.get(key)
  if (!record || now > record.resetTime) {
    loginAttempts.set(key, { count: 1, resetTime: now + LOCKOUT_MS })
  } else {
    record.count++
  }
}

function resetAttempts(key: string): void {
  loginAttempts.delete(key)
}

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const rateLimit = checkRateLimit(`login-ip:${ip}`, { windowMs: 60 * 1000, maxRequests: 20 })
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
    }

    const attemptKey = getLoginAttemptKey(email, ip)
    if (isLockedOut(attemptKey)) {
      return NextResponse.json({ error: 'Account temporarily locked due to too many failed attempts. Please try again later.' }, { status: 429 })
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      recordFailedAttempt(attemptKey)
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    const valid = await verifyPassword(password, user.password)
    if (!valid) {
      recordFailedAttempt(attemptKey)
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    resetAttempts(attemptKey)

    const token = generateToken({ userId: user.id, email: user.email, role: user.role })
    const cookieStore = await cookies()
    cookieStore.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    })

    return NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar, createdAt: user.createdAt },
      token,
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
