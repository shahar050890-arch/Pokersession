import type { BudgetStatus } from '../lib/budget'
import { currentMonthKey, formatMoney, formatMonth } from '../lib/format'
import { BudgetChip } from './decor'

interface Props {
  status: BudgetStatus
  onConfigure: () => void
}

/** Green with headroom, amber under 20% left, red once overdrawn. */
function tone(s: BudgetStatus) {
  if (s.overBudget) return { hex: '#DC4B45', text: 'text-down dark:text-down-night' }
  if (s.usedRatio > 0.8) return { hex: '#D98A2B', text: 'text-flag dark:text-flag-night' }
  return { hex: '#0E9F6E', text: 'text-up dark:text-up-night' }
}

export default function BudgetCard({ status, onConfigure }: Props) {
  if (!status.configured) {
    return (
      <button onClick={onConfigure} className="surface row-press flex w-full items-center gap-4 px-5 py-4 text-right">
        <BudgetChip ratio={0} color="#A1A1AA" size={56} />
        <span>
          <span className="block text-[16px] font-semibold">הגדר תקציב חודשי</span>
          <span className="mt-1 block text-[14px] leading-relaxed text-ink-soft dark:text-zinc-400">
            כדי לראות כמה נשאר לך לשחק החודש.
          </span>
        </span>
      </button>
    )
  }

  const { hex, text } = tone(status)

  return (
    <section className="surface flex items-center gap-5 px-5 py-4">
      <BudgetChip ratio={status.usedRatio} color={hex} size={92} />

      <div className="min-w-0 flex-1">
        <p className="label">נשאר ב{formatMonth(currentMonthKey())}</p>
        <p className={`num mt-0.5 text-big ${text}`}>{formatMoney(status.remaining)}</p>
        <p className="num mt-1 text-[13px] text-ink-faint">
          {formatMoney(status.spent)} מתוך {formatMoney(status.allowance)}
        </p>
        {(status.carriedIn > 0 || status.overBudget) && (
          <p className="mt-1 text-[13px] text-ink-soft dark:text-zinc-500">
            {status.overBudget
              ? `חרגת ב-${formatMoney(Math.abs(status.remaining))}`
              : `+${formatMoney(status.carriedIn)} מהחודש הקודם`}
          </p>
        )}
      </div>
    </section>
  )
}
