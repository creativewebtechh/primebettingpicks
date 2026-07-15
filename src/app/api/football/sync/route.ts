import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { FootballService } from '@/lib/football-service'
import { PredictionEngine } from '@/lib/prediction-engine'

export const dynamic = 'force-dynamic'

const footballService = new FootballService()
const predictionEngine = new PredictionEngine()

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()

    const body = await request.json()
    const { action, leagueSlug, date } = body

    switch (action) {
      case 'fixtures': {
        const startDate = date || new Date().toISOString().split('T')[0]
        const result = await footballService.syncFixtures(startDate)
        return NextResponse.json({ data: result })
      }
      case 'live': {
        const result = await footballService.syncLiveScores()
        return NextResponse.json({ data: result })
      }
      case 'standings': {
        if (!leagueSlug) {
          return NextResponse.json({ error: 'leagueSlug is required for standings sync' }, { status: 400 })
        }
        const result = await footballService.syncStandings(leagueSlug)
        return NextResponse.json({ data: result })
      }
      case 'teams': {
        if (!leagueSlug) {
          return NextResponse.json({ error: 'leagueSlug is required for teams sync' }, { status: 400 })
        }
        const result = await footballService.syncTeams(leagueSlug)
        return NextResponse.json({ data: result })
      }
      case 'topscorers': {
        if (!leagueSlug) {
          return NextResponse.json({ error: 'leagueSlug is required for topscorers sync' }, { status: 400 })
        }
        const result = await footballService.syncTopScorers(leagueSlug)
        return NextResponse.json({ data: result })
      }
      case 'predictions': {
        const result = await predictionEngine.generateBulkPredictions(leagueSlug)
        return NextResponse.json({ data: result })
      }
      case 'accuracy': {
        const result = await predictionEngine.recalculateAccuracy()
        return NextResponse.json({ data: result })
      }
      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}. Valid: fixtures, live, standings, teams, topscorers, predictions, accuracy` },
          { status: 400 },
        )
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
