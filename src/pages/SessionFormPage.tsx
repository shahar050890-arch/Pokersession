import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useData } from '../context/DataContext'
import { budgetStatus } from '../lib/budget'
import { formatMoney, formatSigned, monthKey, shiftDays, todayIso } from '../lib/format'
import type { GameType, SessionInput } from '../lib/types'
import Keypad from '../components/Keypad'
import Stepper from '../components/Stepper'
import { ErrorNote, Spinner, moneyClass } from '../components/ui'

type Slot = 'in' | 'out'

/** Quick top-ups sized to common Israeli buy-ins. */
const BUMPS = [100, 200, 500]

export default function SessionFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
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
    setHydrated(true)
  }, [id, editing, hydrated, locations])

  const buyInNum = Number(buyIn || 0)
  const cashOutNum = Number(cashOut || 0)
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
        <p className="text-ink-soft dark:text-zinc-400">הסשן לא נמצא.</p>
        <button className="btn mt-6" onClick={() => navigate('/sessions')}>
          חזרה לרשימה
        </button>
      </div>
    )
  }

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
    if (buyIn === '' || buyInNum <= 0) return 'צריך למלא כמה נכנסת'
    if (cashOut === '') return 'צריך למלא כמה יצאת — 0 אם יצאת בלי כלום'
    if (duration.trim() !== '' && Number(duration) < 0) return 'משך הזמן לא יכול להיות שלילי'
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
    }

    try {
      if (id) await updateSession(id, payload)
      else await addSession(payload)
      navigate('/sessions')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'השמירה נכשלה')
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
      setWarning(`הסשן הזה יוציא אותך מהתקציב החודשי ב-${formatMoney(overBudgetBy)}.`)
      return
    }
    void save()
  }

  const dateChips: Array<[string, string]> = [
    [todayIso(), 'היום'],
    [shiftDays(todayIso(), -1), 'אתמול'],
    [shiftDays(todayIso(), -2), 'שלשום'],
  ]

  return (
    <div className="pb-4">
      <header className="mb-5 flex items-center justify-between">
        <h1 className="text-[26px] font-bold tracking-tight">{id ? 'עריכת סשן' : 'סשן חדש'}</h1>
        <div className="flex rounded-full border border-line p-0.5 dark:border-night-line">
          {(
            [
              ['cash', 'קאש'],
              ['tournament', 'טורניר'],
            ] as const
          ).map(([v, l]) => (
            <button
              key={v}
              type="button"
              onClick={() => setGameType(v)}
              className={`rounded-full px-4 py-1.5 text-[14px] font-medium transition ${
                gameType === v
                  ? 'bg-ink text-white dark:bg-white dark:text-night-bg'
                  : 'text-ink-soft dark:text-zinc-400'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </header>

      {/* The two figures that matter. Tap one to aim the keypad at it. */}
      <div className="surface overflow-hidden">
        {(
          [
            ['in', 'כמה נכנסת', buyIn],
            ['out', 'כמה יצאת', cashOut],
          ] as const
        ).map(([key, label, value], i) => {
          const on = slot === key
          return (
            <button
              key={key}
              type="button"
              onClick={() => setSlot(key)}
              className={`flex w-full items-baseline justify-between px-5 py-4 text-right transition ${
                i === 1 ? 'border-t hairline' : ''
              } ${on ? 'bg-line/40 dark:bg-night-line/40' : ''}`}
            >
              <span className={`text-[15px] ${on ? 'font-semibold' : 'text-ink-soft dark:text-zinc-400'}`}>
                {label}
              </span>
              <span className="flex items-baseline gap-1">
                <span className={`num text-[30px] font-bold ${value === '' ? 'text-ink-faint' : ''}`}>
                  {value === '' ? '0' : Number(value).toLocaleString('he-IL')}
                </span>
                <span className="text-[17px] text-ink-soft dark:text-zinc-500">₪</span>
              </span>
            </button>
          )
        })}
      </div>

      {/* Live result — the whole reason for logging the session. */}
      {started && (
        <div className="mt-3 flex items-baseline justify-between px-2">
          <span className="label">
            {entries > 1 ? `סך כניסות ${formatMoney(totalIn)}` : 'רווח / הפסד'}
          </span>
          <span className={`num text-[26px] font-bold ${moneyClass(profit)}`}>{formatSigned(profit)}</span>
        </div>
      )}

      <div className="rail mt-4">
        {BUMPS.map((b) => (
          <button key={b} type="button" onClick={() => bump(b)} className="chip num">
            +{b}
          </button>
        ))}
        {active !== '' && (
          <button type="button" onClick={() => setActive('')} className="chip">
            נקה
          </button>
        )}
      </div>

      <div className="mt-4">
        <Keypad
          onDigit={onDigit}
          onBackspace={onBackspace}
          onDone={attemptSave}
          busy={busy}
          doneLabel={id ? 'שמור שינויים' : 'שמור סשן'}
        />
      </div>

      <div className="surface mt-4 divide-y divide-line px-5 dark:divide-night-line">
        <div className="py-4">
          <Stepper
            label="כמה פעמים נכנסת"
            hint={entries > 1 ? `${entries} × ${formatMoney(buyInNum)} = ${formatMoney(totalIn)}` : 'כניסה אחת'}
            value={entries}
            onChange={setEntries}
            min={1}
            max={30}
          />
        </div>

        <div className="py-4">
          <p className="label mb-2.5">מתי</p>
          <div className="rail">
            {dateChips.map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setDate(value)}
                className={`chip ${date === value ? 'chip-on' : ''}`}
              >
                {label}
              </button>
            ))}
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={`chip num min-w-[9.5rem] ${
                dateChips.every(([v]) => v !== date) ? 'chip-on' : ''
              }`}
              aria-label="תאריך אחר"
            />
          </div>
        </div>

        <div className="py-4">
          <p className="label mb-2.5">איפה</p>
          {customLocation ? (
            <input
              autoFocus
              className="field"
              placeholder="שם המקום"
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
                  className={`chip ${location === l ? 'chip-on' : ''}`}
                >
                  {l}
                </button>
              ))}
              <button type="button" onClick={() => setCustomLocation(true)} className="chip">
                {locations.length === 0 ? '+ הוסף מקום' : '+ אחר'}
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
            <span className="label">משך זמן והערות</span>
            <svg
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              className={`h-4 w-4 text-ink-faint transition-transform ${showMore ? 'rotate-90' : '-rotate-90'}`}
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
                placeholder="משך בדקות"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
              <textarea
                rows={3}
                className="field resize-none"
                placeholder="הערות"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          )}
        </div>
      </div>

      {error && <div className="mt-4"><ErrorNote>{error}</ErrorNote></div>}

      {warning && (
        <div className="mt-4 rounded-xl2 border border-flag/40 bg-flag-soft p-4 dark:border-flag-night/30 dark:bg-flag/10">
          <p className="font-semibold text-flag dark:text-flag-night">חריגה מהתקציב</p>
          <p className="mt-1 text-[15px] leading-relaxed text-ink dark:text-zinc-300">{warning}</p>
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={() => void save()}
              disabled={busy}
              className="flex-1 rounded-xl bg-flag py-3 text-[16px] font-semibold text-white transition active:scale-[0.98] disabled:opacity-50"
            >
              {busy ? 'שומר…' : 'שמור בכל זאת'}
            </button>
            <button
              type="button"
              onClick={() => setWarning(null)}
              className="flex-1 rounded-xl border border-line py-3 text-[16px] font-medium text-ink-soft dark:border-night-line dark:text-zinc-300"
            >
              חזור
            </button>
          </div>
        </div>
      )}

      {id && !warning && (
        <button type="button" onClick={() => navigate('/sessions')} className="btn-quiet mt-3">
          ביטול
        </button>
      )}
    </div>
  )
}
