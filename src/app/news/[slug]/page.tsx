import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Clock, User } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { Badge } from '@/components/ui/badge'

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await props.params
  const article = await prisma.newsarticle.findUnique({ where: { slug } }).catch(() => null)
  if (!article) return { title: 'Article Not Found' }
  return {
    title: article.metaTitle || article.title,
    description: article.metaDescription || article.excerpt,
    openGraph: {
      title: article.ogImage ? undefined : article.title,
      description: article.excerpt,
      ...(article.ogImage && { images: [article.ogImage] }),
    },
  }
}

export default async function NewsArticlePage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params

  const article = await prisma.newsarticle.findUnique({
    where: { slug },
    include: { league: true },
  }).catch(() => null)

  if (!article) notFound()

  if (!article) notFound()

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link href="/news" className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to News
      </Link>

      <article>
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="info">{article.category}</Badge>
            {article.league && (
              <Badge variant="outline">{article.league.name}</Badge>
            )}
            <span className="flex items-center gap-1 text-xs text-text-muted">
              <Clock className="w-3 h-3" />
              {new Date(article.createdAt).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
            {article.title}
          </h1>
          <div className="flex items-center gap-3 text-sm text-text-muted">
            <span className="flex items-center gap-1">
              <User className="w-4 h-4" />
              {article.author}
            </span>
          </div>
        </div>

        {article.image ? (
          <div className="aspect-video rounded-xl overflow-hidden mb-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={article.image} alt={article.title} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="aspect-video bg-surface-tertiary rounded-xl mb-8 flex items-center justify-center">
            <span className="text-6xl">⚽</span>
          </div>
        )}

        {article.excerpt && (
          <p className="text-lg leading-relaxed text-text-secondary mb-6">{article.excerpt}</p>
        )}

        <div className="prose prose-lg max-w-none text-text-secondary" dangerouslySetInnerHTML={{ __html: article.content }} />
      </article>
    </div>
  )
}
