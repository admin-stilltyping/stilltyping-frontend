import { useEffect, useState } from 'react'
import { Save, Sparkles } from 'lucide-react'
import { useInstructions, useSetInstructions } from '@/hooks/useInstructions'
import { useTenantSlug } from '@/hooks/useTenantSlug'
import { Button, Spinner } from '@nivaso/ui'

export function InstructionsPage() {
  const slug = useTenantSlug()
  const { data, isLoading } = useInstructions(slug)
  const { mutate: save, isPending } = useSetInstructions(slug)

  const [text, setText] = useState('')
  const [dirty, setDirty] = useState(false)
  const [saved, setSaved] = useState(false)

  // Load the stored value into the editor until the user starts editing.
  useEffect(() => {
    if (data && !dirty) setText(data.instructions)
  }, [data, dirty])

  const handleSave = () => {
    save(text, {
      onSuccess: () => {
        setDirty(false)
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      },
    })
  }

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-blue-50 p-2">
          <Sparkles className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">AI Instructions</h2>
          <p className="text-sm text-gray-500">
            The assistant's persona, tone and hard rules. Sent on every message — above the
            retrieved knowledge, below the safety prompt. Leave blank for default behavior.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        {isLoading ? (
          <Spinner />
        ) : (
          <>
            <textarea
              value={text}
              onChange={(e) => {
                setText(e.target.value)
                setDirty(true)
              }}
              rows={18}
              placeholder="e.g. You are the front-desk receptionist for … Be warm and concise. Never quote prices…"
              className="w-full rounded-lg border border-gray-300 p-3 font-mono text-sm leading-relaxed focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <div className="mt-3 flex items-center gap-3">
              <Button onClick={handleSave} loading={isPending} disabled={!dirty}>
                <Save className="h-4 w-4" />
                Save Instructions
              </Button>
              <span className="text-xs text-gray-400">{text.length} chars</span>
              {saved && <span className="text-sm font-medium text-green-600">Saved!</span>}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
