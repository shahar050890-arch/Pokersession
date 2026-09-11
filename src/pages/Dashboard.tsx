import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useData } from '../context/DataContext'
import { budgetStatus } from '../lib/budget'
import { currentMonthKey, formatMoney, formatShortDate, formatSigned, monthKey } from '../lib/format'
import type { PokerSession } from '../lib/types'
import BudgetCard from '../components/BudgetCard'
import StatCard from '../components/StatCard'
import { ChartEmpty, CumulativeChart, PerSessionChart, type ChartPoint } from '../components/Charts'
import { EmptyState, ErrorNote, PageTitle, Spinner, profitClass } from '../components/ui'

type Range = 'month' | 'quarter' | 'year' | 'all'

const RANGES: Array<[Range, string]> = [
  ['month', 'החודש'],
  ['quarter', '3 חודשים'],
  ['year', 'השנה'],
  ['all', 'הכול'],
]

/** Inclusive lower bound (ISO date) for a range, or null for "all time". */
function rangeStart(range: Range): string | null {
  if (range === 'all') return null
  const now = new Date()
  const start =
    range === 'month'
      ? new Date(now.getFullYear(), now.getMonth(), 1)
      : range === 'quarter'
        ? new Date(now.getFullYear(), now.getMonth() - 2, 1)
        : new Date(now.getFullYear(), 0, 1)
  const tz = start.getTimezoneOffset() * 60_000
  return new Date(start.getTime() - tz).toISOString().slice(0, 10)
}

export default function Dashboard() {
  const { sessions, settings, loading, error } = useData()
  const navigate = useNavigate()
  const [range, setRange] = useState<Range>('all')

  const status = useMemo(() => budgetStatus(sessions, settings), [sessions, settings])

  const stats = useMemo(() => {
    const month = currentMonthKey()
    const totalProfit = sessions.reduce((sum, s) => sum + s.profit, 0)
    const monthSessions = sessions.filter((s) => monthKey(s.date) === month)
    const monthProfit = monthSessions.reduce((sum, s) => sum + s.profit, 0)
    const totalIn = sessions.reduce((sum, s) => sum + s.total_in, 0)
    const winning = sessions.filter((s) => s.profit > 0).length

    return {
      totalProfit,
      monthProfit,
      count: sessions.length,
      totalIn,
      average: sessions.length > 0 ? totalProfit / sessions.length : 0,
      winRate: sessions.length > 0 ? Math.round((winning / sessions.length) * 100) : 0,
    }
  }, [sessions])

  // Charts read oldest-to-newest; the stored list is newest-first.
  const inRange = useMemo(() => {
    const start = rangeStart(range)
    const chronological = [...sessions].reverse()
    return start ? chronological.filter((s) => s.date >= start) : chronological
  }, [sessions, range])

  const { cumulative, perSession } = useMemo(() => {
    const label = (s: PokerSession) => formatShortDate(s.date)
    let running = 0
    const cum: ChartPoint[] = inRange.map((s) => {
      running += s.profit
      return { date: s.date, label: label(s), value: Math.round(running * 100) / 100 }
    })
    const per: ChartPoint[] = inRange.map((s) => ({
      date: s.date,
      label: label(s),
      value: Math.round(s.profit * 100) / 100,
    }))
    return { cumulative: cum, perSession: per }
  }, [inRange])

  if (loading) return <Spinner label="טוען נתונים…" />

  if (sessions.length === 0) {
    return (
      <div>
        <PageTitle title="מעקב פוקר" />
        <EmptyState
          title="בוא נתחיל"
          body="עקוב אחרי כל סשן — כמה נכנסת, כמה יצאת, וכמה הרווחת. עם הזמן תראה את המגמה שלך על גרף, ותוכל להגדיר תקציב חודשי שישמור עליך."
          action={
            <Link to="/add" className="btn-primary block text-center">
              הוסף סשן ראשון
            </Link>
          }
        />
        <p className="mt-4 text-center text-sm text-ink-soft dark:text-zinc-500">
          אפשר גם{' '}
          <Link to="/settings" className="font-medium text-ink underline dark:text-zinc-300">
            להגדיר תקציב חודשי
          </Link>{' '}
          קודם.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <PageTitle title="דשבורד" />

      {error && <ErrorNote>{error}</ErrorNote>}

      <BudgetCard status={status} onConfigure={() => navigate('/settings')} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard
          label="רווח/הפסד כולל"
          value={formatSigned(stats.totalProfit)}
          tone={profitClass(stats.totalProfit)}
        />
        <StatCard
          label="החודש"
          value={formatSigned(stats.monthProfit)}
          tone={profitClass(stats.monthProfit)}
        />
        <StatCard label="סשנים" value={String(stats.count)} />
        <StatCard label="סך כניסות" value={formatMoney(stats.totalIn)} />
        <StatCard
          label="ממוצע לסשן"
          value={formatSigned(stats.average)}
          tone={profitClass(stats.average)}
        />
        <StatCard label="סשנים רווחיים" value={`${stats.winRate}%`} />
      </div>

      <div className="flex gap-1.5 overflow-x-auto rounded-xl bg-surface-muted p-1 dark:bg-zinc-800">
        {RANGES.map(([value, label]) => (
          <button
            key={value}
            onClick={() => setRange(value)}
            className={`flex-1 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition ${
              range === value
                ? 'bg-white text-ink shadow-sm dark:bg-zinc-700 dark:text-white'
                : 'text-ink-soft dark:text-zinc-400'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <section className="card">
        <div className="mb-1 flex items-baseline justify-between">
          <h2 className="text-base font-semibold">רווח מצטבר</h2>
          {cumulative.length > 0 && (
            <span className={`text-sm font-bold tabular-nums ${profitClass(cumulative.at(-1)!.value)}`}>
              {formatSigned(cumulative.at(-1)!.value)}
            </span>
          )}
        </div>
        {cumulative.length > 0 ? (
          <CumulativeChart data={cumulative} />
        ) : (
          <ChartEmpty>אין סשנים בטווח הזה</ChartEmpty>
        )}
      </section>

      <section className="card">
        <h2 className="mb-1 text-base font-semibold">לפי סשן</h2>
        {perSession.length > 0 ? (
          <PerSessionChart data={perSession} />
        ) : (
          <ChartEmpty>אין סשנים בטווח הזה</ChartEmpty>
        )}
      </section>
    </div>
  )
}
