'use client'

import { useState, useEffect } from 'react'
import { Save } from 'lucide-react'
import { useToast } from '@/components/admin/toast'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface SiteSettings {
  siteName: string
  siteDescription: string
  contactEmail: string
  contactPhone: string
  maintenanceMode: boolean
  primaryColor: string
  logo: string
  favicon: string
  facebook: string
  twitter: string
  instagram: string
  youtube: string
  telegram: string
}

export default function SiteSettingsPage() {
  const { toast } = useToast()
  const [settings, setSettings] = useState<SiteSettings>({
    siteName: '',
    siteDescription: '',
    contactEmail: '',
    contactPhone: '',
    maintenanceMode: false,
    primaryColor: '#10B981',
    logo: '',
    favicon: '',
    facebook: '',
    twitter: '',
    instagram: '',
    youtube: '',
    telegram: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/admin/settings')
        if (!res.ok) throw new Error('Failed to fetch')
        const data: SiteSettings = await res.json()
        setSettings(data)
      } catch {
        toast('error', 'Failed to load settings')
      } finally {
        setLoading(false)
      }
    })()
  }, [toast])

  function update(key: keyof SiteSettings, value: string | boolean) {
    setSettings(s => ({ ...s, [key]: value }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (!res.ok) throw new Error('Failed to save')
      toast('success', 'Settings saved successfully')
    } catch {
      toast('error', 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-surface-secondary rounded-lg animate-pulse" />
        <div className="h-64 bg-surface-secondary rounded-xl animate-pulse" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Site Settings</h1>
          <p className="text-text-secondary mt-1">Configure your site appearance and behavior</p>
        </div>
        <Button onClick={handleSave} loading={saving} size="sm">
          <Save className="w-4 h-4" />
          Save Settings
        </Button>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold text-text-primary">General</h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Site Name</label>
                <input
                  type="text"
                  value={settings.siteName}
                  onChange={(e) => update('siteName', e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Primary Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={settings.primaryColor}
                    onChange={(e) => update('primaryColor', e.target.value)}
                    className="w-10 h-10 rounded-lg border border-border cursor-pointer"
                  />
                  <input
                    type="text"
                    value={settings.primaryColor}
                    onChange={(e) => update('primaryColor', e.target.value)}
                    className="flex-1 h-10 px-3 rounded-lg border border-border bg-surface text-text-primary text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-text-secondary mb-1">Site Description</label>
                <textarea
                  value={settings.siteDescription}
                  onChange={(e) => update('siteDescription', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Logo URL</label>
                <input
                  type="text"
                  value={settings.logo}
                  onChange={(e) => update('logo', e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="/logo.svg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Favicon URL</label>
                <input
                  type="text"
                  value={settings.favicon}
                  onChange={(e) => update('favicon', e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="/favicon.ico"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold text-text-primary">Contact</h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Contact Email</label>
                <input
                  type="email"
                  value={settings.contactEmail}
                  onChange={(e) => update('contactEmail', e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Contact Phone</label>
                <input
                  type="tel"
                  value={settings.contactPhone}
                  onChange={(e) => update('contactPhone', e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="+234..."
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold text-text-primary">Social Media</h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: 'facebook' as const, label: 'Facebook URL' },
                { key: 'twitter' as const, label: 'Twitter / X URL' },
                { key: 'instagram' as const, label: 'Instagram URL' },
                { key: 'youtube' as const, label: 'YouTube URL' },
                { key: 'telegram' as const, label: 'Telegram URL' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-text-secondary mb-1">{label}</label>
                  <input
                    type="url"
                    value={settings[key]}
                    onChange={(e) => update(key, e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="https://..."
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold text-text-primary">Maintenance</h2>
          </CardHeader>
          <CardContent>
            <label className="flex items-center gap-3 cursor-pointer">
              <button
                type="button"
                onClick={() => update('maintenanceMode', !settings.maintenanceMode)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.maintenanceMode ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.maintenanceMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <div>
                <p className="text-sm font-medium text-text-primary">Maintenance Mode</p>
                <p className="text-xs text-text-muted">When enabled, the site displays a maintenance page to visitors</p>
              </div>
            </label>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} loading={saving}>
            <Save className="w-4 h-4" />
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  )
}
