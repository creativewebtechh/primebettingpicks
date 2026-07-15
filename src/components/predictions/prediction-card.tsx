'use client'

import Link from 'next/link'
import { Star, TrendingUp, User } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { formatDate } from '@/lib/utils'
import type { Prediction, Match } from '@/types'

interface PredictionCardProps {
  prediction: Prediction & { match?: Match }
  featured?: boolean
}

export function PredictionCard({ prediction, featured = false }: PredictionCardProps) {
  const match = prediction.match
  if (!match) return null

  return (
    <Link href={`/predictions/${match.id}`}>
      <Card hover className={featured ? 'ring-2 ring-primary-500' : ''}>
        <CardContent className="p-4">
          {featured && (
            <div className="flex items-center gap-1 mb-2">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span className="text-xs font-medium text-yellow-600 dark:text-yellow-400">Featured Pick</span>
            </div>
          )}

          <div className="flex items-center justify-between mb-2">
            <Badge variant="outline" size="sm">{match.league?.name}</Badge>
            <span className="text-xs text-text-muted">{formatDate(match.date)}</span>
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-surface-tertiary flex items-center justify-center text-sm font-bold">
                {match.homeTeam?.shortName?.charAt(0) || '?'}
              </div>
              <span className="text-sm font-medium">{match.homeTeam?.name}</span>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold tabular-nums">
                {prediction.predictedHomeScore} - {prediction.predictedAwayScore}
              </div>
              <Badge variant="success" size="sm">{prediction.tip}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{match.awayTeam?.name}</span>
              <div className="w-8 h-8 rounded-full bg-surface-tertiary flex items-center justify-center text-sm font-bold">
                {match.awayTeam?.shortName?.charAt(0) || '?'}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
            <div className="flex items-center gap-2">
              {prediction.expert ? (
                <>
                  <Avatar name={prediction.expert.name} src={prediction.expert.avatar} size="sm" />
                  <div>
                    <p className="text-xs font-medium">{prediction.expert.name}</p>
                    <p className="text-xs text-text-muted">{prediction.expert.winRate}% win rate</p>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-surface-tertiary flex items-center justify-center">
                    <User className="w-4 h-4 text-text-muted" />
                  </div>
                  <span className="text-xs text-text-muted">AI Analysis</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-text-muted">
              <TrendingUp className="w-3 h-3" />
              <span>{prediction.homeWinProbability}% confidence</span>
            </div>
          </div>

          {prediction.analysis && (
            <p className="mt-2 text-xs text-text-secondary line-clamp-2">{prediction.analysis}</p>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
