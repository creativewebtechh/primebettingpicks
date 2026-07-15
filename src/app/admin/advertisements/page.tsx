'use client'

import { useState, useEffect } from 'react'
import {
  Plus,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Calendar,
  Layout,
  AlertCircle,
  Megaphone,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ConfirmDialog } from '@/components/admin/confirm-dialog'
import { useToast } from '@/components/admin/toast'

interface Advertisement {
  id: string
  name: string
  position: string
  code: string
  active: boolean
  startDate: string | null
  endDate: string | null
  createdAt: string
}

interface AdForm {
  name: string
  position: string
  code: string
  active: boolean
  startDate: string
  endDate: string
}

const emptyAdForm: AdForm = {
  name: '',
  position: 'header_top',
  code: '',
  active: true,
  startDate: '',
  endDate: '',
}

const POSITION_LABELS: Record<string, string> = {
  header_top: 'Header Top',
  header_bottom: 'Header Bottom',
  sidebar_top: 'Sidebar Top',
  sidebar_bottom: 'Sidebar Bottom',
  content_top: 'Content Top',
  content_middle: 'Content Middle',
  content_bottom: 'Content Bottom',
  footer_top: 'Footer Top',
  footer_bottom: 'Footer Bottom',
}

const POSITION_VARIANT: Record<string, 'info' | 'success' | 'warning' | 'default' | 'outline'> = {
  header_top: 'info',
  header_bottom: 'info',
  sidebar_top: 'success',
  sidebar_bottom: 'success',
  content_top: 'warning',
  content_middle: 'warning',
  content_bottom: 'warning',
  footer_top: 'default',
  footer_bottom: 'default',
}

const POSITION_OPTIONS = Object.keys(POSITION_LABELS)

