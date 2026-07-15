import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const leagues = await prisma.league.findMany({
      where: { active: true },
      orderBy: { tier: 'asc' },
    })
    return NextResponse.json({ data: leagues })
  } catch (error) {
    console.error('Leagues error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
