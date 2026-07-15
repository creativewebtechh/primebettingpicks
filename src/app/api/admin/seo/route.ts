import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await requireAdmin()
    const seoData = await prisma.seodata.findMany({
      orderBy: { page: 'asc' },
    })

    logger.info('Admin fetched SEO data', { count: seoData.length })
    return NextResponse.json({ data: seoData })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    logger.error('Admin SEO list error', { error: String(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await requireAdmin()
    const body = await request.json()
    const { page, title, description, keywords, ogImage, canonical, schema } = body

    if (!page || !title || !description) {
      return NextResponse.json(
        { error: 'page, title, and description are required' },
        { status: 400 }
      )
    }

    const seo = await prisma.seodata.upsert({
      where: { page },
      update: {
        title,
        description,
        ...(keywords !== undefined && { keywords }),
        ...(ogImage !== undefined && { ogImage }),
        ...(canonical !== undefined && { canonical }),
        ...(schema !== undefined && { schema }),
      },
      create: {
        page,
        title,
        description,
        keywords: keywords || null,
        ogImage: ogImage || null,
        canonical: canonical || null,
        schema: schema || null,
      },
    })

    logger.info('Admin upserted SEO data', { page, by: session.userId })
    return NextResponse.json({ data: seo })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    logger.error('Admin SEO upsert error', { error: String(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
