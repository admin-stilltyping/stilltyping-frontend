import { cn } from './cn'
import type { HTMLAttributes } from 'react'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  colorClass?: string
}

export function Badge({ colorClass, className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        colorClass ?? 'bg-gray-100 text-gray-700',
        className,
      )}
      {...props}
    >
      {children}
    </span>
  )
}
