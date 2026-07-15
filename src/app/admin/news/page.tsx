'use client'

import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DataTable, type Column } from '@/components/admin/data-table'
import { SearchFilter, type FilterOption } from '@/components/admin/search-filter'
import { Modal } from '@/components/admin/modal'
import { ConfirmDialog } from '@/components/admin/confirm-dialog'
import { useToast } from '@/components/admin/toast'

interface NewsArticle {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  author: string
  category: string
  tags: string | null
  published: boolean
  featured: boolean
  createdAt: string
}

interface ApiResponse {
  data: NewsArticle[]
  total: number
  page: number
  limit: number
  totalPages: number
}

const filters: FilterOption[] = [
  {
    key: 'category',
    label: 'Category',
    type: 'select',
    options: [
      { value: 'transfer', label: 'Transfer' },
      { value: 'injury', label: 'Injury' },
      { value: 'analysis', label: 'Analysis' },
      { value: 'preview', label: 'Preview' },
      { value: 'recap', label: 'Recap' },
      { value: 'general', label: 'General' },
    ],
  },
  {
    key: 'published',
    label: 'Status',
    type: 'select',
    options: [
      { value: 'true', label: 'Published' },
      { value: 'false', label: 'Draft' },
    ],
  },
]

const categoryOptions = [
  'Transfer News',
  'Match Preview',
  'Match Report',
  'Injury News',
  'Opinion',
  'General',
]

function toSlug(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

const emptyForm = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  author: '',
  category: 'General',
  tags: '',
  published: false,
  featured: false,
}

