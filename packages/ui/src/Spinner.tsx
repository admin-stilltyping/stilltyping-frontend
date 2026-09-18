import { cn } from './cn'

interface SpinnerProps {
  className?: string
}

export function Spinner({ className }: SpinnerProps) {
  return (
    <div role="status" className={cn('flex items-center justify-center py-12', className)}>
      <span className="sr-only">Loading…</span>
      <div aria-hidden="true" className="h-8 w-8 motion-safe:animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
    </div>
  )
}
