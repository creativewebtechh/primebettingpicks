import { prisma } from './prisma'
import { logger } from './logger'

export interface PredictionSuggestion {
  matchId: string
  homeWinProbability: number
  drawProbability: number
  awayWinProbability: number
  predictedHomeScore: number
  predictedAwayScore: number
  tip: string
  confidence: 'high' | 'medium' | 'low'
  analysis: string
}

function calculateHomeWinProbability(homeForm: number, awayForm: number, homeAdvantage: number): number {
  const base = 0.45
  const formDiff = (homeForm - awayForm) * 0.02
  const advantage = homeAdvantage * 0.05
  return Math.max(0.05, Math.min(0.85, base + formDiff + advantage))
}

function calculateDrawProbability(homeWin: number, awayWin: number): number {
  const raw = 1 - homeWin - awayWin
  return Math.max(0.05, Math.min(0.40, raw))
}

function calculateScores(homeWinProb: number, awayWinProb: number): { home: number; away: number } {
  const homeExpected = 1.2 + homeWinProb * 0.8
  const awayExpected = 0.8 + awayWinProb * 0.6
  return {
    home: Math.round(homeExpected),
    away: Math.round(awayExpected),
  }
}

function determineTip(homeWin: number, draw: number, awayWin: number): string {
  if (homeWin > 0.55) return 'Home Win'
  if (awayWin > 0.55) return 'Away Win'
  if (draw > 0.30) return 'Draw'
  if (homeWin > awayWin) return 'Double Chance: Home/Draw'
  return 'Double Chance: Away/Draw'
}

function determineConfidence(homeWin: number, draw: number, awayWin: number): PredictionSuggestion['confidence'] {
  const maxProb = Math.max(homeWin, draw, awayWin)
  if (maxProb >= 0.60) return 'high'
  if (maxProb >= 0.45) return 'medium'
  return 'low'
}

function buildAnalysis(
  homeTeam: string,
  awayTeam: string,
  tip: string,
  confidence: string,
  homeForm: string,
  awayForm: string,
): string {
  return `${homeTeam} vs ${awayTeam}: ${tip} selected with ${confidence} confidence. ` +
    `${homeTeam} recent form: ${homeForm || 'N/A'}. ` +
    `${awayTeam} recent form: ${awayForm || 'N/A'}.`
}

function parseFormString(form: string | null): number {
  if (!form) return 0.5
  const results = form.split(',').map((f) => f.trim().toUpperCase())
  let points = 0
  for (const r of results) {
    if (r === 'W') points += 1
    else if (r === 'D') points += 0.5
  }
  return points / Math.max(results.length, 1)
}

export class PredictionEngine {
  async generatePrediction(matchId: string): Promise<PredictionSuggestion> {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        team_match_homeTeamIdToteam: true,
        team_match_awayTeamIdToteam: true,
        league: true,
      },
    })

    if (!match) throw new Error(`Match not found: ${matchId}`)

    const homeForm = parseFormString(match.homeForm)
    const awayForm = parseFormString(match.awayForm)

    const homeWinProb = calculateHomeWinProbability(homeForm, awayForm, 1)
    const awayWinProb = Math.max(0.05, 1 - homeWinProb - 0.25)
    const drawProb = calculateDrawProbability(homeWinProb, awayWinProb)

    const total = homeWinProb + drawProb + awayWinProb
    const normalizedHome = homeWinProb / total
    const normalizedDraw = drawProb / total
    const normalizedAway = awayWinProb / total

    const scores = calculateScores(normalizedHome, normalizedAway)
    const tip = determineTip(normalizedHome, normalizedDraw, normalizedAway)
    const confidence = determineConfidence(normalizedHome, normalizedDraw, normalizedAway)
    const analysis = buildAnalysis(
      match.team_match_homeTeamIdToteam.name,
      match.team_match_awayTeamIdToteam.name,
      tip,
      confidence,
      match.homeForm ?? '',
      match.awayForm ?? '',
    )

    return {
      matchId,
      homeWinProbability: Math.round(normalizedHome * 100) / 100,
      drawProbability: Math.round(normalizedDraw * 100) / 100,
      awayWinProbability: Math.round(normalizedAway * 100) / 100,
      predictedHomeScore: scores.home,
      predictedAwayScore: scores.away,
      tip,
      confidence,
      analysis,
    }
  }

  async generateBulkPredictions(leagueSlug?: string): Promise<{ generated: number; skipped: number }> {
    const matchWhere: {
      status: string
      prediction: null
      league?: { slug: string }
    } = {
      status: 'upcoming',
      prediction: null,
    }

    if (leagueSlug) {
      matchWhere.league = { slug: leagueSlug }
    }

    const matches = await prisma.match.findMany({ where: matchWhere, take: 50 })
    let generated = 0
    let skipped = 0

    for (const match of matches) {
      try {
        const suggestion = await this.generatePrediction(match.id)

        await prisma.prediction.create({
          data: {
            matchId: match.id,
            predictedHomeScore: suggestion.predictedHomeScore,
            predictedAwayScore: suggestion.predictedAwayScore,
            homeWinProbability: suggestion.homeWinProbability,
            awayWinProbability: suggestion.awayWinProbability,
            drawProbability: suggestion.drawProbability,
            tip: suggestion.tip,
            analysis: suggestion.analysis,
            published: false,
          },
        })
        generated++
      } catch (err) {
        skipped++
        logger.error('Failed to generate prediction', { matchId: match.id, error: String(err) })
      }
    }

    return { generated, skipped }
  }

  async recalculateAccuracy(): Promise<{ correct: number; incorrect: number; pending: number }> {
    const predictions = await prisma.prediction.findMany({
      where: { result: 'pending' },
      include: { match: true },
    })

    let correct = 0
    let incorrect = 0
    let pending = 0

    for (const prediction of predictions) {
      if (prediction.match.status !== 'finished') {
        pending++
        continue
      }

      if (prediction.match.homeScore === null || prediction.match.awayScore === null) {
        pending++
        continue
      }

      const actualHome = prediction.match.homeScore
      const actualAway = prediction.match.awayScore

      let actualResult: string
      if (actualHome > actualAway) actualResult = 'home'
      else if (actualHome < actualAway) actualResult = 'away'
      else actualResult = 'draw'

      const predictedWinner = prediction.tip.toLowerCase()
      const isCorrect =
        (predictedWinner.includes('home') && actualResult === 'home') ||
        (predictedWinner.includes('away') && actualResult === 'away') ||
        (predictedWinner.includes('draw') && actualResult === 'draw')

      await prisma.prediction.update({
        where: { id: prediction.id },
        data: { result: isCorrect ? 'correct' : 'incorrect' },
      })

      if (isCorrect) correct++
      else incorrect++
    }

    return { correct, incorrect, pending }
  }
}
