'use client'

import { useState, useEffect } from 'react'
import {
  Star, Plus, Pencil, Trash2, ExternalLink,
} from 'lucide-react'
import { DataTable, Column } from '@/components/admin/data-table'
import { SearchFilter } from '@/components/admin/search-filter'
import { StatsCard } from '@/components/admin/stats-card'
import { ConfirmDialog } from '@/components/admin/confirm-dialog'
import { useToast } from '@/components/admin/toast'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface Bookmaker {
  id: string
  name: string
  slug: string
  logo: string | null
  website: string | null
  rating: number
  bonus: string | null
  features: string | null
  active: boolean
  featured: boolean
  createdAt: string
}

interface ApiResponse {
  data: Bookmaker[]
  total: number
  page: number
  totalPages: number
}

const emptyForm = {
  name: '',
  slug: '',
  rating: 0,
  website: '',
  logo: '',
  bonus: '',
  features: '',
  active: true,
  featured: false,
}

export default function AdminBookmakersPage() {
  const { toast } = useToast()
  const [bookmakers, setBookmakers] = useState<Bookmaker[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [refreshKey, setRefreshKey] = useState(0)

  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Bookmaker | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<Bookmaker | null>(null)
  const [deleting, setDeleting] = useState(false)

  const limit = 20

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        const params = new URLSearchParams()
        params.set('page', String(page))
        params.set('limit', String(limit))
        if (filters.search) params.set('search', filters.search)

        const res = await fetch(`/api/admin/bookmakers?${params}`)
        if (!res.ok) throw new Error('Failed to fetch')
        const json: ApiResponse = await res.json()
        setBookmakers(json.data)
        setTotal(json.total)
        setTotalPages(json.totalPages)
      } catch {
        toast('error', 'Failed to load bookmakers')
      } finally {
        setLoading(false)
      }
    })()
  }, [page, filters, refreshKey, toast])

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  function openEdit(bk: Bookmaker) {
    setEditing(bk)
    setForm({
      name: bk.name,
      slug: bk.slug,
      rating: bk.rating,
      website: bk.website || '',
      logo: bk.logo || '',
      bonus: bk.bonus || '',
      features: bk.features || '',
      active: bk.active,
      featured: bk.featured,
    })
    setShowModal(true)
  }

  function autoSlug(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast('warning', 'Name is required')
      return
    }
    if (!form.slug.trim()) {
      setForm((f) => ({ ...f, slug: autoSlug(f.name) }))
      return
    }
    setSaving(true)
    try {
      const url = '/api/admin/bookmakers'
      const method = editing ? 'PUT' : 'POST'
      const body = editing ? { id: editing.id, ...form } : form
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => null)
        throw new Error(json?.error || 'Failed')
      }
      toast('success', editing ? 'Bookmaker updated' : 'Bookmaker created')
      setShowModal(false)
      setRefreshKey((k) => k + 1)
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Failed')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch('/api/admin/bookmakers', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deleteTarget.id }),
      })
      if (!res.ok) throw new Error('Failed')
      toast('success', 'Bookmaker deleted')
      setDeleteTarget(null)
      setRefreshKey((k) => k + 1)
    } catch {
      toast('error', 'Failed to delete bookmaker')
    } finally {
      setDeleting(false)
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  function renderStars(rating: number) {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            className={`w-3.5 h-3.5 ${
              s <= Math.round(rating)
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300 dark:text-gray-600'
            }`}
          />
        ))}
        <span className="ml-1 text-xs text-text-muted">{rating.toFixed(1)}</span>
      </div>
    )
  }

  const columns: Column<Bookmaker>[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (bk) => (
        <div className="flex items-center gap-3">
          {bk.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={bk.logo} alt="" className="w-8 h-8 rounded-lg object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-surface-tertiary flex items-center justify-center text-xs font-bold text-text-muted">
              {bk.name[0]}
            </div>
          )}
          <div>
            <div className="font-medium text-text-primary">{bk.name}</div>
            <div className="text-xs text-text-muted">{bk.slug}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'rating',
      label: 'Rating',
      sortable: true,
      render: (bk) => renderStars(bk.rating),
    },
    {
      key: 'active',
      label: 'Active',
      render: (bk) => (
        <Badge variant={bk.active ? 'success' : 'default'} size="sm">
          {bk.active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'featured',
      label: 'Featured',
      render: (bk) => (
        <Badge variant={bk.featured ? 'info' : 'default'} size="sm">
          {bk.featured ? 'Featured' : '—'}
        </Badge>
      ),
    },
    {
      key: 'website',
      label: 'Website',
      render: (bk) =>
        bk.website ? (
          <a
            href={bk.website}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-primary-600 hover:underline text-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="w-3 h-3" />
            Visit
          </a>
        ) : (
          <span className="text-text-muted text-sm">—</span>
        ),
    },
    {
      key: 'createdAt',
      label: 'Created',
      sortable: true,
      render: (bk) => (
        <span className="text-text-secondary text-sm">{formatDate(bk.createdAt)}</span>
      ),
    },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Bookmakers</h1>
          <p className="text-text-secondary mt-1">Manage bookmaker listings</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Add Bookmaker
        </Button>
      </div>

      <div className="mb-6">
        <StatsCard title="Total Bookmakers" value={total} icon={Star} color="yellow" />
      </div>

      <div className="mb-4">
        <SearchFilter
          searchPlaceholder="Search bookmakers..."
          values={filters}
          onChange={(v) => { setFilters(v); setPage(1) }}
        />
      </div>

      <DataTable<Bookmaker>
        columns={columns}
        data={bookmakers}
        total={total}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        loading={loading}
        emptyMessage="No bookmakers found"
        actions={(bk) => (
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={() => openEdit(bk)}
              className="p-1.5 rounded-lg hover:bg-surface-tertiary text-text-muted hover:text-primary-600 transition-colors"
              title="Edit"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDeleteTarget(bk)}
              className="p-1.5 rounded-lg hover:bg-surface-tertiary text-text-muted hover:text-red-600 transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      />

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-surface rounded-xl border border-border shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-surface">
              <h2 className="text-lg font-semibold text-text-primary">
                {editing ? 'Edit Bookmaker' : 'Add Bookmaker'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg hover:bg-surface-tertiary text-text-muted transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">Name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => {
                      const name = e.target.value
                      setForm((f) => ({
                        ...f,
                        name,
                        slug: editing ? f.slug : autoSlug(name),
                      }))
                    }}
                    className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Bet365"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">Slug *</label>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                    className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="bet365"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Rating ({form.rating}/5)
                </label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, rating: s }))}
                      className="p-0.5"
                    >
                      <Star
                        className={`w-6 h-6 transition-colors ${
                          s <= form.rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300 dark:text-gray-600 hover:text-yellow-200'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Website URL</label>
                <input
                  type="url"
                  value={form.website}
                  onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="https://www.bet365.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Logo URL</label>
                <input
                  type="url"
                  value={form.logo}
                  onChange={(e) => setForm((f) => ({ ...f, logo: e.target.value }))}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="https://example.com/logo.png"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Bonus Text</label>
                <input
                  type="text"
                  value={form.bonus}
                  onChange={(e) => setForm((f) => ({ ...f, bonus: e.target.value }))}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="100% Welcome Bonus up to $200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Features (comma-separated)
                </label>
                <input
                  type="text"
                  value={form.features}
                  onChange={(e) => setForm((f) => ({ ...f, features: e.target.value }))}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Live Betting, Cash Out, Mobile App"
                />
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                    className="h-4 w-4 rounded border-border text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-text-secondary">Active</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))}
                    className="h-4 w-4 rounded border-border text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-text-secondary">Featured</span>
                </label>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-surface-secondary rounded-b-xl sticky bottom-0">
              <Button variant="ghost" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} loading={saving}>
                {editing ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Bookmaker"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  )
}
