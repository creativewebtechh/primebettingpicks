import { prisma } from './prisma'
import { logger } from './logger'
import { LEAGUE_MAP, ApiFootballProvider } from './football-api-football'
import type { FootballProvider, FixtureResponse } from './football-provider'
import type { match } from '@/generated/prisma/client'

const provider: FootballProvider = new ApiFootballProvider()

function slugToApiLeagueId(leagueSlug: string): number | null {
  return LEAGUE_MAP[leagueSlug] ?? null
}

async function findDbLeagueBySlug(leagueSlug: string) {
  return prisma.league.findUnique({ where: { slug: leagueSlug } })
}

function computeSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

async function ensureDbLeague(league: FixtureResponse['league'], leagueSlug: string) {
  let dbLeague = await prisma.league.findUnique({ where: { slug: leagueSlug } })
  if (!dbLeague) {
    dbLeague = await prisma.league.create({
      data: {
        name: league.name,
        slug: leagueSlug,
        logo: league.logo || null,
        country: league.country,
        tier: 1,
        season: league.season,
        featured: leagueSlug === 'premier-league',
      },
    })
    logger.info('Created league from API', { slug: leagueSlug, name: league.name })
  } else {
    dbLeague = await prisma.league.update({
      where: { id: dbLeague.id },
      data: {
        name: league.name,
        logo: league.logo || dbLeague.logo,
        country: league.country || dbLeague.country,
      },
    })
  }
  return dbLeague
}

async function ensureDbTeam(
  team: { id: number; name: string; logo: string },
  leagueId: string,
) {
  const slug = computeSlug(team.name)
  let dbTeam = await prisma.team.findUnique({ where: { slug } })
  if (!dbTeam) {
    dbTeam = await prisma.team.create({
      data: {
        name: team.name,
        slug,
        shortName: team.name.slice(0, 3).toUpperCase(),
        logo: team.logo || null,
        leagueId,
      },
    })
    logger.info('Created team from API', { slug, name: team.name })
  }
  return dbTeam
}

export class FootballService {
  async syncFixtures(startDate: string): Promise<{ synced: number; errors: number }> {
    let synced = 0
    let errors = 0

    for (const [slug, leagueId] of Object.entries(LEAGUE_MAP)) {
      try {
        const fixtures = await provider.getFixtures({ leagueId, date: startDate })

        if (fixtures.length === 0) continue

        const apiLeague = fixtures[0].league
        const league = await ensureDbLeague(apiLeague, slug)

        for (const fixture of fixtures) {
          try {
            const dbHome = await ensureDbTeam(fixture.homeTeam, league.id)
            const dbAway = await ensureDbTeam(fixture.awayTeam, league.id)

            const existingMatch = await prisma.match.findFirst({
              where: { externalId: String(fixture.externalId) },
            })

            if (existingMatch) {
              await prisma.match.update({
                where: { id: existingMatch.id },
                data: {
                  status: fixture.status,
                  homeScore: fixture.homeScore,
                  awayScore: fixture.awayScore,
                  homeHalfScore: fixture.homeHalfScore,
                  awayHalfScore: fixture.awayHalfScore,
                  venue: fixture.venue,
                  round: fixture.round,
                },
              })
            } else {
              await prisma.match.create({
                data: {
                  externalId: String(fixture.externalId),
                  leagueId: league.id,
                  homeTeamId: dbHome.id,
                  awayTeamId: dbAway.id,
                  status: fixture.status,
                  date: new Date(fixture.date),
                  venue: fixture.venue,
                  round: fixture.round,
                  homeScore: fixture.homeScore,
                  awayScore: fixture.awayScore,
                  homeHalfScore: fixture.homeHalfScore,
                  awayHalfScore: fixture.awayHalfScore,
                },
              })
            }
            synced++
          } catch (err) {
            errors++
            logger.error('Failed to sync fixture', { externalId: fixture.externalId, error: String(err) })
          }
        }
      } catch (err) {
        errors++
        logger.error('Failed to fetch fixtures for league', { slug, error: String(err) })
      }
    }

    return { synced, errors }
  }

