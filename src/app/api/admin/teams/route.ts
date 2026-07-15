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
    const league = searchParams.get('league') || ''
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (league) where.league = { slug: league }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { shortName: { contains: search } },
        { country: { contains: search } },
      ]
    }

    const [teams, total] = await Promise.all([
      prisma.team.findMany({
        where,
        include: {
          league: { select: { id: true, name: true, slug: true } },
          _count: {
            select: {
              match_match_homeTeamIdToteam: true,
              match_match_awayTeamIdToteam: true,
            },
          },
        },
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      prisma.team.count({ where }),
    ])

    logger.info('Admin listed teams', { total, page })
    return NextResponse.json({
      data: teams,
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
    logger.error('Admin teams list error', { error: String(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin()
    const body = await request.json()
    const { name, slug, shortName, logo, country, stadium, foundedYear, leagueId } = body

    if (!name || !slug || !shortName || !leagueId) {
      return NextResponse.json(
        { error: 'name, slug, shortName, and leagueId are required' },
        { status: 400 }
      )
    }

    const existing = await prisma.team.findUnique({ where: { slug } })
    if (existing) {
      return NextResponse.json({ error: 'Team slug already exists' }, { status: 409 })
    }

    const team = await prisma.team.create({
      data: {
        name,
        slug,
        shortName,
        logo: logo || null,
        country: country || null,
        stadium: stadium || null,
        foundedYear: foundedYear ?? null,
        leagueId,
      },
      include: {
        league: { select: { id: true, name: true, slug: true } },
      },
    })

    logger.info('Admin created team', { teamId: team.id, name: team.name, by: session.userId })
    return NextResponse.json({ data: team }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    logger.error('Admin create team error', { error: String(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await requireAdmin()
    const body = await request.json()
    const { id, ...data } = body

    if (!id) {
      return NextResponse.json({ error: 'Team ID is required' }, { status: 400 })
    }

    const allowedFields: Record<string, unknown> = {}
    if (data.name !== undefined) allowedFields.name = data.name
    if (data.slug !== undefined) allowedFields.slug = data.slug
    if (data.shortName !== undefined) allowedFields.shortName = data.shortName
    if (data.logo !== undefined) allowedFields.logo = data.logo
    if (data.country !== undefined) allowedFields.country = data.country
    if (data.stadium !== undefined) allowedFields.stadium = data.stadium
    if (data.foundedYear !== undefined) allowedFields.foundedYear = data.foundedYear
    if (data.leagueId !== undefined) allowedFields.leagueId = data.leagueId

    if (Object.keys(allowedFields).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    if (allowedFields.slug) {
      const existing = await prisma.team.findFirst({
        where: { slug: allowedFields.slug as string, NOT: { id } },
      })
      if (existing) {
        return NextResponse.json({ error: 'Team slug already exists' }, { status: 409 })
      }
    }

    const team = await prisma.team.update({
      where: { id },
      data: allowedFields,
      include: {
        league: { select: { id: true, name: true, slug: true } },
      },
    })

    logger.info('Admin updated team', { teamId: team.id, by: session.userId })
    return NextResponse.json({ data: team })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    logger.error('Admin update team error', { error: String(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireAdmin()
    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: 'Team ID is required' }, { status: 400 })
    }

    await prisma.team.delete({ where: { id } })

    logger.info('Admin deleted team', { teamId: id, by: session.userId })
    return NextResponse.json({ data: { success: true } })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    logger.error('Admin delete team error', { error: String(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
