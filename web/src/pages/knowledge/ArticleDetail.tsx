import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Pencil, X } from 'lucide-react'
import { useArticle, useUpdateArticle } from '@/hooks/useKnowledge'
import { useTenantSlug } from '@/hooks/useTenantSlug'
import { Badge, Button, Input, Textarea, Spinner } from '@nivaso/ui'
import { KNOWLEDGE_STATUS_COLORS } from '@/utils/constants'
import type { KnowledgeStatus } from '@/types/knowledge'

const STATUS_CYCLE: KnowledgeStatus[] = ['draft', 'published', 'archived']

export function ArticleDetail() {
  const { articleId } = useParams<{ articleId: string }>()
  const slug = useTenantSlug()
  const { data: article, isLoading } = useArticle(slug, articleId ?? '')
  const { mutate: update, isPending: saving } = useUpdateArticle(slug, articleId ?? '')

  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [keywords, setKeywords] = useState<string[]>([])
  const [kwInput, setKwInput] = useState('')

  useEffect(() => {
    if (article) {
      setTitle(article.title)
      setContent(article.content)
      setKeywords([...article.keywords])
    }
  }, [article])

  if (isLoading) return <Spinner />
  if (!article) return <p className="text-gray-500">Article not found.</p>

  const handleSave = () => {
    update(
      { title, content, keywords },
      { onSuccess: () => setEditing(false) },
    )
  }

  const cycleStatus = () => {
    const idx = STATUS_CYCLE.indexOf(article.status)
    const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length]
    update({ status: next })
  }

  const addKeyword = () => {
    const kw = kwInput.trim().toLowerCase()
    if (kw && !keywords.includes(kw)) setKeywords((k) => [...k, kw])
    setKwInput('')
  }

  return (
    <div className="max-w-2xl space-y-4">
      <Link to="/knowledge" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between gap-4">
          {editing ? (
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-xl font-semibold flex-1"
            />
          ) : (
            <h2 className="text-xl font-semibold text-gray-900 flex-1">{article.title}</h2>
          )}
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={cycleStatus}
              title="Click to cycle status"
              className="cursor-pointer"
            >
              <Badge colorClass={KNOWLEDGE_STATUS_COLORS[article.status]}>{article.status}</Badge>
            </button>
            <Button
              size="sm"
              variant={editing ? 'primary' : 'secondary'}
              onClick={() => (editing ? handleSave() : setEditing(true))}
              loading={saving}
            >
              <Pencil className="h-4 w-4" />
              {editing ? 'Save' : 'Edit'}
            </Button>
            {editing && (
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
            )}
          </div>
        </div>

        {/* Content */}
        {editing ? (
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={12}
            className="mb-4 font-mono text-sm"
          />
        ) : (
          <div className="mb-4 rounded-lg bg-gray-50 p-4 text-sm text-gray-700 whitespace-pre-wrap">
            {article.content}
          </div>
        )}

        {/* Meta */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-medium text-gray-500">Source</p>
            <p className="text-gray-900">{article.source ?? '—'}</p>
          </div>
          <div>
            <p className="font-medium text-gray-500 mb-1">Keywords</p>
            <div className="flex flex-wrap gap-1">
              {(editing ? keywords : article.keywords).length === 0
                ? <span className="text-gray-400">—</span>
                : (editing ? keywords : article.keywords).map((kw) => (
                    <span
                      key={kw}
                      className="flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs text-blue-700"
                    >
                      {kw}
                      {editing && (
                        <button onClick={() => setKeywords((k) => k.filter((x) => x !== kw))}>
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </span>
                  ))}
            </div>
            {editing && (
              <div className="mt-2 flex gap-2">
                <input
                  value={kwInput}
                  onChange={(e) => setKwInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addKeyword() } }}
                  placeholder="add keyword…"
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <Button size="sm" variant="secondary" onClick={addKeyword}>Add</Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
