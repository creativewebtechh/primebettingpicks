'use client'

import { useState, useEffect } from 'react'
import { Users, Pencil, Trash2, ShieldCheck } from 'lucide-react'
import { DataTable, Column } from '@/components/admin/data-table'
import { SearchFilter, FilterOption } from '@/components/admin/search-filter'
import { StatsCard } from '@/components/admin/stats-card'
import { ConfirmDialog } from '@/components/admin/confirm-dialog'
import { useToast } from '@/components/admin/toast'
import { Badge } from '@/components/ui/badge'

interface User {
  id: string
  name: string | null
  email: string
  role: string
  avatar: string | null
  emailVerified: Date | null
  createdAt: string
  updatedAt: string
  _count?: { payment: number; fixture: number; notification: number }
}

interface ApiResponse {
  data: User[]
  total: number
  page: number
  totalPages: number
}

const roleFilters: FilterOption[] = [
  {
    key: 'role',
    label: 'All Roles',
    type: 'select',
    options: [
      { value: 'admin', label: 'Admin' },
      { value: 'editor', label: 'Editor' },
      { value: 'moderator', label: 'Moderator' },
      { value: 'user', label: 'User' },
    ],
  },
]

const roleBadgeVariant: Record<string, string> = {
  admin: 'error',
  editor: 'info',
  moderator: '',
  user: 'default',
}

export default function AdminUsersPage() {
  const { toast } = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [sortBy, setSortBy] = useState<string>('createdAt')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const limit = 20

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        params.set('page', String(page))
        params.set('limit', String(limit))
        if (filters.search) params.set('search', filters.search)
        if (filters.role) params.set('role', filters.role)

        const res = await fetch(`/api/admin/users?${params}`)
        if (!res.ok) throw new Error('Failed to fetch users')
        const json: ApiResponse = await res.json()
        setUsers(json.data)
        setTotal(json.total)
        setTotalPages(json.totalPages)
      } catch {
        toast('error', 'Failed to load users')
      } finally {
        setLoading(false)
      }
    })()
  }, [page, filters, toast, refreshKey])

  function handleSearch() {
    setPage(1)
  }

  function handleFilterChange(values: Record<string, string>) {
    setFilters(values)
    setPage(1)
  }

  function handleSort(key: string, direction: 'asc' | 'desc') {
    setSortBy(key)
    setSortDir(direction)
  }

  function handlePageChange(newPage: number) {
    setPage(newPage)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/users/${deleteTarget.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error || 'Failed to delete user')
      }
      toast('success', `Deleted ${deleteTarget.name || deleteTarget.email}`)
      setDeleteTarget(null)
      setRefreshKey(k => k + 1)
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Failed to delete user')
    } finally {
      setDeleting(false)
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const sortedUsers = [...users].sort((a, b) => {
    const aVal = a[sortBy as keyof User] ?? ''
    const bVal = b[sortBy as keyof User] ?? ''
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
    }
    return 0
  })

  const columns: Column<User>[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (user) => (
        <div className="flex items-center gap-3">
          {user.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-surface-tertiary flex items-center justify-center text-xs font-medium text-text-muted">
              {(user.name || user.email)?.[0]?.toUpperCase() ?? '?'}
            </div>
          )}
          <span className="font-medium">{user.name || 'Unnamed'}</span>
        </div>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      render: (user) => (
        <span className="text-text-secondary">{user.email}</span>
      ),
    },
    {
      key: 'role',
      label: 'Role',
      sortable: true,
      render: (user) => {
        const variant = roleBadgeVariant[user.role] || 'default'
        if (user.role === 'moderator') {
          return (
            <Badge size="sm" className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
              {user.role}
            </Badge>
          )
        }
        return <Badge variant={variant as 'default' | 'success' | 'warning' | 'error' | 'info'} size="sm">{user.role}</Badge>
      },
    },
    {
      key: 'createdAt',
      label: 'Joined',
      sortable: true,
      render: (user) => (
        <span className="text-text-secondary">{formatDate(user.createdAt)}</span>
      ),
    },
    {
      key: 'emailVerified',
      label: 'Verified',
      render: (user) =>
        user.emailVerified ? (
          <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400 text-sm">
            <ShieldCheck className="w-4 h-4" />
            Yes
          </span>
        ) : (
          <span className="text-text-muted text-sm">No</span>
        ),
    },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Users</h1>
          <p className="text-text-secondary mt-1">Manage platform users</p>
        </div>
      </div>

      <div className="mb-6">
        <StatsCard title="Total Users" value={total} icon={Users} color="blue" />
      </div>

      <div className="mb-4">
        <SearchFilter
          searchPlaceholder="Search by name or email…"
          filters={roleFilters}
          values={filters}
          onChange={handleFilterChange}
          onSearch={handleSearch}
        />
      </div>

      <DataTable<User>
        columns={columns}
        data={sortedUsers}
        total={total}
        page={page}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        onSort={handleSort}
        loading={loading}
        emptyMessage="No users found"
        actions={(user) => (
          <div className="flex items-center justify-end gap-1">
            <button className="p-1.5 rounded-lg hover:bg-surface-tertiary text-text-muted hover:text-primary-600 transition-colors">
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDeleteTarget(user)}
              className="p-1.5 rounded-lg hover:bg-surface-tertiary text-text-muted hover:text-red-600 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete User"
        message={`Are you sure you want to delete ${deleteTarget?.name || deleteTarget?.email}? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  )
}
