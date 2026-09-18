import { Button, Input, Select } from '@nivaso/ui'
import { apiError } from '@/utils/apiError'
import type { Contact, Platform } from './types'

export const card = 'rounded-xl border border-gray-200 bg-white p-5 shadow-sm'
export const linkClass = 'text-blue-600 hover:underline'
export const tableClass = 'w-full min-w-[600px] text-left text-sm [&_th]:px-4 [&_th]:py-3 [&_th]:font-medium [&_td]:px-4 [&_td]:py-3 [&_td]:align-top'

export function ErrorNotice({ error, retry }: { error: unknown; retry?: () => void }) {
  if (!error) return null
  return <div role="alert" className="my-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
    {apiError(error, 'Could not complete the request. Please try again.')}
    {retry && <button type="button" onClick={retry} className="ml-2 underline">Retry</button>}
  </div>
}

export function Pager({ offset, total, onChange, size = 25 }: { offset: number; total: number; onChange: (offset: number) => void; size?: number }) {
  return <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-gray-500">
    <span>{total ? `${offset + 1}–${Math.min(offset + size, total)} of ${total}` : '0 records'}</span>
    <div className="flex gap-2">
      <Button type="button" size="sm" variant="secondary" disabled={offset === 0} onClick={() => onChange(Math.max(0, offset - size))}>Previous</Button>
      <Button type="button" size="sm" variant="secondary" disabled={offset + size >= total} onClick={() => onChange(offset + size)}>Next</Button>
    </div>
  </div>
}

export function ContactFields({ value, onChange, disabled = false }: { value: Contact; onChange: (value: Contact) => void; disabled?: boolean }) {
  return <fieldset disabled={disabled} className="space-y-3">
    <Input label="Phone number" type="tel" placeholder="+919876543210" maxLength={40} value={value.phone ?? ''} onChange={e => onChange({ ...value, phone: e.target.value || null })} />
    <p className="text-xs text-gray-500">Include the country code. Phone and social identities are optional for an enquiry; at least one is needed for a customer.</p>
    {value.social_identities.map((social, index) => <div key={index} className="flex items-end gap-2">
      <Select label={`Platform ${index + 1}`} value={social.platform} options={['whatsapp', 'instagram', 'telegram', 'facebook'].map(value => ({ value, label: value }))} onChange={e => onChange({ ...value, social_identities: value.social_identities.map((s, i) => i === index ? { ...s, platform: e.target.value as Platform } : s) })} />
      <Input label={`Social ID ${index + 1}`} value={social.external_id} required maxLength={500} onChange={e => onChange({ ...value, social_identities: value.social_identities.map((s, i) => i === index ? { ...s, external_id: e.target.value } : s) })} />
      <Button type="button" size="sm" variant="secondary" aria-label={`Remove social identity ${index + 1}`} onClick={() => onChange({ ...value, social_identities: value.social_identities.filter((_, i) => i !== index) })}>Remove</Button>
    </div>)}
    <Button type="button" size="sm" variant="secondary" disabled={value.social_identities.length >= 10} onClick={() => onChange({ ...value, social_identities: [...value.social_identities, { platform: 'instagram', external_id: '' }] })}>Add social identity</Button>
  </fieldset>
}
