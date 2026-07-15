import { Card, CardContent, CardHeader } from '@/components/ui/card'

interface H2HRecord {
  homeWins: number
  awayWins: number
  draws: number
  matches: { homeScore: number; awayScore: number; date: string }[]
  homeTeam: string
  awayTeam: string
}

export function HeadToHead({ data }: { data: H2HRecord }) {
  const total = data.homeWins + data.awayWins + data.draws
  const homePct = total > 0 ? (data.homeWins / total) * 100 : 0
  const awayPct = total > 0 ? (data.awayWins / total) * 100 : 0
  const drawPct = total > 0 ? (data.draws / total) * 100 : 0

  return (
    <Card>
      <CardHeader>
        <h3 className="font-semibold text-text-primary">Head to Head</h3>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div className="text-center flex-1">
            <div className="text-2xl font-bold text-primary-600">{data.homeWins}</div>
            <div className="text-xs text-text-muted">{data.homeTeam}</div>
          </div>
          <div className="text-center px-4">
            <div className="text-lg font-bold text-text-muted">{data.draws}</div>
            <div className="text-xs text-text-muted">Draws</div>
          </div>
          <div className="text-center flex-1">
            <div className="text-2xl font-bold text-primary-600">{data.awayWins}</div>
            <div className="text-xs text-text-muted">{data.awayTeam}</div>
          </div>
        </div>

        <div className="flex h-2 rounded-full overflow-hidden mb-4">
          <div className="bg-primary-600" style={{ width: `${homePct}%` }} />
          <div className="bg-yellow-400" style={{ width: `${drawPct}%` }} />
          <div className="bg-red-500" style={{ width: `${awayPct}%` }} />
        </div>

        <div className="space-y-1">
          {data.matches.slice(0, 5).map((m, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs py-1.5 border-b border-border last:border-0">
              <span className="text-text-muted">{m.date}</span>
              <span className="font-medium tabular-nums">
                <span className={m.homeScore > m.awayScore ? 'text-primary-600 font-bold' : ''}>{m.homeScore}</span>
                <span className="text-text-muted mx-1">-</span>
                <span className={m.awayScore > m.homeScore ? 'text-primary-600 font-bold' : ''}>{m.awayScore}</span>
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
