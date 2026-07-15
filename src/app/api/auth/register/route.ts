import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, generateToken } from '@/lib/auth'
import { cookies } from 'next/headers'
import { logger } from '@/lib/logger'
import { validateRegistrationInput, sanitizeString } from '@/lib/validation'
import { sendTelegramMessage, formatNewUserNotification } from '@/lib/telegram'

export const dynamic = 'force-dynamic'

const registerAttempts = new Map<string, { count: number; resetAt: number }>()
const MAX_REGISTER_ATTEMPTS = 5
const REGISTER_LOCKOUT_MS = 15 * 60 * 1000

function isRegisterLockedOut(ip: string): boolean {
  const record = registerAttempts.get(ip)
  if (!record) return false
  if (Date.now() > record.resetAt) {
    registerAttempts.delete(ip)
    return false
  }
  return record.count >= MAX_REGISTER_ATTEMPTS
}

function recordRegisterAttempt(ip: string): void {
  const now = Date.now()
  const record = registerAttempts.get(ip)
  if (!record || now > record.resetAt) {
    registerAttempts.set(ip, { count: 1, resetAt: now + REGISTER_LOCKOUT_MS })
  } else {
    record.count++
  }
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID().slice(0, 8)

  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

    if (isRegisterLockedOut(ip)) {
      return NextResponse.json(
        { error: 'Too many registration attempts. Please try again later.' },
        { status: 429 }
      )
    }

    let body: { name?: string; email?: string; password?: string }
    try {
      body = await request.json()
    } catch {
      logger.error('Register: malformed request body', { requestId })
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      )
    }

    const name = body.name ? sanitizeString(body.name) : undefined
    const email = body.email ? sanitizeString(body.email).toLowerCase() : undefined
    const password = body.password

    const validation = validateRegistrationInput({ name, email, password })
    if (!validation.valid) {
      logger.warn('Register: validation failed', {
        requestId,
        errors: validation.errors.map((e) => `${e.field}: ${e.message}`),
      })
      const message =
        validation.errors.length === 1
          ? validation.errors[0].message
          : 'Please check your input and try again'
      recordRegisterAttempt(ip)
      return NextResponse.json({ error: message }, { status: 400 })
    }

    let existing: { id: string } | null = null
    try {
      existing = await prisma.user.findUnique({
        where: { email: email! },
        select: { id: true },
      })
    } catch (dbError) {
      logger.error('Register: database lookup failed', {
        requestId,
        dbError:
          dbError instanceof Error ? dbError.message : 'Unknown DB error',
      })
      return NextResponse.json(
        { error: 'Unable to process registration. Please try again later.' },
        { status: 503 }
      )
    }

    if (existing) {
      logger.info('Register: email already registered', { requestId })
      recordRegisterAttempt(ip)
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      )
    }

    let hashedPassword: string
    try {
      hashedPassword = await hashPassword(password!)
    } catch (hashError) {
      logger.error('Register: password hashing failed', {
        requestId,
        hashError:
          hashError instanceof Error ? hashError.message : 'Unknown hash error',
      })
      return NextResponse.json(
        { error: 'Unable to process registration. Please try again later.' },
        { status: 503 }
      )
    }

    let user: {
      id: string
      name: string | null
      email: string
      role: string
      createdAt: Date
    }
    try {
      user = await prisma.user.create({
        data: { name, email: email!, password: hashedPassword },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      })
    } catch (dbError: unknown) {
      const prismaCode =
        dbError && typeof dbError === 'object' && 'code' in dbError
          ? (dbError as { code: string }).code
          : null

      if (prismaCode === 'P2002') {
        logger.info('Register: race condition duplicate email', { requestId })
        recordRegisterAttempt(ip)
        return NextResponse.json(
          { error: 'An account with this email already exists' },
          { status: 409 }
        )
      }

      logger.error('Register: user creation failed', {
        requestId,
        prismaCode,
        dbError:
          dbError instanceof Error ? dbError.message : 'Unknown DB error',
      })
      return NextResponse.json(
        { error: 'Unable to create your account. Please try again later.' },
        { status: 503 }
      )
    }

    try {
      await sendTelegramMessage(formatNewUserNotification({
        name: body.name || 'Anonymous',
        email: body.email || '',
      }))
    } catch { /* don't fail registration */ }

    let token: string
    try {
      token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      })
    } catch (tokenError) {
      logger.error('Register: token generation failed', {
        requestId,
        tokenError:
          tokenError instanceof Error
            ? tokenError.message
            : 'Unknown token error',
      })
      return NextResponse.json(
        { error: 'Account created but sign-in failed. Please log in.' },
        { status: 201 }
      )
    }

    const cookieStore = await cookies()
    cookieStore.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    })

    logger.info('Register: user created successfully', {
      requestId,
      userId: user.id,
    })

    return NextResponse.json({ user }, { status: 201 })
  } catch (error) {
    logger.error('Register: unhandled error', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again later.' },
      { status: 500 }
    )
  }
}
