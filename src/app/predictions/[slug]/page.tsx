import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Share2, Clock, MapPin, AlertCircle, Crown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { WinProbability } from '@/components/predictions/win-probability'
import { HeadToHead } from '@/components/predictions/head-to-head'
import { OddsComparison } from '@/components/predictions/odds-comparison'
import { FormGuide } from '@/components/predictions/form-guide'
import { PremiumGate } from '@/components/predictions/premium-gate'
import { prisma } from '@/lib/prisma'
import { formatDate } from '@/lib/utils'

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await props.params
  const prediction = await prisma.prediction.findUnique({
    where: { id: slug },
    include: {
      match: {
        include: {
          team_match_homeTeamIdToteam: true,
          team_match_awayTeamIdToteam: true,
        },
      },
    },
  }).catch(() => null)

  if (!prediction || !prediction.match) {
    return { title: 'Prediction Not Found' }
  }

  const home = prediction.match.team_match_homeTeamIdToteam?.name || 'Home'
  const away = prediction.match.team_match_awayTeamIdToteam?.name || 'Away'

  return {
    title: `${home} vs ${away} - Prediction & Analysis`,
    description: `${prediction.tip} prediction for ${home} vs ${away}. Predicted score: ${prediction.predictedHomeScore}-${prediction.predictedAwayScore}. ${prediction.analysis ? prediction.analysis.slice(0, 150) : 'Expert analysis and betting tips.'}`,
  }
}

