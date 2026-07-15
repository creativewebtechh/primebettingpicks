import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, MapPin, Building2, CalendarDays, Target } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const params = await props.params
  const team = await prisma.team.findUnique({
    where: { slug: params.slug },
    include: { league: true },
  }).catch(() => null)
  if (!team) return { title: 'Team Not Found' }
  return {
    title: `${team.name} - ${team.league.name} Team Profile & Statistics`,
    description: `Team statistics, form guide, recent matches and predictions for ${team.name}.`,
  }
}

export default async function TeamDetailPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params

  const team = await prisma.team.findUnique({
    where: { slug: params.slug },
    include: {
      league: true,
      match_match_homeTeamIdToteam: {
        include: { league: true, team_match_awayTeamIdToteam: true, team_match_homeTeamIdToteam: true },
        orderBy: { date: 'desc' },
        take: 10,
      },
      match_match_awayTeamIdToteam: {
        include: { league: true, team_match_awayTeamIdToteam: true, team_match_homeTeamIdToteam: true },
        orderBy: { date: 'desc' },
        take: 10,
      },
      standing: { include: { league: true }, orderBy: { position: 'asc' } },
      topscorer: true,
    },
  }).catch(() => null)

  if (!team) notFound()

  if (!team) notFound()

  const recentMatches = [
    ...team.match_match_homeTeamIdToteam.map(m => ({ ...m, isHome: true })),
    ...team.match_match_awayTeamIdToteam.map(m => ({ ...m, isHome: false })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10)

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Link href="/teams" className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary mb-6">
        <ArrowLeft className="w-4 h-4" />
        All Teams
      </Link>

      <div className="bg-surface rounded-2xl border border-border p-6 md:p-8 mb-8">
        <div className="flex items-center gap-4">
          {team.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={team.logo} alt={team.name} className="w-16 h-16 rounded-full object-contain" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-surface-tertiary flex items-center justify-center text-2xl font-bold text-primary-600">
              {team.shortName}
            </div>
          )}
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-text-primary">{team.name}</h1>
            <p className="text-text-secondary">{team.league.name}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 mt-4 text-sm text-text-secondary">
          {team.country && (
            <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" />{team.country}</span>
          )}
          {team.stadium && (
            <span className="flex items-center gap-1.5"><Building2 className="w-4 h-4" />{team.stadium}</span>
          )}
          {team.foundedYear && (
            <span className="flex items-center gap-1.5"><CalendarDays className="w-4 h-4" />Founded {team.foundedYear}</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-text-primary mb-3">Recent Matches</h3>
            {recentMatches.length === 0 ? (
              <p className="text-sm text-text-muted">No matches yet.</p>
            ) : (
              <div className="space-y-2">
                {recentMatches.map((match) => {
                  const opponent = match.isHome ? match.team_match_awayTeamIdToteam : match.team_match_homeTeamIdToteam
                  const isFinished = match.status === 'finished'
                  const isHome = match.isHome
                  let result: 'W' | 'D' | 'L' | null = null
                  if (isFinished && match.homeScore != null && match.awayScore != null) {
                    const teamScore = isHome ? match.homeScore : match.awayScore
                    const oppScore = isHome ? match.awayScore : match.homeScore
                    result = teamScore > oppScore ? 'W' : teamScore < oppScore ? 'L' : 'D'
                  }
                  return (
                    <div key={match.id} className="flex items-center justify-between p-3 rounded-lg bg-surface-tertiary">
                      <div className="flex items-center gap-2 min-w-0">
                        {result && (
                          <span className={`text-xs font-bold w-5 h-5 rounded flex items-center justify-center ${
                            result === 'W' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                            result === 'D' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                            'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          }`}>{result}</span>
                        )}
                        <span className="text-sm truncate">{isHome ? 'vs' : '@'} {opponent?.name}</span>
                      </div>
                      <div className="text-right shrink-0">
                        {isFinished && match.homeScore != null && match.awayScore != null ? (
                          <span className="text-sm font-semibold">{match.homeScore} - {match.awayScore}</span>
                        ) : (
                          <span className="text-xs text-text-muted">{new Date(match.date).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-text-primary mb-3">League Standing</h3>
            {team.standing.length === 0 ? (
              <p className="text-sm text-text-muted">No standings available.</p>
            ) : (
              <div className="space-y-3">
                {team.standing.map((standing) => (
                  <div key={standing.id} className="p-3 rounded-lg bg-surface-tertiary">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="info" size="sm">{standing.league.name}</Badge>
                      <span className="text-xs text-text-muted">Season {standing.season}</span>
                    </div>
                    <div className="grid grid-cols-5 gap-2 text-center text-xs">
                      <div>
                        <p className="font-bold text-lg text-text-primary">{standing.position}</p>
                        <p className="text-text-muted">Pos</p>
                      </div>
                      <div>
                        <p className="font-bold text-lg text-text-primary">{standing.played}</p>
                        <p className="text-text-muted">P</p>
                      </div>
                      <div>
                        <p className="font-bold text-lg text-green-600">{standing.won}</p>
                        <p className="text-text-muted">W</p>
                      </div>
                      <div>
                        <p className="font-bold text-lg text-yellow-600">{standing.drawn}</p>
                        <p className="text-text-muted">D</p>
                      </div>
                      <div>
                        <p className="font-bold text-lg text-red-600">{standing.lost}</p>
                        <p className="text-text-muted">L</p>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm mt-2 pt-2 border-t border-border">
                      <span className="text-text-secondary">GF: {standing.goalsFor} | GA: {standing.goalsAgainst}</span>
                      <span className="font-bold text-primary-600">{standing.points} pts</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {team.topscorer.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
              <Target className="w-4 h-4" /> Top Scorers
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-2 text-text-muted font-medium">Player</th>
                    <th className="text-left p-2 text-text-muted font-medium">Season</th>
                    <th className="text-center p-2 text-text-muted font-medium">Goals</th>
                    <th className="text-center p-2 text-text-muted font-medium">Assists</th>
                  </tr>
                </thead>
                <tbody>
                  {team.topscorer.map((ts) => (
                    <tr key={ts.id} className="border-b border-border last:border-0">
                      <td className="p-2 font-medium">{ts.playerName}</td>
                      <td className="p-2 text-text-muted">{ts.season}</td>
                      <td className="p-2 text-center font-bold text-primary-600">{ts.goals}</td>
                      <td className="p-2 text-center text-text-secondary">{ts.assists}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
