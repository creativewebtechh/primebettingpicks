jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}))

jest.mock('@/lib/auth', () => ({
  hashPassword: jest.fn(),
  generateToken: jest.fn(),
}))

jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}))

jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}))

import { POST } from '../route'
import { prisma } from '@/lib/prisma'
import { hashPassword, generateToken } from '@/lib/auth'
import { cookies } from 'next/headers'

const mockPrisma = jest.mocked(prisma)
const mockHashPassword = jest.mocked(hashPassword)
const mockGenerateToken = jest.mocked(generateToken)
const mockCookies = jest.mocked(cookies)

let requestCounter = 0
function makeRequest(body: unknown): Request {
  requestCounter++
  return new Request('http://localhost/api/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': `10.0.${Math.floor(requestCounter / 255)}.${requestCounter % 255}`,
    },
    body: JSON.stringify(body),
  })
}

const validBody = {
  name: 'John Doe',
  email: 'john@example.com',
  password: 'securePass1',
}

beforeEach(() => {
  jest.clearAllMocks()

  mockCookies.mockResolvedValue({
    set: jest.fn(),
  } as unknown as ReturnType<typeof cookies> extends Promise<infer T> ? T : never)

  mockHashPassword.mockResolvedValue('$2a$12$hashedpassword')
  mockGenerateToken.mockReturnValue('mock-jwt-token')

  mockPrisma.user.findUnique.mockResolvedValue(null)
  ;(mockPrisma.user.create as jest.Mock).mockResolvedValue({
    id: 'user-1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'user',
    createdAt: new Date(),
  })
})

