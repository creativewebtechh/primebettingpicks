'use client'

import { useEffect, useState } from 'react'
import {
  Users,
  TrendingUp,
  CalendarRange,
  Newspaper,
  Trophy,
  DollarSign,
  Target,
  CreditCard,
} from 'lucide-react'
import { StatsCard } from '@/components/admin/stats-card'
import { ChartCard } from '@/components/admin/chart-card'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface DashboardStats {
  totalUsers: number
  activeUsers: number
  premiumUsers: number
  totalMatches: number
  upcomingMatches: number
  finishedMatches: number
  liveMatches: number
  totalPredictions: number
  publishedPredictions: number
  premiumPredictions: number
  totalNews: number
  publishedNews: number
  totalLeagues: number
  totalTeams: number
  totalRevenue: number
  predictionAccuracy: number
}

interface ChartDataPoint {
  date: string
  count?: number
  amount?: number
}

interface PopularLeague {
  name: string
  count: number
}

interface DashboardData {
  stats: DashboardStats
  charts: {
    userRegistrations: ChartDataPoint[]
    traffic: ChartDataPoint[]
    predictionAccuracy: ChartDataPoint[]
    revenue: ChartDataPoint[]
    popularLeagues: PopularLeague[]
  }
}

function formatCurrency(amount: number) {
  return `₦${amount.toLocaleString()}`
}

function formatChartDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch('/api/admin/dashboard')
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            throw new Error('You are not authorized to view this page.')
          }
          throw new Error('Failed to load dashboard data.')
        }
        const json = await res.json()
        setData(json.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred.')
      } finally {
        setLoading(false)
      }
    }
    fetchDashboard()
  }, [])

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-lg font-semibold text-text-primary mb-2">Error Loading Dashboard</p>
            <p className="text-text-secondary">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!data) return null

  const { stats, charts } = data

  const userGrowthData = charts.userRegistrations.map((d) => ({
    label: formatChartDate(d.date),
    value: d.count ?? 0,
  }))

  const accuracyData = charts.predictionAccuracy.map((d) => ({
    label: formatChartDate(d.date),
    value: d.count ?? 0,
  }))

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
        <p className="text-text-secondary mt-1">Welcome to the admin panel</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard
          title="Total Users"
          value={stats.totalUsers.toLocaleString()}
          icon={Users}
          color="blue"
          subtitle={`${stats.activeUsers} active (30d)`}
        />
        <StatsCard
          title="Total Matches"
          value={stats.totalMatches.toLocaleString()}
          icon={CalendarRange}
          color="purple"
          subtitle={`${stats.liveMatches} live`}
        />
        <StatsCard
          title="Predictions"
          value={stats.totalPredictions.toLocaleString()}
          icon={TrendingUp}
          color="green"
          subtitle={`${stats.publishedPredictions} published`}
        />
        <StatsCard
          title="Total Revenue"
          value={formatCurrency(stats.totalRevenue)}
          icon={DollarSign}
          color="yellow"
        />
        <StatsCard
          title="Premium Users"
          value={stats.premiumUsers.toLocaleString()}
          icon={Trophy}
          color="green"
        />
        <StatsCard
          title="News Articles"
          value={stats.totalNews.toLocaleString()}
          icon={Newspaper}
          color="blue"
          subtitle={`${stats.publishedNews} published`}
        />
        <StatsCard
          title="Prediction Accuracy"
          value={`${stats.predictionAccuracy}%`}
          icon={Target}
          color="purple"
        />
        <StatsCard
          title="Leagues & Teams"
          value={stats.totalLeagues.toLocaleString()}
          icon={CreditCard}
          color="gray"
          subtitle={`${stats.totalTeams} teams`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <ChartCard title="User Growth (30 days)" data={userGrowthData} type="bar" />
        <ChartCard title="Prediction Accuracy (7 days)" data={accuracyData} type="line" />
      </div>

      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold text-text-primary">Revenue (30 days)</h3>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="space-y-2">
            {charts.revenue.slice(-7).reverse().map((entry) => (
              <div key={entry.date} className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-tertiary text-sm">
                <span className="text-text-secondary">{formatChartDate(entry.date)}</span>
                <span className="font-medium text-text-primary">{formatCurrency(entry.amount ?? 0)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
