import Link from 'next/link'
import { Clock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate, truncate } from '@/lib/utils'
import type { NewsArticle } from '@/types'

interface NewsCardProps {
  article: NewsArticle
  variant?: 'default' | 'compact'
}

export function NewsCard({ article, variant = 'default' }: NewsCardProps) {
  return (
    <Link href={`/news/${article.slug}`}>
      <Card hover className={variant === 'compact' ? 'h-full' : ''}>
        {article.image && variant !== 'compact' && (
          <div className="aspect-video relative overflow-hidden rounded-t-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={article.image}
              alt={article.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        )}
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="info" size="sm">{article.category}</Badge>
            <span className="flex items-center gap-1 text-xs text-text-muted">
              <Clock className="w-3 h-3" />
              {formatDate(article.createdAt)}
            </span>
          </div>
          <h3 className="font-semibold text-text-primary mb-1 line-clamp-2">
            {article.title}
          </h3>
          <p className="text-sm text-text-secondary line-clamp-2">
            {truncate(article.excerpt, 120)}
          </p>
          <div className="mt-2 text-xs text-text-muted">
            By {article.author}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
