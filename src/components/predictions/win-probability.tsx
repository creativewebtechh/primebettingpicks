import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface WinProbabilityProps {
  homeWin: number
  draw: number
  awayWin: number
  homeTeam: string
  awayTeam: string
}

export function WinProbability({ homeWin, draw, awayWin, homeTeam, awayTeam }: WinProbabilityProps) {
  const total = homeWin + draw + awayWin
  const homePct = total > 0 ? Math.round((homeWin / total) * 100) : 0
  const drawPct = total > 0 ? Math.round((draw / total) * 100) : 0
  const awayPct = total > 0 ? Math.round((awayWin / total) * 100) : 0

  return (
    <Card>
      <CardHeader>
        <h3 className="font-semibold text-text-primary">Win Probability</h3>
      </CardHeader>
      <CardContent>
        <div className="relative h-6 rounded-full overflow-hidden bg-surface-tertiary flex">
          <div
            className="bg-primary-600 h-full transition-all duration-500"
            style={{ width: `${homePct}%` }}
          />
          <div
            className="bg-yellow-400 h-full transition-all duration-500"
            style={{ width: `${drawPct}%` }}
          />
          <div
            className="bg-red-500 h-full transition-all duration-500"
            style={{ width: `${awayPct}%` }}
          />
        </div>

        <div className="flex justify-between mt-3">
          <div className="text-center">
            <div className={cn('text-lg font-bold', homePct >= 50 ? 'text-primary-600' : 'text-text-primary')}>
              {homePct}%
            </div>
            <div className="text-xs text-text-muted truncate max-w-20">{homeTeam}</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-yellow-500">{drawPct}%</div>
            <div className="text-xs text-text-muted">Draw</div>
          </div>
          <div className="text-center">
            <div className={cn('text-lg font-bold', awayPct >= 50 ? 'text-red-500' : 'text-text-primary')}>
              {awayPct}%
            </div>
            <div className="text-xs text-text-muted truncate max-w-20">{awayTeam}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
