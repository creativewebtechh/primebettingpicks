'use client'

import { Search, Filter, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface FilterOption {
  key: string
  label: string
  type: 'text' | 'select' | 'date'
  options?: { value: string; label: string }[]
  placeholder?: string
}

interface SearchFilterProps {
  searchPlaceholder?: string
  filters?: FilterOption[]
  values: Record<string, string>
  onChange: (values: Record<string, string>) => void
  onSearch?: () => void
}

export function SearchFilter({
  searchPlaceholder = 'Search…',
  filters = [],
  values,
  onChange,
  onSearch,
}: SearchFilterProps) {
  function handleSearchInput(value: string) {
    onChange({ ...values, search: value })
  }

  function handleFilterChange(key: string, value: string) {
    onChange({ ...values, [key]: value })
  }

  function removeFilter(key: string) {
    const next = { ...values }
    delete next[key]
    onChange(next)
  }

  function clearAll() {
    onChange({})
  }

  const activeFilters = Object.entries(values).filter(
    ([k, v]) => k !== 'search' && v !== '' && v != null
  )

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted pointer-events-none" />
          <input
            type="text"
            value={values.search ?? ''}
            onChange={(e) => handleSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearch?.()}
            placeholder={searchPlaceholder}
            className="w-full h-10 pl-9 pr-8 rounded-lg border border-border bg-surface text-text-primary placeholder:text-text-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
          />
          {values.search && (
            <button
              onClick={() => handleSearchInput('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-surface-tertiary text-text-muted transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {filters.map((filter) => {
          if (filter.type === 'select') {
            return (
              <select
                key={filter.key}
                value={values[filter.key] ?? ''}
                onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                className={cn(
                  'h-10 px-3 rounded-lg border bg-surface text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500',
                  values[filter.key] ? 'border-primary-400 text-text-primary' : 'border-border text-text-secondary'
                )}
              >
                <option value="">{filter.label}</option>
                {filter.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            )
          }

          if (filter.type === 'date') {
            return (
              <input
                key={filter.key}
                type="date"
                value={values[filter.key] ?? ''}
                onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                placeholder={filter.placeholder}
                className={cn(
                  'h-10 px-3 rounded-lg border bg-surface text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500',
                  values[filter.key] ? 'border-primary-400 text-text-primary' : 'border-border text-text-secondary'
                )}
              />
            )
          }

          return null
        })}

        {onSearch && (
          <button
            onClick={onSearch}
            className="h-10 px-4 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors inline-flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Search
          </button>
        )}
      </div>

      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-text-muted">Active:</span>
          {activeFilters.map(([key, val]) => {
            const filterDef = filters.find((f) => f.key === key)
            const displayLabel = filterDef?.options?.find((o) => o.value === val)?.label ?? val
            return (
              <span
                key={key}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
              >
                {filterDef?.label ?? key}: {displayLabel}
                <button onClick={() => removeFilter(key)} className="hover:text-primary-900 dark:hover:text-primary-100">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )
          })}
          <button
            onClick={clearAll}
            className="text-xs text-text-muted hover:text-text-primary transition-colors underline"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  )
}
