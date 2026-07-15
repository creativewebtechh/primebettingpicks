import { NextResponse } from 'next/server'
import { FootballService } from '@/lib/football-service'

const footballService = new FootballService()

export async function GET() {
  try {
    const matches = await footballService.getLiveMatches()
    return NextResponse.json({ data: matches })
  } catch (error) {
    console.error('Live scores error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
