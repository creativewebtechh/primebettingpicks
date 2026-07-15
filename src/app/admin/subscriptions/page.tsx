'use client'

import { useState, useEffect } from 'react'
import {
  CreditCard, Plus, RefreshCw, XCircle, Trash2,
  ChevronDown, Search as SearchIcon,
} from 'lucide-react'
import { DataTable, Column } from '@/components/admin/data-table'
import { SearchFilter, FilterOption } from '@/components/admin/search-filter'
import { StatsCard } from '@/components/admin/stats-card'
import { ConfirmDialog } from '@/components/admin/confirm-dialog'
import { useToast } from '@/components/admin/toast'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface SubscriptionUser {
  id: string
  name: string | null
  email: string
}

interface Subscription {
  id: string
  userId: string
  plan: string
  status: string
  currentPeriodStart: string | null
  currentPeriodEnd: string | null
  createdAt: string
  user: SubscriptionUser
}

interface ApiResponse {
  data: Subscription[]
  total: number
  page: number
  totalPages: number
}

interface UserSearchResult {
  id: string
  name: string | null
  email: string
}

const statusFilters: FilterOption[] = [
  {
    key: 'status',
    label: 'All Statuses',
    type: 'select',
    options: [
      { value: 'active', label: 'Active' },
      { value: 'cancelled', label: 'Cancelled' },
      { value: 'expired', label: 'Expired' },
    ],
  },
  {
    key: 'plan',
    label: 'All Plans',
    type: 'select',
    options: [
      { value: 'basic', label: 'Basic' },
      { value: 'premium', label: 'Premium' },
      { value: 'vip', label: 'VIP' },
    ],
  },
]

const planVariant: Record<string, 'info' | 'success' | 'warning' | 'default' | 'error'> = {
  basic: 'default',
  premium: 'info',
  vip: 'success',
}

const statusVariant: Record<string, 'success' | 'error' | 'warning' | 'default'> = {
  active: 'success',
  cancelled: 'error',
  expired: 'warning',
}

