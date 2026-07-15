import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    await requireAdmin()
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
    const search = searchParams.get('search') || ''
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { slug: { contains: search } },
      ]
    }

    const [data, total] = await Promise.all([
      prisma.bookmaker.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.bookmaker.count({ where }),
    ])

    logger.info('Admin listed bookmakers', { total, page })
    return NextResponse.json({ data, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    logger.error('Admin bookmakers list error', { error: String(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
    const body = await request.json()
    const { name, slug, rating, website, logo, bonus, features, active, featured } = body

    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 })
    }

    const existing = await prisma.bookmaker.findUnique({ where: { slug } })
    if (existing) {
      return NextResponse.json({ error: 'Slug already in use' }, { status: 409 })
    }

    const bookmaker = await prisma.bookmaker.create({
      data: {
        name,
        slug,
        rating: rating ?? 0,
        website: website || null,
        logo: logo || null,
        bonus: bonus || null,
        features: features || null,
        active: active ?? true,
        featured: featured ?? false,
      },
    })

    logger.info('Admin created bookmaker', { bookmakerId: bookmaker.id, name })
    return NextResponse.json({ data: bookmaker }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    logger.error('Admin create bookmaker error', { error: String(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireAdmin()
    const body = await request.json()
    const { id, name, slug, rating, website, logo, bonus, features, active, featured } = body

    if (!id) {
      return NextResponse.json({ error: 'Bookmaker ID is required' }, { status: 400 })
    }

    if (slug) {
      const existing = await prisma.bookmaker.findFirst({
        where: { slug, NOT: { id } },
      })
      if (existing) {
        return NextResponse.json({ error: 'Slug already in use' }, { status: 409 })
      }
    }

    const bookmaker = await prisma.bookmaker.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(slug !== undefined && { slug }),
        ...(rating !== undefined && { rating }),
        ...(website !== undefined && { website }),
        ...(logo !== undefined && { logo }),
        ...(bonus !== undefined && { bonus }),
        ...(features !== undefined && { features }),
        ...(active !== undefined && { active }),
        ...(featured !== undefined && { featured }),
      },
    })

    logger.info('Admin updated bookmaker', { bookmakerId: id })
    return NextResponse.json({ data: bookmaker })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    logger.error('Admin update bookmaker error', { error: String(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin()
    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: 'Bookmaker ID is required' }, { status: 400 })
    }

    await prisma.bookmaker.delete({ where: { id } })

    logger.info('Admin deleted bookmaker', { bookmakerId: id })
    return NextResponse.json({ data: { success: true } })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    logger.error('Admin delete bookmaker error', { error: String(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
