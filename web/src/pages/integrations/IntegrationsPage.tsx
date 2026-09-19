import { ErrorState } from '@/components/ui/ErrorState'
import { PageSkeleton } from '@/components/ui/LoadingState'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bot, MessageSquare, Globe, Trash2, Save, CreditCard, Instagram } from 'lucide-react'
import { channelsApi } from '@/api/channels'
import { FeatureGate } from '@/components/ui/FeatureGate'
import { Button, Input } from '@nivaso/ui'
import { useTenantSlug } from '@/hooks/useTenantSlug'
import { cn } from '@/utils/cn'
import { Flag, type FlagKey } from '@nivaso/types'
import type { ConnectorType } from '@/types/connector'
import { WebChatSetup } from '@/features/public-chat/WebChatSetup'
import { InstagramConfigureForm } from '@/features/integrations/InstagramConfigureForm'
import { GeminiIntegrationCard } from '@/features/integrations/GeminiIntegrationCard'

// ── Channel status badge ──────────────────────────────────────────────────────

function ChannelStatus({ configured, configuredLabel = 'Connected' }: { configured: boolean; configuredLabel?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        configured ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500',
      )}
    >
      <span
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          configured ? 'bg-green-500' : 'bg-gray-400',
        )}
      />
      {configured ? configuredLabel : 'Not configured'}
    </span>
  )
}

// ── Copy button ───────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <button
      onClick={copy}
      className="ml-1 text-xs font-medium text-blue-600 hover:underline"
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}

// ── Connector card wrapper ────────────────────────────────────────────────────

interface ConnectorCardProps {
  title: string
  icon: React.ReactNode
  configured: boolean
  configuredLabel?: string
  featureFlag?: FlagKey
  featureLabel?: string
  slug: string
  connectorType: ConnectorType
  configureContent: React.ReactNode
}

function ConnectorCard({
  title,
  icon,
  configured,
  configuredLabel,
  featureFlag,
  featureLabel,
  configureContent,
}: ConnectorCardProps) {
  const inner = (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Card header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        </div>
        <ChannelStatus configured={configured} configuredLabel={configuredLabel} />
      </div>

      {/* Content */}
      <div className="p-5">{configureContent}</div>
    </div>
  )

  if (featureFlag && featureLabel) {
    return (
      <FeatureGate flag={featureFlag} label={featureLabel}>
        {inner}
      </FeatureGate>
    )
  }

  return inner
}

// ── Telegram configure form ───────────────────────────────────────────────────

function TelegramConfigureForm({ slug }: { slug: string }) {
  const qc = useQueryClient()
  const backendHost = import.meta.env.VITE_API_BASE_URL || window.location.origin

  const { data: channels = [] } = useQuery({
    queryKey: ['channels', slug],
    queryFn: () => channelsApi.list(slug),
  })

  const tgChannel = channels.find((c) => c.channel_type === 'telegram')

  const [tgToken, setTgToken] = useState('')
  const [tgSecret, setTgSecret] = useState('')
  const [saved, setSaved] = useState(false)

  const { mutate: saveTelegram, isPending: saving } = useMutation({
    mutationFn: (payload: { bot_token: string; webhook_secret: string }) =>
      channelsApi.configureTelegram(slug, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['channels', slug] })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    },
  })

  const { mutate: removeChannel } = useMutation({
    mutationFn: (type: string) => channelsApi.remove(slug, type),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['channels', slug] }),
  })

  return (
    <div className="space-y-3">
      {tgChannel && (
        <div className="rounded-lg bg-green-50 px-3 py-2 text-xs text-green-700">
          <span className="font-medium">Webhook registered automatically: </span>
          <span className="font-mono break-all">
            {backendHost}/webhooks/telegram/{slug}
          </span>
          <CopyButton text={`${backendHost}/webhooks/telegram/${slug}`} />
        </div>
      )}
      <Input
        label="Bot Token"
        type="password"
        value={tgToken}
        onChange={(e) => setTgToken(e.target.value)}
        placeholder={tgChannel ? '••••••• (leave blank to keep current)' : '123456789:AAHdq…'}
      />
      <Input
        label="Webhook Secret"
        type="password"
        value={tgSecret}
        onChange={(e) => setTgSecret(e.target.value)}
        placeholder="Optional secret used in setWebhook"
      />
      <div className="flex items-center gap-3">
        <Button
          size="sm"
          onClick={() => saveTelegram({ bot_token: tgToken, webhook_secret: tgSecret })}
          loading={saving}
          disabled={!tgToken}
        >
          <Save className="h-4 w-4" />
          {tgChannel ? 'Update' : 'Connect'} Telegram
        </Button>
        {tgChannel && (
          <button
            onClick={() => removeChannel('telegram')}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors"
          >
            <Trash2 className="h-3 w-3" /> Remove
          </button>
        )}
        {saved && <span className="text-xs font-medium text-green-600">Saved!</span>}
      </div>
    </div>
  )
}