describe('POST /api/auth/register', () => {
  describe('input validation', () => {
    it('returns 400 for empty body', async () => {
      const res = await POST(makeRequest({}))
      expect(res.status).toBe(400)
      const data = await res.json()
      expect(data.error).toBeTruthy()
    })

    it('returns 400 for missing email', async () => {
      const res = await POST(makeRequest({ name: 'John', password: '12345678' }))
      expect(res.status).toBe(400)
    })

    it('returns 400 for missing password', async () => {
      const res = await POST(makeRequest({ name: 'John', email: 'a@b.com' }))
      expect(res.status).toBe(400)
    })

    it('returns 400 for missing name', async () => {
      const res = await POST(makeRequest({ email: 'a@b.com', password: '12345678' }))
      expect(res.status).toBe(400)
    })

    it('returns 400 for short password', async () => {
      const res = await POST(
        makeRequest({ name: 'John', email: 'a@b.com', password: '123' })
      )
      expect(res.status).toBe(400)
    })

    it('returns 400 for invalid email format', async () => {
      const res = await POST(
        makeRequest({ name: 'John', email: 'not-email', password: '12345678' })
      )
      expect(res.status).toBe(400)
    })

    it('returns 400 for malformed JSON body', async () => {
      const req = new Request('http://localhost/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'not json{{{',
      })
      const res = await POST(req)
      expect(res.status).toBe(400)
    })
  })

  describe('successful registration', () => {
    it('returns 201 with user data', async () => {
      const res = await POST(makeRequest(validBody))
      expect(res.status).toBe(201)
      const data = await res.json()
      expect(data.user).toBeDefined()
      expect(data.user.email).toBe('john@example.com')
      expect(data.user.name).toBe('John Doe')
      expect(data.user.role).toBe('user')
    })

    it('does not return password in response', async () => {
      const res = await POST(makeRequest(validBody))
      const data = await res.json()
      expect(data.user.password).toBeUndefined()
    })

    it('does not return token in response body', async () => {
      const res = await POST(makeRequest(validBody))
      const data = await res.json()
      expect(data.token).toBeUndefined()
    })

    it('sets httpOnly session cookie', async () => {
      const mockSet = jest.fn()
      mockCookies.mockResolvedValue({ set: mockSet } as never)

      await POST(makeRequest(validBody))

      expect(mockSet).toHaveBeenCalledWith(
        'session',
        'mock-jwt-token',
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
        })
      )
    })

    it('hashes the password before storing', async () => {
      await POST(makeRequest(validBody))
      expect(mockHashPassword).toHaveBeenCalledWith('securePass1')
    })

    it('generates a JWT token', async () => {
      await POST(makeRequest(validBody))
      expect(mockGenerateToken).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'john@example.com',
          role: 'user',
        })
      )
    })

    it('creates user in database', async () => {
      await POST(makeRequest(validBody))
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'John Doe',
          email: 'john@example.com',
          password: '$2a$12$hashedpassword',
        }),
        select: expect.objectContaining({
          id: true,
          email: true,
          role: true,
        }),
      })
    })
  })

  describe('duplicate email', () => {
    it('returns 409 when email already exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'existing-user',
        name: 'Existing',
        email: 'john@example.com',
        password: 'hashed',
        role: 'user',
        avatar: null,
        emailVerified: false,
        favorites: null,
        stripeCustomerId: null,
        paystackCustomerId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const res = await POST(makeRequest(validBody))
      expect(res.status).toBe(409)
      const data = await res.json()
      expect(data.error).toContain('already exists')
    })

    it('does not attempt to create user when email exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'existing-user',
        name: 'Existing',
        email: 'john@example.com',
        password: 'hashed',
        role: 'user',
        avatar: null,
        emailVerified: false,
        favorites: null,
        stripeCustomerId: null,
        paystackCustomerId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      await POST(makeRequest(validBody))
      expect(mockPrisma.user.create).not.toHaveBeenCalled()
    })
  })

  describe('error handling', () => {
    it('returns 503 when database lookup fails', async () => {
      mockPrisma.user.findUnique.mockRejectedValue(new Error('Connection refused'))

      const res = await POST(makeRequest(validBody))
      expect(res.status).toBe(503)
      const data = await res.json()
      expect(data.error).not.toContain('Connection')
      expect(data.error).not.toContain('password')
    })

    it('returns 503 when user creation fails', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null)
      mockPrisma.user.create.mockRejectedValue(new Error('DB write error'))

      const res = await POST(makeRequest(validBody))
      expect(res.status).toBe(503)
      const data = await res.json()
      expect(data.error).not.toContain('DB')
    })

    it('returns 409 on Prisma unique constraint violation (race condition)', async () => {
      const prismaError = Object.assign(new Error('Unique constraint'), {
        code: 'P2002',
      })
      mockPrisma.user.findUnique.mockResolvedValue(null)
      mockPrisma.user.create.mockRejectedValue(prismaError)

      const res = await POST(makeRequest(validBody))
      expect(res.status).toBe(409)
      const data = await res.json()
      expect(data.error).toContain('already exists')
    })

    it('returns 503 when password hashing fails', async () => {
      mockHashPassword.mockRejectedValue(new Error('Hash error'))

      const res = await POST(makeRequest(validBody))
      expect(res.status).toBe(503)
    })

    it('returns 500 for unhandled errors', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null)
      ;(mockPrisma.user.create as jest.Mock).mockResolvedValue({
        id: 'user-1',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'user',
        createdAt: new Date(),
      })
      mockCookies.mockRejectedValue(new Error('Cookie store unavailable'))

      const res = await POST(makeRequest(validBody))
      expect(res.status).toBe(500)
    })

    it('never exposes internal error details to client', async () => {
      mockPrisma.user.findUnique.mockRejectedValue(
        new Error('SECRET_DB_PASSWORD=abc123')
      )

      const res = await POST(makeRequest(validBody))
      const data = await res.json()
      expect(data.error).not.toContain('SECRET')
      expect(data.error).not.toContain('abc123')
    })
  })

  describe('email normalization', () => {
    it('lowercases email before storing', async () => {
      await POST(
        makeRequest({ ...validBody, email: 'John@Example.COM' })
      )
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'john@example.com' },
        select: { id: true },
      })
    })

    it('trims whitespace from email', async () => {
      await POST(
        makeRequest({ ...validBody, email: '  john@example.com  ' })
      )
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'john@example.com' },
        select: { id: true },
      })
    })
  })

  describe('input sanitization', () => {
    it('trims whitespace from name', async () => {
      await POST(makeRequest({ ...validBody, name: '  John Doe  ' }))
      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ name: 'John Doe' }),
        })
      )
    })
  })
})
