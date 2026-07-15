'use client'

import { useState, useEffect } from 'react'
import { Calendar, Zap, Trophy, Clock, Filter } from 'lucide-react'
import { DataTable, type Column } from '@/components/admin/data-table'
import { SearchFilter, type FilterOption } from '@/components/admin/search-filter'
import { StatsCard } from '@/components/admin/stats-card'
import { useToast } from '@/components/admin/toast'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

interface Team {
  id: string
  name: string
  shortName: string
}

interface League {
  id: string
  name: string
  slug: string
}

interface Match {
  id: string
  leagueId: string
  homeTeamId: string
  awayTeamId: string
  status: string
  date: string
  homeScore: number | null
  awayScore: number | null
  team_match_homeTeamIdToteam: Team
  team_match_awayTeamIdToteam: Team
  league: League
}

interface MatchesResponse {
  data: Match[]
  total: number
  page: number
  totalPages: number
}

interface Stats {
  total: number
  live: number
  upcoming: number
  finished: number
}

const STATUS_CONFIG: Record<string, { label: string; color: string; dotColor: string }> = {
  live: { label: 'Live', color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400', dotColor: 'bg-red-500' },
  upcoming: { label: 'Upcoming', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400', dotColor: '' },
  finished: { label: 'Finished', color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400', dotColor: '' },
  postponed: { label: 'Postponed', color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400', dotColor: '' },
  cancelled: { label: 'Cancelled', color: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400', dotColor: '' },
}

const STATUS_CHIPS = [
  { key: 'live', label: 'Live', color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800' },
  { key: 'upcoming', label: 'Upcoming', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800' },
  { key: 'finished', label: 'Finished', color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800' },
  { key: 'postponed', label: 'Postponed', color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800' },
  { key: 'cancelled', label: 'Cancelled', color: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-700' },
]

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.upcoming
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
      {status === 'live' && <span className={`relative flex h-2 w-2`}>
        <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${cfg.dotColor}`} />
        <span className={`relative inline-flex h-2 w-2 rounded-full ${cfg.dotColor}`} />
      </span>}
      {cfg.label}
    </span>
  )
}

export default function AdminMatchesPage() {
  const { toast } = useToast()

  const [matches, setMatches] = useState<Match[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)

  const [stats, setStats] = useState<Stats>({ total: 0, live: 0, upcoming: 0, finished: 0 })
  const [statsLoading, setStatsLoading] = useState(true)

  const [leagues, setLeagues] = useState<League[]>([])
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [activeStatus, setActiveStatus] = useState<string>('')
  const [syncing, setSyncing] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/admin/leagues?limit=100')
        if (!res.ok) return
        const json = await res.json()
        setLeagues(json.data.map((l: { id: string; name: string; slug: string }) => ({ id: l.id, name: l.name, slug: l.slug })))
      } catch {
        // silently fail
      }
    })()
  }, [])

  useEffect(() => {
    ;(async () => {
      setStatsLoading(true)
      try {
        const [totalRes, liveRes, upcomingRes, finishedRes] = await Promise.all([
          fetch('/api/admin/matches?limit=1'),
          fetch('/api/admin/matches?limit=1&status=live'),
          fetch('/api/admin/matches?limit=1&status=upcoming'),
          fetch('/api/admin/matches?limit=1&status=finished'),
        ])

        const [totalJson, liveJson, upcomingJson, finishedJson] = await Promise.all([
          totalRes.json(),
          liveRes.json(),
          upcomingRes.json(),
          finishedRes.json(),
        ])

        setStats({
          total: totalJson.total ?? 0,
          live: liveJson.total ?? 0,
          upcoming: upcomingJson.total ?? 0,
          finished: finishedJson.total ?? 0,
        })
      } catch {
        // silently fail for stats
      } finally {
        setStatsLoading(false)
      }
    })()
  }, [])

  useEffect(() => {
    const search = filters.search ?? ''
    const league = filters.league ?? ''
    ;(async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        params.set('page', String(page))
        params.set('limit', '20')
        if (search) params.set('search', search)
        if (league) params.set('league', league)
        if (activeStatus) params.set('status', activeStatus)

        const res = await fetch(`/api/admin/matches?${params}`)
        if (!res.ok) throw new Error('Failed to fetch matches')
        const json: MatchesResponse = await res.json()

        setMatches(json.data)
        setTotal(json.total)
        setPage(json.page)
        setTotalPages(json.totalPages)
      } catch {
        toast('error', 'Failed to load matches')
      } finally {
        setLoading(false)
      }
    })()
  }, [page, filters, activeStatus, refreshKey, toast])

  function handleStatusChip(status: string) {
    setActiveStatus(prev => (prev === status ? '' : status))
    setPage(1)
  }

  function handleFilterChange(values: Record<string, string>) {
    setFilters(values)
    setPage(1)
  }

  async function handleSync() {
    setSyncing(true)
    try {
      const leagueSlug = filters.league ?? ''
      const res = await fetch('/api/football/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'fixtures', leagueSlug: leagueSlug || undefined }),
      })
      if (!res.ok) throw new Error('Sync failed')
      toast('success', 'Fixtures synced successfully')
      setRefreshKey(k => k + 1)
    } catch {
      toast('error', 'Failed to sync fixtures')
    } finally {
      setSyncing(false)
    }
  }

  function handleSyncLive() {
    setSyncing(true)
    fetch('/api/football/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'live' }),
    })
      .then(res => {
        if (!res.ok) throw new Error()
        toast('success', 'Live scores updated')
        setRefreshKey(k => k + 1)
      })
      .catch(() => toast('error', 'Failed to update live scores'))
      .finally(() => setSyncing(false))
  }

  const leagueFilterOptions: FilterOption[] = [
    {
      key: 'league',
      label: 'League',
      type: 'select',
      options: leagues.map(l => ({ value: l.slug, label: l.name })),
    },
  ]

  const columns: Column<Match>[] = [
    {
      key: 'date',
      label: 'Date',
      sortable: true,
      render: (m) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium">{formatDate(m.date)}</span>
          <span className="text-xs text-text-muted">{formatTime(m.date)}</span>
        </div>
      ),
    },
    {
      key: 'homeTeam',
      label: 'Home Team',
      render: (m) => (
        <span className="font-medium">{m.team_match_homeTeamIdToteam?.shortName ?? m.team_match_homeTeamIdToteam?.name ?? '—'}</span>
      ),
    },
    {
      key: 'score',
      label: 'Score',
      className: 'text-center',
      render: (m) => (
        <span className="font-mono font-bold text-lg">
          {m.homeScore != null && m.awayScore != null
            ? `${m.homeScore} - ${m.awayScore}`
            : '—'}
        </span>
      ),
    },
    {
      key: 'awayTeam',
      label: 'Away Team',
      render: (m) => (
        <span className="font-medium">{m.team_match_awayTeamIdToteam?.shortName ?? m.team_match_awayTeamIdToteam?.name ?? '—'}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (m) => <StatusBadge status={m.status} />,
    },
    {
      key: 'league',
      label: 'League',
      render: (m) => (
        <span className="text-text-secondary">{m.league?.name ?? '—'}</span>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Matches</h1>
          <p className="text-text-secondary mt-1">Manage and monitor football matches</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleSyncLive}
            loading={syncing}
          >
            Sync Live
          </Button>
          <Button onClick={handleSync} loading={syncing}>
            Sync Fixtures
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-surface p-4">
              <Skeleton className="h-4 w-24 mb-3" />
              <Skeleton className="h-8 w-16" />
            </div>
          ))
        ) : (
          <>
            <StatsCard title="Total Matches" value={stats.total} icon={Trophy} color="blue" />
            <StatsCard title="Live Now" value={stats.live} icon={Zap} color="red" subtitle="in progress" />
            <StatsCard title="Upcoming" value={stats.upcoming} icon={Clock} color="purple" />
            <StatsCard title="Finished" value={stats.finished} icon={Calendar} color="green" />
          </>
        )}
      </div>

      <div className="space-y-3">
        <SearchFilter
          searchPlaceholder="Search teams..."
          filters={leagueFilterOptions}
          values={filters}
          onChange={handleFilterChange}
          onSearch={() => { setPage(1); setRefreshKey(k => k + 1) }}
        />

        <div className="flex flex-wrap items-center gap-2">
          <Filter className="h-4 w-4 text-text-muted" />
          {STATUS_CHIPS.map(chip => (
            <button
              key={chip.key}
              onClick={() => handleStatusChip(chip.key)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                activeStatus === chip.key
                  ? chip.color + ' ring-2 ring-offset-1 ring-current'
                  : 'border-border text-text-secondary hover:bg-surface-tertiary'
              }`}
            >
              {chip.key === 'live' && <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 animate-ping" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
              </span>}
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={matches}
        total={total}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        loading={loading}
        emptyMessage="No matches found. Try adjusting your filters or sync fixtures."
      />
    </div>
  )
}