export default function AdminSubscriptionsPage() {
  const { toast } = useToast()
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [refreshKey, setRefreshKey] = useState(0)

  const [deleteTarget, setDeleteTarget] = useState<Subscription | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [userSearch, setUserSearch] = useState('')
  const [userResults, setUserResults] = useState<UserSearchResult[]>([])
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null)
  const [newPlan, setNewPlan] = useState('basic')
  const [newDuration, setNewDuration] = useState(30)

  const [stats, setStats] = useState({ total: 0, active: 0, cancelled: 0 })

  const limit = 20

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        const params = new URLSearchParams()
        params.set('page', String(page))
        params.set('limit', String(limit))
        if (filters.status) params.set('status', filters.status)
        if (filters.plan) params.set('plan', filters.plan)

        const res = await fetch(`/api/admin/subscriptions?${params}`)
        if (!res.ok) throw new Error('Failed to fetch')
        const json: ApiResponse = await res.json()
        setSubscriptions(json.data)
        setTotal(json.total)
        setTotalPages(json.totalPages)
      } catch {
        toast('error', 'Failed to load subscriptions')
      } finally {
        setLoading(false)
      }
    })()
  }, [page, filters, refreshKey, toast])

  useEffect(() => {
    ;(async () => {
      try {
        const [activeRes, cancelledRes] = await Promise.all([
          fetch('/api/admin/subscriptions?status=active&limit=1'),
          fetch('/api/admin/subscriptions?status=cancelled&limit=1'),
        ])
        const activeJson = activeRes.ok ? await activeRes.json() : { total: 0 }
        const cancelledJson = cancelledRes.ok ? await cancelledRes.json() : { total: 0 }
        setStats({
          total: total || activeJson.total + cancelledJson.total,
          active: activeJson.total,
          cancelled: cancelledJson.total,
        })
      } catch {
        // ignore stats error
      }
    })()
  }, [total, refreshKey])

  useEffect(() => {
    if (!showCreateModal || !userSearch) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUserResults([])
      return
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/users?search=${encodeURIComponent(userSearch)}&limit=5`)
        if (res.ok) {
          const json = await res.json()
          setUserResults(json.data)
        }
      } catch {
        // ignore
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [userSearch, showCreateModal])

  function handleFilterChange(values: Record<string, string>) {
    setFilters(values)
    setPage(1)
  }

  async function handleCreate() {
    if (!selectedUser) {
      toast('warning', 'Please select a user')
      return
    }
    setCreateLoading(true)
    try {
      const res = await fetch('/api/admin/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUser.id, plan: newPlan, duration: newDuration }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error || 'Failed to create')
      }
      toast('success', `Subscription created for ${selectedUser.email}`)
      setShowCreateModal(false)
      setSelectedUser(null)
      setUserSearch('')
      setNewPlan('basic')
      setNewDuration(30)
      setRefreshKey((k) => k + 1)
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Failed to create subscription')
    } finally {
      setCreateLoading(false)
    }
  }

  async function handleAction(sub: Subscription, action: string, plan?: string, duration?: number) {
    setOpenMenuId(null)
    try {
      const res = await fetch('/api/admin/subscriptions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: sub.id, action, plan, duration }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error || 'Failed')
      }
      toast('success', `Subscription ${action === 'cancel' ? 'cancelled' : action === 'renew' ? 'renewed' : 'updated'}`)
      setRefreshKey((k) => k + 1)
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Failed')
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/subscriptions?id=${deleteTarget.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error || 'Failed to delete')
      }
      toast('success', 'Subscription deleted')
      setDeleteTarget(null)
      setRefreshKey((k) => k + 1)
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Failed to delete')
    } finally {
      setDeleting(false)
    }
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const columns: Column<Subscription>[] = [
    {
      key: 'user',
      label: 'User',
      sortable: false,
      render: (sub) => (
        <div>
          <div className="font-medium text-text-primary">{sub.user?.name || 'Unnamed'}</div>
          <div className="text-xs text-text-muted">{sub.user?.email}</div>
        </div>
      ),
    },
    {
      key: 'plan',
      label: 'Plan',
      sortable: true,
      render: (sub) => (
        <Badge variant={planVariant[sub.plan] || 'default'} size="sm">
          {sub.plan}
        </Badge>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (sub) => (
        <Badge variant={statusVariant[sub.status] || 'default'} size="sm">
          {sub.status}
        </Badge>
      ),
    },
    {
      key: 'currentPeriodStart',
      label: 'Period Start',
      sortable: true,
      render: (sub) => (
        <span className="text-text-secondary text-sm">{formatDate(sub.currentPeriodStart)}</span>
      ),
    },
    {
      key: 'currentPeriodEnd',
      label: 'Period End',
      sortable: true,
      render: (sub) => (
        <span className="text-text-secondary text-sm">{formatDate(sub.currentPeriodEnd)}</span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Created',
      sortable: true,
      render: (sub) => (
        <span className="text-text-secondary text-sm">{formatDate(sub.createdAt)}</span>
      ),
    },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Subscriptions</h1>
          <p className="text-text-secondary mt-1">Manage user subscriptions</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Subscription
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatsCard title="Total Subscriptions" value={total} icon={CreditCard} color="blue" />
        <StatsCard title="Active" value={stats.active} icon={CreditCard} color="green" />
        <StatsCard title="Cancelled" value={stats.cancelled} icon={XCircle} color="red" />
      </div>

      <div className="mb-4">
        <SearchFilter
          filters={statusFilters}
          values={filters}
          onChange={handleFilterChange}
        />
      </div>

      <div className="relative">
        <DataTable<Subscription>
          columns={columns}
          data={subscriptions}
          total={total}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          loading={loading}
          emptyMessage="No subscriptions found"
          actions={(sub) => (
            <div className="relative flex items-center justify-end gap-1">
              <button
                onClick={() => setOpenMenuId(openMenuId === sub.id ? null : sub.id)}
                className="p-1.5 rounded-lg hover:bg-surface-tertiary text-text-muted hover:text-primary-600 transition-colors"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleAction(sub, 'renew', undefined, 30)}
                className="p-1.5 rounded-lg hover:bg-surface-tertiary text-text-muted hover:text-green-600 transition-colors"
                title="Renew"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setDeleteTarget(sub)}
                className="p-1.5 rounded-lg hover:bg-surface-tertiary text-text-muted hover:text-red-600 transition-colors"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              {openMenuId === sub.id && (
                <div className="absolute right-0 top-full mt-1 z-30 w-44 bg-surface border border-border rounded-xl shadow-xl py-1">
                  {sub.status !== 'cancelled' && (
                    <button
                      onClick={() => handleAction(sub, 'cancel')}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-surface-tertiary text-red-600 transition-colors"
                    >
                      Cancel Subscription
                    </button>
                  )}
                  <button
                    onClick={() => handleAction(sub, 'update', 'basic')}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-surface-tertiary text-text-primary transition-colors"
                  >
                    Change to Basic
                  </button>
                  <button
                    onClick={() => handleAction(sub, 'update', 'premium')}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-surface-tertiary text-text-primary transition-colors"
                  >
                    Change to Premium
                  </button>
                  <button
                    onClick={() => handleAction(sub, 'update', 'vip')}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-surface-tertiary text-text-primary transition-colors"
                  >
                    Change to VIP
                  </button>
                </div>
              )}
            </div>
          )}
        />
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-surface rounded-xl border border-border shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-lg font-semibold text-text-primary">Create Subscription</h2>
              <button
                onClick={() => { setShowCreateModal(false); setSelectedUser(null); setUserSearch('') }}
                className="p-1.5 rounded-lg hover:bg-surface-tertiary text-text-muted transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">User</label>
                {selectedUser ? (
                  <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-surface-secondary">
                    <div>
                      <div className="text-sm font-medium text-text-primary">{selectedUser.name || 'Unnamed'}</div>
                      <div className="text-xs text-text-muted">{selectedUser.email}</div>
                    </div>
                    <button
                      onClick={() => setSelectedUser(null)}
                      className="p-1 rounded hover:bg-surface-tertiary text-text-muted"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted pointer-events-none" />
                    <input
                      type="text"
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      placeholder="Search by name or email..."
                      className="w-full h-10 pl-9 pr-4 rounded-lg border border-border bg-surface text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    {userResults.length > 0 && (
                      <div className="absolute top-full mt-1 w-full bg-surface border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
                        {userResults.map((u) => (
                          <button
                            key={u.id}
                            onClick={() => { setSelectedUser(u); setUserSearch(''); setUserResults([]) }}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-surface-tertiary transition-colors"
                          >
                            <div className="font-medium text-text-primary">{u.name || 'Unnamed'}</div>
                            <div className="text-xs text-text-muted">{u.email}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Plan</label>
                <select
                  value={newPlan}
                  onChange={(e) => setNewPlan(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="basic">Basic</option>
                  <option value="premium">Premium</option>
                  <option value="vip">VIP</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Duration</label>
                <select
                  value={newDuration}
                  onChange={(e) => setNewDuration(Number(e.target.value))}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value={30}>30 days</option>
                  <option value={90}>90 days</option>
                  <option value={365}>365 days</option>
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-surface-secondary rounded-b-xl">
              <Button
                variant="ghost"
                onClick={() => { setShowCreateModal(false); setSelectedUser(null); setUserSearch('') }}
              >
                Cancel
              </Button>
              <Button onClick={handleCreate} loading={createLoading}>
                Create
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Subscription"
        message={`Are you sure you want to delete the subscription for ${deleteTarget?.user?.email}? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  )
}
