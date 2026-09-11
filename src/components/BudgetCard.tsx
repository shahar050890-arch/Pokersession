import type { BudgetStatus } from '../lib/budget'
import { currentMonthKey, formatMoney, formatMonth } from '../lib/format'
import { BudgetChip } from './decor'
import { useI18n } from '../context/I18nContext'

interface Props {
  status: BudgetStatus
  onConfigure: () => void
}

/** Jade with headroom, brass under 20% left, red once overdrawn. */
function tone(s: BudgetStatus) {
  if (s.overBudget) return { hex: '#FF4D6D', text: 'text-loss' }
  if (s.usedRatio > 0.8) return { hex: '#C9A227', text: 'text-brass' }
  return { hex: '#0FBFA0', text: 'text-jade' }
}

export default function BudgetCard({ status, onConfigure }: Props) {
  const { t } = useI18n()

  if (!status.configured) {
    return (
      <button onClick={onConfigure} className="surface-lit row-press flex w-full items-center gap-4 px-4 py-3.5 text-start">
        <BudgetChip ratio={0} color="#6E6490" size={64} />
        <span>
          <span className="block text-[16px] font-semibold">{t.budget.setUp}</span>
          <span className="mt-1 block text-[13.5px] leading-relaxed text-ink-soft">
            {t.budget.setUpBody}
          </span>
        </span>
      </button>
    )
  }

  const { hex, text } = tone(status)

  return (
    <section className="surface-lit flex items-center gap-3.5 p-3.5">
      <BudgetChip ratio={status.usedRatio} color={hex} size={82} caption={t.budget.used} />
      <div className="min-w-0 flex-1">
        <p className="text-[12px] text-ink-soft">{t.budget.remainingIn(formatMonth(currentMonthKey()))}</p>
        <p className={`num text-[25px] font-extrabold ${text}`}>{formatMoney(status.remaining)}</p>
        <p className="num text-[12px] text-ink-faint">
          {t.budget.spentOf(formatMoney(status.spent), formatMoney(status.allowance))}
        </p>
        {(status.carriedIn > 0 || status.overBudget) && (
          <p className="mt-0.5 text-[12px] text-ink-dim">
            {status.overBudget
              ? t.budget.over(formatMoney(Math.abs(status.remaining)))
              : t.budget.carried(formatMoney(status.carriedIn))}
          </p>
        )}
      </div>
    </section>
  )
}
