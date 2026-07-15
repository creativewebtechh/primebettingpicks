'use client'

import { useState, useEffect } from 'react'
import {
  BarChart3,
  Eye,
  Crown,
  Clock,
  Plus,
  Pencil,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StatsCard } from '@/components/admin/stats-card'
import { DataTable, Column } from '@/components/admin/data-table'
import { SearchFilter } from '@/components/admin/search-filter'
import { ConfirmDialog } from '@/components/admin/confirm-dialog'
import { useToast } from '@/components/admin/toast'

interface Prediction {
  id: string
  matchId: string
  match: {
    homeTeam: { name: string } | null
    awayTeam: { name: string } | null
    league: { name: string } | null
    date: string
  }
  tip: string
  analysis: string | null
  bettingTips: string | null
  published: boolean
  featured: boolean
  premium: boolean
  price: number | null
  result: string | null
  predictedHomeScore: number
  predictedAwayScore: number
  homeWinProbability: number
  drawProbability: number
  awayWinProbability: number
  createdAt: string
}

interface MatchOption {
  id: string
  homeTeam: { name: string } | null
  awayTeam: { name: string } | null
  league: { name: string } | null
  date: string
}

interface ApiResponse {
  data: Prediction[]
  total: number
  page: number
  totalPages: number
}

interface PredictionForm {
  matchId: string
  predictedHomeScore: number
  predictedAwayScore: number
  homeWinProbability: number
  drawProbability: number
  awayWinProbability: number
  tip: string
  analysis: string
  bettingTips: string
  published: boolean
  featured: boolean
  premium: boolean
  price: number | null
}

const TIP_OPTIONS = [
  'Home Win',
  'Draw',
  'Away Win',
  'Over 2.5',
  'Under 2.5',
  'Both Teams to Score',
  'Double Chance',
]

