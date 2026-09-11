import type { ReactNode } from 'react'
import { SpadeIcon } from './icons'

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-ink-soft dark:text-zinc-400">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-line border-t-ink dark:border-night-line dark:border-t-white" />
      {label && <p className="text-[15px]">{label}</p>}
    </div>
  )
}

export function ErrorNote({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-xl bg-down-soft px-4 py-3 text-[15px] text-down dark:bg-down/10 dark:text-down-night">
      {children}
    </p>
  )
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-ink text-white dark:bg-white dark:text-night-bg">
        <SpadeIcon className="h-7 w-7" />
      </div>
      <h2 className="text-[22px] font-bold tracking-tight">{title}</h2>
      <p className="mx-auto mt-2 max-w-[19rem] text-[15px] leading-relaxed text-ink-soft dark:text-zinc-400">
        {body}
      </p>
      {action && <div className="mt-7 w-full max-w-xs">{action}</div>}
    </div>
  )
}

/** Green for profit, red for loss, neutral at exactly zero. */
export function moneyClass(value: number): string {
  const rounded = Math.round(value * 100) / 100
  if (rounded > 0) return 'text-up dark:text-up-night'
  if (rounded < 0) return 'text-down dark:text-down-night'
  return 'text-ink-soft dark:text-zinc-400'
}
