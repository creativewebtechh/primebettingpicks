'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Match } from '@/types'

interface LiveMatchCardProps {
  match: Match
}

export function LiveMatchCard({ match }: LiveMatchCardProps) {
  const [minute, setMinute] = useState(match.liveMinute || 0)

  useEffect(() => {
    if (match.status !== 'live') return
    const interval = setInterval(() => {
      setMinute(prev => prev + 1)
    }, 60000)
    return () => clearInterval(interval)
  }, [match.status])

  return (
    <Card hover>
      <CardContent className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="error" size="sm">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              LIVE
            </span>
          </Badge>
          <span className="text-xs font-medium text-text-muted">{minute}&apos;</span>
          <Badge variant="outline" size="sm">{match.league?.name}</Badge>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-6 h-6 rounded-full bg-surface-tertiary flex items-center justify-center text-xs font-bold shrink-0">
              {match.homeTeam?.shortName?.charAt(0) || '?'}
            </div>
            <span className="text-sm font-medium truncate">{match.homeTeam?.name}</span>
          </div>

          <div className="text-lg font-bold tabular-nums mx-3">
            <span>{match.homeScore ?? '-'}</span>
            <span className="text-text-muted mx-1">:</span>
            <span>{match.awayScore ?? '-'}</span>
          </div>

          <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
            <span className="text-sm font-medium truncate">{match.awayTeam?.name}</span>
            <div className="w-6 h-6 rounded-full bg-surface-tertiary flex items-center justify-center text-xs font-bold shrink-0">
              {match.awayTeam?.shortName?.charAt(0) || '?'}
            </div>
          </div>
        </div>

        {(match.shotsOnTargetHome != null || match.cornersHome != null) && (
          <div className="mt-2 pt-2 border-t border-border grid grid-cols-2 gap-2 text-xs text-text-muted">
            <div className="flex justify-between">
              <span>Shots on target</span>
              <span className="font-medium">{match.shotsOnTargetHome ?? 0} - {match.shotsOnTargetAway ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Corners</span>
              <span className="font-medium">{match.cornersHome ?? 0} - {match.cornersAway ?? 0}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
