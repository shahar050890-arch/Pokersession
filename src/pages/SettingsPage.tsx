import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { useTheme } from '../context/ThemeContext'
import type { BudgetMode } from '../lib/types'
import { ErrorNote, Spinner } from '../components/ui'
import { ChipFace, FeltHeader, SuitRule } from '../components/decor'

const MODE_COPY: Record<BudgetMode, { label: string; blurb: string }> = {
  fixed: {
    label: 'תקציב קבוע',
    blurb: 'כל כניסה למשחק מקטינה את התקציב. רווחים לא מחזירים כלום. תקרה קשיחה לכמה כסף נכנס לשולחן.',
  },
  replenish: {
    label: 'תקציב מתחדש',
    blurb: 'רווחים חוזרים לתקציב, כך שבפועל רק ההפסד הנקי מקטין אותו. אף פעם לא עולה מעל הסכום החודשי.',
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
  const submitting = useRef(false)

  useEffect(() => {
    if (loading || hydrated) return
    setBudget(settings && settings.monthly_budget > 0 ? String(settings.monthly_budget) : '')
    setMode(settings?.mode ?? 'fixed')
    setRollover(settings?.rollover ?? false)
    setHydrated(true)
  }, [settings, loading, hydrated])

  if (loading && !hydrated) return <Spinner />

  async function onSave() {
    if (submitting.current) return
    const value = Number(budget)
    if (budget.trim() !== '' && (!Number.isFinite(value) || value < 0)) {
      setError('התקציב חייב להיות מספר חיובי')
      return
    }
    submitting.current = true
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
    submitting.current = false
    setBusy(false)
  }

  return (
    <div>
      <FeltHeader title="הגדרות" />

      <div className="space-y-4">
        <section className="surface px-5 py-5">
          <div className="mb-3 flex items-center gap-3">
            <ChipFace value={500} size={34} />
            <h2 className="text-[15px] font-semibold">תקציב חודשי</h2>
          </div>

          <div className="relative">
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="any"
              className="field num pl-10 text-[24px] font-bold"
              placeholder="0"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              aria-label="סכום תקציב חודשי בשקלים"
            />
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[18px] text-ink-faint">
              ₪
            </span>
          </div>
          <p className="mt-2 text-[13px] text-ink-soft dark:text-zinc-500">
            השאר ריק כדי לכבות את מעקב התקציב.
          </p>

          <SuitRule className="my-5" />

          <div className="space-y-2.5">
            {(Object.keys(MODE_COPY) as BudgetMode[]).map((m) => {
              const on = mode === m
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`w-full rounded-xl2 border p-4 text-right transition ${
                    on
                      ? 'border-ink bg-line/40 dark:border-white dark:bg-night-line/50'
                      : 'border-line dark:border-night-line'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <span
                      className={`flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-full border-2 ${
                        on ? 'border-ink dark:border-white' : 'border-ink-faint dark:border-zinc-600'
                      }`}
                    >
                      {on && <span className="h-2.5 w-2.5 rounded-full bg-ink dark:bg-white" />}
                    </span>
                    <span className="text-[16px] font-semibold">{MODE_COPY[m].label}</span>
                  </span>
                  <span className="mt-2 block pr-[29px] text-[14px] leading-relaxed text-ink-soft dark:text-zinc-400">
                    {MODE_COPY[m].blurb}
                  </span>
                </button>
              )
            })}
          </div>

          <label className="mt-5 flex cursor-pointer items-center justify-between gap-4">
            <span>
              <span className="block text-[16px] font-medium">יתרה עוברת לחודש הבא</span>
              <span className="mt-0.5 block text-[14px] leading-relaxed text-ink-soft dark:text-zinc-400">
                מה שלא ניצלת מתווסף לתקציב הבא.
              </span>
            </span>
            <span className="relative shrink-0">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={rollover}
                onChange={(e) => setRollover(e.target.checked)}
              />
              <span className="block h-[31px] w-[51px] rounded-full bg-line transition peer-checked:bg-up dark:bg-night-line" />
              <span className="pointer-events-none absolute right-[2px] top-[2px] h-[27px] w-[27px] rounded-full bg-white shadow transition-transform peer-checked:-translate-x-5" />
            </span>
          </label>

          {error && <div className="mt-4"><ErrorNote>{error}</ErrorNote></div>}

          <button onClick={() => void onSave()} className="btn mt-5" disabled={busy}>
            {busy ? 'שומר…' : saved ? 'נשמר ✓' : 'שמור'}
          </button>
        </section>

        <section className="surface px-5 py-5">
          <h2 className="mb-3 text-[15px] font-semibold">מראה</h2>
          <div className="flex gap-2">
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
                className={`chip flex-1 text-center ${theme === value ? 'chip-on' : ''}`}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        <section className="surface px-5 py-5">
          <h2 className="text-[15px] font-semibold">חשבון</h2>
          <p className="mt-2 text-[15px] text-ink-soft dark:text-zinc-400" dir="ltr" style={{ textAlign: 'right' }}>
            {user?.email}
          </p>
          <button
            onClick={() => void signOut()}
            className="mt-4 w-full rounded-xl2 border border-line py-3.5 text-[16px] font-medium text-down transition active:scale-[0.985] dark:border-night-line dark:text-down-night"
          >
            התנתקות
          </button>
        </section>
      </div>
    </div>
  )
}