  async syncLiveScores(): Promise<{ updated: number }> {
    let updated = 0

    const liveScores = await provider.getLiveScores()

    for (const live of liveScores) {
      try {
        const dbLeague = await findDbLeagueBySlug(
          Object.entries(LEAGUE_MAP).find(([, id]) => id === live.league.id)?.[0] || '',
        )
        if (!dbLeague) continue

        const dbMatch = await prisma.match.findFirst({
          where: { externalId: String(live.externalId) },
        })
        if (!dbMatch) continue

        await prisma.match.update({
          where: { id: dbMatch.id },
          data: {
            status: live.status,
            homeScore: live.homeScore,
            awayScore: live.awayScore,
            homeHalfScore: live.homeHalfScore,
            awayHalfScore: live.awayHalfScore,
            liveMinute: live.minute,
            possessionHome: live.stats.possession.home,
            possessionAway: live.stats.possession.away,
            shotsHome: live.stats.shots.home,
            shotsAway: live.stats.shots.away,
            shotsOnTargetHome: live.stats.shotsOnTarget.home,
            shotsOnTargetAway: live.stats.shotsOnTarget.away,
            cornersHome: live.stats.corners.home,
            cornersAway: live.stats.corners.away,
            foulsHome: live.stats.fouls.home,
            foulsAway: live.stats.fouls.away,
            homeYellowCards: live.stats.yellowCards.home,
            awayYellowCards: live.stats.yellowCards.away,
            homeRedCards: live.stats.redCards.home,
            awayRedCards: live.stats.redCards.away,
          },
        })

        const existingLive = await prisma.livescore.findFirst({
          where: { matchId: dbMatch.id },
        })

        const livescoreData = {
          minute: live.minute,
          status: live.status,
          homeScore: live.homeScore,
          awayScore: live.awayScore,
          events: JSON.stringify(live.events || []),
          stats: JSON.stringify(live.stats || {}),
        }

        if (existingLive) {
          await prisma.livescore.update({
            where: { id: existingLive.id },
            data: livescoreData,
          })
        } else {
          await prisma.livescore.create({
            data: {
              matchId: dbMatch.id,
              ...livescoreData,
            },
          })
        }

        updated++
      } catch (err) {
        logger.error('Failed to update live score', { externalId: live.externalId, error: String(err) })
      }
    }

    return { updated }
  }

  async syncStandings(leagueSlug: string): Promise<{ synced: number }> {
    const apiLeagueId = slugToApiLeagueId(leagueSlug)
    if (!apiLeagueId) throw new Error(`Unknown league slug: ${leagueSlug}`)

    const dbLeague = await findDbLeagueBySlug(leagueSlug)
    if (!dbLeague) throw new Error(`League not found in database: ${leagueSlug}`)

    const standings = await provider.getLeagueStandings(apiLeagueId)
    const currentSeason = new Date().getFullYear().toString()

    for (const standing of standings) {
      try {
        const dbTeam = await ensureDbTeam(standing.team, dbLeague.id)

        await prisma.team.update({
          where: { id: dbTeam.id },
          data: {
            logo: standing.team.logo || undefined,
          },
        })

        const existingStanding = await prisma.standing.findFirst({
          where: {
            leagueId: dbLeague.id,
            teamId: dbTeam.id,
            season: currentSeason,
          },
        })

        if (existingStanding) {
          await prisma.standing.update({
            where: { id: existingStanding.id },
            data: {
              position: standing.position,
              played: standing.played,
              won: standing.won,
              drawn: standing.drawn,
              lost: standing.lost,
              goalsFor: standing.goalsFor,
              goalsAgainst: standing.goalsAgainst,
              goalDifference: standing.goalDifference,
              points: standing.points,
              form: standing.form || null,
            },
          })
        } else {
          await prisma.standing.create({
            data: {
              leagueId: dbLeague.id,
              teamId: dbTeam.id,
              position: standing.position,
              played: standing.played,
              won: standing.won,
              drawn: standing.drawn,
              lost: standing.lost,
              goalsFor: standing.goalsFor,
              goalsAgainst: standing.goalsAgainst,
              goalDifference: standing.goalDifference,
              points: standing.points,
              form: standing.form || null,
              season: currentSeason,
            },
          })
        }
      } catch (err) {
        logger.error('Failed to sync standing', { team: standing.team.name, error: String(err) })
      }
    }

    return { synced: standings.length }
  }

  async syncTeams(leagueSlug: string): Promise<{ synced: number; created: number; updated: number }> {
    const apiLeagueId = slugToApiLeagueId(leagueSlug)
    if (!apiLeagueId) throw new Error(`Unknown league slug: ${leagueSlug}`)

    const dbLeague = await findDbLeagueBySlug(leagueSlug)
    if (!dbLeague) throw new Error(`League not found in database: ${leagueSlug}`)

    const teams = await provider.getTeams(apiLeagueId)
    let created = 0
    let updated = 0

    for (const team of teams) {
      try {
        const slug = computeSlug(team.name)
        const existing = await prisma.team.findUnique({ where: { slug } })

        if (existing) {
          await prisma.team.update({
            where: { id: existing.id },
            data: {
              logo: team.logo || existing.logo,
              shortName: team.shortName || existing.shortName,
              stadium: team.stadium || existing.stadium,
              country: team.country || existing.country,
            },
          })
          updated++
        } else {
          await prisma.team.create({
            data: {
              name: team.name,
              slug,
              shortName: team.shortName,
              logo: team.logo || null,
              country: team.country,
              stadium: team.stadium,
              leagueId: dbLeague.id,
            },
          })
          created++
        }
      } catch (err) {
        logger.error('Failed to sync team', { team: team.name, error: String(err) })
      }
    }

    return { synced: teams.length, created, updated }
  }