export default async function PredictionDetailPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params

  const prediction = await prisma.prediction.findUnique({
    where: { id: slug },
    include: {
      match: {
        include: {
          league: true,
          team_match_homeTeamIdToteam: true,
          team_match_awayTeamIdToteam: true,
        },
      },
      expert: true,
      payment: true,
    },
  }).catch(() => null)

  if (!prediction || !prediction.match) {
    notFound()
  }

  if (!prediction || !prediction.match) {
    notFound()
  }

  const match = prediction.match
  const leagueName = match.league?.name || 'Unknown League'
  const homeTeam = match.team_match_homeTeamIdToteam?.name || 'Home'
  const awayTeam = match.team_match_awayTeamIdToteam?.name || 'Away'
  const homeShort = match.team_match_homeTeamIdToteam?.shortName || homeTeam.charAt(0)
  const awayShort = match.team_match_awayTeamIdToteam?.shortName || awayTeam.charAt(0)

  const tipBadgeVariant = prediction.tip.toLowerCase().includes('home')
    ? 'success' as const
    : prediction.tip.toLowerCase().includes('away')
      ? 'error' as const
      : 'warning' as const

  const odds = [
    { bookmaker: 'Bet365', home: 1.85, draw: 3.60, away: 4.20 },
    { bookmaker: 'Bet9ja', home: 1.83, draw: 3.58, away: 4.25 },
    { bookmaker: 'SportyBet', home: 1.87, draw: 3.55, away: 4.15 },
  ]

  const bettingTips = prediction.bettingTips
    ? (() => {
        try { return JSON.parse(prediction.bettingTips) as { tip: string; odds: string; confidence: string }[] }
        catch { return [{ tip: prediction.tip, odds: 'N/A', confidence: 'Medium' }] }
      })()
    : [{ tip: prediction.tip, odds: 'N/A', confidence: 'Medium' }]

  const analysisContent = (
    <Card>
      <CardHeader>
        <h3 className="font-semibold text-text-primary">Match Analysis</h3>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-text-secondary">
        {prediction.analysis ? (
          prediction.analysis.split('\n').filter(Boolean).map((para, i) => (
            <p key={i}>{para}</p>
          ))
        ) : (
          <p>Detailed analysis not available for this prediction.</p>
        )}
      </CardContent>
    </Card>
  )

  const tipsContent = (
    <Card>
      <CardHeader>
        <h3 className="font-semibold text-text-primary">Betting Tips</h3>
      </CardHeader>
      <CardContent className="space-y-3">
        {bettingTips.map((bet, i) => (
          <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-surface-tertiary">
            <div>
              <p className="text-sm font-medium text-text-primary">{bet.tip}</p>
              <p className="text-xs text-text-muted">Odds: {bet.odds}</p>
            </div>
            <Badge
              variant={bet.confidence === 'High' ? 'success' : bet.confidence === 'Medium' ? 'warning' : 'default'}
              size="sm"
            >
              {bet.confidence}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  )

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Link href="/predictions" className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to Predictions
      </Link>

      <div className="bg-gradient-to-r from-primary-900 to-primary-800 rounded-2xl p-6 md:p-8 text-white mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-white/80 border-white/20">{leagueName}</Badge>
            {prediction.premium && (
              <span className="flex items-center gap-1 text-yellow-300 text-xs font-medium">
                <Crown className="w-3 h-3" />
                Premium
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-white/80 hover:text-white">
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
          <div className="text-center md:text-left">
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-2xl font-bold mx-auto md:mx-0 mb-2">{homeShort}</div>
            <h2 className="text-xl font-bold">{homeTeam}</h2>
            {match.homeForm && (
              <div className="flex items-center justify-center md:justify-start gap-1 mt-1">
                <FormGuide form={match.homeForm} size="md" />
              </div>
            )}
          </div>
          <div className="text-center">
            <div className="text-sm text-white/60 mb-1">Predicted Score</div>
            <div className="text-5xl font-bold mb-2">
              <span>{prediction.predictedHomeScore}</span>
              <span className="text-white/40 mx-2">:</span>
              <span>{prediction.predictedAwayScore}</span>
            </div>
            <Badge className={tipBadgeVariant === 'success' ? 'bg-green-500 text-white border-0' : tipBadgeVariant === 'error' ? 'bg-red-500 text-white border-0' : 'bg-yellow-500 text-white border-0'}>
              {prediction.tip}
            </Badge>
            <div className="flex items-center justify-center gap-2 mt-2 text-sm text-white/60">
              <Clock className="w-4 h-4" />
              <span>{formatDate(match.date)}</span>
            </div>
          </div>
          <div className="text-center md:text-right">
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-2xl font-bold mx-auto md:mr-0 mb-2">{awayShort}</div>
            <h2 className="text-xl font-bold">{awayTeam}</h2>
            {match.awayForm && (
              <div className="flex items-center justify-center md:justify-end gap-1 mt-1">
                <FormGuide form={match.awayForm} size="md" />
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4 mt-6 pt-4 border-t border-white/10 text-sm text-white/60">
          {match.venue && (
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {match.venue}</span>
          )}
          {match.injuries && (
            <span className="flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {match.injuries}</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <WinProbability
            homeWin={prediction.homeWinProbability}
            draw={prediction.drawProbability}
            awayWin={prediction.awayWinProbability}
            homeTeam={homeTeam}
            awayTeam={awayTeam}
          />

          <HeadToHead
            data={{
              homeWins: 42,
              awayWins: 28,
              draws: 20,
              homeTeam,
              awayTeam,
              matches: [
                { homeScore: 2, awayScore: 1, date: '2024-01-15' },
                { homeScore: 1, awayScore: 1, date: '2023-08-20' },
                { homeScore: 0, awayScore: 2, date: '2023-04-05' },
                { homeScore: 3, awayScore: 1, date: '2022-10-16' },
                { homeScore: 2, awayScore: 2, date: '2022-05-21' },
              ],
            }}
          />

          <OddsComparison odds={odds} />

          {prediction.premium ? (
            <PremiumGate predictionId={prediction.id} amount={prediction.price ?? undefined}>
              {analysisContent}
              {tipsContent}
            </PremiumGate>
          ) : (
            <>
              {analysisContent}
              {tipsContent}
            </>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-text-primary">Match Statistics</h3>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: 'Possession', home: match.possessionHome ?? 50, away: match.possessionAway ?? 50 },
                { label: 'Shots', home: match.shotsHome ?? 0, away: match.shotsAway ?? 0 },
                { label: 'Shots on Target', home: match.shotsOnTargetHome ?? 0, away: match.shotsOnTargetAway ?? 0 },
                { label: 'Corners', home: match.cornersHome ?? 0, away: match.cornersAway ?? 0 },
                { label: 'Fouls', home: match.foulsHome ?? 0, away: match.foulsAway ?? 0 },
              ].map((stat, i) => {
                const total = (stat.home as number) + (stat.away as number)
                const homePct = total > 0 ? ((stat.home as number) / total) * 100 : 50
                const awayPct = total > 0 ? ((stat.away as number) / total) * 100 : 50
                return (
                  <div key={i}>
                    <div className="flex justify-between text-xs text-text-muted mb-1">
                      <span>{stat.home}</span>
                      <span className="font-medium text-text-primary">{stat.label}</span>
                      <span>{stat.away}</span>
                    </div>
                    <div className="flex h-1.5 rounded-full overflow-hidden bg-surface-tertiary">
                      <div className="bg-primary-500 h-full" style={{ width: `${homePct}%` }} />
                      <div className="bg-red-400 h-full" style={{ width: `${awayPct}%` }} />
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="font-semibold text-text-primary">Team News</h3>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <p className="font-medium text-text-primary mb-1">{homeTeam}</p>
                <p className="text-text-secondary">{match.injuries || 'No major injuries reported.'}</p>
              </div>
              <div>
                <p className="font-medium text-text-primary mb-1">{awayTeam}</p>
                <p className="text-text-secondary">Check latest updates for team news.</p>
              </div>
            </CardContent>
          </Card>

          {prediction.expert && (
            <Card>
              <CardHeader>
                <h3 className="font-semibold text-text-primary">Expert Tipster</h3>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-surface-tertiary flex items-center justify-center text-lg font-bold">
                    {prediction.expert.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-text-primary">{prediction.expert.name}</p>
                    <p className="text-xs text-text-muted">
                      {prediction.expert.winRate}% win rate · {prediction.expert.totalPredictions} predictions
                    </p>
                    {prediction.expert.specialties && (
                      <p className="text-xs text-text-secondary mt-0.5">{prediction.expert.specialties}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
