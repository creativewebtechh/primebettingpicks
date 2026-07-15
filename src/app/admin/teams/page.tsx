'use client'

import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DataTable, type Column } from '@/components/admin/data-table'
import { SearchFilter, type FilterOption } from '@/components/admin/search-filter'
import { Modal } from '@/components/admin/modal'
import { ConfirmDialog } from '@/components/admin/confirm-dialog'
import { useToast } from '@/components/admin/toast'

interface Team {
  id: string
  name: string
  shortName: string
  slug: string
  country: string | null
  stadium: string | null
  league: { id: string; name: string; slug: string }
  createdAt: string
  _count?: { match_match_homeTeamIdToteam: number; match_match_awayTeamIdToteam: number }
}

interface League {
  id: string
  name: string
  slug: string
}

interface ApiResponse {
  data: Team[]
  total: number
  page: number
  limit: number
  totalPages: number
}

interface LeaguesApiResponse {
  data: League[]
  total: number
}

function toSlug(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

const emptyForm = { name: '', slug: '', shortName: '', country: '', stadium: '', leagueId: '' }

export default function AdminTeamsPage() {
  const { toast } = useToast()
  const [data, setData] = useState<Team[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [filterValues, setFilterValues] = useState<Record<string, string>>({})
  const [leagueOptions, setLeagueOptions] = useState<{ value: string; label: string }[]>([])
  const [leaguesList, setLeaguesList] = useState<League[]>([])
  const [refreshKey, setRefreshKey] = useState(0)
  const limit = 20

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)
  const [formData, setFormData] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const [deletingTeam, setDeletingTeam] = useState<Team | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetch('/api/admin/leagues?limit=100')
      .then((res) => res.json())
      .then((json: LeaguesApiResponse) => {
        setLeaguesList(json.data)
        setLeagueOptions(json.data.map((l) => ({ value: l.slug, label: l.name })))
      })
  }, [])

  const filters: FilterOption[] = [
    {
      key: 'league',
      label: 'League',
      type: 'select',
      options: leagueOptions,
    },
  ]

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        params.set('page', String(page))
        params.set('limit', String(limit))
        if (filterValues.search) params.set('search', filterValues.search)
        if (filterValues.league) params.set('league', filterValues.league)

        const res = await fetch(`/api/admin/teams?${params}`)
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

  function openEditModal(team: Team) {
    setEditingTeam(team)
    setFormData({
      name: team.name,
      slug: team.slug,
      shortName: team.shortName,
      country: team.country || '',
      stadium: team.stadium || '',
      leagueId: team.league?.id || '',
    })
    setShowEditModal(true)
  }

  function handleNameChange(name: string) {
    setFormData(prev => ({
      ...prev,
      name,
      slug: editingTeam ? prev.slug : toSlug(name),
    }))
  }

  async function handleCreate() {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to create team' }))
        toast('error', err.error || 'Failed to create team')
        return
      }
      toast('success', 'Team created successfully')
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
    if (!editingTeam) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/teams', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingTeam.id, ...formData }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to update team' }))
        toast('error', err.error || 'Failed to update team')
        return
      }
      toast('success', 'Team updated successfully')
      setShowEditModal(false)
      setEditingTeam(null)
      refreshData()
    } catch {
      toast('error', 'An unexpected error occurred')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deletingTeam) return
    setDeleting(true)
    try {
      const res = await fetch('/api/admin/teams', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deletingTeam.id }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to delete team' }))
        toast('error', err.error || 'Failed to delete team')
        return
      }
      toast('success', 'Team deleted successfully')
      setDeletingTeam(null)
      refreshData()
    } catch {
      toast('error', 'An unexpected error occurred')
    } finally {
      setDeleting(false)
    }
  }

  const columns: Column<Team>[] = [
    { key: 'name', label: 'Name', sortable: true, render: (item) => <span className="font-medium">{item.name}</span> },
    { key: 'shortName', label: 'Short Name', render: (item) => <span className="text-text-muted">{item.shortName}</span> },
    { key: 'country', label: 'Country', sortable: true, render: (item) => item.country || <span className="text-text-muted">-</span> },
    { key: 'stadium', label: 'Stadium', render: (item) => item.stadium || <span className="text-text-muted">-</span> },
    {
      key: 'league',
      label: 'League',
      render: (item) => <span className="text-text-muted">{item.league?.name ?? '-'}</span>,
    },
    {
      key: 'createdAt',
      label: 'Created',
      sortable: true,
      render: (item) => (
        <span className="text-text-muted">{new Date(item.createdAt).toLocaleDateString()}</span>
      ),
    },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Teams</h1>
          <p className="text-text-secondary mt-1">Manage football teams</p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="w-4 h-4 mr-2" />
          Add Team
        </Button>
      </div>

      <div className="mb-4">
        <SearchFilter
          searchPlaceholder="Search teams..."
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
        emptyMessage="No teams found"
        actions={(item) => (
          <>
            <button
              onClick={() => openEditModal(item)}
              className="p-1.5 rounded-lg hover:bg-surface-tertiary text-text-muted hover:text-primary-600"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDeletingTeam(item)}
              className="p-1.5 rounded-lg hover:bg-surface-tertiary text-text-muted hover:text-red-600"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        )}
      />

      <Modal
        isOpen={showCreateModal}
        title="Create Team"
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
              placeholder="Team name"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Short Name</label>
              <input
                type="text"
                value={formData.shortName}
                onChange={(e) => setFormData(prev => ({ ...prev, shortName: e.target.value }))}
                className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="e.g. MUN"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Slug</label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="team-slug"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">League</label>
            <select
              value={formData.leagueId}
              onChange={(e) => setFormData(prev => ({ ...prev, leagueId: e.target.value }))}
              className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Select league</option>
              {leaguesList.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
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
              <label className="block text-sm font-medium text-text-secondary mb-1">Stadium</label>
              <input
                type="text"
                value={formData.stadium}
                onChange={(e) => setFormData(prev => ({ ...prev, stadium: e.target.value }))}
                className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Stadium"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <Button variant="ghost" onClick={() => setShowCreateModal(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleCreate} loading={saving}>Create Team</Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showEditModal}
        title="Edit Team"
        onClose={() => { setShowEditModal(false); setEditingTeam(null) }}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Team name"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Short Name</label>
              <input
                type="text"
                value={formData.shortName}
                onChange={(e) => setFormData(prev => ({ ...prev, shortName: e.target.value }))}
                className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="e.g. MUN"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Slug</label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="team-slug"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">League</label>
            <select
              value={formData.leagueId}
              onChange={(e) => setFormData(prev => ({ ...prev, leagueId: e.target.value }))}
              className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Select league</option>
              {leaguesList.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
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
              <label className="block text-sm font-medium text-text-secondary mb-1">Stadium</label>
              <input
                type="text"
                value={formData.stadium}
                onChange={(e) => setFormData(prev => ({ ...prev, stadium: e.target.value }))}
                className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Stadium"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <Button variant="ghost" onClick={() => { setShowEditModal(false); setEditingTeam(null) }} disabled={saving}>Cancel</Button>
            <Button onClick={handleEdit} loading={saving}>Save Changes</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deletingTeam}
        title="Delete Team"
        message={`Are you sure you want to delete "${deletingTeam?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeletingTeam(null)}
      />
    </div>
  )
}
