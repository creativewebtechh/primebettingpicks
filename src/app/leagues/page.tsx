import type { Metadata } from 'next'
import Link from 'next/link'
import { Trophy, Star } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { Badge } from '@/components/ui/badge'

export const metadata: Metadata = {
  title: 'Football Leagues & Competitions',
  description: 'Browse all major football leagues and competitions. Get expert predictions, standings, and analysis for Premier League, La Liga, Serie A, and more.',
}

export default async function LeaguesPage() {
  const leagues = await prisma.league.findMany({
    where: { active: true },
    orderBy: { tier: 'asc' },
  }).catch(() => [])

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary">Football Leagues</h1>
        <p className="text-text-secondary mt-1">Expert predictions and analysis for all major competitions</p>
      </div>

      {leagues.length === 0 ? (
        <div className="text-center py-20">
          <Trophy className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-text-primary mb-2">No leagues found</h2>
          <p className="text-text-secondary">No leagues available yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {leagues.map((league) => (
            <Link
              key={league.id}
              href={`/leagues/${league.slug}`}
              className={`bg-surface rounded-xl border p-5 hover:shadow-md transition-all duration-200 ${
                league.featured
                  ? 'border-primary-300 dark:border-primary-700 ring-1 ring-primary-200 dark:ring-primary-800'
                  : 'border-border hover:border-primary-200 dark:hover:border-primary-800'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                {league.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={league.logo} alt={league.name} className="w-14 h-14 rounded-full object-contain" />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-surface-tertiary flex items-center justify-center text-xl font-bold text-primary-600">
                    {league.name.charAt(0)}
                  </div>
                )}
                {league.featured && (
                  <Star className="w-5 h-5 text-primary-500 fill-primary-500" />
                )}
              </div>
              <h3 className="font-semibold text-text-primary mb-1">{league.name}</h3>
              <p className="text-sm text-text-muted">{league.country}</p>
              <div className="mt-3 flex items-center justify-between">
                <Badge variant="outline" size="sm">Tier {league.tier}</Badge>
                <span className="text-xs text-primary-600 font-medium flex items-center gap-1">
                  View &rarr;
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
