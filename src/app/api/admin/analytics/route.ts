import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await requireAdmin()

    const now = new Date()
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const [
      totalUsers,
      activeUsers,
      premiumUsers,
      totalMatches,
      upcomingMatches,
      finishedMatches,
      liveMatches,
      totalPredictions,
      publishedPredictions,
      premiumPredictions,
      totalNews,
      publishedNews,
      totalLeagues,
      totalTeams,
      totalRevenue,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.user.count({ where: { subscription: { plan: { not: 'free' } } } }),
      prisma.match.count(),
      prisma.match.count({ where: { status: 'upcoming' } }),
      prisma.match.count({ where: { status: 'finished' } }),
      prisma.match.count({ where: { status: 'live' } }),
      prisma.prediction.count(),
      prisma.prediction.count({ where: { published: true } }),
      prisma.prediction.count({ where: { premium: true } }),
      prisma.newsarticle.count(),
      prisma.newsarticle.count({ where: { published: true } }),
      prisma.league.count(),
      prisma.team.count(),
      prisma.payment.aggregate({ where: { status: 'success' }, _sum: { amount: true } }),
    ])

    const dailyVisitors = await prisma.analyticsevent.count({
      where: { createdAt: { gte: oneDayAgo } },
    })

    const weeklyVisitors = await prisma.analyticsevent.count({
      where: { createdAt: { gte: sevenDaysAgo } },
    })

    const monthlyVisitors = await prisma.analyticsevent.count({
      where: { createdAt: { gte: thirtyDaysAgo } },
    })

    const recentUsers = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    })

    const recentMatches = await prisma.match.findMany({
      select: {
        id: true,
        date: true,
        status: true,
        homeScore: true,
        awayScore: true,
        team_match_homeTeamIdToteam: { select: { id: true, name: true, shortName: true } },
        team_match_awayTeamIdToteam: { select: { id: true, name: true, shortName: true } },
      },
      orderBy: { date: 'desc' },
      take: 5,
    })

    const analyticsData = {
      totalUsers,
      activeUsers,
      premiumUsers,
      totalMatches,
      upcomingMatches,
      finishedMatches,
      liveMatches,
      totalPredictions,
      publishedPredictions,
      premiumPredictions,
      totalNews,
      publishedNews,
      totalLeagues,
      totalTeams,
      dailyVisitors,
      weeklyVisitors,
      monthlyVisitors,
      totalRevenue: totalRevenue._sum.amount || 0,
      recentUsers,
      recentMatches,
    }

    logger.info('Admin fetched analytics')
    return NextResponse.json({ data: analyticsData })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    logger.error('Admin analytics error', { error: String(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
