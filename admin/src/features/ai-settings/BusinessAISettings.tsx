import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { superAdminClient } from '@/api/superAdmin'
import { businessError } from '@/utils/business'

type Settings = {
  revision: string
  source: string
  can_update: boolean
  llm_provider: 'gemini' | 'deepseek' | 'deepinfra'
  llm_model: string
  llm_key_last_four?: string
  embedding_provider: 'gemini' | 'deepinfra'
  embedding_model: string
  embedding_dimensions: number
  embedding_key_last_four?: string
  relevance_threshold: number
}
const inputStyle = 'w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-gray-200'

function SettingsForm({ slug, initial }: { slug: string; initial: Settings }) {
  const qc = useQueryClient()
  const [form, setForm] = useState(initial)
  const [llmKey, setLlmKey] = useState('')
  const [embeddingKey, setEmbeddingKey] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const embeddingChanged = form.embedding_provider !== initial.embedding_provider ||
    form.embedding_model !== initial.embedding_model || form.embedding_dimensions !== initial.embedding_dimensions
  const save = useMutation({
    gcTime: 0,
    mutationFn: async () => {
      const { revision, llm_provider, llm_model, embedding_provider, embedding_model,
        embedding_dimensions, relevance_threshold } = form
      const result = await superAdminClient.put<Settings>(
        `/super-admin/businesses/${encodeURIComponent(slug)}/ai-settings`,
        { revision, llm_provider, llm_model, embedding_provider, embedding_model,
          embedding_dimensions, relevance_threshold,
          llm_api_key: llmKey.trim() || null, embedding_api_key: embeddingKey.trim() || null },
        { timeout: 180000 },
      )
      return result.data
    },
    onSuccess: (data) => {
      setLlmKey(''); setEmbeddingKey(''); setConfirmed(false)
      qc.setQueryData(['business-ai-settings', slug], data)
    },
  })
  return <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); save.mutate() }}>
    <p className="text-sm text-gray-400">Applies only to this business. Blank keys keep the existing key for the same provider. Changing providers requires a new key. For DeepInfra, you can enter the same key in both API key fields. Choose a chat model that supports tool calling.</p>
    <fieldset disabled={save.isPending || !initial.can_update} className="space-y-5 disabled:opacity-60">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-2 text-sm text-gray-300">LLM provider
          <select className={inputStyle} value={form.llm_provider} onChange={(e) => {
            const provider = e.target.value as Settings['llm_provider']
            setForm({ ...form, llm_provider: provider, llm_model: provider === 'deepinfra' ? 'deepseek-ai/DeepSeek-V4-Flash-0731' : provider === 'deepseek' ? 'deepseek-flash' : 'gemini-3.8-flash' }); setLlmKey('')
          }}><option value="gemini">Gemini</option><option value="deepseek">DeepSeek (direct)</option><option value="deepinfra">DeepInfra</option></select>
        </label>
        <label className="space-y-2 text-sm text-gray-300">LLM model
          <input required className={inputStyle} value={form.llm_model} onChange={(e) => setForm({ ...form, llm_model: e.target.value })} />
        </label>
        <label className="space-y-2 text-sm text-gray-300 sm:col-span-2">LLM API key
          <input type="password" autoComplete="new-password" className={inputStyle} value={llmKey} onChange={(e) => setLlmKey(e.target.value)} placeholder={initial.llm_key_last_four ? `Saved key ending ${initial.llm_key_last_four}` : 'Leave blank to keep inherited Gemini key'} />
        </label>
        <label className="space-y-2 text-sm text-gray-300">Embedding provider
          <select className={inputStyle} value={form.embedding_provider} onChange={(e) => {
            const provider = e.target.value as Settings['embedding_provider']
            setForm({ ...form, embedding_provider: provider, embedding_model: provider === 'deepinfra' ? 'Qwen/Qwen3-Embedding-8B' : 'gemini-embedding-2', embedding_dimensions: provider === 'deepinfra' ? 4096 : 3072 }); setEmbeddingKey(''); setConfirmed(false)
          }}><option value="gemini">Gemini</option><option value="deepinfra">DeepInfra (Qwen)</option></select>
        </label>
        <label className="space-y-2 text-sm text-gray-300">Embedding model
          <input required className={inputStyle} value={form.embedding_model} onChange={(e) => { setForm({ ...form, embedding_model: e.target.value }); setConfirmed(false) }} list="embedding-models" />
          <datalist id="embedding-models">{(form.embedding_provider === 'deepinfra' ? ['Qwen/Qwen3-Embedding-0.6B', 'Qwen/Qwen3-Embedding-4B', 'Qwen/Qwen3-Embedding-8B'] : ['gemini-embedding-2', 'gemini-embedding-001']).map(m => <option key={m} value={m} />)}</datalist>
        </label>
        <label className="space-y-2 text-sm text-gray-300">Vector dimensions
          <input type="number" required min={32} max={4096} className={inputStyle} value={form.embedding_dimensions} onChange={(e) => { setForm({ ...form, embedding_dimensions: Number(e.target.value) }); setConfirmed(false) }} />
        </label>
        <label className="space-y-2 text-sm text-gray-300">Minimum relevance score
          <input type="number" required min={-1} max={1} step="0.01" className={inputStyle} value={form.relevance_threshold} onChange={(e) => setForm({ ...form, relevance_threshold: Number(e.target.value) })} />
        </label>
        <label className="space-y-2 text-sm text-gray-300 sm:col-span-2">Embedding API key
          <input type="password" autoComplete="new-password" className={inputStyle} value={embeddingKey} onChange={(e) => setEmbeddingKey(e.target.value)} placeholder={initial.embedding_key_last_four ? `Saved key ending ${initial.embedding_key_last_four}` : 'Leave blank to keep inherited Gemini key'} />
        </label>
      </div>
      <p className="text-xs text-gray-400">Saving checks provider access with a small embedding request. Changing embeddings rebuilds this business’s knowledge and tool vectors before activation; provider usage charges apply. Test relevance after changing models.</p>
      {embeddingChanged && <label className="flex gap-2 text-sm text-amber-300"><input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} />Rebuild embeddings and activate these settings when complete.</label>}
      <button type="submit" disabled={embeddingChanged && !confirmed} className="rounded-lg bg-violet-700 px-4 py-2 text-white disabled:opacity-50">{save.isPending ? 'Validating and preparing…' : 'Save AI settings'}</button>
    </fieldset>
    {!initial.can_update && <p role="alert" className="text-amber-300">API key encryption is not configured on the server.</p>}
    {save.isError && <p role="alert" className="text-red-400">{businessError(save.error, 'Could not save AI settings. Reload to check the active configuration before retrying.')}</p>}
  </form>
}

export function BusinessAISettings({ slug }: { slug: string }) {
  const query = useQuery({ queryKey: ['business-ai-settings', slug], queryFn: async () =>
    (await superAdminClient.get<Settings>(`/super-admin/businesses/${encodeURIComponent(slug)}/ai-settings`)).data })
  return <section className="space-y-4 rounded-xl border border-gray-800 bg-gray-900 p-6">
    <h2 className="font-semibold text-white">AI models and API keys</h2>
    {query.isLoading && <p className="text-gray-400">Loading AI settings…</p>}
    {query.isError && <p role="alert" className="text-red-400">{businessError(query.error, 'Could not load AI settings.')} <button className="underline" onClick={() => void query.refetch()}>Retry</button></p>}
    {query.data && <><p className="text-xs text-gray-400">{query.data.source === 'inherited' ? 'Currently using inherited Gemini settings.' : 'Saved business settings are active.'}</p><SettingsForm key={`${slug}:${query.data.revision}`} slug={slug} initial={query.data} /></>}
  </section>
}
