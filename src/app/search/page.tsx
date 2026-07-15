import type { Metadata } from 'next'
import Link from 'next/link'
import { Search } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { Badge } from '@/components/ui/badge'

type MatchResult = {
  id: string
  date: Date
  status: string
  homeScore: number | null
  awayScore: number | null
  league: { name: string; slug: string } | null
  team_match_homeTeamIdToteam: { name: string; slug: string } | null
  team_match_awayTeamIdToteam: { name: string; slug: string } | null
}

type TeamResult = {
  id: string
  name: string
  slug: string
  shortName: string
  logo: string | null
  country: string | null
  league: { name: string } | null
}

type LeagueResult = {
  id: string
  name: string
  slug: string
  logo: string | null
  country: string
}

type NewsResult = {
  id: string
  title: string
  slug: string
  excerpt: string
  category: string
  createdAt: Date
}

export const metadata: Metadata = {
  title: 'Search',
  description: 'Search for football matches, teams, leagues, predictions, and news on PrimeBettingPicks.',
}

export default async function SearchPage(props: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await props.searchParams
  const hasQuery = q && q.length >= 2

  let matches: MatchResult[] = []
  let teams: TeamResult[] = []
  let leagues: LeagueResult[] = []
  let news: NewsResult[] = []

  if (hasQuery) {
    const query = q!
    const [m, t, l, n] = await Promise.all([
      prisma.match.findMany({
        where: {
          OR: [
            { team_match_homeTeamIdToteam: { name: { contains: query } } },
            { team_match_awayTeamIdToteam: { name: { contains: query } } },
          ],
        },
        include: {
          league: true,
          team_match_homeTeamIdToteam: true,
          team_match_awayTeamIdToteam: true,
        },
        take: 10,
      }),
      prisma.team.findMany({
        where: { name: { contains: query } },
        include: { league: true },
        take: 10,
      }),
      prisma.league.findMany({
        where: { name: { contains: query } },
        take: 10,
      }),
      prisma.newsarticle.findMany({
        where: {
          published: true,
          OR: [
            { title: { contains: query } },
            { excerpt: { contains: query } },
          ],
        },
        take: 10,
      }),
    ])
    matches = m
    teams = t
    leagues = l
    news = n
  }

  const hasResults = matches.length > 0 || teams.length > 0 || leagues.length > 0 || news.length > 0

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary">Search</h1>
        <p className="text-text-secondary mt-1">Find teams, leagues, matches, and news</p>
      </div>

      <form action="/search" method="GET" className="mb-8">
        <div className="relative max-w-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
          <input
            type="text"
            name="q"
            defaultValue={q || ''}
            placeholder="Search teams, leagues, predictions..."
            className="w-full h-12 pl-12 pr-4 rounded-xl border border-border bg-surface text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
          >
            Search
          </button>
        </div>
      </form>

      {q && q.length < 2 && (
        <p className="text-text-muted">Please enter at least 2 characters to search.</p>
      )}

      {hasQuery && !hasResults && (
        <p className="text-text-muted text-lg py-12 text-center">No results found for &ldquo;{q}&rdquo;.</p>
      )}

      {hasQuery && hasResults && (
        <div className="space-y-10">
          {matches.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-text-primary mb-4">Matches</h2>
              <div className="space-y-2">
                {matches.map((match) => (
                  <div key={match.id} className="bg-surface rounded-xl border border-border p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-text-muted">{match.league?.name}</span>
                      <Badge variant="outline">{match.status}</Badge>
                    </div>
                    <div className="mt-2 flex items-center gap-3">
                      <span className="font-medium text-text-primary">{match.team_match_homeTeamIdToteam?.name}</span>
                      <span className="text-text-muted">vs</span>
                      <span className="font-medium text-text-primary">{match.team_match_awayTeamIdToteam?.name}</span>
                      {match.homeScore != null && match.awayScore != null && (
                        <span className="ml-2 font-bold text-text-primary">{match.homeScore} - {match.awayScore}</span>
                      )}
                    </div>
                    <p className="text-xs text-text-muted mt-1">
                      {new Date(match.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {teams.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-text-primary mb-4">Teams</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {teams.map((team) => (
                  <div key={team.id} className="bg-surface rounded-xl border border-border p-4">
                    <h3 className="font-medium text-text-primary">{team.name}</h3>
                    <p className="text-sm text-text-muted">{team.league?.name}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {leagues.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-text-primary mb-4">Leagues</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {leagues.map((league) => (
                  <Link
                    key={league.id}
                    href={'/leagues/' + league.slug}
                    className="bg-surface rounded-xl border border-border p-4 hover:shadow-md hover:border-primary-200 dark:hover:border-primary-800 transition-all duration-200"
                  >
                    <h3 className="font-medium text-text-primary">{league.name}</h3>
                    <p className="text-sm text-text-muted">{league.country}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {news.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-text-primary mb-4">News</h2>
              <div className="space-y-2">
                {news.map((article) => (
                  <Link
                    key={article.id}
                    href={'/news/' + article.slug}
                    className="block bg-surface rounded-xl border border-border p-4 hover:shadow-md hover:border-primary-200 dark:hover:border-primary-800 transition-all duration-200"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="info">{article.category}</Badge>
                      <span className="text-xs text-text-muted">
                        {new Date(article.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="font-medium text-text-primary">{article.title}</h3>
                    {article.excerpt && (
                      <p className="text-sm text-text-secondary line-clamp-1 mt-1">{article.excerpt}</p>
                    )}
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
