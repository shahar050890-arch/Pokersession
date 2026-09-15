import type { ReactNode } from 'react'
import { CardFan } from './decor'

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-ink-soft">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-hair border-t-jade" />
      {label && <p className="text-[15px]">{label}</p>}
    </div>
  )
}

export function ErrorNote({ children }: { children: ReactNode }) {
  return (
    <p
      className="rounded-control bg-loss/[0.12] px-4 py-3.5 text-[15px] text-loss"
      style={{ boxShadow: 'var(--clay-press)' }}
    >
      {children}
    </p>
  )
}

export function EmptyState({
  title,
  body,
  action,
  art,
}: {
  title: string
  body: string
  action?: ReactNode
  art?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <div className="mb-5">{art ?? <CardFan />}</div>
      <h2 className="text-[22px] font-bold tracking-tight">{title}</h2>
      <p className="mx-auto mt-2 max-w-[19rem] text-[15px] leading-relaxed text-ink-soft">
        {body}
      </p>
      {action && <div className="mt-7 w-full max-w-xs">{action}</div>}
    </div>
  )
}

/** Green for profit, red for loss, neutral at exactly zero. */
export function moneyClass(value: number): string {
  const rounded = Math.round(value * 100) / 100
  if (rounded > 0) return 'text-jade'
  if (rounded < 0) return 'text-loss'
  return 'text-ink-soft'
}
