import { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/constants'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const staticPages = [
    { url: '', priority: 1.0, changeFrequency: 'hourly' as const },
    { url: '/predictions', priority: 0.9, changeFrequency: 'hourly' as const },
    { url: '/live-scores', priority: 0.8, changeFrequency: 'always' as const },
    { url: '/fixtures', priority: 0.7, changeFrequency: 'daily' as const },
    { url: '/results', priority: 0.7, changeFrequency: 'daily' as const },
    { url: '/leagues', priority: 0.6, changeFrequency: 'daily' as const },
    { url: '/teams', priority: 0.5, changeFrequency: 'weekly' as const },
    { url: '/bookmakers', priority: 0.5, changeFrequency: 'weekly' as const },
    { url: '/news', priority: 0.6, changeFrequency: 'daily' as const },
    { url: '/statistics', priority: 0.5, changeFrequency: 'daily' as const },
    { url: '/search', priority: 0.3, changeFrequency: 'monthly' as const },
    { url: '/about', priority: 0.3, changeFrequency: 'monthly' as const },
    { url: '/contact', priority: 0.3, changeFrequency: 'monthly' as const },
    { url: '/privacy', priority: 0.2, changeFrequency: 'yearly' as const },
    { url: '/terms', priority: 0.2, changeFrequency: 'yearly' as const },
  ]

  return staticPages.map((page) => ({
    url: `${SITE_URL}${page.url}`,
    lastModified: now,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }))
}
