'use client'

import Link from 'next/link'
import { memo, useState, useCallback } from 'react'
import { Menu, X, ChevronDown, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/common/theme-toggle'
import { useAuth } from '@/providers/auth-provider'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  {
    label: 'Predictions',
    href: '/predictions',
    children: [
      { label: 'All Predictions', href: '/predictions' },
      { label: 'Today\'s Picks', href: '/predictions?filter=today' },
      { label: 'Expert Picks', href: '/predictions?filter=experts' },
      { label: 'Accumulators', href: '/predictions?filter=accumulators' },
    ],
  },
  {
    label: 'Leagues',
    href: '/leagues',
    children: [
      { label: 'Premier League', href: '/leagues/premier-league' },
      { label: 'La Liga', href: '/leagues/la-liga' },
      { label: 'Serie A', href: '/leagues/serie-a' },
      { label: 'Bundesliga', href: '/leagues/bundesliga' },
      { label: 'Ligue 1', href: '/leagues/ligue-1' },
      { label: 'Champions League', href: '/leagues/champions-league' },
    ],
  },
  { label: 'Statistics', href: '/statistics' },
  { label: 'Teams', href: '/teams' },
  { label: 'Live Scores', href: '/live-scores' },
  { label: 'Fixtures', href: '/fixtures' },
  { label: 'Results', href: '/results' },
  { label: 'News', href: '/news' },
  { label: 'Bookmakers', href: '/bookmakers' },
]

export const Header = memo(function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const { user, logout } = useAuth()

  const toggleMobile = useCallback(() => setMobileOpen((prev) => !prev), [])
  const toggleSearch = useCallback(() => setSearchOpen((prev) => !prev), [])

  return (
    <header className="sticky top-0 z-50 bg-surface border-b border-border">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">PB</span>
            </div>
            <span className="font-bold text-xl text-text-primary hidden sm:block">
              Prime<span className="text-primary-600">BettingPicks</span>
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <div
                key={item.href}
                className="relative"
                onMouseEnter={() => item.children && setOpenDropdown(item.label)}
                onMouseLeave={() => setOpenDropdown(null)}
              >
                <Link
                  href={item.href}
                  className={cn(
                    'px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1',
                    'text-text-secondary hover:text-text-primary hover:bg-surface-tertiary'
                  )}
                >
                  {item.label}
                  {item.children && <ChevronDown className="w-3 h-3" />}
                </Link>
                {item.children && openDropdown === item.label && (
                  <div className="absolute top-full left-0 mt-1 w-48 bg-surface border border-border rounded-xl shadow-lg py-2 animate-in fade-in" style={{ willChange: 'transform' }}>
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className="block px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-tertiary"
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleSearch}
              className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-tertiary lg:hidden"
            >
              <Search className="w-5 h-5" />
            </button>
            <ThemeToggle />
            {user ? (
              <div className="flex items-center gap-2">
                <Link href="/profile">
                  <Button variant="ghost" size="sm">{user.name || user.email}</Button>
                </Link>
                {user.role === 'admin' || user.role === 'superadmin' ? (
                  <Link href="/admin">
                    <Button variant="outline" size="sm">Admin</Button>
                  </Link>
                ) : null}
                <Button variant="ghost" size="sm" onClick={logout}>Logout</Button>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm">Sign In</Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">Sign Up</Button>
                </Link>
              </div>
            )}
            <button
              onClick={toggleMobile}
              className="lg:hidden p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-tertiary"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {searchOpen && (
        <div className="lg:hidden border-t border-border p-4">
          <form action="/search" method="GET">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                name="q"
                placeholder="Search matches, teams, leagues..."
                className="w-full h-10 pl-10 pr-4 rounded-lg border border-border bg-surface-tertiary text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </form>
        </div>
      )}

      {mobileOpen && (
        <div className="lg:hidden border-t border-border max-h-[80vh] overflow-y-auto" style={{ willChange: 'transform' }}>
          <div className="p-4 space-y-1">
            {NAV_ITEMS.map((item) => (
              <div key={item.href}>
                <Link
                  href={item.href}
                  className="block px-3 py-2 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-tertiary rounded-lg"
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </Link>
                {item.children?.map((child) => (
                  <Link
                    key={child.href}
                    href={child.href}
                    className="block px-6 py-2 text-sm text-text-muted hover:text-text-primary hover:bg-surface-tertiary rounded-lg"
                    onClick={() => setMobileOpen(false)}
                  >
                    {child.label}
                  </Link>
                ))}
              </div>
            ))}
            {!user && (
              <div className="pt-4 space-y-2">
                <Link href="/login" onClick={() => setMobileOpen(false)}>
                  <Button variant="outline" className="w-full">Sign In</Button>
                </Link>
                <Link href="/register" onClick={() => setMobileOpen(false)}>
                  <Button className="w-full">Sign Up</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
})
