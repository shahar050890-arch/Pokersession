import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useData } from '../context/DataContext'
import { budgetStatus } from '../lib/budget'
import { formatMoney, formatSigned, monthKey, todayIso } from '../lib/format'
import type { GameType, SessionInput } from '../lib/types'
import { ErrorNote, PageTitle, Spinner, profitClass } from '../components/ui'

interface FormState {
  date: string
  game_type: GameType
  location: string
  buy_in_amount: string
  rebuys: string
  cash_out: string
  duration_minutes: string
  notes: string
}

const EMPTY: FormState = {
  date: todayIso(),
  game_type: 'cash',
  location: '',
  buy_in_amount: '',
  rebuys: '0',
  cash_out: '',
  duration_minutes: '',
  notes: '',
}

function toNumber(value: string): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

export default function SessionFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { sessions, settings, locations, loading, addSession, updateSession } = useData()

  const editing = sessions.find((s) => s.id === id)
  const [form, setForm] = useState<FormState>(EMPTY)
  const [hydrated, setHydrated] = useState(!id)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [warning, setWarning] = useState<string | null>(null)

  useEffect(() => {
    if (!id || hydrated || !editing) return
    setForm({
      date: editing.date,
      game_type: editing.game_type,
      location: editing.location,
      buy_in_amount: String(editing.buy_in_amount),
      rebuys: String(editing.rebuys),
      cash_out: String(editing.cash_out),
      duration_minutes: editing.duration_minutes === null ? '' : String(editing.duration_minutes),
      notes: editing.notes ?? '',
    })
    setHydrated(true)
  }, [id, editing, hydrated])

  const buyIn = toNumber(form.buy_in_amount)
  const rebuys = Math.max(0, Math.floor(toNumber(form.rebuys)))
  const cashOut = toNumber(form.cash_out)
  const totalIn = buyIn * (1 + rebuys)
  const profit = cashOut - totalIn

  /**
   * Budget impact of saving this form, excluding the row being edited so an
   * edit is measured against its replacement rather than counted twice.
   */
  const budgetWarning = useMemo(() => {
    if (!settings || settings.monthly_budget <= 0) return null

    const others = sessions.filter((s) => s.id !== id)
    const target = monthKey(form.date)
    const draft = {
      ...(editing ?? {
        id: 'draft',
        user_id: '',
        created_at: new Date().toISOString(),
        duration_minutes: null,
        notes: null,
      }),
      date: form.date,
      game_type: form.game_type,
      location: form.location,
      buy_in_amount: buyIn,
      rebuys,
      cash_out: cashOut,
      total_in: totalIn,
      profit,
    }

    const after = budgetStatus([...others, draft], settings, target)
    if (!after.overBudget) return null
    return `שמירת הסשן תחרוג מהתקציב החודשי ב-${formatMoney(Math.abs(after.remaining))}.`
  }, [sessions, settings, id, editing, form.date, form.game_type, form.location, buyIn, rebuys, cashOut, totalIn, profit])

  if (id && loading && !editing) return <Spinner label="טוען סשן…" />
  if (id && !loading && !editing) {
    return (
      <div>
        <PageTitle title="סשן לא נמצא" />
        <button className="btn-primary" onClick={() => navigate('/sessions')}>
          חזרה לרשימה
        </button>
      </div>
    )
  }

  function validate(): string | null {
    if (!form.date) return 'צריך לבחור תאריך'
    if (form.buy_in_amount.trim() === '') return 'צריך למלא סכום כניסה'
    if (buyIn <= 0) return 'סכום הכניסה חייב להיות גדול מאפס'
    if (rebuys < 0) return 'מספר הכניסות הנוספות לא יכול להיות שלילי'
    if (form.cash_out.trim() === '') return 'צריך למלא סכום יציאה (0 אם יצאת בלי כלום)'
    if (cashOut < 0) return 'סכום היציאה לא יכול להיות שלילי'
    if (form.duration_minutes.trim() !== '' && toNumber(form.duration_minutes) < 0)
      return 'משך הזמן לא יכול להיות שלילי'
    return null
  }

  async function save() {
    setBusy(true)
    setError(null)

    const payload: SessionInput = {
      date: form.date,
      game_type: form.game_type,
      location: form.location.trim(),
      buy_in_amount: buyIn,
      rebuys,
      cash_out: cashOut,
      duration_minutes: form.duration_minutes.trim() === '' ? null : Math.floor(toNumber(form.duration_minutes)),
      notes: form.notes.trim() === '' ? null : form.notes.trim(),
    }

    try {
      if (id) await updateSession(id, payload)
      else await addSession(payload)
      navigate('/sessions')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'השמירה נכשלה')
      setBusy(false)
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    const problem = validate()
    if (problem) {
      setError(problem)
      return
    }
    // Over-budget is a warning, not a block: confirm once, then save anyway.
    if (budgetWarning && !warning) {
      setWarning(budgetWarning)
      return
    }
    void save()
  }

  return (
    <div>
      <PageTitle title={id ? 'עריכת סשן' : 'סשן חדש'} />

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="card space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="field-label" htmlFor="date">תאריך</label>
              <input
                id="date"
                type="date"
                required
                className="field"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
            <div>
              <label className="field-label" htmlFor="duration">משך (דקות)</label>
              <input
                id="duration"
                type="number"
                inputMode="numeric"
                min="0"
                className="field"
                placeholder="אופציונלי"
                value={form.duration_minutes}
                onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })}
              />
            </div>
          </div>

          <div>
            <span className="field-label">סוג משחק</span>
            <div className="flex rounded-xl bg-surface-muted p-1 dark:bg-zinc-800">
              {(
                [
                  ['cash', 'קאש'],
                  ['tournament', 'טורניר'],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setForm({ ...form, game_type: value })}
                  className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition ${
                    form.game_type === value
                      ? 'bg-white text-ink shadow-sm dark:bg-zinc-700 dark:text-white'
                      : 'text-ink-soft dark:text-zinc-400'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="field-label" htmlFor="location">מיקום</label>
            <input
              id="location"
              list="known-locations"
              className="field"
              placeholder="איפה שיחקת?"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
            <datalist id="known-locations">
              {locations.map((l) => (
                <option key={l} value={l} />
              ))}
            </datalist>
          </div>
        </div>

        <div className="card space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="field-label" htmlFor="buyin">סכום כניסה (₪)</label>
              <input
                id="buyin"
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                required
                className="field"
                placeholder="0"
                value={form.buy_in_amount}
                onChange={(e) => setForm({ ...form, buy_in_amount: e.target.value })}
              />
            </div>
            <div>
              <label className="field-label" htmlFor="rebuys">כניסות נוספות</label>
              <input
                id="rebuys"
                type="number"
                inputMode="numeric"
                min="0"
                className="field"
                value={form.rebuys}
                onChange={(e) => setForm({ ...form, rebuys: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="field-label" htmlFor="cashout">סכום יציאה (₪)</label>
            <input
              id="cashout"
              type="number"
              inputMode="decimal"
              min="0"
              step="any"
              required
              className="field"
              placeholder="0"
              value={form.cash_out}
              onChange={(e) => setForm({ ...form, cash_out: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-between rounded-xl bg-surface-muted px-4 py-3 text-sm dark:bg-zinc-800">
            <span className="text-ink-soft dark:text-zinc-400">סך כניסות</span>
            <span className="font-semibold tabular-nums">{formatMoney(totalIn, true)}</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-surface-muted px-4 py-3 text-sm dark:bg-zinc-800">
            <span className="text-ink-soft dark:text-zinc-400">רווח / הפסד</span>
            <span className={`text-lg font-bold tabular-nums ${profitClass(profit)}`}>
              {formatSigned(profit)}
            </span>
          </div>
        </div>

        <div className="card space-y-4">
          <div>
            <label className="field-label" htmlFor="notes">הערות</label>
            <textarea
              id="notes"
              rows={3}
              className="field resize-none"
              placeholder="אופציונלי"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
        </div>

        {error && <ErrorNote>{error}</ErrorNote>}

        {warning && (
          <div className="rounded-xl2 border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/60 dark:bg-amber-950/30">
            <p className="text-sm font-medium text-amber-900 dark:text-amber-200">חריגה מהתקציב</p>
            <p className="mt-1 text-sm leading-relaxed text-amber-800 dark:text-amber-300">{warning}</p>
            <p className="mt-2 text-sm text-amber-800 dark:text-amber-300">לשמור בכל זאת?</p>
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={() => void save()}
                disabled={busy}
                className="flex-1 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-medium text-white transition active:scale-[0.99] disabled:opacity-50"
              >
                {busy ? 'שומר…' : 'כן, שמור'}
              </button>
              <button
                type="button"
                onClick={() => setWarning(null)}
                className="flex-1 rounded-xl border border-amber-300 px-4 py-2.5 text-sm font-medium text-amber-900 transition dark:border-amber-800 dark:text-amber-200"
              >
                ביטול
              </button>
            </div>
          </div>
        )}

        {!warning && (
          <div className="flex gap-3">
            <button type="submit" className="btn-primary" disabled={busy}>
              {busy ? 'שומר…' : id ? 'שמור שינויים' : 'הוסף סשן'}
            </button>
            {id && (
              <button
                type="button"
                onClick={() => navigate('/sessions')}
                className="shrink-0 rounded-xl border border-zinc-200 px-5 py-3 text-base font-medium text-ink-soft dark:border-zinc-700 dark:text-zinc-400"
              >
                ביטול
              </button>
            )}
          </div>
        )}
      </form>
    </div>
  )
}
