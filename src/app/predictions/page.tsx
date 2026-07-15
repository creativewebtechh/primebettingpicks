import type { Metadata } from 'next'
import Link from 'next/link'
import { Filter, Crown, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LeagueNav } from '@/components/common/league-nav'
import { prisma } from '@/lib/prisma'
import { formatDate } from '@/lib/utils'
import type { MatchStatus } from '@/types'

export const metadata: Metadata = {
  title: 'Football Predictions & Expert Betting Tips',
  description: 'Get expert football predictions, match analysis, and betting tips for all major leagues. Data-driven picks with confidence ratings updated daily.',
}

function MatchStatusBadge({ status }: { status: MatchStatus }) {
  const variants: Record<MatchStatus, { label: string; variant: 'default' | 'success' | 'warning' | 'error' | 'info' }> = {
    upcoming: { label: 'Upcoming', variant: 'info' },
    live: { label: 'Live', variant: 'success' },
    finished: { label: 'Finished', variant: 'default' },
    postponed: { label: 'Postponed', variant: 'warning' },
    cancelled: { label: 'Cancelled', variant: 'error' },
  }
  const config = variants[status] || variants.upcoming
  return <Badge variant={config.variant} size="sm">{config.label}</Badge>
}

export default async function PredictionsPage() {
  const predictions = await prisma.prediction.findMany({
    where: { published: true },
    include: {
      match: {
        include: {
          league: true,
          team_match_homeTeamIdToteam: true,
          team_match_awayTeamIdToteam: true,
        },
      },
      expert: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  }).catch(() => [])

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Football Predictions</h1>
          <p className="text-text-secondary mt-1">Expert analysis and betting tips for today&apos;s matches</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-1" />
            Filters
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <LeagueNav />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {predictions.length === 0 ? (
            <div className="bg-surface rounded-xl border border-border p-12 text-center">
              <p className="text-text-secondary text-lg">No predictions available yet.</p>
              <p className="text-text-muted text-sm mt-2">Check back soon for expert picks and analysis.</p>
            </div>
          ) : (
            predictions.map((prediction) => {
              const match = prediction.match
              if (!match) return null
              return (
                <Link key={prediction.id} href={`/predictions/${prediction.id}`}>
                  <div className="bg-surface rounded-xl border border-border p-4 hover:shadow-md hover:border-primary-200 dark:hover:border-primary-800 transition-all duration-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-surface-tertiary text-text-muted font-medium">
                          {match.league?.name || 'Unknown League'}
                        </span>
                        <MatchStatusBadge status={match.status as MatchStatus} />
                      </div>
                      <span className="text-xs text-text-muted">{formatDate(match.date)}</span>
                    </div>

                    <div className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-8 h-8 rounded-full bg-surface-tertiary flex items-center justify-center text-sm font-bold">
                          {match.team_match_homeTeamIdToteam?.shortName?.charAt(0) || '?'}
                        </div>
                        <span className="font-medium">{match.team_match_homeTeamIdToteam?.name || 'TBD'}</span>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold tabular-nums">
                          <span className="text-primary-600">{prediction.predictedHomeScore}</span>
                          <span className="text-text-muted mx-1">-</span>
                          <span>{prediction.predictedAwayScore}</span>
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-medium">
                          {prediction.tip}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 flex-1 justify-end">
                        <span className="font-medium">{match.team_match_awayTeamIdToteam?.name || 'TBD'}</span>
                        <div className="w-8 h-8 rounded-full bg-surface-tertiary flex items-center justify-center text-sm font-bold">
                          {match.team_match_awayTeamIdToteam?.shortName?.charAt(0) || '?'}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs text-text-muted">
                      <div className="flex items-center gap-3">
                        {prediction.expert ? (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {prediction.expert.name}
                          </span>
                        ) : (
                          <span>AI Analysis</span>
                        )}
                        {prediction.analysis && (
                          <span className="line-clamp-1 max-w-xs">{prediction.analysis}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {prediction.premium ? (
                          <span className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400 font-medium">
                            <Crown className="w-3 h-3" />
                            Premium
                          </span>
                        ) : (
                          <Badge variant="success" size="sm">Free</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-surface rounded-xl border border-border p-4">
            <h3 className="font-semibold text-text-primary mb-3">Filter Predictions</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">League</label>
                <select className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option>All Leagues</option>
                  <option>Premier League</option>
                  <option>La Liga</option>
                  <option>Serie A</option>
                  <option>Bundesliga</option>
                  <option>Ligue 1</option>
                  <option>Champions League</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Date</label>
                <select className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option>All Dates</option>
                  <option>Today</option>
                  <option>Tomorrow</option>
                  <option>This Week</option>
                  <option>This Weekend</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Prediction Type</label>
                <select className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option>All Types</option>
                  <option>Match Winner</option>
                  <option>Over/Under</option>
                  <option>Both Teams to Score</option>
                  <option>Correct Score</option>
                </select>
              </div>
              <Button className="w-full">Apply Filters</Button>
            </div>
          </div>

          <div className="bg-surface rounded-xl border border-border p-4">
            <h3 className="font-semibold text-text-primary mb-3">Top Bookmakers</h3>
            <div className="space-y-2">
              {['Bet365', 'Bet9ja', 'SportyBet'].map((name) => (
                <div key={name} className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-tertiary">
                  <span className="text-sm font-medium">{name}</span>
                  <span className="text-xs text-text-muted">View odds</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
