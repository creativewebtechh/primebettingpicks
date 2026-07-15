import type { Metadata } from 'next'
import Link from 'next/link'
import { Clock, User } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { Badge } from '@/components/ui/badge'

export const metadata: Metadata = {
  title: 'Football News, Match Previews & Analysis',
  description: 'Stay updated with the latest football news, match previews, transfer updates, expert analysis, and betting insights from PrimeBettingPicks.',
}

export default async function NewsPage() {
  const articles = await prisma.newsarticle.findMany({
    where: { published: true },
    orderBy: { createdAt: 'desc' },
    take: 20,
  }).catch(() => [])

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary">Football News</h1>
        <p className="text-text-secondary mt-1">Latest updates, analysis and betting insights</p>
      </div>

      {articles.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-text-muted text-lg">No articles published yet.</p>
          <p className="text-text-muted text-sm mt-1">Check back soon for the latest news and analysis.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article) => (
            <Link
              key={article.id}
              href={'/news/' + article.slug}
              className="bg-surface rounded-xl border border-border overflow-hidden hover:shadow-md hover:border-primary-200 dark:hover:border-primary-800 transition-all duration-200"
            >
              {article.image ? (
                <div className="aspect-video bg-surface-tertiary overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={article.image}
                    alt={article.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="aspect-video bg-surface-tertiary flex items-center justify-center">
                  <span className="text-4xl">⚽</span>
                </div>
              )}
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="info">{article.category}</Badge>
                  <span className="flex items-center gap-1 text-xs text-text-muted">
                    <Clock className="w-3 h-3" />
                    {new Date(article.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <h3 className="font-semibold text-text-primary mb-1 line-clamp-2">{article.title}</h3>
                {article.excerpt && (
                  <p className="text-sm text-text-secondary line-clamp-2 mt-1">{article.excerpt}</p>
                )}
                <p className="flex items-center gap-1 text-xs text-text-muted mt-2">
                  <User className="w-3 h-3" />
                  {article.author}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
