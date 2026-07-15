import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { Prisma } from '@/generated/prisma/client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const league = searchParams.get('league')
    const search = searchParams.get('search')

    const where: Prisma.teamWhereInput = {}
    if (league) where.league = { slug: league }
    if (search) where.name = { contains: search }

    const teams = await prisma.team.findMany({
      where,
      include: { league: true },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ data: teams })
  } catch (error) {
    console.error('Teams error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
