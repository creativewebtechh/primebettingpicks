'use client'

import { useState, useEffect } from 'react'
import { Users, Trophy, Newspaper, TrendingUp, Calendar, Star } from 'lucide-react'
import { StatsCard } from '@/components/admin/stats-card'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface AnalyticsData {
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
  dailyVisitors: number
  weeklyVisitors: number
  monthlyVisitors: number
  totalRevenue: number
  recentUsers: { id: string; name: string; email: string; role: string; createdAt: string }[]
  recentMatches: {
    id: string
    date: string
    status: string
    homeScore: number | null
    awayScore: number | null
    team_match_homeTeamIdToteam: { id: string; name: string; shortName: string }
    team_match_awayTeamIdToteam: { id: string; name: string; shortName: string }
  }[]
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/analytics')
      .then((res) => res.json())
      .then((json) => setData(json.data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text-primary">Analytics</h1>
          <p className="text-text-secondary mt-1">Platform performance metrics</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 animate-pulse">
                <div className="h-4 bg-surface-tertiary rounded w-20 mb-2" />
                <div className="h-8 bg-surface-tertiary rounded w-24 mb-1" />
                <div className="h-3 bg-surface-tertiary rounded w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!data) return null

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Analytics</h1>
        <p className="text-text-secondary mt-1">Platform performance metrics</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard title="Total Users" value={data.totalUsers.toLocaleString()} icon={Users} color="blue" subtitle={`${data.activeUsers} active (30d)`} />
        <StatsCard title="Matches" value={data.totalMatches.toLocaleString()} icon={Trophy} color="green" subtitle={`${data.liveMatches} live`} />
        <StatsCard title="Predictions" value={data.totalPredictions.toLocaleString()} icon={TrendingUp} color="purple" subtitle={`${data.publishedPredictions} published`} />
        <StatsCard title="Revenue" value={`$${data.totalRevenue.toLocaleString()}`} icon={Star} color="yellow" subtitle={`${data.premiumUsers} premium users`} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard title="Leagues" value={data.totalLeagues} icon={Trophy} color="gray" />
        <StatsCard title="Teams" value={data.totalTeams} icon={Users} color="gray" />
        <StatsCard title="News Articles" value={data.totalNews} icon={Newspaper} color="gray" subtitle={`${data.publishedNews} published`} />
        <StatsCard title="Monthly Visitors" value={data.monthlyVisitors} icon={Calendar} color="gray" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-text-primary mb-3">Recent Users</h3>
            <div className="space-y-2">
              {data.recentUsers.length === 0 ? (
                <p className="text-sm text-text-muted">No users yet</p>
              ) : (
                data.recentUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-tertiary text-sm">
                    <div>
                      <span className="font-medium">{user.name}</span>
                      <span className="text-text-muted ml-2">{user.email}</span>
                    </div>
                    <Badge variant={user.role === 'admin' ? 'info' : 'default'} size="sm">{user.role}</Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-text-primary mb-3">Recent Matches</h3>
            <div className="space-y-2">
              {data.recentMatches.length === 0 ? (
                <p className="text-sm text-text-muted">No matches yet</p>
              ) : (
                data.recentMatches.map((match) => (
                  <div key={match.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-tertiary text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{match.team_match_homeTeamIdToteam.shortName}</span>
                      <span className="text-text-muted">
                        {match.homeScore != null ? `${match.homeScore} - ${match.awayScore}` : 'vs'}
                      </span>
                      <span className="font-medium">{match.team_match_awayTeamIdToteam.shortName}</span>
                    </div>
                    <Badge
                      variant={match.status === 'live' ? 'error' : match.status === 'finished' ? 'default' : 'success'}
                      size="sm"
                    >
                      {match.status}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