// ── WhatsApp configure form ───────────────────────────────────────────────────

function WhatsAppConfigureForm({ slug }: { slug: string }) {
  const qc = useQueryClient()
  const backendHost = import.meta.env.VITE_API_BASE_URL || window.location.origin

  const { data: channels = [] } = useQuery({
    queryKey: ['channels', slug],
    queryFn: () => channelsApi.list(slug),
  })

  const waChannel = channels.find((c) => c.channel_type === 'whatsapp')

  const [waPhoneId, setWaPhoneId] = useState('')
  const [waToken, setWaToken] = useState('')
  const [waAppSecret, setWaAppSecret] = useState('')
  const [waVerifyToken, setWaVerifyToken] = useState('')
  const [saved, setSaved] = useState(false)

  const { mutate: saveWhatsApp, isPending: saving } = useMutation({
    mutationFn: (payload: {
      phone_number_id: string
      access_token: string
      app_secret: string
      verify_token: string
    }) => channelsApi.configureWhatsApp(slug, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['channels', slug] })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    },
  })

  const { mutate: removeChannel } = useMutation({
    mutationFn: (type: string) => channelsApi.remove(slug, type),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['channels', slug] }),
  })

  return (
    <div className="space-y-3">
      <div className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500">
        <span className="font-medium">Webhook URL (register in Meta dashboard): </span>
        <span className="font-mono">{backendHost}/webhooks/whatsapp</span>
        <CopyButton text={`${backendHost}/webhooks/whatsapp`} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Phone Number ID"
          value={waPhoneId}
          onChange={(e) => setWaPhoneId(e.target.value)}
          placeholder={waChannel ? '(current)' : '104xxxx'}
        />
        <Input
          label="Access Token"
          type="password"
          value={waToken}
          onChange={(e) => setWaToken(e.target.value)}
          placeholder={waChannel ? '•••••' : 'EAAx…'}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="App Secret"
          type="password"
          value={waAppSecret}
          onChange={(e) => setWaAppSecret(e.target.value)}
          placeholder="Optional HMAC signing secret"
        />
        <Input
          label="Verify Token"
          value={waVerifyToken}
          onChange={(e) => setWaVerifyToken(e.target.value)}
          placeholder="Meta verification token"
        />
      </div>
      <div className="flex items-center gap-3">
        <Button
          size="sm"
          onClick={() =>
            saveWhatsApp({
              phone_number_id: waPhoneId,
              access_token: waToken,
              app_secret: waAppSecret,
              verify_token: waVerifyToken,
            })
          }
          loading={saving}
          disabled={!waPhoneId || !waToken}
        >
          <Save className="h-4 w-4" />
          {waChannel ? 'Update' : 'Connect'} WhatsApp
        </Button>
        {waChannel && (
          <button
            onClick={() => removeChannel('whatsapp')}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors"
          >
            <Trash2 className="h-3 w-3" /> Remove
          </button>
        )}
        {saved && <span className="text-xs font-medium text-green-600">Saved!</span>}
      </div>
    </div>
  )
}

// ── Web configure form ────────────────────────────────────────────────────────

// ── Razorpay configure form ───────────────────────────────────────────────────

