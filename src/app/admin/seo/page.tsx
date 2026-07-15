'use client'

import { useState, useEffect } from 'react'
import {
  Search,
  FileText,
  Calendar,
  ChevronDown,
  ChevronUp,
  Hash,
  ExternalLink,
  AlertCircle,
  Pencil,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/admin/toast'

interface SEOData {
  id: string
  page: string
  title: string
  description: string
  keywords: string | null
  ogImage: string | null
  canonical: string | null
  schema: string | null
  updatedAt: string
}

interface SEOForm {
  page: string
  title: string
  description: string
  keywords: string
  ogImage: string
  canonical: string
  schema: string
}

const emptySeoForm: SEOForm = {
  page: '',
  title: '',
  description: '',
  keywords: '',
  ogImage: '',
  canonical: '',
  schema: '',
}

export default function AdminSEOPage() {
  const { toast } = useToast()
  const [entries, setEntries] = useState<SEOData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<SEOData | null>(null)
  const [form, setForm] = useState<SEOForm>(emptySeoForm)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch('/api/admin/seo')
        if (!res.ok) throw new Error('Failed to fetch')
        const json = await res.json()
        setEntries(json.data)
      } catch {
        setError('Failed to load SEO data')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const filtered = entries.filter(
    (e) =>
      e.page.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  function keywordCount(keywords: string | null) {
    if (!keywords) return 0
    return keywords
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean).length
  }

  function openEdit(entry: SEOData) {
    setEditingEntry(entry)
    setForm({
      page: entry.page,
      title: entry.title,
      description: entry.description,
      keywords: entry.keywords || '',
      ogImage: entry.ogImage || '',
      canonical: entry.canonical || '',
      schema: entry.schema || '',
    })
    setModalOpen(true)
  }

  async function handleSubmit() {
    if (!form.title || !form.description) {
      toast('error', 'Title and Description are required')
      return
    }
    if (form.schema) {
      try {
        JSON.parse(form.schema)
      } catch {
        toast('error', 'Structured Data must be valid JSON')
        return
      }
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/seo', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page: form.page,
          title: form.title,
          description: form.description,
          keywords: form.keywords || null,
          ogImage: form.ogImage || null,
          canonical: form.canonical || null,
          schema: form.schema || null,
        }),
      })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error || 'Failed')
      }
      toast('success', 'SEO settings updated')
      setModalOpen(false)
      const listRes = await fetch('/api/admin/seo')
      if (listRes.ok) {
        const json = await listRes.json()
        setEntries(json.data)
      }
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Failed to update SEO')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">SEO Settings</h1>
          <p className="text-text-secondary mt-1">
            Manage search engine optimization for each page
          </p>
        </div>
      </div>

      <div className="mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search pages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-surface text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {loading && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            <span className="ml-3 text-text-secondary">Loading SEO data...</span>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <AlertCircle className="w-5 h-5 text-error mr-2" />
            <span className="text-error">{error}</span>
          </CardContent>
        </Card>
      )}

      {!loading && !error && filtered.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="w-10 h-10 text-text-muted mx-auto mb-3" />
            <p className="text-text-secondary">
              {searchQuery ? 'No matching pages found' : 'No SEO entries yet'}
            </p>
          </CardContent>
        </Card>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((entry) => {
            const expanded = expandedId === entry.id
            const kCount = keywordCount(entry.keywords)

            return (
              <Card key={entry.id}>
                <button
                  onClick={() => setExpandedId(expanded ? null : entry.id)}
                  className="w-full text-left"
                >
                  <CardContent className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="w-4 h-4 text-primary-500 shrink-0" />
                        <span className="font-mono text-sm font-medium text-primary-500 truncate">
                          {entry.page}
                        </span>
                      </div>
                      <p className="text-sm text-text-primary truncate">{entry.title}</p>
                      <p className="text-xs text-text-muted truncate mt-0.5">
                        {entry.description}
                      </p>
                    </div>
                    <div className="hidden sm:flex items-center gap-4 text-xs text-text-muted shrink-0">
                      <div className="flex items-center gap-1">
                        <Hash className="w-3 h-3" />
                        <span>{kCount} keywords</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(entry.updatedAt)}</span>
                      </div>
                    </div>
                    {expanded ? (
                      <ChevronUp className="w-4 h-4 text-text-muted shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-text-muted shrink-0" />
                    )}
                  </CardContent>
                </button>

                {expanded && (
                  <div className="border-t border-border p-4 space-y-3 bg-surface-secondary/50">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-text-muted mb-1">
                          Page Path
                        </label>
                        <p className="text-sm font-mono text-text-primary bg-surface px-3 py-2 rounded-lg border border-border">
                          {entry.page}
                        </p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-text-muted mb-1">
                          Canonical URL
                        </label>
                        <p className="text-sm text-text-primary bg-surface px-3 py-2 rounded-lg border border-border truncate">
                          {entry.canonical || (
                            <span className="text-text-muted italic">Not set</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-text-muted mb-1">
                        Meta Title
                      </label>
                      <p className="text-sm text-text-primary bg-surface px-3 py-2 rounded-lg border border-border">
                        {entry.title}
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-text-muted mb-1">
                        Meta Description
                      </label>
                      <p className="text-sm text-text-primary bg-surface px-3 py-2 rounded-lg border border-border">
                        {entry.description}
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-text-muted mb-1">
                        Keywords
                      </label>
                      <p className="text-sm text-text-primary bg-surface px-3 py-2 rounded-lg border border-border">
                        {entry.keywords || (
                          <span className="text-text-muted italic">Not set</span>
                        )}
                      </p>
                    </div>
                    {entry.ogImage && (
                      <div>
                        <label className="block text-xs font-medium text-text-muted mb-1">
                          OG Image
                        </label>
                        <p className="text-sm text-text-primary bg-surface px-3 py-2 rounded-lg border border-border truncate flex items-center gap-1">
                          <ExternalLink className="w-3 h-3 shrink-0" />
                          {entry.ogImage}
                        </p>
                      </div>
                    )}
                    {entry.schema && (
                      <div>
                        <label className="block text-xs font-medium text-text-muted mb-1">
                          Schema JSON
                        </label>
                        <pre className="text-xs text-text-primary bg-surface px-3 py-2 rounded-lg border border-border overflow-x-auto max-h-40">
                          {(() => {
                            try {
                              return JSON.stringify(JSON.parse(entry.schema), null, 2)
                            } catch {
                              return entry.schema
                            }
                          })()}
                        </pre>
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-medium text-text-muted mb-1">
                        Last Updated
                      </label>
                      <p className="text-sm text-text-secondary">
                        {formatDate(entry.updatedAt)}
                      </p>
                    </div>
                    <div className="pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          openEdit(entry)
                        }}
                      >
                        <Pencil className="w-3.5 h-3.5 mr-1.5" />
                        Edit SEO
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {!loading && !error && entries.length > 0 && (
        <p className="text-xs text-text-muted mt-4">
          Showing {filtered.length} of {entries.length} page
          {entries.length !== 1 ? 's' : ''}
        </p>
      )}

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget && !submitting) setModalOpen(false)
          }}
        >
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-surface rounded-xl border border-border shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-lg font-semibold text-text-primary">
                Edit SEO — {editingEntry?.page}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                disabled={submitting}
                className="p-1.5 rounded-lg hover:bg-surface-tertiary text-text-muted transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Page
                </label>
                <input
                  type="text"
                  value={form.page}
                  readOnly
                  className="w-full h-10 px-3 rounded-lg border border-border bg-surface-secondary text-text-muted text-sm cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Page title"
                  className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Description *
                </label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Meta description"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Keywords
                </label>
                <input
                  type="text"
                  value={form.keywords}
                  onChange={(e) => setForm((prev) => ({ ...prev, keywords: e.target.value }))}
                  placeholder="keyword1, keyword2, keyword3"
                  className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    OG Image URL
                  </label>
                  <input
                    type="text"
                    value={form.ogImage}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, ogImage: e.target.value }))
                    }
                    placeholder="https://..."
                    className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Canonical URL
                  </label>
                  <input
                    type="text"
                    value={form.canonical}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, canonical: e.target.value }))
                    }
                    placeholder="https://..."
                    className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Structured Data (JSON)
                </label>
                <textarea
                  rows={6}
                  value={form.schema}
                  onChange={(e) => setForm((prev) => ({ ...prev, schema: e.target.value }))}
                  placeholder='{"@context": "https://schema.org", ...}'
                  className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-text-primary placeholder:text-text-muted text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
              <Button variant="ghost" onClick={() => setModalOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSubmit} loading={submitting}>
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
