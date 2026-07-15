import type { Metadata } from 'next'
import Link from 'next/link'
import { LeagueNav } from '@/components/common/league-nav'
import { prisma } from '@/lib/prisma'
import { formatTime } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Football Fixtures & Schedule',
  description: 'View upcoming football fixtures, match schedules, and kick-off times for Premier League, La Liga, Serie A, Bundesliga, Champions League, and more.',
}

export default async function FixturesPage() {
  const allMatches = await prisma.match.findMany({
    where: { status: 'upcoming', date: { gte: new Date() } },
    include: {
      league: true,
      team_match_homeTeamIdToteam: true,
      team_match_awayTeamIdToteam: true,
    },
    orderBy: { date: 'asc' },
    take: 50,
  }).catch(() => [])

  const matches = allMatches as Exclude<typeof allMatches, never[]>

  const groupedByDate: Record<string, typeof matches> = {}
  for (const match of matches) {
    const dateKey = new Date(match.date).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
    if (!groupedByDate[dateKey]) groupedByDate[dateKey] = []
    groupedByDate[dateKey].push(match)
  }

  const dateKeys = Object.keys(groupedByDate)

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary">Football Fixtures</h1>
        <p className="text-text-secondary mt-1">Upcoming matches across all leagues</p>
      </div>

      <div className="mb-6">
        <LeagueNav />
      </div>

      {dateKeys.length > 0 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-6">
          {dateKeys.map((dateKey, i) => (
            <span
              key={dateKey}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                i === 0
                  ? 'bg-primary-600 text-white'
                  : 'bg-surface-secondary text-text-secondary border border-border'
              }`}
            >
              {i === 0 ? 'Today' : dateKey}
            </span>
          ))}
        </div>
      )}

      {matches.length === 0 ? (
        <div className="bg-surface rounded-xl border border-border p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-surface-tertiary flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📅</span>
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">No Upcoming Fixtures</h3>
          <p className="text-text-secondary">Check back later for new match schedules.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {dateKeys.map((dateKey) => (
            <div key={dateKey}>
              <h2 className="text-sm font-semibold text-text-secondary mb-3 uppercase tracking-wide">
                {dateKey}
              </h2>
              <div className="space-y-3">
                {groupedByDate[dateKey].map((match) => {
                  const homeTeam = match.team_match_homeTeamIdToteam
                  const awayTeam = match.team_match_awayTeamIdToteam
                  return (
                    <Link key={match.id} href={`/predictions/${match.id}`}>
                      <div className="bg-surface rounded-xl border border-border p-4 hover:shadow-md transition-all duration-200">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-surface-tertiary text-text-muted font-medium">
                            {match.league?.name || 'Unknown League'}
                          </span>
                          <span className="text-xs text-text-muted">{formatTime(match.date)}</span>
                          {match.round && (
                            <span className="text-xs text-text-muted">&middot; {match.round}</span>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="w-8 h-8 rounded-full bg-surface-tertiary flex items-center justify-center text-sm font-bold">
                              {homeTeam?.shortName?.charAt(0) || '?'}
                            </div>
                            <span className="font-medium">{homeTeam?.name || 'TBD'}</span>
                          </div>
                          <div className="text-sm font-bold text-text-muted mx-4">vs</div>
                          <div className="flex items-center gap-3 flex-1 justify-end">
                            <span className="font-medium">{awayTeam?.name || 'TBD'}</span>
                            <div className="w-8 h-8 rounded-full bg-surface-tertiary flex items-center justify-center text-sm font-bold">
                              {awayTeam?.shortName?.charAt(0) || '?'}
                            </div>
                          </div>
                        </div>
                        {match.venue && (
                          <div className="mt-2 text-xs text-text-muted">{match.venue}</div>
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
