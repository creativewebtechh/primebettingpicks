'use client'

import { useState, useEffect } from 'react'
import { Bell, Plus, Trash2, CheckCircle, Circle, Send } from 'lucide-react'
import { DataTable, Column } from '@/components/admin/data-table'
import { StatsCard } from '@/components/admin/stats-card'
import { ConfirmDialog } from '@/components/admin/confirm-dialog'
import { useToast } from '@/components/admin/toast'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

interface Notification {
  id: string
  userId: string
  type: string
  title: string
  message: string
  read: boolean
  data: string | null
  createdAt: string
  user: { id: string; name: string | null; email: string; role: string }
}

interface ApiResponse {
  data: Notification[]
  total: number
  page: number
  totalPages: number
}

const TYPE_COLORS: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
  info: 'info',
  success: 'success',
  warning: 'warning',
  error: 'error',
  system: 'default',
  match: 'info',
  prediction: 'success',
}

export default function NotificationsPage() {
  const { toast } = useToast()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState<Notification | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info',
    userId: '',
    broadcast: false,
  })
  const [sending, setSending] = useState(false)

  const limit = 20

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        params.set('page', String(page))
        params.set('limit', String(limit))

        const res = await fetch(`/api/admin/notifications?${params}`)
        if (!res.ok) throw new Error('Failed to fetch notifications')
        const json: ApiResponse = await res.json()
        setNotifications(json.data)
        setTotal(json.total)
        setTotalPages(json.totalPages)
      } catch {
        toast('error', 'Failed to load notifications')
      } finally {
        setLoading(false)
      }
    })()
  }, [page, toast, refreshKey])

  function handlePageChange(newPage: number) {
    setPage(newPage)
  }

  async function handleSend() {
    if (!formData.title.trim() || !formData.message.trim()) {
      toast('error', 'Title and message are required')
      return
    }
    if (!formData.broadcast && !formData.userId.trim()) {
      toast('error', 'Enter a User ID or enable broadcast')
      return
    }

    setSending(true)
    try {
      const res = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: formData.type,
          title: formData.title,
          message: formData.message,
          userId: formData.broadcast ? undefined : formData.userId,
          broadcast: formData.broadcast,
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error || 'Failed to send notification')
      }
      const result = await res.json()
      toast('success', formData.broadcast ? `Broadcast sent to ${result.data.sentTo} users` : 'Notification sent')
      setFormData({ title: '', message: '', type: 'info', userId: '', broadcast: false })
      setShowForm(false)
      setRefreshKey(k => k + 1)
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Failed to send notification')
    } finally {
      setSending(false)
    }
  }

  async function handleToggleRead(notification: Notification) {
    try {
      const res = await fetch('/api/admin/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: notification.id, read: !notification.read }),
      })
      if (!res.ok) throw new Error('Failed to update')
      setRefreshKey(k => k + 1)
    } catch {
      toast('error', 'Failed to toggle read status')
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/notifications?id=${deleteTarget.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error || 'Failed to delete')
      }
      toast('success', 'Notification deleted')
      setDeleteTarget(null)
      setRefreshKey(k => k + 1)
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Failed to delete notification')
    } finally {
      setDeleting(false)
    }
  }

  function formatDateTime(dateStr: string) {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const columns: Column<Notification>[] = [
    {
      key: 'title',
      label: 'Title',
      render: (n) => (
        <div>
          <p className="font-medium text-sm">{n.title}</p>
          <p className="text-text-muted text-xs mt-0.5 line-clamp-1">{n.message}</p>
        </div>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      render: (n) => {
        const color = TYPE_COLORS[n.type] || 'default'
        return <Badge variant={color} size="sm">{n.type}</Badge>
      },
    },
    {
      key: 'user',
      label: 'Recipient',
      render: (n) => (
        <div>
          <p className="text-sm">{n.user.name || 'Unnamed'}</p>
          <p className="text-text-muted text-xs">{n.user.email}</p>
        </div>
      ),
    },
    {
      key: 'read',
      label: 'Status',
      render: (n) => (
        <button
          onClick={() => handleToggleRead(n)}
          className="inline-flex items-center gap-1.5 text-sm hover:opacity-70 transition-opacity"
        >
          {n.read ? (
            <span className="text-green-600 dark:text-green-400 inline-flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" /> Read
            </span>
          ) : (
            <span className="text-text-muted inline-flex items-center gap-1">
              <Circle className="w-3.5 h-3.5" /> Unread
            </span>
          )}
        </button>
      ),
    },
    {
      key: 'createdAt',
      label: 'Sent',
      sortable: true,
      render: (n) => (
        <span className="text-text-muted text-xs whitespace-nowrap">{formatDateTime(n.createdAt)}</span>
      ),
    },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Notifications</h1>
          <p className="text-text-secondary mt-1">Manage and send notifications to users</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} size="sm">
          <Plus className="w-4 h-4" />
          {showForm ? 'Cancel' : 'New Notification'}
        </Button>
      </div>

      <div className="mb-6">
        <StatsCard title="Total Notifications" value={total} icon={Bell} color="blue" />
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-base font-semibold text-text-primary">Create Notification</h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-text-secondary mb-1">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(f => ({ ...f, title: e.target.value }))}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Notification title"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-text-secondary mb-1">Message</label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData(f => ({ ...f, message: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  placeholder="Notification message"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(f => ({ ...f, type: e.target.value }))}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="info">Info</option>
                  <option value="success">Success</option>
                  <option value="warning">Warning</option>
                  <option value="error">Error</option>
                  <option value="system">System</option>
                  <option value="match">Match</option>
                  <option value="prediction">Prediction</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">User ID</label>
                <input
                  type="text"
                  value={formData.userId}
                  onChange={(e) => setFormData(f => ({ ...f, userId: e.target.value }))}
                  disabled={formData.broadcast}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                  placeholder="Target user ID"
                />
              </div>
              <div className="md:col-span-2 flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.broadcast}
                    onChange={(e) => setFormData(f => ({ ...f, broadcast: e.target.checked, userId: '' }))}
                    className="h-4 w-4 rounded border-border text-primary-600 focus:ring-primary-500"
                  />
                  Broadcast to all users
                </label>
                <Button onClick={handleSend} loading={sending} size="sm">
                  <Send className="w-4 h-4" />
                  Send
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <DataTable<Notification>
        columns={columns}
        data={notifications}
        total={total}
        page={page}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        loading={loading}
        emptyMessage="No notifications found"
        actions={(n) => (
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={() => setDeleteTarget(n)}
              className="p-1.5 rounded-lg hover:bg-surface-tertiary text-text-muted hover:text-red-600 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Notification"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  )
}