const emptyForm: PredictionForm = {
  matchId: '',
  predictedHomeScore: 0,
  predictedAwayScore: 0,
  homeWinProbability: 33,
  drawProbability: 33,
  awayWinProbability: 34,
  tip: '',
  analysis: '',
  bettingTips: '',
  published: false,
  featured: false,
  premium: false,
  price: null,
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function AdminPredictionsPage() {
  const { toast } = useToast()
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [filterValues, setFilterValues] = useState<Record<string, string>>({})
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [bulkDialog, setBulkDialog] = useState<{ open: boolean; publish: boolean }>({
    open: false,
    publish: true,
  })
  const [bulkLoading, setBulkLoading] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<PredictionForm>(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string | null }>({
    open: false,
    id: null,
  })
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [availableMatches, setAvailableMatches] = useState<MatchOption[]>([])

  const limit = 20

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams({ page: String(page), limit: String(limit) })
        if (filterValues.search) params.set('search', filterValues.search)
        if (filterValues.published) params.set('published', filterValues.published)
        if (filterValues.premium) params.set('premium', filterValues.premium)
        if (filterValues.result) params.set('result', filterValues.result)

        const res = await fetch(`/api/admin/predictions?${params}`)
        if (!res.ok) throw new Error('Failed to fetch')
        const json: ApiResponse = await res.json()
        setPredictions(json.data)
        setTotal(json.total)
        setTotalPages(json.totalPages)
      } catch {
        toast('error', 'Failed to load predictions')
      } finally {
        setLoading(false)
      }
    })()
  }, [page, filterValues, toast, refreshKey])

  useEffect(() => {
    if (modalOpen) {
      fetch('/api/admin/matches?status=upcoming&limit=200')
        .then((res) => res.json())
        .then((json) => setAvailableMatches(json.data || []))
        .catch(() => setAvailableMatches([]))
    }
  }, [modalOpen])

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  function openEdit(p: Prediction) {
    setEditingId(p.id)
    setForm({
      matchId: p.matchId,
      predictedHomeScore: p.predictedHomeScore,
      predictedAwayScore: p.predictedAwayScore,
      homeWinProbability: p.homeWinProbability,
      drawProbability: p.drawProbability,
      awayWinProbability: p.awayWinProbability,
      tip: p.tip,
      analysis: p.analysis || '',
      bettingTips: p.bettingTips || '',
      published: p.published,
      featured: p.featured,
      premium: p.premium,
      price: p.price,
    })
    setModalOpen(true)
  }

  async function handleSubmit() {
    if (!form.matchId || !form.tip) {
      toast('error', 'Match and Tip are required')
      return
    }
    setSubmitting(true)
    try {
      const method = editingId ? 'PUT' : 'POST'
      const body = editingId ? { id: editingId, ...form } : form
      const res = await fetch('/api/admin/predictions', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error || 'Failed')
      }
      toast('success', editingId ? 'Prediction updated' : 'Prediction created')
      setModalOpen(false)
      setRefreshKey((k) => k + 1)
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Failed to save prediction')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!deleteDialog.id) return
    setDeleteLoading(true)
    try {
      const res = await fetch('/api/admin/predictions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deleteDialog.id }),
      })
      if (!res.ok) throw new Error('Failed')
      toast('success', 'Prediction deleted')
      setDeleteDialog({ open: false, id: null })
      setRefreshKey((k) => k + 1)
    } catch {
      toast('error', 'Failed to delete prediction')
    } finally {
      setDeleteLoading(false)
    }
  }

  async function handleSetResult(id: string, result: string) {
    try {
      const res = await fetch('/api/admin/predictions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, result }),
      })
      if (!res.ok) throw new Error('Failed')
      toast('success', 'Result updated')
      setRefreshKey((k) => k + 1)
    } catch {
      toast('error', 'Failed to update result')
    }
  }

  async function handleTogglePublished(prediction: Prediction) {
    try {
      const res = await fetch('/api/admin/predictions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [prediction.id], published: !prediction.published }),
      })
      if (!res.ok) throw new Error('Failed')
      toast('success', `Prediction ${prediction.published ? 'unpublished' : 'published'}`)
      setRefreshKey((k) => k + 1)
    } catch {
      toast('error', 'Failed to update prediction')
    }
  }

  async function handleBulkPublish() {
    setBulkLoading(true)
    try {
      const res = await fetch('/api/admin/predictions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds, published: bulkDialog.publish }),
      })
      if (!res.ok) throw new Error('Failed')
      const json = await res.json()
      toast(
        'success',
        `${json.data.updated} prediction(s) ${bulkDialog.publish ? 'published' : 'unpublished'}`
      )
      setSelectedIds([])
      setBulkDialog({ open: false, publish: true })
      setRefreshKey((k) => k + 1)
    } catch {
      toast('error', 'Failed to update predictions')
    } finally {
      setBulkLoading(false)
    }
  }

  const publishedCount = predictions.filter((p) => p.published).length
  const premiumCount = predictions.filter((p) => p.premium).length
  const pendingCount = predictions.filter((p) => !p.result || p.result === 'pending').length

  const columns: Column<Prediction>[] = [
    {
      key: 'match',
      label: 'Match',
      sortable: true,
      render: (p) => {
        const home = p.match?.homeTeam?.name ?? 'TBD'
        const away = p.match?.awayTeam?.name ?? 'TBD'
        const league = p.match?.league?.name ?? ''
        return (
          <div className="min-w-[200px]">
            <p className="font-medium text-text-primary">
              {home} vs {away}
            </p>
            <p className="text-xs text-text-muted mt-0.5">
              {league}
              {p.match?.date ? ` · ${formatDate(p.match.date)}` : ''}
            </p>
          </div>
        )
      },
    },
    {
      key: 'tip',
      label: 'Tip',
      render: (p) => <span className="text-text-primary font-medium">{p.tip}</span>,
    },
    {
      key: 'premium',
      label: 'Premium',
      render: (p) => (
        <Badge variant={p.premium ? 'success' : 'default'}>{p.premium ? 'Yes' : 'No'}</Badge>
      ),
    },
    {
      key: 'published',
      label: 'Published',
      render: (p) => (
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleTogglePublished(p)
          }}
          className="inline-flex items-center gap-1.5 group"
        >
          {p.published ? (
            <Eye className="w-4 h-4 text-green-500" />
          ) : (
            <Eye className="w-4 h-4 text-text-muted" />
          )}
          <Badge variant={p.published ? 'success' : 'default'} size="sm">
            {p.published ? 'Yes' : 'No'}
          </Badge>
        </button>
      ),
    },
    {
      key: 'result',
      label: 'Result',
      render: (p) => (
        <select
          value={p.result || 'pending'}
          onChange={(e) => {
            e.stopPropagation()
            handleSetResult(p.id, e.target.value)
          }}
          onClick={(e) => e.stopPropagation()}
          className="h-8 px-2 pr-6 rounded-lg border border-border bg-surface text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none cursor-pointer"
        >
          <option value="pending">Pending</option>
          <option value="correct">Correct</option>
          <option value="incorrect">Incorrect</option>
          <option value="void">Void</option>
        </select>
      ),
    },
    {
      key: 'createdAt',
      label: 'Created',
      sortable: true,
      render: (p) => (
        <span className="text-text-secondary text-xs whitespace-nowrap">
          {formatDate(p.createdAt)}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Predictions</h1>
          <p className="text-text-secondary mt-1">Manage match predictions</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Add Prediction
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total" value={total} icon={BarChart3} color="blue" />
        <StatsCard title="Published" value={publishedCount} icon={Eye} color="green" />
        <StatsCard title="Premium" value={premiumCount} icon={Crown} color="purple" />
        <StatsCard title="Pending" value={pendingCount} icon={Clock} color="yellow" />
      </div>

      <div className="space-y-4">
        <SearchFilter
          searchPlaceholder="Search predictions…"
          filters={[
            {
              key: 'published',
              label: 'Published',
              type: 'select',
              options: [
                { value: 'true', label: 'Published' },
                { value: 'false', label: 'Draft' },
              ],
            },
            {
              key: 'premium',
              label: 'Premium',
              type: 'select',
              options: [
                { value: 'true', label: 'Premium' },
                { value: 'false', label: 'Free' },
              ],
            },
            {
              key: 'result',
              label: 'Result',
              type: 'select',
              options: [
                { value: 'correct', label: 'Correct' },
                { value: 'incorrect', label: 'Incorrect' },
                { value: 'pending', label: 'Pending' },
                { value: 'void', label: 'Void' },
              ],
            },
          ]}
          values={filterValues}
          onChange={(v) => {
            setFilterValues(v)
            setPage(1)
          }}
        />

        {selectedIds.length > 0 && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-primary-50 dark:bg-primary-950/20 border border-primary-200 dark:border-primary-800">
            <span className="text-sm text-primary-700 dark:text-primary-300 font-medium">
              {selectedIds.length} selected
            </span>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setBulkDialog({ open: true, publish: true })}
            >
              Publish
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setBulkDialog({ open: true, publish: false })}
            >
              Unpublish
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSelectedIds([])}>
              Clear
            </Button>
          </div>
        )}

        <DataTable
          columns={columns}
          data={predictions}
          total={total}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          loading={loading}
          emptyMessage="No predictions found"
          selectedIds={selectedIds}
          onSelectAll={setSelectedIds}
          onSelectRow={(id) =>
            setSelectedIds((prev) =>
              prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
            )
          }
          actions={(p) => (
            <div className="flex items-center justify-end gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  openEdit(p)
                }}
                className="p-1.5 rounded-lg hover:bg-surface-tertiary text-text-muted hover:text-primary-600 transition-colors"
                title="Edit"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setDeleteDialog({ open: true, id: p.id })
                }}
                className="p-1.5 rounded-lg hover:bg-surface-tertiary text-text-muted hover:text-error transition-colors"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        />
      </div>

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
                {editingId ? 'Edit Prediction' : 'Create Prediction'}
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
                  Match *
                </label>
                <select
                  value={form.matchId}
                  onChange={(e) => setForm((prev) => ({ ...prev, matchId: e.target.value }))}
                  disabled={!!editingId}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-60"
                >
                  <option value="">Select a match…</option>
                  {availableMatches.map((m) => {
                    const home = m.homeTeam?.name ?? 'TBD'
                    const away = m.awayTeam?.name ?? 'TBD'
                    const league = m.league?.name ?? ''
                    return (
                      <option key={m.id} value={m.id}>
                        {home} vs {away}
                        {league ? ` (${league})` : ''}
                      </option>
                    )
                  })}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Predicted Home Score
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.predictedHomeScore}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        predictedHomeScore: parseInt(e.target.value) || 0,
                      }))
                    }
                    className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Predicted Away Score
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.predictedAwayScore}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        predictedAwayScore: parseInt(e.target.value) || 0,
                      }))
                    }
                    className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Home Win %
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={form.homeWinProbability}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        homeWinProbability: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Draw %
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={form.drawProbability}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        drawProbability: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Away Win %
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={form.awayWinProbability}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        awayWinProbability: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Tip *
                </label>
                <select
                  value={form.tip}
                  onChange={(e) => setForm((prev) => ({ ...prev, tip: e.target.value }))}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select a tip…</option>
                  {TIP_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Analysis
                </label>
                <textarea
                  rows={4}
                  value={form.analysis}
                  onChange={(e) => setForm((prev) => ({ ...prev, analysis: e.target.value }))}
                  placeholder="Match analysis…"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Betting Tips
                </label>
                <textarea
                  rows={3}
                  value={form.bettingTips}
                  onChange={(e) => setForm((prev) => ({ ...prev, bettingTips: e.target.value }))}
                  placeholder="Betting tips for users…"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                />
              </div>

              <div className="flex flex-wrap items-center gap-6">
                <label className="inline-flex items-center gap-2 text-sm text-text-primary cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.published}
                    onChange={(e) => setForm((prev) => ({ ...prev, published: e.target.checked }))}
                    className="h-4 w-4 rounded border-border text-primary-600 focus:ring-primary-500"
                  />
                  Published
                </label>
                <label className="inline-flex items-center gap-2 text-sm text-text-primary cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(e) => setForm((prev) => ({ ...prev, featured: e.target.checked }))}
                    className="h-4 w-4 rounded border-border text-primary-600 focus:ring-primary-500"
                  />
                  Featured
                </label>
                <label className="inline-flex items-center gap-2 text-sm text-text-primary cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.premium}
                    onChange={(e) => setForm((prev) => ({ ...prev, premium: e.target.checked }))}
                    className="h-4 w-4 rounded border-border text-primary-600 focus:ring-primary-500"
                  />
                  Premium
                </label>
              </div>

              {form.premium && (
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Price (₦)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.price ?? ''}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        price: e.target.value ? parseInt(e.target.value) : null,
                      }))
                    }
                    placeholder="0"
                    className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
              <Button variant="ghost" onClick={() => setModalOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSubmit} loading={submitting}>
                {editingId ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteDialog.open}
        title="Delete Prediction"
        message="Are you sure you want to delete this prediction? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialog({ open: false, id: null })}
        loading={deleteLoading}
      />

      <ConfirmDialog
        open={bulkDialog.open}
        title={bulkDialog.publish ? 'Publish Predictions' : 'Unpublish Predictions'}
        message={
          bulkDialog.publish
            ? `Publish ${selectedIds.length} selected prediction(s)? They will be visible to users.`
            : `Unpublish ${selectedIds.length} selected prediction(s)? They will be hidden from users.`
        }
        confirmLabel={bulkDialog.publish ? 'Publish' : 'Unpublish'}
        variant={bulkDialog.publish ? 'info' : 'warning'}
        onConfirm={handleBulkPublish}
        onCancel={() => setBulkDialog({ open: false, publish: true })}
        loading={bulkLoading}
      />
    </div>
  )
}
