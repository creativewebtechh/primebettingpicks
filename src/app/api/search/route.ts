import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')
    if (!q || q.length < 2) {
      return NextResponse.json({ data: { matches: [], teams: [], leagues: [], news: [] } })
    }

    const [matches, teams, leagues, news] = await Promise.all([
      prisma.match.findMany({
        where: {
          OR: [
            { team_match_homeTeamIdToteam: { name: { contains: q } } },
            { team_match_awayTeamIdToteam: { name: { contains: q } } },
          ],
        },
        include: { team_match_homeTeamIdToteam: true, team_match_awayTeamIdToteam: true, league: true },
        take: 5,
      }),
      prisma.team.findMany({
        where: { name: { contains: q } },
        include: { league: true },
        take: 5,
      }),
      prisma.league.findMany({
        where: { name: { contains: q } },
        take: 5,
      }),
      prisma.newsarticle.findMany({
        where: {
          published: true,
          OR: [
            { title: { contains: q } },
            { excerpt: { contains: q } },
          ],
        },
        take: 5,
      }),
    ])

    return NextResponse.json({ data: { matches, teams, leagues, news } })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
