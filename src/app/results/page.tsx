import type { Metadata } from 'next'
import Link from 'next/link'
import { LeagueNav } from '@/components/common/league-nav'
import { prisma } from '@/lib/prisma'
import { formatDate } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Football Results & Match Scores',
  description: 'View the latest football match results, final scores, and match reports from Premier League, Champions League, La Liga, Serie A, and all major leagues.',
}

export default async function ResultsPage() {
  const matches = await prisma.match.findMany({
    where: { status: 'finished' },
    include: {
      league: true,
      team_match_homeTeamIdToteam: true,
      team_match_awayTeamIdToteam: true,
    },
    orderBy: { date: 'desc' },
    take: 50,
  }).catch(() => [])

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary">Football Results</h1>
        <p className="text-text-secondary mt-1">Latest match scores and results</p>
      </div>

      <div className="mb-6">
        <LeagueNav />
      </div>

      {matches.length === 0 ? (
        <div className="bg-surface rounded-xl border border-border p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-surface-tertiary flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚽</span>
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">No Results Yet</h3>
          <p className="text-text-secondary">Match results will appear here once games are finished.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {matches.map((match) => {
            const homeTeam = match.team_match_homeTeamIdToteam
            const awayTeam = match.team_match_awayTeamIdToteam
            const homeScore = match.homeScore ?? 0
            const awayScore = match.awayScore ?? 0
            const homeWon = homeScore > awayScore
            const awayWon = awayScore > homeScore
            return (
              <Link key={match.id} href={`/predictions/${match.id}`}>
                <div className="bg-surface rounded-xl border border-border p-4 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-surface-tertiary text-text-muted font-medium">
                      {match.league?.name || 'Unknown League'}
                    </span>
                    <span className="text-xs text-text-muted ml-auto">FT &middot; {formatDate(match.date)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-8 h-8 rounded-full bg-surface-tertiary flex items-center justify-center text-sm font-bold">
                        {homeTeam?.shortName?.charAt(0) || '?'}
                      </div>
                      <span className={`font-medium ${homeWon ? 'text-text-primary' : 'text-text-muted'}`}>
                        {homeTeam?.name || 'TBD'}
                      </span>
                    </div>
                    <div className="text-xl font-bold tabular-nums mx-4">
                      <span className={homeWon ? 'text-primary-600' : ''}>{homeScore}</span>
                      <span className="text-text-muted mx-1">-</span>
                      <span className={awayWon ? 'text-primary-600' : ''}>{awayScore}</span>
                    </div>
                    <div className="flex items-center gap-3 flex-1 justify-end">
                      <span className={`font-medium ${awayWon ? 'text-text-primary' : 'text-text-muted'}`}>
                        {awayTeam?.name || 'TBD'}
                      </span>
                      <div className="w-8 h-8 rounded-full bg-surface-tertiary flex items-center justify-center text-sm font-bold">
                        {awayTeam?.shortName?.charAt(0) || '?'}
                      </div>
                    </div>
                  </div>
                  {(match.homeRedCards != null && match.homeRedCards > 0) ||
                    (match.awayRedCards != null && match.awayRedCards > 0) ? (
                    <div className="mt-2 flex justify-between text-xs text-text-muted">
                      <span>
                        {match.homeRedCards != null && match.homeRedCards > 0
                          ? `🟥 ${match.homeRedCards} red card${match.homeRedCards > 1 ? 's' : ''}`
                          : ''}
                      </span>
                      <span>
                        {match.awayRedCards != null && match.awayRedCards > 0
                          ? `🟥 ${match.awayRedCards} red card${match.awayRedCards > 1 ? 's' : ''}`
                          : ''}
                      </span>
                    </div>
                  ) : null}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
