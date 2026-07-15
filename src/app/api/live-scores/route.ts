import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const [liveMatches, upcomingMatches] = await Promise.all([
      prisma.match.findMany({
        where: { status: 'live' },
        include: {
          league: true,
          team_match_homeTeamIdToteam: true,
          team_match_awayTeamIdToteam: true,
          livescore: true,
        },
        orderBy: { date: 'desc' },
      }),
      prisma.match.findMany({
        where: { status: 'upcoming', date: { gte: new Date() } },
        include: {
          league: true,
          team_match_homeTeamIdToteam: true,
          team_match_awayTeamIdToteam: true,
        },
        orderBy: { date: 'asc' },
        take: 10,
      }),
    ])

    return NextResponse.json({ liveMatches, upcomingMatches })
  } catch (error) {
    console.error('Live scores error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