function RazorpayConfigureForm({ slug }: { slug: string }) {
  const qc = useQueryClient()
  const backendHost = import.meta.env.VITE_API_BASE_URL || window.location.origin

  const { data: channels = [] } = useQuery({
    queryKey: ['channels', slug],
    queryFn: () => channelsApi.list(slug),
  })

  const rzpChannel = channels.find((c) => c.channel_type === 'razorpay')

  const [keyId, setKeyId] = useState('')
  const [keySecret, setKeySecret] = useState('')
  const [webhookSecret, setWebhookSecret] = useState('')
  const [saved, setSaved] = useState(false)

  const { mutate: saveRazorpay, isPending: saving } = useMutation({
    mutationFn: (payload: { key_id: string; key_secret: string; webhook_secret: string }) =>
      channelsApi.configureRazorpay(slug, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['channels', slug] })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    },
  })

  const { mutate: removeChannel } = useMutation({
    mutationFn: (type: string) => channelsApi.remove(slug, type),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['channels', slug] }),
  })

  return (
    <div className="space-y-3">
      {rzpChannel && (
        <div className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500">
          <span className="font-medium">Webhook URL for Razorpay dashboard: </span>
          <span className="font-mono break-all">{backendHost}/webhooks/razorpay/{slug}</span>
          <CopyButton text={`${backendHost}/webhooks/razorpay/${slug}`} />
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Key ID"
          value={keyId}
          onChange={(e) => setKeyId(e.target.value)}
          placeholder={rzpChannel ? '(current)' : 'rzp_test_…'}
        />
        <Input
          label="Key Secret"
          type="password"
          value={keySecret}
          onChange={(e) => setKeySecret(e.target.value)}
          placeholder={rzpChannel ? '•••••' : 'your-secret'}
        />
      </div>
      <Input
        label="Webhook Secret"
        type="password"
        value={webhookSecret}
        onChange={(e) => setWebhookSecret(e.target.value)}
        placeholder="Secret set in Razorpay dashboard"
      />
      <div className="flex items-center gap-3">
        <Button
          size="sm"
          onClick={() => saveRazorpay({ key_id: keyId, key_secret: keySecret, webhook_secret: webhookSecret })}
          loading={saving}
          disabled={!keyId || !keySecret}
        >
          <Save className="h-4 w-4" />
          {rzpChannel ? 'Update' : 'Connect'} Razorpay
        </Button>
        {rzpChannel && (
          <button
            onClick={() => removeChannel('razorpay')}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors"
          >
            <Trash2 className="h-3 w-3" /> Remove
          </button>
        )}
        {saved && <span className="text-xs font-medium text-green-600">Saved!</span>}
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function IntegrationsPage() {
  const slug = useTenantSlug()

  const { data: channels = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ['channels', slug],
    queryFn: () => channelsApi.list(slug),
    enabled: !!slug,
  })

  if (!slug) return null
  if (isLoading) return <PageSkeleton label="Loading integrations…" variant="cards" />
  if (error) return <ErrorState error={error} title="Unable to load integrations" onRetry={() => void refetch()} />

  const tgChannel = channels.find((c) => c.channel_type === 'telegram')
  const waChannel = channels.find((c) => c.channel_type === 'whatsapp')
  const igChannel = channels.find((c) => c.channel_type === 'instagram')
  const rzpChannel = channels.find((c) => c.channel_type === 'razorpay')

  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Integrations</h2>
        <p className="text-sm text-gray-500">
          Configure your AI provider, messaging channels, and payments.
        </p>
      </div>

      <GeminiIntegrationCard key={slug} slug={slug} />

      <ConnectorCard
        title="Instagram"
        icon={<Instagram className="h-5 w-5 text-pink-600" />}
        configured={igChannel?.configured ?? false}
        configuredLabel="Setup saved"
        featureFlag={Flag.CHANNEL_INSTAGRAM}
        featureLabel="Instagram"
        slug={slug}
        connectorType="instagram"
        configureContent={<InstagramConfigureForm slug={slug} channel={igChannel} unavailable={isError} />}
      />

      {/* Telegram */}
      <ConnectorCard
        title="Telegram Bot"
        icon={<Bot className="h-5 w-5 text-blue-500" />}
        configured={tgChannel?.configured ?? false}
        featureFlag={Flag.CHANNEL_TELEGRAM}
        featureLabel="Telegram Channel"
        slug={slug}
        connectorType="telegram"
        configureContent={<TelegramConfigureForm slug={slug} />}
      />

      {/* WhatsApp */}
      <ConnectorCard
        title="WhatsApp Business"
        icon={<MessageSquare className="h-5 w-5 text-green-500" />}
        configured={waChannel?.configured ?? false}
        featureFlag={Flag.CHANNEL_WHATSAPP}
        featureLabel="WhatsApp Channel"
        slug={slug}
        connectorType="whatsapp"
        configureContent={<WhatsAppConfigureForm slug={slug} />}
      />

      {/* Web Chat */}
      <ConnectorCard
        title="Web Chat"
        icon={<Globe className="h-5 w-5 text-indigo-500" />}
        configured={true}
        slug={slug}
        connectorType="web"
        configureContent={<WebChatSetup slug={slug} />}
      />

      {/* Razorpay — payment provider, no automation tab */}
      <ConnectorCard
        title="Razorpay Payments"
        icon={<CreditCard className="h-5 w-5 text-blue-500" />}
        configured={rzpChannel?.configured ?? false}
        featureFlag={Flag.CHANNEL_PAYMENTS}
        featureLabel="Razorpay Payments"
        slug={slug}
        connectorType="web"
        configureContent={<RazorpayConfigureForm slug={slug} />}
      />
    </div>
  )
}
