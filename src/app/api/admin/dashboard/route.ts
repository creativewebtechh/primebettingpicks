import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

async function getChartData(days: number) {
  const now = new Date()
  const start = new Date(now)
  start.setDate(start.getDate() - days)

  const events = await prisma.analyticsevent.findMany({
    where: { createdAt: { gte: start } },
    select: { createdAt: true },
    orderBy: { createdAt: 'asc' },
  })

  const dayBuckets: Record<string, number> = {}
  for (let i = 0; i < days; i++) {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    dayBuckets[d.toISOString().split('T')[0]] = 0
  }

  for (const event of events) {
    const key = event.createdAt.toISOString().split('T')[0]
    if (dayBuckets[key] !== undefined) {
      dayBuckets[key]++
    }
  }

  return Object.entries(dayBuckets).map(([date, count]) => ({ date, count }))
}

export async function GET() {
  try {
    await requireAdmin()

    const now = new Date()
    const thirtyDaysAgo = new Date(now)
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

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
      correctPredictions,
      totalResolvedPredictions,
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
      prisma.prediction.count({ where: { result: 'correct' } }),
      prisma.prediction.count({ where: { result: { in: ['correct', 'incorrect', 'draw'] } } }),
    ])

    const [userRegistrations, traffic, revenue, popularLeagues] = await Promise.all([
      getChartData(30),
      getChartData(30),
      (async () => {
        const payments = await prisma.payment.findMany({
          where: { status: 'success', createdAt: { gte: thirtyDaysAgo } },
          select: { amount: true, createdAt: true },
          orderBy: { createdAt: 'asc' },
        })

        const dayBuckets: Record<string, number> = {}
        for (let i = 0; i < 30; i++) {
          const d = new Date(thirtyDaysAgo)
          d.setDate(d.getDate() + i)
          dayBuckets[d.toISOString().split('T')[0]] = 0
        }

        for (const payment of payments) {
          const key = payment.createdAt.toISOString().split('T')[0]
          if (dayBuckets[key] !== undefined) {
            dayBuckets[key] += payment.amount
          }
        }

        return Object.entries(dayBuckets).map(([date, amount]) => ({ date, amount }))
      })(),
      (async () => {
        const leagues = await prisma.league.findMany({
          select: {
            id: true,
            name: true,
            _count: { select: { match: true } },
          },
          orderBy: { match: { _count: 'desc' } },
          take: 10,
        })
        return leagues.map((l) => ({ name: l.name, count: l._count.match }))
      })(),
    ])

    const predictionAccuracy = totalResolvedPredictions > 0
      ? (correctPredictions / totalResolvedPredictions) * 100
      : 0

    const dashboardData = {
      stats: {
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
        totalRevenue: totalRevenue._sum.amount || 0,
        predictionAccuracy: Math.round(predictionAccuracy * 10) / 10,
      },
      charts: {
        userRegistrations,
        traffic,
        predictionAccuracy: await getChartData(7),
        revenue,
        popularLeagues,
      },
    }

    logger.info('Admin fetched dashboard data')
    return NextResponse.json({ data: dashboardData })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    logger.error('Admin dashboard error', { error: String(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
