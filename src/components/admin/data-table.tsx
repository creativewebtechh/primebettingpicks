'use client'

import { useState } from 'react'
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

export interface Column<T> {
  key: string
  label: string
  sortable?: boolean
  render?: (item: T) => React.ReactNode
  className?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  total?: number
  page?: number
  totalPages?: number
  onPageChange?: (page: number) => void
  onSort?: (key: string, direction: 'asc' | 'desc') => void
  loading?: boolean
  emptyMessage?: string
  onRowClick?: (item: T) => void
  selectedIds?: string[]
  onSelectAll?: (ids: string[]) => void
  onSelectRow?: (id: string) => void
  actions?: (item: T) => React.ReactNode
}

export function DataTable<T extends { id?: string }>({
  columns,
  data,
  total = 0,
  page = 1,
  totalPages = 1,
  onPageChange,
  onSort,
  loading = false,
  emptyMessage = 'No data found',
  onRowClick,
  selectedIds,
  onSelectAll,
  onSelectRow,
  actions,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const hasCheckbox = !!onSelectAll && !!onSelectRow

  function handleSort(key: string) {
    const newDir = sortKey === key && sortDir === 'asc' ? 'desc' : 'asc'
    setSortKey(key)
    setSortDir(newDir)
    onSort?.(key, newDir)
  }

  function handleSelectAll() {
    if (!onSelectAll) return
    const allIds = data.map((item) => item.id).filter(Boolean) as string[]
    const allSelected = allIds.every((id) => selectedIds?.includes(id))
    onSelectAll(allSelected ? [] : allIds)
  }

  const allSelected = data.length > 0 && data.every((item) => item.id && selectedIds?.includes(item.id))

  function getPageNumbers(): (number | '...')[] {
    const pages: (number | '...')[] = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (page > 3) pages.push('...')
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
        pages.push(i)
      }
      if (page < totalPages - 2) pages.push('...')
      pages.push(totalPages)
    }
    return pages
  }

  return (
    <div className="w-full">
      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-secondary">
              {hasCheckbox && (
                <th className="w-10 px-3 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={handleSelectAll}
                    className="h-4 w-4 rounded border-border text-primary-600 focus:ring-primary-500"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'px-4 py-3 text-left font-medium text-text-secondary',
                    col.sortable && 'cursor-pointer select-none hover:text-text-primary transition-colors',
                    col.className
                  )}
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {col.sortable && sortKey === col.key && (
                      sortDir === 'asc'
                        ? <ChevronUp className="h-3.5 w-3.5" />
                        : <ChevronDown className="h-3.5 w-3.5" />
                    )}
                  </span>
                </th>
              ))}
              {actions && <th className="px-4 py-3 text-right font-medium text-text-secondary">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={`skeleton-${i}`} className="border-b border-border last:border-0">
                  {hasCheckbox && (
                    <td className="px-3 py-3"><Skeleton className="h-4 w-4" /></td>
                  )}
                  {columns.map((col) => (
                    <td key={col.key} className={cn('px-4 py-3', col.className)}>
                      <Skeleton className="h-4 w-3/4" />
                    </td>
                  ))}
                  {actions && (
                    <td className="px-4 py-3 text-right"><Skeleton className="h-4 w-16 ml-auto" /></td>
                  )}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (hasCheckbox ? 1 : 0) + (actions ? 1 : 0)}
                  className="px-4 py-12 text-center text-text-muted"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item, idx) => {
                const isSelected = item.id ? selectedIds?.includes(item.id) : false
                return (
                  <tr
                    key={item.id ?? idx}
                    className={cn(
                      'border-b border-border last:border-0 transition-colors',
                      onRowClick && 'cursor-pointer hover:bg-surface-secondary',
                      isSelected && 'bg-primary-50 dark:bg-primary-950/20'
                    )}
                    onClick={onRowClick ? () => onRowClick(item) : undefined}
                  >
                    {hasCheckbox && (
                      <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={!!item.id && selectedIds?.includes(item.id)}
                          onChange={() => item.id && onSelectRow?.(item.id)}
                          className="h-4 w-4 rounded border-border text-primary-600 focus:ring-primary-500"
                        />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td key={col.key} className={cn('px-4 py-3 text-text-primary', col.className)}>
                        {col.render ? col.render(item) : String((item as Record<string, unknown>)[col.key] ?? '')}
                      </td>
                    ))}
                    {actions && (
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        {actions(item)}
                      </td>
                    )}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border border-t-0 border-border rounded-b-xl bg-surface-secondary">
          <span className="text-sm text-text-muted">
            Showing {(page - 1) * (data.length || 1) + 1}–{Math.min(page * data.length, total)} of {total}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange?.(page - 1)}
              disabled={page <= 1}
              className="p-1.5 rounded-lg hover:bg-surface-tertiary disabled:opacity-40 disabled:pointer-events-none text-text-secondary transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {getPageNumbers().map((p, i) =>
              p === '...' ? (
                <span key={`dots-${i}`} className="px-2 text-text-muted text-sm">…</span>
              ) : (
                <button
                  key={p}
                  onClick={() => onPageChange?.(p)}
                  className={cn(
                    'min-w-[32px] h-8 rounded-lg text-sm font-medium transition-colors',
                    p === page
                      ? 'bg-primary-600 text-white'
                      : 'text-text-secondary hover:bg-surface-tertiary'
                  )}
                >
                  {p}
                </button>
              )
            )}
            <button
              onClick={() => onPageChange?.(page + 1)}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg hover:bg-surface-tertiary disabled:opacity-40 disabled:pointer-events-none text-text-secondary transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
