import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Clock, XCircle, CircleDashed, Sparkles, AlertTriangle, Lock } from 'lucide-react'
import { Badge, Button, Spinner } from '@nivaso/ui'
import { useTenantSlug } from '@/hooks/useTenantSlug'
import { listModuleCatalog, type ModuleCatalogEntry } from '@/api/moduleCatalog'
import { moduleRequestsApi, type FeatureRequest } from '@/api/moduleRequests'
import { WIDGET_DEPENDENCIES } from '@/config/dashboardWidgets'
import { Flag, type Plan } from '@nivaso/types'

// These modules are temporarily unavailable in the business portal.
const UNAVAILABLE_MODULES = new Set<string>([Flag.MODULE_OFFERS, Flag.MODULE_COUPONS])

const PLAN_TIERS: Plan[] = ['free', 'starter', 'pro', 'enterprise']
const PLAN_LABELS: Record<Plan, string> = {
  free: 'Free',
  starter: 'Starter',
  pro: 'Pro',
  enterprise: 'Enterprise',
}

type EntryStatus = 'enabled' | 'pending' | 'denied' | 'none'

function latestRequestFor(feature: string, requests: FeatureRequest[]): FeatureRequest | undefined {
  // Backend already returns most-recent-first, but sort defensively in case
  // that ordering assumption ever changes.
  return [...requests]
    .filter((r) => r.feature === feature)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
}

function statusFor(
  entry: ModuleCatalogEntry,
  flags: Record<string, boolean | number | string[] | null>,
  requests: FeatureRequest[],
): EntryStatus {
  if (flags[entry.key]) return 'enabled'
  const latest = latestRequestFor(entry.key, requests)
  if (!latest) return 'none'
  if (latest.status === 'pending') return 'pending'
  if (latest.status === 'denied') return 'denied'
  return 'none'
}

function StatusBadge({ status }: { status: EntryStatus }) {
  switch (status) {
    case 'enabled':
      return (
        <Badge colorClass="bg-green-100 text-green-700">
          <CheckCircle2 className="mr-1 h-3 w-3" />
          Enabled
        </Badge>
      )
    case 'pending':
      return (
        <Badge colorClass="bg-amber-100 text-amber-700">
          <Clock className="mr-1 h-3 w-3" />
          Pending review
        </Badge>
      )
    case 'denied':
      return (
        <Badge colorClass="bg-red-100 text-red-700">
          <XCircle className="mr-1 h-3 w-3" />
          Denied
        </Badge>
      )
    default:
      return (
        <Badge colorClass="bg-gray-100 text-gray-600">
          <CircleDashed className="mr-1 h-3 w-3" />
          Not requested
        </Badge>
      )
  }
}

