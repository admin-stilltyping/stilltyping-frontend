import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/utils/cn'

/** Numbered section divider — the structural device that runs down the page. */
export function SectionHead({
  index,
  title,
  hint,
}: {
  index: string
  title: string
  hint?: string
}) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <span className="font-mono text-xs font-medium text-dash-violet">{index}</span>
      <h2 className="font-display text-sm font-semibold uppercase tracking-[0.14em] text-dash-ink">{title}</h2>
      <span className="h-px flex-1 bg-dash-line" />
      {hint && <span className="font-mono text-[11px] text-dash-ink3">{hint}</span>}
    </div>
  )
}

interface PanelProps {
  title?: string
  icon?: LucideIcon
  action?: ReactNode
  children: ReactNode
  className?: string
  bodyClassName?: string
}

/** A console card: hairline border, faint surface, mono eyebrow header. */
export function Panel({ title, icon: Icon, action, children, className, bodyClassName }: PanelProps) {
  return (
    <section
      className={cn(
        'rounded-xl border border-dash-line bg-dash-surface/80 shadow-sm',
        className,
      )}
    >
      {(title || action) && (
        <header className="flex items-center gap-2 border-b border-dash-line px-4 py-3">
          {Icon && <Icon className="h-4 w-4 text-dash-ink3" />}
          {title && (
            <h3 className="font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-dash-ink2">{title}</h3>
          )}
          {action && <div className="ml-auto">{action}</div>}
        </header>
      )}
      <div className={cn('p-4', bodyClassName)}>{children}</div>
    </section>
  )
}
