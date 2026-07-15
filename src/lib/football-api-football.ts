import { MemoryCache } from './cache'
import { logger } from './logger'
import type {
  FootballProvider,
  FixtureResponse,
  LiveScoreResponse,
  StandingResponse,
  TeamResponse,
  TopScorerResponse,
  MatchDetailResponse,
  MatchStats,
  MatchEvent,
} from './football-provider'

const API_FOOTBALL_BASE = 'https://api-football-v1.p.rapidapi.com/v3'
const API_FOOTBALL_KEY = process.env.API_FOOTBALL_KEY || ''
const API_FOOTBALL_HOST = process.env.API_FOOTBALL_HOST || 'api-football-v1.p.rapidapi.com'

const LEAGUE_MAP: Record<string, number> = {
  'premier-league': 39,
  'la-liga': 140,
  'serie-a': 135,
  'bundesliga': 78,
  'ligue-1': 61,
  'champions-league': 2,
  'europa-league': 3,
}

const SEASON = new Date().getFullYear()

const cache = new MemoryCache<unknown>(300000)

function mapStatus(statusShort: string): string {
  const statusMap: Record<string, string> = {
    '1H': 'live',
    '2H': 'live',
    HT: 'live',
    ET: 'live',
    P: 'live',
    LIVE: 'live',
    FT: 'finished',
    AET: 'finished',
    PEN: 'finished',
    PST: 'postponed',
    CANC: 'cancelled',
    NS: 'upcoming',
  }
  return statusMap[statusShort] || 'upcoming'
}

function buildHeaders(): Record<string, string> {
  return {
    'X-RapidAPI-Key': API_FOOTBALL_KEY,
    'X-RapidAPI-Host': API_FOOTBALL_HOST,
  }
}

async function apiFetch<T>(endpoint: string, params?: Record<string, string | number>): Promise<T> {
  const url = new URL(`${API_FOOTBALL_BASE}${endpoint}`)
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, String(value))
    })
  }

  const cacheKey = url.toString()
  const cached = cache.get(cacheKey)
  if (cached !== null) return cached as T

  if (!API_FOOTBALL_KEY) {
    throw new Error('API_FOOTBALL_KEY environment variable is not set')
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: buildHeaders(),
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    logger.error('API-Football request failed', { status: response.status, endpoint, body })
    throw new Error(`API-Football error: ${response.status} ${response.statusText}`)
  }

  const json = await response.json()
  const data = json.response as T

  cache.set(cacheKey, data, 60000)
  return data
}

function mapFixture(raw: Record<string, unknown>): FixtureResponse {
  const fixture = raw.fixture as Record<string, unknown>
  const teams = raw.teams as Record<string, Record<string, unknown>>
  const league = raw.league as Record<string, unknown>
  const goals = raw.goals as Record<string, unknown> | undefined
  const score = raw.score as Record<string, unknown> | undefined

  return {
    externalId: fixture.id as number,
    homeTeam: {
      id: teams.home.id as number,
      name: teams.home.name as string,
      logo: (teams.home.logo as string) || '',
    },
    awayTeam: {
      id: teams.away.id as number,
      name: teams.away.name as string,
      logo: (teams.away.logo as string) || '',
    },
    league: {
      id: league.id as number,
      name: league.name as string,
      country: league.country as string,
      logo: (league.logo as string) || '',
      season: String(league.season || SEASON),
    },
    date: fixture.date as string,
    status: mapStatus((fixture.status as Record<string, unknown>).short as string),
    venue: ((fixture.venue as Record<string, unknown> | undefined)?.name as string) || null,
    referee: (fixture.referee as string) || null,
    round: (league.round as string) || null,
    homeScore: (goals?.home as number) ?? null,
    awayScore: (goals?.away as number) ?? null,
    homeHalfScore: ((score?.halftime as Record<string, unknown> | undefined)?.home as number) ?? null,
    awayHalfScore: ((score?.halftime as Record<string, unknown> | undefined)?.away as number) ?? null,
  }
}

function mapLiveScore(raw: Record<string, unknown>): LiveScoreResponse {
  const fixture = mapFixture(raw)
  const events = raw.events as Record<string, unknown>[] | undefined
  const statistics = raw.statistics as Record<string, unknown>[] | undefined

  const fixtureRaw = raw.fixture as Record<string, unknown>
  const statusRaw = fixtureRaw?.status as Record<string, unknown> | undefined
  const currentMinute = (statusRaw?.elapsed as number) || 0

  const mappedEvents: MatchEvent[] = (events || []).map((e) => {
    const teamObj = e.team as Record<string, unknown> | undefined
    const playerObj = e.player as Record<string, unknown> | undefined
    const timeObj = e.time as Record<string, unknown> | undefined
    return {
      type: mapEventType(e.type as string),
      team: (teamObj?.name as string) || '',
      player: (playerObj?.name as string) || '',
      assist: undefined,
      minute: (timeObj?.elapsed as number) || 0,
      detail: e.detail as string | undefined,
    }
  })

  const mappedStats = mapStats(statistics || [])

  return {
    ...fixture,
    minute: currentMinute,
    events: mappedEvents,
    stats: mappedStats,
  }
}

function mapEventType(type: string): MatchEvent['type'] {
  const typeMap: Record<string, MatchEvent['type']> = {
    Goal: 'goal',
    Card: 'card',
    'subst': 'substitution',
    VAR: 'var',
  }
  return typeMap[type] || 'goal'
}

