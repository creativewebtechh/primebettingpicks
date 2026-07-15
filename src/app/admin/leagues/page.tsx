'use client'

import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DataTable, type Column } from '@/components/admin/data-table'
import { SearchFilter, type FilterOption } from '@/components/admin/search-filter'
import { Modal } from '@/components/admin/modal'
import { ConfirmDialog } from '@/components/admin/confirm-dialog'
import { useToast } from '@/components/admin/toast'

interface League {
  id: string
  name: string
  slug: string
  country: string
  tier: number
  sport: string
  season: string
  featured: boolean
  active: boolean
  logo: string | null
  createdAt: string
  _count?: { match: number; team: number }
}

interface ApiResponse {
  data: League[]
  total: number
  page: number
  limit: number
  totalPages: number
}

const filters: FilterOption[] = [
  {
    key: 'sport',
    label: 'Sport',
    type: 'select',
    options: [
      { value: 'football', label: 'Football' },
      { value: 'basketball', label: 'Basketball' },
      { value: 'tennis', label: 'Tennis' },
      { value: 'hockey', label: 'Hockey' },
    ],
  },
]

function toSlug(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

const emptyForm = { name: '', slug: '', country: '', tier: 1, sport: 'football', season: new Date().getFullYear().toString(), featured: false, active: true }

export default function AdminLeaguesPage() {
  const { toast } = useToast()
  const [data, setData] = useState<League[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [filterValues, setFilterValues] = useState<Record<string, string>>({})
  const [refreshKey, setRefreshKey] = useState(0)
  const limit = 20

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingLeague, setEditingLeague] = useState<League | null>(null)
  const [formData, setFormData] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const [deletingLeague, setDeletingLeague] = useState<League | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        params.set('page', String(page))
        params.set('limit', String(limit))
        if (filterValues.search) params.set('search', filterValues.search)
        if (filterValues.sport) params.set('sport', filterValues.sport)

        const res = await fetch(`/api/admin/leagues?${params}`)
        if (res.ok) {
          const json: ApiResponse = await res.json()
          setData(json.data)
          setTotal(json.total)
          setTotalPages(json.totalPages)
        }
      } finally {
        setLoading(false)
      }
    })()
  }, [page, filterValues, refreshKey])

  function handleSearch() {
    setPage(1)
    setRefreshKey(k => k + 1)
  }

  function handleFilterChange(values: Record<string, string>) {
    setFilterValues(values)
    setPage(1)
  }

  function refreshData() {
    setRefreshKey(k => k + 1)
  }

  function openCreateModal() {
    setFormData(emptyForm)
    setShowCreateModal(true)
  }

  function openEditModal(league: League) {
    setEditingLeague(league)
    setFormData({
      name: league.name,
      slug: league.slug,
      country: league.country,
      tier: league.tier,
      sport: league.sport || 'football',
      season: league.season || new Date().getFullYear().toString(),
      featured: league.featured,
      active: league.active,
    })
    setShowEditModal(true)
  }

  function handleNameChange(name: string) {
    setFormData(prev => ({
      ...prev,
      name,
      slug: editingLeague ? prev.slug : toSlug(name),
    }))
  }

  async function handleCreate() {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/leagues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to create league' }))
        toast('error', err.error || 'Failed to create league')
        return
      }
      toast('success', 'League created successfully')
      setShowCreateModal(false)
      setFormData(emptyForm)
      refreshData()
    } catch {
      toast('error', 'An unexpected error occurred')
    } finally {
      setSaving(false)
    }
  }

  async function handleEdit() {
    if (!editingLeague) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/leagues', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingLeague.id, ...formData }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to update league' }))
        toast('error', err.error || 'Failed to update league')
        return
      }
      toast('success', 'League updated successfully')
      setShowEditModal(false)
      setEditingLeague(null)
      refreshData()
    } catch {
      toast('error', 'An unexpected error occurred')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deletingLeague) return
    setDeleting(true)
    try {
      const res = await fetch('/api/admin/leagues', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deletingLeague.id }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to delete league' }))
        toast('error', err.error || 'Failed to delete league')
        return
      }
      toast('success', 'League deleted successfully')
      setDeletingLeague(null)
      refreshData()
    } catch {
      toast('error', 'An unexpected error occurred')
    } finally {
      setDeleting(false)
    }
  }

  async function toggleActive(league: League) {
    const res = await fetch('/api/admin/leagues', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: league.id, active: !league.active }),
    })
    if (res.ok) {
      setData((prev) =>
        prev.map((l) => (l.id === league.id ? { ...l, active: !l.active } : l))
      )
    }
  }

  const columns: Column<League>[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (item) => (
        <div className="flex items-center gap-2">
          {item.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.logo} alt="" className="w-6 h-6 rounded object-contain" />
          ) : (
            <div className="w-6 h-6 rounded bg-surface-tertiary flex items-center justify-center">
              <Trophy className="w-3.5 h-3.5 text-text-muted" />
            </div>
          )}
          <span className="font-medium">{item.name}</span>
        </div>
      ),
    },
    { key: 'country', label: 'Country', sortable: true },
    {
      key: 'tier',
      label: 'Tier',
      sortable: true,
      render: (item) => <span className="text-text-muted">T{item.tier}</span>,
    },
    {
      key: 'featured',
      label: 'Featured',
      render: (item) =>
        item.featured ? <Badge variant="info" size="sm">Featured</Badge> : <span className="text-text-muted">-</span>,
    },
    {
      key: 'active',
      label: 'Active',
      render: (item) => (
        <button
          onClick={() => toggleActive(item)}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
            item.active ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
          }`}
        >
          <span
            className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
              item.active ? 'translate-x-4.5' : 'translate-x-0.5'
            }`}
          />
        </button>
      ),
    },
    {
      key: 'createdAt',
      label: 'Created',
      sortable: true,
      render: (item) => (
        <span className="text-text-muted">
          {new Date(item.createdAt).toLocaleDateString()}
        </span>
      ),
    },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Leagues</h1>
          <p className="text-text-secondary mt-1">Manage leagues and competitions</p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="w-4 h-4 mr-2" />
          Add League
        </Button>
      </div>

      <div className="mb-4">
        <SearchFilter
          searchPlaceholder="Search leagues..."
          filters={filters}
          values={filterValues}
          onChange={handleFilterChange}
          onSearch={handleSearch}
        />
      </div>

      <DataTable
        columns={columns}
        data={data}
        total={total}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        loading={loading}
        emptyMessage="No leagues found"
        actions={(item) => (
          <>
            <button
              onClick={() => openEditModal(item)}
              className="p-1.5 rounded-lg hover:bg-surface-tertiary text-text-muted hover:text-primary-600"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDeletingLeague(item)}
              className="p-1.5 rounded-lg hover:bg-surface-tertiary text-text-muted hover:text-red-600"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        )}
      />

      <Modal
        isOpen={showCreateModal}
        title="Create League"
        onClose={() => setShowCreateModal(false)}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="League name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Slug</label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
              className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="league-slug"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Country</label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Country"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Tier</label>
              <input
                type="number"
                min={1}
                value={formData.tier}
                onChange={(e) => setFormData(prev => ({ ...prev, tier: parseInt(e.target.value) || 1 }))}
                className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Sport</label>
              <select
                value={formData.sport}
                onChange={(e) => setFormData(prev => ({ ...prev, sport: e.target.value }))}
                className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="football">Football</option>
                <option value="basketball">Basketball</option>
                <option value="tennis">Tennis</option>
                <option value="hockey">Hockey</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Season</label>
              <input
                type="text"
                value={formData.season}
                onChange={(e) => setFormData(prev => ({ ...prev, season: e.target.value }))}
                className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="2025"
              />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.featured}
                onChange={(e) => setFormData(prev => ({ ...prev, featured: e.target.checked }))}
                className="h-4 w-4 rounded border-border text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-text-primary">Featured</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.active}
                onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                className="h-4 w-4 rounded border-border text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-text-primary">Active</span>
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <Button variant="ghost" onClick={() => setShowCreateModal(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleCreate} loading={saving}>Create League</Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showEditModal}
        title="Edit League"
        onClose={() => { setShowEditModal(false); setEditingLeague(null) }}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="League name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Slug</label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
              className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="league-slug"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Country</label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Country"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Tier</label>
              <input
                type="number"
                min={1}
                value={formData.tier}
                onChange={(e) => setFormData(prev => ({ ...prev, tier: parseInt(e.target.value) || 1 }))}
                className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Sport</label>
              <select
                value={formData.sport}
                onChange={(e) => setFormData(prev => ({ ...prev, sport: e.target.value }))}
                className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="football">Football</option>
                <option value="basketball">Basketball</option>
                <option value="tennis">Tennis</option>
                <option value="hockey">Hockey</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Season</label>
              <input
                type="text"
                value={formData.season}
                onChange={(e) => setFormData(prev => ({ ...prev, season: e.target.value }))}
                className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="2025"
              />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.featured}
                onChange={(e) => setFormData(prev => ({ ...prev, featured: e.target.checked }))}
                className="h-4 w-4 rounded border-border text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-text-primary">Featured</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.active}
                onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                className="h-4 w-4 rounded border-border text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-text-primary">Active</span>
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <Button variant="ghost" onClick={() => { setShowEditModal(false); setEditingLeague(null) }} disabled={saving}>Cancel</Button>
            <Button onClick={handleEdit} loading={saving}>Save Changes</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deletingLeague}
        title="Delete League"
        message={`Are you sure you want to delete "${deletingLeague?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeletingLeague(null)}
      />
    </div>
  )
}
