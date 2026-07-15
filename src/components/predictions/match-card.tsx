'use client'

import Link from 'next/link'
import { Clock, AlertCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatTime, cn } from '@/lib/utils'
import type { Match } from '@/types'

interface MatchCardProps {
  match: Match
  variant?: 'default' | 'compact'
  showPrediction?: boolean
}

export function MatchCard({ match, variant = 'default', showPrediction = true }: MatchCardProps) {
  const isLive = match.status === 'live'
  const isFinished = match.status === 'finished'

  return (
    <Link href={`/predictions/${match.id}`}>
      <Card hover className={cn(variant === 'compact' ? 'p-3' : '')}>
        <CardContent className={cn('p-4', variant === 'compact' && '!p-0')}>
          <div className="flex items-center justify-between mb-2">
            <Badge variant={isLive ? 'error' : isFinished ? 'success' : 'outline'} size="sm">
              {isLive ? (
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  {match.liveMinute}&apos;
                </span>
              ) : isFinished ? (
                'FT'
              ) : (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDate(match.date)}
                </span>
              )}
            </Badge>
            {match.round && (
              <span className="text-xs text-text-muted">{match.round}</span>
            )}
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="w-6 h-6 rounded-full bg-surface-tertiary flex items-center justify-center text-xs font-bold shrink-0">
                {match.homeTeam?.shortName?.charAt(0) || '?'}
              </div>
              <span className="text-sm font-medium text-text-primary truncate">
                {match.homeTeam?.name || 'TBD'}
              </span>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {isLive || isFinished ? (
                <span className="text-lg font-bold tabular-nums">
                  <span className={match.homeScore != null && match.awayScore != null && match.homeScore > match.awayScore ? 'text-primary-600' : 'text-text-primary'}>
                    {match.homeScore ?? '-'}
                  </span>
                  <span className="text-text-muted mx-1">-</span>
                  <span className={match.homeScore != null && match.awayScore != null && match.awayScore > match.homeScore ? 'text-primary-600' : 'text-text-primary'}>
                    {match.awayScore ?? '-'}
                  </span>
                </span>
              ) : (
                <span className="text-sm font-medium text-text-muted whitespace-nowrap">
                  {formatTime(match.date)}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
              <span className="text-sm font-medium text-text-primary truncate">
                {match.awayTeam?.name || 'TBD'}
              </span>
              <div className="w-6 h-6 rounded-full bg-surface-tertiary flex items-center justify-center text-xs font-bold shrink-0">
                {match.awayTeam?.shortName?.charAt(0) || '?'}
              </div>
            </div>
          </div>

          {showPrediction && match.prediction && !isFinished && (
            <div className="mt-2 pt-2 border-t border-border">
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-muted">Prediction:</span>
                <span className="font-medium text-primary-600">{match.prediction.tip}</span>
                <span className="text-text-muted">
                  {match.prediction.homeWinProbability}% vs {match.prediction.awayWinProbability}%
                </span>
              </div>
            </div>
          )}

          {match.injuries && (
            <div className="mt-2 flex items-center gap-1 text-xs text-warning">
              <AlertCircle className="w-3 h-3" />
              <span className="truncate">{match.injuries}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
