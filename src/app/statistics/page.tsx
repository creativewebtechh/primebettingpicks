import type { Metadata } from 'next'
import Link from 'next/link'
import { Trophy, Target, BarChart3, Users, Shield, TrendingUp } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { Card, CardContent } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Football Statistics, Standings & Performance Data',
  description: 'Comprehensive football statistics including league standings, team form, head-to-head records, and in-depth performance data for informed betting decisions.',
}

export default async function StatisticsPage() {
  const [totalPredictions, correctPredictions, totalMatches, totalTeams, totalLeagues] = await Promise.all([
    prisma.prediction.count(),
    prisma.prediction.count({ where: { result: 'correct' } }),
    prisma.match.count(),
    prisma.team.count(),
    prisma.league.count({ where: { active: true } }),
  ]).catch(() => [0, 0, 0, 0, 0] as const)

  const winRate = totalPredictions > 0
    ? Math.round((correctPredictions / totalPredictions) * 100)
    : 0

  const premierLeague = await prisma.league.findUnique({
    where: { slug: 'premier-league' },
    include: {
      standing: {
        include: { team: true },
        orderBy: { position: 'asc' },
      },
    },
  }).catch(() => null)

  const stats = [
    { label: 'Total Predictions', value: totalPredictions.toLocaleString(), icon: Target, color: 'text-primary-600', bg: 'bg-primary-100 dark:bg-primary-900/30' },
    { label: 'Correct Predictions', value: correctPredictions.toLocaleString(), icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30' },
    { label: 'Win Rate', value: `${winRate}%`, icon: BarChart3, color: 'text-primary-600', bg: 'bg-primary-100 dark:bg-primary-900/30' },
    { label: 'Total Matches', value: totalMatches.toLocaleString(), icon: Shield, color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-900/30' },
    { label: 'Teams', value: totalTeams.toLocaleString(), icon: Users, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
    { label: 'Active Leagues', value: totalLeagues.toLocaleString(), icon: Trophy, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/30' },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary">Statistics</h1>
        <p className="text-text-secondary mt-1">League standings, team stats, and performance data</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center shrink-0`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-text-primary">{stat.value}</p>
                <p className="text-xs text-text-muted">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {premierLeague && premierLeague.standing.length > 0 && (
        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <div className="p-4 border-b border-border flex items-center gap-3">
            {premierLeague.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={premierLeague.logo} alt={premierLeague.name} className="w-8 h-8 rounded-full object-contain" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-surface-tertiary flex items-center justify-center text-sm font-bold text-primary-600">
                {premierLeague.name.charAt(0)}
              </div>
            )}
            <h2 className="font-semibold text-text-primary">{premierLeague.name} Standings</h2>
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
                {premierLeague.standing.map(row => (
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
    </div>
  )
}
