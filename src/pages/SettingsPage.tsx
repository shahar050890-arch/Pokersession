import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { useTheme } from '../context/ThemeContext'
import type { BudgetMode } from '../lib/types'
import { ErrorNote, PageTitle, Spinner } from '../components/ui'

const MODE_COPY: Record<BudgetMode, { label: string; blurb: string }> = {
  fixed: {
    label: 'תקציב קבוע',
    blurb:
      'סכום קבוע לכל חודש. כל כניסה למשחק מקטינה אותו, ורווחים לא מחזירים כלום. מתאים אם אתה רוצה תקרה קשיחה לכמה כסף נכנס לשולחן.',
  },
  replenish: {
    label: 'תקציב מתחדש',
    blurb:
      'רווחים חוזרים לתקציב ומשלימים את מה שבוזבז, כך שבפועל רק ההפסד הנקי מקטין אותו. התקציב הזמין אף פעם לא עולה מעל הסכום החודשי.',
  },
}

export default function SettingsPage() {
  const { user, signOut } = useAuth()
  const { settings, loading, saveSettings } = useData()
  const { theme, setTheme } = useTheme()

  const [budget, setBudget] = useState('')
  const [mode, setMode] = useState<BudgetMode>('fixed')
  const [rollover, setRollover] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (loading || hydrated) return
    setBudget(settings && settings.monthly_budget > 0 ? String(settings.monthly_budget) : '')
    setMode(settings?.mode ?? 'fixed')
    setRollover(settings?.rollover ?? false)
    setHydrated(true)
  }, [settings, loading, hydrated])

  if (loading && !hydrated) return <Spinner label="טוען הגדרות…" />

  async function onSave() {
    const value = Number(budget)
    if (budget.trim() !== '' && (!Number.isFinite(value) || value < 0)) {
      setError('התקציב חייב להיות מספר חיובי')
      return
    }

    setBusy(true)
    setError(null)
    setSaved(false)
    try {
      await saveSettings({ monthly_budget: budget.trim() === '' ? 0 : value, mode, rollover })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'השמירה נכשלה')
    }
    setBusy(false)
  }

  return (
    <div>
      <PageTitle title="הגדרות" />

      <div className="space-y-4">
        <section className="card space-y-5">
          <h2 className="text-base font-semibold">תקציב חודשי</h2>

          <div>
            <label className="field-label" htmlFor="budget">סכום לחודש (₪)</label>
            <input
              id="budget"
              type="number"
              inputMode="decimal"
              min="0"
              step="any"
              className="field"
              placeholder="למשל 1000"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
            />
            <p className="mt-1.5 text-xs text-ink-soft dark:text-zinc-500">
              השאר ריק כדי לכבות את מעקב התקציב.
            </p>
          </div>

          <div>
            <span className="field-label">מצב חישוב</span>
            <div className="space-y-2.5">
              {(Object.keys(MODE_COPY) as BudgetMode[]).map((m) => {
                const active = mode === m
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className={`w-full rounded-xl border p-4 text-right transition ${
                      active
                        ? 'border-ink bg-surface-muted dark:border-white dark:bg-zinc-800'
                        : 'border-zinc-200 dark:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                          active ? 'border-ink dark:border-white' : 'border-zinc-300 dark:border-zinc-600'
                        }`}
                      >
                        {active && <span className="h-2.5 w-2.5 rounded-full bg-ink dark:bg-white" />}
                      </span>
                      <span className="font-medium">{MODE_COPY[m].label}</span>
                    </div>
                    <p className="mt-2 pr-[30px] text-sm leading-relaxed text-ink-soft dark:text-zinc-400">
                      {MODE_COPY[m].blurb}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>

          <label className="flex cursor-pointer items-center justify-between gap-4">
            <span>
              <span className="block font-medium">העברת יתרה לחודש הבא</span>
              <span className="mt-1 block text-sm leading-relaxed text-ink-soft dark:text-zinc-400">
                יתרה חיובית שלא נוצלה מתווספת לתקציב של החודש הבא.
              </span>
            </span>
            <span className="relative shrink-0">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={rollover}
                onChange={(e) => setRollover(e.target.checked)}
              />
              <span className="block h-7 w-12 rounded-full bg-zinc-200 transition peer-checked:bg-profit dark:bg-zinc-700" />
              <span className="pointer-events-none absolute right-0.5 top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform peer-checked:-translate-x-5" />
            </span>
          </label>

          {error && <ErrorNote>{error}</ErrorNote>}

          <button onClick={() => void onSave()} className="btn-primary" disabled={busy}>
            {busy ? 'שומר…' : saved ? 'נשמר ✓' : 'שמור הגדרות'}
          </button>
        </section>

        <section className="card space-y-4">
          <h2 className="text-base font-semibold">מראה</h2>
          <div className="flex rounded-xl bg-surface-muted p-1 dark:bg-zinc-800">
            {(
              [
                ['light', 'בהיר'],
                ['dark', 'כהה'],
                ['system', 'מערכת'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setTheme(value)}
                className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
                  theme === value
                    ? 'bg-white text-ink shadow-sm dark:bg-zinc-700 dark:text-white'
                    : 'text-ink-soft dark:text-zinc-400'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        <section className="card space-y-4">
          <h2 className="text-base font-semibold">חשבון</h2>
          <p className="text-sm text-ink-soft dark:text-zinc-400" dir="ltr" style={{ textAlign: 'right' }}>
            {user?.email}
          </p>
          <button
            onClick={() => void signOut()}
            className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-base font-medium text-loss transition dark:border-zinc-700"
          >
            התנתקות
          </button>
        </section>
      </div>
    </div>
  )
}
