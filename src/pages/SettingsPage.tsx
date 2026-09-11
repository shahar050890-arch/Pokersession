import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { useTheme } from '../context/ThemeContext'
import { useI18n } from '../context/I18nContext'
import type { BudgetMode } from '../lib/types'
import type { Lang } from '../lib/i18n'
import { ErrorNote, Spinner } from '../components/ui'
import { ChipFace, FeltHeader, SuitRule } from '../components/decor'

export default function SettingsPage() {
  const { user, signOut } = useAuth()
  const { settings, sessions, loading, saveSettings, resetAllData } = useData()
  const { theme, setTheme } = useTheme()
  const { t, lang, setLang } = useI18n()

  const [budget, setBudget] = useState('')
  const [mode, setMode] = useState<BudgetMode>('fixed')
  const [rollover, setRollover] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const submitting = useRef(false)

  const [confirmReset, setConfirmReset] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [resetDone, setResetDone] = useState(false)
  const [resetError, setResetError] = useState<string | null>(null)
  const wiping = useRef(false)

  useEffect(() => {
    if (loading || hydrated) return
    setBudget(settings && settings.monthly_budget > 0 ? String(settings.monthly_budget) : '')
    setMode(settings?.mode ?? 'fixed')
    setRollover(settings?.rollover ?? false)
    setHydrated(true)
  }, [settings, loading, hydrated])

  if (loading && !hydrated) return <Spinner />

  const MODE_COPY: Record<BudgetMode, { label: string; blurb: string }> = {
    fixed: { label: t.settings.fixed, blurb: t.settings.fixedBlurb },
    replenish: { label: t.settings.replenish, blurb: t.settings.replenishBlurb },
  }

  async function onSave() {
    if (submitting.current) return
    const value = Number(budget)
    if (budget.trim() !== '' && (!Number.isFinite(value) || value < 0)) {
      setError(t.settings.errBudget)
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
      setError(e instanceof Error ? e.message : t.settings.errSaveFailed)
    }
    submitting.current = false
    setBusy(false)
  }

  async function onReset() {
    if (wiping.current) return
    wiping.current = true
    setResetting(true)
    setResetError(null)
    try {
      await resetAllData()
      // The form still holds the old figures; clear it to match the data.
      setBudget('')
      setMode('fixed')
      setRollover(false)
      setConfirmReset(false)
      setResetDone(true)
      setTimeout(() => setResetDone(false), 3000)
    } catch (e) {
      setResetError(e instanceof Error ? e.message : t.settings.errResetFailed)
    }
    wiping.current = false
    setResetting(false)
  }

  const nothingToDelete = sessions.length === 0 && !settings

  return (
    <div>
      <FeltHeader title={t.settings.title} />

      <div className="space-y-4">
        <section className="surface px-5 py-5">
          <div className="mb-3 flex items-center gap-3">
            <ChipFace value={500} size={34} />
            <h2 className="text-[15px] font-semibold">{t.settings.monthlyBudget}</h2>
          </div>

          <div className="relative">
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="any"
              className="field num pe-10 text-[24px] font-bold"
              placeholder={t.settings.budgetPlaceholder}
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              aria-label={t.settings.budgetAria}
            />
            <span className="pointer-events-none absolute end-4 top-1/2 -translate-y-1/2 text-[18px] text-ink-faint">
              ₪
            </span>
          </div>
          <p className="mt-2 text-[13px] text-ink-soft dark:text-zinc-500">{t.settings.budgetHint}</p>

          <SuitRule className="my-5" />

          <div className="space-y-2.5">
            {(Object.keys(MODE_COPY) as BudgetMode[]).map((m) => {
              const on = mode === m
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`w-full rounded-xl2 border p-4 text-start transition ${
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
                  <span className="mt-2 block ps-[29px] text-[14px] leading-relaxed text-ink-soft dark:text-zinc-400">
                    {MODE_COPY[m].blurb}
                  </span>
                </button>
              )
            })}
          </div>

          <label className="mt-5 flex cursor-pointer items-center justify-between gap-4">
            <span>
              <span className="block text-[16px] font-medium">{t.settings.rollover}</span>
              <span className="mt-0.5 block text-[14px] leading-relaxed text-ink-soft dark:text-zinc-400">
                {t.settings.rolloverBlurb}
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
              {/* Logical offset so the knob starts on the correct side in both
                  reading directions, and travels inward either way. */}
              <span
                className="pointer-events-none absolute start-[2px] top-[2px] h-[27px] w-[27px] rounded-full
                           bg-white shadow transition-transform peer-checked:translate-x-5 rtl:peer-checked:-translate-x-5"
              />
            </span>
          </label>

          {error && (
            <div className="mt-4">
              <ErrorNote>{error}</ErrorNote>
            </div>
          )}

          <button onClick={() => void onSave()} className="btn mt-5" disabled={busy}>
            {busy ? t.settings.saving : saved ? t.settings.saved : t.settings.save}
          </button>
        </section>

        <section className="surface px-5 py-5">
          <h2 className="mb-3 text-[15px] font-semibold">{t.settings.language}</h2>
          <div className="flex gap-2">
            {(
              [
                ['he', 'עברית'],
                ['en', 'English'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setLang(value as Lang)}
                className={`chip flex-1 text-center ${lang === value ? 'chip-on' : ''}`}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        <section className="surface px-5 py-5">
          <h2 className="mb-3 text-[15px] font-semibold">{t.settings.appearance}</h2>
          <div className="flex gap-2">
            {(
              [
                ['light', t.settings.light],
                ['dark', t.settings.dark],
                ['system', t.settings.system],
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
          <h2 className="text-[15px] font-semibold">{t.settings.account}</h2>
          <p className="mt-2 text-[15px] text-ink-soft dark:text-zinc-400" dir="ltr" style={{ textAlign: 'start' }}>
            {user?.email}
          </p>
          <button
            onClick={() => void signOut()}
            className="mt-4 w-full rounded-xl2 border border-line py-3.5 text-[16px] font-medium text-down transition active:scale-[0.985] dark:border-night-line dark:text-down-night"
          >
            {t.settings.signOut}
          </button>
        </section>

        {/* Destructive and permanent, so it confirms with the exact count and
            sits apart from everything else. */}
        <section className="rounded-xl2 border border-down/30 bg-down-soft/40 px-5 py-5 dark:border-down/25 dark:bg-down/[0.06]">
          <h2 className="text-[15px] font-semibold text-down dark:text-down-night">
            {t.settings.danger}
          </h2>

          {resetDone ? (
            <p className="mt-3 text-[15px] text-ink-soft dark:text-zinc-400">{t.settings.resetDone}</p>
          ) : confirmReset ? (
            <div className="mt-3">
              <p className="text-[16px] font-semibold">{t.settings.resetTitle}</p>
              <p className="mt-1.5 text-[14px] leading-relaxed text-ink-soft dark:text-zinc-400">
                {t.settings.resetBody(sessions.length)}
              </p>
              {resetError && (
                <div className="mt-3">
                  <ErrorNote>{resetError}</ErrorNote>
                </div>
              )}
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => void onReset()}
                  disabled={resetting}
                  className="flex-1 rounded-xl bg-down py-3 text-[15px] font-semibold text-white transition active:scale-[0.98] disabled:opacity-50"
                >
                  {resetting ? t.settings.resetting : t.settings.resetConfirm}
                </button>
                <button
                  onClick={() => {
                    setConfirmReset(false)
                    setResetError(null)
                  }}
                  className="flex-1 rounded-xl border border-line bg-card py-3 text-[15px] font-medium text-ink-soft dark:border-night-line dark:bg-night-card dark:text-zinc-300"
                >
                  {t.settings.resetCancel}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setConfirmReset(true)}
              disabled={nothingToDelete}
              className="mt-3 w-full rounded-xl2 border border-down/40 bg-card py-3.5 text-[16px] font-medium
                         text-down transition active:scale-[0.985] disabled:opacity-40
                         dark:border-down/30 dark:bg-night-card dark:text-down-night"
            >
              {nothingToDelete ? t.settings.resetNothing : t.settings.resetCta}
            </button>
          )}
        </section>
      </div>
    </div>
  )
}
