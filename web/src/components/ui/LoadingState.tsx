import { LoaderCircle } from 'lucide-react'
import { cn } from '@/utils/cn'

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn('rounded-md bg-slate-200/70 motion-safe:animate-pulse', className)} />
}

export function InlineLoading({ label = 'Loading…', className }: { label?: string; className?: string }) {
  return (
    <div role="status" className={cn('flex items-center gap-2.5 py-3 text-sm text-slate-500', className)}>
      <LoaderCircle aria-hidden="true" className="h-4 w-4 shrink-0 text-blue-600 motion-safe:animate-spin" />
      <span>{label}</span>
    </div>
  )
}

type LoadingVariant = 'table' | 'form' | 'cards'

/** Reserve the shape of the incoming content, including on narrow screens. */
export function PageSkeleton({ label = 'Loading page…', variant = 'table' }: { label?: string; variant?: LoadingVariant }) {
  return (
    <div role="status" aria-label={label} className="w-full space-y-5">
      <span className="sr-only">{label}</span>
      <div aria-hidden="true" className="flex items-center justify-between gap-6">
        <div className="w-full max-w-sm space-y-2.5"><Skeleton className="h-5 w-2/5" /><Skeleton className="h-3 w-4/5" /></div>
        <Skeleton className="h-9 w-24 shrink-0" />
      </div>
      {variant === 'table' ? (
        <div aria-hidden="true" className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="grid grid-cols-3 gap-8 border-b border-slate-200 bg-slate-50 px-5 py-4 sm:grid-cols-4">
            {[0, 1, 2, 3].map(i => <Skeleton key={i} className={cn('h-3 w-3/4', i === 3 && 'hidden sm:block')} />)}
          </div>
          {Array.from({ length: 6 }, (_, row) => (
            <div key={row} className="grid grid-cols-3 gap-8 border-b border-slate-100 px-5 py-5 last:border-0 sm:grid-cols-4">
              {[0, 1, 2, 3].map(i => <Skeleton key={i} className={cn('h-3.5', (row + i) % 2 ? 'w-3/5' : 'w-4/5', i === 3 && 'hidden sm:block')} />)}
            </div>
          ))}
        </div>
      ) : variant === 'form' ? (
        <div aria-hidden="true" className="max-w-3xl space-y-6 rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
          {[0, 1, 2].map(i => <div key={i} className="space-y-2"><Skeleton className="h-3 w-24" /><Skeleton className={i === 2 ? 'h-32 w-full' : 'h-10 w-full'} /></div>)}
          <Skeleton className="h-10 w-32" />
        </div>
      ) : (
        <div aria-hidden="true" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => <div key={i} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5"><Skeleton className="h-9 w-9" /><Skeleton className="h-4 w-2/3" /><Skeleton className="h-3 w-full" /><Skeleton className="h-3 w-4/5" /></div>)}
        </div>
      )}
    </div>
  )
}

export function PortalSkeleton() {
  return (
    <div role="status" aria-label="Loading your business" className="flex h-dvh bg-slate-50">
      <span className="sr-only">Loading your business…</span>
      <div aria-hidden="true" className="hidden w-56 shrink-0 space-y-7 border-r border-slate-200 bg-white p-5 md:block">
        <Skeleton className="mb-12 h-6 w-32" />
        {Array.from({ length: 8 }, (_, i) => <div key={i} className="flex gap-3"><Skeleton className="h-5 w-5" /><Skeleton className="h-5 w-28" /></div>)}
      </div>
      <div className="min-w-0 flex-1">
        <div aria-hidden="true" className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-5"><Skeleton className="h-5 w-36" /><Skeleton className="h-8 w-20" /></div>
        <div className="p-4 sm:p-6" aria-hidden="true"><PageSkeleton variant="cards" /></div>
      </div>
    </div>
  )
}
