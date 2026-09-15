import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useData } from '../context/DataContext'
import { budgetStatus } from '../lib/budget'
import { formatMoney, formatSigned, monthKey, shiftDays, todayIso } from '../lib/format'
import type { EntryCurrency, GameType, SessionInput } from '../lib/types'
import Keypad from '../components/Keypad'
import Stepper from '../components/Stepper'
import { ErrorNote, Spinner, moneyClass } from '../components/ui'
import { ChipButton, SuitRule } from '../components/decor'
import { cachedRate, fetchRate, formatRate, isStale, toIls, type Rate } from '../lib/fx'
import { useI18n } from '../context/I18nContext'
import { useCurrency } from '../context/CurrencyContext'

type Slot = 'in' | 'out'

/** Quick top-ups sized to common Israeli buy-ins. */
const BUMPS_ILS = [25, 100, 500]
const BUMPS_USD = [5, 25, 100]

export default function SessionFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useI18n()
  const { display } = useCurrency()
  const { sessions, settings, locations, loading, addSession, updateSession } = useData()

  const editing = sessions.find((s) => s.id === id)

  const [slot, setSlot] = useState<Slot>('in')
  const [buyIn, setBuyIn] = useState('')
  const [cashOut, setCashOut] = useState('')
  const [entries, setEntries] = useState(1)
  const [gameType, setGameType] = useState<GameType>('cash')
  const [date, setDate] = useState(todayIso())
  const [location, setLocation] = useState('')
  const [customLocation, setCustomLocation] = useState(false)
  const [duration, setDuration] = useState('')
  const [notes, setNotes] = useState('')
  const [showMore, setShowMore] = useState(false)
  const [currency, setCurrency] = useState<EntryCurrency>(display)
  const [rate, setRate] = useState<Rate | null>(() => cachedRate())
  const [rateLoading, setRateLoading] = useState(false)

  const [hydrated, setHydrated] = useState(!id)
  const [error, setError] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  // setBusy only takes effect on the next render, so two taps in the same tick
  // would both get past it. This flips synchronously and is the real guard.
  const submitting = useRef(false)

  useEffect(() => {
    if (!id || hydrated || !editing) return
    setBuyIn(String(editing.buy_in_amount))
    setCashOut(String(editing.cash_out))
    setEntries(editing.rebuys + 1)
    setGameType(editing.game_type)
    setDate(editing.date)
    setLocation(editing.location)
    setCustomLocation(!!editing.location && !locations.includes(editing.location))
    setDuration(editing.duration_minutes === null ? '' : String(editing.duration_minutes))
    setNotes(editing.notes ?? '')
    setShowMore(!!editing.duration_minutes || !!editing.notes)
    if (editing.entry_currency === 'USD' && editing.fx_rate) {
      // Re-enter at the original rate so the figures match what was saved.
      setCurrency('USD')
      setRate({ value: editing.fx_rate, date: editing.date, fetchedAt: Date.now() })
      setBuyIn(String(Math.round((editing.buy_in_amount / editing.fx_rate) * 100) / 100))
      setCashOut(String(Math.round((editing.cash_out / editing.fx_rate) * 100) / 100))
    }
    setHydrated(true)
  }, [id, editing, hydrated, locations])

  useEffect(() => {
    let alive = true
    setRateLoading(true)
    void fetchRate().then((r) => {
      if (!alive) return
      if (r) setRate(r)
      setRateLoading(false)
    })
    return () => {
      alive = false
    }
  }, [])

  // Typed figures are in the selected currency; everything downstream is ILS.
  const rateValue = currency === 'USD' ? (rate?.value ?? null) : 1
  const typedBuyIn = Number(buyIn || 0)
  const typedCashOut = Number(cashOut || 0)
  const buyInNum = rateValue === null ? 0 : toIls(typedBuyIn, rateValue)
  const cashOutNum = rateValue === null ? 0 : toIls(typedCashOut, rateValue)
  const totalIn = buyInNum * entries
  const profit = cashOutNum - totalIn
  const started = buyIn !== '' || cashOut !== ''

  const overBudgetBy = useMemo(() => {
    if (!settings || settings.monthly_budget <= 0 || buyInNum <= 0) return null

    const others = sessions.filter((s) => s.id !== id)
    const draft = {
      id: 'draft',
      user_id: '',
      created_at: new Date().toISOString(),
      date,
      game_type: gameType,
      location,
      buy_in_amount: buyInNum,
      rebuys: entries - 1,
      cash_out: cashOutNum,
      duration_minutes: null,
      notes: null,
      entry_currency: currency,
      fx_rate: currency === 'USD' ? rateValue : null,
      total_in: totalIn,
      profit,
    }
    const after = budgetStatus([...others, draft], settings, monthKey(date))
    return after.overBudget ? Math.abs(after.remaining) : null
  }, [sessions, settings, id, date, gameType, location, buyInNum, cashOutNum, entries, totalIn, profit])

  if (id && loading && !editing) return <Spinner />
  if (id && !loading && !editing) {
    return (
      <div className="pt-10 text-center">
        <p className="text-ink-soft">{t.form.notFound}</p>
        <button className="plaque mt-6" onClick={() => navigate('/sessions')}>
          {t.form.backToList}
        </button>
      </div>
    )
  }

  const symbol = currency === 'USD' ? '$' : '\u20AA'
  const active = slot === 'in' ? buyIn : cashOut
  const setActive = slot === 'in' ? setBuyIn : setCashOut

  function onDigit(d: string) {
    // Cap the length so a stray press can't produce a nonsense figure.
    setActive((prev) => (prev.length >= 7 ? prev : (prev + d).replace(/^0+(?=\d)/, '')))
  }

  function onBackspace() {
    setActive((prev) => prev.slice(0, -1))
  }

  function bump(amount: number) {
    setActive((prev) => String(Number(prev || 0) + amount))
  }

  function validate(): string | null {
    if (currency === 'USD' && rateValue === null)
      return t.form.errNoRate
    if (buyIn === '' || buyInNum <= 0) return t.form.errNoBuyIn
    if (cashOut === '') return t.form.errNoCashOut
    if (duration.trim() !== '' && Number(duration) < 0) return t.form.errNegativeDuration
    return null
  }

  async function save() {
    if (submitting.current) return
    submitting.current = true
    setBusy(true)
    setError(null)

    const payload: SessionInput = {
      date,
      game_type: gameType,
      location: location.trim(),
      buy_in_amount: buyInNum,
      rebuys: entries - 1,
      cash_out: cashOutNum,
      duration_minutes: duration.trim() === '' ? null : Math.floor(Number(duration)),
      notes: notes.trim() === '' ? null : notes.trim(),
      entry_currency: currency,
      fx_rate: currency === 'USD' ? rateValue : null,
    }

    try {
      if (id) await updateSession(id, payload)
      else await addSession(payload)
      navigate('/sessions')
    } catch (e) {
      setError(e instanceof Error ? e.message : t.form.errSaveFailed)
      submitting.current = false
      setBusy(false)
    }
  }

  function attemptSave() {
    const problem = validate()
    if (problem) {
      setError(problem)
      return
    }
    // Going over budget warns once, then saves anyway if confirmed.
    if (overBudgetBy !== null && !warning) {
      setWarning(t.form.overBody(formatMoney(overBudgetBy)))
      return
    }
    void save()
  }

  const dateChips: Array<[string, string]> = [
    [todayIso(), t.form.today],
    [shiftDays(todayIso(), -1), t.form.yesterday],
    [shiftDays(todayIso(), -2), t.form.dayBefore],
  ]

  return (
    <div className="pb-4">
      <header className="mb-4">
        <h1 className="mb-2.5 text-[22px] font-bold tracking-tight">
          {id ? t.form.editTitle : t.form.newTitle}
        </h1>
        {/* Full width rather than a fixed one: "Tournament" is far longer than
            "טורניר", and a pinned width clipped it. */}
        <div className="seg w-full">
          {(
            [
              ['cash', `♠ ${t.form.cash}`],
              ['tournament', `♦ ${t.form.tournament}`],
            ] as const
          ).map(([v, l]) => (
            <button
              key={v}
              type="button"
              onClick={() => setGameType(v)}
              data-on={gameType === v}
            >
              {l}
            </button>
          ))}
        </div>
      </header>

      {/* Currency switch. Dollars are an input convenience only — what gets
          stored is always shekels, at the rate shown here. */}
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="seg w-[104px]">
          {(
            [
              ['ILS', '₪'],
              ['USD', '$'],
            ] as const
          ).map(([v, l]) => (
            <button
              key={v}
              type="button"
              onClick={() => {
                setCurrency(v)
                setBuyIn('')
                setCashOut('')
              }}
              className="num"
              data-on={currency === v}
            >
              {l}
            </button>
          ))}
        </div>

        {currency === 'USD' && (
          <span className="text-[13px] text-ink-soft">
            {rateValue !== null ? (
              <>
                {t.form.rate} <span className="num font-semibold">{formatRate(rateValue)}</span>
                {rate && isStale(rate) && <span className="text-brass"> · {t.form.rateStale}</span>}
              </>
            ) : rateLoading ? (
              t.form.rateLoading
            ) : (
              <span className="text-loss">{t.form.rateNone}</span>
            )}
          </span>
        )}
      </div>

      {/* The two figures that matter. Tap one to aim the keypad at it. */}
      <div>
        {(
          [
            ['in', entries > 1 ? t.form.singleBuyIn : t.form.howMuchIn, buyIn],
            ['out', t.form.howMuchOut, cashOut],
          ] as const
        ).map(([key, label, value], i) => {
          const on = slot === key
          return (
            <button
              key={key}
              type="button"
              onClick={() => setSlot(key)}
              className={`flex w-full items-baseline justify-between rounded-control bg-sunken px-4 py-3.5
                          text-start transition ${i === 1 ? 'mt-2' : ''} ${
                            on ? 'shadow-sunken-on' : 'shadow-sunken'
                          }`}
            >
              <span className={`text-[15px] ${on ? 'font-semibold text-ink' : 'text-ink-soft'}`}>
                {label}
              </span>
              <span className="flex items-baseline gap-1.5">
                <span className={`num text-[28px] font-extrabold ${value === '' ? 'text-ink-dim' : ''}`}>
                  {value === '' ? '0' : Number(value).toLocaleString('he-IL')}
                </span>
                <span className="num text-[16px] text-brass">{symbol}</span>
              </span>
            </button>
          )
        })}
      </div>

      {currency !== display && rateValue !== null && (typedBuyIn > 0 || typedCashOut > 0) && (
        <div
          className="mt-3 flex items-center justify-between rounded-control bg-sunken px-4 py-3.5"
          style={{ boxShadow: 'var(--clay-press)' }}
        >
          <span className="text-[13px] font-medium text-ink-soft">{t.form.willShowAs}</span>
          <span className="num text-[15px] font-semibold">
            {formatMoney(buyInNum)} <span className="text-ink-dim">{t.form.inShort}</span> ·{' '}
            {formatMoney(cashOutNum)} <span className="text-ink-dim">{t.form.outShort}</span>
          </span>
        </div>
      )}

      {/* The multiplier is the easiest thing to get wrong, so it is spelled out
          in full rather than left implied by a small "total" label. */}
      {entries > 1 && buyInNum > 0 && (
        <div
          className="mt-3 flex items-center justify-between rounded-control bg-brass/[0.13] px-4 py-3.5"
          style={{ boxShadow: 'var(--clay-press)' }}
        >
          <span className="text-[13px] font-medium text-ink-soft">{t.form.totalIn}</span>
          <span className="num text-[17px] font-bold">
            {entries} × {formatMoney(buyInNum)} ={' '}
            <span className="text-[20px]">{formatMoney(totalIn)}</span>
          </span>
        </div>
      )}

      {/* Live result — the whole reason for logging the session. */}
      {started && (
        <div className="mt-3 flex items-baseline justify-between px-2">
          <span className="label">{t.form.profitLoss}</span>
          <span className={`num text-[26px] font-bold ${moneyClass(profit)}`}>{formatSigned(profit)}</span>
        </div>
      )}

      <div className="mt-4 flex items-center justify-center gap-4">
        {(currency === 'USD' ? BUMPS_USD : BUMPS_ILS).map((b) => (
          <ChipButton key={b} value={b} label={t.a11y.addChip(b)} onClick={() => bump(b)} />
        ))}
        <button
          type="button"
          onClick={() => setActive('')}
          disabled={active === ''}
          aria-label={t.form.clear}
          className="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-full
                     bg-sunken text-ink-faint transition duration-150 active:translate-y-[1px]
                     disabled:opacity-30"
          style={{ boxShadow: 'var(--clay-press)' }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
            className="h-5 w-5" strokeLinecap="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <SuitRule className="mt-5" />

      <div className="mt-4">
        <Keypad
          onDigit={onDigit}
          onBackspace={onBackspace}
          onDone={attemptSave}
          busy={busy}
          doneLabel={id ? t.form.saveEdit : t.form.save}
        />
      </div>

      <div className="surface mt-3.5 divide-y divide-hair-soft px-4">
        <div className="py-4">
          <Stepper
            label={t.form.timesIn}
            hint={
              entries > 1
                ? t.form.timesHintMany(entries)
                : t.form.timesHintOne
            }
            value={entries}
            onChange={setEntries}
            min={1}
            max={30}
          />
        </div>

        <div className="py-4">
          <p className="label mb-2">{t.form.when}</p>
          <div className="rail">
            {dateChips.map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setDate(value)}
                className="chip-pill" data-on={date === value}
              >
                {label}
              </button>
            ))}
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="chip-pill num min-w-[9.5rem]"
              data-on={dateChips.every(([v]) => v !== date)}
              aria-label={t.form.otherDate}
            />
          </div>
        </div>

        <div className="py-4">
          <p className="label mb-2">{t.form.where}</p>
          {customLocation ? (
            <input
              autoFocus
              className="field"
              placeholder={t.form.placeName}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onBlur={() => {
                if (location.trim() === '') setCustomLocation(false)
              }}
            />
          ) : (
            <div className="rail">
              {locations.map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLocation(location === l ? '' : l)}
                  className="chip-pill" data-on={location === l}
                >
                  {l}
                </button>
              ))}
              <button type="button" onClick={() => setCustomLocation(true)} className="chip-pill">
                {locations.length === 0 ? t.form.addPlace : t.form.otherPlace}
              </button>
            </div>
          )}
        </div>

        <div className="py-1">
          <button
            type="button"
            onClick={() => setShowMore((v) => !v)}
            className="row-press -mx-5 flex w-[calc(100%+2.5rem)] items-center justify-between px-5 py-3.5"
          >
            <span className="label">{t.form.more}</span>
            <svg
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              className={`h-4 w-4 text-ink-dim transition-transform ${
                showMore ? 'rotate-90' : '-rotate-90 rtl:rotate-90 rtl:-scale-x-100'
              }`}
              strokeLinecap="round" strokeLinejoin="round"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          {showMore && (
            <div className="space-y-3 pb-4 pt-1">
              <input
                type="number"
                inputMode="numeric"
                min="0"
                className="field"
                placeholder={t.form.minutes}
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
              <textarea
                rows={3}
                className="field resize-none"
                placeholder={t.form.notes}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          )}
        </div>
      </div>

      {error && <div className="mt-4"><ErrorNote>{error}</ErrorNote></div>}

      {warning && (
        <div
          className="mt-4 rounded-control bg-brass/[0.13] p-4"
          style={{ boxShadow: 'var(--clay-press)' }}
        >
          <p className="font-semibold text-brass">{t.form.overTitle}</p>
          <p className="mt-1 text-[15px] leading-relaxed text-ink">{warning}</p>
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={() => void save()}
              disabled={busy}
              className="flex-1 rounded-tube bg-brass py-3 text-[16px] font-semibold text-room transition active:scale-[0.98] disabled:opacity-50"
            >
              {busy ? t.form.saving : t.form.overSave}
            </button>
            <button
              type="button"
              onClick={() => setWarning(null)}
              className="plaque flex-1"
            >
              {t.form.overBack}
            </button>
          </div>
        </div>
      )}

      {id && !warning && (
        <button type="button" onClick={() => navigate('/sessions')} className="plaque mt-3">
          {t.form.cancel}
        </button>
      )}
    </div>
  )
}
