import { useState, useCallback } from 'react'
import { BookOpen, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useArticles, useCreateArticle } from '@/hooks/useKnowledge'
import { useTenantSlug } from '@/hooks/useTenantSlug'
import { Badge, Button, Input, Select, Textarea, Modal, EmptyState } from '@nivaso/ui'
import { KNOWLEDGE_STATUS_COLORS } from '@/utils/constants'
import { cn } from '@/utils/cn'
import { X } from 'lucide-react'
import type { KnowledgeStatus } from '@/types/knowledge'
import { useEntitlementStore } from '@/store/entitlementStore'
import { flagLimit, Flag } from '@nivaso/types'

const STATUS_TABS: { value: KnowledgeStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Draft' },
  { value: 'archived', label: 'Archived' },
]

const STATUS_OPTIONS: { value: KnowledgeStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
]

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: 4 }).map((_, i) => (
        <td key={i} className="px-5 py-3"><div className="h-4 rounded bg-gray-200" /></td>
      ))}
    </tr>
  )
}

export function ArticleList() {
  const slug = useTenantSlug()
  const { data: articles, isLoading } = useArticles(slug)
  const { mutate: create, isPending: creating } = useCreateArticle(slug)

  const entitlements = useEntitlementStore((s) => s.entitlements)
  const articleLimit = flagLimit(entitlements, Flag.KNOWLEDGE_LIMIT)
  const atLimit = articleLimit !== null && (articles?.length ?? 0) >= articleLimit

  const [tab, setTab] = useState<KnowledgeStatus | 'all'>('all')
  const [showCreate, setShowCreate] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [source, setSource] = useState('')
  const [status, setStatus] = useState<KnowledgeStatus>('draft')
  const [keywords, setKeywords] = useState<string[]>([])
  const [kwInput, setKwInput] = useState('')
  const [formError, setFormError] = useState('')

  const displayed =
    tab === 'all' ? articles : articles?.filter((a) => a.status === tab)

  const addKeyword = useCallback(() => {
    const kw = kwInput.trim().toLowerCase()
    if (kw && !keywords.includes(kw)) setKeywords((k) => [...k, kw])
    setKwInput('')
  }, [kwInput, keywords])

  const handleCreate = useCallback(() => {
    if (!title.trim()) { setFormError('Title is required'); return }
    if (!content.trim()) { setFormError('Content is required'); return }
    setFormError('')
    create(
      { title: title.trim(), content: content.trim(), source: source.trim() || undefined, keywords, status },
      {
        onSuccess: () => {
          setShowCreate(false)
          setTitle(''); setContent(''); setSource(''); setKeywords([]); setKwInput(''); setStatus('draft')
        },
      },
    )
  }, [title, content, source, keywords, status, create])

  return (
    <div>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-1 border-b border-gray-200">
          {STATUS_TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={cn(
                'px-4 py-2 text-sm font-medium transition-colors',
                tab === t.value
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {articleLimit !== null && (
            <span className="text-xs text-gray-400">
              {articles?.length ?? 0} / {articleLimit}
            </span>
          )}
          <Button size="sm" onClick={() => setShowCreate(true)} disabled={atLimit}>
            <Plus className="h-4 w-4" /> New Article
          </Button>
        </div>
      </div>

      {/* Table */}
      {displayed?.length === 0 && !isLoading ? (
        <EmptyState
          icon={BookOpen}
          title="No articles"
          description="Add knowledge base articles for the AI to use."
          action={
            !atLimit ? (
              <Button size="sm" onClick={() => setShowCreate(true)}>
                <Plus className="h-4 w-4" /> New Article
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-5 py-3">Title</th>
                <th className="px-5 py-3">Source</th>
                <th className="px-5 py-3">Keywords</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading
                ? Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
                : displayed?.map((a) => (
                    <tr key={a.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3">
                        <Link to={`/knowledge/${a.id}`} className="font-medium text-blue-600 hover:underline">
                          {a.title}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-gray-600">{a.source ?? '—'}</td>
                      <td className="px-5 py-3 text-gray-500">
                        {a.keywords.slice(0, 3).join(', ')}{a.keywords.length > 3 ? '…' : ''}
                      </td>
                      <td className="px-5 py-3">
                        <Badge colorClass={KNOWLEDGE_STATUS_COLORS[a.status]}>{a.status}</Badge>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Knowledge Article">
        <div className="max-h-[70vh] overflow-y-auto space-y-3 pr-1">
          <Input
            label="Title *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="How to Redeem Your Game Key"
          />
          <Textarea
            label="Content *"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Article content…"
            rows={6}
          />
          <Input
            label="Source"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="manual, faq_import, URL…"
          />
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Keywords</label>
            <div className="mb-2 flex flex-wrap gap-1">
              {keywords.map((kw) => (
                <span key={kw} className="flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs text-blue-700">
                  {kw}
                  <button onClick={() => setKeywords((k) => k.filter((x) => x !== kw))}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={kwInput}
                onChange={(e) => setKwInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addKeyword() } }}
                placeholder="add keyword…"
                className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <Button size="sm" variant="secondary" onClick={addKeyword}>Add</Button>
            </div>
          </div>
          <Select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as KnowledgeStatus)}
            options={STATUS_OPTIONS}
          />
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} loading={creating}>Create Article</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
