import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useData } from '../context/DataContext'
import { formatDuration, formatMoney, formatSigned, monthKey, formatMonth, relativeDate } from '../lib/format'
import type { GameType, PokerSession } from '../lib/types'
import { PencilIcon, TrashIcon } from '../components/icons'
import { SuitMark } from '../components/decor'
import { EmptyState, ErrorNote, Spinner, moneyClass } from '../components/ui'

const GAME_LABEL: Record<GameType, string> = { cash: 'קאש', tournament: 'טורניר' }

export default function SessionsPage() {
  const { sessions, loading, error, locations, deleteSession } = useData()
  const navigate = useNavigate()
  const [gameFilter, setGameFilter] = useState<GameType | 'all'>('all')
  const [locationFilter, setLocationFilter] = useState<string>('all')
  const [openId, setOpenId] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const filtered = useMemo(
    () =>
      sessions.filter(
        (s) =>
          (gameFilter === 'all' || s.game_type === gameFilter) &&
          (locationFilter === 'all' || s.location === locationFilter),
      ),
    [sessions, gameFilter, locationFilter],
  )

  // Grouped by month so a long history stays scannable.
  const months = useMemo(() => {
    const buckets = new Map<string, PokerSession[]>()
    for (const s of filtered) {
      const key = monthKey(s.date)
      const list = buckets.get(key) ?? []
      list.push(s)
      buckets.set(key, list)
    }
    return [...buckets.entries()]
  }, [filtered])

  if (loading) return <Spinner />

  if (sessions.length === 0) {
    return (
      <EmptyState
        title="אין עדיין סשנים"
        body="ברגע שתרשום סשן ראשון הוא יופיע כאן."
        action={
          <Link to="/add" className="btn block text-center">
            רשום סשן ראשון
          </Link>
        }
      />
    )
  }

  async function confirmDelete(id: string) {
    setDeleteError(null)
    try {
      await deleteSession(id)
      setPendingDelete(null)
      setOpenId(null)
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : 'המחיקה נכשלה')
    }
  }

  const hasFilter = gameFilter !== 'all' || locationFilter !== 'all'

  return (
    <div>
      <h1 className="mb-4 pt-2 text-[26px] font-bold tracking-tight">סשנים</h1>

      <div className="rail mb-4">
        <button
          onClick={() => {
            setGameFilter('all')
            setLocationFilter('all')
          }}
          className={`chip ${hasFilter ? '' : 'chip-on'}`}
        >
          הכול
        </button>
        {(['cash', 'tournament'] as const).map((g) => (
          <button
            key={g}
            onClick={() => setGameFilter(gameFilter === g ? 'all' : g)}
            className={`chip ${gameFilter === g ? 'chip-on' : ''}`}
          >
            {GAME_LABEL[g]}
          </button>
        ))}
        {locations.map((l) => (
          <button
            key={l}
            onClick={() => setLocationFilter(locationFilter === l ? 'all' : l)}
            className={`chip ${locationFilter === l ? 'chip-on' : ''}`}
          >
            {l}
          </button>
        ))}
      </div>

      {error && <ErrorNote>{error}</ErrorNote>}
      {deleteError && <ErrorNote>{deleteError}</ErrorNote>}

      {filtered.length === 0 ? (
        <p className="surface px-5 py-10 text-center text-[15px] text-ink-soft dark:text-zinc-400">
          אין סשנים שמתאימים לסינון.
        </p>
      ) : (
        <div className="space-y-5">
          {months.map(([key, list]) => {
            const monthProfit = list.reduce((sum, s) => sum + s.profit, 0)
            return (
              <section key={key}>
                <div className="mb-2 flex items-baseline justify-between px-1">
                  <h2 className="text-[14px] font-semibold text-ink-soft dark:text-zinc-400">
                    {formatMonth(key)}
                  </h2>
                  <span className={`num text-[14px] font-semibold ${moneyClass(monthProfit)}`}>
                    {formatSigned(monthProfit)}
                  </span>
                </div>

                <div className="surface divide-y divide-line overflow-hidden dark:divide-night-line">
                  {list.map((s) => {
                    const open = openId === s.id
                    return (
                      <div key={s.id}>
                        <button
                          onClick={() => {
                            setOpenId(open ? null : s.id)
                            setPendingDelete(null)
                          }}
                          className="row-press flex w-full items-center justify-between gap-3 px-5 py-3.5 text-right"
                        >
                          <span className="flex min-w-0 items-center gap-3">
                            <SuitMark type={s.game_type} />
                            <span className="min-w-0">
                              <span className="block truncate text-[16px] font-medium">
                                {s.location || GAME_LABEL[s.game_type]}
                              </span>
                              <span className="mt-0.5 block text-[13px] text-ink-soft dark:text-zinc-500">
                                {relativeDate(s.date)}
                                {s.rebuys > 0 ? ` · ${s.rebuys + 1} כניסות` : ''}
                              </span>
                            </span>
                          </span>
                          <span className={`num shrink-0 text-[18px] font-bold ${moneyClass(s.profit)}`}>
                            {formatSigned(s.profit)}
                          </span>
                        </button>

                        {open && (
                          <div className="border-t hairline bg-paper/60 px-5 py-4 dark:bg-night-bg/40">
                            <dl className="space-y-2 text-[14px]">
                              {(
                                [
                                  ['סוג', GAME_LABEL[s.game_type]],
                                  ['סך כניסות', formatMoney(s.total_in)],
                                  ['יציאה', formatMoney(s.cash_out)],
                                  ['משך', formatDuration(s.duration_minutes)],
                                ] as const
                              ).map(([k, v]) => (
                                <div key={k} className="flex justify-between">
                                  <dt className="text-ink-soft dark:text-zinc-500">{k}</dt>
                                  <dd className="num font-medium">{v}</dd>
                                </div>
                              ))}
                            </dl>

                            {s.notes && (
                              <p className="mt-3 rounded-xl bg-card px-3.5 py-2.5 text-[14px] leading-relaxed text-ink-soft dark:bg-night-card dark:text-zinc-400">
                                {s.notes}
                              </p>
                            )}

                            {pendingDelete === s.id ? (
                              <div className="mt-4 flex gap-2">
                                <button
                                  onClick={() => void confirmDelete(s.id)}
                                  className="flex-1 rounded-xl bg-down py-2.5 text-[15px] font-semibold text-white"
                                >
                                  כן, מחק
                                </button>
                                <button
                                  onClick={() => setPendingDelete(null)}
                                  className="flex-1 rounded-xl border border-line py-2.5 text-[15px] font-medium text-ink-soft dark:border-night-line dark:text-zinc-300"
                                >
                                  ביטול
                                </button>
                              </div>
                            ) : (
                              <div className="mt-4 flex gap-2">
                                <button
                                  onClick={() => navigate(`/sessions/${s.id}/edit`)}
                                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-line py-2.5 text-[15px] font-medium dark:border-night-line"
                                >
                                  <PencilIcon />
                                  ערוך
                                </button>
                                <button
                                  onClick={() => setPendingDelete(s.id)}
                                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-line py-2.5 text-[15px] font-medium text-down dark:border-night-line dark:text-down-night"
                                >
                                  <TrashIcon />
                                  מחק
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
