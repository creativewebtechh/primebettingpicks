'use client'

import Link from 'next/link'
import { useMediaQuery } from '@/hooks/use-media-query'
import { LEAGUES } from '@/lib/constants'

export function LeagueNav() {
  const isMobile = useMediaQuery('(max-width: 768px)')

  return (
    <div className="relative">
      <div className="flex gap-2 overflow-x-auto scrollbar-hide py-2">
        {LEAGUES.map((league) => (
          <Link
            key={league.slug}
            href={`/leagues/${league.slug}`}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-secondary hover:bg-surface-tertiary border border-border text-sm font-medium text-text-secondary hover:text-text-primary whitespace-nowrap transition-colors"
          >
            <div className="w-5 h-5 rounded-full bg-surface-tertiary flex items-center justify-center text-xs font-bold text-primary-600">
              {league.name.charAt(0)}
            </div>
            <span>{isMobile ? league.name.substring(0, 8) : league.name}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
