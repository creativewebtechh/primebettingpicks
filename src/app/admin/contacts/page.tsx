'use client'

import { useState, useEffect } from 'react'
import {
  Mail, Eye, EyeOff, Trash2, ChevronDown, ChevronUp,
} from 'lucide-react'
import { DataTable, Column } from '@/components/admin/data-table'
import { SearchFilter, FilterOption } from '@/components/admin/search-filter'
import { StatsCard } from '@/components/admin/stats-card'
import { ConfirmDialog } from '@/components/admin/confirm-dialog'
import { useToast } from '@/components/admin/toast'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

interface ContactMessage {
  id: string
  name: string
  email: string
  subject: string
  message: string
  read: boolean
  createdAt: string
}

interface ApiResponse {
  data: ContactMessage[]
  total: number
  unreadCount: number
  page: number
  totalPages: number
}

const readFilters: FilterOption[] = [
  {
    key: 'read',
    label: 'All Messages',
    type: 'select',
    options: [
      { value: 'false', label: 'Unread' },
      { value: 'true', label: 'Read' },
    ],
  },
]

export default function AdminContactsPage() {
  const { toast } = useToast()
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [total, setTotal] = useState(0)
  const [unreadCount, setUnreadCount] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [refreshKey, setRefreshKey] = useState(0)

  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ContactMessage | null>(null)
  const [deleting, setDeleting] = useState(false)

  const limit = 20

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        const params = new URLSearchParams()
        params.set('page', String(page))
        params.set('limit', String(limit))
        if (filters.read) params.set('read', filters.read)

        const res = await fetch(`/api/admin/contacts?${params}`)
        if (!res.ok) throw new Error('Failed to fetch')
        const json: ApiResponse = await res.json()
        setMessages(json.data)
        setTotal(json.total)
        setUnreadCount(json.unreadCount)
        setTotalPages(json.totalPages)
      } catch {
        toast('error', 'Failed to load messages')
      } finally {
        setLoading(false)
      }
    })()
  }, [page, filters, refreshKey, toast])

  function handleFilterChange(values: Record<string, string>) {
    setFilters(values)
    setPage(1)
  }

  async function toggleRead(msg: ContactMessage) {
    try {
      const res = await fetch('/api/admin/contacts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: msg.id, read: !msg.read }),
      })
      if (!res.ok) throw new Error('Failed')
      setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, read: !m.read } : m)))
      setUnreadCount((prev) => (msg.read ? prev + 1 : prev - 1))
      toast('success', msg.read ? 'Marked as unread' : 'Marked as read')
    } catch {
      toast('error', 'Failed to update message')
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch('/api/admin/contacts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deleteTarget.id }),
      })
      if (!res.ok) throw new Error('Failed')
      toast('success', 'Message deleted')
      setDeleteTarget(null)
      if (!deleteTarget.read) setUnreadCount((prev) => Math.max(0, prev - 1))
      setRefreshKey((k) => k + 1)
    } catch {
      toast('error', 'Failed to delete message')
    } finally {
      setDeleting(false)
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const columns: Column<ContactMessage>[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (msg) => (
        <div>
          <div className={`font-medium ${msg.read ? 'text-text-secondary' : 'text-text-primary'}`}>
            {!msg.read && <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-2" />}
            {msg.name}
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      render: (msg) => (
        <span className="text-text-secondary text-sm">{msg.email}</span>
      ),
    },
    {
      key: 'subject',
      label: 'Subject',
      sortable: true,
      render: (msg) => (
        <span className={`${msg.read ? 'text-text-muted' : 'text-text-primary font-medium'} text-sm`}>
          {msg.subject}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Date',
      sortable: true,
      render: (msg) => (
        <span className="text-text-secondary text-sm">{formatDate(msg.createdAt)}</span>
      ),
    },
    {
      key: 'read',
      label: 'Status',
      render: (msg) => (
        <Badge variant={msg.read ? 'default' : 'info'} size="sm">
          {msg.read ? 'Read' : 'Unread'}
        </Badge>
      ),
    },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Contact Messages</h1>
          <p className="text-text-secondary mt-1">Manage incoming contact messages</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <StatsCard title="Total Messages" value={total} icon={Mail} color="blue" />
        <StatsCard title="Unread" value={unreadCount} icon={Eye} color="yellow" />
      </div>

      <div className="mb-4">
        <SearchFilter
          filters={readFilters}
          values={filters}
          onChange={handleFilterChange}
        />
      </div>

      <DataTable<ContactMessage>
        columns={columns}
        data={messages}
        total={total}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        loading={loading}
        emptyMessage="No messages found"
        onRowClick={(msg) => setExpandedId(expandedId === msg.id ? null : msg.id)}
        actions={(msg) => (
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); toggleRead(msg) }}
              className="p-1.5 rounded-lg hover:bg-surface-tertiary text-text-muted hover:text-primary-600 transition-colors"
              title={msg.read ? 'Mark as unread' : 'Mark as read'}
            >
              {msg.read ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setDeleteTarget(msg) }}
              className="p-1.5 rounded-lg hover:bg-surface-tertiary text-text-muted hover:text-red-600 transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setExpandedId(expandedId === msg.id ? null : msg.id) }}
              className="p-1.5 rounded-lg hover:bg-surface-tertiary text-text-muted hover:text-text-primary transition-colors"
            >
              {expandedId === msg.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        )}
      />

      {expandedId && messages.find((m) => m.id === expandedId) && (
        <Card className="mt-4">
          <CardContent className="p-6">
            {(() => {
              const msg = messages.find((m) => m.id === expandedId)!
              return (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-text-primary">{msg.subject}</h3>
                      <p className="text-sm text-text-muted mt-1">
                        From: {msg.name} ({msg.email}) — {formatDate(msg.createdAt)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleRead(msg)}
                        className="p-2 rounded-lg hover:bg-surface-tertiary text-text-muted hover:text-primary-600 transition-colors"
                      >
                        {msg.read ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => { setDeleteTarget(msg); setExpandedId(null) }}
                        className="p-2 rounded-lg hover:bg-surface-tertiary text-text-muted hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-text-primary">
                    {msg.message}
                  </div>
                </div>
              )
            })()}
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Message"
        message={`Are you sure you want to delete the message from ${deleteTarget?.name}? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  )
}
