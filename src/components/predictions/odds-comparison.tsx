import { Card, CardContent, CardHeader } from '@/components/ui/card'

interface OddsData {
  bookmaker: string
  home: number
  draw: number
  away: number
}

export function OddsComparison({ odds }: { odds: OddsData[] }) {
  if (!odds.length) return null

  const bestHome = Math.max(...odds.map(o => o.home))
  const bestDraw = Math.max(...odds.map(o => o.draw))
  const bestAway = Math.max(...odds.map(o => o.away))

  return (
    <Card>
      <CardHeader>
        <h3 className="font-semibold text-text-primary">Odds Comparison</h3>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-3 text-text-muted font-medium">Bookmaker</th>
                <th className="text-center p-3 text-text-muted font-medium">1</th>
                <th className="text-center p-3 text-text-muted font-medium">X</th>
                <th className="text-center p-3 text-text-muted font-medium">2</th>
              </tr>
            </thead>
            <tbody>
              {odds.map((odd, idx) => (
                <tr key={idx} className="border-b border-border last:border-0 hover:bg-surface-tertiary/50">
                  <td className="p-3 font-medium">{odd.bookmaker}</td>
                  <td className={`p-3 text-center font-medium tabular-nums ${odd.home === bestHome ? 'text-success' : ''}`}>
                    {odd.home.toFixed(2)}
                  </td>
                  <td className={`p-3 text-center font-medium tabular-nums ${odd.draw === bestDraw ? 'text-success' : ''}`}>
                    {odd.draw.toFixed(2)}
                  </td>
                  <td className={`p-3 text-center font-medium tabular-nums ${odd.away === bestAway ? 'text-success' : ''}`}>
                    {odd.away.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
