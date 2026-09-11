import type { BudgetStatus } from '../lib/budget'
import { currentMonthKey, formatMoney, formatMonth } from '../lib/format'

interface Props {
  status: BudgetStatus
  onConfigure: () => void
}

/** Green with headroom, amber under 20% left, red once overdrawn. */
function tone(s: BudgetStatus) {
  if (s.overBudget) return { bar: 'bg-down dark:bg-down-night', text: 'text-down dark:text-down-night' }
  if (s.usedRatio > 0.8) return { bar: 'bg-flag dark:bg-flag-night', text: 'text-flag dark:text-flag-night' }
  return { bar: 'bg-up dark:bg-up-night', text: 'text-up dark:text-up-night' }
}

export default function BudgetCard({ status, onConfigure }: Props) {
  if (!status.configured) {
    return (
      <button onClick={onConfigure} className="surface row-press w-full px-5 py-4 text-right">
        <p className="text-[16px] font-semibold">הגדר תקציב חודשי</p>
        <p className="mt-1 text-[14px] leading-relaxed text-ink-soft dark:text-zinc-400">
          כדי לראות כמה נשאר לך לשחק החודש.
        </p>
      </button>
    )
  }

  const { bar, text } = tone(status)

  return (
    <section className="surface px-5 py-4">
      <div className="flex items-baseline justify-between">
        <span className="label">נשאר ב{formatMonth(currentMonthKey())}</span>
        <span className="num text-[13px] text-ink-faint">
          {formatMoney(status.spent)} / {formatMoney(status.allowance)}
        </span>
      </div>

      <p className={`num mt-1.5 text-big ${text}`}>{formatMoney(status.remaining)}</p>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-line dark:bg-night-line">
        <div
          className={`h-full rounded-full transition-all duration-500 ${bar}`}
          style={{ width: `${Math.max(status.usedRatio * 100, status.spent > 0 ? 4 : 0)}%` }}
        />
      </div>

      {(status.carriedIn > 0 || status.overBudget) && (
        <p className="mt-2.5 text-[13px] text-ink-soft dark:text-zinc-500">
          {status.overBudget
            ? `חרגת ב-${formatMoney(Math.abs(status.remaining))}`
            : `כולל ${formatMoney(status.carriedIn)} שעברו מהחודש הקודם`}
        </p>
      )}
    </section>
  )
}
