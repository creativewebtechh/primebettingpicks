import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Star } from 'lucide-react'
import type { Bookmaker } from '@/types'

export function BookmakerCard({ bookmaker }: { bookmaker: Bookmaker }) {
  return (
    <Card hover>
      <CardContent className="p-4 flex items-center gap-4">
        <div className="w-14 h-14 rounded-xl bg-surface-tertiary flex items-center justify-center text-lg font-bold text-primary-600 shrink-0">
          {bookmaker.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-text-primary">{bookmaker.name}</h3>
            {bookmaker.featured && (
              <Badge variant="success" size="sm">Featured</Badge>
            )}
          </div>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-3 h-3 ${i < Math.round(bookmaker.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-text-muted'}`}
                />
              ))}
            </div>
            <span className="text-xs text-text-muted">{bookmaker.rating}/5</span>
          </div>
          {bookmaker.bonus && (
            <p className="text-sm text-primary-600 font-medium">{bookmaker.bonus}</p>
          )}
        </div>
        {bookmaker.website && (
          <a
            href={bookmaker.website}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            Visit
          </a>
        )}
      </CardContent>
    </Card>
  )
}
