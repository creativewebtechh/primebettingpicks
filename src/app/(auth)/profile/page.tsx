'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Calendar, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { useAuth } from '@/providers/auth-provider'
import { formatDate } from '@/lib/utils'

const ROLE_COLORS: Record<string, string> = {
  user: 'bg-surface-tertiary text-text-secondary',
  editor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  superadmin: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
}

export default function ProfilePage() {
  const { user, loading, logout, updateProfile } = useAuth()
  const router = useRouter()
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (user?.name) {
      setName(user.name)
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [user?.name])

  const displayName = useMemo(() => user?.name || 'User', [user?.name])

  if (loading || !user) return null

  const handleUpdate = async () => {
    setSaving(true)
    try {
      await updateProfile({ name })
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-text-primary mb-8">My Profile</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-20 h-20 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-2xl font-bold text-primary-600 mx-auto mb-4">
              {user.name?.charAt(0) || user.email.charAt(0)}
            </div>
            <h2 className="text-lg font-semibold text-text-primary">{displayName}</h2>
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-2 ${ROLE_COLORS[user.role] || ROLE_COLORS.user}`}>
              {user.role}
            </span>
          </CardContent>
        </Card>

        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-text-primary">Account Information</h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input label="Full Name" id="name" value={name} onChange={(e) => setName(e.target.value)} />
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Email</label>
                <div className="flex items-center gap-2 h-10 px-3 rounded-lg border border-border bg-surface-tertiary text-text-secondary">
                  <Mail className="w-4 h-4" />
                  {user.email}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Member Since</label>
                <div className="flex items-center gap-2 h-10 px-3 rounded-lg border border-border bg-surface-tertiary text-text-secondary">
                  <Calendar className="w-4 h-4" />
                  {formatDate(user.createdAt)}
                </div>
              </div>
              <Button onClick={handleUpdate} loading={saving}>Save Changes</Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <LogOut className="w-5 h-5 text-text-muted" />
                <div>
                  <p className="font-medium text-text-primary">Sign Out</p>
                  <p className="text-sm text-text-secondary">Sign out of your account</p>
                </div>
              </div>
              <Button variant="danger" size="sm" onClick={logout}>Logout</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
