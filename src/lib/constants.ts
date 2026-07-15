export const SITE_NAME = 'PrimeBettingPicks'
export const SITE_DESCRIPTION = 'Expert football predictions, betting tips, and match analysis. Premium football predictions for the Premier League, Champions League, and more.'
export const SITE_URL = 'https://primebettingpicks.com'
export const SITE_LOGO = '/logo.svg'

export const LEAGUES = [
  { name: 'Premier League', slug: 'premier-league', country: 'England', logo: '/leagues/epl.svg' },
  { name: 'La Liga', slug: 'la-liga', country: 'Spain', logo: '/leagues/laliga.svg' },
  { name: 'Serie A', slug: 'serie-a', country: 'Italy', logo: '/leagues/serie-a.svg' },
  { name: 'Bundesliga', slug: 'bundesliga', country: 'Germany', logo: '/leagues/bundesliga.svg' },
  { name: 'Ligue 1', slug: 'ligue-1', country: 'France', logo: '/leagues/ligue-1.svg' },
  { name: 'Champions League', slug: 'champions-league', country: 'Europe', logo: '/leagues/ucl.svg' },
  { name: 'Europa League', slug: 'europa-league', country: 'Europe', logo: '/leagues/uel.svg' },
  { name: 'World Cup', slug: 'world-cup', country: 'International', logo: '/leagues/world-cup.svg' },
]

export const BOOKMAKERS = [
  { name: 'Bet365', slug: 'bet365', rating: 4.8, website: 'https://www.bet365.com' },
  { name: 'Bet9ja', slug: 'bet9ja', rating: 4.7, website: 'https://www.bet9ja.com' },
  { name: 'SportyBet', slug: 'sportybet', rating: 4.6, website: 'https://www.sportybet.com' },
]

export const PREDICTION_CATEGORIES = [
  'Match Winner',
  'Over/Under',
  'Both Teams to Score',
  'Correct Score',
  'Double Chance',
  'Asian Handicap',
  'Half-Time Result',
  'First Goal Scorer',
]

export const MATCH_STATUS_LABELS: Record<string, string> = {
  upcoming: 'Upcoming',
  live: 'Live',
  finished: 'Finished',
  postponed: 'Postponed',
  cancelled: 'Cancelled',
}

export const POSITIONS = {
  header_top: 'Header Top',
  header_bottom: 'Header Bottom',
  sidebar_top: 'Sidebar Top',
  sidebar_bottom: 'Sidebar Bottom',
  content_top: 'Content Top',
  content_middle: 'Content Middle',
  content_bottom: 'Content Bottom',
  footer_top: 'Footer Top',
  footer_bottom: 'Footer Bottom',
}