export default function AdminAdvertisementsPage() {
  const { toast } = useToast()
  const [ads, setAds] = useState<Advertisement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<AdForm>(emptyAdForm)
  const [submitting, setSubmitting] = useState(false)

  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string | null }>({
    open: false,
    id: null,
  })
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch('/api/admin/advertisements')
        if (!res.ok) throw new Error('Failed to fetch')
        const json = await res.json()
        setAds(json.data)
      } catch {
        setError('Failed to load advertisements')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  function openCreate() {
    setEditingId(null)
    setForm(emptyAdForm)
    setModalOpen(true)
  }

  function openEdit(ad: Advertisement) {
    setEditingId(ad.id)
    setForm({
      name: ad.name,
      position: ad.position,
      code: ad.code,
      active: ad.active,
      startDate: ad.startDate ? new Date(ad.startDate).toISOString().split('T')[0] : '',
      endDate: ad.endDate ? new Date(ad.endDate).toISOString().split('T')[0] : '',
    })
    setModalOpen(true)
  }

  async function handleSubmit() {
    if (!form.name || !form.position || !form.code) {
      toast('error', 'Name, Position, and Code are required')
      return
    }
    setSubmitting(true)
    try {
      const method = editingId ? 'PUT' : 'POST'
      const body = editingId
        ? {
            id: editingId,
            name: form.name,
            position: form.position,
            code: form.code,
            active: form.active,
            startDate: form.startDate || null,
            endDate: form.endDate || null,
          }
        : {
            name: form.name,
            position: form.position,
            code: form.code,
            active: form.active,
            startDate: form.startDate || null,
            endDate: form.endDate || null,
          }
      const res = await fetch('/api/admin/advertisements', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error || 'Failed')
      }
      toast('success', editingId ? 'Advertisement updated' : 'Advertisement created')
      setModalOpen(false)
      const listRes = await fetch('/api/admin/advertisements')
      if (listRes.ok) {
        const json = await listRes.json()
        setAds(json.data)
      }
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Failed to save advertisement')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!deleteDialog.id) return
    setDeleteLoading(true)
    try {
      const res = await fetch('/api/admin/advertisements', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deleteDialog.id }),
      })
      if (!res.ok) throw new Error('Failed to delete')
      toast('success', 'Advertisement deleted')
      setDeleteDialog({ open: false, id: null })
      setAds((prev) => prev.filter((a) => a.id !== deleteDialog.id))
    } catch {
      toast('error', 'Failed to delete advertisement')
    } finally {
      setDeleteLoading(false)
    }
  }

  async function toggleActive(ad: Advertisement) {
    try {
      setTogglingId(ad.id)
      const res = await fetch('/api/admin/advertisements', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: ad.id, active: !ad.active }),
      })
      if (!res.ok) throw new Error('Failed to update')
      setAds((prev) => prev.map((a) => (a.id === ad.id ? { ...a, active: !a.active } : a)))
    } catch {
      setError('Failed to toggle advertisement')
    } finally {
      setTogglingId(null)
    }
  }

  function formatDate(date: string | null) {
    if (!date) return null
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Advertisements</h1>
          <p className="text-text-secondary mt-1">Manage ad placements</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Add Ad
        </Button>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <AlertCircle className="w-4 h-4 text-error shrink-0" />
          <span className="text-sm text-error">{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-error hover:opacity-70 text-sm"
          >
            Dismiss
          </button>
        </div>
      )}

      {loading && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            <span className="ml-3 text-text-secondary">Loading advertisements...</span>
          </CardContent>
        </Card>
      )}

      {!loading && ads.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Megaphone className="w-10 h-10 text-text-muted mx-auto mb-3" />
            <p className="text-text-secondary">No advertisements yet</p>
          </CardContent>
        </Card>
      )}

      {!loading && ads.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface-tertiary">
                    <th className="text-left p-3 text-text-muted font-medium">Name</th>
                    <th className="text-left p-3 text-text-muted font-medium">Position</th>
                    <th className="text-left p-3 text-text-muted font-medium">Status</th>
                    <th className="text-left p-3 text-text-muted font-medium hidden md:table-cell">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Start Date
                      </div>
                    </th>
                    <th className="text-left p-3 text-text-muted font-medium hidden md:table-cell">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        End Date
                      </div>
                    </th>
                    <th className="text-left p-3 text-text-muted font-medium hidden lg:table-cell">
                      Created
                    </th>
                    <th className="text-right p-3 text-text-muted font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {ads.map((ad) => (
                    <tr
                      key={ad.id}
                      className="border-b border-border hover:bg-surface-tertiary/50"
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Layout className="w-4 h-4 text-text-muted shrink-0" />
                          <span className="font-medium text-text-primary">{ad.name}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge variant={POSITION_VARIANT[ad.position] || 'default'} size="sm">
                          {POSITION_LABELS[ad.position] || ad.position}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Badge variant={ad.active ? 'success' : 'default'} size="sm">
                          {ad.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="p-3 text-text-muted hidden md:table-cell">
                        {formatDate(ad.startDate) || '—'}
                      </td>
                      <td className="p-3 text-text-muted hidden md:table-cell">
                        {formatDate(ad.endDate) || '—'}
                      </td>
                      <td className="p-3 text-text-muted hidden lg:table-cell">
                        {formatDate(ad.createdAt)}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => toggleActive(ad)}
                          disabled={togglingId === ad.id}
                          className="p-1.5 rounded-lg hover:bg-surface-tertiary text-text-muted hover:text-primary-600 disabled:opacity-50 transition-colors"
                          title={ad.active ? 'Deactivate' : 'Activate'}
                        >
                          {togglingId === ad.id ? (
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          ) : ad.active ? (
                            <ToggleRight className="w-4 h-4" />
                          ) : (
                            <ToggleLeft className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => openEdit(ad)}
                          className="p-1.5 rounded-lg hover:bg-surface-tertiary text-text-muted hover:text-primary-600 transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteDialog({ open: true, id: ad.id })}
                          className="p-1.5 rounded-lg hover:bg-surface-tertiary text-text-muted hover:text-error transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && ads.length > 0 && (
        <p className="text-xs text-text-muted mt-4">
          {ads.length} advertisement{ads.length !== 1 ? 's' : ''}
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
                {editingId ? 'Edit Advertisement' : 'Create Advertisement'}
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
                  Name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Ad name"
                  className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Position *
                </label>
                <select
                  value={form.position}
                  onChange={(e) => setForm((prev) => ({ ...prev, position: e.target.value }))}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {POSITION_OPTIONS.map((pos) => (
                    <option key={pos} value={pos}>
                      {POSITION_LABELS[pos]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Code *
                </label>
                <textarea
                  rows={6}
                  value={form.code}
                  onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))}
                  placeholder="HTML/JS ad code"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-text-primary placeholder:text-text-muted text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                />
              </div>

              <label className="inline-flex items-center gap-2 text-sm text-text-primary cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm((prev) => ({ ...prev, active: e.target.checked }))}
                  className="h-4 w-4 rounded border-border text-primary-600 focus:ring-primary-500"
                />
                Active
              </label>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, startDate: e.target.value }))
                    }
                    className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, endDate: e.target.value }))
                    }
                    className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
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
        title="Delete Advertisement"
        message="Are you sure you want to delete this advertisement? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialog({ open: false, id: null })}
        loading={deleteLoading}
      />
    </div>
  )
}
