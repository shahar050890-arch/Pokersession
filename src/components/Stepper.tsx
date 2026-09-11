import { useI18n } from '../context/I18nContext'

interface Props {
  value: number
  onChange: (next: number) => void
  min?: number
  max?: number
  label: string
  hint?: string
}

/** Plus/minus counter — no typing, no keyboard, large targets. */
export default function Stepper({ value, onChange, min = 0, max = 99, label, hint }: Props) {
  const { t } = useI18n()
  const btn =
    'flex h-11 w-11 items-center justify-center rounded-full border border-line bg-card text-ink ' +
    'transition active:scale-90 disabled:opacity-30 dark:border-night-line dark:bg-night-card dark:text-zinc-100'

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0 flex-1">
        <p className="text-[17px] font-medium">{label}</p>
        {hint && <p className="mt-0.5 text-[13px] leading-snug text-ink-soft dark:text-zinc-500">{hint}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <button type="button" className={btn} onClick={() => onChange(value - 1)} disabled={value <= min} aria-label={t.a11y.decrease}>
          <svg viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="h-5 w-5" strokeLinecap="round">
            <path d="M5 12h14" />
          </svg>
        </button>
        <span className="num w-7 text-center text-[22px] font-bold">{value}</span>
        <button type="button" className={btn} onClick={() => onChange(value + 1)} disabled={value >= max} aria-label={t.a11y.increase}>
          <svg viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="h-5 w-5" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>
    </div>
  )
}