export default function AdminNewsPage() {
  const { toast } = useToast()
  const [data, setData] = useState<NewsArticle[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [filterValues, setFilterValues] = useState<Record<string, string>>({})
  const [refreshKey, setRefreshKey] = useState(0)
  const limit = 20

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingArticle, setEditingArticle] = useState<NewsArticle | null>(null)
  const [formData, setFormData] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const [deletingArticle, setDeletingArticle] = useState<NewsArticle | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        params.set('page', String(page))
        params.set('limit', String(limit))
        if (filterValues.search) params.set('search', filterValues.search)
        if (filterValues.category) params.set('category', filterValues.category)
        if (filterValues.published) params.set('published', filterValues.published)

        const res = await fetch(`/api/admin/news?${params}`)
        if (res.ok) {
          const json: ApiResponse = await res.json()
          setData(json.data)
          setTotal(json.total)
          setTotalPages(json.totalPages)
        }
      } finally {
        setLoading(false)
      }
    })()
  }, [page, filterValues, refreshKey])

  function handleSearch() {
    setPage(1)
    setRefreshKey(k => k + 1)
  }

  function handleFilterChange(values: Record<string, string>) {
    setFilterValues(values)
    setPage(1)
  }

  function refreshData() {
    setRefreshKey(k => k + 1)
  }

  function openCreateModal() {
    setFormData(emptyForm)
    setShowCreateModal(true)
  }

  function openEditModal(article: NewsArticle) {
    setEditingArticle(article)
    setFormData({
      title: article.title,
      slug: article.slug,
      excerpt: article.excerpt || '',
      content: article.content || '',
      author: article.author || '',
      category: article.category || 'General',
      tags: article.tags || '',
      published: article.published,
      featured: article.featured,
    })
    setShowEditModal(true)
  }

  function handleTitleChange(title: string) {
    setFormData(prev => ({
      ...prev,
      title,
      slug: editingArticle ? prev.slug : toSlug(title),
    }))
  }

  async function handleCreate() {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to create article' }))
        toast('error', err.error || 'Failed to create article')
        return
      }
      toast('success', 'Article created successfully')
      setShowCreateModal(false)
      setFormData(emptyForm)
      refreshData()
    } catch {
      toast('error', 'An unexpected error occurred')
    } finally {
      setSaving(false)
    }
  }

  async function handleEdit() {
    if (!editingArticle) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/news', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingArticle.id, ...formData }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to update article' }))
        toast('error', err.error || 'Failed to update article')
        return
      }
      toast('success', 'Article updated successfully')
      setShowEditModal(false)
      setEditingArticle(null)
      refreshData()
    } catch {
      toast('error', 'An unexpected error occurred')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deletingArticle) return
    setDeleting(true)
    try {
      const res = await fetch('/api/admin/news', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deletingArticle.id }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to delete article' }))
        toast('error', err.error || 'Failed to delete article')
        return
      }
      toast('success', 'Article deleted successfully')
      setDeletingArticle(null)
      refreshData()
    } catch {
      toast('error', 'An unexpected error occurred')
    } finally {
      setDeleting(false)
    }
  }

  async function togglePublished(article: NewsArticle) {
    const res = await fetch('/api/admin/news', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: article.id, published: !article.published }),
    })
    if (res.ok) {
      setData((prev) =>
        prev.map((a) => (a.id === article.id ? { ...a, published: !a.published } : a))
      )
    }
  }

  const columns: Column<NewsArticle>[] = [
    {
      key: 'title',
      label: 'Title',
      sortable: true,
      render: (item) => <span className="font-medium max-w-xs truncate block">{item.title}</span>,
    },
    {
      key: 'category',
      label: 'Category',
      render: (item) => <Badge variant="info" size="sm">{item.category}</Badge>,
    },
    { key: 'author', label: 'Author', render: (item) => <span className="text-text-muted">{item.author}</span> },
    {
      key: 'published',
      label: 'Published',
      render: (item) => (
        <button
          onClick={() => togglePublished(item)}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
            item.published ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
          }`}
        >
          <span
            className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
              item.published ? 'translate-x-4.5' : 'translate-x-0.5'
            }`}
          />
        </button>
      ),
    },
    {
      key: 'featured',
      label: 'Featured',
      render: (item) =>
        item.featured ? <Badge variant="warning" size="sm">Featured</Badge> : <span className="text-text-muted">-</span>,
    },
    {
      key: 'createdAt',
      label: 'Created',
      sortable: true,
      render: (item) => (
        <span className="text-text-muted">{new Date(item.createdAt).toLocaleDateString()}</span>
      ),
    },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">News</h1>
          <p className="text-text-secondary mt-1">Manage news articles</p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="w-4 h-4 mr-2" />
          Add Article
        </Button>
      </div>

      <div className="mb-4">
        <SearchFilter
          searchPlaceholder="Search articles..."
          filters={filters}
          values={filterValues}
          onChange={handleFilterChange}
          onSearch={handleSearch}
        />
      </div>

      <DataTable
        columns={columns}
        data={data}
        total={total}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        loading={loading}
        emptyMessage="No articles found"
        actions={(item) => (
          <>
            <button
              onClick={() => openEditModal(item)}
              className="p-1.5 rounded-lg hover:bg-surface-tertiary text-text-muted hover:text-primary-600"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDeletingArticle(item)}
              className="p-1.5 rounded-lg hover:bg-surface-tertiary text-text-muted hover:text-red-600"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        )}
      />

      <Modal
        isOpen={showCreateModal}
        title="Create Article"
        onClose={() => setShowCreateModal(false)}
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Article title"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Slug</label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
              className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="article-slug"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Author</label>
              <input
                type="text"
                value={formData.author}
                onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
                className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Author name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {categoryOptions.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Excerpt</label>
            <textarea
              value={formData.excerpt}
              onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              placeholder="Short summary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Content</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              rows={8}
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-y"
              placeholder="Full article content"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Tags</label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
              className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Comma-separated tags"
            />
          </div>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.published}
                onChange={(e) => setFormData(prev => ({ ...prev, published: e.target.checked }))}
                className="h-4 w-4 rounded border-border text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-text-primary">Published</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.featured}
                onChange={(e) => setFormData(prev => ({ ...prev, featured: e.target.checked }))}
                className="h-4 w-4 rounded border-border text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-text-primary">Featured</span>
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <Button variant="ghost" onClick={() => setShowCreateModal(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleCreate} loading={saving}>Create Article</Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showEditModal}
        title="Edit Article"
        onClose={() => { setShowEditModal(false); setEditingArticle(null) }}
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Article title"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Slug</label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
              className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="article-slug"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Author</label>
              <input
                type="text"
                value={formData.author}
                onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
                className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Author name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {categoryOptions.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Excerpt</label>
            <textarea
              value={formData.excerpt}
              onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              placeholder="Short summary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Content</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              rows={8}
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-y"
              placeholder="Full article content"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Tags</label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
              className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Comma-separated tags"
            />
          </div>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.published}
                onChange={(e) => setFormData(prev => ({ ...prev, published: e.target.checked }))}
                className="h-4 w-4 rounded border-border text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-text-primary">Published</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.featured}
                onChange={(e) => setFormData(prev => ({ ...prev, featured: e.target.checked }))}
                className="h-4 w-4 rounded border-border text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-text-primary">Featured</span>
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <Button variant="ghost" onClick={() => { setShowEditModal(false); setEditingArticle(null) }} disabled={saving}>Cancel</Button>
            <Button onClick={handleEdit} loading={saving}>Save Changes</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deletingArticle}
        title="Delete Article"
        message={`Are you sure you want to delete "${deletingArticle?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeletingArticle(null)}
      />
    </div>
  )
}
