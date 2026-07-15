'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, CalendarRange, TrendingUp, Shield,
  Users, FileText, Search, BarChart3, Megaphone, Menu, X,
  ShieldCheck, Bell, Settings, CreditCard, Mail, Star,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const ADMIN_NAV = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Matches', href: '/admin/matches', icon: CalendarRange },
  { label: 'Predictions', href: '/admin/predictions', icon: TrendingUp },
  { label: 'Leagues', href: '/admin/leagues', icon: Shield },
  { label: 'Teams', href: '/admin/teams', icon: Users },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'News', href: '/admin/news', icon: FileText },
  { label: 'SEO', href: '/admin/seo', icon: Search },
  { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { label: 'Advertisements', href: '/admin/advertisements', icon: Megaphone },
  { label: 'Subscriptions', href: '/admin/subscriptions', icon: CreditCard },
  { label: 'Contacts', href: '/admin/contacts', icon: Mail },
  { label: 'Bookmakers', href: '/admin/bookmakers', icon: Star },
  { label: 'Audit Log', href: '/admin/audit', icon: ShieldCheck },
  { label: 'Notifications', href: '/admin/notifications', icon: Bell },
  { label: 'Site Settings', href: '/admin/settings', icon: Settings },
]

export function MobileSidebar() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    ;(async () => {
      setOpen(false)
    })()
  }, [pathname])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [open, close])

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2 rounded-lg bg-surface-secondary border border-border shadow-sm hover:bg-surface-tertiary transition-colors"
        aria-label="Open navigation"
      >
        <Menu className="w-5 h-5 text-text-primary" />
      </button>

      {open && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={close}
          />
          <aside className="absolute inset-y-0 left-0 w-64 bg-surface-secondary border-r border-border shadow-xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <Link href="/admin" className="flex items-center gap-2" onClick={close}>
                <div className="w-7 h-7 bg-primary-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xs">PB</span>
                </div>
                <span className="font-bold text-base text-text-primary">Admin Panel</span>
              </Link>
              <button
                onClick={close}
                className="p-1.5 rounded-lg hover:bg-surface-tertiary text-text-secondary transition-colors"
                aria-label="Close navigation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-2 space-y-1">
              {ADMIN_NAV.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={close}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary-600 text-white'
                        : 'text-text-secondary hover:text-text-primary hover:bg-surface-tertiary'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </aside>
        </div>
      )}
    </>
  )
}
