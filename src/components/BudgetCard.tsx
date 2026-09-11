import type { BudgetStatus } from '../lib/budget'
import { currentMonthKey, formatMoney, formatMonth } from '../lib/format'

interface Props {
  status: BudgetStatus
  onConfigure: () => void
}

/** Green with headroom, amber under 20% left, red once overdrawn. */
function tone(status: BudgetStatus) {
  if (status.overBudget) return { bar: 'bg-loss', text: 'text-loss' }
  if (status.usedRatio > 0.8) return { bar: 'bg-warn', text: 'text-warn' }
  return { bar: 'bg-profit', text: 'text-profit' }
}

export default function BudgetCard({ status, onConfigure }: Props) {
  if (!status.configured) {
    return (
      <div className="card">
        <h2 className="text-base font-semibold">תקציב חודשי</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft dark:text-zinc-400">
          עוד לא הגדרת תקציב חודשי. הגדר אחד כדי לעקוב כמה נשאר לך לשחק החודש.
        </p>
        <button
          onClick={onConfigure}
          className="mt-4 rounded-xl bg-surface-muted px-4 py-2.5 text-sm font-medium transition dark:bg-zinc-800"
        >
          הגדר תקציב
        </button>
      </div>
    )
  }

  const { bar, text } = tone(status)
  const pct = Math.round(status.usedRatio * 100)

  return (
    <div className="card">
      <div className="flex items-baseline justify-between">
        <h2 className="text-base font-semibold">תקציב {formatMonth(currentMonthKey())}</h2>
        <span className="text-xs text-ink-soft dark:text-zinc-500">{pct}% נוצלו</span>
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className={`text-[34px] font-bold leading-none tabular-nums ${text}`}>
          {formatMoney(status.remaining)}
        </span>
        <span className="text-sm text-ink-soft dark:text-zinc-400">
          מתוך {formatMoney(status.allowance)}
        </span>
      </div>

      <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        <div
          className={`h-full rounded-full transition-all duration-500 ${bar}`}
          style={{ width: `${Math.max(status.usedRatio * 100, status.spent > 0 ? 3 : 0)}%` }}
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-soft dark:text-zinc-500">
        <span>בוזבז {formatMoney(status.spent)}</span>
        {status.carriedIn > 0 && <span>כולל {formatMoney(status.carriedIn)} שעברו מהחודש הקודם</span>}
        {status.overBudget && (
          <span className="font-medium text-loss">חרגת ב-{formatMoney(Math.abs(status.remaining))}</span>
        )}
      </div>
    </div>
  )
}
