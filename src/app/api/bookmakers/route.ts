import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const bookmakers = await prisma.bookmaker.findMany({
      where: { active: true },
      orderBy: { rating: 'desc' },
    })
    return NextResponse.json({ data: bookmakers })
  } catch (error) {
    console.error('Bookmakers error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
