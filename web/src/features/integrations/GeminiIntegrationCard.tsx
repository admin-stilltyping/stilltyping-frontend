import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ExternalLink, Save, Sparkles } from 'lucide-react'
import { Button, Input } from '@nivaso/ui'
import { geminiApi } from '@/api/gemini'
import { apiError } from '@/utils/apiError'

export function GeminiIntegrationCard({ slug }: { slug: string }) {
  const qc = useQueryClient()
  const [apiKey, setApiKey] = useState('')
  const [saved, setSaved] = useState(false)
  const queryKey = ['gemini-integration', slug]
  const config = useQuery({
    queryKey,
    queryFn: () => geminiApi.get(slug),
    staleTime: 5 * 60_000,
    retry: false,
  })
  const save = useMutation({
    // Keep the secret out of mutation variables and the query cache.
    mutationFn: () => geminiApi.save(slug, apiKey.trim()),
    gcTime: 0,
    onSuccess: (result) => {
      setApiKey('')
      setSaved(true)
      qc.setQueryData(queryKey, result)
    },
  })
  const ownKey = config.data?.source === 'business'
  const status = ownKey ? 'Your key saved' : config.data?.source === 'platform'
    ? 'Using platform key' : 'Not configured'

  return (
    <section aria-labelledby="gemini-title" className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-5 py-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-blue-600" />
          <h3 id="gemini-title" className="text-sm font-semibold text-gray-800">Gemini AI</h3>
        </div>
        {config.data && <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${ownKey ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{status}</span>}
      </div>
      <div className="space-y-4 p-5">
        <p className="text-sm leading-relaxed text-gray-600">
          Use your Gemini API key for this business’s AI replies, Agent Chat, and knowledge processing. Your default AI models stay the same.
        </p>
        {config.isPending ? (
          <div role="status" aria-label="Loading Gemini settings" className="animate-pulse space-y-3">
            <div className="h-4 w-32 rounded bg-gray-100" /><div className="h-10 rounded bg-gray-100" />
          </div>
        ) : config.isError ? (
          <div role="alert" className="space-y-2 text-sm text-red-700">
            <p>{apiError(config.error, 'Unable to load Gemini settings.')}</p>
            <button type="button" className="underline" onClick={() => void config.refetch()}>Try again</button>
          </div>
        ) : (
          <>
            {ownKey && <p className="rounded-lg bg-green-50 px-3 py-2 text-xs text-green-800">
              Saved key ending in <span className="font-mono">{config.data.key_last_four}</span>
              {config.data.updated_at && <> · Updated {new Date(config.data.updated_at).toLocaleString()}</>}
            </p>}
            {config.data.source === 'platform' && <p className="text-xs text-gray-500">AI currently uses the platform’s key. Saving your own key switches this business to your Gemini project.</p>}
            {!config.data.can_update && <p role="alert" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">API key storage is not configured. Please contact your platform administrator.</p>}
            <form className="space-y-3" onSubmit={(event) => {
              event.preventDefault()
              if (save.isPending || !config.data.can_update || !apiKey.trim()) return
              setSaved(false)
              save.mutate()
            }}>
              <Input label={ownKey ? 'New Gemini API key' : 'Gemini API key'}
                type="password" autoComplete="new-password" spellCheck={false}
                value={apiKey} onChange={(event) => { setApiKey(event.target.value); setSaved(false); save.reset() }}
                disabled={save.isPending || !config.data.can_update} required minLength={20} maxLength={256}
                placeholder={ownKey ? 'Enter a new key to replace the saved key' : 'Paste your key from Google AI Studio'} />
              <p className="text-xs text-gray-500">Keys are encrypted when saved and are never displayed again.</p>
              <div className="flex flex-wrap items-center gap-3">
                <Button type="submit" size="sm" loading={save.isPending}
                  disabled={!config.data.can_update || apiKey.trim().length < 20}>
                  {!save.isPending && <Save className="h-4 w-4" />}
                  {save.isPending ? 'Verifying key…' : ownKey ? 'Update API key' : 'Verify and save key'}
                </Button>
                <a className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline" href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">Get a Gemini API key <ExternalLink size={12} /></a>
              </div>
            </form>
            {save.isError && <p role="alert" className="text-sm text-red-600">{apiError(save.error, 'Unable to save this API key. Please try again.')}</p>}
            {saved && <p role="status" className="text-sm text-green-700">Gemini key verified and saved. New AI requests will use this key.</p>}
          </>
        )}
      </div>
    </section>
  )
}
