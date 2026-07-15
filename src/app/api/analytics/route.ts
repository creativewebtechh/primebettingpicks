import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const rateLimit = checkRateLimit(`analytics:${ip}`, { windowMs: 60 * 1000, maxRequests: 30 })
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const { event, page, metadata } = await request.json()

    if (!event || typeof event !== 'string') {
      return NextResponse.json({ error: 'Event name is required' }, { status: 400 })
    }
    if (event.length > 100) {
      return NextResponse.json({ error: 'Event name too long' }, { status: 400 })
    }
    if (page && typeof page !== 'string') {
      return NextResponse.json({ error: 'Invalid page value' }, { status: 400 })
    }

    prisma.analyticsevent.create({
      data: { event, page: page || null, metadata: metadata ? JSON.stringify(metadata) : null, ip },
    }).catch(() => {})

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: true })
  }
}

export async function GET() {
  try {
    await requireAdmin()

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const [totalViews, uniqueVisitors, topPages] = await Promise.all([
      prisma.analyticsevent.count({
        where: { event: 'pageview', createdAt: { gte: thirtyDaysAgo } },
      }),
      prisma.analyticsevent.groupBy({
        by: ['ip'],
        where: { event: 'pageview', createdAt: { gte: thirtyDaysAgo } },
        _count: true,
      }),
      prisma.analyticsevent.groupBy({
        by: ['page'],
        where: { event: 'pageview', createdAt: { gte: thirtyDaysAgo } },
        _count: { page: true },
        orderBy: { _count: { page: 'desc' } },
        take: 10,
      }),
    ])

    return NextResponse.json({
      data: {
        totalViews,
        uniqueVisitors: uniqueVisitors.length,
        topPages: topPages.map((p: { page: string; _count: { page: number } }) => ({ page: p.page, count: p._count.page })),
      },
    })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
