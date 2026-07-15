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
    const status = searchParams.get('status') || ''
    const dateFrom = searchParams.get('dateFrom') || ''
    const dateTo = searchParams.get('dateTo') || ''
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (league) where.league = { slug: league }
    if (search) {
      where.OR = [
        { team_match_homeTeamIdToteam: { name: { contains: search } } },
        { team_match_awayTeamIdToteam: { name: { contains: search } } },
      ]
    }
    if (dateFrom || dateTo) {
      const dateFilter: Record<string, Date> = {}
      if (dateFrom) dateFilter.gte = new Date(dateFrom)
      if (dateTo) {
        const end = new Date(dateTo)
        end.setDate(end.getDate() + 1)
        dateFilter.lt = end
      }
      where.date = dateFilter
    }

    const [matches, total] = await Promise.all([
      prisma.match.findMany({
        where,
        include: {
          team_match_homeTeamIdToteam: { select: { id: true, name: true, shortName: true, logo: true } },
          team_match_awayTeamIdToteam: { select: { id: true, name: true, shortName: true, logo: true } },
          league: { select: { id: true, name: true, slug: true, logo: true } },
          prediction: { select: { id: true, tip: true, published: true } },
        },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      prisma.match.count({ where }),
    ])

    logger.info('Admin listed matches', { total, page })
    return NextResponse.json({
      data: matches,
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
    logger.error('Admin matches list error', { error: String(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin()
    const body = await request.json()
    const {
      leagueId, homeTeamId, awayTeamId, date, status,
      venue, round, homeScore, awayScore, homeHalfScore, awayHalfScore,
    } = body

    if (!leagueId || !homeTeamId || !awayTeamId || !date) {
      return NextResponse.json(
        { error: 'leagueId, homeTeamId, awayTeamId, and date are required' },
        { status: 400 }
      )
    }

    const match = await prisma.match.create({
      data: {
        leagueId,
        homeTeamId,
        awayTeamId,
        date: new Date(date),
        status: status || 'upcoming',
        venue: venue || null,
        round: round || null,
        homeScore: homeScore ?? null,
        awayScore: awayScore ?? null,
        homeHalfScore: homeHalfScore ?? null,
        awayHalfScore: awayHalfScore ?? null,
      },
      include: {
        team_match_homeTeamIdToteam: { select: { id: true, name: true, shortName: true, logo: true } },
        team_match_awayTeamIdToteam: { select: { id: true, name: true, shortName: true, logo: true } },
        league: { select: { id: true, name: true, slug: true } },
      },
    })

    logger.info('Admin created match', { matchId: match.id, by: session.userId })
    return NextResponse.json({ data: match }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    logger.error('Admin create match error', { error: String(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await requireAdmin()
    const body = await request.json()
    const { id, ...data } = body

    if (!id) {
      return NextResponse.json({ error: 'Match ID is required' }, { status: 400 })
    }

    if (data.date) data.date = new Date(data.date)

    const match = await prisma.match.update({
      where: { id },
      data,
      include: {
        team_match_homeTeamIdToteam: { select: { id: true, name: true, shortName: true, logo: true } },
        team_match_awayTeamIdToteam: { select: { id: true, name: true, shortName: true, logo: true } },
        league: { select: { id: true, name: true, slug: true } },
      },
    })

    logger.info('Admin updated match', { matchId: match.id, by: session.userId })
    return NextResponse.json({ data: match })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    logger.error('Admin update match error', { error: String(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireAdmin()
    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: 'Match ID is required' }, { status: 400 })
    }

    await prisma.match.delete({ where: { id } })

    logger.info('Admin deleted match', { matchId: id, by: session.userId })
    return NextResponse.json({ data: { success: true } })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    logger.error('Admin delete match error', { error: String(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
