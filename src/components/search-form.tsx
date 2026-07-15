'use client'

import { useState } from 'react'
import { Search, X } from 'lucide-react'

export function SearchForm() {
  const [query, setQuery] = useState('')

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-text-primary mb-2">Search</h1>
      <p className="text-text-secondary mb-6">Search matches, teams, leagues, and news</p>

      <div className="relative mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search..."
          className="w-full h-12 pl-10 pr-10 rounded-xl border border-border bg-surface text-text-primary placeholder:text-text-muted text-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        {query && (
          <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X className="w-5 h-5 text-text-muted" />
          </button>
        )}
      </div>

      {query && (
        <div className="text-center py-12 text-text-muted">
          <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Search results for &ldquo;{query}&rdquo;</p>
          <p className="text-sm mt-1">No results found. Try a different search term.</p>
        </div>
      )}

      {!query && (
        <div className="text-center py-12 text-text-muted">
          <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Enter a search term to find matches, teams, leagues, and news</p>
        </div>
      )}
    </div>
  )
}
