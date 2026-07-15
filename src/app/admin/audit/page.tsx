'use client'

import { useState, useEffect } from 'react'
import { Shield } from 'lucide-react'
import { DataTable, Column } from '@/components/admin/data-table'
import { SearchFilter, FilterOption } from '@/components/admin/search-filter'
import { StatsCard } from '@/components/admin/stats-card'
import { useToast } from '@/components/admin/toast'
import { Badge } from '@/components/ui/badge'

interface AuditLog {
  id: string
  userId: string
  action: string
  entity: string
  entityId: string
  oldData: string | null
  newData: string | null
  ip: string | null
  createdAt: string
  user: { id: string; name: string | null; email: string; role: string }
}

interface ApiResponse {
  data: AuditLog[]
  total: number
  page: number
  totalPages: number
}

const ACTION_COLORS: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
  CREATE: 'success',
  UPDATE: 'info',
  DELETE: 'error',
  LOGIN: 'warning',
  LOGOUT: 'default',
}

const actionFilters: FilterOption[] = [
  {
    key: 'action',
    label: 'All Actions',
    type: 'select',
    options: [
      { value: 'CREATE', label: 'Create' },
      { value: 'UPDATE', label: 'Update' },
      { value: 'DELETE', label: 'Delete' },
      { value: 'LOGIN', label: 'Login' },
      { value: 'LOGOUT', label: 'Logout' },
    ],
  },
  {
    key: 'entity',
    label: 'All Entities',
    type: 'select',
    options: [
      { value: 'user', label: 'User' },
      { value: 'match', label: 'Match' },
      { value: 'prediction', label: 'Prediction' },
      { value: 'league', label: 'League' },
      { value: 'team', label: 'Team' },
      { value: 'newsarticle', label: 'News Article' },
      { value: 'payment', label: 'Payment' },
      { value: 'notification', label: 'Notification' },
    ],
  },
  { key: 'dateFrom', label: 'From Date', type: 'date' },
  { key: 'dateTo', label: 'To Date', type: 'date' },
]

export default function AuditLogPage() {
  const { toast } = useToast()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<Record<string, string>>({})

  const limit = 20

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        params.set('page', String(page))
        params.set('limit', String(limit))
        if (filters.action) params.set('action', filters.action)
        if (filters.entity) params.set('entity', filters.entity)
        if (filters.dateFrom) params.set('dateFrom', filters.dateFrom)
        if (filters.dateTo) params.set('dateTo', filters.dateTo)

        const res = await fetch(`/api/admin/audit?${params}`)
        if (!res.ok) throw new Error('Failed to fetch audit logs')
        const json: ApiResponse = await res.json()
        setLogs(json.data)
        setTotal(json.total)
        setTotalPages(json.totalPages)
      } catch {
        toast('error', 'Failed to load audit logs')
      } finally {
        setLoading(false)
      }
    })()
  }, [page, filters, toast])

  function handleSearch() {
    setPage(1)
  }

  function handleFilterChange(values: Record<string, string>) {
    setFilters(values)
    setPage(1)
  }

  function handlePageChange(newPage: number) {
    setPage(newPage)
  }

  function formatDateTime(dateStr: string) {
    return new Date(dateStr).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const columns: Column<AuditLog>[] = [
    {
      key: 'createdAt',
      label: 'Timestamp',
      sortable: true,
      render: (log) => (
        <span className="text-text-secondary text-xs whitespace-nowrap">{formatDateTime(log.createdAt)}</span>
      ),
    },
    {
      key: 'user',
      label: 'User',
      render: (log) => (
        <div>
          <p className="font-medium text-sm">{log.user.name || 'Unnamed'}</p>
          <p className="text-text-muted text-xs">{log.user.email}</p>
        </div>
      ),
    },
    {
      key: 'action',
      label: 'Action',
      sortable: true,
      render: (log) => {
        const color = ACTION_COLORS[log.action] || 'default'
        return (
          <Badge variant={color} size="sm">
            {log.action}
          </Badge>
        )
      },
    },
    {
      key: 'entity',
      label: 'Entity',
      sortable: true,
      render: (log) => (
        <span className="text-text-secondary text-sm capitalize">{log.entity}</span>
      ),
    },
    {
      key: 'entityId',
      label: 'Entity ID',
      render: (log) => (
        <span className="text-text-muted text-xs font-mono">{log.entityId.slice(0, 12)}...</span>
      ),
    },
    {
      key: 'ip',
      label: 'IP Address',
      render: (log) => (
        <span className="text-text-muted text-xs">{log.ip || '—'}</span>
      ),
    },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Audit Log</h1>
        <p className="text-text-secondary mt-1">Track all admin actions and system events</p>
      </div>

      <div className="mb-6">
        <StatsCard title="Total Actions" value={total} icon={Shield} color="purple" />
      </div>

      <div className="mb-4">
        <SearchFilter
          searchPlaceholder=""
          filters={actionFilters}
          values={filters}
          onChange={handleFilterChange}
          onSearch={handleSearch}
        />
      </div>

      <DataTable<AuditLog>
        columns={columns}
        data={logs}
        total={total}
        page={page}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        loading={loading}
        emptyMessage="No audit logs found"
      />
    </div>
  )
}
