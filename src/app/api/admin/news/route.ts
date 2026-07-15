import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    await requireAdmin()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const published = searchParams.get('published')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (category) where.category = category
    if (published !== null && published !== undefined && published !== '') {
      where.published = published === 'true'
    }
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { excerpt: { contains: search } },
        { author: { contains: search } },
      ]
    }

    const [articles, total] = await Promise.all([
      prisma.newsarticle.findMany({
        where,
        include: {
          league: { select: { id: true, name: true, slug: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.newsarticle.count({ where }),
    ])

    logger.info('Admin listed articles', { total, page })
    return NextResponse.json({
      data: articles,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    logger.error('Admin news list error', { error: String(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin()
    const body = await request.json()
    const {
      title, slug, excerpt, content, author, image,
      category, tags, leagueId, published, featured,
      metaTitle, metaDescription, ogImage,
    } = body

    if (!title || !slug || !content || !category) {
      return NextResponse.json(
        { error: 'title, slug, content, and category are required' },
        { status: 400 }
      )
    }

    const existing = await prisma.newsarticle.findUnique({ where: { slug } })
    if (existing) {
      return NextResponse.json({ error: 'Article slug already exists' }, { status: 409 })
    }

    const article = await prisma.newsarticle.create({
      data: {
        title,
        slug,
        excerpt: excerpt || '',
        content,
        author: author || 'Admin',
        image: image || null,
        category,
        tags: tags || null,
        leagueId: leagueId || null,
        published: published ?? false,
        featured: featured ?? false,
        metaTitle: metaTitle || null,
        metaDescription: metaDescription || null,
        ogImage: ogImage || null,
      },
      include: {
        league: { select: { id: true, name: true, slug: true } },
      },
    })

    logger.info('Admin created article', { articleId: article.id, title: article.title, by: session.userId })
    return NextResponse.json({ data: article }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    logger.error('Admin create article error', { error: String(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await requireAdmin()
    const body = await request.json()
    const { id, title, slug, excerpt, content, author, image, category, tags, leagueId, published, featured, metaTitle, metaDescription, ogImage } = body

    if (!id) {
      return NextResponse.json({ error: 'Article ID is required' }, { status: 400 })
    }

    if (slug) {
      const existing = await prisma.newsarticle.findFirst({
        where: { slug, NOT: { id } },
      })
      if (existing) {
        return NextResponse.json({ error: 'Article slug already exists' }, { status: 409 })
      }
    }

    const article = await prisma.newsarticle.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(slug !== undefined && { slug }),
        ...(excerpt !== undefined && { excerpt }),
        ...(content !== undefined && { content }),
        ...(author !== undefined && { author }),
        ...(image !== undefined && { image }),
        ...(category !== undefined && { category }),
        ...(tags !== undefined && { tags }),
        ...(leagueId !== undefined && { leagueId }),
        ...(published !== undefined && { published }),
        ...(featured !== undefined && { featured }),
        ...(metaTitle !== undefined && { metaTitle }),
        ...(metaDescription !== undefined && { metaDescription }),
        ...(ogImage !== undefined && { ogImage }),
      },
      include: {
        league: { select: { id: true, name: true, slug: true } },
      },
    })

    logger.info('Admin updated article', { articleId: article.id, by: session.userId })
    return NextResponse.json({ data: article })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    logger.error('Admin update article error', { error: String(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireAdmin()
    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: 'Article ID is required' }, { status: 400 })
    }

    await prisma.newsarticle.delete({ where: { id } })

    logger.info('Admin deleted article', { articleId: id, by: session.userId })
    return NextResponse.json({ data: { success: true } })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    logger.error('Admin delete article error', { error: String(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
