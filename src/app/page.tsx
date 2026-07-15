import Link from 'next/link'
import { ArrowRight, Trophy, TrendingUp, Shield, Zap, BarChart3, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LeagueNav } from '@/components/common/league-nav'
import { prisma } from '@/lib/prisma'
import { LEAGUES } from '@/lib/constants'
import { formatDate, formatTime } from '@/lib/utils'

const FEATURES = [
  { icon: TrendingUp, title: 'Expert Predictions', description: 'Data-driven predictions from our team of football analysts with 85%+ accuracy rate.' },
  { icon: Shield, title: 'Odds Comparison', description: 'Compare odds from top bookmakers to find the best value for your bets.' },
  { icon: Zap, title: 'Live Updates', description: 'Real-time scores, statistics, and live match tracking across all major leagues.' },
  { icon: BarChart3, title: 'Deep Statistics', description: 'Comprehensive match statistics, form guides, and head-to-head analysis.' },
  { icon: Trophy, title: 'All Major Leagues', description: 'Covering Premier League, Champions League, La Liga, Serie A, Bundesliga and more.' },
  { icon: Users, title: 'Community Tips', description: 'Join thousands of bettors sharing insights and winning strategies.' },
]

export default async function HomePage() {
  const [featuredPredictions, liveCount, recentNews] = await Promise.all([
    prisma.prediction.findMany({
      where: { published: true, featured: true },
      include: {
        match: {
          include: {
            league: true,
            team_match_homeTeamIdToteam: true,
            team_match_awayTeamIdToteam: true,
          },
        },
      },
      take: 3,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.match.count({ where: { status: 'live' } }),
    prisma.newsarticle.findMany({
      where: { published: true },
      take: 3,
      orderBy: { createdAt: 'desc' },
    }),
  ]).catch(() => [[], 0, []] as const)

  return (
    <div>
      <section className="relative bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.1),transparent_50%)]" />
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-24">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-sm font-medium mb-6 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              {liveCount > 0 ? `${liveCount} live match${liveCount > 1 ? 'es' : ''} now` : 'Live predictions available now'}
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
              Expert Football
              <span className="block text-primary-300">Predictions & Tips</span>
            </h1>
            <p className="text-lg md:text-xl text-white/80 mb-8 max-w-2xl">
              Data-driven football predictions, betting tips, and match analysis from expert analysts.
              Covering all major leagues and competitions worldwide.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/predictions">
                <Button size="lg" className="bg-white text-primary-800 hover:bg-white/90">
                  View Predictions
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/live-scores">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                  Live Scores
                </Button>
              </Link>
            </div>
          </div>
        </div>
        <div className="hidden lg:block absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-primary-600/20 to-transparent" />
      </section>

      <section className="max-w-7xl mx-auto px-4 py-8">
        <LeagueNav />
      </section>

      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-text-primary">Featured Predictions</h2>
            <p className="text-text-secondary mt-1">Today&apos;s best betting opportunities</p>
          </div>
          <Link href="/predictions">
            <Button variant="ghost" size="sm">
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {featuredPredictions.filter((p) => p.match).length > 0 ? (
            featuredPredictions.filter((p) => p.match).map((prediction) => {
              const match = prediction.match!
              const homeTeam = match.team_match_homeTeamIdToteam
              const awayTeam = match.team_match_awayTeamIdToteam
              return (
                <Link key={prediction.id} href={`/predictions/${prediction.id}`}>
                  <div className="bg-surface rounded-xl border border-border p-4 hover:shadow-md hover:border-primary-200 dark:hover:border-primary-800 transition-all duration-200">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 font-medium">
                        Featured Pick
                      </span>
                      <span className="text-xs text-text-muted">{formatDate(match.date)}, {formatTime(match.date)}</span>
                    </div>
                    <div className="text-xs text-text-muted mb-2">{match.league?.name || 'Unknown League'}</div>
                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-surface-tertiary flex items-center justify-center text-sm font-bold">
                          {homeTeam?.shortName?.charAt(0) || '?'}
                        </div>
                        <span className="text-sm font-medium">{homeTeam?.name || 'TBD'}</span>
                      </div>
                      <span className="text-lg font-bold text-primary-600">
                        {prediction.predictedHomeScore} - {prediction.predictedAwayScore}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{awayTeam?.name || 'TBD'}</span>
                        <div className="w-8 h-8 rounded-full bg-surface-tertiary flex items-center justify-center text-sm font-bold">
                          {awayTeam?.shortName?.charAt(0) || '?'}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs">
                      <span className="text-text-muted">{prediction.tip}</span>
                      <span className="text-success font-medium">
                        {Math.round(Math.max(prediction.homeWinProbability, prediction.drawProbability, prediction.awayWinProbability) * 100)}% confidence
                      </span>
                    </div>
                    {prediction.premium && prediction.price != null && (
                      <div className="mt-2 text-xs text-yellow-600 dark:text-yellow-400 font-medium">
                        Premium &middot; ₦{prediction.price.toLocaleString()}
                      </div>
                    )}
                  </div>
                </Link>
              )
            })
          ) : (
            <div className="col-span-full bg-surface rounded-xl border border-border p-12 text-center">
              <p className="text-text-secondary">No featured predictions available yet.</p>
              <p className="text-text-muted text-sm mt-1">Check back soon for expert picks.</p>
            </div>
          )}
        </div>
      </section>

      {recentNews.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-text-primary">Latest News</h2>
              <p className="text-text-secondary mt-1">Stay updated with football news</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentNews.map((article) => (
              <Link key={article.id} href={`/news/${article.slug}`}>
                <div className="bg-surface rounded-xl border border-border overflow-hidden hover:shadow-md transition-all duration-200">
                  {article.image && (
                    <div className="h-40 bg-surface-tertiary" />
                  )}
                  <div className="p-4">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-surface-tertiary text-text-muted font-medium">
                      {article.category}
                    </span>
                    <h3 className="font-semibold text-text-primary mt-2 line-clamp-2">{article.title}</h3>
                    <p className="text-sm text-text-secondary mt-1 line-clamp-2">{article.excerpt}</p>
                    <p className="text-xs text-text-muted mt-3">{formatDate(article.createdAt)}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="bg-surface-secondary py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-text-primary text-center mb-12">
            Why Choose PrimeBettingPicks?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature) => {
              const Icon = feature.icon
              return (
                <div key={feature.title} className="bg-surface rounded-xl border border-border p-6">
                  <div className="w-12 h-12 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-primary-600" />
                  </div>
                  <h3 className="font-semibold text-text-primary mb-2">{feature.title}</h3>
                  <p className="text-sm text-text-secondary">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-text-primary mb-8">Popular Leagues</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {LEAGUES.map((league) => (
            <Link
              key={league.slug}
              href={`/leagues/${league.slug}`}
              className="bg-surface rounded-xl border border-border p-4 text-center hover:shadow-md hover:border-primary-200 dark:hover:border-primary-800 transition-all duration-200"
            >
              <div className="w-12 h-12 rounded-full bg-surface-tertiary flex items-center justify-center text-lg font-bold text-primary-600 mx-auto mb-3">
                {league.name.charAt(0)}
              </div>
              <h3 className="font-semibold text-sm text-text-primary">{league.name}</h3>
              <p className="text-xs text-text-muted mt-1">{league.country}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-gradient-to-r from-primary-900 to-primary-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Winning?</h2>
          <p className="text-white/80 mb-8 max-w-2xl mx-auto">
            Join thousands of successful bettors who trust our expert predictions and analysis.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="bg-white text-primary-800 hover:bg-white/90">
                Create Free Account
              </Button>
            </Link>
            <Link href="/predictions">
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                Browse Predictions
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
