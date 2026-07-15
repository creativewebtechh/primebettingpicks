'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Radio } from 'lucide-react'
import { LeagueNav } from '@/components/common/league-nav'
import { formatDate, formatTime } from '@/lib/utils'

interface Team {
  id: string
  name: string
  shortName: string | null
  slug: string
}

interface League {
  id: string
  name: string
  slug: string
}

interface Livescore {
  homeScore: number | null
  awayScore: number | null
  minute: number | null
}

interface Match {
  id: string
  date: string
  status: string
  homeScore: number | null
  awayScore: number | null
  shotsHome: number | null
  shotsAway: number | null
  possessionHome: number | null
  possessionAway: number | null
  league: League | null
  team_match_homeTeamIdToteam: Team | null
  team_match_awayTeamIdToteam: Team | null
  livescore?: Livescore | null
}

const REFRESH_INTERVAL = 30_000

export function LiveScoresList() {
  const [liveMatches, setLiveMatches] = useState<Match[]>([])
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([])
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/live-scores', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        setLiveMatches(data.liveMatches ?? [])
        setUpcomingMatches(data.upcomingMatches ?? [])
        setLastUpdated(new Date())
      }
    } catch {
      // silently retry on next interval
    }
  }, [])

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    fetchData()
    /* eslint-enable react-hooks/set-state-in-effect */
    const interval = setInterval(fetchData, REFRESH_INTERVAL)
    return () => clearInterval(interval)
  }, [fetchData])

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary">Live Scores</h1>
        <p className="text-text-secondary mt-1">Real-time scores and match updates</p>
      </div>

      <div className="mb-6">
        <LeagueNav />
      </div>

      {liveMatches.length > 0 ? (
        <>
          <div className="flex items-center gap-2 mb-4">
            <Radio className="w-4 h-4 text-red-500 animate-pulse" />
            <span className="text-sm font-medium text-red-500">
              {liveMatches.length} live match{liveMatches.length > 1 ? 'es' : ''}
            </span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
            {liveMatches.map((match) => {
              const homeTeam = match.team_match_homeTeamIdToteam
              const awayTeam = match.team_match_awayTeamIdToteam
              const live = match.livescore
              const homeScore = live?.homeScore ?? match.homeScore ?? 0
              const awayScore = live?.awayScore ?? match.awayScore ?? 0
              return (
                <Link key={match.id} href={`/predictions/${match.id}`}>
                  <div className="bg-surface rounded-xl border border-border p-4 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-xs font-medium text-red-500">LIVE</span>
                      {live?.minute != null && (
                        <span className="text-xs text-text-muted">{live.minute}&apos;</span>
                      )}
                      <span className="text-xs px-2 py-0.5 rounded-full bg-surface-tertiary text-text-muted font-medium ml-auto">
                        {match.league?.name || 'Unknown League'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1">
                        <div className="w-8 h-8 rounded-full bg-surface-tertiary flex items-center justify-center text-sm font-bold">
                          {homeTeam?.shortName?.charAt(0) || '?'}
                        </div>
                        <span className="font-medium">{homeTeam?.name || 'TBD'}</span>
                      </div>
                      <div className="text-2xl font-bold tabular-nums mx-4">
                        <span className="text-primary-600">{homeScore}</span>
                        <span className="text-text-muted mx-1">-</span>
                        <span>{awayScore}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-1 justify-end">
                        <span className="font-medium">{awayTeam?.name || 'TBD'}</span>
                        <div className="w-8 h-8 rounded-full bg-surface-tertiary flex items-center justify-center text-sm font-bold">
                          {awayTeam?.shortName?.charAt(0) || '?'}
                        </div>
                      </div>
                    </div>
                    {(match.shotsHome != null || match.possessionHome != null) && (
                      <div className="mt-3 pt-3 border-t border-border flex justify-between text-xs text-text-muted">
                        {match.shotsHome != null && match.shotsAway != null && (
                          <span>Shots: {match.shotsHome} - {match.shotsAway}</span>
                        )}
                        {match.possessionHome != null && match.possessionAway != null && (
                          <span>Possession: {match.possessionHome}% - {match.possessionAway}%</span>
                        )}
                      </div>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        </>
      ) : (
        <>
          <div className="bg-surface rounded-xl border border-border p-12 text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-surface-tertiary flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚽</span>
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">No Live Matches</h3>
            <p className="text-text-secondary">No live matches at the moment. Check back during match hours.</p>
          </div>

          {upcomingMatches.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-text-primary mb-4">Coming Up Next</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {upcomingMatches.map((match) => {
                  const homeTeam = match.team_match_homeTeamIdToteam
                  const awayTeam = match.team_match_awayTeamIdToteam
                  return (
                    <Link key={match.id} href={`/predictions/${match.id}`}>
                      <div className="bg-surface rounded-xl border border-border p-4 hover:shadow-md transition-all duration-200">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-surface-tertiary text-text-muted font-medium">
                            {match.league?.name || 'Unknown League'}
                          </span>
                          <span className="text-xs text-text-muted">
                            {formatDate(match.date)}, {formatTime(match.date)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-1">
                            <div className="w-8 h-8 rounded-full bg-surface-tertiary flex items-center justify-center text-sm font-bold">
                              {homeTeam?.shortName?.charAt(0) || '?'}
                            </div>
                            <span className="font-medium">{homeTeam?.name || 'TBD'}</span>
                          </div>
                          <span className="text-sm font-bold text-text-muted mx-4">vs</span>
                          <div className="flex items-center gap-2 flex-1 justify-end">
                            <span className="font-medium">{awayTeam?.name || 'TBD'}</span>
                            <div className="w-8 h-8 rounded-full bg-surface-tertiary flex items-center justify-center text-sm font-bold">
                              {awayTeam?.shortName?.charAt(0) || '?'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}

      <p className="text-xs text-text-muted text-center mt-8">
        {lastUpdated
          ? `Last updated ${lastUpdated.toLocaleTimeString()} · Auto-refreshes every 30s`
          : 'Loading live scores...'}
      </p>
    </div>
  )
}
