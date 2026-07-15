import type { Metadata } from 'next'
import { ExternalLink } from 'lucide-react'
import { BOOKMAKERS } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Best Bookmakers for Football Betting',
  description: 'Compare top-rated bookmakers for football betting. Find the best odds, bonuses, and welcome offers from trusted betting sites reviewed by experts.',
}

export default function BookmakersPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary">Top Bookmakers</h1>
        <p className="text-text-secondary mt-1">Compare the best betting sites for football predictions</p>
      </div>

      <div className="space-y-4">
        {BOOKMAKERS.map((bookmaker) => (
          <div key={bookmaker.slug} className="bg-surface rounded-xl border border-border p-4 hover:shadow-md transition-all">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-surface-tertiary flex items-center justify-center text-lg font-bold text-primary-600">
                {bookmaker.name.charAt(0)}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-text-primary">{bookmaker.name}</h3>
                <div className="flex items-center gap-1 text-sm">
                  <span className="text-yellow-400">{'★'.repeat(Math.floor(bookmaker.rating))}</span>
                  <span className="text-text-muted">{bookmaker.rating}/5</span>
                </div>
                <p className="text-sm text-primary-600 font-medium mt-1">100% up to $500</p>
              </div>
              <a
                href={bookmaker.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
              >
                Visit
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
