import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MATCH_STATUS_LABELS } from '@/lib/constants'

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const params = await props.params
  const league = await prisma.league.findUnique({
    where: { slug: params.slug },
    select: { name: true, country: true },
  }).catch(() => null)
  if (!league) return { title: 'League Not Found' }
  return {
    title: `${league.name} - ${league.country} Predictions & Standings`,
    description: `Expert predictions, standings, top scorers, and recent matches for ${league.name}.`,
  }
}

export default async function LeagueDetailPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params

  const league = await prisma.league.findUnique({
    where: { slug: params.slug },
    include: {
      standing: { include: { team: true }, orderBy: { position: 'asc' } },
      topscorer: { orderBy: { goals: 'desc' }, take: 10, include: { team: true } },
      match: {
        include: {
          team_match_homeTeamIdToteam: true,
          team_match_awayTeamIdToteam: true,
        },
        orderBy: { date: 'desc' },
        take: 10,
      },
    },
  }).catch(() => null)

  if (!league) notFound()

  if (!league) notFound()

  const currentSeason = league.standing[0]?.season

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Link href="/leagues" className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary mb-6">
        <ArrowLeft className="w-4 h-4" />
        All Leagues
      </Link>

      <div className="bg-surface rounded-2xl border border-border p-6 md:p-8 mb-8">
        <div className="flex items-center gap-4">
          {league.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={league.logo} alt={league.name} className="w-16 h-16 rounded-full object-contain" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-surface-tertiary flex items-center justify-center text-2xl font-bold text-primary-600">
              {league.name.charAt(0)}
            </div>
          )}
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-text-primary">{league.name}</h1>
            <p className="text-text-secondary">{league.country}</p>
          </div>
          {league.featured && (
            <Badge variant="success" size="md">Featured</Badge>
          )}
        </div>
      </div>

      {league.standing.length > 0 && (
        <div className="bg-surface rounded-xl border border-border overflow-hidden mb-8">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold text-text-primary">Standings</h2>
            {currentSeason && <span className="text-xs text-text-muted">Season {currentSeason}</span>}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-tertiary">
                  {['#', 'Team', 'P', 'W', 'D', 'L', 'GF', 'GA', 'GD', 'Pts', 'Form'].map(h => (
                    <th key={h} className="text-left p-3 text-text-muted font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {league.standing.map((row) => (
                  <tr key={row.id} className="border-b border-border hover:bg-surface-tertiary/50">
                    <td className="p-3 font-medium">{row.position}</td>
                    <td className="p-3 font-medium">
                      <Link href={`/teams/${row.team.slug}`} className="hover:text-primary-600 transition-colors">
                        {row.team.name}
                      </Link>
                    </td>
                    <td className="p-3 text-text-muted">{row.played}</td>
                    <td className="p-3 text-text-muted">{row.won}</td>
                    <td className="p-3 text-text-muted">{row.drawn}</td>
                    <td className="p-3 text-text-muted">{row.lost}</td>
                    <td className="p-3 text-text-muted">{row.goalsFor}</td>
                    <td className="p-3 text-text-muted">{row.goalsAgainst}</td>
                    <td className="p-3 text-text-muted">
                      <span className={row.goalDifference > 0 ? 'text-green-600' : row.goalDifference < 0 ? 'text-red-600' : ''}>
                        {row.goalDifference > 0 ? '+' : ''}{row.goalDifference}
                      </span>
                    </td>
                    <td className="p-3 font-bold">{row.points}</td>
                    <td className="p-2">
                      {row.form && (
                        <div className="flex gap-0.5">
                          {row.form.split('').map((r, i) => (
                            <span
                              key={i}
                              className={`w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center text-white ${
                                r === 'W' ? 'bg-green-500' : r === 'D' ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {league.topscorer.length > 0 && (
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-text-primary">Top Scorers</h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {league.topscorer.map((scorer, i) => (
                  <div key={scorer.id} className="flex items-center justify-between p-2 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-text-muted w-5">{i + 1}</span>
                      <div>
                        <p className="text-sm font-medium">{scorer.playerName}</p>
                        <p className="text-xs text-text-muted">{scorer.team.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-primary-600">{scorer.goals} goals</p>
                      <p className="text-xs text-text-muted">{scorer.assists} assists</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {league.match.length > 0 && (
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-text-primary">Recent Matches</h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {league.match.map((match) => {
                  const isFinished = match.status === 'finished'
                  return (
                    <div key={match.id} className="p-3 rounded-lg bg-surface-tertiary">
                      <div className="flex items-center justify-between mb-1">
                        <Badge variant="outline" size="sm">
                          {MATCH_STATUS_LABELS[match.status] || match.status}
                        </Badge>
                        <span className="text-xs text-text-muted">
                          {new Date(match.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-1">
                        <span className="text-sm font-medium">{match.team_match_homeTeamIdToteam.name}</span>
                        <span className="text-sm font-bold px-3">
                          {isFinished && match.homeScore != null && match.awayScore != null
                            ? `${match.homeScore} - ${match.awayScore}`
                            : 'vs'}
                        </span>
                        <span className="text-sm font-medium">{match.team_match_awayTeamIdToteam.name}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
