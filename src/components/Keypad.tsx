import { useI18n } from '../context/I18nContext'

interface Props {
  onDigit: (d: string) => void
  onBackspace: () => void
  onDone: () => void
  doneLabel: string
  /** Locks the action and says so, so a slow save isn't tapped twice. */
  busy?: boolean
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0']

/**
 * An in-page number pad. The phone keyboard covers half a small screen and
 * offers tiny targets for what is only ever a handful of digits, so amounts are
 * typed here instead — every key is a full-height tap target.
 */
export default function Keypad({ onDigit, onBackspace, onDone, doneLabel, busy = false }: Props) {
  const { t } = useI18n()
  return (
    /* Forced LTR: a number pad is muscle memory — 1 belongs top-left even in RTL. */
    <div dir="ltr" className="grid grid-cols-3 gap-2">
      {KEYS.map((k) => (
        <button
          key={k}
          type="button"
          onClick={() => onDigit(k)}
          className="rounded-xl2 bg-card py-4 text-[26px] font-semibold text-ink shadow-soft transition
                     active:scale-95 active:bg-line dark:bg-night-card dark:text-zinc-100
                     dark:shadow-none dark:active:bg-night-line num"
        >
          {k}
        </button>
      ))}

      <button
        type="button"
        onClick={onBackspace}
        aria-label={t.a11y.deleteDigit}
        className="flex items-center justify-center rounded-xl2 bg-card py-4 text-ink-soft shadow-soft
                   transition active:scale-95 active:bg-line dark:bg-night-card dark:text-zinc-400
                   dark:shadow-none dark:active:bg-night-line"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6"
          strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 5H9l-6 7 6 7h11a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1zM17 9l-5 6M12 9l5 6" />
        </svg>
      </button>

      <button
        type="button"
        onClick={onDone}
        disabled={busy}
        dir="rtl"
        className="col-span-3 mt-1 flex items-center justify-center gap-2 rounded-xl2 bg-ink py-4
                   text-[17px] font-semibold text-white transition active:scale-[0.985]
                   disabled:opacity-60 disabled:active:scale-100 dark:bg-white dark:text-night-bg"
      >
        {busy && (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white dark:border-night-bg/30 dark:border-t-night-bg" />
        )}
        {busy ? t.form.saving : doneLabel}
      </button>
    </div>
  )
}
