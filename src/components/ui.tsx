import type { ReactNode } from 'react'
import { SpadeIcon } from './icons'

export function PageTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="mb-5">
      <h1 className="text-[28px] font-bold tracking-tight">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-ink-soft dark:text-zinc-400">{subtitle}</p>}
    </header>
  )
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-ink-soft dark:text-zinc-400">
      <div className="h-7 w-7 animate-spin rounded-full border-2 border-zinc-300 border-t-ink dark:border-zinc-700 dark:border-t-white" />
      {label && <p className="text-sm">{label}</p>}
    </div>
  )
}

export function ErrorNote({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-xl bg-red-50 px-3.5 py-3 text-sm text-loss dark:bg-red-950/40 dark:text-red-300">
      {children}
    </p>
  )
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string
  body: string
  action?: ReactNode
}) {
  return (
    <div className="card flex flex-col items-center px-6 py-12 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-muted text-ink-soft dark:bg-zinc-800 dark:text-zinc-400">
        <SpadeIcon className="h-8 w-8" />
      </div>
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-soft dark:text-zinc-400">{body}</p>
      {action && <div className="mt-6 w-full max-w-xs">{action}</div>}
    </div>
  )
}

/** Green for profit, red for loss, neutral at exactly zero. */
export function profitClass(value: number): string {
  const rounded = Math.round(value * 100) / 100
  if (rounded > 0) return 'text-profit'
  if (rounded < 0) return 'text-loss'
  return 'text-ink-soft dark:text-zinc-400'
}