  async syncTopScorers(leagueSlug: string): Promise<{ synced: number }> {
    const apiLeagueId = slugToApiLeagueId(leagueSlug)
    if (!apiLeagueId) throw new Error(`Unknown league slug: ${leagueSlug}`)

    const dbLeague = await findDbLeagueBySlug(leagueSlug)
    if (!dbLeague) throw new Error(`League not found in database: ${leagueSlug}`)

    const scorers = await provider.getTopScorers(apiLeagueId)
    const currentSeason = new Date().getFullYear().toString()
    let synced = 0

    for (const scorer of scorers) {
      try {
        const teamSlug = computeSlug(scorer.team)
        let dbTeam = await prisma.team.findUnique({ where: { slug: teamSlug } })
        if (!dbTeam) {
          dbTeam = await prisma.team.create({
            data: {
              name: scorer.team,
              slug: teamSlug,
              shortName: scorer.team.slice(0, 3).toUpperCase(),
              leagueId: dbLeague.id,
            },
          })
        }

        const existingScorer = await prisma.topscorer.findFirst({
          where: {
            leagueId: dbLeague.id,
            playerName: scorer.playerName,
            season: currentSeason,
          },
        })

        if (existingScorer) {
          await prisma.topscorer.update({
            where: { id: existingScorer.id },
            data: {
              teamId: dbTeam.id,
              goals: scorer.goals,
              assists: scorer.assists,
            },
          })
        } else {
          await prisma.topscorer.create({
            data: {
              leagueId: dbLeague.id,
              teamId: dbTeam.id,
              playerName: scorer.playerName,
              goals: scorer.goals,
              assists: scorer.assists,
              season: currentSeason,
            },
          })
        }
        synced++
      } catch (err) {
        logger.error('Failed to sync top scorer', { player: scorer.playerName, error: String(err) })
      }
    }

    return { synced }
  }

  async getTodayFixtures(): Promise<match[]> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    return prisma.match.findMany({
      where: {
        date: { gte: today, lt: tomorrow },
      },
      include: {
        team_match_homeTeamIdToteam: true,
        team_match_awayTeamIdToteam: true,
        league: true,
      },
      orderBy: { date: 'asc' },
    })
  }

  async getLiveMatches(): Promise<match[]> {
    return prisma.match.findMany({
      where: { status: 'live' },
      include: {
        team_match_homeTeamIdToteam: true,
        team_match_awayTeamIdToteam: true,
        league: true,
      },
      orderBy: { date: 'asc' },
    })
  }

  async getFixturesByDate(date: string): Promise<match[]> {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    return prisma.match.findMany({
      where: {
        date: { gte: startOfDay, lte: endOfDay },
      },
      include: {
        team_match_homeTeamIdToteam: true,
        team_match_awayTeamIdToteam: true,
        league: true,
      },
      orderBy: { date: 'asc' },
    })
  }

  async getResults(): Promise<match[]> {
    return prisma.match.findMany({
      where: { status: 'finished' },
      include: {
        team_match_homeTeamIdToteam: true,
        team_match_awayTeamIdToteam: true,
        league: true,
      },
      orderBy: { date: 'desc' },
    })
  }

  async getLeagueStandings(leagueSlug: string) {
    const dbLeague = await findDbLeagueBySlug(leagueSlug)
    if (!dbLeague) throw new Error(`League not found: ${leagueSlug}`)

    return prisma.standing.findMany({
      where: { leagueId: dbLeague.id },
      include: { team: true },
      orderBy: { position: 'asc' },
    })
  }

  async getLeagueTopScorers(leagueSlug: string) {
    const dbLeague = await findDbLeagueBySlug(leagueSlug)
    if (!dbLeague) throw new Error(`League not found: ${leagueSlug}`)

    return prisma.topscorer.findMany({
      where: { leagueId: dbLeague.id },
      include: { team: true },
      orderBy: { goals: 'desc' },
    })
  }

  async getTeamDetails(teamSlug: string) {
    const dbTeam = await prisma.team.findUnique({ where: { slug: teamSlug } })
    if (!dbTeam) throw new Error(`Team not found: ${teamSlug}`)

    const [standings, recentMatches] = await Promise.all([
      prisma.standing.findMany({
        where: { teamId: dbTeam.id },
        include: { league: true },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.match.findMany({
        where: {
          OR: [
            { homeTeamId: dbTeam.id },
            { awayTeamId: dbTeam.id },
          ],
        },
        include: {
          team_match_homeTeamIdToteam: true,
          team_match_awayTeamIdToteam: true,
          league: true,
        },
        orderBy: { date: 'desc' },
        take: 20,
      }),
    ])

    return { team: dbTeam, standings, recentMatches }
  }
}