function CatalogSection({
  title,
  entries,
  flags,
  requests,
  onRequest,
  pendingFeature,
  catalogByKey,
}: {
  title: string
  entries: ModuleCatalogEntry[]
  flags: Record<string, boolean | number | string[] | null>
  requests: FeatureRequest[]
  onRequest: (feature: string) => void
  pendingFeature: string | null
  catalogByKey: Record<string, string>
}) {
  if (entries.length === 0) return null

  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">{title}</h2>
      <div className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {entries.map((entry) => {
          const status = statusFor(entry, flags, requests)
          const submitting = pendingFeature === entry.key

          // A widget's own module must already be enabled before the widget
          // itself is requestable — mirrors the backend's server-side check.
          const depFlag = entry.category === 'widget' ? WIDGET_DEPENDENCIES[entry.key] : undefined
          const depMet = !depFlag || Boolean(flags[depFlag])
          const depLabel = depFlag ? catalogByKey[depFlag] ?? depFlag : null

          return (
            <div key={entry.key} className="flex items-center justify-between gap-4 px-5 py-3">
              <div>
                <p className="font-medium text-gray-900">{entry.display_name}</p>
                {entry.description && <p className="text-sm text-gray-500">{entry.description}</p>}
              </div>
              <div className="flex shrink-0 items-center gap-3">
                {!depMet && (status === 'none' || status === 'denied') ? (
                  <span className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Lock className="h-3.5 w-3.5" />
                    Enable {depLabel} first
                  </span>
                ) : (
                  <>
                    <StatusBadge status={status} />
                    {(status === 'none' || status === 'denied') && (
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        loading={submitting}
                        onClick={() => onRequest(entry.key)}
                      >
                        {status === 'denied' ? 'Request again' : 'Request Access'}
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function CatalogSkeleton() {
  return (
    <div className="animate-pulse space-y-2 rounded-xl border border-gray-200 bg-white p-5">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-10 rounded bg-gray-100" />
      ))}
    </div>
  )
}

export function RequestModulesPage() {
  const slug = useTenantSlug()
  const qc = useQueryClient()

  const catalogQuery = useQuery({
    queryKey: ['module-catalog'],
    queryFn: listModuleCatalog,
  })

  const entitlementsQuery = useQuery({
    queryKey: ['entitlements', slug],
    queryFn: () => moduleRequestsApi.getEntitlements(slug),
    enabled: !!slug,
  })

  const requestsQuery = useQuery({
    queryKey: ['feature-requests', slug],
    queryFn: () => moduleRequestsApi.listFeatureRequests(slug),
    enabled: !!slug,
  })

  const [submitError, setSubmitError] = useState<string | null>(null)

  const createRequest = useMutation({
    mutationFn: (feature: string) => moduleRequestsApi.createFeatureRequest(slug, { feature }),
    onSuccess: () => {
      setSubmitError(null)
      qc.invalidateQueries({ queryKey: ['feature-requests', slug] })
    },
    onError: (err: any) =>
      setSubmitError(err?.response?.data?.error?.message ?? 'Failed to submit request. Please try again.'),
  })

  const handleRequest = (feature: string) => {
    if (!slug) return
    setSubmitError(null)
    createRequest.mutate(feature)
  }

  // Feature-requests failing to load shouldn't block module/plan requests —
  // just treat it as "no history" so everything reads as "Not requested".
  const requests = requestsQuery.data ?? []
  // Entitlements failing to load shouldn't block the catalog from rendering —
  // fail closed on flags (nothing shows as enabled) and hide the plan
  // section (we genuinely don't know the plan).
  const flags = entitlementsQuery.data?.flags ?? {}
  const currentPlan = entitlementsQuery.data?.plan ?? null

  const availableCatalog = (catalogQuery.data ?? []).filter((entry) => {
    const dependency = WIDGET_DEPENDENCIES[entry.key]
    return !UNAVAILABLE_MODULES.has(entry.key) &&
      (!dependency || !UNAVAILABLE_MODULES.has(dependency))
  })
  const modules = availableCatalog.filter((e) => e.category === 'module')
  const integrations = availableCatalog.filter((e) => e.category === 'integration')
  const widgets = availableCatalog.filter((e) => e.category === 'widget')
  const catalogByKey = useMemo(
    () => Object.fromEntries((catalogQuery.data ?? []).map((e) => [e.key, e.display_name])),
    [catalogQuery.data],
  )

  const pendingPlanRequest = requests.some(
    (r) => r.feature.startsWith('plan:') && r.status === 'pending',
  )
  const pendingFeature = createRequest.isPending ? (createRequest.variables ?? null) : null

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Request Modules & Integrations</h1>
        <p className="mt-1 text-sm text-gray-500">
          Ask for access to additional modules, channel integrations, dashboard widgets, or a plan
          upgrade. Requests are reviewed by our team. Some widgets require their underlying module
          to be enabled first.
        </p>
      </div>

      {submitError && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertTriangle className="h-4 w-4" />
          {submitError}
        </div>
      )}

      {catalogQuery.isLoading ? (
        <CatalogSkeleton />
      ) : catalogQuery.isError ? (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertTriangle className="h-4 w-4" />
          Couldn't load the module catalog. Try refreshing the page.
        </div>
      ) : (
        <div className="space-y-8">
          <CatalogSection
            title="Modules"
            entries={modules}
            flags={flags}
            requests={requests}
            onRequest={handleRequest}
            pendingFeature={pendingFeature}
            catalogByKey={catalogByKey}
          />
          <CatalogSection
            title="Integrations"
            entries={integrations}
            flags={flags}
            requests={requests}
            onRequest={handleRequest}
            pendingFeature={pendingFeature}
            catalogByKey={catalogByKey}
          />
          <CatalogSection
            title="Widgets"
            entries={widgets}
            flags={flags}
            requests={requests}
            onRequest={handleRequest}
            pendingFeature={pendingFeature}
            catalogByKey={catalogByKey}
          />
        </div>
      )}

      {entitlementsQuery.isLoading ? (
        <Spinner />
      ) : currentPlan !== null ? (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
            <Sparkles className="h-4 w-4" />
            Plan
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {PLAN_TIERS.map((tier) => {
              const isCurrent = tier === currentPlan
              const feature = `plan:${tier}`
              const submitting = pendingFeature === feature
              return (
                <div
                  key={tier}
                  className={
                    isCurrent
                      ? 'rounded-xl border-2 border-blue-500 bg-blue-50 p-4'
                      : 'rounded-xl border border-gray-200 bg-white p-4'
                  }
                >
                  <div className="mb-2 flex items-center justify-between">
                    <p className="font-medium text-gray-900">{PLAN_LABELS[tier]}</p>
                    {isCurrent && <Badge colorClass="bg-blue-100 text-blue-700">Current</Badge>}
                  </div>
                  {!isCurrent && (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="w-full justify-center"
                      disabled={pendingPlanRequest && !submitting}
                      loading={submitting}
                      onClick={() => handleRequest(feature)}
                    >
                      {pendingPlanRequest ? 'Upgrade request pending' : 'Request Upgrade'}
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      ) : null}
    </div>
  )
}
