'use client'

import { useAuth } from '@/providers/auth-provider'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { MobileSidebar } from '@/components/admin/mobile-sidebar'
import { ToastProvider } from '@/components/admin/toast'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && (!user || !['admin', 'superadmin', 'editor'].includes(user.role))) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!user || !['admin', 'superadmin', 'editor'].includes(user.role)) {
    return null
  }

  return (
    <ToastProvider>
      <div className="flex min-h-screen">
        <AdminSidebar />
        <MobileSidebar />
        <div className="flex-1 p-6 lg:p-8 bg-surface pt-16 lg:pt-8">
          {children}
        </div>
      </div>
    </ToastProvider>
  )
}
