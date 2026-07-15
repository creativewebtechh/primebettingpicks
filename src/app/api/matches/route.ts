import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { Prisma } from '@/generated/prisma/client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')
    const league = searchParams.get('league')
    const date = searchParams.get('date')

    const where: Prisma.matchWhereInput = {}
    if (status) where.status = status
    if (league) where.league = { slug: league }
    if (date) {
      const start = new Date(date)
      const end = new Date(start)
      end.setDate(end.getDate() + 1)
      where.date = { gte: start, lt: end }
    }

    const [matches, total] = await Promise.all([
      prisma.match.findMany({
        where,
        include: {
          team_match_homeTeamIdToteam: true,
          team_match_awayTeamIdToteam: true,
          league: true,
          prediction: true,
        },
        orderBy: { date: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.match.count({ where }),
    ])

    return NextResponse.json({
      data: matches,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Matches error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
