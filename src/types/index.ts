export type MatchStatus = 'upcoming' | 'live' | 'finished' | 'postponed' | 'cancelled'

export type PredictionResult = 'pending' | 'correct' | 'incorrect' | 'void'

export type UserRole = 'user' | 'editor' | 'moderator' | 'admin' | 'superadmin'

export type PaymentStatus = 'pending' | 'success' | 'failed' | 'abandoned'

export type FixtureStatus = 'scheduled' | 'live' | 'finished' | 'postponed' | 'cancelled'

export type NotificationType = 'info' | 'prediction' | 'payment' | 'subscription' | 'system'

export type AuditAction = 'create' | 'update' | 'delete' | 'login' | 'logout' | 'export' | 'publish'

export type ScheduledPublishStatus = 'pending' | 'published' | 'cancelled'

export interface League {
  id: string
  name: string
  slug: string
  logo: string | null
  country: string
  tier: number
  sport: string
  season: string
  featured: boolean
  active: boolean
  createdAt: Date
  updatedAt: Date
  matches?: Match[]
  teams?: Team[]
  fixtures?: Fixture[]
  topScorers?: TopScorer[]
  standings?: Standing[]
}

export interface Team {
  id: string
  name: string
  slug: string
  shortName: string
  logo: string | null
  country: string | null
  stadium: string | null
  foundedYear: number | null
  leagueId: string
  league?: League
  homeMatches?: Match[]
  awayMatches?: Match[]
  standings?: Standing[]
  topScorers?: TopScorer[]
  createdAt: Date
  updatedAt: Date
}

export interface Match {
  id: string
  externalId: string | null
  leagueId: string
  league?: League
  homeTeamId: string
  homeTeam?: Team
  awayTeamId: string
  awayTeam?: Team
  status: MatchStatus
  date: Date
  venue: string | null
  round: string | null
  homeScore: number | null
  awayScore: number | null
  homeHalfScore: number | null
  awayHalfScore: number | null
  homeRedCards: number | null
  awayRedCards: number | null
  homeYellowCards: number | null
  awayYellowCards: number | null
  possessionHome: number | null
  possessionAway: number | null
  shotsHome: number | null
  shotsAway: number | null
  shotsOnTargetHome: number | null
  shotsOnTargetAway: number | null
  cornersHome: number | null
  cornersAway: number | null
  foulsHome: number | null
  foulsAway: number | null
  injuries: string | null
  liveMinute: number | null
  homeForm: string | null
  awayForm: string | null
  prediction?: Prediction
  liveScore?: LiveScore
  createdAt: Date
  updatedAt: Date
}

export interface Prediction {
  id: string
  matchId: string
  match?: Match
  expertId: string | null
  expert?: Expert
  predictedHomeScore: number
  predictedAwayScore: number
  homeWinProbability: number
  awayWinProbability: number
  drawProbability: number
  tip: string
  analysis: string | null
  bettingTips: string | null
  result: PredictionResult
  published: boolean
  featured: boolean
  price: number | null
  premium: boolean
  notes: string | null
  createdAt: Date
  updatedAt: Date
}

export interface Expert {
  id: string
  name: string
  slug: string
  avatar: string | null
  bio: string | null
  specialties: string | null
  winRate: number
  totalPredictions: number
  verified: boolean
  createdAt: Date
  updatedAt: Date
  predictions?: Prediction[]
}

export interface Bookmaker {
  id: string
  name: string
  slug: string
  logo: string | null
  website: string | null
  rating: number
  bonus: string | null
  features: string | null
  active: boolean
  featured: boolean
  createdAt: Date
  updatedAt: Date
}

export interface NewsArticle {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  author: string
  image: string | null
  category: string
  tags: string | null
  published: boolean
  featured: boolean
  leagueId: string | null
  league?: League | null
  metaTitle: string | null
  metaDescription: string | null
  ogImage: string | null
  createdAt: Date
  updatedAt: Date
}

export interface User {
  id: string
  name: string | null
  email: string
  role: UserRole
  avatar: string | null
  emailVerified: boolean
  favorites: string | null
  stripeCustomerId: string | null
  paystackCustomerId: string | null
  createdAt: Date
  updatedAt: Date
}

export interface SEOData {
  id: string
  page: string
  title: string
  description: string
  keywords: string | null
  ogImage: string | null
  canonical: string | null
  schema: string | null
  updatedAt: Date
}

export interface Advertisement {
  id: string
  name: string
  position: string
  code: string
  active: boolean
  startDate: Date | null
  endDate: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface AnalyticsEvent {
  id: string
  event: string
  page: string
  metadata: string | null
  ip: string | null
  createdAt: Date
}

export interface Payment {
  id: string
  userId: string
  predictionId: string
  amount: number
  currency: string
  reference: string
  paystackRef: string | null
  status: PaymentStatus
  metadata: string | null
  createdAt: Date
  updatedAt: Date
}

export interface Subscription {
  id: string
  userId: string
  plan: string
  paystackCode: string | null
  status: string
  currentPeriodStart: Date | null
  currentPeriodEnd: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface ContactMessage {
  id: string
  name: string
  email: string
  subject: string
  message: string
  read: boolean
  createdAt: Date
}

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  read: boolean
  data: string | null
  createdAt: Date
}

export interface AuditLog {
  id: string
  userId: string
  action: AuditAction
  entity: string
  entityId: string
  oldData: string | null
  newData: string | null
  ip: string | null
  createdAt: Date
}

export interface Fixture {
  id: string
  externalId: string
  leagueId: string
  league?: League
  homeTeamId: string
  homeTeam?: Team
  awayTeamId: string
  awayTeam?: Team
  date: Date
  status: FixtureStatus
  venue: string | null
  referee: string | null
  round: string | null
  season: string | null
  homeScore: number | null
  awayScore: number | null
  homeHalfScore: number | null
  awayHalfScore: number | null
  odds: string | null
  lastSyncedAt: Date
  syncedByUserId: string | null
  createdAt: Date
  updatedAt: Date
}

export interface LiveScore {
  id: string
  matchId: string
  match?: Match
  minute: number | null
  status: string
  homeScore: number | null
  awayScore: number | null
  events: string | null
  stats: string | null
  lastUpdated: Date
}

export interface TopScorer {
  id: string
  leagueId: string
  league?: League
  teamId: string
  team?: Team
  playerName: string
  goals: number
  assists: number
  season: string
  createdAt: Date
  updatedAt: Date
}

export interface Standing {
  id: string
  leagueId: string
  league?: League
  teamId: string
  team?: Team
  position: number
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
  points: number
  form: string | null
  season: string
  createdAt: Date
  updatedAt: Date
}

export interface ScheduledPublish {
  id: string
  entityType: string
  entityId: string
  publishAt: Date
  status: ScheduledPublishStatus
  createdAt: Date
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedParams {
  page?: number
  limit?: number
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface DashboardStats {
  totalUsers: number
  totalPredictions: number
  totalMatches: number
  totalRevenue: number
  activeSubscriptions: number
  recentPayments: Payment[]
  userGrowth: ChartData[]
  predictionAccuracy: ChartData[]
}

export interface ChartData {
  label: string
  value: number
}

export interface MatchFormData {
  homeTeam: string
  awayTeam: string
  homeScore?: string
  awayScore?: string
}

export interface TeamFormData {
  name: string
  shortName: string
  country: string
}