function mapStats(statistics: Record<string, unknown>[]): MatchStats {
  const find = (name: string): { home: number; away: number } => {
    const matches = statistics.filter(
      (s) => (s.type as string)?.toLowerCase() === name.toLowerCase()
    )
    const homeStat = matches[0]
    const awayStat = matches[1]
    const parseValue = (v: unknown): number => {
      if (typeof v === 'number') return v
      if (typeof v === 'string') {
        const cleaned = v.replace('%', '')
        return parseInt(cleaned, 10) || 0
      }
      return 0
    }
    return {
      home: homeStat ? parseValue(homeStat.value) : 0,
      away: awayStat ? parseValue(awayStat.value) : 0,
    }
  }

  const possession = find('Ball Possession')
  const shots = find('Total Shots')
  const shotsOnTarget = find('Shots on Goal')
  const corners = find('Corner Kicks')
  const fouls = find('Fouls')
  const yellowCards = find('Yellow Cards')
  const redCards = find('Red Cards')

  return { possession, shots, shotsOnTarget, corners, fouls, yellowCards, redCards }
}

function mapStanding(raw: Record<string, unknown>, index: number): StandingResponse {
  const team = raw.team as Record<string, unknown>
  const all = raw.all as Record<string, unknown>
  const goals = raw.goals as Record<string, unknown>

  return {
    position: (raw.rank as number) || index + 1,
    team: {
      id: team.id as number,
      name: team.name as string,
      logo: (team.logo as string) || '',
    },
    played: (all.played as number) || 0,
    won: (all.win as number) || 0,
    drawn: (all.draw as number) || 0,
    lost: (all.lose as number) || 0,
    goalsFor: (goals.for as number) || 0,
    goalsAgainst: (goals.against as number) || 0,
    goalDifference: (goals.goalsDiff as number) || 0,
    points: (all.points as number) || 0,
    form: (raw.form as string) || '',
  }
}

function mapTeam(raw: Record<string, unknown>): TeamResponse {
  const venue = raw.venue as Record<string, unknown> | undefined
  return {
    id: raw.id as number,
    name: raw.name as string,
    shortName: (raw.code as string) || (raw.name as string).slice(0, 3).toUpperCase(),
    logo: (raw.logo as string) || '',
    country: (raw.country as Record<string, unknown>)?.name as string || '',
    stadium: (venue?.name as string) || null,
    coach: null,
  }
}

function mapTopScorer(raw: Record<string, unknown>): TopScorerResponse {
  const player = raw.player as Record<string, unknown>
  const statistics = (raw.statistics as Record<string, unknown>[])[0]
  const team = statistics?.team as Record<string, unknown> | undefined
  const goals = statistics?.goals as Record<string, unknown> | undefined
  const assists = statistics?.assists as Record<string, unknown> | undefined

  return {
    playerName: (player.name as string) || '',
    team: (team?.name as string) || '',
    goals: (goals?.total as number) || 0,
    assists: (assists?.total as number) || 0,
  }
}

export class ApiFootballProvider implements FootballProvider {
  name = 'api-football'

  async getFixtures(params: { leagueId?: number; date?: string; status?: string; page?: number }): Promise<FixtureResponse[]> {
    const queryParams: Record<string, string | number> = {
      season: SEASON,
    }
    if (params.leagueId) queryParams.league = params.leagueId
    if (params.date) queryParams.date = params.date
    if (params.status) queryParams.status = params.status
    if (params.page) queryParams.page = params.page

    const raw = await apiFetch<Record<string, unknown>[]>('/fixtures', queryParams)
    return raw.map(mapFixture)
  }

  async getLiveScores(): Promise<LiveScoreResponse[]> {
    const raw = await apiFetch<Record<string, unknown>[]>('/fixtures', {
      live: 'all',
    })
    return raw.map(mapLiveScore)
  }

  async getLeagueStandings(leagueId: number): Promise<StandingResponse[]> {
    const raw = await apiFetch<{ league: { standings: Record<string, unknown>[][] } }[]>('/standings', {
      league: leagueId,
      season: SEASON,
    })

    if (!raw.length || !raw[0].league?.standings?.length) return []
    return raw[0].league.standings[0].map((standing, i) => mapStanding(standing, i))
  }

  async getTeams(leagueId: number): Promise<TeamResponse[]> {
    const raw = await apiFetch<{ team: Record<string, unknown> }[]>('/teams', {
      league: leagueId,
      season: SEASON,
    })
    return raw.map((r) => mapTeam(r.team))
  }

  async getTopScorers(leagueId: number): Promise<TopScorerResponse[]> {
    const raw = await apiFetch<Record<string, unknown>[]>('/players/topscorers', {
      league: leagueId,
      season: SEASON,
    })
    return raw.map(mapTopScorer)
  }

  async getMatchDetails(fixtureId: number): Promise<MatchDetailResponse> {
    const raw = await apiFetch<Record<string, unknown>[]>('/fixtures', {
      id: fixtureId,
    })

    if (!raw.length) {
      throw new Error(`Fixture ${fixtureId} not found`)
    }

    const fixture = mapFixture(raw[0])
    const live = mapLiveScore(raw[0])

    return {
      ...fixture,
      stats: live.stats,
      events: live.events,
      lineups: (raw[0] as Record<string, unknown>).lineups || null,
    }
  }
}

export { LEAGUE_MAP }
