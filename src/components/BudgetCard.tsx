import type { BudgetStatus } from '../lib/budget'
import { currentMonthKey, formatMoney, formatMonth } from '../lib/format'
import { BudgetChip } from './decor'
import { useI18n } from '../context/I18nContext'

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
  const { t } = useI18n()
  if (!status.configured) {
    return (
      <button onClick={onConfigure} className="surface row-press flex w-full items-center gap-4 px-5 py-4 text-start">
        <BudgetChip ratio={0} color="#A1A1AA" size={56} />
        <span>
          <span className="block text-[16px] font-semibold">{t.budget.setUp}</span>
          <span className="mt-1 block text-[14px] leading-relaxed text-ink-soft dark:text-zinc-400">
            {t.budget.setUpBody}
          </span>
        </span>
      </button>
    )
  }

  const { hex, text } = tone(status)

  return (
    <section className="surface flex items-center gap-5 px-5 py-4">
      <BudgetChip ratio={status.usedRatio} color={hex} size={92} caption={t.budget.used} />

      <div className="min-w-0 flex-1">
        <p className="label">{t.budget.remainingIn(formatMonth(currentMonthKey()))}</p>
        <p className={`num mt-0.5 text-big ${text}`}>{formatMoney(status.remaining)}</p>
        <p className="num mt-1 text-[13px] text-ink-faint">
          {t.budget.spentOf(formatMoney(status.spent), formatMoney(status.allowance))}
        </p>
        {(status.carriedIn > 0 || status.overBudget) && (
          <p className="mt-1 text-[13px] text-ink-soft dark:text-zinc-500">
            {status.overBudget
              ? t.budget.over(formatMoney(Math.abs(status.remaining)))
              : t.budget.carried(formatMoney(status.carriedIn))}
          </p>
        )}
      </div>
    </section>
  )
}
