import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ExternalLink, Save, Trash2 } from 'lucide-react'
import { Button, Input } from '@nivaso/ui'
import { channelsApi } from '@/api/channels'
import type { BusinessChannel, InstagramChannelPayload } from '@/types/channel'
import { apiError } from '@/utils/apiError'

export function InstagramConfigureForm({ slug, channel, unavailable = false }: {
  slug: string
  channel?: BusinessChannel
  unavailable?: boolean
}) {
  const qc = useQueryClient()
  const [accountId, setAccountId] = useState(channel?.external_channel_id || '')
  const [accessToken, setAccessToken] = useState('')
  const [appSecret, setAppSecret] = useState('')
  const [verifyToken, setVerifyToken] = useState('')
  const [confirmDisconnect, setConfirmDisconnect] = useState(false)
  const [notice, setNotice] = useState('')
  const [copyNotice, setCopyNotice] = useState('')
  const configured = channel?.configured ?? false
  const backendHost = (import.meta.env.VITE_PUBLIC_API_BASE_URL || import.meta.env.VITE_API_BASE_URL || window.location.origin).replace(/\/$/, '')
  const callbackUrl = new URL(`${backendHost}/webhooks/instagram`, window.location.origin)
  const callback = callbackUrl.href
  const callbackIsLocal = callbackUrl.protocol !== 'https:' || /(^|\.)localhost$/.test(callbackUrl.hostname) || ['127.0.0.1', '[::1]'].includes(callbackUrl.hostname)

  useEffect(() => { setAccountId(channel?.external_channel_id || '') }, [channel?.external_channel_id])

  function clearSecrets() { setAccessToken(''); setAppSecret(''); setVerifyToken('') }

  const save = useMutation({
    mutationFn: (payload: InstagramChannelPayload) => channelsApi.configureInstagram(slug, payload),
    onSuccess: (result) => {
      clearSecrets()
      qc.setQueryData<BusinessChannel[]>(['channels', slug], (current = []) => [...current.filter((item) => item.channel_type !== 'instagram'), result])
      void qc.invalidateQueries({ queryKey: ['channels', slug] })
      setNotice('Instagram setup saved. Complete the webhook setup in Meta to receive messages.')
    },
  })
  const disconnect = useMutation({
    mutationFn: () => channelsApi.remove(slug, 'instagram'),
    onSuccess: () => {
      clearSecrets(); setAccountId(''); setConfirmDisconnect(false)
      qc.setQueryData<BusinessChannel[]>(['channels', slug], (current = []) => current.filter((item) => item.channel_type !== 'instagram'))
      void qc.invalidateQueries({ queryKey: ['channels', slug] })
      setNotice('Instagram disconnected. Saved conversations and enquiries are retained.')
    },
  })
  const busy = save.isPending || disconnect.isPending
  const error = save.error || disconnect.error
  const secretsComplete = configured || Boolean(accessToken.trim() && appSecret.trim() && verifyToken.trim())

  return <div className="space-y-4">
    <p className="text-sm leading-relaxed text-gray-600">Connect an Instagram professional account so customers can message your AI assistant in Instagram DMs.</p>
    <div className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-xs font-semibold text-gray-700">Webhook callback URL</h4>
        <button type="button" className="text-xs font-medium text-blue-600 hover:underline" onClick={async () => {
          try { await navigator.clipboard.writeText(callback); setCopyNotice('Copied') }
          catch { setCopyNotice('Select and copy the URL below.') }
        }}>Copy URL</button>
      </div>
      <code className="block break-all text-xs text-gray-700">{callback}</code>
      {copyNotice && <p role="status" className="text-xs text-gray-600">{copyNotice}</p>}
      {callbackIsLocal && <p className="text-xs leading-relaxed text-amber-800">For live Instagram messages, use a public HTTPS backend URL. Meta cannot deliver webhooks to localhost.</p>}
    </div>
    <form className="space-y-3" onSubmit={(event) => {
      event.preventDefault()
      if (busy || unavailable) return
      setNotice(''); disconnect.reset()
      save.mutate({ account_id: accountId.trim(), ...(accessToken.trim() ? { access_token: accessToken.trim() } : {}), ...(appSecret.trim() ? { app_secret: appSecret.trim() } : {}), ...(verifyToken.trim() ? { verify_token: verifyToken.trim() } : {}) })
    }}>
      <fieldset disabled={busy || unavailable || confirmDisconnect} className="space-y-3 disabled:opacity-60">
        <Input label="Instagram account ID" value={accountId} onChange={(event) => setAccountId(event.target.value)} readOnly={Boolean(channel)} required pattern="[0-9]{1,50}" maxLength={50} inputMode="numeric" placeholder="Your numeric Instagram professional account ID" />
        {channel && <p className="text-xs text-gray-500">Disconnect this account before switching to a different account.</p>}
        <Input label="Instagram access token" type="password" autoComplete="new-password" value={accessToken} onChange={(event) => setAccessToken(event.target.value)} required={!configured} maxLength={8192} placeholder={configured ? 'Saved — leave blank to keep current' : 'Access token for Instagram Login'} />
        <Input label="Meta app secret" type="password" autoComplete="new-password" value={appSecret} onChange={(event) => setAppSecret(event.target.value)} required={!configured} maxLength={512} placeholder={configured ? 'Saved — leave blank to keep current' : 'App secret used to verify webhook signatures'} />
        <Input label="Webhook verify token" type="password" autoComplete="new-password" value={verifyToken} onChange={(event) => setVerifyToken(event.target.value)} required={!configured} maxLength={256} placeholder={configured ? 'Saved — leave blank to keep current' : 'Choose a token and use the same value in Meta'} />
        {configured && <p className="text-xs text-gray-500">Saved tokens are never displayed. Enter a new value only to replace it.</p>}
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" size="sm" loading={save.isPending} disabled={busy || !/^[0-9]{1,50}$/.test(accountId.trim()) || !secretsComplete}><Save className="h-4 w-4" />{channel ? 'Update Instagram' : 'Save Instagram setup'}</Button>
          {channel && <button type="button" className="flex items-center gap-1 text-xs text-red-600 hover:underline" onClick={() => { setConfirmDisconnect(true); setNotice(''); save.reset(); disconnect.reset() }}><Trash2 className="h-3 w-3" />Disconnect</button>}
        </div>
      </fieldset>
    </form>
    {confirmDisconnect && <div className="space-y-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
      <p>Disconnect Instagram from this business? You will need to enter the credentials again to reconnect.</p>
      <div className="flex gap-4"><button type="button" disabled={busy} className="font-semibold disabled:opacity-50" onClick={() => disconnect.mutate()}>Disconnect Instagram</button><button type="button" disabled={busy} onClick={() => setConfirmDisconnect(false)}>Cancel</button></div>
    </div>}
    {error && <p role="alert" className="text-sm text-red-600">{apiError(error, 'Instagram settings could not be saved. Please try again.')}</p>}
    {notice && <p role="status" className="text-sm text-green-700">{notice}</p>}
    <details className="rounded-lg border border-gray-200 p-3 text-sm text-gray-600">
      <summary className="cursor-pointer font-medium text-gray-800">Complete setup in Meta</summary>
      <ol className="mt-3 list-decimal space-y-2 pl-5 text-xs leading-relaxed">
        <li>Use an Instagram Business or Creator account with the Instagram API with Instagram Login.</li>
        <li>Obtain an access token with the messaging permissions for your app and account.</li>
        <li>Save the credentials above. In Meta, register the public callback URL and the same verify token, then subscribe your account to message webhooks.</li>
        <li>Send a DM from an allowed test account. App access and review requirements depend on your Meta app setup.</li>
      </ol>
      <a className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-blue-600" href="https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/messaging-api/" target="_blank" rel="noreferrer">Meta Instagram setup guide <ExternalLink size={12} /></a>
      <p className="mt-3 text-xs leading-relaxed">This integration handles text DMs. When Leads is enabled, incoming enquiries are recorded as leads.</p>
    </details>
  </div>
}
