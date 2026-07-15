export interface FootballProvider {
  name: string
  getFixtures(params: { leagueId?: number; date?: string; status?: string; page?: number }): Promise<FixtureResponse[]>
  getLiveScores(): Promise<LiveScoreResponse[]>
  getLeagueStandings(leagueId: number): Promise<StandingResponse[]>
  getTeams(leagueId: number): Promise<TeamResponse[]>
  getTopScorers(leagueId: number): Promise<TopScorerResponse[]>
  getMatchDetails(fixtureId: number): Promise<MatchDetailResponse>
}

export interface FixtureResponse {
  externalId: number
  homeTeam: { id: number; name: string; logo: string }
  awayTeam: { id: number; name: string; logo: string }
  league: { id: number; name: string; country: string; logo: string; season: string }
  date: string
  status: string
  venue: string | null
  referee: string | null
  round: string | null
  homeScore: number | null
  awayScore: number | null
  homeHalfScore: number | null
  awayHalfScore: number | null
}

export interface LiveScoreResponse extends FixtureResponse {
  minute: number
  events: MatchEvent[]
  stats: MatchStats
}

export interface MatchEvent {
  type: 'goal' | 'card' | 'substitution' | 'var'
  team: string
  player: string
  assist?: string
  minute: number
  detail?: string
}

export interface MatchStats {
  possession: { home: number; away: number }
  shots: { home: number; away: number }
  shotsOnTarget: { home: number; away: number }
  corners: { home: number; away: number }
  fouls: { home: number; away: number }
  yellowCards: { home: number; away: number }
  redCards: { home: number; away: number }
}

export interface StandingResponse {
  position: number
  team: { id: number; name: string; logo: string }
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
  points: number
  form: string
}

export interface TeamResponse {
  id: number
  name: string
  shortName: string
  logo: string
  country: string
  stadium: string | null
  coach: string | null
}

export interface TopScorerResponse {
  playerName: string
  team: string
  goals: number
  assists: number
}

export interface MatchDetailResponse extends FixtureResponse {
  stats: MatchStats
  events: MatchEvent[]
  lineups: unknown
}
