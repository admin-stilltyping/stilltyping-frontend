import { useState } from 'react'
import { ExternalLink, Copy, Check } from 'lucide-react'

function CopyCode({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState(false)
  return <div className="space-y-2">
    <div className="flex items-center justify-between gap-3"><h4 className="text-sm font-medium text-gray-700">{label}</h4><button className="flex items-center gap-1 text-xs font-medium text-blue-600" onClick={async () => {
      try { await navigator.clipboard.writeText(value); setCopied(true); setError(false); window.setTimeout(() => setCopied(false), 2000) }
      catch { setError(true) }
    }}>{copied ? <Check size={13} /> : <Copy size={13} />}{copied ? 'Copied' : 'Copy'}</button></div>
    <pre className="whitespace-pre-wrap break-all rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs leading-relaxed text-gray-700"><code>{value}</code></pre>
    {error && <p className="text-xs text-red-600" role="alert">Copy is unavailable. Select and copy the code above.</p>}
  </div>
}

export function WebChatSetup({ slug }: { slug: string }) {
  const origin = window.location.origin
  const url = `${origin}/c/${encodeURIComponent(slug)}`
  const snippet = `<script src="${origin}/chat-widget.js" data-business="${slug}" defer></script>`
  return <div className="space-y-5">
    <p className="text-sm text-gray-600">Let visitors ask your AI assistant a question. No admin login is needed.</p>
    <CopyCode label="Customer chat link" value={url} />
    <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-medium text-blue-600">Open customer chat <ExternalLink size={14} /></a>
    <CopyCode label="Website chat widget" value={snippet} />
    <p className="text-xs leading-relaxed text-gray-500">Paste this code before the closing &lt;/body&gt; tag on your website. It adds a chat button in the bottom-right corner. When Leads is enabled, messages are captured as enquiries.</p>
    {(window.location.hostname === 'localhost' || window.location.hostname.endsWith('.localhost')) && <p className="rounded-lg bg-blue-50 p-3 text-xs leading-relaxed text-blue-800">This link is for local testing. After deployment, copy the code from your live business portal to use it on a public website.</p>}
  </div>
}
