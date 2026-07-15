'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, CalendarRange, TrendingUp, Shield,
  Users, FileText, Search, BarChart3, Megaphone,
  CreditCard, Mail, Star, ShieldCheck, Bell, Settings,
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

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-surface-secondary border-r border-border min-h-screen hidden lg:block">
      <div className="p-4 border-b border-border">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xs">PB</span>
          </div>
          <span className="font-bold text-base">Admin Panel</span>
        </Link>
      </div>
      <nav className="p-2 space-y-1">
        {ADMIN_NAV.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
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
  )
}
