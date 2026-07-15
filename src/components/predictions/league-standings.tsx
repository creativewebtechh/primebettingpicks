import { Card, CardContent, CardHeader } from '@/components/ui/card'

interface StandingRow {
  position: number
  team: string
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  points: number
}

export function LeagueStandings({ standings }: { standings: StandingRow[] }) {
  if (!standings.length) return null

  return (
    <Card>
      <CardHeader>
        <h3 className="font-semibold text-text-primary">League Standings</h3>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-2 w-8">#</th>
                <th className="text-left p-2">Team</th>
                <th className="text-center p-2">P</th>
                <th className="text-center p-2">W</th>
                <th className="text-center p-2">D</th>
                <th className="text-center p-2">L</th>
                <th className="text-center p-2">GD</th>
                <th className="text-center p-2 font-bold">Pts</th>
              </tr>
            </thead>
            <tbody>
              {standings.slice(0, 10).map((row) => (
                <tr
                  key={row.position}
                  className="border-b border-border last:border-0 hover:bg-surface-tertiary/50"
                >
                  <td className={`p-2 text-center font-medium ${row.position <= 4 ? 'text-primary-600' : row.position <= 6 ? 'text-yellow-500' : ''}`}>
                    {row.position}
                  </td>
                  <td className="p-2 font-medium truncate max-w-32">{row.team}</td>
                  <td className="p-2 text-center text-text-muted">{row.played}</td>
                  <td className="p-2 text-center text-text-muted">{row.won}</td>
                  <td className="p-2 text-center text-text-muted">{row.drawn}</td>
                  <td className="p-2 text-center text-text-muted">{row.lost}</td>
                  <td className="p-2 text-center text-text-muted">{row.goalsFor - row.goalsAgainst}</td>
                  <td className="p-2 text-center font-bold">{row.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
