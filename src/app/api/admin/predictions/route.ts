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
    const result = searchParams.get('result') || ''
    const published = searchParams.get('published')
    const featured = searchParams.get('featured')
    const premium = searchParams.get('premium')
    const expertId = searchParams.get('expertId') || ''
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (result) where.result = result
    if (published !== null && published !== undefined && published !== '') {
      where.published = published === 'true'
    }
    if (featured !== null && featured !== undefined && featured !== '') {
      where.featured = featured === 'true'
    }
    if (premium !== null && premium !== undefined && premium !== '') {
      where.premium = premium === 'true'
    }
    if (expertId) where.expertId = expertId
    if (league) {
      where.match = { league: { slug: league } }
    }
    if (search) {
      where.OR = [
        { tip: { contains: search } },
        { analysis: { contains: search } },
        { match: { team_match_homeTeamIdToteam: { name: { contains: search } } } },
        { match: { team_match_awayTeamIdToteam: { name: { contains: search } } } },
      ]
    }

    const [predictions, total] = await Promise.all([
      prisma.prediction.findMany({
        where,
        include: {
          match: {
            include: {
              team_match_homeTeamIdToteam: { select: { id: true, name: true, shortName: true, logo: true } },
              team_match_awayTeamIdToteam: { select: { id: true, name: true, shortName: true, logo: true } },
              league: { select: { id: true, name: true, slug: true, logo: true } },
            },
          },
          expert: { select: { id: true, name: true, slug: true, avatar: true, winRate: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.prediction.count({ where }),
    ])

    logger.info('Admin listed predictions', { total, page })
    return NextResponse.json({
      data: predictions,
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
    logger.error('Admin predictions list error', { error: String(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin()
    const body = await request.json()
    const {
      matchId, expertId, predictedHomeScore, predictedAwayScore,
      homeWinProbability, awayWinProbability, drawProbability,
      tip, analysis, bettingTips, price, premium, published, featured, notes,
    } = body

    if (!matchId || predictedHomeScore === undefined || predictedAwayScore === undefined || !tip) {
      return NextResponse.json(
        { error: 'matchId, predictedHomeScore, predictedAwayScore, and tip are required' },
        { status: 400 }
      )
    }

    const existing = await prisma.prediction.findUnique({ where: { matchId } })
    if (existing) {
      return NextResponse.json({ error: 'Prediction already exists for this match' }, { status: 409 })
    }

    const prediction = await prisma.prediction.create({
      data: {
        matchId,
        expertId: expertId || null,
        predictedHomeScore,
        predictedAwayScore,
        homeWinProbability: homeWinProbability ?? 0,
        awayWinProbability: awayWinProbability ?? 0,
        drawProbability: drawProbability ?? 0,
        tip,
        analysis: analysis || null,
        bettingTips: bettingTips || null,
        price: price ?? null,
        premium: premium ?? false,
        published: published ?? false,
        featured: featured ?? false,
        notes: notes || null,
      },
      include: {
        match: {
          include: {
            team_match_homeTeamIdToteam: { select: { id: true, name: true, shortName: true } },
            team_match_awayTeamIdToteam: { select: { id: true, name: true, shortName: true } },
          },
        },
        expert: { select: { id: true, name: true, slug: true } },
      },
    })

    logger.info('Admin created prediction', { predictionId: prediction.id, matchId, by: session.userId })
    return NextResponse.json({ data: prediction }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    logger.error('Admin create prediction error', { error: String(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await requireAdmin()
    const body = await request.json()
    const { id, ...data } = body

    if (!id) {
      return NextResponse.json({ error: 'Prediction ID is required' }, { status: 400 })
    }

    const prediction = await prisma.prediction.update({
      where: { id },
      data,
      include: {
        match: {
          include: {
            team_match_homeTeamIdToteam: { select: { id: true, name: true, shortName: true } },
            team_match_awayTeamIdToteam: { select: { id: true, name: true, shortName: true } },
          },
        },
        expert: { select: { id: true, name: true, slug: true } },
      },
    })

    logger.info('Admin updated prediction', { predictionId: prediction.id, by: session.userId })
    return NextResponse.json({ data: prediction })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    logger.error('Admin update prediction error', { error: String(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireAdmin()
    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: 'Prediction ID is required' }, { status: 400 })
    }

    await prisma.prediction.delete({ where: { id } })

    logger.info('Admin deleted prediction', { predictionId: id, by: session.userId })
    return NextResponse.json({ data: { success: true } })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    logger.error('Admin delete prediction error', { error: String(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAdmin()
    const body = await request.json()
    const { ids, published, featured } = body

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'ids array is required' }, { status: 400 })
    }

    const updateData: Record<string, boolean> = {}
    if (published !== undefined) updateData.published = published
    if (featured !== undefined) updateData.featured = featured

    const result = await prisma.prediction.updateMany({
      where: { id: { in: ids } },
      data: updateData,
    })

    logger.info('Admin bulk updated predictions', { count: result.count, by: session.userId })
    return NextResponse.json({ data: { updated: result.count } })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    logger.error('Admin bulk update predictions error', { error: String(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
