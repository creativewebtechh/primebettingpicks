import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    await requireAdmin()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { country: { contains: search } },
      ]
    }

    const [leagues, total] = await Promise.all([
      prisma.league.findMany({
        where,
        include: {
          _count: {
            select: { match: true, team: true },
          },
        },
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      prisma.league.count({ where }),
    ])

    logger.info('Admin listed leagues', { total, page })
    return NextResponse.json({
      data: leagues,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    logger.error('Admin leagues list error', { error: String(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin()
    const body = await request.json()
    const { name, slug, logo, country, tier, sport, season, featured, active } = body

    if (!name || !slug || !country || !season) {
      return NextResponse.json(
        { error: 'name, slug, country, and season are required' },
        { status: 400 }
      )
    }

    const existing = await prisma.league.findUnique({ where: { slug } })
    if (existing) {
      return NextResponse.json({ error: 'League slug already exists' }, { status: 409 })
    }

    const league = await prisma.league.create({
      data: {
        name,
        slug,
        logo: logo || null,
        country,
        tier: tier ?? 0,
        sport: sport || 'football',
        season,
        featured: featured ?? false,
        active: active ?? true,
      },
      include: {
        _count: {
          select: { match: true, team: true },
        },
      },
    })

    logger.info('Admin created league', { leagueId: league.id, name: league.name, by: session.userId })
    return NextResponse.json({ data: league }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    logger.error('Admin create league error', { error: String(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await requireAdmin()
    const body = await request.json()
    const { id, ...data } = body

    if (!id) {
      return NextResponse.json({ error: 'League ID is required' }, { status: 400 })
    }

    const allowedFields: Record<string, unknown> = {}
    if (data.name !== undefined) allowedFields.name = data.name
    if (data.slug !== undefined) allowedFields.slug = data.slug
    if (data.logo !== undefined) allowedFields.logo = data.logo
    if (data.country !== undefined) allowedFields.country = data.country
    if (data.tier !== undefined) allowedFields.tier = data.tier
    if (data.sport !== undefined) allowedFields.sport = data.sport
    if (data.season !== undefined) allowedFields.season = data.season
    if (data.featured !== undefined) allowedFields.featured = data.featured
    if (data.active !== undefined) allowedFields.active = data.active

    if (Object.keys(allowedFields).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    if (allowedFields.slug) {
      const existing = await prisma.league.findFirst({
        where: { slug: allowedFields.slug as string, NOT: { id } },
      })
      if (existing) {
        return NextResponse.json({ error: 'League slug already exists' }, { status: 409 })
      }
    }

    const league = await prisma.league.update({
      where: { id },
      data: allowedFields,
      include: {
        _count: {
          select: { match: true, team: true },
        },
      },
    })

    logger.info('Admin updated league', { leagueId: league.id, by: session.userId })
    return NextResponse.json({ data: league })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    logger.error('Admin update league error', { error: String(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireAdmin()
    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: 'League ID is required' }, { status: 400 })
    }

    await prisma.league.delete({ where: { id } })

    logger.info('Admin deleted league', { leagueId: id, by: session.userId })
    return NextResponse.json({ data: { success: true } })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    logger.error('Admin delete league error', { error: String(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
