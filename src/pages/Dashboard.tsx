import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useData } from '../context/DataContext'
import { budgetStatus } from '../lib/budget'
import { currentMonthKey, formatMoney, formatShortDate, formatSigned, monthKey } from '../lib/format'
import type { PokerSession } from '../lib/types'
import BudgetCard from '../components/BudgetCard'
import StatRow from '../components/StatRow'
import { ChartEmpty, CumulativeChart, PerSessionChart, type ChartPoint } from '../components/Charts'
import { CardFan, ChipStack, Felt, NeonSign, RecentHand, SuitRule } from '../components/decor'
import { EmptyState, ErrorNote, Spinner, moneyClass } from '../components/ui'
import { useI18n } from '../context/I18nContext'

type Range = 'month' | 'quarter' | 'year' | 'all'

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
  const { t } = useI18n()
  const { sessions, settings, loading, error } = useData()
  const RANGES: Array<[Range, string]> = [
    ['month', t.dash.rangeMonth],
    ['quarter', t.dash.rangeQuarter],
    ['year', t.dash.rangeYear],
    ['all', t.dash.rangeAll],
  ]
  const navigate = useNavigate()
  const [range, setRange] = useState<Range>('all')

  const status = useMemo(() => budgetStatus(sessions, settings), [sessions, settings])

  const stats = useMemo(() => {
    const month = currentMonthKey()
    const totalProfit = sessions.reduce((sum, s) => sum + s.profit, 0)
    const monthProfit = sessions
      .filter((s) => monthKey(s.date) === month)
      .reduce((sum, s) => sum + s.profit, 0)
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

  if (loading) return <Spinner />

  if (sessions.length === 0) {
    return (
      <div>
        <EmptyState
          art={<CardFan className="h-24 w-32" />}
          title={t.dash.emptyTitle}
          body={t.dash.emptyBody}
          action={
            <Link to="/add" className="tube block">
              <span>{t.dash.emptyCta}</span>
            </Link>
          }
        />
        <p className="mt-2 text-center text-[14px] text-ink-faint">
          {t.dash.emptyOr}{' '}
          <Link to="/settings" className="font-medium text-jade underline underline-offset-4">
            {t.dash.emptySettings}
          </Link>{' '}
          {t.dash.emptyFirst}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* One figure leads the screen, sitting on the table it came from. */}
      <Felt className="rounded-surface px-[18px] py-[18px]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <NeonSign>after hours</NeonSign>
          </div>
          {/* The night's chips, sitting on the table next to the figure they
              add up to. */}
          <ChipStack className="-mt-1 h-[58px] w-[50px] shrink-0" />
        </div>
        <p className="mt-1 text-[12px] text-white/[0.52]">{t.dash.totalProfit}</p>
        <p
          className="num mt-0.5 text-hero text-white"
          style={{ textShadow: '0 0 12px #0FBFA088, 0 0 34px #0FBFA044' }}
        >
          {formatSigned(stats.totalProfit)}
        </p>
        <p className="mt-1 text-[13px] text-white/[0.63]">
          {t.dash.summaryLine(stats.count, formatMoney(stats.totalIn))}
        </p>
        <RecentHand
          sessions={sessions.slice(0, 3).map((s) => ({
            id: s.id,
            profit: s.profit,
            gameType: s.game_type,
          }))}
          format={formatSigned}
        />
      </Felt>

      {error && <ErrorNote>{error}</ErrorNote>}

      <BudgetCard status={status} onConfigure={() => navigate('/settings')} />

      <StatRow
        stats={[
          { label: t.dash.thisMonth, value: formatSigned(stats.monthProfit), tone: moneyClass(stats.monthProfit) },
          { label: t.dash.avgPerSession, value: formatSigned(stats.average), tone: moneyClass(stats.average) },
          { label: t.dash.winRate, value: `${stats.winRate}%` },
        ]}
      />

      <SuitRule className="pt-2" />

      <div className="rail pt-1">
        {RANGES.map(([value, label]) => (
          <button
            key={value}
            onClick={() => setRange(value)}
            className="chip-pill" data-on={range === value}
          >
            {label}
          </button>
        ))}
      </div>

      <section className="surface px-4 py-4">
        <div className="mb-2 flex items-baseline justify-between px-1">
          <h2 className="text-[15px] font-semibold">{t.dash.cumulative}</h2>
          {cumulative.length > 0 && (
            <span className={`num text-[15px] font-semibold ${moneyClass(cumulative[cumulative.length - 1].value)}`}>
              {formatSigned(cumulative[cumulative.length - 1].value)}
            </span>
          )}
        </div>
        {cumulative.length > 0 ? <CumulativeChart data={cumulative} /> : <ChartEmpty>{t.dash.noneInRange}</ChartEmpty>}
      </section>

      <section className="surface px-4 py-4">
        <h2 className="mb-2 px-1 text-[15px] font-semibold">{t.dash.perSession}</h2>
        {perSession.length > 0 ? <PerSessionChart data={perSession} /> : <ChartEmpty>{t.dash.noneInRange}</ChartEmpty>}
      </section>
    </div>
  )
}
