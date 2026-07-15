import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { Prisma } from '@/generated/prisma/client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const league = searchParams.get('league')
    const status = searchParams.get('status')
    const featured = searchParams.get('featured')

    const where: Prisma.predictionWhereInput = {
      published: true,
      ...(status ? { match: { status } } : {}),
      ...(league ? { match: { league: { slug: league } } } : {}),
      ...(featured === 'true' ? { featured: true } : {}),
    }

    if (league && status) {
      where.match = { status, league: { slug: league } }
    }

    const [predictions, total] = await Promise.all([
      prisma.prediction.findMany({
        where,
        include: {
          match: {
            include: {
              team_match_homeTeamIdToteam: true,
              team_match_awayTeamIdToteam: true,
              league: true,
            },
          },
          expert: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.prediction.count({ where }),
    ])

    return NextResponse.json({
      data: predictions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Predictions error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
