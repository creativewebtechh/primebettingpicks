import type { Metadata } from 'next'
import Link from 'next/link'
import { Search, Users } from 'lucide-react'
import { prisma } from '@/lib/prisma'

export const metadata: Metadata = {
  title: 'Football Teams - Profiles, Form & Predictions',
  description: 'Browse top football teams, view their current form, squad information, match predictions, and detailed statistics across all major leagues.',
}

export default async function TeamsPage(props: { searchParams: Promise<{ q?: string }> }) {
  const searchParams = await props.searchParams
  const query = searchParams.q?.trim() || ''

  const teams = await prisma.team.findMany({
    where: query
      ? { name: { contains: query } }
      : undefined,
    include: { league: true },
    orderBy: { name: 'asc' },
  }).catch(() => [])

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary">Football Teams</h1>
        <p className="text-text-secondary mt-1">Browse teams and their latest predictions</p>
      </div>

      <form className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Search teams..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface border border-border text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
          />
        </div>
      </form>

      {teams.length === 0 ? (
        <div className="text-center py-20">
          <Users className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-text-primary mb-2">No teams found</h2>
          <p className="text-text-secondary">
            {query ? `No teams matching "${query}"` : 'No teams available yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {teams.map((team) => (
            <Link
              key={team.id}
              href={`/teams/${team.slug}`}
              className="bg-surface rounded-xl border border-border p-4 hover:shadow-md hover:border-primary-200 dark:hover:border-primary-800 transition-all duration-200"
            >
              <div className="flex items-center gap-3">
                {team.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={team.logo} alt={team.name} className="w-12 h-12 rounded-full object-contain" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-surface-tertiary flex items-center justify-center text-lg font-bold text-primary-600">
                    {team.shortName || team.name.charAt(0)}
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="font-semibold text-text-primary truncate">{team.name}</h3>
                  <p className="text-xs text-text-muted truncate">{team.league.name}</p>
                  {team.country && (
                    <p className="text-xs text-text-muted">{team.country}</p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
