import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { useI18n } from '../context/I18nContext'
import { useCurrency } from '../context/CurrencyContext'
import type { BudgetMode } from '../lib/types'
import type { Lang } from '../lib/i18n'
import { ErrorNote, Spinner } from '../components/ui'
import { fromDisplay, toDisplay } from '../lib/format'
import { ChipFace, FeltHeader, SuitRule } from '../components/decor'

export default function SettingsPage() {
  const { user, signOut } = useAuth()
  const { settings, sessions, loading, saveSettings, resetAllData } = useData()
  const { t, lang, setLang } = useI18n()
  const { display, setDisplay, fellBack } = useCurrency()

  const [budget, setBudget] = useState('')
  const [mode, setMode] = useState<BudgetMode>('fixed')
  const [rollover, setRollover] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const shownIn = useRef(display)
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
    if (loading) return

    // Hydrate once, then re-express the amount whenever the display currency
    // changes — the field holds a figure in whatever currency is on screen.
    const currencyChanged = shownIn.current !== display
    if (hydrated && !currencyChanged) return
    shownIn.current = display

    setBudget(
      settings && settings.monthly_budget > 0
        ? String(Math.round(toDisplay(settings.monthly_budget) * 100) / 100)
        : '',
    )
    if (!hydrated) {
      setMode(settings?.mode ?? 'fixed')
      setRollover(settings?.rollover ?? false)
      setHydrated(true)
    }
  }, [settings, loading, hydrated, display])

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
      // Typed in the display currency; stored in shekels like everything else.
      await saveSettings({
        monthly_budget: budget.trim() === '' ? 0 : Math.round(fromDisplay(value) * 100) / 100,
        mode,
        rollover,
      })
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
              className="field num pe-10 text-[24px] font-extrabold"
              placeholder={t.settings.budgetPlaceholder}
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              aria-label={t.settings.budgetAria}
            />
            <span className="num pointer-events-none absolute end-4 top-1/2 -translate-y-1/2 text-[17px] text-brass">
              {display === 'USD' ? '$' : '₪'}
            </span>
          </div>
          <p className="mt-2 text-[13px] text-ink-faint">{t.settings.budgetHint}</p>

          <SuitRule className="my-5" />

          <div className="space-y-2.5">
            {(Object.keys(MODE_COPY) as BudgetMode[]).map((m) => {
              const on = mode === m
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`w-full rounded-control border p-4 text-start transition ${
                    on ? 'border-jade/50 bg-jade/[0.07]' : 'border-hair-soft'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <span
                      className={`flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-full border-2 ${
                        on ? 'border-jade' : 'border-ink-dim'
                      }`}
                    >
                      {on && <span className="h-2.5 w-2.5 rounded-full bg-jade" />}
                    </span>
                    <span className="text-[16px] font-semibold">{MODE_COPY[m].label}</span>
                  </span>
                  <span className="mt-2 block ps-[29px] text-[14px] leading-relaxed text-ink-soft">
                    {MODE_COPY[m].blurb}
                  </span>
                </button>
              )
            })}
          </div>

          <label className="mt-5 flex cursor-pointer items-center justify-between gap-4">
            <span>
              <span className="block text-[16px] font-medium">{t.settings.rollover}</span>
              <span className="mt-0.5 block text-[14px] leading-relaxed text-ink-soft">
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
              {/* The knob is a dealer button — the one thing on a poker table
                  that slides from seat to seat. */}
              <span className="dealer-track" />
              <span className="dealer-knob">D</span>
            </span>
          </label>

          {error && (
            <div className="mt-4">
              <ErrorNote>{error}</ErrorNote>
            </div>
          )}

          <button onClick={() => void onSave()} className="tube mt-5" disabled={busy}>
            <span>{busy ? t.settings.saving : saved ? t.settings.saved : t.settings.save}</span>
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
                className="chip-pill flex-1 justify-center text-center" data-on={lang === value}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        <section className="surface px-5 py-5">
          <h2 className="mb-3 text-[15px] font-semibold">{t.settings.currency}</h2>
          <div className="flex gap-2">
            {(
              [
                ['ILS', t.settings.shekel],
                ['USD', t.settings.dollar],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setDisplay(value)}
                className="chip-pill num flex-1 justify-center text-center" data-on={display === value}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="mt-3 text-[13px] leading-relaxed text-ink-faint">
            {fellBack ? t.settings.currencyNoRate : t.settings.currencyNote}
          </p>
        </section>

        <section className="surface px-5 py-5">
          <h2 className="text-[15px] font-semibold">{t.settings.account}</h2>
          <p className="mt-2 text-[15px] text-ink-soft" dir="ltr" style={{ textAlign: 'start' }}>
            {user?.email}
          </p>
          <button
            onClick={() => void signOut()}
            className="mt-4 w-full rounded-tube border border-loss/40 py-3.5 text-[16px] font-semibold text-loss transition active:scale-[0.985]"
          >
            {t.settings.signOut}
          </button>
        </section>

        {/* Destructive and permanent, so it confirms with the exact count and
            sits apart from everything else. */}
        <section className="rounded-surface border border-loss/25 bg-loss/[0.05] px-5 py-5">
          <h2 className="text-[15px] font-semibold text-loss">
            {t.settings.danger}
          </h2>

          {resetDone ? (
            <p className="mt-3 text-[15px] text-ink-soft">{t.settings.resetDone}</p>
          ) : confirmReset ? (
            <div className="mt-3">
              <p className="text-[16px] font-semibold">{t.settings.resetTitle}</p>
              <p className="mt-1.5 text-[14px] leading-relaxed text-ink-soft">
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
                  className="flex-1 rounded-tube bg-loss py-3 text-[15px] font-semibold text-room transition active:scale-[0.98] disabled:opacity-50"
                >
                  {resetting ? t.settings.resetting : t.settings.resetConfirm}
                </button>
                <button
                  onClick={() => {
                    setConfirmReset(false)
                    setResetError(null)
                  }}
                  className="plaque flex-1 !py-3"
                >
                  {t.settings.resetCancel}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setConfirmReset(true)}
              disabled={nothingToDelete}
              className="mt-3 w-full rounded-tube border border-loss/40 bg-panel py-3.5 text-[16px]
                         font-semibold text-loss transition active:scale-[0.985] disabled:opacity-40"
            >
              {nothingToDelete ? t.settings.resetNothing : t.settings.resetCta}
            </button>
          )}
        </section>
      </div>
    </div>
  )
}
